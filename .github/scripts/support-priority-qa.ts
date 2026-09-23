import { classifySupportPriority } from '../../app/lib/support-priority.ts';
import { buildCategorizedSupportSubject, classifySupportCategory } from '../../app/lib/support-category.ts';

const assert = (condition: boolean, message: string) => {
  if (!condition) throw new Error(message);
};

const urgent = classifySupportPriority('Safety issue', 'Driver threatened the passenger');
assert(urgent.label === 'URGENT' && urgent.rank === 0, 'Safety cases must be URGENT');

const payment = classifySupportPriority('Payment issue', 'Money was debited twice');
assert(payment.label === 'HIGH' && payment.rank === 1, 'Payment/refund disputes must be HIGH');

const parcel = classifySupportPriority('Courier / Cargo issue', 'Parcel tracking question');
assert(parcel.label === 'SERVICE' && parcel.rank === 2, 'Service questions must be SERVICE priority');

const marketplace = classifySupportPriority('Marketplace / seller issue', 'Seller invoice question');
assert(marketplace.label === 'SERVICE' && marketplace.rank === 2, 'Marketplace seller cases must be SERVICE priority');

const pharmacy = classifySupportPriority('Pharmacy / Health issue', 'Pharmacy availability question');
assert(pharmacy.label === 'SERVICE' && pharmacy.rank === 2, 'Pharmacy cases must be SERVICE priority');

const delivery = classifySupportPriority('Delivery issue', 'Address serviceability question');
assert(delivery.label === 'SERVICE' && delivery.rank === 2, 'Delivery cases must be SERVICE priority');

const routine = classifySupportPriority('Account question', 'How do I change the language?');
assert(routine.label === 'NORMAL' && routine.rank === 3, 'Routine questions must be NORMAL');

const safetyWins = classifySupportPriority('Payment issue', 'There was an accident during the ride');
assert(safetyWins.label === 'URGENT', 'Safety must outrank payment priority');

const categories = [
  ['RIDES', 'Can I book an auto ride?', 'Ride issue'],
  ['COURIER', 'My parcel is missing', 'Courier / Cargo issue'],
  ['CAR_SHARE', 'How does carpool work?', 'Car Share issue'],
  ['TRAVEL', 'My flight booking question', 'Travel issue'],
  ['MARKETPLACE', 'Do I get an invoice from the seller?', 'Marketplace / seller issue'],
  ['DIGITAL', 'My electricity bill payment', 'Recharge/Bill issue'],
  ['DIGITAL', 'My FASTag provider question', 'Recharge/Bill issue'],
  ['DIGITAL', 'My DTH subscriber ID question', 'Recharge/Bill issue'],
  ['DIGITAL', 'My broadband bill question', 'Recharge/Bill issue'],
  ['PHARMACY', 'Can I order prescription medicine?', 'Pharmacy / Health issue'],
  ['ACCOUNT', 'OTP login help', 'Account issue'],
  ['DELIVERY', 'Is my address serviceable?', 'Delivery issue'],
  ['REWARDS', 'Where is my Zeshu Cash?', 'Rewards / Referral issue'],
  ['ORDER', 'Where is my grocery order?', 'Order issue'],
] as const;

for (const [intent, message, expected] of categories) {
  assert(classifySupportCategory(intent, message) === expected, `${intent} must map to ${expected}`);
}

const categorized = buildCategorizedSupportSubject('RIDES', 'Driver complaint', 'Ride support');
assert(categorized === '[Ride issue] Ride support', 'Handoff subject must include the service category');

console.log('SUPPORT_PRIORITY_QA=PASS');
