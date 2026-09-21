import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Razorpay from 'razorpay';
import { randomUUID } from 'node:crypto';
import { evaluateJagtialServiceArea, isJagtialServiceAreaEnforced } from '../../lib/service-area';
import { getNationwideCourierQuotes, isNationwideCourierReady } from '../../lib/courier-server';
import { evaluateNationwideProfitability } from '../../lib/nationwide-profitability';

export const dynamic = 'force-dynamic';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

type CartItem = { item?: { id?: string | number }; qty?: number };
type ReservationItem = { product_id: string; quantity: number };
type ResumableReservation = {
  reservation_id: string;
  razorpay_order_id: string;
  expected_total_paid: number | string;
  delivery_address: string;
  vendor_id: string;
  pricing_snapshot: Record<string, unknown>;
  reservation_items: Array<{ product_id: string; quantity: number; unit_price: number | string }>;
};

const canonicalizeItems = (items: ReservationItem[]) => {
  const totals = new Map<string, number>();
  items.forEach((item) => totals.set(item.product_id, (totals.get(item.product_id) || 0) + item.quantity));
  return Array.from(totals, ([product_id, quantity]) => ({ product_id, quantity })).sort((a, b) => a.product_id.localeCompare(b.product_id));
};

const sameNumber = (left: unknown, right: number) => Number.isFinite(Number(left)) && Number(left) === right;

type ProviderDiagnostics = {
  providerOrderStatus?: string;
  paymentStatusCategories?: string[];
  paymentCount?: number;
};

const getProviderDiagnostics = (order: any, payments: any[] | null): ProviderDiagnostics => ({
  providerOrderStatus: typeof order?.status === 'string' ? order.status.toUpperCase() : undefined,
  paymentStatusCategories: Array.isArray(payments)
    ? Array.from(new Set(payments.map((payment) => String(payment?.status || 'UNKNOWN').toUpperCase())))
    : undefined,
  paymentCount: Array.isArray(payments) ? payments.length : undefined,
});

const isRetryableProviderOrder = (order: any, payments: any[], expectedAmountPaise: number) => {
  if (!order || Number(order.amount) !== expectedAmountPaise || String(order.currency || '').toUpperCase() !== 'INR') return false;
  if (Number(order.amount_paid) !== 0 || Number(order.amount_due) !== expectedAmountPaise || order.partial_payment === true) return false;
  const orderStatus = String(order.status || '').toLowerCase();
  if (orderStatus === 'created') return payments.length === 0;
  return orderStatus === 'attempted'
    && payments.length > 0
    && payments.every((payment) => String(payment?.status || '').toLowerCase() === 'failed');
};

const saveReservationLocationSnapshot = async (
  serviceClient: any,
  reservationId: string,
  userId: string,
  coordinates: { latitude: number; longitude: number; accuracyMeters: number | null; source: 'DEVICE' | 'MANUAL_PIN' | 'LEGACY' },
) => {
  // Service-role access bypasses RLS, so explicitly re-check ownership before
  // writing the server-side location snapshot.
  const { data: reservation, error: reservationLookupError } = await serviceClient
    .from('inventory_reservations')
    .select('id,user_id')
    .eq('id', reservationId)
    .eq('user_id', userId)
    .maybeSingle();
  if (reservationLookupError || !reservation) return false;
  const { error } = await serviceClient.from('inventory_reservation_location_snapshots').upsert({
    reservation_id: reservationId,
    user_id: userId,
    latitude: coordinates.latitude,
    longitude: coordinates.longitude,
    accuracy_meters: coordinates.accuracyMeters,
    source: coordinates.source,
  }, { onConflict: 'reservation_id' });
  return !error;
};

const checkoutError = (requestId: string, stage: string, code: string, message: string, status: number, error?: unknown, diagnostics?: ProviderDiagnostics) => {
  console.error('[checkout]', {
    requestId,
    stage,
    code,
    httpStatus: status,
    ...diagnostics,
    errorType: error instanceof Error ? error.name : error ? typeof error : undefined,
  });
  return NextResponse.json({ success: false, code, message, requestId }, { status });
};

const reservationErrorResponse = (requestId: string, stage: string, message?: string, error?: unknown) => {
  if (message === 'an active payment checkout already exists') {
    return checkoutError(requestId, stage, 'ACTIVE_PAYMENT_CHECKOUT', 'You already have a payment checkout in progress. Complete it or try again after a few minutes.', 409, error);
  }
  if (message === 'MULTI_VENDOR_CART') {
    return checkoutError(requestId, stage, 'MULTI_VENDOR_CART', "Items from different stores can't be combined in one order yet.", 400, error);
  }
  if (message === 'PRODUCT_UNAVAILABLE') {
    return checkoutError(requestId, stage, 'PRODUCT_UNAVAILABLE', 'One or more items are currently unavailable.', 400, error);
  }
  if (message === 'INSUFFICIENT_STOCK') {
    return checkoutError(requestId, stage, 'INSUFFICIENT_STOCK', 'Some items are no longer available in the requested quantity.', 400, error);
  }
  return checkoutError(requestId, stage, 'RESERVATION_CREATE_FAILED', "We couldn't prepare your checkout. Please try again.", 500, error);
};

export async function POST(request: Request) {
  const requestId = randomUUID();
  let stage = 'REQUEST_PARSE';
  try {
    stage = 'AUTH';
    const authorization = request.headers.get('authorization');
    if (!authorization?.startsWith('Bearer ')) return checkoutError(requestId, stage, 'AUTH_REQUIRED', 'Authentication required.', 401);

    const accessToken = authorization.slice('Bearer '.length).trim();
    if (!accessToken) return checkoutError(requestId, stage, 'SESSION_EXPIRED', 'Your customer session has expired. Please sign in again.', 401);
    const authClient = createClient(url, anonKey);
    const { data: { user }, error: authError } = await authClient.auth.getUser(accessToken);
    if (authError || !user) return checkoutError(requestId, stage, 'SESSION_EXPIRED', 'Your customer session has expired. Please sign in again.', 401, authError);

    stage = 'REQUEST_PARSE';
    const body = await request.json();
    if (body.service) return checkoutError(requestId, stage, 'INVALID_CHECKOUT_DATA', 'Recharge and bill-payment fulfillment is unavailable. No payment was started.', 503);

  const cartItems = body.cartItems as CartItem[];
  const deliveryAddress = typeof body.deliveryAddress === 'string' ? body.deliveryAddress.trim() : '';
  const deliveryAddressId = typeof body.deliveryAddressId === 'string' && body.deliveryAddressId.trim() ? body.deliveryAddressId.trim() : null;
  // Legacy pricing inputs remain accepted for request compatibility, but the
  // authoritative reservation now ignores pass/tip/donation pricing.
  const tip = 0;
  const hasZeshuPass = false;
  const isDonating = false;
  const requestedZeshuCash = body.zeshuCashAmount === undefined ? 0 : Number(body.zeshuCashAmount);
  if (!Array.isArray(cartItems) || cartItems.length === 0 || deliveryAddress.length < 8 || !Number.isFinite(requestedZeshuCash) || requestedZeshuCash < 0) {
      return checkoutError(requestId, stage, 'INVALID_CHECKOUT_DATA', 'Invalid checkout data.', 400);
    }

    const reservationItems: ReservationItem[] = cartItems.map(({ item, qty }) => ({ product_id: String(item?.id ?? ''), quantity: Number(qty) }));
    if (reservationItems.some((item) => !item.product_id || !Number.isInteger(item.quantity) || item.quantity <= 0)) {
      return checkoutError(requestId, stage, 'INVALID_CART_ITEM', 'Invalid cart item.', 400);
    }

    if (process.env.NODE_ENV === 'development') {
      console.info('create_inventory_reservation input', {
        cartLength: cartItems.length,
        cartProductIds: reservationItems.map((item) => item.product_id),
        cartQuantities: reservationItems.map((item) => item.quantity),
        hasDeliveryAddress: deliveryAddress.length > 0,
        deliveryAddressLength: deliveryAddress.length,
        hasAuthenticatedUser: Boolean(user),
        hasCoordinates: Boolean(deliveryAddressId),
      });
    }

    const serviceClient = createClient(url, serviceRoleKey);
    stage = 'CUSTOMER_PROFILE';
    let deliveryCoordinates: { latitude: number; longitude: number; accuracyMeters: number | null; source: 'DEVICE' | 'MANUAL_PIN' | 'LEGACY' } | null = null;
    let savedDeliveryAddress: any = null;
    const [, adminRoleResult, customerProfileResult, savedAddressResult] = await Promise.all([
        serviceClient.rpc('release_expired_zeshu_cash_redemptions'),
        Promise.resolve(serviceClient.from('admin_roles').select('user_id').eq('user_id', user.id).eq('role', 'admin').maybeSingle()),
        Promise.resolve(serviceClient.from('users').select('id').eq('id', user.id).maybeSingle()),
        deliveryAddressId
          ? Promise.resolve(serviceClient.from('customer_addresses').select('id,user_id,latitude,longitude,location_accuracy_meters,location_source,postal_code,city,state').eq('id', deliveryAddressId).eq('user_id', user.id).maybeSingle())
          : Promise.resolve({ data: null }),
    ]);
    const { data: adminRole, error: adminRoleError } = adminRoleResult;
    if (adminRoleError) return checkoutError(requestId, stage, 'CHECKOUT_INTERNAL_ERROR', 'Unable to verify checkout identity.', 500, adminRoleError);
    if (adminRole) return checkoutError(requestId, stage, 'ADMIN_CHECKOUT_FORBIDDEN', 'Admin sessions cannot be used for customer checkout. Sign in with a customer account.', 403);

    const { data: customerProfile, error: customerProfileError } = customerProfileResult;
    if (customerProfileError) return checkoutError(requestId, stage, 'CHECKOUT_INTERNAL_ERROR', 'Unable to verify customer profile.', 500, customerProfileError);
    if (!customerProfile) return checkoutError(requestId, stage, 'CUSTOMER_PROFILE_REQUIRED', 'Customer profile required before checkout. Please sign in with your customer account.', 403);

    if (deliveryAddressId) {
      const { data: savedAddress } = savedAddressResult;
      savedDeliveryAddress = savedAddress || null;
      const latitude = Number(savedAddress?.latitude);
      const longitude = Number(savedAddress?.longitude);
      if (savedAddress && Number.isFinite(latitude) && latitude >= -90 && latitude <= 90 && Number.isFinite(longitude) && longitude >= -180 && longitude <= 180) {
        const accuracy = Number(savedAddress.location_accuracy_meters);
        deliveryCoordinates = { latitude, longitude, accuracyMeters: Number.isFinite(accuracy) && accuracy >= 0 ? accuracy : null, source: savedAddress.location_source === 'DEVICE' || savedAddress.location_source === 'MANUAL_PIN' ? savedAddress.location_source : 'LEGACY' };
      }
    }

    stage = 'FULFILLMENT_CLASSIFICATION';
    const requestedFulfillmentIds = Array.from(new Set(reservationItems.map((item) => item.product_id)));
    const { data: fulfillmentProducts, error: fulfillmentProductsError } = await serviceClient
      .from('products')
      .select('id,delivery_mode,nationwide_shipping_enabled,requires_cold_chain,shipping_class,packed_weight_grams')
      .in('id', requestedFulfillmentIds);
    if (fulfillmentProductsError) return checkoutError(requestId, stage, 'PRODUCT_LOOKUP_FAILED', 'Unable to verify delivery eligibility.', 500, fulfillmentProductsError);
    if ((fulfillmentProducts || []).length !== requestedFulfillmentIds.length) {
      return checkoutError(requestId, stage, 'PRODUCT_UNAVAILABLE', 'One or more items are currently unavailable.', 400);
    }

    const fulfillmentModes = new Set((fulfillmentProducts || []).map((product: any) => String(product.delivery_mode || 'LOCAL_STANDARD')));
    const hasIndiaItems = fulfillmentModes.has('INDIA_STANDARD');
    const hasLocalItems = [...fulfillmentModes].some((mode) => mode !== 'INDIA_STANDARD');
    let checkoutFulfillmentMode: 'LOCAL_30_MIN' | 'LOCAL_STANDARD' | 'INDIA_STANDARD' = hasIndiaItems
      ? 'INDIA_STANDARD'
      : fulfillmentModes.size === 1 && fulfillmentModes.has('LOCAL_30_MIN')
        ? 'LOCAL_30_MIN'
        : 'LOCAL_STANDARD';

    if (hasIndiaItems && hasLocalItems) {
      return checkoutError(
        requestId,
        stage,
        'MIXED_FULFILLMENT_UNSUPPORTED',
        'Fresh/local and India-delivery items need separate shipments. Split checkout is being prepared.',
        409,
      );
    }

    if (!hasIndiaItems && isJagtialServiceAreaEnforced()) {
      const serviceAreaResult = deliveryCoordinates
        ? evaluateJagtialServiceArea(deliveryCoordinates.latitude, deliveryCoordinates.longitude)
        : 'SERVICE_AREA_UNAVAILABLE';
      if (serviceAreaResult === 'SERVICE_AREA_UNAVAILABLE') {
        return checkoutError(requestId, 'SERVICE_AREA', 'SERVICE_AREA_UNAVAILABLE', 'We could not verify this delivery location yet. Confirm a delivery pin in supported Jagtial areas and try again.', 409);
      }
      if (serviceAreaResult === 'OUTSIDE_SERVICE_AREA') {
        return checkoutError(requestId, 'SERVICE_AREA', 'OUTSIDE_SERVICE_AREA', '30-minute essentials delivery is coming soon in your area.', 409);
      }
    }

    const canonicalRequestedItems = canonicalizeItems(reservationItems);

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) return checkoutError(requestId, stage, 'PAYMENT_SERVICE_UNAVAILABLE', 'Payment service is unavailable.', 503);
    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });

    stage = 'EXISTING_CHECKOUT';
    const [resumableResult, expiredReservationResult] = await Promise.all([
      Promise.resolve(serviceClient.rpc('get_resumable_inventory_reservation', { p_user_id: user.id }))
        .catch((error) => ({ data: null, error })),
      Promise.resolve(serviceClient
        .from('inventory_reservations')
        .select('id,status,razorpay_order_id,abandoned_at')
        .eq('user_id', user.id)
        .in('status', ['EXPIRED', 'PAYMENT_PENDING'])
        .lte('expires_at', new Date().toISOString())
        .not('razorpay_order_id', 'is', null)
        .is('abandoned_at', null)
        .order('created_at', { ascending: true }))
        .catch((error) => ({ data: null, error })),
    ]);
    const { data: resumableData, error: resumableError } = resumableResult;
    if (resumableError) return checkoutError(requestId, stage, 'CHECKOUT_INTERNAL_ERROR', 'Unable to check existing checkout state.', 500, resumableError);
    let resumable = (Array.isArray(resumableData) ? resumableData[0] : resumableData) as ResumableReservation | null;

    const { data: expiredBoundReservations, error: expiredReservationError } = expiredReservationResult;
    if (expiredReservationError) return checkoutError(requestId, stage, 'CHECKOUT_INTERNAL_ERROR', 'Unable to check previous payment state.', 500, expiredReservationError);
    for (const expiredBoundReservation of expiredBoundReservations || []) {
      stage = 'ABANDONED_PAYMENT_VERIFY';
      if (!['PAYMENT_PENDING', 'EXPIRED'].includes(expiredBoundReservation.status) || !expiredBoundReservation.razorpay_order_id) {
        return checkoutError(requestId, stage, 'PAYMENT_RECONCILIATION_REQUIRED', 'Your previous payment is still being reconciled. Resume that checkout before trying another payment.', 409);
      }

      const { data: recoveryReservation, error: recoveryReservationError } = await serviceClient
        .from('inventory_reservations')
        .select('id,status,razorpay_order_id,expected_total_paid,delivery_address,vendor_id,pricing_snapshot,expires_at,inventory_reservation_items(product_id,quantity,unit_price)')
        .eq('id', expiredBoundReservation.id)
        .eq('user_id', user.id)
        .maybeSingle();
      if (recoveryReservationError || !recoveryReservation) return checkoutError(requestId, stage, 'PAYMENT_RECONCILIATION_REQUIRED', 'We could not safely verify the previous checkout. Please check payment status again.', 409, recoveryReservationError);

      const recoveryItems = canonicalizeItems((recoveryReservation.inventory_reservation_items || []).map((item: any) => ({ product_id: String(item.product_id), quantity: Number(item.quantity) })));
      const sameRecoveryItems = JSON.stringify(recoveryItems) === JSON.stringify(canonicalRequestedItems);
      const sameRecoveryAddress = recoveryReservation.delivery_address === deliveryAddress;
      const recoveryProductIds = recoveryItems.map((item) => item.product_id);
      const [recoveryProductsResult, recoveryLocationResult] = await Promise.all([
        Promise.resolve(serviceClient
          .from('products')
          .select('id,vendor_id,price,quantity,in_stock')
          .in('id', recoveryProductIds))
          .catch((error) => ({ data: null, error })),
        Promise.resolve(serviceClient
          .from('inventory_reservation_location_snapshots')
          .select('latitude,longitude')
          .eq('reservation_id', expiredBoundReservation.id)
          .maybeSingle())
          .catch((error) => ({ data: null, error })),
      ]);
      const { data: recoveryProducts, error: recoveryProductsError } = recoveryProductsResult;
      const { data: recoveryLocationSnapshot, error: recoveryLocationError } = recoveryLocationResult;
      if (recoveryProductsError) return checkoutError(requestId, stage, 'PAYMENT_RECONCILIATION_REQUIRED', 'We could not safely verify the previous checkout. Please check payment status again.', 409, recoveryProductsError);
      const recoveryProductsById = new Map((recoveryProducts || []).map((product: any) => [String(product.id), product]));
      const sameRecoveryProductSet = recoveryProductsById.size === recoveryProductIds.length
        && recoveryProductIds.every((productId) => recoveryProductsById.has(productId));
      const recoveryVendors = (recoveryProducts || []).map((product: any) => product.vendor_id).filter(Boolean);
      const recoveryVendorId = recoveryVendors.length > 0 && recoveryVendors.every((vendorId: string) => vendorId === recoveryVendors[0]) ? recoveryVendors[0] : null;
      const sameRecoveryVendor = recoveryVendorId === recoveryReservation.vendor_id;
      const sameRecoveryPrices = sameRecoveryProductSet && recoveryItems.every((item) => {
        const product = recoveryProductsById.get(item.product_id);
        return product && product.price !== null && product.price !== undefined && sameNumber(product.price, Number((recoveryReservation.inventory_reservation_items || []).find((recoveryItem: any) => String(recoveryItem.product_id) === item.product_id)?.unit_price));
      });
      const recoveryMerchandiseSubtotal = sameRecoveryProductSet && recoveryVendorId
        ? canonicalRequestedItems.reduce((sum, item) => sum + Number(recoveryProductsById.get(item.product_id)?.price || 0) * item.quantity, 0)
        : NaN;
      const recoverySnapshot = recoveryReservation.pricing_snapshot || {};
      const recoverySnapshotDeliveryFee = Number(recoverySnapshot.delivery_fee);
      const recoveryFulfillmentCompatible = hasIndiaItems
        ? recoverySnapshot.fulfillment_mode === 'INDIA_STANDARD'
        : recoverySnapshot.fulfillment_mode !== 'INDIA_STANDARD';
      const recoveryDeliveryFee = recoverySnapshot.fulfillment_mode === 'INDIA_STANDARD' && Number.isFinite(recoverySnapshotDeliveryFee)
        ? recoverySnapshotDeliveryFee
        : Number.isFinite(recoveryMerchandiseSubtotal) && recoveryMerchandiseSubtotal >= 299 ? 0 : 30;
      const recoveryExpectedPricing = {
        small_cart_fee: 0,
        delivery_fee: recoveryDeliveryFee,
        handling_fee: 0,
        donation: 0,
        tip: 0,
        pass_fee: 0,
        discount_total: 0,
      };
      const sameRecoveryPricing = Object.entries(recoveryExpectedPricing)
        .filter(([key]) => key !== 'discount_total')
        .every(([key, value]) => sameNumber(recoverySnapshot[key], value));
      const recoveryCashDiscount = Number(recoverySnapshot.zeshu_cash_redemption ?? recoverySnapshot.discount_total ?? 0);
      const recoveryExpectedTotal = Number.isFinite(recoveryMerchandiseSubtotal)
        ? recoveryMerchandiseSubtotal + recoveryDeliveryFee
        : NaN;
      const sameRecoveryAvailability = sameRecoveryProductSet && recoveryItems.every((item) => {
        const product = recoveryProductsById.get(item.product_id);
        return product?.in_stock === true && product.quantity !== null && product.quantity !== undefined && Number(product.quantity) >= item.quantity;
      });
      if (recoveryLocationError) return checkoutError(requestId, stage, 'PAYMENT_RECONCILIATION_REQUIRED', 'We could not safely verify the previous delivery destination. Please check payment status again.', 409, recoveryLocationError);
      const sameRecoveryCoordinates = !recoveryLocationSnapshot || (deliveryCoordinates
        && Number(recoveryLocationSnapshot.latitude) === deliveryCoordinates.latitude
        && Number(recoveryLocationSnapshot.longitude) === deliveryCoordinates.longitude);
      const recoveryMatchesCurrentCheckout = recoveryItems.length > 0
        && sameRecoveryItems
        && sameRecoveryPrices
        && sameRecoveryVendor
        && sameRecoveryAddress
        && recoveryFulfillmentCompatible
        && sameRecoveryCoordinates;
      const recoveryMatchesCurrentPricing = sameRecoveryPricing
        && sameNumber(recoveryCashDiscount, requestedZeshuCash)
        && sameNumber(recoveryReservation.expected_total_paid, recoveryExpectedTotal - recoveryCashDiscount);
      const recoveryCanRenew = recoveryMatchesCurrentCheckout && recoveryMatchesCurrentPricing && sameRecoveryAvailability;

      let recoveryOrder: any;
      let recoveryPaymentsResponse: any;
      try {
        [recoveryOrder, recoveryPaymentsResponse] = await Promise.all([
          razorpay.orders.fetch(expiredBoundReservation.razorpay_order_id),
          razorpay.orders.fetchPayments(expiredBoundReservation.razorpay_order_id),
        ]);
      } catch (error) {
        return checkoutError(requestId, stage, 'PAYMENT_RECONCILIATION_REQUIRED', "We're checking your payment status. Please wait a moment before retrying.", 409, error);
      }

      const recoveryPayments = Array.isArray(recoveryPaymentsResponse?.items) ? recoveryPaymentsResponse.items : null;
      const recoveryDiagnostics = getProviderDiagnostics(recoveryOrder, recoveryPayments);
      if (recoveryOrder?.id !== expiredBoundReservation.razorpay_order_id || recoveryPayments === null || !isRetryableProviderOrder(recoveryOrder, recoveryPayments, Math.round(Number(recoveryReservation.expected_total_paid) * 100))) {
        return checkoutError(requestId, stage, 'PAYMENT_RECONCILIATION_REQUIRED', "We're checking your payment status. Please wait a moment before retrying.", 409, undefined, recoveryDiagnostics);
      }

      // Terminal EXPIRED rows are historical even if their old basket happens
      // to resemble today's basket. They must be safely closed, never renewed.
      if (expiredBoundReservation.status === 'EXPIRED' || !recoveryCanRenew) {
        stage = 'ABANDON_PREVIOUS_CHECKOUT';
        const { data: abandonData, error: abandonError } = await serviceClient.rpc('abandon_mismatched_payment_pending_checkout', {
          p_reservation_id: expiredBoundReservation.id,
          p_razorpay_order_id: expiredBoundReservation.razorpay_order_id,
        });
        const abandonRows = Array.isArray(abandonData)
          ? abandonData
          : abandonData && typeof abandonData === 'object' ? [abandonData] : [];
        if (abandonError || abandonRows.length !== 1 || abandonRows[0]?.abandoned !== true) {
          return checkoutError(requestId, stage, 'PAYMENT_RECONCILIATION_REQUIRED', 'We could not safely close the previous checkout. Please check payment status again.', 409, abandonError, recoveryDiagnostics);
        }
        continue;
      }

      stage = 'ABANDONED_RENEW';
      const { data: renewResult, error: renewError } = await serviceClient.rpc('renew_expired_payment_pending_checkout', {
        p_reservation_id: expiredBoundReservation.id,
        p_razorpay_order_id: expiredBoundReservation.razorpay_order_id,
      });
      if (renewError) return checkoutError(requestId, stage, 'PAYMENT_RECONCILIATION_REQUIRED', 'We could not safely resume the previous checkout. Please check payment status again.', 409, renewError);
      const renewRow = Array.isArray(renewResult) ? renewResult[0] : renewResult;
      if (!renewRow || (renewRow.renewed !== true && renewRow.renewed !== false)) return checkoutError(requestId, stage, 'PAYMENT_RECONCILIATION_REQUIRED', 'We could not safely resume the previous checkout. Please check payment status again.', 409);

      const { data: renewedData, error: renewedLookupError } = await serviceClient.rpc('get_resumable_inventory_reservation', { p_user_id: user.id });
      if (renewedLookupError) return checkoutError(requestId, stage, 'PAYMENT_RECONCILIATION_REQUIRED', 'We could not safely resume the previous checkout. Please check payment status again.', 409, renewedLookupError);
      resumable = (Array.isArray(renewedData) ? renewedData[0] : renewedData) as ResumableReservation | null;
      if (!resumable || resumable.reservation_id !== expiredBoundReservation.id || resumable.razorpay_order_id !== expiredBoundReservation.razorpay_order_id) return checkoutError(requestId, stage, 'PAYMENT_RECONCILIATION_REQUIRED', 'We could not safely resume the previous checkout. Please check payment status again.', 409);
    }

    if (resumable?.reservation_id) {
      const activeResumable = resumable;
      const existingItems = canonicalizeItems((activeResumable.reservation_items || []).map((item) => ({ product_id: String(item.product_id), quantity: Number(item.quantity) })));
      const sameItems = JSON.stringify(existingItems) === JSON.stringify(canonicalRequestedItems);
      const requestedProductIds = canonicalRequestedItems.map((item) => item.product_id);
      const { data: currentProducts, error: currentProductsError } = await serviceClient.from('products').select('id,price,vendor_id,quantity,in_stock').in('id', requestedProductIds);
      if (currentProductsError) return checkoutError(requestId, stage, 'PRODUCT_LOOKUP_FAILED', 'Unable to verify checkout products.', 500, currentProductsError);
      const products = currentProducts || [];
      const productsById = new Map(products.map((product) => [String(product.id), product]));
      const sameProductSet = products.length === requestedProductIds.length && requestedProductIds.every((id) => productsById.has(id));
      const vendors = products.map((product) => product.vendor_id).filter(Boolean);
      const currentVendorId = vendors.length > 0 && vendors.every((vendorId) => vendorId === vendors[0]) ? vendors[0] : null;
      const merchandiseSubtotal = sameProductSet && currentVendorId
        ? canonicalRequestedItems.reduce((sum, item) => sum + Number(productsById.get(item.product_id)?.price || 0) * item.quantity, 0)
        : NaN;
      const snapshot = activeResumable.pricing_snapshot || {};
      const snapshotDeliveryFee = Number(snapshot.delivery_fee);
      const fulfillmentCompatible = hasIndiaItems
        ? snapshot.fulfillment_mode === 'INDIA_STANDARD'
        : snapshot.fulfillment_mode !== 'INDIA_STANDARD';
      const deliveryFee = snapshot.fulfillment_mode === 'INDIA_STANDARD' && Number.isFinite(snapshotDeliveryFee)
        ? snapshotDeliveryFee
        : Number.isFinite(merchandiseSubtotal) && merchandiseSubtotal >= 299 ? 0 : 30;
      const expectedPricing = {
        small_cart_fee: 0,
        delivery_fee: deliveryFee,
        handling_fee: 0,
        donation: 0,
        tip: 0,
        pass_fee: 0,
        discount_total: 0,
      };
      const samePricing = Object.entries(expectedPricing).filter(([key]) => key !== 'discount_total').every(([key, value]) => sameNumber(snapshot[key], value));
      const existingCashDiscount = Number(snapshot.zeshu_cash_redemption || snapshot.discount_total || 0);
      const expectedTotal = Number.isFinite(merchandiseSubtotal)
        ? merchandiseSubtotal + expectedPricing.delivery_fee
        : NaN;
      const sameCheckout = sameItems
        && sameProductSet
        && currentVendorId === activeResumable.vendor_id
        && activeResumable.delivery_address === deliveryAddress
        && fulfillmentCompatible
        && samePricing
        && sameNumber(existingCashDiscount, requestedZeshuCash)
        && sameNumber(activeResumable.expected_total_paid, expectedTotal - existingCashDiscount);
      if (!sameCheckout) {
        stage = 'PRODUCT_VALIDATION';
        const newProductSet = products.length === requestedProductIds.length
          && requestedProductIds.every((id) => productsById.has(id));
        if (!newProductSet) return reservationErrorResponse(requestId, stage, 'PRODUCT_UNAVAILABLE');
        if (products.some((product) => !product.vendor_id || product.price === null || product.price === undefined || !Number.isFinite(Number(product.price)) || product.in_stock !== true)) {
          return reservationErrorResponse(requestId, stage, 'PRODUCT_UNAVAILABLE');
        }
        if (new Set(products.map((product) => String(product.vendor_id))).size !== 1) {
          return reservationErrorResponse(requestId, stage, 'MULTI_VENDOR_CART');
        }
        if (canonicalRequestedItems.some((item) => {
          const product = productsById.get(item.product_id);
          return product?.quantity === null
            || product?.quantity === undefined
            || !Number.isFinite(Number(product.quantity))
            || Number(product.quantity) < item.quantity;
        })) {
          return reservationErrorResponse(requestId, stage, 'INSUFFICIENT_STOCK');
        }

        stage = 'ACTIVE_CHECKOUT_SUPERSEDE_VERIFY';
        let supersedeOrder: any;
        let supersedePaymentsResponse: any;
        try {
          [supersedeOrder, supersedePaymentsResponse] = await Promise.all([
            razorpay.orders.fetch(activeResumable.razorpay_order_id),
            razorpay.orders.fetchPayments(activeResumable.razorpay_order_id),
          ]);
        } catch (error) {
          return checkoutError(requestId, stage, 'PAYMENT_RECONCILIATION_REQUIRED', "We're checking your payment status. Please wait a moment before retrying.", 409, error);
        }
        const supersedePayments = Array.isArray(supersedePaymentsResponse?.items) ? supersedePaymentsResponse.items : null;
        const supersedeDiagnostics = getProviderDiagnostics(supersedeOrder, supersedePayments);
        const supersedeAmountPaise = Math.round(Number(activeResumable.expected_total_paid) * 100);
        if (supersedeOrder?.id !== activeResumable.razorpay_order_id
          || supersedePayments === null
          || !isRetryableProviderOrder(supersedeOrder, supersedePayments, supersedeAmountPaise)) {
          return checkoutError(requestId, stage, 'PAYMENT_RECONCILIATION_REQUIRED', "We're checking your payment status. Please wait a moment before retrying.", 409, undefined, supersedeDiagnostics);
        }

        stage = 'ACTIVE_CHECKOUT_SUPERSEDE';
        const { data: supersedeData, error: supersedeError } = await serviceClient.rpc('supersede_active_unpaid_checkout', {
          p_reservation_id: activeResumable.reservation_id,
          p_razorpay_order_id: activeResumable.razorpay_order_id,
        });
        const supersedeRows = Array.isArray(supersedeData)
          ? supersedeData
          : supersedeData && typeof supersedeData === 'object' ? [supersedeData] : [];
        if (supersedeError
          || supersedeRows.length !== 1
          || supersedeRows[0]?.superseded !== true
          || typeof supersedeRows[0]?.redemption_released !== 'boolean') {
          return checkoutError(requestId, stage, 'PAYMENT_RECONCILIATION_REQUIRED', 'We could not safely close the previous checkout. Please check payment status again.', 409, supersedeError, supersedeDiagnostics);
        }
        resumable = null;
      }

      if (resumable?.reservation_id) {
        // Reconcile the already-bound Razorpay order before any recovery RPC can
        // mutate the reservation or its reward hold. A resumable checkout must
        // remain the exact same payable, zero-payment provider order.
        try {
          const [preflightOrder, preflightPaymentsResponse] = await Promise.all([
            razorpay.orders.fetch(activeResumable.razorpay_order_id),
            razorpay.orders.fetchPayments(activeResumable.razorpay_order_id),
          ]);
          const preflightPayments = Array.isArray(preflightPaymentsResponse?.items) ? preflightPaymentsResponse.items : null;
          const preflightAmountPaise = Math.round(Number(activeResumable.expected_total_paid) * 100);
          if (preflightPayments === null || !isRetryableProviderOrder(preflightOrder, preflightPayments, preflightAmountPaise)) {
            return checkoutError(requestId, stage, 'PAYMENT_RECONCILIATION_REQUIRED', "We're checking your payment status. Please wait a moment before retrying.", 409, undefined, getProviderDiagnostics(preflightOrder, preflightPayments));
          }
        } catch (error) {
          return checkoutError(requestId, stage, 'PAYMENT_RECONCILIATION_REQUIRED', "We're checking your payment status. Please wait a moment before retrying.", 409, error);
        }

      const { data: resumedCashData, error: resumedCashError } = await serviceClient.rpc('reserve_zeshu_cash_redemption', {
        p_user_id: user.id,
        p_reservation_id: activeResumable.reservation_id,
        p_requested_amount: requestedZeshuCash,
      });
      if (resumedCashError) {
        if (process.env.NODE_ENV === 'development') {
          const { data: reservationDiagnostics } = await serviceClient
            .from('inventory_reservations')
            .select('status,merchandise_subtotal,expected_total_paid,pre_reward_total_paid,expires_at')
            .eq('id', activeResumable.reservation_id)
            .maybeSingle();
          console.error('[checkout]', { requestId, stage: 'CASH_RESERVATION', code: 'CASH_RESERVATION_FAILED', errorType: resumedCashError.name || 'SupabaseError' });
          console.error('[checkout] cash diagnostics', {
            reservationId: String(activeResumable.reservation_id),
            reservationStatus: String(reservationDiagnostics?.status ?? ''),
            merchandiseSubtotal: String(reservationDiagnostics?.merchandise_subtotal ?? ''),
            requestedZeshuCash: String(requestedZeshuCash),
          });
        }
        return checkoutError(requestId, 'CASH_RESERVATION', 'CASH_RESERVATION_FAILED', 'Unable to reserve Zeshu Cash for checkout.', 409, resumedCashError);
      }
      const resumedCash = Array.isArray(resumedCashData) ? resumedCashData[0] : resumedCashData;
      const resumedExpectedTotal = Number(resumedCash?.expected_total_paid ?? activeResumable.expected_total_paid);

      try {
        const [existingOrder, paymentsResponse] = await Promise.all([
          razorpay.orders.fetch(activeResumable.razorpay_order_id),
          razorpay.orders.fetchPayments(activeResumable.razorpay_order_id),
        ]);
        const payments = Array.isArray(paymentsResponse?.items) ? paymentsResponse.items : [];
        const expectedAmountPaise = Math.round(resumedExpectedTotal * 100);
        if (!isRetryableProviderOrder(existingOrder, payments, expectedAmountPaise)) return checkoutError(requestId, stage, 'PAYMENT_RECONCILIATION_REQUIRED', "We're checking your payment status. Please wait a moment before retrying.", 409, undefined, getProviderDiagnostics(existingOrder, payments));
      if (deliveryCoordinates) await saveReservationLocationSnapshot(serviceClient, activeResumable.reservation_id, user.id, deliveryCoordinates);
      if (resumedCash?.redemption_id) await serviceClient.rpc('bind_zeshu_cash_redemption', { p_redemption_id: resumedCash.redemption_id, p_razorpay_order_id: existingOrder.id });
        const { data: resumedDeliveryPlan, error: resumedDeliveryPlanError } = await serviceClient
          .from('inventory_reservations')
          .select('fulfillment_mode,shipping_quote_snapshot')
          .eq('id', activeResumable.reservation_id)
          .eq('user_id', user.id)
          .maybeSingle();
        if (resumedDeliveryPlanError || !resumedDeliveryPlan) {
          return checkoutError(requestId, 'FULFILLMENT_SNAPSHOT', 'CHECKOUT_INTERNAL_ERROR', 'Unable to verify the saved delivery plan. No payment was started.', 500, resumedDeliveryPlanError);
        }
        const resumedShippingSnapshot = resumedDeliveryPlan.shipping_quote_snapshot || {};
        stage = 'COMPLETE';
        return NextResponse.json({
          success: true,
          resumed: true,
          resumePayment: true,
          orderId: existingOrder.id,
          amount: existingOrder.amount,
          currency: existingOrder.currency,
          totalAmount: resumedExpectedTotal,
          zeshuCashUsed: Number(resumedCash?.approved_amount || 0),
          redemptionId: resumedCash?.redemption_id || null,
          reservationId: activeResumable.reservation_id,
          fulfillmentMode: resumedDeliveryPlan.fulfillment_mode || 'LOCAL_STANDARD',
          shippingCharge: Number(resumedShippingSnapshot.customer_shipping_charge || 0),
          freeShipping: resumedShippingSnapshot.free_shipping === true,
          courierName: typeof resumedShippingSnapshot.courier_name === 'string' ? resumedShippingSnapshot.courier_name : null,
          estimatedDeliveryDays: Number.isFinite(Number(resumedShippingSnapshot.estimated_delivery_days))
            ? Number(resumedShippingSnapshot.estimated_delivery_days)
            : null,
          requestId,
        });
      } catch (error) {
        if (process.env.NODE_ENV !== 'production') console.error('[checkout]', { requestId, stage, code: 'PAYMENT_RECONCILIATION_REQUIRED', errorType: error instanceof Error ? error.name : typeof error });
        return checkoutError(requestId, stage, 'PAYMENT_RECONCILIATION_REQUIRED', "We're checking your payment status. Please wait a moment before retrying.", 409, error);
      }
      }
    }

    stage = 'PRODUCT_LOOKUP';
    const requestedProductIds = canonicalRequestedItems.map((item) => item.product_id);
    const { data: authoritativeProducts, error: authoritativeProductsError } = await serviceClient
      .from('products')
      .select('id,name,vendor_id,price,quantity,in_stock,delivery_mode,fresh_eligible,nationwide_shipping_enabled,requires_cold_chain,packed_weight_grams,package_length_cm,package_width_cm,package_height_cm,shipping_class,min_nationwide_quantity,min_nationwide_order_value,handling_minutes')
      .in('id', requestedProductIds);
    if (authoritativeProductsError) return checkoutError(requestId, stage, 'PRODUCT_LOOKUP_FAILED', 'Unable to verify checkout products.', 500, authoritativeProductsError);
    stage = 'PRODUCT_VALIDATION';
    const productsById = new Map((authoritativeProducts || []).map((product) => [String(product.id), product]));
    if (productsById.size !== requestedProductIds.length || requestedProductIds.some((id) => !productsById.has(id))) {
      return reservationErrorResponse(requestId, stage, 'PRODUCT_UNAVAILABLE');
    }
    const products = requestedProductIds.map((id) => productsById.get(id)!);
    if (products.some((product) => !product.vendor_id || product.price === null || product.price === undefined || product.in_stock !== true)) {
      return reservationErrorResponse(requestId, stage, 'PRODUCT_UNAVAILABLE');
    }
    if (new Set(products.map((product) => String(product.vendor_id))).size !== 1) {
      return reservationErrorResponse(requestId, stage, 'MULTI_VENDOR_CART');
    }
    if (canonicalRequestedItems.some((item) => {
      const product = productsById.get(item.product_id);
      return product?.quantity === null || product?.quantity === undefined || Number(product.quantity) < item.quantity;
    })) {
      return reservationErrorResponse(requestId, stage, 'INSUFFICIENT_STOCK');
    }

    if (products.some((product: any) => String(product.delivery_mode || 'LOCAL_STANDARD') !== checkoutFulfillmentMode)) {
      return checkoutError(requestId, stage, 'FULFILLMENT_CHANGED', 'A product delivery option changed while you were checking out. Please review your basket and try again.', 409);
    }

    const vendorId = String(products[0]?.vendor_id || '');
    const { data: fulfillmentVendor, error: fulfillmentVendorError } = await serviceClient
      .from('vendors')
      .select('id,is_open,admin_suspended,local_30_min_enabled,local_standard_enabled')
      .eq('id', vendorId)
      .maybeSingle();
    if (fulfillmentVendorError || !fulfillmentVendor) {
      return checkoutError(requestId, stage, 'VENDOR_UNAVAILABLE', 'This store is temporarily unavailable.', 409, fulfillmentVendorError);
    }
    if (fulfillmentVendor.admin_suspended === true || fulfillmentVendor.is_open !== true) {
      return checkoutError(requestId, stage, 'VENDOR_UNAVAILABLE', 'This store is currently closed. Please try again when it reopens.', 409);
    }

    if (checkoutFulfillmentMode === 'LOCAL_30_MIN') {
      if (products.some((product: any) => product.fresh_eligible !== true)) {
        checkoutFulfillmentMode = 'LOCAL_STANDARD';
      } else {
        let fastCapacityAvailable = fulfillmentVendor.local_30_min_enabled === true;
        if (fastCapacityAvailable) {
          const freshnessCutoff = new Date(Date.now() - 5 * 60 * 1000).toISOString();
          const [{ data: activeRiders, error: riderError }, { data: activeDeliveries, error: activeDeliveryError }] = await Promise.all([
            serviceClient.from('riders').select('id,user_id').eq('is_active', true).eq('admin_suspended', false).gte('location_updated_at', freshnessCutoff),
            serviceClient.from('orders').select('rider_id,assigned_rider_id').in('status', ['PENDING','CONFIRMED','PREPARING','READY_FOR_PICKUP','PICKED_UP','OUT_FOR_DELIVERY']),
          ]);
          if (riderError || activeDeliveryError) {
            fastCapacityAvailable = false;
          } else {
            const busyRiderIds = new Set<string>(
              (activeDeliveries || [])
                .flatMap((order: any) => [order.rider_id, order.assigned_rider_id])
                .filter(Boolean)
                .map(String),
            );
            fastCapacityAvailable = (activeRiders || []).some((rider: any) =>
              !busyRiderIds.has(String(rider.id)) && !busyRiderIds.has(String(rider.user_id || '')),
            );
          }
        }
        if (!fastCapacityAvailable) checkoutFulfillmentMode = 'LOCAL_STANDARD';
      }
    }

    if (checkoutFulfillmentMode === 'LOCAL_STANDARD' && fulfillmentVendor.local_standard_enabled === false) {
      return checkoutError(requestId, stage, 'LOCAL_DELIVERY_PAUSED', 'Local delivery is temporarily paused for this store.', 409);
    }

    let indiaShipping: null | {
      quote: Awaited<ReturnType<typeof getNationwideCourierQuotes>>[number];
      customerShippingCharge: number;
      subtotal: number;
      freeShipping: boolean;
      contributionRupees: number;
      marginPercent: number;
      minimumContributionRupees: number;
      minimumMarginPercent: number;
      deliveryPostcode: string;
      weightKg: number;
      dimensions: { lengthCm: number; breadthCm: number; heightCm: number };
    } = null;

    if (checkoutFulfillmentMode === 'INDIA_STANDARD') {
      const deliveryPostcode = String(savedDeliveryAddress?.postal_code || '').replace(/\D/g, '');
      if (!/^\d{6}$/.test(deliveryPostcode)) {
        return checkoutError(requestId, stage, 'INDIA_PINCODE_REQUIRED', 'Choose a saved delivery address with a valid 6-digit PIN code for India delivery.', 409);
      }

      if (products.some((product: any) =>
        product.nationwide_shipping_enabled !== true
        || product.requires_cold_chain === true
        || product.shipping_class !== 'STANDARD'
        || Number(product.packed_weight_grams) <= 0
        || Number(product.package_length_cm) <= 0
        || Number(product.package_width_cm) <= 0
        || Number(product.package_height_cm) <= 0
      )) {
        return checkoutError(requestId, stage, 'INDIA_PRODUCT_NOT_READY', 'One or more items still need complete safe-shipping details before India delivery can be offered.', 409);
      }

      const [{ data: settings, error: settingsError }, { data: profiles, error: profilesError }] = await Promise.all([
        serviceClient.from('fulfillment_settings').select('*').eq('id', 'default').maybeSingle(),
        serviceClient.from('product_fulfillment_profiles').select('*').in('product_id', requestedProductIds),
      ]);
      if (settingsError || profilesError || !settings) {
        return checkoutError(requestId, stage, 'INDIA_DELIVERY_UNAVAILABLE', 'India delivery is temporarily unavailable. No payment was started.', 503, settingsError || profilesError);
      }
      if (settings.nationwide_checkout_enabled !== true || !isNationwideCourierReady()) {
        return checkoutError(requestId, stage, 'NATIONWIDE_DELIVERY_UNAVAILABLE', 'India-wide delivery is being prepared and is not accepting payments yet.', 409);
      }

      const profilesById = new Map((profiles || []).map((profile: any) => [String(profile.product_id), profile]));
      const subtotal = canonicalRequestedItems.reduce((sum, item) => {
        const product: any = productsById.get(item.product_id);
        return sum + Number(product.price) * item.quantity;
      }, 0);
      const requiredMinimumOrder = Math.max(0, ...products.map((product: any) => Number(product.min_nationwide_order_value || 0)));
      if (subtotal < requiredMinimumOrder) {
        return checkoutError(requestId, stage, 'INDIA_MIN_ORDER', `Add ₹${Math.ceil(requiredMinimumOrder - subtotal)} more of eligible India-delivery products to unlock delivery.`, 409);
      }

      for (const item of canonicalRequestedItems) {
        const product: any = productsById.get(item.product_id);
        const requiredQty = Math.max(1, Number(product.min_nationwide_quantity || 1));
        if (item.quantity < requiredQty) {
          return checkoutError(requestId, stage, 'INDIA_MIN_QUANTITY', `Buy at least ${requiredQty} of ${String(product.name || 'this item')} for India delivery.`, 409);
        }
      }

      let productCost = 0;
      let packagingCost = 0;
      let handlingCost = 0;
      let returnRiskPercent = Math.max(0, Number(settings.default_rto_allowance_percent || 0));
      let minimumContribution = Math.max(0, Number(settings.default_min_contribution_rupees || 0));
      let minimumMargin = Math.max(0, Number(settings.default_min_margin_percent || 0));
      for (const item of canonicalRequestedItems) {
        const profile: any = profilesById.get(item.product_id);
        const product: any = productsById.get(item.product_id);
        const costPrice = Number(profile?.cost_price);
        if (!profile || !Number.isFinite(costPrice) || costPrice < 0) {
          return checkoutError(requestId, stage, 'INDIA_PRODUCT_NOT_READY', 'One or more items still need verified cost details before India delivery can be offered.', 409);
        }
        productCost += costPrice * item.quantity;
        packagingCost += Math.max(0, Number(profile.packaging_cost || 0)) * item.quantity;
        handlingCost += Math.max(0, Number(profile.handling_cost || 0)) * item.quantity;
        returnRiskPercent = Math.max(returnRiskPercent, Math.max(0, Number(profile.return_risk_percent || 0)));
        if (profile.min_contribution_rupees !== null) minimumContribution = Math.max(minimumContribution, Number(profile.min_contribution_rupees));
        if (profile.min_margin_percent !== null) minimumMargin = Math.max(minimumMargin, Number(profile.min_margin_percent));
        if (!Number.isFinite(Number(product.price))) {
          return checkoutError(requestId, stage, 'INDIA_PRODUCT_NOT_READY', 'One or more items have invalid pricing for India delivery.', 409);
        }
      }

      const weightKg = canonicalRequestedItems.reduce((sum, item) => {
        const product: any = productsById.get(item.product_id);
        return sum + Number(product.packed_weight_grams) * item.quantity;
      }, 0) / 1000;
      const lengthCm = Math.max(...canonicalRequestedItems.map((item) => Number((productsById.get(item.product_id) as any)?.package_length_cm || 0)));
      const breadthCm = Math.max(...canonicalRequestedItems.map((item) => Number((productsById.get(item.product_id) as any)?.package_width_cm || 0)));
      const heightCm = canonicalRequestedItems.reduce((sum, item) => {
        const product: any = productsById.get(item.product_id);
        return sum + Number(product.package_height_cm) * item.quantity;
      }, 0);

      stage = 'SHIPPING_QUOTE';
      let quotes: Awaited<ReturnType<typeof getNationwideCourierQuotes>>;
      try {
        quotes = await getNationwideCourierQuotes({
          deliveryPostcode,
          weightKg,
          declaredValue: subtotal,
          lengthCm,
          breadthCm,
          heightCm,
        });
      } catch (quoteError) {
        return checkoutError(requestId, stage, 'INDIA_DELIVERY_UNAVAILABLE', 'We could not get a live courier rate for this address right now. No payment was started.', 503, quoteError);
      }
      if (!quotes.length) {
        return checkoutError(requestId, stage, 'INDIA_PINCODE_UNSERVICEABLE', 'No prepaid courier is currently available for this PIN code.', 409);
      }

      const evaluated = quotes.map((quote) => {
        const freeDecision = settings.free_shipping_enabled === true
          ? evaluateNationwideProfitability({
              merchandiseRevenue: subtotal,
              productCost,
              packagingCost,
              handlingCost,
              courierCost: quote.courierCost,
              customerShippingCharge: 0,
              paymentFeePercent: Number(settings.payment_fee_percent || 0),
              returnRtoAllowancePercent: returnRiskPercent,
              operatingCostPercent: Number(settings.default_operating_cost_percent || 0),
              minimumContributionRupees: minimumContribution,
              minimumMarginPercent: minimumMargin,
            })
          : null;
        if (freeDecision?.eligible) return { quote, decision: freeDecision, customerShippingCharge: 0, freeShipping: true };

        const customerShippingCharge = Math.ceil(quote.courierCost);
        const paidDecision = evaluateNationwideProfitability({
          merchandiseRevenue: subtotal,
          productCost,
          packagingCost,
          handlingCost,
          courierCost: quote.courierCost,
          customerShippingCharge,
          paymentFeePercent: Number(settings.payment_fee_percent || 0),
          returnRtoAllowancePercent: returnRiskPercent,
          operatingCostPercent: Number(settings.default_operating_cost_percent || 0),
          minimumContributionRupees: minimumContribution,
          minimumMarginPercent: minimumMargin,
        });
        return { quote, decision: paidDecision, customerShippingCharge, freeShipping: false };
      });

      const eligibleQuotes = evaluated
        .filter((entry) => entry.decision.eligible)
        .sort((a, b) =>
          a.customerShippingCharge - b.customerShippingCharge
          || a.quote.courierCost - b.quote.courierCost
          || (a.quote.estimatedDeliveryDays ?? 999) - (b.quote.estimatedDeliveryDays ?? 999),
        );

      if (!eligibleQuotes.length) {
        return checkoutError(requestId, stage, 'INDIA_LOW_MARGIN', 'This basket is not economical for India delivery yet. Add more eligible items or choose a bundle.', 409);
      }
      const selected = eligibleQuotes[0];
      indiaShipping = {
        quote: selected.quote,
        customerShippingCharge: selected.customerShippingCharge,
        subtotal,
        freeShipping: selected.freeShipping,
        contributionRupees: selected.decision.contributionRupees,
        marginPercent: selected.decision.marginPercent,
        minimumContributionRupees: minimumContribution,
        minimumMarginPercent: minimumMargin,
        deliveryPostcode,
        weightKg,
        dimensions: { lengthCm, breadthCm, heightCm },
      };
    }

    stage = 'RESERVATION_CREATE';
    const { data: reservationData, error: reservationError } = await serviceClient.rpc('create_inventory_reservation', {
      p_user_id: user.id,
      p_items: reservationItems,
      p_delivery_address: deliveryAddress,
      p_has_zeshu_pass: hasZeshuPass,
      p_is_donating: isDonating,
      p_tip: tip,
    });
    if (reservationError) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[checkout]', {
          requestId,
          stage,
          code: 'RESERVATION_CREATE_FAILED',
          errorType: reservationError.name || 'SupabaseError',
        });
        console.error('[checkout] product diagnostics', {
          cartLength: cartItems.length,
          cartProductIds: reservationItems.map((item) => item.product_id),
          cartQuantities: reservationItems.map((item) => item.quantity),
        });
      }
      return reservationErrorResponse(requestId, stage, reservationError.message, reservationError);
    }

    const reservation = Array.isArray(reservationData) ? reservationData[0] : reservationData;
    const reservationId = reservation?.reservation_id;
    let reservationExpectedTotal = Number(reservation?.expected_total_paid);
    if (typeof reservationId !== 'string' || !Number.isFinite(reservationExpectedTotal) || reservationExpectedTotal <= 0) {
      return checkoutError(requestId, stage, 'CHECKOUT_INTERNAL_ERROR', 'Unable to prepare the database-verified checkout total.', 500);
    }

    stage = 'FULFILLMENT_SNAPSHOT';
    const { data: createdReservation, error: createdReservationError } = await serviceClient
      .from('inventory_reservations')
      .select('id,status,merchandise_subtotal,pricing_snapshot')
      .eq('id', reservationId)
      .eq('user_id', user.id)
      .eq('status', 'ACTIVE')
      .maybeSingle();
    if (createdReservationError || !createdReservation) {
      return checkoutError(requestId, stage, 'CHECKOUT_INTERNAL_ERROR', 'Unable to save the delivery plan for this checkout.', 500, createdReservationError);
    }

    const pricingSnapshot = {
      ...(createdReservation.pricing_snapshot || {}),
      fulfillment_mode: checkoutFulfillmentMode,
    } as Record<string, unknown>;
    const fulfillmentPatch: Record<string, unknown> = {
      fulfillment_mode: checkoutFulfillmentMode,
      pricing_snapshot: pricingSnapshot,
      shipping_quote_snapshot: {
        mode: checkoutFulfillmentMode,
        scope: 'JAGTIAL_LOCAL',
        rate_source: 'LOCAL_PRICING',
        thirty_minute_candidate: checkoutFulfillmentMode === 'LOCAL_30_MIN',
        promised_eta_minutes: null,
      },
    };

    if (indiaShipping) {
      const indiaTotal = Number(createdReservation.merchandise_subtotal) + indiaShipping.customerShippingCharge;
      if (!Number.isFinite(indiaTotal) || indiaTotal <= 0) {
        return checkoutError(requestId, stage, 'CHECKOUT_INTERNAL_ERROR', 'Unable to prepare the India-delivery total.', 500);
      }
      reservationExpectedTotal = Math.round(indiaTotal * 100) / 100;
      pricingSnapshot.delivery_fee = indiaShipping.customerShippingCharge;
      pricingSnapshot.fulfillment_mode = 'INDIA_STANDARD';
      fulfillmentPatch.expected_total_paid = reservationExpectedTotal;
      fulfillmentPatch.pre_reward_total_paid = reservationExpectedTotal;
      fulfillmentPatch.pricing_snapshot = pricingSnapshot;
      fulfillmentPatch.shipping_quote_snapshot = {
        mode: 'INDIA_STANDARD',
        scope: 'INDIA',
        rate_source: 'SHIPROCKET_LIVE',
        provider: 'shiprocket',
        courier_id: indiaShipping.quote.courierId,
        courier_name: indiaShipping.quote.courierName,
        customer_shipping_charge: indiaShipping.customerShippingCharge,
        free_shipping: indiaShipping.freeShipping,
        estimated_delivery_days: indiaShipping.quote.estimatedDeliveryDays,
        etd: indiaShipping.quote.etd,
        charge_weight_kg: indiaShipping.quote.chargeWeightKg,
        shipment_weight_kg: Math.round(indiaShipping.weightKg * 1000) / 1000,
        package_dimensions_cm: indiaShipping.dimensions,
        delivery_postcode: indiaShipping.deliveryPostcode,
        quoted_at: new Date().toISOString(),
      };
    }

    const { data: updatedReservation, error: fulfillmentSnapshotError } = await serviceClient
      .from('inventory_reservations')
      .update(fulfillmentPatch)
      .eq('id', reservationId)
      .eq('user_id', user.id)
      .eq('status', 'ACTIVE')
      .select('id,expected_total_paid')
      .maybeSingle();
    if (fulfillmentSnapshotError || !updatedReservation) {
      return checkoutError(requestId, stage, 'CHECKOUT_INTERNAL_ERROR', 'Unable to save the delivery plan for this checkout.', 500, fulfillmentSnapshotError);
    }
    reservationExpectedTotal = Number(updatedReservation.expected_total_paid);
    if (!Number.isFinite(reservationExpectedTotal) || reservationExpectedTotal <= 0) {
      return checkoutError(requestId, stage, 'CHECKOUT_INTERNAL_ERROR', 'Unable to prepare the database-verified checkout total.', 500);
    }

    if (indiaShipping) {
      const { error: auditError } = await serviceClient
        .from('fulfillment_quote_audits')
        .upsert({
          reservation_id: reservationId,
          provider: 'shiprocket',
          courier_company_id: indiaShipping.quote.courierId,
          courier_name: indiaShipping.quote.courierName,
          courier_cost: indiaShipping.quote.courierCost,
          customer_shipping_charge: indiaShipping.customerShippingCharge,
          free_shipping: indiaShipping.freeShipping,
          contribution_rupees: indiaShipping.contributionRupees,
          margin_percent: indiaShipping.marginPercent,
          minimum_contribution_rupees: indiaShipping.minimumContributionRupees,
          minimum_margin_percent: indiaShipping.minimumMarginPercent,
          shipment_weight_kg: Math.round(indiaShipping.weightKg * 1000) / 1000,
          delivery_postcode: indiaShipping.deliveryPostcode,
          quoted_at: new Date().toISOString(),
        }, { onConflict: 'reservation_id' });
      if (auditError) {
        return checkoutError(requestId, stage, 'CHECKOUT_INTERNAL_ERROR', 'Unable to lock in the India-delivery quote safely. No payment was started.', 500, auditError);
      }
    }

    stage = 'CASH_RESERVATION';
    const [, cashResult] = await Promise.all([
      deliveryCoordinates
        ? saveReservationLocationSnapshot(serviceClient, reservationId, user.id, deliveryCoordinates)
        : Promise.resolve(true),
      serviceClient.rpc('reserve_zeshu_cash_redemption', {
        p_user_id: user.id,
        p_reservation_id: reservationId,
        p_requested_amount: requestedZeshuCash,
      }),
    ]);
    const { data: cashData, error: cashError } = cashResult;
    if (cashError) {
      if (process.env.NODE_ENV === 'development') {
        const { data: reservationDiagnostics } = await serviceClient
          .from('inventory_reservations')
          .select('status,merchandise_subtotal,expected_total_paid,pre_reward_total_paid,expires_at')
          .eq('id', reservationId)
          .maybeSingle();
        console.error('[checkout]', { requestId, stage: 'CASH_RESERVATION', code: 'CASH_RESERVATION_FAILED', errorType: cashError.name || 'SupabaseError' });
        console.error('[checkout] cash diagnostics', {
          reservationId: String(reservationId),
          reservationStatus: String(reservationDiagnostics?.status ?? ''),
          merchandiseSubtotal: String(reservationDiagnostics?.merchandise_subtotal ?? ''),
          requestedZeshuCash: String(requestedZeshuCash),
        });
      }
      return checkoutError(requestId, stage, 'CASH_RESERVATION_FAILED', 'Unable to reserve Zeshu Cash for checkout.', 409, cashError);
    }
    const cashReservation = Array.isArray(cashData) ? cashData[0] : cashData;
    const expectedTotalPaid = Number(cashReservation?.expected_total_paid ?? reservationExpectedTotal);
    const amountPaise = Math.round(expectedTotalPaid * 100);
    if (!Number.isFinite(expectedTotalPaid) || expectedTotalPaid <= 0 || !Number.isSafeInteger(amountPaise) || amountPaise <= 0) {
      return checkoutError(requestId, stage, 'CHECKOUT_INTERNAL_ERROR', 'Unable to prepare the database-verified checkout total.', 500);
    }

    stage = 'RAZORPAY_CREATE';
    let order;
    try {
      order = await razorpay.orders.create({ amount: amountPaise, currency: 'INR', receipt: `zeshu_${Date.now()}`, notes: { user_id: user.id, transaction_type: 'grocery', zeshu_cash_used: String(cashReservation?.approved_amount || 0) } });
    } catch (error) {
      return checkoutError(requestId, stage, 'RAZORPAY_CREATE_FAILED', "We couldn't start the payment service. Please try again.", 502, error);
    }

    stage = 'RESERVATION_BIND';
    if (cashReservation?.redemption_id) {
      const { error: cashBindError } = await serviceClient.rpc('bind_zeshu_cash_redemption', { p_redemption_id: cashReservation.redemption_id, p_razorpay_order_id: order.id });
      if (cashBindError) return checkoutError(requestId, stage, 'RESERVATION_BIND_FAILED', 'Unable to bind the checkout reservation. Please try again.', 500, cashBindError);
    }

    const { error: bindError } = await serviceClient.rpc('bind_reservation_razorpay_order', {
      p_user_id: user.id,
      p_reservation_id: reservationId,
      p_razorpay_order_id: order.id,
    });
    if (bindError) return checkoutError(requestId, stage, 'RESERVATION_BIND_FAILED', 'Unable to bind the checkout reservation. Please try again.', 500, bindError);

    stage = 'COMPLETE';
    return NextResponse.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      totalAmount: expectedTotalPaid,
      zeshuCashUsed: Number(cashReservation?.approved_amount || 0),
      redemptionId: cashReservation?.redemption_id || null,
      reservationId,
      fulfillmentMode: checkoutFulfillmentMode,
      shippingCharge: indiaShipping?.customerShippingCharge || 0,
      freeShipping: indiaShipping?.freeShipping === true,
      courierName: indiaShipping?.quote.courierName || null,
      estimatedDeliveryDays: indiaShipping?.quote.estimatedDeliveryDays ?? null,
      requestId,
    });
  } catch (error) {
    return checkoutError(requestId, stage, 'CHECKOUT_INTERNAL_ERROR', 'We couldn\'t prepare your checkout. Please try again.', 500, error);
  }
}
