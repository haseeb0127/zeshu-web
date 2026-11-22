/**
 * Strict scheduled transport enquiry schema for the five town launch corridor.
 * A quote enquiry is NOT a confirmed booking, dispatch, driver match or payment.
 */
export const MOVE_QUOTE_SERVICE_CODES = [
  'OUTSTATION_CAB', 'RETURN_CAB', 'MINI_TRUCK', 'LARGE_TRUCK', 'CHARTER_BUS',
] as const;
export type MoveQuoteService = typeof MOVE_QUOTE_SERVICE_CODES[number];
export const MOVE_QUOTE_TOWNS = ['Jagtial', 'Dharmaram', 'Korutla', 'Metpally', 'Dharmapuri'] as const;
export type MoveQuoteTown = typeof MOVE_QUOTE_TOWNS[number];

export const MOVE_QUOTE_SERVICES: Record<MoveQuoteService, { label: string; description: string }> = {
  OUTSTATION_CAB: { label: 'Outstation Cab', description: 'A whole commercial cab for a planned trip' },
  RETURN_CAB: { label: 'Return-leg Cab', description: 'Ask operators about an available return journey; discounts are not guaranteed' },
  MINI_TRUCK: { label: 'Mini Truck / Pickup', description: 'Goods transport with a clear load and pickup window' },
  LARGE_TRUCK: { label: 'Large Goods Truck', description: 'Commercial vehicle and route-specific itemised quote' },
  CHARTER_BUS: { label: 'Marriage / Group Bus', description: 'Whole-bus hire for weddings, temples and family groups' },
};

export type ValidatedMoveQuote = {
  service_code: MoveQuoteService;
  pickup_town: MoveQuoteTown;
  pickup_landmark: string;
  destination: string;
  travel_date: string;
  travel_time: string | null;
  contact_name: string;
  contact_phone: string;
  passengers: number | null;
  load_description: string;
  notes: string;
  consented_at: string;
};

export type MoveQuoteValidation =
  | { ok: true; value: ValidatedMoveQuote }
  | { ok: false; error: string };

const clean = (value: unknown, length: number) => typeof value === 'string'
  ? value.trim().replace(/\s+/g, ' ').slice(0, length)
  : '';

const inSet = <T extends string>(values: readonly T[], value: string): value is T =>
  values.some(option => option === value);

export function getIndiaTodayISO(date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata', day: '2-digit', month: '2-digit', year: 'numeric',
  }).formatToParts(date);
  const part = (type: string) => parts.find(item => item.type === type)?.value || '';
  return `${part('year')}-${part('month')}-${part('day')}`;
}

export function validateMoveQuote(raw: unknown, now = new Date()): MoveQuoteValidation {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw))
    return { ok: false, error: 'Check the enquiry form.' };
  const input = raw as Record<string, unknown>;
  if (clean(input.website, 100)) return { ok: false, error: 'Unable to accept this request.' };
  const service = clean(input.service_code, 30);
  const town = clean(input.pickup_town, 30);
  const pickup = clean(input.pickup_landmark, 160);
  const destination = clean(input.destination, 200);
  const date = clean(input.travel_date, 10);
  const time = clean(input.travel_time, 5);
  const name = clean(input.contact_name, 100);
  const phone = clean(input.contact_phone, 30).replace(/[\s()+-]/g, '');
  const mobile = phone.startsWith('91') && phone.length === 12 ? phone.slice(2) : phone;
  const notes = clean(input.notes, 900);
  const load = clean(input.load_description, 500);
  const passengers = input.passengers === '' || input.passengers == null ? null : Number(input.passengers);

  if (!inSet(MOVE_QUOTE_SERVICE_CODES, service)) return { ok: false, error: 'Choose a supported service.' };
  if (!inSet(MOVE_QUOTE_TOWNS, town)) return { ok: false, error: 'Choose one of the five supported pickup towns.' };
  if (destination.length < 3) return { ok: false, error: 'Enter the destination or drop-off location.' };
  if (name.length < 2 || !/^[6-9][0-9]{9}$/.test(mobile)) return { ok: false, error: 'Enter your name and a valid Indian mobile number.' };
  if (input.consent !== true) return { ok: false, error: 'Consent is required to contact you about this enquiry.' };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { ok: false, error: 'Choose a valid travel date.' };
  const day = new Date(date + 'T00:00:00Z');
  const today = getIndiaTodayISO(now);
  const todayDate = new Date(today + 'T00:00:00Z');
  const days = (day.getTime() - todayDate.getTime()) / 86_400_000;
  if (!Number.isInteger(days) || days < 0 || days > 180) return { ok: false, error: 'Choose a date between today and the next 180 days.' };
  if (time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return { ok: false, error: 'Enter a valid departure time.' };
  if (passengers !== null && (!Number.isInteger(passengers) || passengers < 1 || passengers > 70))
    return { ok: false, error: 'Enter a valid passenger count.' };
  if (service === 'CHARTER_BUS' && passengers === null)
    return { ok: false, error: 'Enter approximately how many people need the bus.' };
  if ((service === 'MINI_TRUCK' || service === 'LARGE_TRUCK') && load.length < 5)
    return { ok: false, error: 'Describe the goods and approximate load.' };
  if (service === 'RETURN_CAB' && notes.length < 4)
    return { ok: false, error: 'Provide return-trip timing or flexibility in the notes.' };

  return {
    ok: true,
    value: {
      service_code: service,
      pickup_town: town,
      pickup_landmark: pickup,
      destination,
      travel_date: date,
      travel_time: time || null,
      contact_name: name,
      contact_phone: mobile,
      passengers,
      load_description: load,
      notes,
      consented_at: now.toISOString(),
    },
  };
}
