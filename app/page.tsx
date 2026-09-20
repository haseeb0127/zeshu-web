// /* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import Script from 'next/script';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import OrderStatusTimeline from './components/OrderStatusTimeline';
import ProductCard from './components/ProductCard';
import ReviewForm, { ReviewProduct } from './components/ReviewForm';
import LocationSelector from './components/LocationSelector';
import { 
  Mic, MapPin, Search, User, ChevronRight, Zap, Smartphone, 
  Tv, HeartHandshake, Plus, Minus, ShoppingBag, X, LogOut, Ticket, QrCode,
  Droplets, Wifi, Car, Landmark, ShieldCheck, PhoneCall, Phone, Package, Flame, BadgeCheck,
  History, ChevronDown, CheckSquare, Square, Clock, CheckCircle, Menu, Info, AlertCircle, BookUser, Truck, Receipt, SlidersHorizontal,
  Crown, MessageCircle 
} from 'lucide-react';
import { customerSupabase } from './lib/browser-supabase';

const supabase = customerSupabase();
const SUPPORT_WHATSAPP_UI_ENABLED = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP_UI_ENABLED === 'true';

const SERVICES = [
  { id: 'mobile', label: 'Prepaid', icon: <Smartphone size={28} strokeWidth={1.5}/>, color: 'bg-[#EEF2FF] text-[#4F46E5] group-hover:bg-[#4F46E5] group-hover:text-white', inputLabel: 'Mobile Number' },
  { id: 'electricity', label: 'Electricity', icon: <Zap size={28} strokeWidth={1.5}/>, color: 'bg-[#FEF3C7] text-[#D97706] group-hover:bg-[#F59E0B] group-hover:text-white', inputLabel: 'Consumer Number' },
  { id: 'dth', label: 'DTH', icon: <Tv size={28} strokeWidth={1.5}/>, color: 'bg-[#FFEDD5] text-[#EA580C] group-hover:bg-[#F97316] group-hover:text-white', inputLabel: 'DTH / VC Number' },
  { id: 'upi', label: 'UPI Tools', icon: <BadgeCheck size={28} strokeWidth={1.5}/>, color: 'bg-[#E0F2FE] text-[#0284C7] group-hover:bg-[#0EA5E9] group-hover:text-white', inputLabel: 'UPI ID or Mobile No.' },
  { id: 'pharmacy', label: 'Pharmacy', icon: <HeartHandshake size={28} strokeWidth={1.5}/>, color: 'bg-[#ECFDF5] text-[#059669] group-hover:bg-[#059669] group-hover:text-white', inputLabel: 'Search Medicines (e.g. Dolo 650)' },
  { id: 'fastag', label: 'FASTag', icon: <Car size={28} strokeWidth={1.5}/>, color: 'bg-[#D1FAE5] text-[#059669] group-hover:bg-[#10B981] group-hover:text-white', inputLabel: 'Vehicle Registration No.' },
  { id: 'lpg', label: 'Gas Booking', icon: <Package size={28} strokeWidth={1.5}/>, color: 'bg-[#FFE4E6] text-[#E11D48] group-hover:bg-[#E11D48] group-hover:text-white', inputLabel: 'Consumer Number / ID' },
  { id: 'gas', label: 'Piped Gas', icon: <Flame size={28} strokeWidth={1.5}/>, color: 'bg-[#FEE2E2] text-[#DC2626] group-hover:bg-[#EF4444] group-hover:text-white', inputLabel: 'Consumer Number' },
  { id: 'water', label: 'Water Bill', icon: <Droplets size={28} strokeWidth={1.5}/>, color: 'bg-[#CFFAFE] text-[#0891B2] group-hover:bg-[#06B6D4] group-hover:text-white', inputLabel: 'Account / Consumer No.' },
  { id: 'broadband', label: 'Broadband', icon: <Wifi size={28} strokeWidth={1.5}/>, color: 'bg-[#FAE8FF] text-[#C026D3] group-hover:bg-[#D946EF] group-hover:text-white', inputLabel: 'Subscriber / User ID' },
];

const OPERATORS_DATA: any = {
  mobile: { 'JIO': '11', 'Airtel': '2', 'Vodafone': '23', 'Idea': '6', 'BSNL': '4' },
  electricity: { 'TSSPDCL': '474', 'TSNPDCL': '475', 'Adani Electricity': '50', 'Tata Power': '116', 'BSES Rajdhani': '449' },
  lpg: { 'Bharat Gas': '214', 'HP Gas': '215', 'Indane Gas': '216' },
  gas: { 'MAHANAGAR GAS': '62', 'INDRAPRASTHA GAS': '63', 'GUJARAT GAS': '64', 'Adani Gas': '154' },
};

type PendingGroceryConfirmation = {
  userId: string;
  reservationId: string;
  paymentId: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

type CheckoutErrorState = { message: string; code?: string; requestId?: string };

type AccountView = 'HOME' | 'CASH' | 'ORDERS' | 'ADDRESSES' | 'REFERRAL' | 'SUPPORT' | 'POLICIES' | 'PASS' | 'SUBSCRIBE' | 'SERVICES' | 'SETTINGS';

const CHECKOUT_ERROR_MESSAGES: Record<string, string> = {
  AUTH_REQUIRED: 'Please sign in before checkout.',
  SESSION_EXPIRED: 'Your customer session has expired. Please sign in again.',
  INVALID_CHECKOUT_DATA: 'Please review your cart and delivery address.',
  INVALID_CART_ITEM: 'One or more cart items are invalid. Please review your cart.',
  ADMIN_CHECKOUT_FORBIDDEN: 'Admin sessions cannot be used for customer checkout. Sign in with a customer account.',
  CUSTOMER_PROFILE_REQUIRED: 'Customer profile required before checkout. Please sign in with your customer account.',
  PAYMENT_SERVICE_UNAVAILABLE: 'Payment service is temporarily unavailable. Please try again later.',
  MULTI_VENDOR_CART: "Items from different stores can't be combined in one order yet. Please order from one store at a time.",
  PRODUCT_UNAVAILABLE: 'One or more items are currently unavailable.',
  INSUFFICIENT_STOCK: 'Some items are no longer available in the requested quantity.',
  ACTIVE_PAYMENT_CHECKOUT: 'You already have a payment checkout in progress. Complete it or try again after a few minutes.',
  PAYMENT_RECONCILIATION_REQUIRED: "We're checking your previous payment. Please wait a moment before retrying.",
  CASH_RESERVATION_FAILED: 'Unable to reserve Zeshu Cash for checkout. Please try again.',
  PRODUCT_LOOKUP_FAILED: "We couldn't verify the products in your cart. Please try again.",
  RESERVATION_CREATE_FAILED: "We couldn't prepare your checkout. Please try again.",
  RAZORPAY_CREATE_FAILED: "We couldn't start the payment service. Please try again.",
  RESERVATION_BIND_FAILED: 'Unable to bind the checkout reservation. Please try again.',
  CHECKOUT_INTERNAL_ERROR: "We couldn't prepare your checkout. Please try again.",
};

const checkoutFailureMessage = (code: unknown) => String(code || '') === 'ABANDONABLE_PAYMENT_CHECKOUT'
  ? 'Your previous payment attempt belongs to an older basket. We can safely close that checkout before starting this one.'
  : CHECKOUT_ERROR_MESSAGES[String(code || '')] || CHECKOUT_ERROR_MESSAGES.CHECKOUT_INTERNAL_ERROR;

type CustomerAddress = {
  id: string;
  label: string;
  recipient_name: string | null;
  phone: string | null;
  address_line: string;
  landmark: string | null;
  city: string;
  state: string;
  postal_code: string | null;
  latitude: number | null;
  longitude: number | null;
  location_accuracy_meters?: number | null;
  location_source?: 'DEVICE' | 'MANUAL_PIN' | 'LEGACY' | null;
  is_default: boolean;
};

type ConfirmedLocationCache = {
  latitude: number;
  longitude: number;
  displayAddress?: string;
  accuracy?: number | null;
  source?: 'DEVICE' | 'MANUAL_PIN';
  confirmed_at: string;
};

const LAST_CONFIRMED_LOCATION_KEY = 'zeshu:last-confirmed-location:v1';

const isValidLocationCoordinate = (latitude: unknown, longitude: unknown) => {
  return typeof latitude === 'number' && typeof longitude === 'number'
    && Number.isFinite(latitude) && Number.isFinite(longitude)
    && latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;
};

const parseConfirmedLocationCache = (value: string | null): ConfirmedLocationCache | null => {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;
    if (typeof parsed.latitude !== 'number' || typeof parsed.longitude !== 'number' || !isValidLocationCoordinate(parsed.latitude, parsed.longitude) || typeof parsed.confirmed_at !== 'string' || !Number.isFinite(new Date(parsed.confirmed_at).getTime())) return null;
    if (parsed.displayAddress !== undefined && typeof parsed.displayAddress !== 'string') return null;
    if (parsed.accuracy !== undefined && parsed.accuracy !== null && (typeof parsed.accuracy !== 'number' || !Number.isFinite(parsed.accuracy) || parsed.accuracy < 0)) return null;
    if (parsed.source !== undefined && parsed.source !== 'DEVICE' && parsed.source !== 'MANUAL_PIN') return null;
    const result: ConfirmedLocationCache = {
      latitude: parsed.latitude,
      longitude: parsed.longitude,
      confirmed_at: parsed.confirmed_at,
    };
    if (typeof parsed.displayAddress === 'string' && parsed.displayAddress.trim()) result.displayAddress = parsed.displayAddress.trim();
    if (parsed.accuracy === null) result.accuracy = null;
    else if (typeof parsed.accuracy === 'number') result.accuracy = parsed.accuracy;
    if (parsed.source === 'DEVICE' || parsed.source === 'MANUAL_PIN') result.source = parsed.source;
    return result;
  } catch {
    return null;
  }
};

const readConfirmedLocationCache = () => {
  if (typeof window === 'undefined') return null;
  try {
    return parseConfirmedLocationCache(window.localStorage.getItem(LAST_CONFIRMED_LOCATION_KEY));
  } catch {
    return null;
  }
};

const parseHistoricalOrderItems = (order: any): Array<{ productId: string; quantity: number }> => {
  if (!Array.isArray(order?.items)) return [];
  const quantities = new Map<string, number>();
  order.items.forEach((entry: any) => {
    const productId = String(entry?.item?.id ?? entry?.product_id ?? '');
    const quantity = Number(entry?.qty ?? entry?.quantity ?? 0);
    if (productId && Number.isInteger(quantity) && quantity > 0) quantities.set(productId, (quantities.get(productId) || 0) + quantity);
  });
  return Array.from(quantities, ([productId, quantity]) => ({ productId, quantity }));
};

const PENDING_GROCERY_CONFIRMATION_KEY = 'zeshu_pending_grocery_confirmation';
const CART_STORAGE_KEY = 'zeshu_customer_cart';
const DELIVERY_ADDRESS_STORAGE_KEY = 'zeshu_delivery_address';
const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Order placed', CONFIRMED: 'Confirmed', PREPARING: 'Being prepared',
  READY_FOR_PICKUP: 'Ready for pickup', PICKED_UP: 'Picked up',
  OUT_FOR_DELIVERY: 'Out for delivery', DELIVERED: 'Delivered', CANCELLED: 'Cancelled',
};
const ACTIVE_ORDER_STATUSES = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'PICKED_UP', 'OUT_FOR_DELIVERY'];
const PRIMARY_PLAN_FILTERS = ['All', 'Popular', 'Unlimited', 'Data', 'Talktime', 'Entertainment', 'Annual', 'Special Offers'] as const;

type RiderLocationFreshness = {
  label: 'Live location' | 'Location delayed' | 'Last known location';
  ageMinutes?: number;
};

const getRiderLocationFreshness = (locationUpdatedAt: unknown, now: number): RiderLocationFreshness | null => {
  if (typeof locationUpdatedAt !== 'string' || !locationUpdatedAt.trim()) return null;
  const timestamp = Date.parse(locationUpdatedAt);
  if (!Number.isFinite(timestamp)) return null;
  const ageMs = now - timestamp;
  if (ageMs < 0) return null;
  if (ageMs <= 2 * 60 * 1000) return { label: 'Live location' };
  const ageMinutes = Math.floor(ageMs / 60_000);
  if (ageMs <= 5 * 60 * 1000) return { label: 'Location delayed', ageMinutes };
  return { label: 'Last known location', ageMinutes };
};

function planText(plan: any) {
  return `${plan?.category || ''} ${plan?.description || ''} ${plan?.validity || ''}`.toLowerCase();
}

function validityDays(value: unknown) {
  const text = String(value || '').toLowerCase();
  if (/active plan|calendar\s*month/.test(text)) return 30;
  const match = text.match(/(\d+)\s*(?:day|days)/);
  return match ? Number(match[1]) : 0;
}

function matchesPlanFilter(plan: any, filter: string) {
  const text = planText(plan);
  if (filter === 'All') return true;
  if (filter === 'Special Offers') return false;
  if (filter === 'Popular') return /popular|recommended/.test(text);
  if (filter === 'Unlimited') return /unlimited|5g\s*unlimited/.test(text);
  if (filter === 'Data') return /data|internet|\bgb\b|\bmb\b|data pack/.test(text);
  if (filter === 'Talktime') return /talk\s*time|top\s*-?\s*up|topup|voice/.test(text);
  if (filter === 'Entertainment') return /entertainment|ott|netflix|jiohotstar|sonyliv|zee5|prime|fancode/.test(text);
  if (filter === 'Annual') return /annual|yearly|365\s*days|336\s*days|long validity/.test(text) || validityDays(plan?.validity) >= 180;
  return String(plan?.category || '').toLowerCase() === filter.toLowerCase();
}

function dedupePlans(plans: any[]) {
  const grouped = new Map<string, any>();
  plans.forEach((plan) => {
    const key = `${Number(plan.amount)}|${String(plan.validity || '').trim().toLowerCase()}|${String(plan.description || '').trim().toLowerCase()}`;
    const existing = grouped.get(key);
    if (!existing) grouped.set(key, { ...plan, categories: [plan.category].filter(Boolean) });
    else if (plan.category && !existing.categories.includes(plan.category)) existing.categories.push(plan.category);
  });
  return Array.from(grouped.values()).map((plan) => ({ ...plan, category: plan.categories.join(' · ') || plan.category }));
}

function formatDthMetric(value: unknown, label: string) {
  const text = String(value ?? '').trim();
  if (!text) return '';
  return /^\d+(?:\.\d+)?$/.test(text) ? `${text} ${label}` : text;
}

const electricityLabels: Record<string, string> = { customerName: 'Customer name', dueAmount: 'Due amount', dueDate: 'Due date', billNumber: 'Bill number', billDate: 'Bill date', balance: 'Balance', billPeriod: 'Bill period' };

export default function ZeshuSuperApp() {
  const [activeTab, setActiveTab] = useState('home'); 
  const [activeService, setActiveService] = useState('mobile');
  const [products, setProducts] = useState<any[]>([]);
  const [banners, setBanners] = useState<string[]>([]);
  const [myOrders, setMyOrders] = useState<any[]>([]);
  const [recentlyPurchased, setRecentlyPurchased] = useState<any[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [favoriteProducts, setFavoriteProducts] = useState<any[]>([]);
  const [favoriteBusyId, setFavoriteBusyId] = useState<string | null>(null);
  const [frequentCategories, setFrequentCategories] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState(''); 
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [voiceSearchMessage, setVoiceSearchMessage] = useState('');
  const speechRecognitionRef = useRef<any>(null);
  const [cart, setCart] = useState<{item: any, qty: number}[]>([]);
  
  const [user, setUser] = useState<any>(null);
  const [rewardBalance, setRewardBalance] = useState(0);
  const [rewardHistory, setRewardHistory] = useState<any[]>([]);
  const [referralCode, setReferralCode] = useState('');
  const [referralInput, setReferralInput] = useState('');
  const [referralMessage, setReferralMessage] = useState('');
  const [referralApplying, setReferralApplying] = useState(false);
  const [referralCopied, setReferralCopied] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckoutOpening, setIsCheckoutOpening] = useState(false);
  const [checkoutError, setCheckoutError] = useState<CheckoutErrorState | null>(null);
  const [isCheckingPaymentStatus, setIsCheckingPaymentStatus] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');
  const [brandFilter, setBrandFilter] = useState('ALL');
  const [priceFilter, setPriceFilter] = useState<'ALL' | 'UNDER_100' | '100_299' | '300_499' | '500_PLUS'>('ALL');
  const [availabilityFilter, setAvailabilityFilter] = useState<'ALL' | 'AVAILABLE'>('ALL');
  const [productSort, setProductSort] = useState<'recommended' | 'price_asc' | 'price_desc' | 'name'>('recommended');
  const [isProductFiltersOpen, setIsProductFiltersOpen] = useState(false);
  
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [expandedCartSection, setExpandedCartSection] = useState<'ADDRESS' | 'CASH' | 'PRICE' | null>(null);
  const [useZeshuCash, setUseZeshuCash] = useState(false);
  const [zeshuCashAmount, setZeshuCashAmount] = useState('');
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [accountView, setAccountView] = useState<AccountView>('HOME');
  const [supportSubject, setSupportSubject] = useState('Order issue');
  const [supportMessage, setSupportMessage] = useState('');
  const [supportBusy, setSupportBusy] = useState(false);
  const [supportNotice, setSupportNotice] = useState('');
  const [supportConversations, setSupportConversations] = useState<any[]>([]);
  const [selectedSupportConversationId, setSelectedSupportConversationId] = useState<string | null>(null);
  const [supportThread, setSupportThread] = useState<{ conversation: any; messages: any[] } | null>(null);
  const [supportThreadMessage, setSupportThreadMessage] = useState('');
  const [supportThreadBusy, setSupportThreadBusy] = useState(false);
  const [supportThreadLoading, setSupportThreadLoading] = useState(false);
  const [supportAssistantQuestion, setSupportAssistantQuestion] = useState('');
  const [supportAssistantMessages, setSupportAssistantMessages] = useState<Array<{ role: 'CUSTOMER' | 'AI'; body: string }>>([]);
  const [supportAssistantAnswer, setSupportAssistantAnswer] = useState('');
  const [supportAssistantBusy, setSupportAssistantBusy] = useState(false);
  const [supportAssistantResolved, setSupportAssistantResolved] = useState<boolean | null>(null);
  const [supportAssistantSource, setSupportAssistantSource] = useState<'ai' | 'guided' | ''>('');
  const [supportThreadRefreshToken, setSupportThreadRefreshToken] = useState(0);
  const supportThreadRequestRef = useRef(false);
  const [supportWhatsappEnabled, setSupportWhatsappEnabled] = useState(false);
  const [supportWhatsappPhoneAvailable, setSupportWhatsappPhoneAvailable] = useState(false);
  const [supportWhatsappPreferenceLoading, setSupportWhatsappPreferenceLoading] = useState(false);
  const [supportWhatsappPreferenceLoaded, setSupportWhatsappPreferenceLoaded] = useState(false);
  const [supportWhatsappPreferenceSaving, setSupportWhatsappPreferenceSaving] = useState(false);
  const [supportWhatsappPreferenceError, setSupportWhatsappPreferenceError] = useState('');
  const supportWhatsappLoadedUserRef = useRef<string | null>(null);
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);
  const [trackedOrder, setTrackedOrder] = useState<any>(null);
  const [liveRider, setLiveRider] = useState<any>(null);
  const [riderLocationState, setRiderLocationState] = useState<'idle' | 'loading' | 'available' | 'unavailable'>('idle');
  const [riderFreshnessNow, setRiderFreshnessNow] = useState(0);
  const [isOffline, setIsOffline] = useState(false);
  const [etaState, setEtaState] = useState<'idle' | 'loading' | 'available' | 'fallback' | 'unavailable'>('idle');
  const [etaDetails, setEtaDetails] = useState<{ durationSeconds?: number; distanceMeters?: number; source?: string } | null>(null);
  
  const [currentAddress, setCurrentAddress] = useState('Location not set');
  const [isDetectingLoc, setIsDetectingLoc] = useState(true);
  const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null);
  const [locationSelectorOpen, setLocationSelectorOpen] = useState(false);
  const [locationSelection, setLocationSelection] = useState<{ latitude: number; longitude: number; accuracy: number | null; source: 'DEVICE' | 'MANUAL_PIN'; displayAddress?: string } | null>(null);
  const locationWatchRef = useRef<number | null>(null);
  const locationRetryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const locationRequestRef = useRef(0);
  
  const [rechargeNumber, setRechargeNumber] = useState('');
  const [rechargeAmount, setRechargeAmount] = useState('');
  const [selectedOperator, setSelectedOperator] = useState('');
  const [plans, setPlans] = useState<any[]>([]);
  const [fetchedBill, setFetchedBill] = useState<any>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [selectedPlanCategory, setSelectedPlanCategory] = useState("All");
  const [planDiscovery, setPlanDiscovery] = useState<any>(null);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [planDiscoveryError, setPlanDiscoveryError] = useState('');
  const [planDiscoveryLoading, setPlanDiscoveryLoading] = useState(false);
  const [planSort, setPlanSort] = useState<'recommended' | 'low' | 'high' | 'validity'>('recommended');
  const [planSearch, setPlanSearch] = useState('');
  const [showMorePlanCategories, setShowMorePlanCategories] = useState(false);
  const [planVisibleCount, setPlanVisibleCount] = useState(20);
  const [expandedPlanIds, setExpandedPlanIds] = useState<Set<string>>(new Set());
  const [planSelectionMessage, setPlanSelectionMessage] = useState('');
  const [testRechargeLoading, setTestRechargeLoading] = useState(false);
  const [dthPlans, setDthPlans] = useState<any[]>([]);
  const [dthOperator, setDthOperator] = useState<any>(null);
  const [dthInfo, setDthInfo] = useState<Record<string, string> | null>(null);
  const [dthLoading, setDthLoading] = useState(false);
  const [dthSearch, setDthSearch] = useState('');
  const [dthLanguageFilter, setDthLanguageFilter] = useState('All');
  const [selectedDthPlanId, setSelectedDthPlanId] = useState('');
  const [dthSelectionMessage, setDthSelectionMessage] = useState('');
  const [electricityOperators, setElectricityOperators] = useState<any[]>([]);
  const [electricitySearch, setElectricitySearch] = useState('');
  const [electricityOperator, setElectricityOperator] = useState<any>(null);
  const [electricityBillNumber, setElectricityBillNumber] = useState('');
  const [electricityBill, setElectricityBill] = useState<Record<string, string> | null>(null);
  const [electricityBillerInfo, setElectricityBillerInfo] = useState<any>(null);
  const [electricityLoading, setElectricityLoading] = useState(false);
  const [waterOperators, setWaterOperators] = useState<any[]>([]);
  const [waterSearch, setWaterSearch] = useState('');
  const [waterOperator, setWaterOperator] = useState<any>(null);
  const [waterBillNumber, setWaterBillNumber] = useState('');
  const [waterBill, setWaterBill] = useState<Record<string, string> | null>(null);
  const [waterBillerInfo, setWaterBillerInfo] = useState<any>(null);
  const [waterLoading, setWaterLoading] = useState(false);
  const [broadbandOperators, setBroadbandOperators] = useState<any[]>([]);
  const [broadbandSearch, setBroadbandSearch] = useState('');
  const [broadbandOperator, setBroadbandOperator] = useState<any>(null);
  const [broadbandConsumerNumber, setBroadbandConsumerNumber] = useState('');
  const [broadbandInfo, setBroadbandInfo] = useState<Record<string, string> | null>(null);
  const [broadbandBillerInfo, setBroadbandBillerInfo] = useState<any>(null);
  const [broadbandLoading, setBroadbandLoading] = useState(false);
  const [fastagOperators, setFastagOperators] = useState<any[]>([]);
  const [fastagSearch, setFastagSearch] = useState('');
  const [fastagOperator, setFastagOperator] = useState<any>(null);
  const [fastagVehicleNumber, setFastagVehicleNumber] = useState('');
  const [fastagInfo, setFastagInfo] = useState<Record<string, string> | null>(null);
  const [fastagLoading, setFastagLoading] = useState(false);
  const [pipedGasOperators, setPipedGasOperators] = useState<any[]>([]);
  const [pipedGasSearch, setPipedGasSearch] = useState('');
  const [pipedGasOperator, setPipedGasOperator] = useState<any>(null);
  const [pipedGasConsumerNumber, setPipedGasConsumerNumber] = useState('');
  const [pipedGasInfo, setPipedGasInfo] = useState<Record<string, string> | null>(null);
  const [pipedGasLoading, setPipedGasLoading] = useState(false);
  const [lpgOperators, setLpgOperators] = useState<any[]>([]);
  const [lpgSearch, setLpgSearch] = useState('');
  const [lpgOperator, setLpgOperator] = useState<any>(null);
  const [lpgLoading, setLpgLoading] = useState(false);

  const [medSearchQuery, setMedSearchQuery] = useState('');
  const [medResults, setMedResults] = useState<any>(null);
  
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [contentError, setContentError] = useState(false);
  const [productsLoading, setProductsLoading] = useState(true);
  const [ordersLoadError, setOrdersLoadError] = useState(false);
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [addressesLoaded, setAddressesLoaded] = useState(false);
  const [addressFormOpen, setAddressFormOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<CustomerAddress | null>(null);
  const [addressSaving, setAddressSaving] = useState(false);
  const [addressDeleting, setAddressDeleting] = useState(false);
  const [addressPendingDelete, setAddressPendingDelete] = useState<CustomerAddress | null>(null);
  const [addressForm, setAddressForm] = useState({ label: 'Home', recipient_name: '', phone: '', address_line: '', landmark: '', city: '', state: '', postal_code: '', latitude: '', longitude: '', is_default: false });
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [reorderingId, setReorderingId] = useState<string | null>(null);
  const [productAggregates, setProductAggregates] = useState<Record<string, { average_rating: number; review_count: number }>>({});
  const [reviewOrderId, setReviewOrderId] = useState<string | null>(null);
  const [reviewOverall, setReviewOverall] = useState(0);
  const [reviewDelivery, setReviewDelivery] = useState(0);
  const [reviewStore, setReviewStore] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewProducts, setReviewProducts] = useState<ReviewProduct[]>([]);
  const [reviewExisting, setReviewExisting] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewSuccess, setReviewSuccess] = useState<string | null>(null);
  const [publicReviewProduct, setPublicReviewProduct] = useState<any>(null);
  const [publicReviews, setPublicReviews] = useState<any[]>([]);
  const [publicReviewsLoading, setPublicReviewsLoading] = useState(false);
  const modalCloseRef = useRef<HTMLButtonElement>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);

  const currentServiceObj = SERVICES.find(s => s.id === activeService) || SERVICES[0];
  const isPlanBased = activeService === 'mobile' || activeService === 'dth'; 

  const productCategories = useMemo(() => {
    const cats = new Set(products.map(p => String(p?.category || '').trim()).filter(Boolean));
    ['Fruits', 'Vegetables', 'Chicken', 'Mutton', 'Fish & Seafood', 'Eggs'].forEach((category) => cats.add(category));
    return ['All', ...Array.from(cats).sort((a, b) => a.localeCompare(b))];
  }, [products]);

  const productBrands = useMemo(() => Array.from(new Set(products.map((product) => String(product?.brand || '').trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b)), [products]);

  const normalizedSearch = searchQuery.trim().replace(/\s+/g, ' ').toLowerCase();
  const filteredProducts = useMemo(() => {
    const matchingProducts = products.filter((p) => {
      if (!p || !p.name) return false;
      const haystack = [p.name, p.brand, p.category, p.weight, p.unit].filter(Boolean).join(' ').replace(/\s+/g, ' ').toLowerCase();
      const matchesSearch = !normalizedSearch || haystack.includes(normalizedSearch);
      const matchesCategory = activeCategory === 'All' || String(p.category || '').trim() === activeCategory;
      const matchesBrand = brandFilter === 'ALL' || String(p.brand || '').trim() === brandFilter;
      const numericPrice = Number(p.price);
      const matchesPrice = priceFilter === 'ALL'
        || (priceFilter === 'UNDER_100' && Number.isFinite(numericPrice) && numericPrice < 100)
        || (priceFilter === '100_299' && Number.isFinite(numericPrice) && numericPrice >= 100 && numericPrice < 300)
        || (priceFilter === '300_499' && Number.isFinite(numericPrice) && numericPrice >= 300 && numericPrice < 500)
        || (priceFilter === '500_PLUS' && Number.isFinite(numericPrice) && numericPrice >= 500);
      const matchesAvailability = availabilityFilter === 'ALL'
        || (Boolean(p.vendor_id) && p.in_stock !== false && !(Number(p.quantity) <= 0));
      return matchesSearch && matchesCategory && matchesBrand && matchesPrice && matchesAvailability;
    });
    if (productSort === 'recommended') return matchingProducts;
    return [...matchingProducts].sort((a, b) => {
      if (productSort === 'name') return String(a.name || '').localeCompare(String(b.name || ''));
      const priceA = Number(a.price);
      const priceB = Number(b.price);
      if (!Number.isFinite(priceA) && Number.isFinite(priceB)) return 1;
      if (Number.isFinite(priceA) && !Number.isFinite(priceB)) return -1;
      if (!Number.isFinite(priceA) && !Number.isFinite(priceB)) return 0;
      return productSort === 'price_asc' ? priceA - priceB : priceB - priceA;
    });
  }, [products, normalizedSearch, activeCategory, brandFilter, priceFilter, availabilityFilter, productSort]);
  const activeProductFilterCount = (activeCategory !== 'All' ? 1 : 0) + (brandFilter !== 'ALL' ? 1 : 0) + (priceFilter !== 'ALL' ? 1 : 0) + (availabilityFilter !== 'ALL' ? 1 : 0);
  const clearProductFilters = () => {
    setActiveCategory('All');
    setBrandFilter('ALL');
    setPriceFilter('ALL');
    setAvailabilityFilter('ALL');
    setProductSort('recommended');
  };

  const smartAddOns = useMemo(() => {
    const vendorId = cart[0]?.item?.vendor_id;
    if (!vendorId) return [];
    const inCart = new Set(cart.map((entry) => String(entry.item.id)));
    const candidates = [...favoriteProducts, ...recentlyPurchased, ...products];
    const seen = new Set<string>();
    return candidates.filter((product) => {
      const id = String(product?.id || '');
      if (!id || seen.has(id) || inCart.has(id) || String(product.vendor_id) !== String(vendorId) || product.in_stock === false || (product.quantity !== null && Number(product.quantity) <= 0)) return false;
      seen.add(id); return true;
    }).slice(0, 4);
  }, [cart, favoriteProducts, recentlyPurchased, products]);

  // Provider fulfillment is not connected for any utility service yet. Keep every
  // entry point honest and prevent the UI from progressing to a charge path.
  // Plan discovery is read-only. Every recharge/utility fulfillment path remains disabled.
  const unavailableService = true;

  const planCategories = useMemo<string[]>(() => {
    const primary = new Set<string>(PRIMARY_PLAN_FILTERS);
    return Array.from(new Set<string>((planDiscovery?.plans || plans).map((p: any) => String(p.category || '').trim()).filter(Boolean))).filter((category) => !primary.has(category));
  }, [planDiscovery, plans]);

  const filteredPlans = useMemo(() => {
    const source = planDiscovery?.plans || plans;
    const query = planSearch.trim().toLowerCase();
    const filtered = source.filter((plan: any) => matchesPlanFilter(plan, selectedPlanCategory) && (!query || `${plan.category || ''} ${plan.amount || ''} ${plan.validity || ''} ${plan.description || ''}`.toLowerCase().includes(query)));
    const visible = selectedPlanCategory === 'All' ? dedupePlans(filtered) : filtered;
    return [...visible].sort((a: any, b: any) => planSort === 'low' ? Number(a.amount) - Number(b.amount) : planSort === 'high' ? Number(b.amount) - Number(a.amount) : planSort === 'validity' ? validityDays(b.validity) - validityDays(a.validity) : 0);
  }, [planDiscovery, plans, selectedPlanCategory, planSort, planSearch]);

  const visiblePlans = filteredPlans.slice(0, planVisibleCount);
  useEffect(() => {
    setPlanVisibleCount(20);
    setExpandedPlanIds(new Set());
  }, [selectedPlanCategory, planSort, planSearch]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const updateOnlineState = () => setIsOffline(!window.navigator.onLine);
    updateOnlineState();
    window.addEventListener('online', updateOnlineState);
    window.addEventListener('offline', updateOnlineState);
    return () => {
      window.removeEventListener('online', updateOnlineState);
      window.removeEventListener('offline', updateOnlineState);
    };
  }, []);

  const clearLocationWatcher = () => {
    if (locationWatchRef.current !== null && 'geolocation' in navigator) {
      navigator.geolocation.clearWatch(locationWatchRef.current);
      locationWatchRef.current = null;
    }
    if (locationRetryTimerRef.current !== null) {
      clearTimeout(locationRetryTimerRef.current);
      locationRetryTimerRef.current = null;
    }
  };

  useEffect(() => () => {
    locationRequestRef.current += 1;
    clearLocationWatcher();
  }, []);

  useEffect(() => () => {
    const recognition = speechRecognitionRef.current;
    if (!recognition) return;
    recognition.onstart = null;
    recognition.onresult = null;
    recognition.onerror = null;
    recognition.onend = null;
    try { recognition.abort(); } catch { /* best-effort cleanup */ }
    speechRecognitionRef.current = null;
  }, []);

  useEffect(() => {
    const modalOpen = isAuthModalOpen || isCartOpen || isAccountOpen || isTrackingOpen;
    if (!modalOpen) return;
    lastFocusedRef.current = document.activeElement as HTMLElement | null;
    const focusTimer = window.setTimeout(() => modalCloseRef.current?.focus(), 0);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsAuthModalOpen(false);
        setIsCartOpen(false);
        setAccountView('HOME');
        setIsAccountOpen(false);
        setIsTrackingOpen(false);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener('keydown', onKeyDown);
      lastFocusedRef.current?.focus();
    };
  }, [isAuthModalOpen, isCartOpen, isAccountOpen, isTrackingOpen]);

  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY);
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        if (Array.isArray(parsedCart)) {
          setCart(parsedCart.filter((entry: any) => entry?.item?.id !== undefined && Number.isInteger(entry?.qty) && entry.qty > 0));
        }
      }
      const savedAddress = localStorage.getItem(DELIVERY_ADDRESS_STORAGE_KEY);
      if (savedAddress?.trim()) setCurrentAddress(savedAddress.trim());
    } catch {
      localStorage.removeItem(CART_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    const address = currentAddress.trim();
    if (address && address !== 'Location not set') localStorage.setItem(DELIVERY_ADDRESS_STORAGE_KEY, address);
  }, [currentAddress]);

  useEffect(() => {
    const fetchAppContent = async () => {
      setProductsLoading(true);
      const cachedProducts = localStorage.getItem('zeshu_products');
      if (cachedProducts) {
        try { setProducts(JSON.parse(cachedProducts)); } catch { localStorage.removeItem('zeshu_products'); }
      }
      const { data: pData, error: productsError } = await supabase.from('products').select('*');
      if (pData) { setProducts(pData); localStorage.setItem('zeshu_products', JSON.stringify(pData)); }
      if (productsError) setContentError(true);
      
      const { data: bData } = await supabase.from('banners').select('*').order('created_at', { ascending: false });
      if (bData && bData.length > 0) { setBanners(bData.map((b: any) => b.image_url)); }
      setProductsLoading(false);
    };
    
    fetchAppContent();
    checkUser();
    setIsDetectingLoc(false);
  }, []);

  useEffect(() => {
    if (!user) {
      setAddressesLoaded(false);
      return;
    }
    if (user) {
      void loadAddresses();
      const fetchMyOrders = async () => {
        const { data, error } = await supabase.from('orders').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20);
        if (error) {
          if (process.env.NODE_ENV === 'development') console.error('Customer orders refresh failed:', error.message);
          setOrdersLoadError(true);
        } else if (data) {
          setOrdersLoadError(false);
          setMyOrders(data);
        }
      };
      fetchMyOrders();
      const orderChannel = supabase.channel('customer-orders').on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `user_id=eq.${user.id}` }, (payload) => {
        const nextOrder = payload.new as { id?: string; created_at?: string; status?: string };
        const oldOrder = payload.old as { id?: string };
        setMyOrders((current) => {
          if (payload.eventType === 'DELETE') return current.filter((order) => order.id !== oldOrder.id);
          if (!nextOrder?.id) return current;
          return [nextOrder, ...current.filter((order) => order.id !== nextOrder.id)].sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')));
        });
        if (nextOrder?.id) setTrackedOrder((current: any) => current?.id === nextOrder.id ? payload.new : current);
        if (nextOrder?.status === 'DELIVERED') void loadGrowthData();
      }).subscribe();
      return () => { supabase.removeChannel(orderChannel); };
    }
  }, [user]);

  useEffect(() => {
    if (!isAccountOpen || accountView !== 'SUPPORT' || !user) return;
    let mounted = true;
    let inFlight = false;
    const loadSupportConversations = async () => {
      if (inFlight) return;
      inFlight = true;
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        if (!token) return;
        const response = await fetch('/api/support/conversations', { headers: { Authorization: `Bearer ${token}` } });
        if (!mounted || !response.ok) return;
        const payload = await response.json().catch(() => ({}));
        setSupportConversations(Array.isArray(payload.conversations) ? payload.conversations : []);
      } finally {
        inFlight = false;
      }
    };
    void loadSupportConversations();
    const timer = window.setInterval(() => void loadSupportConversations(), 12000);
    return () => { mounted = false; window.clearInterval(timer); };
  }, [accountView, isAccountOpen, user]);

  useEffect(() => {
    if (!isAccountOpen || accountView !== 'SUPPORT' || !selectedSupportConversationId || !user) return;
    let mounted = true;
    let inFlight = false;
    const loadSupportThread = async () => {
      if (inFlight || supportThreadRequestRef.current) return;
      inFlight = true;
      supportThreadRequestRef.current = true;
      setSupportThreadLoading(true);
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        if (!token) return;
        const response = await fetch(`/api/support/conversations/${selectedSupportConversationId}`, { headers: { Authorization: `Bearer ${token}` } });
        if (!mounted || !response.ok) return;
        const payload = await response.json().catch(() => ({}));
        if (payload.conversation) {
          setSupportThread({ conversation: payload.conversation, messages: Array.isArray(payload.messages) ? payload.messages : [] });
          setSupportNotice((currentNotice) => payload.conversation.status === 'WAITING' || currentNotice !== 'A support agent has been requested.' ? currentNotice : '');
        }
      } finally {
        inFlight = false;
        supportThreadRequestRef.current = false;
        if (mounted) setSupportThreadLoading(false);
      }
    };
    void loadSupportThread();
    const timer = window.setInterval(() => void loadSupportThread(), 12000);
    return () => { mounted = false; window.clearInterval(timer); };
  }, [accountView, isAccountOpen, selectedSupportConversationId, supportThreadRefreshToken, user]);

  useEffect(() => {
    if (isAccountOpen && accountView === 'SUPPORT' && selectedSupportConversationId) return;
    setSupportNotice((currentNotice) => currentNotice === 'A support agent has been requested.' ? '' : currentNotice);
  }, [accountView, isAccountOpen, selectedSupportConversationId]);

  useEffect(() => {
    if (!SUPPORT_WHATSAPP_UI_ENABLED) return;
    if (!user) {
      supportWhatsappLoadedUserRef.current = null;
      setSupportWhatsappEnabled(false);
      setSupportWhatsappPhoneAvailable(false);
      setSupportWhatsappPreferenceLoaded(false);
      setSupportWhatsappPreferenceLoading(false);
      setSupportWhatsappPreferenceSaving(false);
      setSupportWhatsappPreferenceError('');
      return;
    }
    if (!isAccountOpen || accountView !== 'SUPPORT') return;
    if (supportWhatsappLoadedUserRef.current === user.id) return;

    let mounted = true;
    const controller = new AbortController();
    setSupportWhatsappEnabled(false);
    setSupportWhatsappPhoneAvailable(false);
    setSupportWhatsappPreferenceLoaded(false);
    setSupportWhatsappPreferenceLoading(true);
    setSupportWhatsappPreferenceError('');

    const loadSupportWhatsappPreference = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        if (!token) throw new Error('Authentication required.');
        const response = await fetch('/api/support/notifications/whatsapp', {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
          signal: controller.signal,
        });
        const payload = await response.json().catch(() => null);
        if (!response.ok || !payload || typeof payload.whatsapp_transactional_enabled !== 'boolean' || typeof payload.phone_available !== 'boolean') {
          throw new Error('Preference unavailable.');
        }
        if (!mounted) return;
        setSupportWhatsappEnabled(payload.whatsapp_transactional_enabled);
        setSupportWhatsappPhoneAvailable(payload.phone_available);
        setSupportWhatsappPreferenceLoaded(true);
        supportWhatsappLoadedUserRef.current = user.id;
      } catch (error) {
        if (!mounted || (error instanceof DOMException && error.name === 'AbortError')) return;
        setSupportWhatsappPreferenceError('WhatsApp preferences are temporarily unavailable. Please try again.');
      } finally {
        if (mounted) setSupportWhatsappPreferenceLoading(false);
      }
    };

    void loadSupportWhatsappPreference();
    return () => {
      mounted = false;
      controller.abort();
    };
  }, [accountView, isAccountOpen, user]);

  useEffect(() => {
    if (!user) {
      setRecentlyPurchased([]);
      setFrequentCategories([]);
      return;
    }
    const deliveredOrders = myOrders.filter((order) => order.status === 'DELIVERED').slice(0, 12);
    const productIds = Array.from(new Set(deliveredOrders.flatMap((order) => parseHistoricalOrderItems(order).map((entry) => entry.productId))));
    if (!productIds.length) {
      setRecentlyPurchased([]);
      setFrequentCategories([]);
      return;
    }
    let mounted = true;
    const loadRecentlyPurchased = async () => {
      const { data, error } = await supabase.from('products').select('*').in('id', productIds);
      if (!mounted) return;
      if (error) {
        if (process.env.NODE_ENV === 'development') console.error('Recently purchased products load failed:', error.message);
        setRecentlyPurchased([]);
        return;
      }
      const byId = new Map((data || []).map((product: any) => [String(product.id), product]));
      const ordered: any[] = [];
      const seen = new Set<string>();
      const categoryCounts = new Map<string, number>();
      deliveredOrders.forEach((order) => parseHistoricalOrderItems(order).forEach(({ productId }) => {
        const currentProduct = byId.get(productId);
        const quantity = parseHistoricalOrderItems(order).find((entry) => entry.productId === productId)?.quantity || 0;
        if (currentProduct?.category) categoryCounts.set(currentProduct.category, (categoryCounts.get(currentProduct.category) || 0) + quantity);
        if (!seen.has(productId) && byId.has(productId)) {
          seen.add(productId);
          ordered.push(byId.get(productId));
        }
      }));
      setRecentlyPurchased(ordered.slice(0, 10));
      setFrequentCategories(Array.from(categoryCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([category]) => category));
    };
    void loadRecentlyPurchased();
    return () => { mounted = false; };
  }, [user, myOrders]);

  useEffect(() => {
    const ids = products.map((product) => String(product.id)).filter(Boolean);
    if (!ids.length) { setProductAggregates({}); return; }
    void supabase.rpc('get_product_review_aggregates', { p_product_ids: ids }).then(({ data, error }) => {
      if (error) { if (process.env.NODE_ENV === 'development') console.error('Product review aggregates failed:', error.message); return; }
      const next: Record<string, { average_rating: number; review_count: number }> = {};
      (data || []).forEach((row: any) => { next[String(row.product_id)] = { average_rating: Number(row.average_rating), review_count: Number(row.review_count) }; });
      setProductAggregates(next);
    });
  }, [products]);

  useEffect(() => {
    if (trackedOrder?.status !== 'DELIVERED') { setReviewOrderId(null); return; }
    const purchased = parseHistoricalOrderItems(trackedOrder);
    setReviewOrderId(trackedOrder.id);
    setReviewProducts(purchased.map(({ productId }) => ({ id: productId, name: products.find((product) => String(product.id) === productId)?.name || `Product ${productId.slice(0, 8)}`, rating: 0, comment: '', existing: false })));
    setReviewExisting(false); setReviewError(null); setReviewSuccess(null);
    void (async () => {
      const [{ data: orderReview }, { data: productReviews }] = await Promise.all([
        supabase.from('order_reviews').select('overall_rating,delivery_rating,store_rating,comment').eq('order_id', trackedOrder.id).maybeSingle(),
        supabase.from('product_reviews').select('product_id,rating,comment').eq('order_id', trackedOrder.id),
      ]);
      if (orderReview) { setReviewExisting(true); setReviewOverall(Number(orderReview.overall_rating) || 0); setReviewDelivery(Number(orderReview.delivery_rating) || 0); setReviewStore(Number(orderReview.store_rating) || 0); setReviewComment(orderReview.comment || ''); }
      const byProduct = new Map((productReviews || []).map((review: any) => [String(review.product_id), review]));
      setReviewProducts((current) => current.map((item) => { const review = byProduct.get(item.id); return review ? { ...item, rating: Number(review.rating) || 0, comment: review.comment || '', existing: true } : item; }));
    })();
  }, [trackedOrder, products]);

  useEffect(() => {
    if (!user) {
      setFavoriteIds(new Set());
      setFavoriteProducts([]);
      return;
    }
    let mounted = true;
    const loadFavorites = async () => {
      const { data, error } = await supabase.from('customer_favorites').select('product_id,created_at').order('created_at', { ascending: false }).limit(100);
      if (!mounted) return;
      if (error) {
        if (process.env.NODE_ENV === 'development') console.error('Favorites load failed:', error.message);
        setFavoriteIds(new Set());
        setFavoriteProducts([]);
        return;
      }
      const ids = (data || []).map((entry: any) => String(entry.product_id));
      setFavoriteIds(new Set(ids));
      if (!ids.length) { setFavoriteProducts([]); return; }
      const { data: productsData, error: productsError } = await supabase.from('products').select('*').in('id', ids);
      if (!mounted) return;
      if (productsError) {
        if (process.env.NODE_ENV === 'development') console.error('Favorite products load failed:', productsError.message);
        setFavoriteProducts([]);
        return;
      }
      const byId = new Map((productsData || []).map((product: any) => [String(product.id), product]));
      const liveIds = ids.filter((id) => byId.has(id));
      setFavoriteIds(new Set(liveIds));
      setFavoriteProducts(liveIds.map((id) => byId.get(id)).filter(Boolean));
    };
    void loadFavorites();
    return () => { mounted = false; };
  }, [user]);

  useEffect(() => {
    const deliveryIsActive = ['PICKED_UP', 'OUT_FOR_DELIVERY'].includes(trackedOrder?.status);
    const riderId = trackedOrder?.rider_id;
    const isOrderOwner = Boolean(user?.id && trackedOrder?.user_id === user.id);

    if (!isTrackingOpen || !deliveryIsActive || !riderId || !isOrderOwner) {
      setLiveRider(null);
      setRiderLocationState('idle');
      return;
    }

    let mounted = true;
    setRiderLocationState('loading');
    const loadRider = async () => {
      const { data, error } = await supabase
        .from('rider_location_feed')
        .select('rider_id,full_name,is_active,current_latitude,current_longitude,location_updated_at')
        .eq('rider_id', riderId)
        .maybeSingle();

      if (!mounted) return;
      if (error || !data) {
        setLiveRider(null);
        setRiderLocationState('unavailable');
        return;
      }
      setLiveRider(data);
      setRiderFreshnessNow(Date.now());
      setRiderLocationState('available');
    };
    void loadRider();

    const riderChannel = supabase
      .channel(`customer-rider-location-${trackedOrder.id}-${riderId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rider_location_feed', filter: `rider_id=eq.${riderId}` }, (payload) => {
        if (!mounted) return;
        const nextRider = payload.new as any;
        setLiveRider((current: any) => ({ ...current, ...nextRider, location_updated_at: nextRider?.location_updated_at }));
        setRiderFreshnessNow(Date.now());
        setRiderLocationState('available');
      })
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(riderChannel);
    };
  }, [isTrackingOpen, trackedOrder?.id, trackedOrder?.rider_id, trackedOrder?.status, trackedOrder?.user_id, user?.id]);

  useEffect(() => {
    const deliveryIsActive = ['PICKED_UP', 'OUT_FOR_DELIVERY'].includes(trackedOrder?.status);
    const riderId = trackedOrder?.rider_id;
    const isOrderOwner = Boolean(user?.id && trackedOrder?.user_id === user.id);
    if (!isTrackingOpen || !deliveryIsActive || !riderId || !isOrderOwner) return;

    const updateFreshnessClock = () => setRiderFreshnessNow(Date.now());
    updateFreshnessClock();
    const timer = window.setInterval(updateFreshnessClock, 30_000);
    return () => window.clearInterval(timer);
  }, [isTrackingOpen, trackedOrder?.id, trackedOrder?.rider_id, trackedOrder?.status, trackedOrder?.user_id, user?.id]);

  useEffect(() => {
    const deliveryIsActive = ['PICKED_UP', 'OUT_FOR_DELIVERY'].includes(trackedOrder?.status);
    if (!isTrackingOpen || !deliveryIsActive || !trackedOrder?.id || !user?.id) {
      setEtaState('idle');
      setEtaDetails(null);
      return;
    }
    let mounted = true;
    let timer: number | undefined;
    const loadEta = async () => {
      if (!mounted) return;
      setEtaState((current) => current === 'available' || current === 'fallback' ? current : 'loading');
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        if (mounted) setEtaState('unavailable');
        return;
      }
      try {
        const response = await fetch(`/api/orders/${encodeURIComponent(trackedOrder.id)}/eta`, { headers: { Authorization: `Bearer ${session.access_token}` } });
        const payload = await response.json().catch(() => ({}));
        if (!mounted) return;
        if (payload?.source === 'GOOGLE_ROUTES') {
          setEtaDetails({ durationSeconds: Number(payload.durationSeconds), distanceMeters: Number(payload.distanceMeters), source: payload.source });
          setEtaState('available');
        } else if (payload?.source === 'FALLBACK') {
          setEtaDetails({ durationSeconds: Number(payload.durationSeconds), distanceMeters: Number(payload.distanceMeters), source: payload.source });
          setEtaState('fallback');
        } else {
          setEtaDetails(null);
          setEtaState('unavailable');
        }
      } catch {
        if (mounted) { setEtaDetails(null); setEtaState('unavailable'); }
      } finally {
        if (mounted) timer = window.setTimeout(() => void loadEta(), 60_000);
      }
    };
    void loadEta();
    return () => { mounted = false; if (timer) window.clearTimeout(timer); };
  }, [isTrackingOpen, trackedOrder?.id, trackedOrder?.status, user?.id]);

  const showToast = (msg: string) => { setToastMessage(msg); setTimeout(() => setToastMessage(null), 3000); };
  const showCheckoutError = (message: string, code?: string, requestId?: string) => {
    setCheckoutError({ message, code, requestId });
    showToast(message);
  };
  const getUtilityAuthHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      showToast('Please sign in to use this service.');
      return null;
    }
    return { Authorization: `Bearer ${session.access_token}` };
  };

  const confirmPendingGroceryOrder = async (pending: PendingGroceryConfirmation) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user || session.user.id !== pending.userId) {
      showToast('Sign in with the customer account that made this payment to finish confirmation.');
      return false;
    }

    let confirmationData: any;
    try {
      const confirmation = await fetch('/api/confirm-grocery-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({
          reservationId: pending.reservationId,
          razorpay_payment_id: pending.paymentId,
          razorpay_order_id: pending.razorpay_order_id,
          razorpay_signature: pending.razorpay_signature,
        }),
      });
      confirmationData = await confirmation.json();
      if (!confirmation.ok || !confirmationData.success) {
        showToast(confirmationData.error || 'Payment confirmation is still pending. Retry with the same payment; do not pay again.');
        return false;
      }
    } catch {
      showToast('Could not reach payment confirmation. Retry with the same payment; do not pay again.');
      return false;
    }

    sessionStorage.removeItem(PENDING_GROCERY_CONFIRMATION_KEY);
    const rewardMessage = Number(confirmationData.zeshuCashUsed || 0) > 0 ? ` ₹${Number(confirmationData.zeshuCashUsed).toFixed(0)} Zeshu Cash used.` : '';
    if (Number(confirmationData.zeshuCashUsed || 0) > 0) setRewardBalance((current) => Math.max(0, current - Number(confirmationData.zeshuCashUsed)));
    showToast(`${confirmationData.duplicate ? 'Order confirmation restored.' : 'Order placed!'}${rewardMessage}`);
    setCart([]);
    setIsCartOpen(false);
    const confirmedOrder = { ...confirmationData.order, zeshuCashUsed: confirmationData.zeshuCashUsed, pendingReward: confirmationData.pendingReward };
    setTrackedOrder(confirmedOrder);
    setMyOrders([confirmedOrder]);
    setIsTrackingOpen(true);
    return true;
  };

  useEffect(() => {
    if (!user) return;
    const storedConfirmation = sessionStorage.getItem(PENDING_GROCERY_CONFIRMATION_KEY);
    if (!storedConfirmation) return;
    try {
      const pending = JSON.parse(storedConfirmation) as PendingGroceryConfirmation;
      if (pending.userId !== user.id) return;
      showToast('Finishing your previous payment confirmation...');
      void confirmPendingGroceryOrder(pending);
    } catch {
      sessionStorage.removeItem(PENDING_GROCERY_CONFIRMATION_KEY);
    }
  }, [user]);

  const handleAutoDetectLocation = () => {
    if (isDetectingLoc) return;
    locationRequestRef.current += 1;
    const requestId = locationRequestRef.current;
    clearLocationWatcher();
    setIsDetectingLoc(true);
    const fallbackAddress = addresses.find((item) => item.id === selectedAddressId) || addresses.find((item) => item.is_default);
    const fallbackCoordinates = fallbackAddress && Number.isFinite(Number(fallbackAddress.latitude)) && Number.isFinite(Number(fallbackAddress.longitude))
      ? { latitude: Number(fallbackAddress.latitude), longitude: Number(fallbackAddress.longitude), accuracy: fallbackAddress.location_accuracy_meters ?? null, source: 'MANUAL_PIN' as const, displayAddress: formatAddress(fallbackAddress) }
      : null;
    const cachedLocation = (!user || (addressesLoaded && addresses.length === 0)) ? readConfirmedLocationCache() : null;
    const cachedCoordinates = cachedLocation ? { latitude: cachedLocation.latitude, longitude: cachedLocation.longitude, accuracy: cachedLocation.accuracy ?? null, source: cachedLocation.source || 'MANUAL_PIN' as const, displayAddress: cachedLocation.displayAddress } : null;
    const fallbackSelection = fallbackCoordinates || cachedCoordinates;
    const openSelector = (selection: { latitude: number; longitude: number; accuracy: number | null; source: 'DEVICE' | 'MANUAL_PIN'; displayAddress?: string } | null) => {
      if (requestId !== locationRequestRef.current) return;
      setLocationSelection(selection);
      setIsDetectingLoc(false);
      setLocationSelectorOpen(true);
    };
    if (!("geolocation" in navigator)) {
      openSelector(fallbackSelection);
      showToast('Location is not available. Search or place the pin manually.');
      return;
    }
    navigator.geolocation.getCurrentPosition((position) => {
      const accuracy = Number(position.coords.accuracy);
      openSelector({ latitude: position.coords.latitude, longitude: position.coords.longitude, accuracy: Number.isFinite(accuracy) && accuracy >= 0 ? accuracy : null, source: 'DEVICE' });
    }, () => {
      openSelector(fallbackSelection);
      showToast('We couldn\'t get a precise GPS location. Search or place the pin on the map.');
    }, { enableHighAccuracy: true, maximumAge: 30000, timeout: 3000 });
  };

  const handleContactPicker = async () => {
    if ('contacts' in navigator && 'ContactsManager' in window) {
      try {
        const props = ['name', 'tel'];
        const contacts: any = await (navigator as any).contacts.select(props, { multiple: false });
        if (contacts.length > 0 && contacts[0].tel && contacts[0].tel.length > 0) {
          const phone = contacts[0].tel[0].replace(/\D/g, '').slice(-10);
          setRechargeNumber(phone);
          showToast(`Selected contact: ${contacts[0].name || phone}`);
        }
      } catch (ex) {
        showToast("Contact selection cancelled.");
      }
    } else {
      showToast("Contact Search is only supported on Android Chrome Mobile.");
    }
  };

  const handleMedicineSearch = async () => {
    if (!medSearchQuery) return;
    setIsLoading(true);
    setMedResults(null);
    try {
      const res = await fetch(`/api/med-search?q=${medSearchQuery}&lat=18.7989&lng=78.9117`);
      const data = await res.json();
      if (data.success) { setMedResults(data); } else { showToast(data.message || "Failed to search medical network."); }
    } catch (err) { showToast("Failed to search medical network."); }
    setIsLoading(false);
  };

  useEffect(() => {
    if (activeService !== 'mobile') {
      setPlanDiscovery(null);
      setPlanDiscoveryError('');
    }
    if (activeService !== 'dth') {
      setDthPlans([]); setDthOperator(null); setDthInfo(null); setDthSearch(''); setDthLanguageFilter('All'); setSelectedDthPlanId(''); setDthSelectionMessage('');
    }
    if (activeService !== 'electricity') {
      setElectricityOperators([]); setElectricitySearch(''); setElectricityOperator(null); setElectricityBillNumber(''); setElectricityBill(null); setElectricityBillerInfo(null);
    }
    if (activeService !== 'water') {
      setWaterOperators([]); setWaterSearch(''); setWaterOperator(null); setWaterBillNumber(''); setWaterBill(null); setWaterBillerInfo(null);
    }
    if (activeService !== 'broadband') {
      setBroadbandOperators([]); setBroadbandSearch(''); setBroadbandOperator(null); setBroadbandConsumerNumber(''); setBroadbandInfo(null); setBroadbandBillerInfo(null);
    }
    if (activeService !== 'fastag') {
      setFastagOperators([]); setFastagSearch(''); setFastagOperator(null); setFastagVehicleNumber(''); setFastagInfo(null);
    }
    if (activeService !== 'gas') { setPipedGasOperators([]); setPipedGasSearch(''); setPipedGasOperator(null); setPipedGasConsumerNumber(''); setPipedGasInfo(null); }
    if (activeService !== 'lpg') { setLpgOperators([]); setLpgSearch(''); setLpgOperator(null); }
    setFetchedBill(null);
  }, [activeService]);

  const loadElectricityOperators = async () => {
    if (electricityOperators.length) return;
    const headers = await getUtilityAuthHeaders(); if (!headers) return;
    setElectricityLoading(true);
    try {
      const response = await fetch('/api/electricity/operators', { headers });
      const data = await response.json(); if (!response.ok) throw new Error(data.error);
      setElectricityOperators(data.operators || []);
    } catch { showToast('Electricity providers are temporarily unavailable.'); }
    finally { setElectricityLoading(false); }
  };

  const loadWaterOperators = async () => {
    if (waterOperators.length) return;
    const headers = await getUtilityAuthHeaders(); if (!headers) return;
    setWaterLoading(true);
    try { const response = await fetch('/api/water/operators', { headers }); const data = await response.json(); if (!response.ok) throw new Error(data.error); setWaterOperators(data.operators || []); }
    catch { showToast('Water providers are temporarily unavailable.'); }
    finally { setWaterLoading(false); }
  };

  const loadWaterBillerInfo = async () => {
    if (!waterOperator) return showToast('Select a water provider first.');
    const headers = await getUtilityAuthHeaders(); if (!headers) return;
    setWaterLoading(true); setWaterBill(null); setWaterBillNumber('');
    try { const response = await fetch('/api/water/biller-info', { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ operatorCode: waterOperator.operatorCode }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error); setWaterBillerInfo(data); }
    catch (error) { showToast(error instanceof Error ? error.message : 'Water provider metadata is temporarily unavailable.'); }
    finally { setWaterLoading(false); }
  };

  const fetchWaterBillDetails = async () => {
    if (!waterOperator || !waterBillerInfo) return showToast('Load the provider requirements first.');
    const field = waterBillerInfo.fields?.length === 1 ? waterBillerInfo.fields[0] : null;
    const normalized = waterBillNumber.trim();
    if (!field || !normalized || normalized.length > 80 || /[\u0000-\u001F\u007F]/.test(normalized) || (field.fieldType === 'NUMERIC' && !/^\d+$/.test(normalized)) || (field.minLength !== null && normalized.length < field.minLength) || (field.maxLength !== null && normalized.length > field.maxLength)) return showToast('Enter a valid water account/bill number.');
    const headers = await getUtilityAuthHeaders(); if (!headers) return;
    setWaterLoading(true); setWaterBill(null);
    try { const response = await fetch('/api/water/fetch-bill', { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ operatorCode: waterOperator.operatorCode, billNumber: normalized }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error); setWaterBill(data.bill || {}); }
    catch (error) { showToast(error instanceof Error ? error.message : "We couldn't fetch this water bill. Check the details and try again."); }
    finally { setWaterLoading(false); }
  };

  const loadBroadbandOperators = async () => {
    if (broadbandOperators.length) return;
    const headers = await getUtilityAuthHeaders(); if (!headers) return;
    setBroadbandLoading(true);
    try { const response = await fetch('/api/broadband/operators', { headers }); const data = await response.json(); if (!response.ok) throw new Error(data.error); setBroadbandOperators(data.operators || []); }
    catch { showToast('Broadband providers are temporarily unavailable.'); }
    finally { setBroadbandLoading(false); }
  };

  const loadBroadbandBillerInfo = async () => {
    if (!broadbandOperator) return showToast('Select a broadband provider first.');
    const headers = await getUtilityAuthHeaders(); if (!headers) return;
    setBroadbandLoading(true); setBroadbandInfo(null); setBroadbandConsumerNumber('');
    try { const response = await fetch('/api/broadband/biller-info', { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ operatorCode: broadbandOperator.operatorCode }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error); setBroadbandBillerInfo(data); }
    catch (error) { showToast(error instanceof Error ? error.message : 'Broadband provider metadata is temporarily unavailable.'); }
    finally { setBroadbandLoading(false); }
  };

  const fetchBroadbandDetails = async () => {
    if (!broadbandOperator || !broadbandBillerInfo) return showToast('Load the provider requirements first.');
    const field = broadbandBillerInfo.fields?.length === 1 ? broadbandBillerInfo.fields[0] : null;
    const normalized = broadbandConsumerNumber.trim();
    if (!field || !normalized || normalized.length > 80 || /[\u0000-\u001F\u007F]/.test(normalized) || (field.fieldType === 'NUMERIC' && !/^\d+$/.test(normalized)) || (field.minLength !== null && normalized.length < field.minLength) || (field.maxLength !== null && normalized.length > field.maxLength)) return showToast('Enter a valid broadband customer/subscriber number.');
    const headers = await getUtilityAuthHeaders(); if (!headers) return;
    setBroadbandLoading(true); setBroadbandInfo(null);
    try { const response = await fetch('/api/broadband/fetch-info', { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ operatorCode: broadbandOperator.operatorCode, consumerNumber: normalized }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error); setBroadbandInfo(data.info || {}); }
    catch (error) { showToast(error instanceof Error ? error.message : "We couldn't fetch this broadband bill. Check the details and try again."); }
    finally { setBroadbandLoading(false); }
  };

  const loadFastagOperators = async () => {
    if (fastagOperators.length) return;
    const headers = await getUtilityAuthHeaders(); if (!headers) return;
    setFastagLoading(true);
    try { const response = await fetch('/api/fastag/operators', { headers }); const data = await response.json(); if (!response.ok) throw new Error(data.error); setFastagOperators(data.operators || []); }
    catch { showToast('FASTag providers are temporarily unavailable.'); }
    finally { setFastagLoading(false); }
  };

  const fetchFastagDetails = async () => {
    if (!fastagOperator) return showToast('Select a FASTag provider first.');
    const headers = await getUtilityAuthHeaders(); if (!headers) return;
    setFastagLoading(true); setFastagInfo(null);
    try { const response = await fetch('/api/fastag/fetch-info', { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ operatorCode: fastagOperator.operatorCode, vehicleNumber: fastagVehicleNumber }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error); setFastagInfo(data.info || {}); }
    catch (error) { showToast(error instanceof Error ? error.message : "We couldn't fetch FASTag details. Check the provider and vehicle number and try again."); }
    finally { setFastagLoading(false); }
  };

  const loadPipedGasOperators = async () => { if (pipedGasOperators.length) return; const headers = await getUtilityAuthHeaders(); if (!headers) return; setPipedGasLoading(true); try { const response = await fetch('/api/piped-gas/operators', { headers }); const data = await response.json(); if (!response.ok) throw new Error(data.error); setPipedGasOperators(data.operators || []); } catch { showToast('Piped Gas providers are temporarily unavailable.'); } finally { setPipedGasLoading(false); } };
  const fetchPipedGasDetails = async () => { if (!pipedGasOperator) return showToast('Select a Piped Gas provider first.'); const headers = await getUtilityAuthHeaders(); if (!headers) return; setPipedGasLoading(true); setPipedGasInfo(null); try { const response = await fetch('/api/piped-gas/fetch-info', { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ operatorCode: pipedGasOperator.operatorCode, consumerNumber: pipedGasConsumerNumber }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error); setPipedGasInfo(data.info || {}); } catch (error) { showToast(error instanceof Error ? error.message : "We couldn't fetch Piped Gas details. Check the provider and consumer number and try again."); } finally { setPipedGasLoading(false); } };
  const loadLpgOperators = async () => { if (lpgOperators.length) return; const headers = await getUtilityAuthHeaders(); if (!headers) return; setLpgLoading(true); try { const response = await fetch('/api/lpg/operators', { headers }); const data = await response.json(); if (!response.ok) throw new Error(data.error); setLpgOperators(data.operators || []); } catch { showToast('LPG providers are temporarily unavailable.'); } finally { setLpgLoading(false); } };

  const fetchElectricityBillDetails = async () => {
    if (!electricityOperator || !electricityBillerInfo) return showToast('Load the provider requirements first.');
    if (!/^[A-Za-z0-9][A-Za-z0-9._/-]{0,79}$/.test(electricityBillNumber)) return showToast('Enter a valid electricity consumer/bill number.');
    const headers = await getUtilityAuthHeaders(); if (!headers) return;
    setElectricityLoading(true); setElectricityBill(null);
    try {
      const response = await fetch('/api/electricity/fetch-bill', { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ operatorCode: electricityOperator.operatorCode, billNumber: electricityBillNumber }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error);
      setElectricityBill(data.bill || {});
    } catch (error) { showToast(error instanceof Error ? error.message : "We couldn't fetch this electricity bill. Check the details and try again."); }
    finally { setElectricityLoading(false); }
  };

  const loadElectricityBillerInfo = async () => {
    if (!electricityOperator) return showToast('Select an electricity provider first.');
    const headers = await getUtilityAuthHeaders(); if (!headers) return;
    setElectricityLoading(true); setElectricityBill(null); setElectricityBillNumber('');
    try {
      const response = await fetch('/api/electricity/biller-info', { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ operatorCode: electricityOperator.operatorCode }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error);
      setElectricityBillerInfo(data);
    } catch (error) { showToast(error instanceof Error ? error.message : 'Electricity provider metadata is temporarily unavailable.'); }
    finally { setElectricityLoading(false); }
  };

  const detectDthOperator = async () => {
    if (!/^\d{6,20}$/.test(rechargeNumber)) return showToast('Enter a valid DTH subscriber/customer ID.');
    const headers = await getUtilityAuthHeaders(); if (!headers) return;
    setDthLoading(true); setDthInfo(null); setDthPlans([]); setDthLanguageFilter('All'); setDthSelectionMessage('');
    try {
      const response = await fetch('/api/dth/operator', { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ dthNumber: rechargeNumber }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setDthOperator(data); showToast(`Detected ${data.operator}`);
    } catch (error) { showToast(error instanceof Error ? error.message : "We couldn't detect this DTH provider. Check the number and try again."); }
    finally { setDthLoading(false); }
  };

  const fetchDthPlansForCustomer = async () => {
    if (!dthOperator) return showToast('Detect the DTH provider first.');
    const headers = await getUtilityAuthHeaders(); if (!headers) return;
    setDthLoading(true); setDthSelectionMessage('');
    try {
      const response = await fetch('/api/dth/plans', { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ dthNumber: rechargeNumber }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setDthOperator({ operator: data.operator, operatorCode: data.operatorCode }); setDthPlans(data.plans || []); setDthLanguageFilter('All');
    } catch (error) { showToast(error instanceof Error ? error.message : 'DTH plans are temporarily unavailable.'); }
    finally { setDthLoading(false); }
  };

  const fetchDthAccountInfo = async () => {
    if (!dthOperator) return showToast('Detect the DTH provider first.');
    const headers = await getUtilityAuthHeaders(); if (!headers) return;
    setDthLoading(true);
    try {
      const response = await fetch('/api/dth/info', { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ dthNumber: rechargeNumber }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setDthInfo(data.info || {});
    } catch (error) { showToast(error instanceof Error ? error.message : 'Account details are temporarily unavailable.'); }
    finally { setDthLoading(false); }
  };

  const autoDetectAndFetchPlans = async (num: string) => {
    if (!/^[6-9]\d{9}$/.test(num)) { setPlanDiscoveryError('Enter a valid 10-digit Indian mobile number.'); return; }
    setPlanDiscoveryLoading(true); setPlanDiscoveryError(''); setPlanDiscovery(null); setPlans([]); setSelectedPlanCategory('All'); setPlanSearch(''); setPlanVisibleCount(20); setPlanSelectionMessage(''); setSelectedPlanId('');
    try {
      const response = await fetch('/api/recharge/plans', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mobile: num }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Recharge plans are temporarily unavailable.');
      setPlanDiscovery(data); setSelectedOperator(data.operator || ''); setPlans(data.plans || []); showToast(`Plans found for ${data.operator}`);
    } catch (error) {
      setPlanDiscoveryError(error instanceof Error ? error.message : 'Recharge plans are temporarily unavailable.');
    } finally { setPlanDiscoveryLoading(false); }
  };

  const fetchOffers = async () => autoDetectAndFetchPlans(rechargeNumber);

  const fetchBillDetails = async () => {
    if (!rechargeNumber || !selectedOperator) return showToast("Enter the required details.");
    setIsLoading(true); setFetchedBill(null);
    try {
      const authHeaders = await getUtilityAuthHeaders();
      if (!authHeaders) { setIsLoading(false); return; }
      const opCode = OPERATORS_DATA[activeService][selectedOperator];
      const res = await fetch(`/api/fetch-bill?service=${activeService}&number=${rechargeNumber}&operatorCode=${opCode}`, { headers: authHeaders });
      const data = await res.json();
      if (data.success && data.bill) { setFetchedBill(data.bill); setRechargeAmount(data.bill.DueAmount); showToast("Bill Details Fetched!"); } 
    } catch (err) {
      if (process.env.NODE_ENV === 'development') console.error('Bill lookup failed:', err instanceof Error ? err.message : 'unknown error');
      showToast('Unable to fetch bill details right now. Please try again.');
    }
    setIsLoading(false);
  };

  const checkUser = async () => { const { data: { session } } = await supabase.auth.getSession(); if (session) { setUser(session.user); void loadGrowthData(); } };
  const loadAddresses = async () => {
    if (!user) return;
    const { data, error } = await supabase.from('customer_addresses').select('*').order('is_default', { ascending: false }).order('created_at', { ascending: false });
    if (error) { if (process.env.NODE_ENV === 'development') console.error('Customer addresses load failed:', error.message); return; }
    const next = (data || []) as CustomerAddress[];
    setAddresses(next);
    setAddressesLoaded(true);
    const defaultAddress = next.find((address) => address.is_default);
    if (!selectedAddressId && defaultAddress) setSelectedAddressId(defaultAddress.id);
    if (defaultAddress) setCurrentAddress(formatAddress(defaultAddress));
  };
  const openAddressForm = (address?: CustomerAddress) => {
    setEditingAddress(address || null);
    setLocationAccuracy(address?.location_accuracy_meters ?? null);
    setAddressForm(address ? { label: address.label, recipient_name: address.recipient_name || '', phone: address.phone || '', address_line: address.address_line, landmark: address.landmark || '', city: address.city, state: address.state, postal_code: address.postal_code || '', latitude: address.latitude === null ? '' : String(address.latitude), longitude: address.longitude === null ? '' : String(address.longitude), is_default: address.is_default } : { label: 'Home', recipient_name: '', phone: '', address_line: '', landmark: '', city: '', state: '', postal_code: '', latitude: '', longitude: '', is_default: addresses.length === 0 });
    setAddressFormOpen(true);
  };
  const saveAddress = async (event: React.FormEvent) => {
    event.preventDefault();
    if (addressSaving) return;
    if (!addressForm.label.trim() || !addressForm.address_line.trim() || !addressForm.city.trim() || !addressForm.state.trim()) return showToast('Label, address, city, and state are required.');
    const latitude = addressForm.latitude.trim() ? Number(addressForm.latitude) : null;
    const longitude = addressForm.longitude.trim() ? Number(addressForm.longitude) : null;
    if ((latitude !== null && (!Number.isFinite(latitude) || latitude < -90 || latitude > 90)) || (longitude !== null && (!Number.isFinite(longitude) || longitude < -180 || longitude > 180))) return showToast('Enter valid map coordinates or leave them blank.');
    setAddressSaving(true);
    const locationPayload = { p_address_id: editingAddress?.id || null, p_label: addressForm.label.trim(), p_recipient_name: addressForm.recipient_name.trim() || null, p_phone: addressForm.phone.trim() || null, p_address_line: addressForm.address_line.trim(), p_landmark: addressForm.landmark.trim() || null, p_city: addressForm.city.trim(), p_state: addressForm.state.trim(), p_postal_code: addressForm.postal_code.trim() || null, p_latitude: latitude, p_longitude: longitude, p_is_default: addressForm.is_default, p_location_accuracy_meters: locationAccuracy, p_location_source: locationAccuracy !== null ? 'DEVICE' : (latitude !== null && longitude !== null ? 'MANUAL_PIN' : 'LEGACY') };
    let { error } = await supabase.rpc('customer_upsert_address_with_location', locationPayload);
    if (error?.code === 'PGRST202' || /function .*customer_upsert_address_with_location/i.test(error?.message || '')) {
      const { p_location_accuracy_meters: _accuracy, p_location_source: _source, ...legacyPayload } = locationPayload;
      const fallback = await supabase.rpc('customer_upsert_address', legacyPayload);
      error = fallback.error;
    }
    setAddressSaving(false);
    if (error) { if (process.env.NODE_ENV === 'development') console.error('Customer address save failed:', error.message); return showToast('Could not save this address. Please try again.'); }
    setAddressFormOpen(false); showToast('Address saved.'); await loadAddresses();
  };
  const setDefaultAddress = async (addressId: string) => {
    const { error } = await supabase.rpc('customer_set_default_address', { p_address_id: addressId });
    if (error) return showToast('Could not update the default address.');
    setSelectedAddressId(addressId); await loadAddresses(); showToast('Default address updated.');
  };
  const requestDeleteAddress = (address: CustomerAddress) => {
    if (address.is_default && addresses.some((candidate) => candidate.id !== address.id)) {
      showToast('Set another address as default before removing this one.');
      return;
    }
    setAddressPendingDelete(address);
  };
  const deleteAddress = async (addressId?: string) => {
    if (addressId) {
      const address = addresses.find((candidate) => candidate.id === addressId);
      if (address) requestDeleteAddress(address);
      return;
    }
    if (!addressPendingDelete || addressDeleting) return;
    setAddressDeleting(true);
    const { error } = await supabase.rpc('customer_delete_address', { p_address_id: addressPendingDelete.id });
    setAddressDeleting(false);
    if (error) return showToast('Couldn\'t remove this address. Please try again.');
    if (selectedAddressId === addressPendingDelete.id) {
      setSelectedAddressId(null);
      setCurrentAddress('Location not set');
    }
    setAddressPendingDelete(null);
    await loadAddresses();
    showToast('Address removed.');
  };
  const formatAddress = (address: CustomerAddress) => [address.address_line, address.landmark, address.city, address.state, address.postal_code].filter(Boolean).join(', ');
  const reorder = async (order: any) => {
    if (reorderingId) return;
    setReorderingId(order.id);
    const historicalItems = parseHistoricalOrderItems(order);
    const ids = historicalItems.map((entry) => entry.productId);
    const { data: currentProducts, error } = ids.length ? await supabase.from('products').select('*').in('id', ids) : { data: [] as any[], error: null };
    if (error) { setReorderingId(null); return showToast('Could not check current product availability. Please try again.'); }
    const validProducts = (currentProducts || []).filter((product: any) => product.vendor_id && product.in_stock !== false && (product.quantity === null || Number(product.quantity) > 0));
    const targetVendorId = validProducts[0]?.vendor_id;
    const cartVendorIds = Array.from(new Set(cart.map((entry) => entry.item?.vendor_id).filter(Boolean)));
    if (targetVendorId && cartVendorIds.some((vendorId) => vendorId !== targetVendorId)) { setReorderingId(null); return showToast('Your cart contains items from another store. Checkout one store at a time.'); }
    const productById = new Map(validProducts.map((product: any) => [String(product.id), product]));
    let addedCount = 0;
    let unavailableCount = 0;
    setCart((current) => {
      const next = [...current];
      historicalItems.forEach(({ productId, quantity }) => {
        const product = productById.get(productId);
        if (!product) { unavailableCount += 1; return; }
        const existing = next.find((entry) => String(entry.item.id) === productId);
        const existingQuantity = existing?.qty || 0;
        const maxQuantity = product.quantity === null ? existingQuantity + quantity : Number(product.quantity);
        const nextQuantity = Math.min(existingQuantity + quantity, maxQuantity);
        if (nextQuantity <= existingQuantity) { unavailableCount += 1; return; }
        addedCount += nextQuantity - existingQuantity;
        if (existing) existing.qty = nextQuantity; else next.push({ item: product, qty: nextQuantity });
      });
      return next;
    });
    setReorderingId(null); setIsAccountOpen(false); setIsCartOpen(true);
    if (!addedCount) showToast('These products are currently unavailable.');
    else if (unavailableCount) showToast('Available items were added. Some products are currently unavailable.');
    else showToast('Items added to your cart.');
  };

  const submitReview = async () => {
    if (!reviewOrderId || reviewOverall < 1 || reviewLoading) return;
    setReviewLoading(true); setReviewError(null); setReviewSuccess(null);
    try {
      const { error } = await supabase.rpc('customer_submit_order_review', {
        p_order_id: reviewOrderId,
        p_overall_rating: reviewOverall,
        p_delivery_rating: reviewDelivery || null,
        p_store_rating: reviewStore || null,
        p_comment: reviewComment.trim() || null,
      });
      if (error) throw error;
      for (const product of reviewProducts.filter((item) => item.rating > 0)) {
        const { error: productError } = await supabase.rpc('customer_submit_product_review', { p_order_id: reviewOrderId, p_product_id: product.id, p_rating: product.rating, p_comment: product.comment.trim() || null });
        if (productError) throw productError;
      }
      setReviewSuccess('Thanks — your verified review was saved.');
      setToastMessage('Review saved');
      setTimeout(() => setToastMessage(null), 2500);
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error('Review submission failed:', error?.message || error);
      setReviewError(error?.message?.includes('delivered') ? 'Only delivered orders can be reviewed.' : 'We could not save your review. Please try again.');
    } finally { setReviewLoading(false); }
  };

  const openPublicReviews = async (product: any) => {
    setPublicReviewProduct(product); setPublicReviews([]); setPublicReviewsLoading(true);
    const { data, error } = await supabase.rpc('get_public_product_reviews', { p_product_id: product.id, p_limit: 20, p_offset: 0 });
    if (error && process.env.NODE_ENV === 'development') console.error('Public reviews load failed:', error.message);
    setPublicReviews(data || []); setPublicReviewsLoading(false);
  };
  const loadGrowthData = async () => {
    const [{ data: balance }, { data: history }, { data: code }] = await Promise.all([
      supabase.rpc('get_my_reward_balance'),
      supabase.rpc('get_my_reward_history', { p_limit: 20 }),
      supabase.rpc('get_or_create_my_referral_code'),
    ]);
    setRewardBalance(Number(balance || 0)); setRewardHistory(history || []); setReferralCode(String(code || ''));
  };

  const handleSendOtp = async () => { if (!/^\d{10}$/.test(phoneNumber)) return showToast('Enter a valid 10-digit mobile number.'); setIsLoading(true); const { error } = await supabase.auth.signInWithOtp({ phone: `+91${phoneNumber}` }); setIsLoading(false); if (!error) setOtpSent(true); else showToast('We could not start OTP delivery. Check the number and try again later.'); };

  const toggleVoiceSearch = () => {
    if (isVoiceListening) {
      const recognition = speechRecognitionRef.current;
      try { recognition?.stop(); } catch { /* recognition may already be ending */ }
      setIsVoiceListening(false);
      return;
    }
    if (typeof window === 'undefined') return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceSearchMessage("Voice search isn't supported on this browser. You can still type your search.");
      return;
    }
    let receivedResult = false;
    let hadError = false;
    let recognition: any;
    try {
      recognition = new SpeechRecognition();
      recognition.lang = 'en-IN';
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.onstart = () => { setVoiceSearchMessage(''); setIsVoiceListening(true); };
      recognition.onresult = (event: any) => {
        const transcript = Array.from(event?.results || []).map((result: any) => result?.[0]?.transcript || '').join(' ').trim();
        receivedResult = Boolean(transcript);
        if (transcript) setSearchQuery(transcript);
        else setVoiceSearchMessage('No speech detected. Try again.');
      };
      recognition.onerror = (event: any) => {
        hadError = true;
        const errorCode = String(event?.error || '');
        setVoiceSearchMessage(errorCode === 'not-allowed' || errorCode === 'service-not-allowed'
          ? 'Microphone permission was denied. You can still type your search.'
          : errorCode === 'no-speech'
            ? 'No speech detected. Try again.'
            : 'Voice search is unavailable right now. You can still type your search.');
        setIsVoiceListening(false);
      };
      recognition.onend = () => {
        setIsVoiceListening(false);
        speechRecognitionRef.current = null;
        if (!receivedResult && !hadError) setVoiceSearchMessage('No speech detected. Try again.');
      };
      speechRecognitionRef.current = recognition;
      setVoiceSearchMessage('');
      setIsVoiceListening(true);
      recognition.start();
    } catch {
      speechRecognitionRef.current = null;
      setIsVoiceListening(false);
      setVoiceSearchMessage('Voice search is unavailable right now. You can still type your search.');
    }
  };

  const handleVerifyOtp = async () => { setIsLoading(true); const { data, error } = await supabase.auth.verifyOtp({ phone: `+91${phoneNumber}`, token: otp, type: 'sms' }); setIsLoading(false); if (data.session && data.user && !error) { setUser(data.session.user); setIsAuthModalOpen(false); void loadGrowthData(); showToast("Welcome back!"); } else showToast('Incorrect or expired OTP. Please try again.'); };
  const handleLogout = async () => { await supabase.auth.signOut(); setUser(null); setRewardBalance(0); setRewardHistory([]); setReferralCode(''); setUseZeshuCash(false); setZeshuCashAmount(''); setIsAccountOpen(false); showToast("Logged out."); };
  const openAccountHome = () => { setAccountView('HOME'); setIsAccountOpen(true); };
  const openAiSupport = () => {
    if (!user) {
      setIsAuthModalOpen(true);
      showToast('Sign in to chat with Zeshu Assistant.');
      return;
    }
    setAccountView('SUPPORT');
    setIsAccountOpen(true);
  };
  const closeAccount = () => { setAccountView('HOME'); setIsAccountOpen(false); };
  const goToHome = () => {
    setActiveTab('home');
    setActiveCategory('All');
    setSearchQuery('');
    setVoiceSearchMessage('');
    setIsCartOpen(false);
    setIsAccountOpen(false);
    setIsAuthModalOpen(false);
    setIsTrackingOpen(false);
    setLocationSelectorOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const askSupportAssistant = async () => {
    const question = supportAssistantQuestion.trim();
    if (!question || supportAssistantBusy) return;
    const history = supportAssistantMessages.slice(-10);
    setSupportAssistantQuestion('');
    setSupportAssistantBusy(true);
    setSupportAssistantAnswer('');
    setSupportAssistantResolved(null);
    setSupportAssistantSource('');
    setSupportAssistantMessages((current) => [...current, { role: 'CUSTOMER', body: question }]);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        const answer = 'Please sign in so Zeshu can help safely and connect you to support if needed.';
        setSupportAssistantAnswer(answer);
        setSupportAssistantMessages((current) => [...current, { role: 'AI', body: answer }]);
        setSupportAssistantResolved(false);
        return;
      }
      const response = await fetch('/api/support/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ message: question, history }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(typeof payload.error === 'string' ? payload.error : 'Zeshu Assistant is temporarily unavailable.');
      const answer = String(payload.answer || 'I could not resolve that safely. Please connect to Zeshu Support.');
      setSupportAssistantAnswer(answer);
      setSupportAssistantMessages((current) => [...current, { role: 'AI', body: answer }]);
      setSupportAssistantResolved(payload.resolved === true);
      setSupportAssistantSource(payload.source === 'ai' ? 'ai' : 'guided');

      const transferredConversation = payload?.handoff?.created ? payload?.handoff?.conversation : null;
      if (transferredConversation?.id) {
        setSupportConversations((current) => [transferredConversation, ...current.filter((item) => item.id !== transferredConversation.id)]);
        setSelectedSupportConversationId(transferredConversation.id);
        setSupportThread(null);
        setSupportThreadRefreshToken((value) => value + 1);
        setSupportNotice('Zeshu Assistant could not fully resolve this, so your conversation was automatically transferred to Zeshu Support. You do not need to repeat the issue.');
      } else if (payload.resolved !== true) {
        setSupportMessage(question);
        setSupportSubject('Other');
        setSupportNotice('The automatic transfer could not be completed. Your question is ready below so you can send it to Zeshu Support without retyping it.');
      }
    } catch (assistantError) {
      const answer = assistantError instanceof Error ? assistantError.message : 'Zeshu Assistant is temporarily unavailable.';
      setSupportAssistantAnswer(answer);
      setSupportAssistantMessages((current) => [...current, { role: 'AI', body: answer }]);
      setSupportAssistantResolved(false);
      setSupportMessage(question);
      setSupportSubject('Other');
      setSupportNotice('AI help is temporarily unavailable. Your question is ready for Zeshu Support below.');
    } finally {
      setSupportAssistantBusy(false);
    }
  };

  const connectAssistantToHuman = () => {
    const latestCustomerMessage = [...supportAssistantMessages].reverse().find((message) => message.role === 'CUSTOMER')?.body || supportAssistantQuestion.trim();
    if (latestCustomerMessage) setSupportMessage(latestCustomerMessage);
    setSupportSubject('Other');
    setSelectedSupportConversationId(null);
    setSupportNotice('Your question is ready below. Add any order details and send it to Zeshu Support.');
  };

  const submitSupportConversation = async () => {
    if (!supportMessage.trim() || supportBusy) return;
    setSupportBusy(true); setSupportNotice('');
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) { setSupportNotice('Your customer session has expired. Please sign in again.'); return; }
      const response = await fetch('/api/support/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ subject: supportSubject, message: supportMessage.trim() }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(typeof payload.error === 'string' ? payload.error : 'Support is temporarily unavailable.');
      setSupportMessage('');
      setSupportNotice('Your message was saved for the support team.');
      setSupportConversations((current) => [payload.conversation, ...current.filter((item) => item.id !== payload.conversation?.id)]);
      if (payload.conversation?.id) {
        setSelectedSupportConversationId(payload.conversation.id);
        setSupportThread(null);
      }
    } catch (error) {
      setSupportNotice(error instanceof Error && error.message.includes('prepared') ? 'Support chat is being prepared. Please email support@zeshu.in.' : 'Support is temporarily unavailable. Please try again or email support@zeshu.in.');
    } finally { setSupportBusy(false); }
  };
  const sendSupportThreadMessage = async () => {
    if (!selectedSupportConversationId || !supportThreadMessage.trim() || supportThreadBusy || supportThread?.conversation?.status === 'RESOLVED') return;
    setSupportThreadBusy(true); setSupportNotice('');
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error('Your customer session has expired. Please sign in again.');
      const response = await fetch(`/api/support/conversations/${selectedSupportConversationId}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'message', message: supportThreadMessage.trim() }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(typeof payload.error === 'string' ? payload.error : 'Support is temporarily unavailable.');
      setSupportThreadMessage('');
      setSupportNotice('Your message was sent to the support team.');
      if (payload.message && supportThread) setSupportThread({ ...supportThread, conversation: { ...supportThread.conversation, status: 'OPEN', updated_at: payload.message.created_at }, messages: [...supportThread.messages, payload.message] });
      setSupportConversations((current) => current.map((item) => item.id === selectedSupportConversationId ? { ...item, status: 'OPEN', updated_at: payload.message?.created_at, last_message: { body: payload.message?.body || '', sender_role: 'CUSTOMER', created_at: payload.message?.created_at } } : item));
      setSupportThreadRefreshToken((value) => value + 1);
    } catch (error) {
      setSupportNotice(error instanceof Error ? error.message : 'Support is temporarily unavailable.');
    } finally { setSupportThreadBusy(false); }
  };
  const escalateSupportConversation = async () => {
    if (!selectedSupportConversationId || supportThreadBusy || !supportThread || supportThread.conversation.status === 'WAITING' || supportThread.conversation.status === 'RESOLVED') return;
    setSupportThreadBusy(true); setSupportNotice('');
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error('Your customer session has expired. Please sign in again.');
      const response = await fetch(`/api/support/conversations/${selectedSupportConversationId}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'escalate' }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(typeof payload.error === 'string' ? payload.error : 'Support is temporarily unavailable.');
      if (payload.conversation) setSupportThread({ ...supportThread, conversation: payload.conversation });
      setSupportNotice('A support agent has been requested.');
      setSupportConversations((current) => current.map((item) => item.id === selectedSupportConversationId ? { ...item, ...payload.conversation } : item));
    } catch (error) {
      setSupportNotice(error instanceof Error ? error.message : 'Support is temporarily unavailable.');
    } finally { setSupportThreadBusy(false); }
  };
  const openSupportConversation = (conversationId: string) => {
    setSelectedSupportConversationId(conversationId);
    setSupportThread(null);
    setSupportNotice('');
  };
  const startNewSupportConversation = () => {
    setSelectedSupportConversationId(null);
    setSupportThread(null);
    setSupportThreadMessage('');
    setSupportNotice('');
  };
  const updateSupportWhatsappPreference = async (enabled: boolean) => {
    if (!SUPPORT_WHATSAPP_UI_ENABLED || !supportWhatsappPreferenceLoaded || supportWhatsappPreferenceSaving || (enabled && !supportWhatsappPhoneAvailable)) return;
    const previousEnabled = supportWhatsappEnabled;
    setSupportWhatsappEnabled(enabled);
    setSupportWhatsappPreferenceSaving(true);
    setSupportWhatsappPreferenceError('');
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error('Authentication required.');
      const response = await fetch('/api/support/notifications/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ enabled }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload || typeof payload.whatsapp_transactional_enabled !== 'boolean' || typeof payload.phone_available !== 'boolean') {
        throw new Error('Preference update failed.');
      }
      setSupportWhatsappEnabled(payload.whatsapp_transactional_enabled);
      setSupportWhatsappPhoneAvailable(payload.phone_available);
    } catch {
      setSupportWhatsappEnabled(previousEnabled);
      setSupportWhatsappPreferenceError('Could not update WhatsApp preferences. Please try again.');
    } finally {
      setSupportWhatsappPreferenceSaving(false);
    }
  };
  const applyReferral = async () => { const code = referralInput.trim().toUpperCase(); if (!code || referralApplying) return; setReferralApplying(true); setReferralMessage(''); const { error } = await supabase.rpc('apply_referral_code', { p_code: code }); setReferralApplying(false); if (error) { if (process.env.NODE_ENV === 'development') console.error('Referral code failed:', error.message); setReferralMessage('This referral code could not be applied.'); return; } setReferralInput(''); setReferralMessage('Referral applied. Complete your first delivered order to unlock the reward.'); };
  const copyReferralCode = async () => { if (!referralCode) return; try { await navigator.clipboard?.writeText(referralCode); setReferralCopied(true); setReferralMessage('Invite code copied.'); window.setTimeout(() => setReferralCopied(false), 1800); } catch { setReferralMessage(`Your invite code: ${referralCode}`); } };
  const shareReferralCode = async () => { if (!referralCode) return; try { if (navigator.share) { await navigator.share({ title: 'Join Zeshu', text: `Use my Zeshu invite code ${referralCode}` }); return; } await copyReferralCode(); } catch { /* Sharing was cancelled; keep the account drawer unchanged. */ } };

  const toggleFavorite = async (product: any) => {
    if (!user) { setIsAuthModalOpen(true); return; }
    const productId = String(product.id);
    if (favoriteBusyId === productId) return;
    setFavoriteBusyId(productId);
    const isFavorite = favoriteIds.has(productId);
    const { error } = await supabase.rpc(isFavorite ? 'customer_remove_favorite' : 'customer_add_favorite', { p_product_id: product.id });
    setFavoriteBusyId(null);
    if (error) {
      if (process.env.NODE_ENV === 'development') console.error('Favorite update failed:', error.message);
      return showToast('Could not update favorites. Please try again.');
    }
    setFavoriteIds((current) => {
      const next = new Set(current);
      if (isFavorite) next.delete(productId); else next.add(productId);
      return next;
    });
    setFavoriteProducts((current) => isFavorite ? current.filter((entry) => String(entry.id) !== productId) : [product, ...current.filter((entry) => String(entry.id) !== productId)].slice(0, 100));
    showToast(isFavorite ? 'Removed from favorites.' : 'Added to favorites.');
  };
  
  const addToCart = (product: any) => {
    if (!product?.vendor_id || product?.in_stock === false || Number(product?.quantity) <= 0) return showToast('This product is currently unavailable.');
    setCheckoutError(null);
    const existing = cart.find((entry) => String(entry.item.id) === String(product.id));
    const cartVendorIds = Array.from(new Set(cart.map((entry) => entry.item?.vendor_id).filter(Boolean)));
    if (product?.vendor_id && cartVendorIds.some((vendorId) => vendorId !== product.vendor_id)) return showToast('Checkout supports one store at a time.');
    if (existing && product.quantity !== null && existing.qty >= Number(product.quantity)) return showToast('Maximum available quantity already in your cart.');
    setCart(prev => { const current = prev.find((entry) => String(entry.item.id) === String(product.id)); return current ? prev.map(c => String(c.item.id) === String(product.id) ? { ...c, qty: c.qty + 1 } : c) : [...prev, { item: product, qty: 1 }]; });
    showToast(`${product.name} added`);
  };
  const removeFromCart = (productId: any) => { setCheckoutError(null); setCart(prev => { const existing = prev.find(c => c.item.id === productId); if (existing && existing.qty > 1) { return prev.map(c => c.item.id === productId ? { ...c, qty: c.qty - 1 } : c); } else { const newCart = prev.filter(c => c.item.id !== productId); if (newCart.length === 0) setIsCartOpen(false); return newCart; } }); };
  const clearCart = () => {
    if (!cart.length || !window.confirm('Clear every item from your cart?')) return;
    setCheckoutError(null);
    setCart([]);
    showToast('Cart cleared.');
  };

  // Reward redemption display math; checkout remains server-authoritative.
  const itemTotal = cart.reduce((acc, curr) => acc + (curr.item.price * curr.qty), 0);
  const freeDeliveryThreshold = 299;
  const deliveryCharge = itemTotal > 0 && itemTotal < freeDeliveryThreshold ? 30 : 0;

  const maskedPhone = (phone: string | undefined) => {
    const digits = String(phone || '').replace(/\D/g, '');
    if (digits.length < 4) return 'Protected account';
    return `+91 ••••••${digits.slice(-4)}`;
  };
  
  const getCustomerFirstName = (customer: any) => {
    const metadata = customer?.user_metadata;
    const raw = metadata?.first_name || metadata?.full_name || metadata?.name;
    const first = typeof raw === 'string' ? raw.trim().split(/\s+/)[0] : '';
    return first || 'there';
  };

  const zeshuCashMax = itemTotal > 0 ? Math.max(0, Math.min(rewardBalance, 20, Math.floor(itemTotal * 0.1))) : 0;
  const requestedZeshuCash = useZeshuCash ? Math.max(0, Math.min(Number(zeshuCashAmount || zeshuCashMax), zeshuCashMax)) : 0;
  const finalCartTotal = itemTotal > 0 ? (itemTotal + deliveryCharge - requestedZeshuCash) : 0;
  const selectedDeliveryAddress = addresses.find((address) => address.id === selectedAddressId) || addresses.find((address) => address.is_default);
  const deliveryAddressSummary = currentAddress !== 'Location not set' && currentAddress.trim() ? currentAddress : selectedDeliveryAddress ? formatAddress(selectedDeliveryAddress) : '';
  const liveDeliveryStatus = ['PICKED_UP', 'OUT_FOR_DELIVERY'].includes(trackedOrder?.status);
  const hasLiveRiderCoordinates = Number.isFinite(Number(liveRider?.current_latitude)) && Number.isFinite(Number(liveRider?.current_longitude));
  const liveRiderMapUrl = hasLiveRiderCoordinates ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${liveRider.current_latitude},${liveRider.current_longitude}`)}` : '';
  const riderFreshness = hasLiveRiderCoordinates ? getRiderLocationFreshness(liveRider?.location_updated_at, riderFreshnessNow) : null;
  const activeOrder = myOrders.find((order) => ACTIVE_ORDER_STATUSES.includes(order?.status));

  const refreshCartAvailability = async () => {
    const ids = cart.map((entry) => entry.item?.id).filter(Boolean);
    if (!ids.length) return true;
    const { data, error } = await supabase.from('products').select('*').in('id', ids);
    if (error) return true; // Server reservation remains authoritative if this advisory refresh fails.
    const currentById = new Map((data || []).map((product: any) => [String(product.id), product]));
    const changed = cart.some((entry) => {
      const current = currentById.get(String(entry.item.id));
      return !current || current.price !== entry.item.price || current.in_stock === false || (current.quantity !== null && Number(current.quantity) < entry.qty);
    });
    if (!changed) return true;
    const changedNames: string[] = [];
    const nextCart = cart.flatMap((entry) => {
      const current = currentById.get(String(entry.item.id));
      if (!current || current.in_stock === false || (current.quantity !== null && Number(current.quantity) <= 0)) {
        changedNames.push(String(current?.name || entry.item?.name || 'An item'));
        return [];
      }
      const availableQuantity = current.quantity === null ? entry.qty : Math.max(0, Math.min(entry.qty, Number(current.quantity)));
      if (availableQuantity !== entry.qty || current.price !== entry.item.price) changedNames.push(String(current.name || entry.item?.name || 'An item'));
      return [{ ...entry, item: current, qty: availableQuantity }].filter((item) => item.qty > 0);
    });
    setCart(nextCart);
    showToast(`Some items in your cart have changed availability. Please review the updated quantities.${changedNames.length ? ` (${changedNames.join(', ')})` : ''}`);
    return false;
  };

  const validateCartFreshness = refreshCartAvailability;

  const handleCartCheckout = async (abandonPreviousCheckout = false, bypassOpeningGuard = false) => {
    if (process.env.NODE_ENV === 'development') {
      console.info('Checkout button pressed', {
        cartLength: cart.length,
        cartProductIds: cart.map((entry) => String(entry.item?.id ?? '')),
        cartQuantities: cart.map((entry) => entry.qty),
        hasDeliveryAddress: currentAddress.trim().length > 0 && currentAddress !== 'Location not set',
        deliveryAddressLength: currentAddress.trim().length,
        hasAuthenticatedUser: Boolean(user),
      });
    }
    if (isCheckoutOpening && !bypassOpeningGuard) return;
    setCheckoutError(null);
    if (!cart.length || finalCartTotal === 0) return showCheckoutError('Add an available product before checkout.', 'INVALID_CHECKOUT_DATA');
    if (!user) return setIsAuthModalOpen(true);
    if (!currentAddress.trim() || currentAddress === 'Location not set' || currentAddress === 'Current GPS Location Synced') {
      setIsCartOpen(true);
      return showCheckoutError('Enter a delivery address before checkout.', 'INVALID_CHECKOUT_DATA');
    }
    if (currentAddress === 'Fetching precise location...') return showCheckoutError('Enter a delivery address before checkout.', 'INVALID_CHECKOUT_DATA');
    if (!(await validateCartFreshness())) return showCheckoutError('Some items in your cart have changed availability. Please review the updated quantities.', 'PRODUCT_UNAVAILABLE');
    const checkoutVendorIds = cart.map((entry) => entry.item?.vendor_id).filter(Boolean).map(String);
    if (checkoutVendorIds.length !== cart.length || new Set(checkoutVendorIds).size !== 1) {
      return showCheckoutError(CHECKOUT_ERROR_MESSAGES.MULTI_VENDOR_CART, 'MULTI_VENDOR_CART');
    }
    setIsCheckoutOpening(true);
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const orderResponse = await fetch('/api/create-razorpay-order', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token || ''}` }, body: JSON.stringify({ cartItems: cart, deliveryAddress: currentAddress, deliveryAddressId: selectedAddressId, zeshuCashAmount: requestedZeshuCash, abandonPreviousCheckout }) });
      let orderData: any;
      try {
        orderData = await orderResponse.json();
      } catch {
        setIsLoading(false);
        setIsCheckoutOpening(false);
        showCheckoutError(CHECKOUT_ERROR_MESSAGES.CHECKOUT_INTERNAL_ERROR, 'CHECKOUT_RESPONSE_INVALID', undefined);
        return;
      }
      if (!orderResponse.ok || !orderData?.success) {
        const code = typeof orderData?.code === 'string' ? orderData.code : 'CHECKOUT_INTERNAL_ERROR';
        if (code === 'ABANDONABLE_PAYMENT_CHECKOUT' && !abandonPreviousCheckout) {
          showToast('Checking previous payment...');
          return await handleCartCheckout(true, true);
        }
        setIsLoading(false);
        setIsCheckoutOpening(false);
        showCheckoutError(checkoutFailureMessage(code), code, typeof orderData?.requestId === 'string' ? orderData.requestId : undefined);
        return;
      }
      if (orderData.abandonedCheckoutReleased) showToast('Previous payment was cancelled. You can continue with a new checkout.');
      if (orderData.resumed) showToast('Previous checkout found. We will safely resume the same payment.');
      const orderId = orderData.orderId || orderData.id || orderData.order?.id;
      const reservationId = orderData.reservationId;
      if (typeof orderId !== 'string' || typeof reservationId !== 'string' || !Number.isSafeInteger(Number(orderData.amount)) || Number(orderData.amount) <= 0) throw new Error('Unable to prepare a verified payment checkout.');
      let paymentSucceeded = false;
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, amount: Number(orderData.amount), currency: orderData.currency || 'INR', name: "Zeshu Super App", order_id: orderId,
        retry: { enabled: true },
        handler: async function (response: any) {
          paymentSucceeded = true;
          setIsLoading(true);
          const { data: { session } } = await supabase.auth.getSession();
          if (!session?.user || typeof response?.razorpay_payment_id !== 'string' || typeof response?.razorpay_order_id !== 'string' || typeof response?.razorpay_signature !== 'string') {
            showToast('Payment succeeded, but verification details were incomplete. Do not pay again.');
            setIsLoading(false);
            setIsCheckoutOpening(false);
            return;
          }
          const pendingConfirmation: PendingGroceryConfirmation = {
            userId: session.user.id,
            reservationId,
            paymentId: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature,
          };
          sessionStorage.setItem(PENDING_GROCERY_CONFIRMATION_KEY, JSON.stringify(pendingConfirmation));
          await confirmPendingGroceryOrder(pendingConfirmation);
          setIsLoading(false);
          setIsCheckoutOpening(false);
        },
        modal: {
          ondismiss: () => {
            if (paymentSucceeded) return;
            setCheckoutError(null);
            showToast('Payment cancelled. You can retry whenever you\'re ready.');
            setIsLoading(false);
            setIsCheckoutOpening(false);
          },
        },
        theme: { color: "#4F46E5" },
      };
      const rzp = new (window as any).Razorpay(options); rzp.open();
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      const lower = message.toLowerCase();
      const stockFailure = lower.includes('stock') || lower.includes('quantity') || lower.includes('unavailable') || lower.includes('no longer available');
      if (stockFailure) await refreshCartAvailability();
      const safeMessage = lower.includes('price') ? 'A product price changed. Review your cart and try again.' : stockFailure ? 'One or more products are no longer available in that quantity.' : CHECKOUT_ERROR_MESSAGES.CHECKOUT_INTERNAL_ERROR;
      showCheckoutError(safeMessage, stockFailure ? 'INSUFFICIENT_STOCK' : 'CHECKOUT_INTERNAL_ERROR');
      setIsCheckoutOpening(false);
    }
    setIsLoading(false);
  };

  const handleCheckPaymentStatus = async () => {
    if (isCheckingPaymentStatus || isCheckoutOpening) return;
    setIsCheckingPaymentStatus(true);
    try {
      await handleCartCheckout();
    } finally {
      setIsCheckingPaymentStatus(false);
    }
  };

  const handleContinueCurrentBasket = async () => {
    if (isCheckoutOpening || isCheckingPaymentStatus) return;
    setIsCheckingPaymentStatus(true);
    try {
      await handleCartCheckout(true);
    } finally {
      setIsCheckingPaymentStatus(false);
    }
  };

  const handleRechargeCheckout = () => {
    showToast('Recharge fulfillment is currently unavailable. No payment has been started.');
  };

  const handleMobileTestPayment = async () => {
    if (testRechargeLoading || !planDiscovery || !rechargeAmount) return;
    setTestRechargeLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) { showToast('Your customer session has expired. Please sign in again.'); setTestRechargeLoading(false); return; }
      const response = await fetch('/api/recharge/create-test-payment', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` }, body: JSON.stringify({ mobile: rechargeNumber, planId: selectedPlanId, amount: Number(rechargeAmount) }) });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Test payment is unavailable.');
      const options = {
        key: data.keyId, amount: data.amount, currency: data.currency || 'INR', name: 'Zeshu Super App', description: 'Mobile recharge test payment', order_id: data.orderId,
        handler: async (paymentResponse: any) => {
          const verification = await fetch('/api/recharge/verify-test-payment', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` }, body: JSON.stringify(paymentResponse) });
          const result = await verification.json();
          showToast(result.paymentVerified ? 'Test payment successful. Recharge was not submitted to the operator.' : 'Test payment could not be verified.');
          setTestRechargeLoading(false);
        },
        modal: { ondismiss: () => setTestRechargeLoading(false) },
        theme: { color: '#4F46E5' },
      };
      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Test payment is unavailable.');
      setTestRechargeLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FC] font-sans antialiased text-[#111827] overflow-x-hidden relative">
      <LocationSelector open={locationSelectorOpen} initial={locationSelection} onClose={() => setLocationSelectorOpen(false)} onConfirm={(selection, address) => { setLocationSelection(selection); setLocationAccuracy(selection.accuracy); setAddressForm((current) => ({ ...current, latitude: String(selection.latitude), longitude: String(selection.longitude) })); setCurrentAddress(address); try { const displayAddress = (selection.displayAddress || address).trim(); window.localStorage.setItem(LAST_CONFIRMED_LOCATION_KEY, JSON.stringify({ latitude: selection.latitude, longitude: selection.longitude, ...(displayAddress && displayAddress !== 'Move the map to your delivery location' && displayAddress !== 'Selected location' ? { displayAddress } : {}), accuracy: selection.accuracy, source: selection.source, confirmed_at: new Date().toISOString() })); } catch { /* localStorage may be unavailable */ } setLocationSelectorOpen(false); setAddressFormOpen(true); showToast('Delivery location confirmed. Add your house or flat details.'); }} />
      {isOffline && <div role="status" aria-live="polite" className="fixed left-1/2 top-20 z-[145] -translate-x-1/2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-center text-xs font-bold text-amber-900 shadow-sm">You&apos;re offline. Live location and ETA may be delayed.</div>}
      <div className={`fixed bottom-32 left-1/2 -translate-x-1/2 z-[150] transition-all duration-500 ${toastMessage ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-10 scale-95 pointer-events-none'}`}>
        <div className="bg-[#1F2937]/95 backdrop-blur-xl text-white px-6 py-3.5 rounded-full font-bold text-sm shadow-2xl flex items-center gap-2.5 border border-white/10"><CheckCircle size={18} className="text-[#10B981]"/>{toastMessage}</div>
      </div>

      <header className={`fixed top-0 w-full z-40 transition-all duration-500 ${isScrolled ? 'bg-white/90 backdrop-blur-2xl shadow-sm border-b border-gray-200/40' : 'bg-white border-b border-gray-100'}`}>
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-3 md:py-0 md:h-[88px] flex flex-col md:flex-row items-center justify-between gap-3 md:gap-8">
          <div className="flex items-center justify-between w-full md:w-auto gap-4">
            <div className="flex items-center gap-4 md:gap-6">
              <button aria-label="Go to Zeshu home" className="flex items-center gap-2 md:gap-3 md:border-r border-gray-200/60 md:pr-6 active:scale-[0.97] transition-transform" onClick={goToHome}>
                <div className="bg-[#087443] text-white font-black p-2 md:p-2.5 rounded-xl md:rounded-2xl text-xl md:text-2xl tracking-tighter shadow-sm">Z</div>
                <div className="hidden md:flex flex-col text-left"><span className="text-[22px] font-black tracking-tighter leading-none">ZESHU</span><span className="text-[10px] font-extrabold text-[#087443] tracking-[0.2em] uppercase mt-0.5">Everyday, simply</span></div>
              </button>
              <button type="button" aria-label="Detect or change delivery location" className="flex max-w-[160px] flex-col cursor-pointer text-left transition-transform active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#087443] md:max-w-[220px]" onClick={handleAutoDetectLocation}>
                <div className="font-black text-[13px] md:text-[15px] flex items-center gap-1.5">{locationAccuracy !== null ? 'Try location again' : 'Use my current location'} <MapPin size={14} className="text-[#087443]"/></div>
                <div className="flex items-center text-[10px] md:text-xs text-[#6B7280] mt-0.5 font-medium truncate">{currentAddress}<ChevronDown size={14} className="ml-1"/></div>
              </button>
            </div>

            <div className="md:hidden flex items-center gap-2">
              <Link href="/scanner" aria-label="Open QR scanner" className="p-2 bg-[#087443] text-white rounded-full active:scale-95 shadow-md flex items-center justify-center">
                <QrCode size={18} />
              </Link>
              <button aria-label={user ? 'Open account' : 'Sign in'} onClick={() => user ? openAccountHome() : setIsAuthModalOpen(true)} className="p-2 bg-gray-100 rounded-full active:scale-95 text-gray-700 border border-gray-200"><User size={18} /></button>
              <button aria-label="Open cart" onClick={() => setIsCartOpen(true)} className="relative p-2 bg-gray-100 rounded-full active:scale-95 border border-gray-200">
                <ShoppingBag size={18} className="text-gray-700" />
                {cart.length > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full text-[9px] font-black w-4 h-4 flex items-center justify-center border border-white">{cart.length}</span>}
              </button>
            </div>
          </div>

          <div className="w-full md:flex-1 max-w-3xl order-last md:order-none mt-1 md:mt-0">
            <div className="bg-[#f1f4f1] transition-all rounded-[14px] md:rounded-[20px] flex items-center px-4 py-3 md:py-4 focus-within:bg-white focus-within:ring-2 focus-within:ring-[#087443]/25">
              <Search className="text-[#9CA3AF] w-[18px] h-[18px] md:w-[22px] md:h-[22px]" />
              <input aria-label="Search products" type="search" placeholder="Search products" className="bg-transparent border-none outline-none flex-1 ml-2 md:ml-3 text-[14px] md:text-[16px] font-medium" value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setVoiceSearchMessage(''); }} />
              {searchQuery && <button type="button" aria-label="Clear search" className="text-gray-500 p-1" onClick={() => setSearchQuery('')}><X size={16}/></button>}
              <button type="button" aria-label={isVoiceListening ? 'Stop voice search' : 'Search by voice'} aria-pressed={isVoiceListening} className={`ml-1 rounded-full p-1.5 text-[#087443] transition ${isVoiceListening ? 'bg-[#d9f4e3] animate-pulse' : 'hover:bg-[#e5f4ea]'}`} onClick={toggleVoiceSearch}><Mic size={18} aria-hidden="true" /></button>
            </div>
            {(isVoiceListening || voiceSearchMessage) && <p className="mt-1 px-2 text-xs font-bold text-[#087443]" role="status" aria-live="polite">{isVoiceListening ? 'Listening…' : voiceSearchMessage}</p>}
          </div>

          <div className="hidden md:flex items-center gap-4 shrink-0">
            <Link href="/scanner" className="flex items-center gap-2 bg-[#087443] text-white px-4 py-2.5 rounded-full font-black text-sm transition-all active:scale-95 shadow-sm">
              <QrCode size={18} /><span>Scan</span>
            </Link>
            <button onClick={() => user ? openAccountHome() : setIsAuthModalOpen(true)} className="flex items-center gap-2 text-[#4B5563] font-extrabold text-sm active:scale-95"><User size={20}/>{user ? 'Account' : 'Login'}</button>
            <button onClick={() => setIsCartOpen(true)} className="bg-gradient-to-b from-[#059669] to-[#047857] text-white px-5 py-3.5 rounded-[20px] flex items-center gap-3 font-bold text-sm min-w-[120px] justify-center active:scale-[0.96]">
              <ShoppingBag size={22} /> {cart.length > 0 ? `₹${finalCartTotal}` : 'My Cart'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto w-full md:px-8 py-8 pt-[130px] md:pt-[120px] flex gap-8">
        {activeTab === 'home' && normalizedSearch === '' && (
          <aside className="hidden lg:block w-[260px] shrink-0 sticky top-[120px] h-[calc(100vh-120px)] overflow-y-auto no-scrollbar pr-4">
            <h3 className="font-black text-[#111827] mb-5 px-3 tracking-tight text-lg">Shop by Category</h3>
            <div className="flex flex-col gap-1.5">
              {productCategories.map(cat => (
                <button key={cat} onClick={() => setActiveCategory(cat)} className={`text-left px-4 py-3.5 rounded-[18px] font-extrabold text-sm transition-all flex items-center gap-3.5 active:scale-[0.97] ${activeCategory === cat ? 'bg-[#EEF2FF] text-[#4F46E5] shadow-[inset_4px_0_0_0_#4F46E5]' : 'text-[#6B7280] hover:bg-white border border-transparent hover:border-gray-200/60'}`}>
                  {cat === 'Food Delivery' ? <Flame size={16} className="text-orange-500"/> : cat === 'Electronics' ? <Zap size={16} className="text-blue-500"/> : <Package size={16} />}
                  {cat}
                </button>
              ))}
            </div>
          </aside>
        )}

        <div className="flex-1 min-w-0 pb-32">
           {activeTab === 'home' && <div className="mb-5 flex gap-2 overflow-x-auto px-4 pb-1 no-scrollbar md:px-0" aria-label="Product categories">{productCategories.map((category) => <button type="button" key={category} onClick={() => setActiveCategory(category)} aria-pressed={activeCategory === category} className={`whitespace-nowrap rounded-full border px-4 py-2 text-xs font-black transition ${activeCategory === category ? 'border-[#087443] bg-[#087443] text-white' : 'border-[#dce8df] bg-white text-[#52645a]'}`}>{category}</button>)}</div>}
           {activeTab === 'home' && <>
             <div className="mb-5 flex items-center justify-between gap-3 px-4 md:px-0">
               <button type="button" aria-expanded={isProductFiltersOpen} aria-controls="product-filters" onClick={() => setIsProductFiltersOpen((current) => !current)} className="inline-flex items-center gap-2 rounded-xl border border-[#dce8df] bg-white px-3 py-2.5 text-xs font-black text-[#087443] shadow-sm"><SlidersHorizontal size={16} aria-hidden="true" /> Filters{activeProductFilterCount > 0 && <span className="rounded-full bg-[#087443] px-1.5 py-0.5 text-[10px] text-white">{activeProductFilterCount}</span>}</button>
               {productSort !== 'recommended' && <span className="text-xs font-bold text-slate-500">Sorted by {productSort === 'name' ? 'name' : productSort === 'price_asc' ? 'lowest price' : 'highest price'}</span>}
             </div>
             {isProductFiltersOpen && <div id="product-filters" className="mb-5 rounded-2xl border border-[#dce8df] bg-white p-4 shadow-sm">
               <div className="mb-3 flex items-center justify-between gap-3"><h3 className="text-sm font-black text-slate-900">Filter products</h3><button type="button" onClick={clearProductFilters} className="text-xs font-black text-[#087443]">Clear all</button></div>
               <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                 <label className="text-xs font-black text-slate-600">Category<select value={activeCategory} onChange={(event) => setActiveCategory(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-700"><option value="All">All categories</option>{productCategories.filter((category) => category !== 'All').map((category) => <option key={category} value={category}>{category}</option>)}</select></label>
                 <label className="text-xs font-black text-slate-600">Brand<select value={brandFilter} onChange={(event) => setBrandFilter(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-700"><option value="ALL">All brands</option>{productBrands.map((brand) => <option key={brand} value={brand}>{brand}</option>)}</select></label>
                 <label className="text-xs font-black text-slate-600">Price<select value={priceFilter} onChange={(event) => setPriceFilter(event.target.value as typeof priceFilter)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-700"><option value="ALL">Any price</option><option value="UNDER_100">Under ₹100</option><option value="100_299">₹100–₹299</option><option value="300_499">₹300–₹499</option><option value="500_PLUS">₹500+</option></select></label>
                 <label className="text-xs font-black text-slate-600">Availability<select value={availabilityFilter} onChange={(event) => setAvailabilityFilter(event.target.value as typeof availabilityFilter)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-700"><option value="ALL">All products</option><option value="AVAILABLE">In stock / available</option></select></label>
                 <label className="text-xs font-black text-slate-600">Sort<select value={productSort} onChange={(event) => setProductSort(event.target.value as typeof productSort)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-700"><option value="recommended">Recommended</option><option value="price_asc">Price: Low to High</option><option value="price_desc">Price: High to Low</option><option value="name">Name A-Z</option></select></label>
               </div>
             </div>}
           </>}
          {activeTab === 'recharge' ? (
             <div className="bg-white rounded-[32px] shadow-xl border border-gray-100 max-w-2xl mx-auto overflow-hidden animate-in slide-in-from-bottom-4">
               <div className="flex overflow-x-auto bg-[#F8F9FC] p-3 gap-2 border-b border-gray-100 no-scrollbar">
                     {SERVICES.map((s) => (
                   <button key={s.id} onClick={() => { setActiveService(s.id); setSelectedOperator(''); setPlans([]); setFetchedBill(null); setRechargeNumber(''); setRechargeAmount(''); setSelectedPlanId(''); setMedResults(null); setMedSearchQuery(''); }} className={`flex items-center gap-2 px-5 py-3 rounded-[16px] whitespace-nowrap text-sm font-bold transition-all active:scale-95 ${activeService === s.id ? 'bg-white shadow-md text-[#111827]' : 'text-[#6B7280] hover:bg-[#E5E7EB]'}`}>
                     {s.icon} {s.id === 'upi' ? 'UPI Tools · Soon' : s.label}
                   </button>
                 ))}
               </div>
               
               <div className="p-5 md:p-8 space-y-5">
                 {unavailableService && ['pharmacy', 'upi'].includes(activeService) ? (
                   <div className="rounded-3xl border border-[#cfe7d8] bg-[#f4fbf6] p-6 text-center md:p-10">
                     <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e1f3e7] text-[#087443]"><Info size={24}/></div>
                    <h2 className="text-xl font-black text-[#183524]">{activeService === 'pharmacy' ? 'Licensed pharmacy fulfillment is being onboarded. No medicine payment or prescription transaction is available.' : `${currentServiceObj.label} is not available yet`}</h2>
                     <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#587065]">{activeService === 'pharmacy' ? 'You can return to groceries while our verified pharmacy fulfillment network is being prepared. No medicine payment or delivery can be started here.' : 'We&apos;re connecting verified providers before enabling this service. No payment can be started from this screen.'}</p>
                     <button onClick={() => setActiveTab('home')} className="mt-6 rounded-xl bg-[#087443] px-5 py-3 text-sm font-bold text-white active:scale-[.98]">Continue shopping</button>
                   </div>
                 ) : activeService === 'gas' ? (
                   <div className="space-y-5"><button type="button" onClick={() => void loadPipedGasOperators()} disabled={pipedGasLoading} className="w-full rounded-2xl border-2 border-dashed border-[#C7D2FE] bg-[#EEF2FF] p-4 text-sm font-black text-[#4F46E5] disabled:opacity-50">{pipedGasLoading ? 'Loading providers...' : 'Load Piped Gas providers'}</button>{pipedGasOperators.length > 0 && <div className="space-y-2"><label htmlFor="piped-gas-search" className="sr-only">Search Piped Gas providers</label><input id="piped-gas-search" value={pipedGasSearch} onChange={(event) => setPipedGasSearch(event.target.value)} placeholder="Search providers..." className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold" /><div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200">{pipedGasOperators.filter((operator: any) => operator.name.toLowerCase().includes(pipedGasSearch.toLowerCase())).map((operator: any) => <button type="button" key={operator.operatorCode} onClick={() => { setPipedGasOperator(operator); setPipedGasConsumerNumber(''); setPipedGasInfo(null); }} className={`block w-full px-4 py-3 text-left text-sm font-bold hover:bg-emerald-50 ${pipedGasOperator?.operatorCode === operator.operatorCode ? 'bg-emerald-50 text-[#087443]' : ''}`}>{operator.name}</button>)}</div></div>}<div><label htmlFor="piped-gas-consumer" className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#6B7280]">Consumer / connection number</label><input id="piped-gas-consumer" value={pipedGasConsumerNumber} onChange={(event) => setPipedGasConsumerNumber(event.target.value.slice(0, 80))} placeholder="Enter consumer number" className="w-full rounded-2xl border border-gray-200 bg-[#F8F9FC] p-4 text-lg font-bold" /></div><button type="button" onClick={() => void fetchPipedGasDetails()} disabled={pipedGasLoading || !pipedGasOperator} className="w-full rounded-2xl bg-[#087443] p-4 text-sm font-black text-white disabled:opacity-50">{pipedGasLoading ? 'Checking details...' : 'Check Piped Gas bill'}</button>{pipedGasInfo && <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5"><p className="mb-3 text-sm font-black text-[#173d27]">Piped Gas details</p>{Object.entries(pipedGasInfo).map(([key, value]) => <div key={key} className="flex justify-between gap-3 border-b border-emerald-100 py-2 text-sm last:border-0"><span className="font-bold text-slate-600">{electricityLabels[key] || key}</span><span className="text-right font-black text-slate-900">{value}</span></div>)}<p className="mt-4 rounded-xl bg-amber-50 p-3 text-center text-sm font-black text-amber-900">Piped Gas payment is not enabled yet.</p></div>}</div>
                 ) : activeService === 'lpg' ? (
                   <div className="space-y-5"><button type="button" onClick={() => void loadLpgOperators()} disabled={lpgLoading} className="w-full rounded-2xl border-2 border-dashed border-[#C7D2FE] bg-[#EEF2FF] p-4 text-sm font-black text-[#4F46E5] disabled:opacity-50">{lpgLoading ? 'Loading providers...' : 'Load LPG providers'}</button>{lpgOperators.length > 0 && <div className="space-y-2"><label htmlFor="lpg-search" className="sr-only">Search LPG providers</label><input id="lpg-search" value={lpgSearch} onChange={(event) => setLpgSearch(event.target.value)} placeholder="Search providers..." className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold" /><div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200">{lpgOperators.filter((operator: any) => operator.name.toLowerCase().includes(lpgSearch.toLowerCase())).map((operator: any) => <button type="button" key={operator.operatorCode} onClick={() => setLpgOperator(operator)} className={`block w-full px-4 py-3 text-left text-sm font-bold hover:bg-emerald-50 ${lpgOperator?.operatorCode === operator.operatorCode ? 'bg-emerald-50 text-[#087443]' : ''}`}>{operator.name}</button>)}</div></div>}<p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-black text-amber-900">LPG account lookup is being prepared for this provider.</p><p className="rounded-xl bg-slate-50 p-4 text-center text-sm font-black text-slate-700">LPG booking and payment are not enabled yet.</p></div>
                 ) : activeService === 'fastag' ? (
                   <div className="space-y-5">
                     <button type="button" onClick={() => void loadFastagOperators()} disabled={fastagLoading} className="w-full rounded-2xl border-2 border-dashed border-[#C7D2FE] bg-[#EEF2FF] p-4 text-sm font-black text-[#4F46E5] disabled:opacity-50">{fastagLoading ? 'Loading providers...' : 'Load FASTag providers'}</button>
                     {fastagOperators.length > 0 && <div className="space-y-2"><label htmlFor="fastag-search" className="sr-only">Search FASTag providers</label><input id="fastag-search" value={fastagSearch} onChange={(event) => setFastagSearch(event.target.value)} placeholder="Search providers..." className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold outline-none focus:border-[#087443]" /><div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200">{fastagOperators.filter((operator: any) => operator.name.toLowerCase().includes(fastagSearch.toLowerCase())).map((operator: any) => <button type="button" key={operator.operatorCode} onClick={() => { setFastagOperator(operator); setFastagVehicleNumber(''); setFastagInfo(null); }} className={`block w-full px-4 py-3 text-left text-sm font-bold hover:bg-emerald-50 ${fastagOperator?.operatorCode === operator.operatorCode ? 'bg-emerald-50 text-[#087443]' : ''}`}>{operator.name}</button>)}</div></div>}
                     <div><label htmlFor="fastag-vehicle" className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#6B7280]">Vehicle registration number</label><input id="fastag-vehicle" value={fastagVehicleNumber} onChange={(event) => setFastagVehicleNumber(event.target.value.slice(0, 15))} placeholder="Enter vehicle number" className="w-full rounded-2xl border border-gray-200 bg-[#F8F9FC] p-4 text-lg font-bold uppercase outline-none focus:border-[#6366F1]" /></div>
                     <button type="button" onClick={() => void fetchFastagDetails()} disabled={fastagLoading || !fastagOperator} className="w-full rounded-2xl bg-[#087443] p-4 text-sm font-black text-white disabled:opacity-50">{fastagLoading ? 'Checking details...' : 'Check FASTag details'}</button>
                     {fastagInfo && <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5"><p className="mb-3 text-sm font-black text-[#173d27]">FASTag details</p>{Object.entries(fastagInfo).map(([key, value]) => <div key={key} className="flex justify-between gap-3 border-b border-emerald-100 py-2 text-sm last:border-0"><span className="font-bold text-slate-600">{electricityLabels[key] || key}</span><span className="text-right font-black text-slate-900">{value}</span></div>)}<p className="mt-4 rounded-xl bg-amber-50 p-3 text-center text-sm font-black text-amber-900">FASTag payment is not enabled yet.</p></div>}
                   </div>
                 ) : activeService === 'broadband' ? (
                   <div className="space-y-5">
                     <button type="button" onClick={() => void loadBroadbandOperators()} disabled={broadbandLoading} className="w-full rounded-2xl border-2 border-dashed border-[#C7D2FE] bg-[#EEF2FF] p-4 text-sm font-black text-[#4F46E5] disabled:opacity-50">{broadbandLoading ? 'Loading providers...' : 'Load Broadband providers'}</button>
                     {broadbandOperators.length > 0 && <div className="space-y-2"><label htmlFor="broadband-search" className="sr-only">Search Broadband providers</label><input id="broadband-search" value={broadbandSearch} onChange={(event) => setBroadbandSearch(event.target.value)} placeholder="Search providers..." className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold outline-none focus:border-[#087443]" /><div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200">{broadbandOperators.filter((operator: any) => operator.name.toLowerCase().includes(broadbandSearch.toLowerCase())).map((operator: any) => <button type="button" key={operator.operatorCode} onClick={() => { setBroadbandOperator(operator); setBroadbandConsumerNumber(''); setBroadbandBillerInfo(null); setBroadbandInfo(null); }} className={`block w-full px-4 py-3 text-left text-sm font-bold hover:bg-indigo-50 ${broadbandOperator?.operatorCode === operator.operatorCode ? 'bg-indigo-50 text-[#4338CA]' : ''}`}>{operator.name}</button>)}</div></div>}
                     {broadbandOperator && <button type="button" onClick={() => void loadBroadbandBillerInfo()} disabled={broadbandLoading} className="w-full rounded-2xl border-2 border-dashed border-[#C7D2FE] bg-[#EEF2FF] p-4 text-sm font-black text-[#4F46E5] disabled:opacity-50">{broadbandLoading ? 'Loading required details...' : 'Load required details'}</button>}
                     {broadbandBillerInfo?.billFetchAvailable === false && <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-black text-amber-900">Bill lookup is currently unavailable for this provider.</p>}
                     {broadbandBillerInfo?.billFetchAvailable === true && broadbandBillerInfo?.fields?.length === 0 && <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-black text-amber-900">This broadband provider does not currently expose the account details required for bill lookup.</p>}
                     {broadbandBillerInfo?.fields?.length === 1 && <div><label htmlFor="broadband-consumer-number" className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#6B7280]">{broadbandBillerInfo.fields[0].label}</label><input id="broadband-consumer-number" inputMode={broadbandBillerInfo.fields[0].fieldType === 'NUMERIC' ? 'numeric' : 'text'} maxLength={broadbandBillerInfo.fields[0].maxLength || 80} value={broadbandConsumerNumber} onChange={(event) => setBroadbandConsumerNumber(event.target.value)} placeholder="Enter the required value" className="w-full rounded-2xl border border-gray-200 bg-[#F8F9FC] p-4 text-lg font-bold outline-none focus:border-[#6366F1]" /></div>}
                     {broadbandBillerInfo?.fields?.length > 1 && <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-black text-amber-900">This broadband provider requires additional verification details that Zeshu does not support yet.</p>}
                     <button type="button" onClick={() => void fetchBroadbandDetails()} disabled={broadbandLoading || !broadbandOperator || !broadbandBillerInfo || broadbandBillerInfo.fields?.length !== 1 || broadbandBillerInfo.billFetchAvailable === false} className="w-full rounded-2xl bg-[#087443] p-4 text-sm font-black text-white disabled:opacity-50">{broadbandLoading ? 'Fetching details...' : 'Fetch Broadband Bill'}</button>
                     {broadbandInfo && <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-5"><p className="mb-3 text-sm font-black text-[#312E81]">Broadband bill details</p>{Object.entries(broadbandInfo).map(([key, value]) => <div key={key} className="flex justify-between gap-3 border-b border-indigo-100 py-2 text-sm last:border-0"><span className="font-bold text-slate-600">{electricityLabels[key] || key}</span><span className="text-right font-black text-slate-900">{value}</span></div>)}<p className="mt-4 rounded-xl bg-amber-50 p-3 text-center text-sm font-black text-amber-900">Broadband payment is not enabled yet.</p></div>}
                   </div>
                 ) : activeService === 'water' ? (
                   <div className="space-y-5">
                     <button type="button" onClick={() => void loadWaterOperators()} disabled={waterLoading} className="w-full rounded-2xl border-2 border-dashed border-[#C7D2FE] bg-[#EEF2FF] p-4 text-sm font-black text-[#4F46E5] disabled:opacity-50">{waterLoading ? 'Loading providers...' : 'Load Water providers'}</button>
                     {waterOperators.length > 0 && <div className="space-y-2"><label htmlFor="water-search" className="sr-only">Search Water providers</label><input id="water-search" value={waterSearch} onChange={(event) => setWaterSearch(event.target.value)} placeholder="Search providers..." className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold outline-none focus:border-[#087443]" /><div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200">{waterOperators.filter((operator: any) => operator.name.toLowerCase().includes(waterSearch.toLowerCase())).map((operator: any) => <button type="button" key={operator.operatorCode} onClick={() => { setWaterOperator(operator); setWaterBillNumber(''); setWaterBillerInfo(null); setWaterBill(null); }} className={`block w-full px-4 py-3 text-left text-sm font-bold hover:bg-cyan-50 ${waterOperator?.operatorCode === operator.operatorCode ? 'bg-cyan-50 text-[#087c8c]' : ''}`}>{operator.name}</button>)}</div></div>}
                     {waterOperator && <button type="button" onClick={() => void loadWaterBillerInfo()} disabled={waterLoading} className="w-full rounded-2xl border-2 border-dashed border-[#A5F3FC] bg-[#ECFEFF] p-4 text-sm font-black text-[#0E7490] disabled:opacity-50">{waterLoading ? 'Loading required details...' : 'Load required details'}</button>}
                     {waterBillerInfo?.billFetchAvailable === false && <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-black text-amber-900">Bill lookup is currently unavailable for this provider.</p>}
                     {waterBillerInfo?.billFetchAvailable === true && waterBillerInfo?.fields?.length === 0 && <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-black text-amber-900">This water provider does not currently expose the account details required for bill lookup.</p>}
                     {waterBillerInfo?.fields?.length === 1 && <div><label htmlFor="water-bill-number" className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#6B7280]">{waterBillerInfo.fields[0].label}</label><input id="water-bill-number" inputMode={waterBillerInfo.fields[0].fieldType === 'NUMERIC' ? 'numeric' : 'text'} maxLength={waterBillerInfo.fields[0].maxLength || 80} value={waterBillNumber} onChange={(event) => setWaterBillNumber(event.target.value)} placeholder="Enter the required value" className="w-full rounded-2xl border border-gray-200 bg-[#F8F9FC] p-4 text-lg font-bold outline-none focus:border-[#0891B2]" /></div>}
                     {waterBillerInfo?.fields?.length > 1 && <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-black text-amber-900">This water provider requires additional verification details that Zeshu does not support yet.</p>}
                     <button type="button" onClick={() => void fetchWaterBillDetails()} disabled={waterLoading || !waterOperator || !waterBillerInfo || waterBillerInfo.fields?.length !== 1 || waterBillerInfo.billFetchAvailable === false} className="w-full rounded-2xl bg-[#087443] p-4 text-sm font-black text-white disabled:opacity-50">{waterLoading ? 'Fetching bill...' : 'Fetch Water Bill'}</button>
                     {waterBill && <div className="rounded-2xl border border-cyan-100 bg-cyan-50 p-5"><p className="mb-3 text-sm font-black text-[#164e63]">Water bill details</p>{Object.entries(waterBill).map(([key, value]) => <div key={key} className="flex justify-between gap-3 border-b border-cyan-100 py-2 text-sm last:border-0"><span className="font-bold text-slate-600">{electricityLabels[key] || key}</span><span className="text-right font-black text-slate-900">{value}</span></div>)}<p className="mt-4 rounded-xl bg-amber-50 p-3 text-center text-sm font-black text-amber-900">Water payment is not enabled yet.</p></div>}
                   </div>
                 ) : activeService === 'electricity' ? (
                   <div className="space-y-5">
                     <div><label htmlFor="electricity-provider" className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#6B7280]">Select electricity provider</label><button type="button" id="electricity-provider" onClick={() => void loadElectricityOperators()} className="w-full rounded-2xl border border-gray-200 bg-[#F8F9FC] p-4 text-left font-bold">{electricityOperator?.name || (electricityLoading ? 'Loading providers...' : 'Load providers')}</button></div>
                     {electricityOperators.length > 0 && <div className="space-y-2"><label htmlFor="electricity-search" className="sr-only">Search electricity providers</label><input id="electricity-search" value={electricitySearch} onChange={(event) => setElectricitySearch(event.target.value)} placeholder="Search providers..." className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold outline-none focus:border-[#087443]" /><div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200">{electricityOperators.filter((operator: any) => operator.name.toLowerCase().includes(electricitySearch.toLowerCase())).map((operator: any) => <button type="button" key={operator.operatorCode} onClick={() => { setElectricityOperator(operator); setElectricityBill(null); setElectricityBillerInfo(null); setElectricityBillNumber(''); }} className={`block w-full px-4 py-3 text-left text-sm font-bold hover:bg-emerald-50 ${electricityOperator?.operatorCode === operator.operatorCode ? 'bg-emerald-50 text-[#087443]' : ''}`}>{operator.name}</button>)}</div></div>}
                     {electricityOperator && <button type="button" onClick={() => void loadElectricityBillerInfo()} disabled={electricityLoading} className="w-full rounded-2xl border-2 border-dashed border-[#C7D2FE] bg-[#EEF2FF] p-4 text-sm font-black text-[#4F46E5] disabled:opacity-50">{electricityLoading ? 'Loading required details...' : 'Load required details'}</button>}
                     {electricityBillerInfo?.billFetchAvailable === false && <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-black text-amber-900">Bill lookup is currently unavailable for this provider.</p>}
                     {electricityBillerInfo?.fields?.length === 1 && <div><label htmlFor="electricity-bill-number" className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#6B7280]">{electricityBillerInfo.fields[0].label}</label><input id="electricity-bill-number" inputMode={electricityBillerInfo.fields[0].fieldType === 'NUMERIC' ? 'numeric' : 'text'} maxLength={electricityBillerInfo.fields[0].maxLength || 80} value={electricityBillNumber} onChange={(event) => setElectricityBillNumber(event.target.value.slice(0, electricityBillerInfo.fields[0].maxLength || 80))} placeholder="Enter the required value" className="w-full rounded-2xl border border-gray-200 bg-[#F8F9FC] p-4 text-lg font-bold outline-none focus:border-[#6366F1]" /></div>}
                     {electricityBillerInfo?.fields?.length > 1 && <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-black text-amber-900">This provider requires additional verification details that Zeshu does not support yet.</p>}
                     <button type="button" onClick={() => void fetchElectricityBillDetails()} disabled={electricityLoading || !electricityOperator || !electricityBillerInfo || electricityBillerInfo.fields?.length !== 1 || electricityBillerInfo.billFetchAvailable === false} className="w-full rounded-2xl bg-[#087443] p-4 text-sm font-black text-white disabled:opacity-50">{electricityLoading ? 'Fetching bill...' : 'Fetch Bill'}</button>
                     {electricityBill && <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5"><p className="mb-3 text-sm font-black text-[#173d27]">Electricity bill details</p>{Object.entries(electricityBill).map(([key, value]) => <div key={key} className="flex justify-between gap-3 border-b border-emerald-100 py-2 text-sm last:border-0"><span className="font-bold text-slate-600">{electricityLabels[key] || key}</span><span className="text-right font-black text-slate-900">{value}</span></div>)}<p className="mt-4 rounded-xl bg-amber-50 p-3 text-center text-sm font-black text-amber-900">Electricity payment is not enabled yet.</p></div>}
                   </div>
                 ) : activeService === 'dth' ? (
                   <div className="space-y-5">
                     <div><label htmlFor="dth-number" className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#6B7280]">DTH Subscriber / Customer ID</label><input id="dth-number" type="tel" inputMode="numeric" maxLength={20} placeholder="Enter your DTH customer ID" value={rechargeNumber} onChange={(event) => setRechargeNumber(event.target.value.replace(/\D/g, '').slice(0, 20))} className="w-full rounded-2xl border border-gray-200 bg-[#F8F9FC] p-4 text-lg font-bold outline-none focus:border-[#6366F1]" /></div>
                     <button type="button" onClick={() => void detectDthOperator()} disabled={dthLoading} className="w-full rounded-2xl border-2 border-dashed border-[#C7D2FE] bg-[#EEF2FF] p-4 text-sm font-bold text-[#4F46E5] disabled:opacity-50">{dthLoading ? 'Checking provider...' : 'Detect Operator'}</button>
                     {dthOperator && <div className="space-y-3 rounded-2xl bg-[#F4FBF6] p-4"><p className="text-xs font-black uppercase tracking-wider text-[#087443]">Detected provider</p><p className="font-black text-slate-900">{dthOperator.operator}</p><div className="flex flex-col gap-2 sm:flex-row"><button type="button" onClick={() => void fetchDthPlansForCustomer()} disabled={dthLoading} className="flex-1 rounded-xl bg-[#087443] px-4 py-3 text-sm font-black text-white disabled:opacity-50">View Plans</button><button type="button" onClick={() => void fetchDthAccountInfo()} disabled={dthLoading} className="flex-1 rounded-xl border border-[#087443] px-4 py-3 text-sm font-black text-[#087443] disabled:opacity-50">Check account details</button></div><p className="text-xs text-slate-500">Account lookup uses a provider verification request.</p></div>}
                     {dthInfo && <div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="mb-3 text-sm font-black text-slate-900">Account details</p>{Object.entries(dthInfo).map(([key, value]) => <div key={key} className="flex justify-between gap-3 border-b border-slate-100 py-2 text-sm last:border-0"><span className="font-bold text-slate-500">{key}</span><span className="text-right font-black text-slate-900">{value}</span></div>)}</div>}
                     {dthPlans.length > 0 && <div className="space-y-3"><label htmlFor="dth-search" className="sr-only">Search DTH packs</label><input id="dth-search" value={dthSearch} onChange={(event) => setDthSearch(event.target.value)} placeholder="Search DTH packs..." className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold outline-none focus:border-[#087443]" />{Array.from(new Set(dthPlans.map((plan: any) => String(plan.language || '').trim()).filter(Boolean))).length > 0 && <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">{['All', ...Array.from(new Set(dthPlans.map((plan: any) => String(plan.language || '').trim()).filter(Boolean)))].map((language) => <button type="button" key={language} onClick={() => setDthLanguageFilter(language)} className={`shrink-0 rounded-full px-3 py-2 text-xs font-black ${dthLanguageFilter === language ? 'bg-[#087443] text-white' : 'bg-slate-100 text-slate-600'}`}>{language}</button>)}</div>}{dthSelectionMessage && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm font-black text-emerald-700">{dthSelectionMessage}</p>}{dthPlans.filter((plan: any) => (dthLanguageFilter === 'All' || plan.language === dthLanguageFilter) && `${plan.name} ${plan.language} ${plan.channels} ${plan.paidChannels} ${plan.hdChannels} ${plan.pricingOptions?.map((option: any) => `${option.amount} ${option.duration}`).join(' ')}`.toLowerCase().includes(dthSearch.toLowerCase())).map((plan: any) => <div key={plan.id} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"><p className="text-lg font-black text-slate-900">{plan.name}</p><p className="mt-1 text-sm font-bold text-slate-600">{[plan.language, plan.channels && `${plan.channels} channels`, plan.paidChannels && `${plan.paidChannels} paid`, plan.hdChannels && `${plan.hdChannels} HD`].filter(Boolean).join(' · ')}</p>{plan.lastUpdated && <p className="mt-1 text-xs text-slate-500">Last updated: {plan.lastUpdated}</p>}<div className="mt-3 flex flex-wrap gap-2">{plan.pricingOptions.map((option: any) => <button type="button" key={`${plan.id}-${option.amount}-${option.duration}`} onClick={() => { setSelectedDthPlanId(`${plan.id}-${option.amount}-${option.duration}`); setDthSelectionMessage(`₹${option.amount} / ${option.duration} selected`); }} className={`rounded-xl px-3 py-2 text-xs font-black ${selectedDthPlanId === `${plan.id}-${option.amount}-${option.duration}` ? 'bg-[#087443] text-white' : 'border border-[#087443] text-[#087443]'}`}>₹{option.amount} / {option.duration} · Select</button>)}</div></div>)}</div>}
                     {dthPlans.length > 0 && <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-center text-sm font-black text-amber-900">DTH payment is not enabled yet.</p>}
                   </div>
                 ) : activeService === 'pharmacy' ? (
                   <div className="space-y-5">
                     <div>
                       <label className="text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-2 block">{currentServiceObj.inputLabel}</label>
                       <div className="relative flex items-center">
                         <input type="text" placeholder="e.g. Paracetamol, Dolo 650" className="w-full p-4 bg-[#F8F9FC] border border-gray-200/80 rounded-2xl focus:border-[#059669] focus:bg-white focus:ring-4 focus:ring-[#059669]/10 outline-none font-bold text-lg transition-all" value={medSearchQuery} onChange={(e) => setMedSearchQuery(e.target.value)} />
                       </div>
                     </div>
                     <button disabled={isLoading} onClick={handleMedicineSearch} className="w-full p-4 border-2 border-dashed border-[#A7F3D0] rounded-2xl text-[#059669] bg-[#ECFDF5] hover:bg-[#D1FAE5] text-sm font-bold transition-all active:scale-[0.98] flex justify-center items-center gap-2">
                       {isLoading ? <div className="animate-spin h-5 w-5 border-2 border-[#059669] border-t-transparent rounded-full"></div> : 'Search Local Pharmacies'}
                     </button>

                     {medResults && medResults.routing_type === 'local' && (
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-100 animate-in fade-in">
                          <div className="flex justify-between items-center mb-4">
                            <h3 className="font-black text-xl text-gray-900">Available Locally!</h3>
                            <span className="bg-emerald-100 text-emerald-700 text-xs font-black px-3 py-1 rounded-lg flex items-center gap-1"><Truck size={14}/> {medResults.fulfillment.eta}</span>
                          </div>
                          {medResults.products.map((med: any) => (
                            <div key={med.id} className="flex justify-between items-center py-3 border-b border-gray-100 last:border-0">
                              <div>
                                <p className="font-bold text-gray-900">{med.name}</p>
                                {med.requires_rx && <p className="text-[10px] text-red-500 font-bold mt-1">💊 Rx Required</p>}
                              </div>
                              <div className="flex items-center gap-4">
                                <span className="font-black text-lg">₹{med.discount_price}</span>
                                <button onClick={() => addToCart({id: med.id, name: med.name, price: med.discount_price, image_url: 'https://cdn-icons-png.flaticon.com/512/2950/2950660.png', category: 'Pharmacy'})} className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold active:scale-95 text-xs shadow-sm">ADD</button>
                              </div>
                            </div>
                          ))}
                        </div>
                     )}
                   </div>
                 ) : (
                   <>
                     <div>
                       <label className="text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-2 block">{currentServiceObj.inputLabel}</label>
                       <div className="relative flex items-center">
                         <input type="tel" inputMode="numeric" maxLength={10} placeholder="10-digit mobile number" className="w-full p-4 pr-14 bg-[#F8F9FC] border border-gray-200 rounded-2xl focus:border-[#6366F1] font-bold text-lg outline-none" value={rechargeNumber} onChange={(e) => setRechargeNumber(e.target.value.replace(/\D/g, '').slice(0, 10))} />
                         {activeService === 'mobile' && (
                           <button onClick={handleContactPicker} className="absolute right-3 p-2 bg-[#EEF2FF] text-[#4F46E5] rounded-xl hover:bg-[#E0E7FF] transition-colors active:scale-95 shadow-sm border border-[#E0E7FF]" title="Search Contact">
                             <BookUser size={20} />
                           </button>
                         )}
                       </div>
                     </div>
                     {activeService !== 'upi' && activeService !== 'mobile' && (
                       <div>
                         <label className="text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-2 block">Operator</label>
                         <select className="w-full p-4 bg-[#F8F9FC] border border-gray-200 rounded-2xl focus:border-[#6366F1] font-bold text-[#374151] outline-none" value={selectedOperator} onChange={(e) => setSelectedOperator(e.target.value)}>
                           <option value="">Select Provider</option>
                           {Object.keys(OPERATORS_DATA[activeService] || {}).map(op => <option key={op} value={op}>{op}</option>)}
                         </select>
                       </div>
                     )}
                     <button disabled={isLoading || (activeService === 'mobile' && planDiscoveryLoading)} onClick={activeService === 'upi' ? () => {} : isPlanBased ? fetchOffers : fetchBillDetails} className="w-full p-4 border-2 border-dashed border-[#C7D2FE] rounded-2xl text-[#4F46E5] bg-[#EEF2FF] hover:bg-[#E0E7FF] text-sm font-bold active:scale-[0.98]" aria-live="polite">
                       {planDiscoveryLoading ? 'Finding the best plans for you...' : isLoading ? 'Fetching...' : activeService === 'mobile' ? 'View Plans' : 'Fetch Details'}
                     </button>
                     {activeService === 'mobile' && planDiscoveryError && <div role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">{planDiscoveryError}</div>}
                     {activeService === 'mobile' && planDiscovery && <div className="space-y-4" aria-live="polite">
                       <div className="rounded-2xl bg-[#F4FBF6] p-4"><p className="text-xs font-black uppercase tracking-wider text-[#087443]">Detected network</p><p className="mt-1 font-black text-slate-900">{planDiscovery.operator}</p><p className="text-sm font-bold text-slate-600">{planDiscovery.circle}</p></div>
                       <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">{PRIMARY_PLAN_FILTERS.map((category) => <button type="button" key={category} onClick={() => setSelectedPlanCategory(category)} className={`shrink-0 rounded-full px-3 py-2 text-xs font-black ${selectedPlanCategory === category ? 'bg-[#087443] text-white' : 'bg-slate-100 text-slate-600'}`}>{category}</button>)}<button type="button" onClick={() => setShowMorePlanCategories((current) => !current)} className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700">More {showMorePlanCategories ? '−' : '+'}</button></div>
                       {showMorePlanCategories && <div className="flex flex-wrap gap-2 rounded-xl bg-slate-50 p-3">{planCategories.length === 0 ? <span className="text-xs text-slate-500">No additional provider categories.</span> : planCategories.map((category) => <button type="button" key={category} onClick={() => setSelectedPlanCategory(category)} className={`rounded-full px-3 py-2 text-xs font-black ${selectedPlanCategory === category ? 'bg-[#087443] text-white' : 'bg-white text-slate-600'}`}>{category}</button>)}</div>}
                       <div className="flex flex-col gap-2 sm:flex-row"><label className="sr-only" htmlFor="plan-search">Search plans</label><input id="plan-search" value={planSearch} onChange={(event) => setPlanSearch(event.target.value)} placeholder="Search plans, OTT, data, validity..." className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold outline-none focus:border-[#087443]" /><label className="sr-only" htmlFor="plan-sort">Sort plans</label><select id="plan-sort" value={planSort} onChange={(event) => setPlanSort(event.target.value as typeof planSort)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold"><option value="recommended">Recommended</option><option value="low">Price: Low to High</option><option value="high">Price: High to Low</option><option value="validity">Validity: Longest first</option></select></div>
                       {planSelectionMessage && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm font-black text-emerald-700">{planSelectionMessage}</p>}
                       {planDiscovery.specialOffers?.length > 0 && (selectedPlanCategory === 'All' || selectedPlanCategory === 'Special Offers') && <div className="space-y-2"><p className="text-sm font-black text-amber-700">Special offer for this number</p>{planDiscovery.specialOffers.map((offer: any) => <div key={offer.id} className="rounded-2xl border border-amber-200 bg-amber-50 p-4"><div className="flex items-center justify-between gap-3"><p className="font-black">₹{offer.amount}</p><button type="button" onClick={() => { setSelectedPlanId(String(offer.id)); setRechargeAmount(String(offer.amount)); setPlanSelectionMessage(`₹${offer.amount} plan selected`); }} className="rounded-lg bg-amber-600 px-3 py-2 text-xs font-black text-white">Use this plan</button></div><p className="mt-1 text-xs text-amber-900">{offer.description}</p></div>)}</div>}
                       {visiblePlans.length === 0 && selectedPlanCategory !== 'Special Offers' && <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">No matching plans were returned.</p>}
                       <div className="space-y-2">{visiblePlans.map((plan: any) => { const expanded = expandedPlanIds.has(plan.id); return <div key={plan.id} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><div><p className="text-lg font-black text-slate-900">₹{plan.amount}</p><p className="text-sm font-black text-slate-700">{plan.validity}</p><p className="mt-1 text-xs font-black text-[#087443]">{plan.category}</p></div><button type="button" onClick={() => { setSelectedPlanId(String(plan.id)); setRechargeAmount(String(plan.amount)); setPlanSelectionMessage(`₹${plan.amount} plan selected`); }} className="shrink-0 rounded-lg bg-[#087443] px-3 py-2 text-xs font-black text-white">Use this plan</button></div><p className={`mt-2 text-sm leading-5 text-slate-600 ${expanded ? '' : 'line-clamp-3'}`}>{plan.description}</p>{plan.description?.length > 180 && <button type="button" onClick={() => setExpandedPlanIds((current) => { const next = new Set(current); expanded ? next.delete(plan.id) : next.add(plan.id); return next; })} className="mt-2 text-xs font-black text-[#087443]">{expanded ? 'Show less' : 'View details'}</button>}</div>; })}</div>
                       {visiblePlans.length < filteredPlans.length && <button type="button" onClick={() => setPlanVisibleCount((count) => count + 20)} className="w-full rounded-xl border border-[#087443] px-4 py-3 text-sm font-black text-[#087443]">Show more plans</button>}
                     </div>}
                     
                     {fetchedBill && !isPlanBased && (
                       <div className="bg-[#ECFDF5] border border-[#A7F3D0] p-6 rounded-2xl shadow-sm">
                         <div className="flex justify-between border-b border-[#D1FAE5] pb-3 mb-3"><span className="text-xs font-bold text-[#059669] uppercase">Customer Name</span><span className="font-bold text-[#111827]">{fetchedBill.Name || 'N/A'}</span></div>
                         <div className="flex justify-between border-b border-[#D1FAE5] pb-3 mb-3"><span className="text-xs font-bold text-[#059669] uppercase">Due Date</span><span className="font-bold text-[#DC2626]">{fetchedBill.DueDate || 'N/A'}</span></div>
                         <div className="flex justify-between"><span className="text-xs font-bold text-[#047857] uppercase">Total Due</span><span className="font-black text-xl text-[#111827]">₹{fetchedBill.DueAmount || '0'}</span></div>
                       </div>
                     )}

                     <div className={(fetchedBill && !isPlanBased) || activeService === 'upi' ? 'opacity-60 pointer-events-none' : ''}>
                       <label className="text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-2 block">Amount</label>
                       <div className="relative">
                         <span className="absolute left-4 top-4 text-xl font-bold text-gray-400">₹</span>
                         <input type="number" className="w-full p-4 pl-10 bg-white border border-gray-200 rounded-xl focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/20 outline-none font-black text-2xl transition-all shadow-sm" value={rechargeAmount} onChange={(e) => setRechargeAmount(e.target.value)} readOnly={(fetchedBill && !isPlanBased) || activeService === 'upi'} />
                       </div>
                     </div>

                     {activeService === 'mobile' ? <div className="mt-4 space-y-3"><div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-center"><p className="text-sm font-black text-amber-900">Test payment</p><p className="mt-1 text-xs font-bold text-amber-800">No real recharge will be submitted.</p></div><button type="button" onClick={() => void handleMobileTestPayment()} disabled={testRechargeLoading || !rechargeAmount || !selectedPlanId || !planDiscovery} className="w-full rounded-2xl bg-[#4F46E5] py-4 text-lg font-black text-white disabled:opacity-50">{testRechargeLoading ? 'Opening test payment...' : 'Continue to Test Payment'}</button></div> : activeService !== 'upi' && <button type="button" onClick={handleRechargeCheckout} disabled={isLoading || !rechargeAmount} className="w-full bg-gradient-to-r from-[#059669] to-[#047857] hover:to-[#065F46] text-white py-5 rounded-2xl font-black text-lg shadow-[0_8px_20px_-6px_rgba(5,150,105,0.4)] mt-4 transition-all active:scale-[0.98] disabled:opacity-50">Recharge fulfillment unavailable</button>}
                   </>
                 )}
               </div>
             </div>
          ) : (
            <>
              {normalizedSearch === '' && (
                <div className="mb-12 space-y-8">
                  <div className="flex gap-4 md:gap-5 overflow-x-auto no-scrollbar pb-4 px-4 md:px-0 snap-x">
                    {banners.map((img, idx) => (<img key={idx} src={img} alt="Promo" className="h-[140px] md:h-[240px] rounded-[16px] md:rounded-[28px] object-cover min-w-[280px] md:min-w-[480px] cursor-pointer shadow-lg hover:-translate-y-1.5 transition-all snap-center border border-gray-100/50" />))}
                  </div>

                  <section className="mx-4 rounded-[28px] bg-[#083b27] p-6 text-white md:mx-0 md:p-10">
                    <p className="text-xs font-bold uppercase tracking-[.18em] text-[#a6dfba]">Zeshu groceries</p>
                    <h1 className="mt-2 max-w-xl text-3xl font-black tracking-tight md:text-5xl">Everyday essentials, simply delivered.</h1>
                    <p className="mt-3 max-w-lg text-sm leading-6 text-[#d9f3e3]">Browse products in the live Zeshu catalogue. Prices and availability are confirmed securely at checkout.</p>
                    <button onClick={() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })} className="mt-6 rounded-xl bg-white px-5 py-3 text-sm font-black text-[#075b36] active:scale-[.98]">Browse groceries</button>
                  </section>

                  <section className="mx-4 grid gap-4 md:mx-0 md:grid-cols-2" aria-labelledby="service-availability-title">
                    <div className="rounded-2xl border border-[#cfe8d7] bg-white p-5">
                      <p className="text-[11px] font-black uppercase tracking-[.16em] text-[#087443]">Service availability</p>
                      <h2 id="service-availability-title" className="mt-2 text-xl font-black text-[#173d27]">Daily essentials in supported Jagtial areas</h2>
                      <p className="mt-2 text-sm leading-6 text-slate-600">Confirm your delivery pin at checkout for service-area eligibility. Delivery estimates vary with traffic, weather, availability, and local operations. Outside Jagtial, this quick-commerce service is coming soon.</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                      <p className="text-[11px] font-black uppercase tracking-[.16em] text-slate-500">Travel services</p>
                      <h2 className="mt-2 text-xl font-black text-slate-800">Travel bookings are coming soon</h2>
                      <div className="mt-3 flex flex-wrap gap-2">{['Bus Tickets', 'Train Tickets', 'Flights', 'Hotels / Rooms'].map((service) => <span key={service} className="rounded-full bg-white px-3 py-2 text-xs font-black text-slate-500">{service} · Coming Soon</span>)}</div>
                    </div>
                  </section>

                  {activeOrder && <button type="button" onClick={() => { setTrackedOrder(activeOrder); setIsTrackingOpen(true); }} className="mx-4 flex w-[calc(100%-2rem)] items-center justify-between gap-4 rounded-2xl border border-[#cfe8d7] bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md md:mx-0 md:w-full">
                    <span><span className="block text-[10px] font-black uppercase tracking-[.16em] text-[#087443]">Your active order</span><span className="mt-1 block text-lg font-black text-slate-900">{ORDER_STATUS_LABELS[activeOrder.status] || 'Order in progress'}</span><span className="mt-1 block text-xs font-medium text-slate-500">Order #{activeOrder.id?.split('-')[0]?.toUpperCase()} · Tap to view details</span></span><ChevronRight className="shrink-0 text-[#087443]" size={22}/>
                  </button>}

                  <div className="bg-white p-6 md:p-10 rounded-[24px] md:rounded-[32px] shadow-sm border border-gray-100 mx-4 md:mx-0">
                    <div className="flex items-center justify-between mb-8"><h2 className="text-xl md:text-2xl font-black tracking-tight">Recharge &amp; Bills</h2><button onClick={() => setActiveTab('recharge')} className="text-[#075b36] font-extrabold text-xs md:text-sm hover:bg-[#e9f7ef] bg-[#f1faf4] px-3 py-1.5 md:px-4 md:py-2 rounded-xl">Explore services</button></div>
                    <div className="grid grid-cols-4 md:grid-cols-8 gap-y-8 md:gap-y-10 gap-x-2 md:gap-x-4">
                      {SERVICES.filter((s) => !['pharmacy', 'upi'].includes(s.id)).map((s) => (
                        <div key={s.id} onClick={() => { setActiveTab('recharge'); setActiveService(s.id); }} className="flex flex-col items-center gap-2.5 md:gap-3.5 cursor-pointer group active:scale-95 transition-transform">
                          <div className={`h-[60px] w-[60px] md:h-[72px] md:w-[72px] rounded-[20px] md:rounded-[24px] flex items-center justify-center transition-all ${s.color}`}>{s.icon}</div>
                          <span className="text-[10px] md:text-[11px] font-black text-[#6B7280] text-center leading-tight group-hover:text-[#111827]">{s.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <section className="mx-4 rounded-[24px] border border-emerald-100 bg-emerald-50 p-5 md:mx-0" aria-labelledby="pharmacy-health-title">
                    <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 id="pharmacy-health-title" className="text-xl font-black text-[#173d27]">Pharmacy &amp; Health</h2><p className="mt-1 text-sm text-[#587065]">Licensed pharmacy fulfillment is being onboarded. No medicine payment or prescription transaction is available.</p></div><button type="button" onClick={() => { setActiveTab('recharge'); setActiveService('pharmacy'); }} className="rounded-xl bg-[#087443] px-4 py-2.5 text-sm font-black text-white">View availability</button></div>
                  </section>
                  <section className="mx-4 rounded-[24px] border border-slate-200 bg-white p-5 md:mx-0" aria-labelledby="upcoming-tools-title"><h2 id="upcoming-tools-title" className="text-lg font-black text-slate-900">More tools</h2><p className="mt-1 text-sm text-slate-500">UPI Tools are coming soon. Merchant QR payments and transfers are not enabled.</p></section>
                </div>
              )}
              {user && (favoriteProducts.length > 0 || recentlyPurchased.length > 0 || frequentCategories.length > 0) && normalizedSearch === '' && (
                <section className="mx-4 mb-6 rounded-[20px] border border-[#dce8df] bg-[#f7fbf8] p-4 md:mx-0" aria-labelledby="quick-picks-title">
                  <div className="flex items-center justify-between"><h2 id="quick-picks-title" className="text-lg font-black tracking-tight text-[#173d27]">Quick Picks</h2><span className="text-[10px] font-black uppercase tracking-wider text-[#5d8069]">For you</span></div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {recentlyPurchased.length > 0 && <button type="button" onClick={() => document.getElementById('recently-purchased')?.scrollIntoView({ behavior: 'smooth' })} className="rounded-xl bg-white px-3 py-2 text-xs font-black text-[#087443] shadow-sm">Buy Again</button>}
                    {favoriteProducts.length > 0 && <button type="button" onClick={() => document.getElementById('favorites')?.scrollIntoView({ behavior: 'smooth' })} className="rounded-xl bg-white px-3 py-2 text-xs font-black text-[#087443] shadow-sm">Favorites</button>}
                    {frequentCategories.map((category) => <button type="button" key={category} onClick={() => { setActiveCategory(category); document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' }); }} className="rounded-xl bg-white px-3 py-2 text-xs font-black text-[#087443] shadow-sm">{category}</button>)}
                  </div>
                </section>
              )}
              {user && favoriteProducts.length > 0 && normalizedSearch === '' && (
                <section id="favorites" className="mx-4 mb-8 rounded-[24px] border border-[#dce8df] bg-white p-5 md:mx-0 md:p-7" aria-labelledby="favorites-title">
                  <div className="flex items-center justify-between gap-3"><div><h2 id="favorites-title" className="text-xl font-black tracking-tight">Your Favorites</h2><p className="mt-1 text-xs text-slate-500">Live prices and availability from your saved products.</p></div><HeartHandshake size={22} className="text-[#087443]" /></div>
                  <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-5">
                    {favoriteProducts.slice(0, 10).map((product: any) => {
                      const unavailable = product.in_stock === false || (product.quantity !== null && Number(product.quantity) <= 0) || !product.vendor_id;
                      const inCart = cart.find((entry) => String(entry.item.id) === String(product.id));
                      return <div key={product.id} className="rounded-2xl border border-slate-100 p-3"><div className="flex h-24 items-center justify-center rounded-xl bg-slate-50"><img src={product.image_url || 'https://via.placeholder.com/120'} alt={product.name} className="h-full w-full object-contain" /></div><p className="mt-2 line-clamp-2 text-xs font-black text-slate-800">{product.name}</p><p className="mt-1 text-sm font-black text-slate-900">₹{product.price}</p>{unavailable ? <div className="mt-2 flex items-center justify-between gap-2"><span className="text-[10px] font-black text-red-600">Unavailable</span><button type="button" onClick={() => void toggleFavorite(product)} className="text-[10px] font-black text-slate-500">Remove</button></div> : <button type="button" onClick={() => addToCart(product)} className="mt-2 w-full rounded-lg bg-[#eef8f1] py-2 text-[10px] font-black text-[#087443]">{inCart ? `In cart (${inCart.qty})` : 'ADD'}</button>}</div>;
                    })}
                  </div>
                </section>
              )}
              {user && recentlyPurchased.length > 0 && normalizedSearch === '' && (
                <section id="recently-purchased" className="mx-4 mb-8 rounded-[24px] border border-[#dce8df] bg-white p-5 md:mx-0 md:p-7" aria-labelledby="recently-purchased-title">
                  <div className="flex items-center justify-between gap-3"><div><h2 id="recently-purchased-title" className="text-xl font-black tracking-tight">Recently Purchased</h2><p className="mt-1 text-xs text-slate-500">Current prices and availability from your delivered orders.</p></div><span className="rounded-lg bg-[#eef8f1] px-2 py-1 text-xs font-black text-[#087443]">Buy Again</span></div>
                  <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-5">
                    {recentlyPurchased.map((product: any) => {
                      const unavailable = product.in_stock === false || (product.quantity !== null && Number(product.quantity) <= 0) || !product.vendor_id;
                      const inCart = cart.find((entry) => String(entry.item.id) === String(product.id));
                      return <div key={product.id} className="rounded-2xl border border-slate-100 p-3"><div className="flex h-24 items-center justify-center rounded-xl bg-slate-50"><img src={product.image_url || 'https://via.placeholder.com/120'} alt={product.name} className="h-full w-full object-contain" /></div><p className="mt-2 line-clamp-2 text-xs font-black text-slate-800">{product.name}</p><p className="mt-1 text-sm font-black text-slate-900">₹{product.price}</p>{unavailable ? <span className="mt-2 block text-[10px] font-black text-red-600">Currently unavailable</span> : <button type="button" onClick={() => addToCart(product)} className="mt-2 w-full rounded-lg bg-[#eef8f1] py-2 text-[10px] font-black text-[#087443]">{inCart ? `In cart (${inCart.qty})` : 'ADD'}</button>}</div>;
                    })}
                  </div>
                </section>
              )}
              <div id="products" className="px-4 md:px-0">
                <div className="flex flex-wrap items-end justify-between gap-3 mb-6 md:mb-8 border-b pb-4 md:pb-5">
                  <h2 className="text-2xl md:text-3xl font-black tracking-tighter">{activeCategory} Items</h2>
                  <div className="flex items-center gap-2"><span className="text-[#6B7280] font-bold text-xs md:text-sm bg-gray-100 px-3 py-1 rounded-xl">{filteredProducts.length} items</span></div>
                </div>
                
                {productsLoading ? (
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" aria-label="Loading products" aria-busy="true">{Array.from({ length: 6 }, (_, index) => <div key={index} className="min-h-[290px] animate-pulse rounded-3xl border border-[#e3e9e4] bg-white p-3 md:p-4"><div className="aspect-square rounded-2xl bg-[#edf2ed]" /><div className="mt-4 h-4 w-4/5 rounded bg-[#edf2ed]" /><div className="mt-3 h-3 w-2/5 rounded bg-[#edf2ed]" /><div className="mt-8 h-10 rounded-xl bg-[#edf2ed]" /></div>)}</div>
                ) : contentError ? (
                  <div className="bg-white p-12 md:p-20 rounded-[32px] border border-[#dce8df] text-center flex flex-col items-center justify-center gap-4"><AlertCircle size={32} className="text-[#087443]"/><h3 className="text-xl font-black">Couldn&apos;t load products</h3><p className="text-gray-500 text-sm">Check your connection and try again.</p><button onClick={() => { setContentError(false); window.location.reload(); }} className="rounded-xl bg-[#087443] px-4 py-2.5 text-sm font-bold text-white">Try again</button></div>
                ) : filteredProducts.length === 0 ? (
                  <div className="bg-white p-12 md:p-20 rounded-[32px] border-2 border-dashed border-gray-200 text-center flex flex-col items-center justify-center gap-4">
                     {activeProductFilterCount > 0 && <button type="button" onClick={clearProductFilters} className="order-3 rounded-xl border border-[#087443] px-4 py-2 text-xs font-black text-[#087443]">Clear filters</button>}
                     <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center"><Search size={32} className="text-gray-300"/></div>
                     <h3 className="text-xl font-black">{['Fruits', 'Vegetables', 'Chicken', 'Mutton', 'Fish & Seafood', 'Eggs'].includes(activeCategory) && !normalizedSearch ? 'Products coming soon.' : `No products found${normalizedSearch ? ` for “${searchQuery.trim()}”` : ''}.`}</h3>
                     <p className="text-gray-500 text-sm">{['Fruits', 'Vegetables', 'Chicken', 'Mutton', 'Fish & Seafood', 'Eggs'].includes(activeCategory) && !normalizedSearch ? 'We will add verified products here when they are available.' : 'Try clearing search or browsing another category.'}</p>
                     <div className="flex flex-wrap justify-center gap-2"><button type="button" onClick={() => setSearchQuery('')} className="rounded-xl bg-[#087443] px-4 py-2 text-xs font-black text-white">Clear search</button><button type="button" onClick={() => setActiveCategory('All')} className="rounded-xl border border-[#087443] px-4 py-2 text-xs font-black text-[#087443]">Browse all categories</button>{user && recentlyPurchased.length > 0 && <button type="button" onClick={() => document.getElementById('recently-purchased')?.scrollIntoView({ behavior: 'smooth' })} className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-black text-slate-700">Recently purchased</button>}</div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                    {filteredProducts.map((p) => {
                      const inCart = cart.find(c => c.item.id === p.id);
                      const aggregate = productAggregates[String(p.id)];
                      return <ProductCard key={p.id} product={p} quantity={inCart?.qty} onAdd={() => addToCart(p)} onRemove={() => removeFromCart(p.id)} isFavorite={favoriteIds.has(String(p.id))} favoriteBusy={favoriteBusyId === String(p.id)} onFavoriteToggle={() => void toggleFavorite(p)} reviewAverage={aggregate?.average_rating} reviewCount={aggregate?.review_count} onReviews={() => void openPublicReviews(p)} />;
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>

      {!isCartOpen && !isAccountOpen && !isAuthModalOpen && !locationSelectorOpen && !isTrackingOpen && <button type="button" onClick={openAiSupport} aria-label="Chat with Zeshu Assistant" className="fixed bottom-24 right-4 z-30 inline-flex min-h-12 items-center gap-2 rounded-full bg-indigo-600 px-4 py-3 text-sm font-black text-white shadow-xl transition hover:bg-indigo-700 active:scale-95 md:bottom-8 md:right-8"><MessageCircle size={19} aria-hidden="true" /><span>Ask Zeshu</span></button>}

      <footer className="border-t border-[#dce8df] bg-white px-4 py-8 text-sm text-slate-600 md:px-8">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <span className="font-bold">© Zeshu · Everyday, simply</span>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <Link href="/policies" className="font-black text-[#087443] underline-offset-4 hover:underline">Policies &amp; Trust Center</Link>
            <Link href="/partners" className="font-black text-[#087443] underline-offset-4 hover:underline">Brands &amp; Suppliers</Link>
            <span>Real support is provided through verified order communication.</span>
          </div>
        </div>
      </footer>

      {/* 🚀 NEW FLOATING CART WINDOW WITH SMOOTH ROUNDED EDGES */}
      {!isCartOpen && cart.length > 0 && activeTab === 'home' && (
        <div 
          onClick={() => setIsCartOpen(true)}
          className="fixed bottom-6 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-[420px] bg-gradient-to-r from-[#059669] to-[#047857] text-white p-4 rounded-full shadow-2xl z-[90] flex items-center justify-between cursor-pointer animate-in slide-in-from-bottom-10 active:scale-[0.98] transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2.5 rounded-full"><ShoppingBag size={20} className="text-white" /></div>
            <div className="flex flex-col">
              <span className="text-sm font-black leading-tight tracking-wide">{cart.length} ITEM{cart.length > 1 ? 'S' : ''}</span>
              <span className="text-[10px] font-bold text-emerald-100 leading-tight">View cart & checkout</span>
            </div>
          </div>
          <div className="flex items-center gap-1 font-black text-lg">
            ₹{finalCartTotal} <ChevronRight size={20} className="text-white ml-1 opacity-80" />
          </div>
        </div>
      )}

      {/* --- LIVE ORDER TRACKING SCREEN --- */}
      {isTrackingOpen && trackedOrder && (
        <div role="dialog" aria-modal="true" aria-labelledby="tracking-title" className="fixed inset-0 bg-black/40 z-[120] flex items-center justify-center p-3 md:p-6">
          <div className="flex h-full max-h-[95vh] w-full max-w-3xl flex-col overflow-hidden rounded-[28px] bg-[#F8F9FC] shadow-2xl">
          <div className="flex shrink-0 items-center justify-between bg-white px-6 py-5 shadow-sm">
            <div>
              <h2 id="tracking-title" className="text-xl font-black tracking-tighter text-gray-900">{ORDER_STATUS_LABELS[trackedOrder.status] || 'Order details'}</h2>
              <p className="text-xs font-bold text-gray-500">Order #{trackedOrder.id?.split('-')[0]?.toUpperCase()}</p>
            </div>
            <button ref={modalCloseRef} aria-label="Close order tracking" onClick={() => setIsTrackingOpen(false)} className="p-2.5 bg-gray-100 rounded-full active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#087443]"><X size={20}/></button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
          <div className="p-6 text-center text-gray-500">
            <div className="mx-auto max-w-sm rounded-3xl border border-[#dce9e0] bg-[#f4fbf6] p-6"><Truck size={36} className="mx-auto mb-3 text-[#087443]"/><p className="font-bold text-[#183524]">{trackedOrder.status === 'CANCELLED' ? 'This order was cancelled.' : 'Your order updates here as it progresses.'}</p><p className="text-xs mt-2">{trackedOrder.status === 'CANCELLED' ? 'No delivery is scheduled.' : 'Status updates are based on the latest order record.'}</p></div>
            {liveDeliveryStatus && <div className="mx-auto mt-5 max-w-sm rounded-3xl border border-[#cfe8d7] bg-white p-5 text-left shadow-sm">
              <div className="flex items-center gap-2 text-[#075b36]"><MapPin size={18}/><h3 className="font-black">Rider location</h3></div>
              <p className="mt-2 text-sm font-bold text-[#26372b]">{trackedOrder.status.replaceAll('_', ' ')}</p>
              {riderLocationState === 'loading' ? <p className="mt-3 text-sm text-[#587065]">Location updating...</p> : liveRider ? <>
                <div className="mt-3 flex items-center gap-2 text-sm"><span className={`h-2.5 w-2.5 rounded-full ${liveRider.is_active ? 'bg-[#13a657]' : 'bg-slate-400'}`}/><span className="font-bold text-[#26372b]">{liveRider.full_name || 'Your rider'} is {liveRider.is_active ? 'online' : 'offline'}</span></div>
                {riderFreshness ? <p className="mt-2 text-sm font-bold text-[#075b36]">{riderFreshness.label}{riderFreshness.ageMinutes !== undefined ? ` · Updated ${riderFreshness.ageMinutes} min ago` : ''}</p> : <p className="mt-2 text-sm text-[#587065]">Location freshness unavailable.</p>}
              {hasLiveRiderCoordinates ? <a href={liveRiderMapUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#087443] px-4 py-3 text-sm font-black text-white active:scale-95"><MapPin size={16}/>Open rider location in Maps</a> : <p className="mt-3 text-sm text-[#587065]">Rider location not available yet.</p>}
                {etaState === 'loading' && <p className="mt-3 text-sm font-bold text-[#587065]">Updating arrival estimate…</p>}
                {etaState === 'available' && etaDetails && <p className="mt-3 text-sm font-black text-[#075b36]">Estimated arrival: {Math.max(1, Math.round(Number(etaDetails.durationSeconds || 0) / 60))} min · {Math.max(0, (Number(etaDetails.distanceMeters || 0) / 1000)).toFixed(1)} km</p>}
                {etaState === 'fallback' && etaDetails && <p className="mt-3 text-sm font-bold text-[#587065]">Estimated arrival: about {Math.max(1, Math.round(Number(etaDetails.durationSeconds || 0) / 60))} min (approximate)</p>}
                {etaState === 'unavailable' && <p className="mt-3 text-sm text-[#587065]">Arrival estimate is temporarily unavailable.</p>}
              </> : <p className="mt-3 text-sm text-[#587065]">Rider location not available yet.</p>}
            </div>}
            {trackedOrder.status === 'READY_FOR_PICKUP' && <p className="mx-auto mt-5 max-w-sm rounded-2xl border border-slate-200 bg-white p-4 text-sm font-bold text-slate-600">A rider is assigned. Live tracking starts after pickup.</p>}
          </div>
          <div className="bg-white p-6 md:p-8">
            <div className="mb-6 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-left">
              <div className="flex items-center justify-between gap-4"><span className="text-xs font-black uppercase tracking-wider text-slate-500">Order total</span><span className="text-lg font-black text-slate-900">₹{Number(trackedOrder.total_paid || 0).toFixed(0)}</span></div>
              {Array.isArray(trackedOrder.items) && trackedOrder.items.length > 0 && <div className="mt-3 space-y-2 text-left">{trackedOrder.items.map((entry: any, index: number) => { const qty = Number(entry.qty ?? entry.quantity ?? 1); const price = Number(entry.item?.price ?? entry.item_snapshot?.price ?? entry.unit_price ?? entry.price ?? 0); return <div key={index} className="flex justify-between gap-3 text-xs text-slate-600"><span>{qty}× {entry.item?.name || entry.item_snapshot?.name || entry.name || 'Item'}</span><span className="font-black text-slate-800">₹{price.toFixed(0)}</span></div>; })}</div>}
              {trackedOrder.delivery_fee != null && <div className="mt-3 flex justify-between text-xs text-slate-600"><span>Delivery fee</span><span className="font-black">₹{Number(trackedOrder.delivery_fee).toFixed(0)}</span></div>}
              {trackedOrder.status === 'DELIVERED' && rewardHistory.find((entry) => entry.order_id === trackedOrder.id && entry.event_type === 'ORDER_REWARD') && <p className="mt-3 rounded-xl bg-emerald-50 p-3 text-sm font-black text-emerald-700">You earned ₹{Number(rewardHistory.find((entry) => entry.order_id === trackedOrder.id && entry.event_type === 'ORDER_REWARD')?.amount || 0).toFixed(2)} Zeshu Cash on this delivered order.</p>}
              {Number(trackedOrder.zeshuCashUsed || 0) > 0 && <p className="mt-3 text-sm font-black text-emerald-700">₹{Number(trackedOrder.zeshuCashUsed).toFixed(0)} Zeshu Cash used.</p>}
              {trackedOrder.status !== 'DELIVERED' && Number(trackedOrder.pendingReward || 0) > 0 && <p className="mt-2 text-sm font-bold text-slate-600">Earn ₹{Number(trackedOrder.pendingReward).toFixed(0)} Zeshu Cash after delivery.</p>}
              {trackedOrder.delivery_address && <p className="mt-3 text-xs text-slate-600"><span className="font-black">Delivered to:</span> {trackedOrder.delivery_address}</p>}
              {trackedOrder.payment_id && <p className="mt-2 text-[11px] text-slate-500"><span className="font-black">Payment:</span> {String(trackedOrder.payment_id).slice(0, 8)}…</p>}
              {trackedOrder.created_at && <p className="mt-2 text-[11px] font-medium text-slate-500">Placed {new Date(trackedOrder.created_at).toLocaleString()}</p>}
            </div>
            <OrderStatusTimeline status={trackedOrder.status} />
            {trackedOrder.status === 'DELIVERED' && <><ReviewForm overall={reviewOverall} delivery={reviewDelivery} store={reviewStore} comment={reviewComment} products={reviewProducts} existingReview={reviewExisting} loading={reviewLoading} error={reviewError} success={reviewSuccess} onOverallChange={setReviewOverall} onDeliveryChange={setReviewDelivery} onStoreChange={setReviewStore} onCommentChange={setReviewComment} onProductChange={(id, value) => setReviewProducts((current) => current.map((item) => item.id === id ? { ...item, rating: value } : item))} onProductCommentChange={(id, value) => setReviewProducts((current) => current.map((item) => item.id === id ? { ...item, comment: value } : item))} onSubmit={() => void submitReview()} /><div className="mt-6 flex flex-wrap gap-2"><button type="button" disabled={reorderingId === trackedOrder.id} onClick={() => void reorder(trackedOrder)} className="rounded-xl bg-[#087443] px-4 py-3 text-sm font-black text-white disabled:opacity-60">{reorderingId === trackedOrder.id ? 'Adding…' : 'Buy again'}</button><button type="button" onClick={() => { setIsTrackingOpen(false); setActiveTab('home'); }} className="rounded-xl border border-[#087443] px-4 py-3 text-sm font-black text-[#087443]">Continue shopping</button></div></>}
          </div>
          </div>
          </div>
        </div>
      )}

      {publicReviewProduct && <div className="fixed inset-0 z-[125] flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-labelledby="public-reviews-title"><div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"><div className="flex shrink-0 items-center justify-between border-b p-5"><div><h2 id="public-reviews-title" className="text-xl font-black">Reviews for {publicReviewProduct.name}</h2><p className="mt-1 text-xs text-slate-500">Verified purchases only</p></div><button type="button" aria-label="Close reviews" onClick={() => setPublicReviewProduct(null)} className="rounded-xl bg-slate-100 p-2"><X size={18} /></button></div><div className="min-h-0 flex-1 overflow-y-auto p-5">{publicReviewsLoading ? <p className="py-8 text-center text-sm text-slate-500">Loading reviews…</p> : publicReviews.length === 0 ? <p className="py-8 text-center text-sm text-slate-500">No written reviews yet.</p> : <div className="space-y-3">{publicReviews.map((review: any, index) => <article key={`${review.updated_at || review.created_at}-${index}`} className="rounded-2xl border border-slate-100 p-4"><p className="text-amber-500">{'★'.repeat(Number(review.rating || 0))}</p><p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{review.comment}</p><div className="mt-3 flex items-center justify-between text-[11px] text-slate-500"><span>Verified purchase</span><time>{new Date(review.updated_at || review.created_at).toLocaleDateString()}</time></div></article>)}</div>}</div></div></div>}

      {/* --- CART DRAWER WITH SMOOTH EDGES --- */}
      {checkoutError?.code === 'ABANDONABLE_PAYMENT_CHECKOUT' && isCartOpen && <div role="status" className="fixed bottom-24 left-1/2 z-[115] w-[min(92vw,32rem)] -translate-x-1/2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-950 shadow-2xl"><p className="font-black">Previous checkout found</p><p className="mt-1 text-xs font-medium leading-5 text-amber-800">Your previous payment attempt belongs to an older basket. We can safely close that checkout before starting this one.</p><div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={() => void handleContinueCurrentBasket()} disabled={isCheckingPaymentStatus || isCheckoutOpening} className="rounded-xl bg-amber-700 px-3 py-2 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-60">{isCheckingPaymentStatus ? 'Closing previous checkout...' : 'Continue current basket'}</button><button type="button" onClick={() => setCheckoutError({ message: 'Previous checkout kept. Check its payment status before retrying.', code: 'PAYMENT_RECONCILIATION_REQUIRED' })} disabled={isCheckingPaymentStatus || isCheckoutOpening} className="rounded-xl border border-amber-700 px-3 py-2 text-xs font-black text-amber-800 disabled:opacity-60">Keep previous checkout</button></div></div>}
      {isCartOpen && (
        <>
          <div className="fixed inset-0 bg-[#111827]/40 backdrop-blur-sm z-[60]" onClick={() => setIsCartOpen(false)}></div>
          <div role="dialog" aria-modal="true" aria-labelledby="cart-title" className="fixed top-0 right-0 h-full w-full md:w-[460px] bg-[#F8F9FC] z-[70] shadow-2xl animate-in slide-in-from-right duration-500 flex flex-col md:rounded-l-[32px] overflow-hidden">
            <div className="bg-white px-6 py-5 flex justify-between items-center border-b">
              <div className="flex items-baseline gap-2"><h2 id="cart-title" className="text-2xl font-black tracking-tighter">My Cart</h2><span className="text-sm font-bold text-slate-500">{cart.reduce((total, entry) => total + entry.qty, 0)} items</span></div>
              <button ref={modalCloseRef} aria-label="Close cart" onClick={() => setIsCartOpen(false)} className="p-2.5 bg-[#F3F4F6] rounded-full active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#087443]"><X size={20}/></button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto p-5 space-y-4">
              {cart.length === 0 && <div className="rounded-3xl border border-dashed border-[#cbd8cf] bg-white p-10 text-center"><ShoppingBag size={32} className="mx-auto mb-3 text-[#087443]"/><h3 className="font-black">Your cart is empty</h3><p className="mt-2 text-sm text-gray-500">Add essentials when you are ready.</p><button onClick={() => setIsCartOpen(false)} className="mt-5 rounded-xl bg-[#087443] px-4 py-2.5 text-sm font-bold text-white">Browse products</button></div>}
              {cart.map((c, i) => (
                <div key={i} className="bg-white p-4 rounded-2xl flex items-center gap-4 shadow-sm">
                  <img src={c.item.image_url} className="w-16 h-16 object-contain" alt="cart item"/>
                  <div className="flex-1"><h4 className="font-bold text-sm">{c.item.name}</h4><p className="text-xs text-gray-500">₹{c.item.price} x {c.qty}</p></div>
                  <div className="flex items-center bg-[#059669] text-white rounded-lg px-2"><button type="button" onClick={() => removeFromCart(c.item.id)} className="min-h-9 min-w-8 px-2">-</button><span className="px-2">{c.qty}</span><button type="button" disabled={c.item.quantity !== null && c.qty >= Number(c.item.quantity)} onClick={() => addToCart(c.item)} className="min-h-9 min-w-8 px-2 disabled:cursor-not-allowed disabled:opacity-40">+</button></div>
                </div>
              ))}
              {cart.length > 0 && <section className="overflow-hidden rounded-2xl border border-[#dce8df] bg-white">
                <button type="button" aria-expanded={expandedCartSection === 'ADDRESS'} aria-controls="cart-address-details" onClick={() => setExpandedCartSection((current) => current === 'ADDRESS' ? null : 'ADDRESS')} className="flex w-full items-center justify-between gap-3 p-4 text-left">
                  <span className="flex min-w-0 items-center gap-3"><MapPin size={20} className="shrink-0 text-[#087443]" aria-hidden="true" /><span className="min-w-0"><span className="block text-sm font-black text-slate-900">Delivery Address</span><span className="mt-1 block truncate text-xs font-medium text-slate-500">{deliveryAddressSummary || 'Add delivery address'}</span></span></span>
                  <span className="flex shrink-0 items-center gap-1 text-xs font-black text-[#087443]">{deliveryAddressSummary ? 'Change' : 'Add'} <ChevronDown size={16} className={`transition-transform ${expandedCartSection === 'ADDRESS' ? 'rotate-180' : ''}`} aria-hidden="true" /></span>
                </button>
                {expandedCartSection === 'ADDRESS' && <div id="cart-address-details" className="border-t border-[#dce8df] p-4">
                {addresses.length > 0 && <div className="mb-3"><p className="text-xs font-black uppercase tracking-wider text-[#52645a]">Saved addresses</p><div className="mt-2 space-y-2">{addresses.map((address) => <div key={address.id} className={`rounded-xl border p-3 ${selectedAddressId === address.id ? 'border-[#087443] bg-[#f1faf4]' : 'border-slate-200 bg-white'}`}><button type="button" onClick={() => { setSelectedAddressId(address.id); setCurrentAddress(formatAddress(address)); }} className="w-full text-left text-xs"><span className="block font-black">{address.label}{address.is_default ? ' · Default' : ''}</span><span className="mt-1 block line-clamp-2 text-slate-500">{formatAddress(address)}</span></button><div className="mt-2 flex flex-wrap gap-2"><button type="button" onClick={() => openAddressForm(address)} className="rounded-lg bg-slate-100 px-3 py-2 text-[11px] font-black">Edit</button>{!address.is_default && <button type="button" onClick={() => void setDefaultAddress(address.id)} className="rounded-lg bg-emerald-50 px-3 py-2 text-[11px] font-black text-emerald-700">Set default</button>}<button type="button" onClick={() => { setSelectedAddressId(address.id); setCurrentAddress(formatAddress(address)); }} className="rounded-lg bg-indigo-50 px-3 py-2 text-[11px] font-black text-indigo-700">Use for checkout</button></div></div>)}</div></div>}
                <div className="mb-2 flex flex-wrap items-center gap-3"><button type="button" onClick={() => { openAddressForm(); handleAutoDetectLocation(); }} className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-800">Use my current location</button><button type="button" onClick={() => openAddressForm()} className="rounded-lg bg-[#087443] px-3 py-2 text-xs font-black text-white">+ Add Address</button>{selectedAddressId && <button type="button" onClick={() => { const selected = addresses.find((address) => address.id === selectedAddressId); if (selected) requestDeleteAddress(selected); }} className="text-xs font-black text-red-600">Remove selected address</button>}</div><label htmlFor="delivery-address" className="block text-xs font-black uppercase tracking-wider text-[#52645a]">Delivery address</label>
                <textarea id="delivery-address" value={currentAddress === 'Location not set' ? '' : currentAddress} onChange={(event) => setCurrentAddress(event.target.value)} rows={3} placeholder="House / flat, street, area and landmark" className="mt-2 w-full resize-none rounded-xl border border-[#dce8df] bg-[#f8fbf8] p-3 text-sm font-medium outline-none focus:border-[#087443]" />
                <p className="mt-2 text-[11px] text-slate-500">Your address is used only for this checkout and is validated again on the server.</p>
                </div>}
              </section>}
              {cart.length > 0 && smartAddOns.length > 0 && <div className="rounded-2xl border border-[#dce8df] bg-white p-4"><div className="flex items-center justify-between"><h3 className="text-sm font-black text-slate-900">Complete your basket</h3><span className="text-[11px] font-bold text-slate-500">Current stock only</span></div><div className="mt-3 grid grid-cols-2 gap-2">{smartAddOns.map((product) => <div key={product.id} className="rounded-xl border border-slate-100 p-2"><img src={product.image_url} alt={product.name} className="h-16 w-full object-contain" /><p className="mt-1 line-clamp-2 text-xs font-bold">{product.name}</p><div className="mt-2 flex items-center justify-between"><span className="text-xs font-black">₹{product.price}</span><button type="button" onClick={() => addToCart(product)} className="rounded-lg bg-[#e9f7ef] px-2 py-1 text-[10px] font-black text-[#075b36]">ADD</button></div></div>)}</div></div>}
              {cart.length > 0 && <section className="overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm">
                <button type="button" aria-expanded={expandedCartSection === 'CASH'} aria-controls="cart-cash-details" onClick={() => setExpandedCartSection((current) => current === 'CASH' ? null : 'CASH')} className="flex w-full items-center justify-between gap-3 p-4 text-left">
                  <span className="flex min-w-0 items-center gap-3"><Ticket size={20} className="shrink-0 text-emerald-700" aria-hidden="true" /><span className="min-w-0"><span className="block text-sm font-black text-emerald-900">ZESHU CASH</span><span className="mt-1 block truncate text-xs font-bold text-emerald-700">₹{rewardBalance.toFixed(2)} available{requestedZeshuCash > 0 ? ` · ₹${requestedZeshuCash} applied` : ''}</span></span></span>
                  <span className="flex shrink-0 items-center gap-1 text-xs font-black text-emerald-700">{expandedCartSection === 'CASH' ? 'Hide' : 'View'} <ChevronDown size={16} className={`transition-transform ${expandedCartSection === 'CASH' ? 'rotate-180' : ''}`} aria-hidden="true" /></span>
                </button>
                {expandedCartSection === 'CASH' && <div id="cart-cash-details" className="border-t border-emerald-100 p-4">
                  {rewardBalance > 0 && <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4"><div className="flex items-center justify-between gap-3"><div><p className="text-sm font-black text-emerald-800">Zeshu Cash</p><p className="text-xs font-bold text-emerald-700">Available: ₹{rewardBalance.toFixed(2)}</p></div><button type="button" disabled={itemTotal <= 0 || zeshuCashMax < 1} onClick={() => { setUseZeshuCash((current) => !current); if (!useZeshuCash) setZeshuCashAmount(String(zeshuCashMax)); }} className={`rounded-xl px-3 py-2 text-xs font-black ${useZeshuCash ? 'bg-emerald-700 text-white' : 'bg-white text-emerald-700'} disabled:cursor-not-allowed disabled:opacity-50`}>{useZeshuCash ? 'REMOVE' : 'USE'}</button></div><p className="mt-2 text-[11px] font-bold text-emerald-700">₹1 Zeshu Cash = ₹1. Final payable stays at least ₹1.</p>{useZeshuCash && <div className="mt-3 flex items-center gap-2"><input type="number" min="1" max={zeshuCashMax} step="1" value={zeshuCashAmount} onChange={(event) => setZeshuCashAmount(event.target.value)} className="w-24 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm font-black" /><span className="text-xs font-bold text-emerald-700">You can use up to ₹{zeshuCashMax} on this order</span></div>}</div>}
                  {rewardBalance <= 0 && <p className="rounded-xl bg-emerald-50 p-3 text-xs font-bold text-emerald-700">Earn Zeshu Cash on eligible delivered orders and use it at checkout.</p>}
                </div>}
              </section>}
              {cart.length > 0 && <section className="overflow-hidden rounded-2xl border border-[#dce8df] bg-white shadow-sm">
                <button type="button" aria-expanded={expandedCartSection === 'PRICE'} aria-controls="cart-price-details" onClick={() => setExpandedCartSection((current) => current === 'PRICE' ? null : 'PRICE')} className="flex w-full items-center justify-between gap-3 p-4 text-left">
                  <span className="flex min-w-0 items-center gap-3"><Receipt size={20} className="shrink-0 text-[#087443]" aria-hidden="true" /><span className="min-w-0"><span className="block text-sm font-black text-slate-900">Price Details</span><span className="mt-1 block truncate text-xs font-bold text-slate-500">₹{finalCartTotal} · View breakdown</span></span></span>
                  <ChevronDown size={16} className={`shrink-0 text-[#087443] transition-transform ${expandedCartSection === 'PRICE' ? 'rotate-180' : ''}`} aria-hidden="true" />
                </button>
                {expandedCartSection === 'PRICE' && <div id="cart-price-details" className="space-y-3 border-t border-[#dce8df] p-4">
                  {itemTotal > 0 && <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-3"><div className="flex items-center justify-between text-xs font-black text-emerald-800"><span>{itemTotal >= freeDeliveryThreshold ? "You've unlocked FREE delivery 🎉" : `Add ₹${freeDeliveryThreshold - itemTotal} more for FREE delivery`}</span><span>{Math.min(100, Math.round((itemTotal / freeDeliveryThreshold) * 100))}%</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-emerald-100"><div className="h-full rounded-full bg-emerald-600 transition-all" style={{ width: `${Math.min(100, (itemTotal / freeDeliveryThreshold) * 100)}%` }} /></div>{itemTotal < freeDeliveryThreshold && itemTotal < 199 && <p className="mt-2 text-[11px] font-bold text-emerald-700">Add a few more essentials and save on delivery.</p>}</div>}
                  <div className="flex justify-between text-[#4B5563]"><span>Subtotal</span><span className="font-bold">₹{itemTotal}</span></div>
                  <div className="flex justify-between text-[#059669]"><span>Delivery charge</span><span className="font-black">{deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge}`}</span></div>
                  {requestedZeshuCash > 0 && <div className="flex justify-between text-emerald-700"><span>Zeshu Cash</span><span className="font-black">-₹{requestedZeshuCash}</span></div>}
                  <div className="border-t pt-4 flex justify-between font-black text-xl"><span>Grand total</span><span>₹{finalCartTotal}</span></div>
                  <p className="text-center text-[11px] font-bold text-slate-500">No hidden fees. Know your full cost before checkout.</p>
                </div>}
              </section>}
            </div>
            <div className="sticky bottom-0 z-10 bg-white p-6 border-t shadow-2xl">
              <div className="mb-3 flex items-center justify-between gap-3"><button type="button" onClick={clearCart} disabled={!cart.length || isCheckoutOpening} className="text-xs font-black text-red-600 disabled:text-slate-300">Clear cart</button><span className="text-[11px] font-medium text-slate-500">Stock and price are checked again before payment.</span></div>
              <p className="mb-3 text-center text-[11px] font-bold text-slate-500">Secure payment powered by Razorpay. Your total and stock are checked again before payment.</p>
              {checkoutError?.code === 'PAYMENT_RECONCILIATION_REQUIRED' && <div role="status" className="mb-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-950"><div className="flex items-start gap-3"><div className="mt-0.5 rounded-full bg-amber-100 p-2 text-amber-700"><Clock size={16} aria-hidden="true" /></div><div><p className="font-black">Checking previous payment</p><p className="mt-1 text-xs font-medium leading-5 text-amber-800">We&apos;re confirming the status of your previous payment before starting another one. This prevents duplicate charges.</p></div></div><button type="button" onClick={() => void handleCheckPaymentStatus()} disabled={isCheckingPaymentStatus || isCheckoutOpening} className="mt-3 rounded-xl bg-amber-700 px-3 py-2 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-60">{isCheckingPaymentStatus ? 'Checking payment status…' : 'Check payment status'}</button>{checkoutError.requestId && <p className="mt-2 text-[10px] font-medium text-amber-700">Reference: {checkoutError.requestId}</p>}</div>}
              {checkoutError && checkoutError.code !== 'PAYMENT_RECONCILIATION_REQUIRED' && <div role="alert" aria-live="assertive" className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-3 text-sm font-bold text-red-700"><p>{checkoutError.message}</p>{checkoutError.code && <p className="mt-1 text-xs font-semibold text-red-600">Code: {checkoutError.code}{checkoutError.requestId ? ` · Reference: ${checkoutError.requestId}` : ''}</p>}</div>}
              <p className="mb-3 text-center text-[11px] leading-5 text-slate-500">By proceeding, you agree to Zeshu&apos;s <Link href="/policies#terms" className="font-black text-[#087443] underline underline-offset-2">Terms</Link>, <Link href="/policies#privacy" className="font-black text-[#087443] underline underline-offset-2">Privacy Policy</Link>, and <Link href="/policies#cancellation-refunds" className="font-black text-[#087443] underline underline-offset-2">Cancellation &amp; Refund Policy</Link>.</p>
              <button disabled={cart.length === 0 || isLoading || isCheckoutOpening} onClick={() => void handleCartCheckout()} className="w-full bg-[#087443] disabled:bg-[#a7b6ac] text-white font-bold py-4 rounded-2xl flex justify-between px-6 items-center">
                <span>{isLoading ? 'Preparing secure checkout…' : 'Proceed to secure payment'}</span><span>₹{finalCartTotal}</span>
              </button>
            </div>
          </div>
        </>
      )}

      {addressPendingDelete && <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/60 p-4"><div role="dialog" aria-modal="true" aria-labelledby="remove-address-title" className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl"><h2 id="remove-address-title" className="text-xl font-black text-slate-900">Remove saved address?</h2><p className="mt-3 text-sm font-bold text-slate-700">{addressPendingDelete.label} · {formatAddress(addressPendingDelete)}</p><p className="mt-2 text-sm leading-6 text-slate-600">This address will be removed from your saved addresses.</p><div className="mt-6 flex justify-end gap-3"><button type="button" disabled={addressDeleting} onClick={() => setAddressPendingDelete(null)} className="rounded-xl px-4 py-3 text-sm font-black text-slate-600">Cancel</button><button type="button" disabled={addressDeleting} onClick={() => void deleteAddress()} className="rounded-xl bg-red-600 px-4 py-3 text-sm font-black text-white disabled:opacity-60">{addressDeleting ? 'Removing…' : 'Remove address'}</button></div></div></div>}
      {addressFormOpen && <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/60 p-4"><form onSubmit={saveAddress} role="dialog" aria-modal="true" aria-labelledby="address-form-title" className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl"><div className="mb-5 flex items-center justify-between"><h2 id="address-form-title" className="text-xl font-black">{editingAddress ? 'Edit address' : 'Add address'}</h2><button type="button" aria-label="Close address form" onClick={() => setAddressFormOpen(false)} className="min-h-10 min-w-10 rounded-xl bg-slate-100"><X size={18} /></button></div><div className="grid gap-3 sm:grid-cols-2"><input required aria-label="Address label" placeholder="Label (Home, Work)" value={addressForm.label} onChange={(event) => setAddressForm({ ...addressForm, label: event.target.value })} className="rounded-xl border p-3 text-sm" /><input aria-label="Recipient name" placeholder="Recipient name (optional)" value={addressForm.recipient_name} onChange={(event) => setAddressForm({ ...addressForm, recipient_name: event.target.value })} className="rounded-xl border p-3 text-sm" /><input aria-label="Phone" placeholder="Phone (optional)" value={addressForm.phone} onChange={(event) => setAddressForm({ ...addressForm, phone: event.target.value })} className="rounded-xl border p-3 text-sm" /><input required aria-label="Address line" placeholder="House / flat and street" value={addressForm.address_line} onChange={(event) => setAddressForm({ ...addressForm, address_line: event.target.value })} className="rounded-xl border p-3 text-sm sm:col-span-2" /><input aria-label="Landmark" placeholder="Landmark (optional)" value={addressForm.landmark} onChange={(event) => setAddressForm({ ...addressForm, landmark: event.target.value })} className="rounded-xl border p-3 text-sm" /><input required aria-label="City" placeholder="City" value={addressForm.city} onChange={(event) => setAddressForm({ ...addressForm, city: event.target.value })} className="rounded-xl border p-3 text-sm" /><input required aria-label="State" placeholder="State" value={addressForm.state} onChange={(event) => setAddressForm({ ...addressForm, state: event.target.value })} className="rounded-xl border p-3 text-sm" /><input aria-label="Postal code" placeholder="Postal code (optional)" value={addressForm.postal_code} onChange={(event) => setAddressForm({ ...addressForm, postal_code: event.target.value })} className="rounded-xl border p-3 text-sm" /><input aria-label="Latitude" inputMode="decimal" placeholder="Latitude (optional)" value={addressForm.latitude} onChange={(event) => setAddressForm({ ...addressForm, latitude: event.target.value })} className="rounded-xl border p-3 text-sm" /><input aria-label="Longitude" inputMode="decimal" placeholder="Longitude (optional)" value={addressForm.longitude} onChange={(event) => setAddressForm({ ...addressForm, longitude: event.target.value })} className="rounded-xl border p-3 text-sm" /></div><label className="mt-4 flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={addressForm.is_default} onChange={(event) => setAddressForm({ ...addressForm, is_default: event.target.checked })} /> Make this my default address</label><div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setAddressFormOpen(false)} className="rounded-xl px-4 py-3 text-sm font-black text-slate-600">Cancel</button><button disabled={addressSaving} className="rounded-xl bg-[#087443] px-5 py-3 text-sm font-black text-white disabled:opacity-60">{addressSaving ? 'Saving...' : 'Save address'}</button></div></form></div>}

      {/* --- AUTH MODAL WITH SMOOTH EDGES --- */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div role="dialog" aria-modal="true" aria-labelledby="auth-title" className="bg-white rounded-[32px] p-8 w-full max-w-sm relative shadow-2xl">
            <button ref={modalCloseRef} aria-label="Close sign in" onClick={() => setIsAuthModalOpen(false)} className="absolute top-5 right-5 text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5]"><X size={20}/></button>
            <h2 id="auth-title" className="text-2xl font-black text-center">Sign in / Create account</h2>
            <p className="mt-2 mb-6 text-center text-sm font-bold text-slate-500">New to Zeshu? Start here</p>
            {!otpSent ? (
              <div className="space-y-4">
                <input type="tel" maxLength={10} value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="w-full p-4 bg-[#F8F9FC] border rounded-2xl font-bold text-lg outline-none focus:border-[#6366F1]" placeholder="Mobile Number" />
                <button onClick={handleSendOtp} className="w-full bg-[#111827] text-white font-bold py-4 rounded-2xl active:scale-95 transition-transform">Get OTP</button>
              </div>
            ) : (
              <div className="space-y-4">
                <input type="number" value={otp} onChange={(e) => setOtp(e.target.value)} className="w-full p-4 bg-[#F8F9FC] border rounded-2xl text-center text-3xl font-black tracking-widest outline-none focus:border-[#6366F1]" placeholder="------" />
                <button onClick={handleVerifyOtp} className="w-full bg-[#4F46E5] text-white font-bold py-4 rounded-2xl active:scale-95 transition-transform">Verify OTP</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- ACCOUNT DRAWER WITH SMOOTH EDGES --- */}
      {isAccountOpen && (
        <>
          <div className="fixed inset-0 bg-[#111827]/40 backdrop-blur-sm z-[60]" onClick={closeAccount}></div>
          <div role="dialog" aria-modal="true" aria-labelledby="account-title" className="fixed top-0 right-0 h-full w-full md:w-[460px] bg-[#F8F9FC] z-[70] shadow-2xl animate-in slide-in-from-right duration-500 flex flex-col md:rounded-l-[32px] overflow-hidden">
            <div className="bg-white px-6 py-5 flex justify-between items-center border-b">
              <h2 id="account-title" className="text-2xl font-black tracking-tighter">My Account</h2>
              <button ref={modalCloseRef} aria-label="Close account" onClick={closeAccount} className="p-2.5 bg-[#F3F4F6] rounded-full active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5]"><X size={20}/></button>
            </div>
            <div className="flex flex-1 flex-col overflow-y-auto p-6 space-y-6">
              {accountView === 'HOME' && <div className="bg-gradient-to-br from-[#4F46E5] to-[#4338CA] p-6 rounded-[24px] text-white shadow-lg">
                 <div className="flex items-center gap-4 mb-6">
                   <div className="h-16 w-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md border border-white/30"><User size={32} className="text-white" aria-hidden="true"/></div>
                   <div>
                     <p className="text-indigo-100 text-sm font-bold uppercase tracking-wider">Hi, {getCustomerFirstName(user)}</p>
                     <p className="mt-1 text-sm font-bold text-white/90">Manage your Zeshu account</p>
                     <p className="mt-1 text-xs font-bold text-indigo-100">{user?.phone ? maskedPhone(user.phone) : user?.email || 'Signed in securely'}</p>
                   </div>
                 </div>
              </div>}
              {accountView === 'HOME' && <div className="space-y-3" aria-label="Account menu">
                {[
                  { view: 'CASH', title: 'ZESHU CASH', summary: `₹${rewardBalance.toFixed(2)} · View balance & transactions`, icon: <Ticket size={20} aria-hidden="true" /> },
                  { view: 'ORDERS', title: 'Your Orders & Buy Again', summary: `${myOrders.length} orders`, icon: <Package size={20} aria-hidden="true" /> },
                  { view: 'ADDRESSES', title: 'Saved Addresses', summary: `${addresses.length} saved`, icon: <MapPin size={20} aria-hidden="true" /> },
                  { view: 'REFERRAL', title: 'Invite & Earn', summary: 'Share your Zeshu invite code', icon: <HeartHandshake size={20} aria-hidden="true" /> },
                  { view: 'SUPPORT', title: 'Help & Support', summary: 'Orders, delivery, payments & more', icon: <PhoneCall size={20} aria-hidden="true" /> },
                  { view: 'POLICIES', title: 'Policies & Trust', summary: 'Customer policies and service information', icon: <ShieldCheck size={20} aria-hidden="true" /> },
                  { view: 'PASS', title: 'Zeshu Pass', summary: 'Coming soon', icon: <Crown size={20} aria-hidden="true" /> },
                  { view: 'SUBSCRIBE', title: 'Subscribe & Save', summary: 'Coming soon', icon: <History size={20} aria-hidden="true" /> },
                  { view: 'SERVICES', title: 'More from Zeshu', summary: 'Rides, Rentals & Courier', icon: <Menu size={20} aria-hidden="true" /> },
                  { view: 'SETTINGS', title: 'Account Settings', summary: 'Personal sign-in information', icon: <BookUser size={20} aria-hidden="true" /> },
                ].map((item) => <button type="button" key={item.view} onClick={() => setAccountView(item.view as AccountView)} className="flex min-h-16 w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-indigo-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">{item.icon}</span><span className="min-w-0 flex-1"><span className="block text-sm font-black text-slate-900">{item.title}</span><span className="mt-1 block truncate text-xs font-bold text-slate-500">{item.summary}</span></span><ChevronRight size={18} className="shrink-0 text-slate-400" aria-hidden="true" /></button>)}
              </div>}
              {accountView !== 'HOME' && <div className="flex items-center"><button type="button" onClick={() => setAccountView('HOME')} className="inline-flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-black text-indigo-700 hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"><span aria-hidden="true">←</span> Back to My Account</button></div>}
              {accountView === 'ADDRESSES' && <section className="rounded-[24px] border border-slate-200 bg-white p-5" aria-labelledby="saved-addresses-title">
                <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 id="saved-addresses-title" className="font-black text-slate-900">Saved Addresses</h3><p className="mt-1 text-xs text-slate-500">Choose a saved address at checkout.</p></div><div className="flex flex-wrap gap-2"><button type="button" onClick={() => { openAddressForm(); handleAutoDetectLocation(); }} className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-800">Use my current location</button><button type="button" onClick={() => openAddressForm()} className="rounded-xl bg-[#087443] px-3 py-2 text-xs font-black text-white">+ Add Address</button></div></div>
                <div className="mt-4 space-y-3">{addresses.length === 0 ? <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">No saved addresses yet.</p> : addresses.map((address) => <div key={address.id} className="rounded-xl border border-slate-100 p-3"><div className="flex items-start justify-between gap-3"><div><p className="font-black text-slate-900">{address.label} {address.is_default && <span className="ml-1 rounded bg-emerald-100 px-2 py-1 text-[10px] text-emerald-700">Default</span>}</p><p className="mt-1 text-xs text-slate-600">{address.recipient_name || 'Recipient'} · {formatAddress(address)}</p></div><button type="button" onClick={() => void deleteAddress(address.id)} className="text-xs font-black text-red-600">Delete</button></div><div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={() => openAddressForm(address)} className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-black">Edit</button>{!address.is_default && <button type="button" onClick={() => void setDefaultAddress(address.id)} className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700">Set default</button>}<button type="button" onClick={() => { setSelectedAddressId(address.id); setCurrentAddress(formatAddress(address)); setIsAccountOpen(false); setIsCartOpen(true); }} className="rounded-lg bg-indigo-50 px-3 py-2 text-xs font-black text-indigo-700">Use for checkout</button></div></div>)}</div>
              </section>}
              {accountView === 'REFERRAL' && <section className="rounded-[24px] border border-emerald-100 bg-white p-5" aria-labelledby="invite-earn-title">
                <h3 id="invite-earn-title" className="font-black text-slate-900">Invite &amp; Earn</h3>
                <p className="mt-1 text-xs leading-5 text-slate-600">Invite friends. Earn Zeshu Cash after their first eligible delivered order.</p>
                {referralCode && <div className="mt-3 rounded-xl border border-emerald-100 bg-emerald-50 p-3"><p className="text-[11px] font-black uppercase tracking-wider text-slate-500">Your invite code</p><div className="mt-2 flex flex-wrap items-center gap-2"><span className="rounded-lg bg-white px-3 py-2 font-mono text-sm font-black text-emerald-800">{referralCode}</span><button type="button" onClick={() => void copyReferralCode()} className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-black text-white">{referralCopied ? 'Copied' : 'Copy code'}</button><button type="button" onClick={() => void shareReferralCode()} className="rounded-lg bg-indigo-50 px-3 py-2 text-xs font-black text-indigo-700">Share</button></div></div>}
                <div className="mt-3 rounded-xl border border-emerald-100 bg-slate-50 p-3"><p className="text-[11px] font-black uppercase tracking-wider text-slate-500">Have a referral code?</p><div className="mt-2 flex flex-col gap-2 sm:flex-row"><input value={referralInput} onChange={(event) => setReferralInput(event.target.value)} placeholder="Enter code" aria-label="Referral code" className="min-w-0 flex-1 rounded-lg border border-emerald-100 bg-white px-3 py-2 text-xs font-bold uppercase outline-none" /><button type="button" disabled={referralApplying} onClick={() => void applyReferral()} className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-black text-white disabled:opacity-60">{referralApplying ? 'Applying...' : 'Apply code'}</button></div></div>
                {referralMessage && <p className="mt-2 text-xs font-bold text-slate-600">{referralMessage}</p>}
              </section>}
              {accountView === 'SETTINGS' && <section className="rounded-[24px] border border-slate-200 bg-white p-5"><div className="flex items-center justify-between gap-3"><div><h3 className="font-black text-slate-900">Account settings</h3><p className="mt-1 text-xs text-slate-500">Your sign-in details are protected and managed securely.</p></div><span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-700">Secure</span></div><div className="mt-4 space-y-2 text-sm"><div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2"><span className="font-bold text-slate-500">Phone</span><span className="font-black text-slate-800">{user?.phone ? maskedPhone(user.phone) : 'Not added'}</span></div>{user?.email && <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2"><span className="font-bold text-slate-500">Email</span><span className="max-w-[60%] truncate font-black text-slate-800">{user.email}</span></div>}</div></section>}
              {accountView === 'CASH' && <section className="rounded-[24px] border border-emerald-100 bg-emerald-50 p-5">
                <p className="text-[11px] font-black tracking-[0.16em] text-emerald-700">ZESHU CASH</p>
                <p className="mt-1 text-3xl font-black text-slate-900">₹{rewardBalance.toFixed(2)}</p>
                <p className="mt-1 text-xs text-slate-600">Earn Zeshu Cash on eligible orders and use it at checkout.</p>
                {(() => { const count = myOrders.filter((order) => order.status === 'DELIVERED' && new Date(order.created_at || 0).getMonth() === new Date().getMonth() && new Date(order.created_at || 0).getFullYear() === new Date().getFullYear()).length; return <p className="mt-3 text-xs font-black text-emerald-700">{count < 3 ? `Complete ${3 - count} more delivered order(s) for the monthly ₹5 bonus.` : count < 5 ? `Complete ${5 - count} more delivered order(s) for the monthly ₹10 bonus.` : 'Monthly milestone progress is complete.'}</p>; })()}
                <div className="mt-4"><p className="text-[11px] font-black uppercase tracking-wider text-slate-500">Recent transactions</p><div className="mt-2 space-y-2">{rewardHistory.slice(0, 3).map((entry, index) => <div key={`${entry.event_type}-${index}`} className="flex justify-between gap-3 text-xs"><span className="text-slate-600">{entry.description || entry.event_type}</span><span className="font-black text-emerald-700">+₹{Number(entry.amount || 0).toFixed(2)}</span></div>)}</div></div>
              </section>}
              {accountView === 'ORDERS' && <section className="rounded-[24px] border border-slate-200 bg-white p-5">
                <div className="flex items-center justify-between gap-3"><div><h3 className="font-black text-slate-900">Your Orders</h3><p className="mt-1 text-xs text-slate-500">Your latest confirmed grocery orders.</p></div><span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-black text-slate-600">{myOrders.length}</span></div>
                <div className="mt-4 space-y-3">
                  {ordersLoadError ? <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm font-bold text-red-700">Recent orders are temporarily unavailable. Please try again later.</p> : myOrders.length === 0 ? <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">No confirmed grocery orders yet.</p> : myOrders.map((order) => { const status = String(order.status || 'PENDING'); const delivered = status === 'DELIVERED'; return <div key={order.id} className="rounded-xl border border-slate-100 bg-white p-3"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-black text-slate-800">Order #{order.id?.split('-')[0]?.toUpperCase()}</p><p className="mt-1 text-[11px] font-medium text-slate-500">{order.created_at ? new Date(order.created_at).toLocaleString() : 'Order date unavailable'}</p></div><div className="text-right"><p className="text-sm font-black text-slate-900">₹{Number(order.total_paid || 0).toFixed(2)}</p><span className="mt-1 inline-block rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-black text-[#087443]">{status.replaceAll('_', ' ')}</span></div></div><div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={() => { setTrackedOrder(order); setIsTrackingOpen(true); setIsAccountOpen(false); }} className="rounded-lg bg-indigo-50 px-3 py-2 text-xs font-black text-indigo-700">{delivered ? 'View order' : 'Track order'}</button>{delivered && <button type="button" disabled={reorderingId === order.id} onClick={() => void reorder(order)} className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700 disabled:opacity-60">{reorderingId === order.id ? 'Adding...' : 'Buy again'}</button>}</div></div>; })}
                </div>
              </section>}
              {accountView === 'ORDERS' && <section className="rounded-[24px] border border-slate-200 bg-white p-5"><h3 className="font-black text-slate-900">Buy again</h3><p className="mt-1 text-xs text-slate-500">Use current prices and availability from delivered orders.</p><div className="mt-3 space-y-2">{myOrders.filter((order) => order.status === 'DELIVERED').slice(0, 5).length === 0 ? <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-500">No delivered orders yet.</p> : myOrders.filter((order) => order.status === 'DELIVERED').slice(0, 5).map((order) => <button type="button" key={`reorder-${order.id}`} disabled={reorderingId === order.id} onClick={() => void reorder(order)} className="flex w-full items-center justify-between rounded-xl border border-slate-100 p-3 text-left text-xs font-black disabled:opacity-60"><span>Order #{order.id?.split('-')[0]?.toUpperCase()}</span><span className="text-indigo-700">{reorderingId === order.id ? 'Adding...' : 'Reorder'}</span></button>)}</div></section>}
              {accountView === 'SUPPORT' && <section className="rounded-[24px] border border-slate-200 bg-white p-5" aria-labelledby="support-title">
                <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 id="support-title" className="font-black text-slate-900">Help &amp; Support</h3><p className="mt-2 text-sm leading-6 text-slate-600">Start a support conversation with the Zeshu team. Never share OTPs, passwords, or payment credentials.</p></div>{selectedSupportConversationId && <button type="button" onClick={startNewSupportConversation} className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-black text-[#087443]">New conversation</button>}</div>
                {!selectedSupportConversationId && <div className="mt-4 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-sm font-black text-slate-900">Zeshu Assistant</p><p className="mt-1 text-xs leading-5 text-slate-600">Ask about tracking, delivery, refunds, Zeshu Cash, location, recharge/bill availability or account help. If AI cannot safely resolve the issue, it automatically transfers this chat to Zeshu Support with the context attached.</p></div>{supportAssistantSource && <span className="rounded-full bg-white px-2 py-1 text-[10px] font-black uppercase tracking-wider text-indigo-700">{supportAssistantSource === 'ai' ? 'AI' : 'Guided help'}</span>}</div>
                  {supportAssistantMessages.length > 0 && <div className="mt-3 max-h-64 space-y-2 overflow-y-auto rounded-xl bg-white/70 p-3" aria-live="polite">{supportAssistantMessages.map((message, index) => <div key={`${message.role}-${index}`} className={`rounded-xl p-3 text-sm leading-6 ${message.role === 'CUSTOMER' ? 'ml-6 bg-indigo-600 text-white' : 'mr-6 bg-white text-slate-700 shadow-sm'}`}><p className={`mb-1 text-[10px] font-black uppercase tracking-wider ${message.role === 'CUSTOMER' ? 'text-indigo-100' : 'text-indigo-700'}`}>{message.role === 'CUSTOMER' ? 'You' : 'Zeshu Assistant'}</p><p className="whitespace-pre-wrap break-words">{message.body}</p></div>)}</div>}
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row"><input value={supportAssistantQuestion} maxLength={1200} onChange={(event) => { setSupportAssistantQuestion(event.target.value); setSupportAssistantAnswer(''); setSupportAssistantResolved(null); }} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); void askSupportAssistant(); } }} placeholder="Ask Zeshu Assistant…" aria-label="Ask Zeshu Assistant" className="min-w-0 flex-1 rounded-xl border border-indigo-100 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-400" /><button type="button" disabled={supportAssistantBusy || !supportAssistantQuestion.trim()} onClick={() => void askSupportAssistant()} className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-black text-white disabled:opacity-50">{supportAssistantBusy ? 'Thinking…' : 'Send'}</button></div>
                  {supportAssistantResolved === false && supportAssistantAnswer && <button type="button" onClick={connectAssistantToHuman} className="mt-3 rounded-xl border border-[#087443] bg-white px-4 py-2.5 text-xs font-black text-[#087443]">Open manual support form</button>}
                </div>}
                {SUPPORT_WHATSAPP_UI_ENABLED && <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div><p className="text-sm font-black text-slate-900">WhatsApp support updates</p><p className="mt-1 text-xs leading-5 text-slate-600">Get transactional WhatsApp notifications when Zeshu Support replies or resolves your support request. No marketing messages.</p></div>
                    <button type="button" role="switch" aria-label="WhatsApp support updates" aria-checked={supportWhatsappEnabled} disabled={supportWhatsappPreferenceLoading || !supportWhatsappPreferenceLoaded || supportWhatsappPreferenceSaving || (!supportWhatsappPhoneAvailable && !supportWhatsappEnabled)} onClick={() => void updateSupportWhatsappPreference(!supportWhatsappEnabled)} className={`relative h-7 w-12 shrink-0 rounded-full transition ${supportWhatsappEnabled ? 'bg-[#087443]' : 'bg-slate-300'} disabled:cursor-not-allowed disabled:opacity-60`}>
                      <span aria-hidden="true" className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${supportWhatsappEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                  {supportWhatsappPreferenceLoading && <p className="mt-2 text-xs font-medium text-slate-500">Loading WhatsApp preference...</p>}
                  {supportWhatsappPreferenceLoaded && !supportWhatsappPhoneAvailable && <p className="mt-2 text-xs font-bold text-amber-800">A verified phone number is required for WhatsApp support updates.</p>}
                  {supportWhatsappPreferenceSaving && <p className="mt-2 text-xs font-medium text-slate-500">Saving preference...</p>}
                  {supportWhatsappPreferenceError && <p role="alert" className="mt-2 text-xs font-bold text-red-700">{supportWhatsappPreferenceError}</p>}
                </div>}
                {!selectedSupportConversationId ? <>
                  <label htmlFor="support-category" className="sr-only">Support category</label>
                  <select id="support-category" value={supportSubject} onChange={(event) => setSupportSubject(event.target.value)} className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-700">
                    <option>Order issue</option><option>Delivery issue</option><option>Payment issue</option><option>Refund issue</option><option>Recharge/Bill issue</option><option>Account issue</option><option>Other</option>
                  </select>
                  <label htmlFor="support-details" className="sr-only">Support details</label>
                  <textarea id="support-details" rows={3} maxLength={4000} value={supportMessage} onChange={(event) => setSupportMessage(event.target.value)} placeholder="Describe what you need help with" className="mt-2 w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#087443]" />
                  <button type="button" disabled={supportBusy || !supportMessage.trim()} onClick={() => void submitSupportConversation()} className="mt-3 w-full rounded-xl bg-[#087443] px-4 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500">{supportBusy ? 'Saving...' : 'Send to support'}</button>
                </> : <div className="mt-4">
                  <button type="button" onClick={startNewSupportConversation} className="text-xs font-black text-indigo-700">← Back to conversations</button>
                  {supportThreadLoading && !supportThread ? <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">Loading conversation…</p> : supportThread ? <>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2"><div><p className="font-black text-slate-900">{supportThread.conversation.subject}</p><p className="mt-1 text-xs font-bold text-slate-500">{supportThread.conversation.status === 'WAITING' ? 'WAITING FOR SUPPORT' : supportThread.conversation.status}</p></div>{supportThread.conversation.status !== 'RESOLVED' && <button type="button" disabled={supportThreadBusy || supportThread.conversation.status === 'WAITING'} onClick={() => void escalateSupportConversation()} className="rounded-xl bg-amber-50 px-3 py-2 text-xs font-black text-amber-800 disabled:opacity-60">{supportThread.conversation.status === 'WAITING' ? 'Agent requested' : 'Talk to a person'}</button>}</div>
                    <div className="mt-3 max-h-72 space-y-2 overflow-y-auto rounded-xl bg-slate-50 p-3">{supportThread.messages.length === 0 ? <p className="text-sm text-slate-500">No messages yet.</p> : supportThread.messages.map((message) => <div key={message.id} className={`rounded-xl p-3 text-sm ${message.sender_role === 'CUSTOMER' ? 'ml-6 bg-indigo-50 text-indigo-950' : 'mr-6 bg-white text-slate-800 shadow-sm'}`}><p className="mb-1 text-[10px] font-black uppercase tracking-wider text-slate-500">{message.sender_role === 'CUSTOMER' ? 'You' : message.sender_role === 'ADMIN' ? 'Zeshu support' : message.sender_role === 'AI' ? 'Zeshu Assistant' : 'Support'}</p><p className="whitespace-pre-wrap break-words">{message.body}</p></div>)}</div>
                    {supportThread.conversation.status === 'RESOLVED' ? <p className="mt-3 rounded-xl bg-emerald-50 p-3 text-xs font-bold text-emerald-800">This conversation is resolved. Start a new conversation if you need more help.</p> : <><label htmlFor="support-thread-message" className="sr-only">Reply to support</label><textarea id="support-thread-message" rows={3} maxLength={4000} value={supportThreadMessage} onChange={(event) => setSupportThreadMessage(event.target.value)} placeholder="Reply to support" className="mt-3 w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#087443]" /><button type="button" disabled={supportThreadBusy || !supportThreadMessage.trim()} onClick={() => void sendSupportThreadMessage()} className="mt-2 w-full rounded-xl bg-[#087443] px-4 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500">{supportThreadBusy ? 'Sending...' : 'Send message'}</button></>}
                  </> : <p className="mt-4 rounded-xl bg-red-50 p-4 text-sm font-bold text-red-700">This conversation could not be loaded.</p>}
                </div>}
                {supportNotice && <p role="status" className="mt-2 text-xs font-bold text-slate-600">{supportNotice}</p>}
                {!selectedSupportConversationId && supportConversations.length > 0 && <div className="mt-4 space-y-2"><p className="text-[11px] font-black uppercase tracking-wider text-slate-500">Your conversations</p>{supportConversations.slice(0, 10).map((conversation) => <button type="button" key={conversation.id} onClick={() => openSupportConversation(conversation.id)} className="flex w-full items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-3 text-left text-xs transition hover:bg-slate-100"><span className="min-w-0"><span className="block truncate font-bold text-slate-700">{conversation.subject}</span><span className="mt-1 block text-[11px] text-slate-500">{conversation.status === 'WAITING' ? 'WAITING FOR SUPPORT' : conversation.status}</span></span><ChevronRight size={16} className="shrink-0 text-slate-400" aria-hidden="true" /></button>)}</div>}
                <p className="mt-3 text-xs font-medium text-slate-500">For urgent safety issues, contact support@zeshu.in. Never share OTPs or full payment credentials.</p>
              </section>}
              {accountView === 'POLICIES' && <section className="rounded-[24px] border border-slate-200 bg-white p-5"><h3 className="font-black text-slate-900">Policies &amp; Trust</h3><p className="mt-2 text-sm leading-6 text-slate-600">Review customer-facing policies and service availability in the Trust Center.</p><Link href="/policies" className="mt-3 inline-flex rounded-xl bg-emerald-50 px-4 py-2.5 text-sm font-black text-[#087443]">Open Trust Center</Link></section>}
              {accountView === 'PASS' && <section className="rounded-[24px] border border-indigo-100 bg-indigo-50 p-5"><div className="flex items-start justify-between gap-3"><div><h3 className="font-black text-slate-900">Zeshu Pass</h3><p className="mt-1 text-sm leading-6 text-slate-600">Membership benefits are being prepared for a future launch.</p></div><span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-wider text-indigo-700">Coming soon</span></div></section>}
              {accountView === 'SUBSCRIBE' && <section className="rounded-[24px] border border-amber-100 bg-amber-50 p-5"><div className="flex items-start justify-between gap-3"><div><h3 className="font-black text-slate-900">Subscribe &amp; Save</h3><p className="mt-1 text-sm leading-6 text-slate-600">Recurring plans and scheduled savings are not available yet.</p></div><span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-wider text-amber-700">Coming soon</span></div></section>}
              {accountView === 'SERVICES' && <section className="rounded-[24px] border border-slate-200 bg-white p-5"><h3 className="font-black text-slate-900">More from Zeshu</h3><p className="mt-1 text-xs leading-5 text-slate-500">More everyday services are on the way.</p><div className="mt-4 grid gap-2 sm:grid-cols-3"><div className="rounded-xl bg-slate-50 p-3"><p className="text-sm font-black text-slate-800">Zeshu Rides</p><p className="mt-1 text-[11px] font-bold text-slate-500">Bike rides</p><span className="mt-2 inline-block text-[10px] font-black uppercase tracking-wider text-slate-400">Coming soon</span></div><div className="rounded-xl bg-slate-50 p-3"><p className="text-sm font-black text-slate-800">Zeshu Rentals</p><p className="mt-1 text-[11px] font-bold text-slate-500">Car rental</p><span className="mt-2 inline-block text-[10px] font-black uppercase tracking-wider text-slate-400">Coming soon</span></div><div className="rounded-xl bg-slate-50 p-3"><p className="text-sm font-black text-slate-800">Zeshu Courier</p><p className="mt-1 text-[11px] font-bold text-slate-500">Send packages locally</p><span className="mt-2 inline-block text-[10px] font-black uppercase tracking-wider text-slate-400">Coming soon</span></div></div></section>}
            </div>
            {accountView === 'HOME' && <div className="bg-white p-6 border-t shadow-2xl">
              <button onClick={handleLogout} className="w-full bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold py-4 rounded-2xl flex justify-center items-center gap-2 transition-colors active:scale-95">
                <LogOut size={20} /> Logout
              </button>
            </div>}
          </div>
        </>
      )}

      <Script id="razorpay-checkout-js" src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
    </div>
  );
}

