/**
 * Zeshu Services: only these first-wave service categories may accept a
 * Jagtial enquiry. All home visits require a separately verified professional
 * and an operator-confirmed price; none of these is instant-bookable.
 */
export const HOME_SERVICE_CATEGORIES = [
  { code: 'AC_REPAIR', label: 'AC service & repair', detail: 'Inspection, servicing and repair estimates', visit: true },
  { code: 'ELECTRICIAN', label: 'Electrician', detail: 'Wiring, switches, lights and minor repairs', visit: true },
  { code: 'PLUMBER', label: 'Plumber', detail: 'Leak repair, taps and bathroom fittings', visit: true },
  { code: 'RO_APPLIANCE', label: 'RO & appliance repair', detail: 'Water purifier and household appliance checks', visit: true },
  { code: 'SALON', label: 'Salon appointment', detail: 'A confirmed salon slot, not an automatic home visit', visit: false },
  { code: 'BEAUTICIAN', label: 'Beautician', detail: 'Beauty consultations and verified appointments', visit: true },
  { code: 'MEHNDI', label: 'Mehndi artist', detail: 'Event and wedding mehndi quotations', visit: true },
  { code: 'MAKEUP', label: 'Makeup artist', detail: 'Event makeup quotations and availability', visit: true },
] as const;

export const HOME_SERVICE_HELD_CATEGORIES = [
  'Babysitters and childcare',
  'Full-time maids and domestic placements',
  'In-home tutors or any work involving minors',
  'Deep cleaning teams without verified staff cover',
  'Gas or refrigerant handling without trained, authorised personnel',
  'Unverified overnight or unattended home access',
] as const;

export type HomeServiceCode = typeof HOME_SERVICE_CATEGORIES[number]['code'];
export function isHomeServiceCode(value: unknown): value is HomeServiceCode {
  return typeof value === 'string' && HOME_SERVICE_CATEGORIES.some(item => item.code === value);
}
