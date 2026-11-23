import type { HomeServiceCode } from './home-services-categories';

/**
 * Standardised scopes make independent providers' future prices comparable.
 * These are definitions ONLY; no provider, price or availability is implied.
 */
export type HomeServiceMenuItem = {
  name: string;
  scope: string;
  pricing: 'UPFRONT' | 'QUOTE';
};

export const HOME_SERVICE_MENUS: Record<HomeServiceCode, readonly HomeServiceMenuItem[]> = {
  AC_REPAIR: [
    { name: 'Inspection / checkup', scope: 'Visit and diagnostic scope; disclose any adjustable visit fee', pricing: 'UPFRONT' },
    { name: 'Split / window AC cleaning', scope: 'Identify jet, foam or basic cleaning and what is included', pricing: 'UPFRONT' },
    { name: 'Installation / removal', scope: 'Labour scope; brackets, pipe and extra materials listed separately', pricing: 'UPFRONT' },
    { name: 'Gas, parts & complex repairs', scope: 'Inspection and written approval before any additional work', pricing: 'QUOTE' },
  ],
  ELECTRICIAN: [
    { name: 'Inspection / visiting fee', scope: 'Visit scope and whether fee adjusts against accepted labour', pricing: 'UPFRONT' },
    { name: 'Switch / socket replacement labour', scope: 'Per-point labour; parts separately itemised', pricing: 'UPFRONT' },
    { name: 'Fan / light fitting labour', scope: 'Standard accessible fitting; parts separately itemised', pricing: 'UPFRONT' },
    { name: 'Major wiring / fault finding', scope: 'Written scope, labour and materials after inspection', pricing: 'QUOTE' },
  ],
  PLUMBER: [
    { name: 'Inspection / visiting fee', scope: 'Visit scope and any adjustment against agreed repair', pricing: 'UPFRONT' },
    { name: 'Tap / shower fitting labour', scope: 'Standard fitting, excluded parts noted separately', pricing: 'UPFRONT' },
    { name: 'Minor leak / flush fix labour', scope: 'Specify covered fixture and accessible work', pricing: 'UPFRONT' },
    { name: 'Major pipework & concealed leaks', scope: 'Written quote after inspection; parts itemised', pricing: 'QUOTE' },
  ],
  RO_APPLIANCE: [
    { name: 'RO / appliance inspection', scope: 'Diagnostic visit and included checks', pricing: 'UPFRONT' },
    { name: 'Standard RO service labour', scope: 'Labour only; filter or membrane prices separate', pricing: 'UPFRONT' },
    { name: 'Basic appliance maintenance', scope: 'Specify model and included cleaning or check', pricing: 'UPFRONT' },
    { name: 'Motor, PCB, filter & other parts', scope: 'Written quotation and customer permission required', pricing: 'QUOTE' },
  ],
  SALON: [
    { name: 'Threading / grooming at salon', scope: 'Named service and number of areas', pricing: 'UPFRONT' },
    { name: 'Waxing at salon', scope: 'Body area and product/brand named', pricing: 'UPFRONT' },
    { name: 'Haircut / basic styling at salon', scope: 'Service scope and add-ons named', pricing: 'UPFRONT' },
    { name: 'Custom salon package', scope: 'Confirm contents and price before appointment', pricing: 'QUOTE' },
  ],
  BEAUTICIAN: [
    { name: 'Threading / waxing home visit', scope: 'Area and product brand; minimum visit order disclosed', pricing: 'UPFRONT' },
    { name: 'Cleanup / facial home visit', scope: 'Brand and exact product range named', pricing: 'UPFRONT' },
    { name: 'Pedicure / basic grooming', scope: 'Included treatment and minimum visit fee', pricing: 'UPFRONT' },
    { name: 'Custom beauty package', scope: 'Product list and written price before confirmation', pricing: 'QUOTE' },
  ],
  MEHNDI: [
    { name: 'Half hand (simple)', scope: 'Front or back and one or both hands specified', pricing: 'UPFRONT' },
    { name: 'One full hand (front & back)', scope: 'Design density and hand coverage specified', pricing: 'UPFRONT' },
    { name: 'Both hands (Arabic / traditional)', scope: 'Style and coverage specified', pricing: 'UPFRONT' },
    { name: 'Bridal / group mehndi', scope: 'Hands, legs, artist count, travel and timing quoted', pricing: 'QUOTE' },
  ],
  MAKEUP: [
    { name: 'Simple occasion makeup', scope: 'Products, hairstyling and travel exclusions stated', pricing: 'UPFRONT' },
    { name: 'Party makeup', scope: 'Brand range, lashes/hair and travel exclusions stated', pricing: 'UPFRONT' },
    { name: 'Hair styling only', scope: 'Included style, accessories and travel named', pricing: 'UPFRONT' },
    { name: 'Bridal / event group package', scope: 'Trial, time, products, travel and add-ons quoted', pricing: 'QUOTE' },
  ],
};
