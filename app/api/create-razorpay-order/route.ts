import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Razorpay from 'razorpay';

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

const reservationErrorResponse = (message?: string) => {
  if (message === 'an active payment checkout already exists') {
    return NextResponse.json({ success: false, error: 'You already have a payment checkout in progress. Complete it or try again after a few minutes.' }, { status: 409 });
  }
  if (message === 'invalid reservation request' || message === 'invalid reservation items') {
    return NextResponse.json({ success: false, error: 'Your cart or delivery details are no longer available. Refresh and try again.' }, { status: 400 });
  }
  return NextResponse.json({ success: false, error: 'Unable to reserve inventory for checkout. Please try again.' }, { status: 500 });
};

export async function POST(request: Request) {
  try {
    const authorization = request.headers.get('authorization');
    if (!authorization?.startsWith('Bearer ')) return NextResponse.json({ success: false, error: 'Authentication required.' }, { status: 401 });

    const accessToken = authorization.slice('Bearer '.length).trim();
    if (!accessToken) return NextResponse.json({ success: false, error: 'Your customer session has expired. Please sign in again.' }, { status: 401 });
    const authClient = createClient(url, anonKey);
    const { data: { user }, error: authError } = await authClient.auth.getUser(accessToken);
    if (authError || !user) return NextResponse.json({ success: false, error: 'Your customer session has expired. Please sign in again.' }, { status: 401 });

    const body = await request.json();
    if (body.service) return NextResponse.json({ success: false, error: 'Recharge and bill-payment fulfillment is unavailable. No payment was started.' }, { status: 503 });

  const cartItems = body.cartItems as CartItem[];
  const deliveryAddress = typeof body.deliveryAddress === 'string' ? body.deliveryAddress.trim() : '';
  const tip = Number(body.tipAmount);
    const requestedZeshuCash = body.zeshuCashAmount === undefined ? 0 : Number(body.zeshuCashAmount);
    if (!Array.isArray(cartItems) || cartItems.length === 0 || deliveryAddress.length < 8 || !Number.isFinite(tip) || ![0, 20, 30, 50].includes(tip) || !Number.isFinite(requestedZeshuCash) || requestedZeshuCash < 0 || typeof body.hasZeshuPass !== 'boolean' || typeof body.isDonating !== 'boolean') {
      return NextResponse.json({ success: false, error: 'Invalid checkout data.' }, { status: 400 });
    }

    const reservationItems: ReservationItem[] = cartItems.map(({ item, qty }) => ({ product_id: String(item?.id ?? ''), quantity: Number(qty) }));
    if (reservationItems.some((item) => !item.product_id || !Number.isInteger(item.quantity) || item.quantity <= 0)) {
      return NextResponse.json({ success: false, error: 'Invalid cart item.' }, { status: 400 });
    }

    if (process.env.NODE_ENV === 'development') {
      console.info('create_inventory_reservation input', {
        cartLength: cartItems.length,
        cartProductIds: reservationItems.map((item) => item.product_id),
        cartQuantities: reservationItems.map((item) => item.quantity),
        hasDeliveryAddress: deliveryAddress.length > 0,
        deliveryAddressLength: deliveryAddress.length,
        hasAuthenticatedUser: Boolean(user),
        hasCoordinates: false,
      });
    }

    const serviceClient = createClient(url, serviceRoleKey);
    await serviceClient.rpc('release_expired_zeshu_cash_redemptions');
    const { data: adminRole, error: adminRoleError } = await serviceClient.from('admin_roles').select('user_id').eq('user_id', user.id).eq('role', 'admin').maybeSingle();
    if (adminRoleError) return NextResponse.json({ success: false, error: 'Unable to verify checkout identity.' }, { status: 500 });
    if (adminRole) return NextResponse.json({ success: false, error: 'Admin sessions cannot be used for customer checkout. Sign in with a customer account.' }, { status: 403 });

    const { data: customerProfile, error: customerProfileError } = await serviceClient.from('users').select('id').eq('id', user.id).maybeSingle();
    if (customerProfileError) return NextResponse.json({ success: false, error: 'Unable to verify customer profile.' }, { status: 500 });
    if (!customerProfile) return NextResponse.json({ success: false, error: 'Customer profile required before checkout. Please sign in with your customer account.' }, { status: 403 });

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) return NextResponse.json({ success: false, error: 'Payment service is unavailable.' }, { status: 503 });
    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });

    const canonicalRequestedItems = canonicalizeItems(reservationItems);
    const { data: resumableData, error: resumableError } = await serviceClient.rpc('get_resumable_inventory_reservation', { p_user_id: user.id });
    if (resumableError) return NextResponse.json({ success: false, error: 'Unable to check existing checkout state.' }, { status: 500 });
    const resumable = (Array.isArray(resumableData) ? resumableData[0] : resumableData) as ResumableReservation | null;

    const { data: expiredBoundReservation, error: expiredReservationError } = await serviceClient
      .from('inventory_reservations')
      .select('id')
      .eq('user_id', user.id)
      .in('status', ['EXPIRED', 'PAYMENT_PENDING'])
      .lte('expires_at', new Date().toISOString())
      .not('razorpay_order_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (expiredReservationError) return NextResponse.json({ success: false, error: 'Unable to check previous payment state.' }, { status: 500 });
    if (expiredBoundReservation) {
      return NextResponse.json({
        success: false,
        code: 'PAYMENT_RECONCILIATION_REQUIRED',
        error: "That payment session expired. We're checking the previous payment before starting a new checkout.",
      }, { status: 409 });
    }

    if (resumable?.reservation_id) {
      const existingItems = canonicalizeItems((resumable.reservation_items || []).map((item) => ({ product_id: String(item.product_id), quantity: Number(item.quantity) })));
      const sameItems = JSON.stringify(existingItems) === JSON.stringify(canonicalRequestedItems);
      const requestedProductIds = canonicalRequestedItems.map((item) => item.product_id);
      const { data: currentProducts, error: currentProductsError } = await serviceClient.from('products').select('id,price,vendor_id').in('id', requestedProductIds);
      if (currentProductsError) return NextResponse.json({ success: false, error: 'Unable to verify checkout products.' }, { status: 500 });
      const products = currentProducts || [];
      const productsById = new Map(products.map((product) => [String(product.id), product]));
      const sameProductSet = products.length === requestedProductIds.length && requestedProductIds.every((id) => productsById.has(id));
      const vendors = products.map((product) => product.vendor_id).filter(Boolean);
      const currentVendorId = vendors.length > 0 && vendors.every((vendorId) => vendorId === vendors[0]) ? vendors[0] : null;
      const merchandiseSubtotal = sameProductSet && currentVendorId
        ? canonicalRequestedItems.reduce((sum, item) => sum + Number(productsById.get(item.product_id)?.price || 0) * item.quantity, 0)
        : NaN;
      const smallCartFee = Number.isFinite(merchandiseSubtotal) && merchandiseSubtotal > 0 && merchandiseSubtotal < 199 ? 29 : 0;
      const deliveryFee = body.hasZeshuPass ? 0 : Number.isFinite(merchandiseSubtotal) && merchandiseSubtotal > 0 && merchandiseSubtotal < 299 ? 30 : 0;
      const expectedPricing = {
        small_cart_fee: smallCartFee,
        delivery_fee: deliveryFee,
        handling_fee: 5,
        donation: body.isDonating ? 1 : 0,
        tip,
        pass_fee: body.hasZeshuPass ? 99 : 0,
        discount_total: 0,
      };
      const snapshot = resumable.pricing_snapshot || {};
      const samePricing = Object.entries(expectedPricing).filter(([key]) => key !== 'discount_total').every(([key, value]) => sameNumber(snapshot[key], value));
      const existingCashDiscount = Number(snapshot.zeshu_cash_redemption || snapshot.discount_total || 0);
      const expectedTotal = Number.isFinite(merchandiseSubtotal)
        ? merchandiseSubtotal + expectedPricing.small_cart_fee + expectedPricing.delivery_fee + expectedPricing.handling_fee + expectedPricing.donation + expectedPricing.tip + expectedPricing.pass_fee
        : NaN;
      const sameCheckout = sameItems
        && sameProductSet
        && currentVendorId === resumable.vendor_id
        && resumable.delivery_address === deliveryAddress
        && samePricing
        && sameNumber(existingCashDiscount, requestedZeshuCash)
        && sameNumber(resumable.expected_total_paid, expectedTotal - existingCashDiscount);
      if (!sameCheckout) return reservationErrorResponse('an active payment checkout already exists');

      const { data: resumedCashData, error: resumedCashError } = await serviceClient.rpc('reserve_zeshu_cash_redemption', {
        p_user_id: user.id,
        p_reservation_id: resumable.reservation_id,
        p_requested_amount: requestedZeshuCash,
      });
      if (resumedCashError) {
        if (process.env.NODE_ENV === 'development') {
          const { data: reservationDiagnostics } = await serviceClient
            .from('inventory_reservations')
            .select('status,merchandise_subtotal,expected_total_paid,pre_reward_total_paid,expires_at')
            .eq('id', resumable.reservation_id)
            .maybeSingle();
          console.error(
            'reserve_zeshu_cash_redemption failed',
            'code=', String(resumedCashError.code ?? ''),
            'message=', String(resumedCashError.message ?? ''),
            'details=', String(resumedCashError.details ?? ''),
            'hint=', String(resumedCashError.hint ?? '')
          );
          console.error(
            'reserve_zeshu_cash_redemption diagnostics',
            'reservationId=', String(resumable.reservation_id),
            'reservationStatus=', String(reservationDiagnostics?.status ?? ''),
            'merchandiseSubtotal=', String(reservationDiagnostics?.merchandise_subtotal ?? ''),
            'requestedZeshuCash=', String(requestedZeshuCash)
          );
        }
        return NextResponse.json({ success: false, error: 'Unable to reserve Zeshu Cash for checkout.' }, { status: 409 });
      }
      const resumedCash = Array.isArray(resumedCashData) ? resumedCashData[0] : resumedCashData;
      const resumedExpectedTotal = Number(resumedCash?.expected_total_paid ?? resumable.expected_total_paid);

      try {
        const existingOrder = await razorpay.orders.fetch(resumable.razorpay_order_id);
        const paymentsResponse = await razorpay.orders.fetchPayments(resumable.razorpay_order_id);
        const payments = Array.isArray(paymentsResponse?.items) ? paymentsResponse.items : [];
        const orderStatus = String(existingOrder?.status || '').toLowerCase();
        const payable = (orderStatus === 'created' && payments.length === 0)
          || (orderStatus === 'attempted' && payments.length > 0 && payments.every((payment) => String(payment?.status || '').toLowerCase() === 'failed'));
        if (!payable) return NextResponse.json({ success: false, code: 'PAYMENT_RECONCILIATION_REQUIRED', error: "We're checking your payment status. Please wait a moment before retrying." }, { status: 409 });
        if (resumedCash?.redemption_id) await serviceClient.rpc('bind_zeshu_cash_redemption', { p_redemption_id: resumedCash.redemption_id, p_razorpay_order_id: existingOrder.id });
        return NextResponse.json({ success: true, resumed: true, resumePayment: true, orderId: existingOrder.id, amount: existingOrder.amount, currency: existingOrder.currency, totalAmount: resumedExpectedTotal, zeshuCashUsed: Number(resumedCash?.approved_amount || 0), redemptionId: resumedCash?.redemption_id || null, reservationId: resumable.reservation_id });
      } catch (error) {
        if (process.env.NODE_ENV !== 'production') console.error('Existing Razorpay checkout lookup failed', error instanceof Error ? error.message : 'unknown error');
        return NextResponse.json({ success: false, code: 'PAYMENT_RECONCILIATION_REQUIRED', error: "We're checking your payment status. Please wait a moment before retrying." }, { status: 409 });
      }
    }

    const { data: reservationData, error: reservationError } = await serviceClient.rpc('create_inventory_reservation', {
      p_user_id: user.id,
      p_items: reservationItems,
      p_delivery_address: deliveryAddress,
      p_has_zeshu_pass: body.hasZeshuPass,
      p_is_donating: body.isDonating,
      p_tip: tip,
    });
    if (reservationError) {
      if (process.env.NODE_ENV === 'development') {
        console.error('create_inventory_reservation failed', {
          message: reservationError.message,
          cartLength: cartItems.length,
          cartProductIds: reservationItems.map((item) => item.product_id),
          cartQuantities: reservationItems.map((item) => item.quantity),
          hasDeliveryAddress: deliveryAddress.length > 0,
          deliveryAddressLength: deliveryAddress.length,
          hasAuthenticatedUser: Boolean(user),
          hasCoordinates: false,
        });
      }
      return reservationErrorResponse(reservationError.message);
    }

    const reservation = Array.isArray(reservationData) ? reservationData[0] : reservationData;
    const reservationId = reservation?.reservation_id;
    const reservationExpectedTotal = Number(reservation?.expected_total_paid);
    if (typeof reservationId !== 'string' || !Number.isFinite(reservationExpectedTotal) || reservationExpectedTotal <= 0) {
      return NextResponse.json({ success: false, error: 'Unable to prepare the database-verified checkout total.' }, { status: 500 });
    }
    const { data: cashData, error: cashError } = await serviceClient.rpc('reserve_zeshu_cash_redemption', {
      p_user_id: user.id,
      p_reservation_id: reservationId,
      p_requested_amount: requestedZeshuCash,
    });
    if (cashError) {
      if (process.env.NODE_ENV === 'development') {
        const { data: reservationDiagnostics } = await serviceClient
          .from('inventory_reservations')
          .select('status,merchandise_subtotal,expected_total_paid,pre_reward_total_paid,expires_at')
          .eq('id', reservationId)
          .maybeSingle();
        console.error(
          'reserve_zeshu_cash_redemption failed',
          'code=', String(cashError.code ?? ''),
          'message=', String(cashError.message ?? ''),
          'details=', String(cashError.details ?? ''),
          'hint=', String(cashError.hint ?? '')
        );
        console.error(
          'reserve_zeshu_cash_redemption diagnostics',
          'reservationId=', String(reservationId),
          'reservationStatus=', String(reservationDiagnostics?.status ?? ''),
          'merchandiseSubtotal=', String(reservationDiagnostics?.merchandise_subtotal ?? ''),
          'requestedZeshuCash=', String(requestedZeshuCash)
        );
      }
      return NextResponse.json({ success: false, error: 'Unable to reserve Zeshu Cash for checkout.' }, { status: 409 });
    }
    const cashReservation = Array.isArray(cashData) ? cashData[0] : cashData;
    const expectedTotalPaid = Number(cashReservation?.expected_total_paid ?? reservationExpectedTotal);
    const amountPaise = Math.round(expectedTotalPaid * 100);
    if (!Number.isFinite(expectedTotalPaid) || expectedTotalPaid <= 0 || !Number.isSafeInteger(amountPaise) || amountPaise <= 0) {
      return NextResponse.json({ success: false, error: 'Unable to prepare the database-verified checkout total.' }, { status: 500 });
    }

    const order = await razorpay.orders.create({ amount: amountPaise, currency: 'INR', receipt: `zeshu_${Date.now()}`, notes: { user_id: user.id, transaction_type: 'grocery', zeshu_cash_used: String(cashReservation?.approved_amount || 0) } });

    if (cashReservation?.redemption_id) {
      const { error: cashBindError } = await serviceClient.rpc('bind_zeshu_cash_redemption', { p_redemption_id: cashReservation.redemption_id, p_razorpay_order_id: order.id });
      if (cashBindError) return NextResponse.json({ success: false, error: 'Unable to bind Zeshu Cash checkout reservation.' }, { status: 500 });
    }

    const { error: bindError } = await serviceClient.rpc('bind_reservation_razorpay_order', {
      p_user_id: user.id,
      p_reservation_id: reservationId,
      p_razorpay_order_id: order.id,
    });
    if (bindError) return reservationErrorResponse(bindError.message);

    return NextResponse.json({ success: true, orderId: order.id, amount: order.amount, currency: order.currency, totalAmount: expectedTotalPaid, zeshuCashUsed: Number(cashReservation?.approved_amount || 0), redemptionId: cashReservation?.redemption_id || null, reservationId });
  } catch {
    return NextResponse.json({ success: false, error: 'Unable to create payment order.' }, { status: 500 });
  }
}
