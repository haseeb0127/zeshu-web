import fs from 'node:fs';
import {
  canRetryMoveProviderBooking,
  canTransitionMoveBooking,
  requiresMoveManualReview,
} from '../../app/lib/move-booking-state.ts';

const assert = (condition: boolean, message: string) => {
  if (!condition) throw new Error(message);
};

assert(canTransitionMoveBooking('DISCOVERY', 'QUOTED'), 'Discovery must be able to become quoted');
assert(canTransitionMoveBooking('BOOKING_PENDING', 'CONFIRMED'), 'Pending booking must be able to confirm');
assert(!canTransitionMoveBooking('BOOKING_PENDING', 'DISCOVERY'), 'Unknown pending booking must not silently restart');
assert(!canRetryMoveProviderBooking('BOOKING_PENDING'), 'Pending provider booking must never be blindly retried');
assert(!canRetryMoveProviderBooking('CONFIRMED'), 'Confirmed provider booking must never be retried');
assert(canRetryMoveProviderBooking('FAILED'), 'Conclusive failure may return to discovery/retry');
assert(requiresMoveManualReview({ bookingState: 'BOOKING_PENDING', providerStatusUnknown: true, moneyCaptured: false }), 'Unknown pending provider status must require review');
assert(requiresMoveManualReview({ bookingState: 'CONFIRMED', providerStatusUnknown: true, moneyCaptured: true }), 'Unknown status with captured money must require review');

const readiness = fs.readFileSync('app/lib/move-readiness.ts', 'utf8');
assert(readiness.includes('customerBookingAvailable: false'), 'Move customer booking must remain hard-disabled');
assert(readiness.includes('supportAvailable: true'), 'Move customer support must remain available before booking');
assert(readiness.includes("'VERIFY_PROVIDER' | 'SANDBOX_QA' | 'COMPLIANCE_SIGN_OFF'"), 'Move readiness must expose explicit go-live gates');

const contract = fs.readFileSync('app/lib/move-provider-contract.ts', 'utf8');
for (const action of ['SERVICEABILITY','QUOTE','BOOK','TRACK','CANCEL','REFUND']) {
  assert(contract.includes("'" + action + "'"), "Move provider contract missing " + action);
}

console.log('MOVE_PROVIDER_FOUNDATION_QA=PASS');
