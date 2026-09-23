import { classifySupportPriority } from '../../app/lib/support-priority.ts';

const assert = (condition: boolean, message: string) => {
  if (!condition) throw new Error(message);
};

const urgent = classifySupportPriority('Safety issue', 'Driver threatened the passenger');
assert(urgent.label === 'URGENT' && urgent.rank === 0, 'Safety cases must be URGENT');

const payment = classifySupportPriority('Payment issue', 'Money was debited twice');
assert(payment.label === 'HIGH' && payment.rank === 1, 'Payment/refund disputes must be HIGH');

const parcel = classifySupportPriority('Courier / Cargo issue', 'Parcel tracking question');
assert(parcel.label === 'SERVICE' && parcel.rank === 2, 'Service questions must be SERVICE priority');

const routine = classifySupportPriority('Account question', 'How do I change the language?');
assert(routine.label === 'NORMAL' && routine.rank === 3, 'Routine questions must be NORMAL');

const safetyWins = classifySupportPriority('Payment issue', 'There was an accident during the ride');
assert(safetyWins.label === 'URGENT', 'Safety must outrank payment priority');

console.log('SUPPORT_PRIORITY_QA=PASS');
