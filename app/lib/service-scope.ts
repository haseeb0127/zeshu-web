export const JAGTIAL_DELIVERY_CITY_LABEL = 'Jagtial';

export const NATIONWIDE_DIGITAL_SERVICE_IDS = [
  'mobile',
  'electricity',
  'dth',
  'upi',
  'fastag',
  'lpg',
  'gas',
  'water',
  'broadband',
] as const;

const JAGTIAL_NAMES = ['jagtial', 'jagityal', 'jagitial', 'jagityala'];

export const isJagtialDeliveryCity = (value: unknown) => {
  const normalized = String(value || '').trim().toLowerCase();
  return JAGTIAL_NAMES.some((name) => normalized === name || normalized.includes(name));
};

export const isNationwideDigitalServiceId = (value: unknown) =>
  NATIONWIDE_DIGITAL_SERVICE_IDS.includes(String(value || '') as (typeof NATIONWIDE_DIGITAL_SERVICE_IDS)[number]);
