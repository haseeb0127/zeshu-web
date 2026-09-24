import { classifySupportPriority } from '../../app/lib/support-priority.ts';
import { buildCategorizedSupportSubject, classifySupportCategory } from '../../app/lib/support-category.ts';
import { classifySupportCase } from '../../app/lib/support-taxonomy.ts';

const assert = (condition: boolean, message: string) => {
  if (!condition) throw new Error(message);
};

const urgent = classifySupportPriority('Safety issue', 'Driver threatened the passenger');
assert(urgent.label === 'P0' && urgent.rank === 0, 'Safety cases must be URGENT');

const payment = classifySupportPriority('Payment issue', 'Money was debited twice');
assert(payment.label === 'P1' && payment.rank === 1, 'Payment/refund disputes must be HIGH');

const parcel = classifySupportPriority('Courier / Cargo issue', 'Parcel tracking question');
assert(parcel.label === 'P2' && parcel.rank === 2, 'Service questions must be SERVICE priority');

const marketplace = classifySupportPriority('Marketplace / seller issue', 'Seller invoice question');
assert(marketplace.label === 'P2' && marketplace.rank === 2, 'Marketplace seller cases must be SERVICE priority');

const pharmacy = classifySupportPriority('Pharmacy / Health issue', 'Pharmacy availability question');
assert(pharmacy.label === 'P2' && pharmacy.rank === 2, 'Pharmacy cases must be SERVICE priority');

const delivery = classifySupportPriority('Delivery issue', 'Address serviceability question');
assert(delivery.label === 'P2' && delivery.rank === 2, 'Delivery cases must be SERVICE priority');

const routine = classifySupportPriority('Account question', 'How do I change the language?');
assert(routine.label === 'P3' && routine.rank === 3, 'Routine questions must be NORMAL');

const safetyWins = classifySupportPriority('Payment issue', 'There was an accident during the ride');
assert(safetyWins.label === 'P0', 'Safety must outrank payment priority');

const categories = [
  ['RIDES', 'Can I book an auto ride?', 'Ride issue'],
  ['COURIER', 'My parcel is missing', 'Courier / Cargo issue'],
  ['CAR_SHARE', 'How does carpool work?', 'Car Share issue'],
  ['TRAVEL', 'My flight booking question', 'Travel issue'],
  ['MARKETPLACE', 'Do I get an invoice from the seller?', 'Marketplace / seller issue'],
  ['DIGITAL', 'My electricity bill payment', 'Recharge/Bill issue'],
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


const safetyCase = classifySupportCase('SAFETY', 'Driver threatened me during the ride');
assert(safetyCase.service === 'MOBILITY' && safetyCase.severity === 'P0' && safetyCase.escalationRequired, 'Safety taxonomy must create a P0 mobility escalation');

const digitalMoney = classifySupportCase('PROVIDER_DISPUTE', 'Money debited but recharge is missing');
assert(digitalMoney.service === 'DIGITAL' && digitalMoney.severity === 'P1' && digitalMoney.escalationRequired, 'Digital money dispute must be P1');

const courierStatus = classifySupportCase('COURIER', 'Where is my parcel tracking?');
assert(courierStatus.service === 'COURIER' && courierStatus.severity === 'P2' && !courierStatus.escalationRequired, 'Ordinary courier tracking must remain self-service');

const generalCase = classifySupportCase('GENERAL', 'What services are available?');
assert(generalCase.severity === 'P3' && !generalCase.escalationRequired, 'General information must be P3');
