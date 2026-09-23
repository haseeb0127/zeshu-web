import 'server-only';

export type MoveBookingState =
  | 'DISCOVERY'
  | 'QUOTED'
  | 'AWAITING_CUSTOMER_CONFIRMATION'
  | 'BOOKING_PENDING'
  | 'CONFIRMED'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLATION_PENDING'
  | 'CANCELLED'
  | 'REFUND_PENDING'
  | 'REFUNDED'
  | 'FAILED'
  | 'MANUAL_REVIEW';

const TRANSITIONS: Record<MoveBookingState, MoveBookingState[]> = {
  DISCOVERY: ['QUOTED', 'FAILED'],
  QUOTED: ['AWAITING_CUSTOMER_CONFIRMATION', 'DISCOVERY', 'FAILED'],
  AWAITING_CUSTOMER_CONFIRMATION: ['BOOKING_PENDING', 'DISCOVERY', 'FAILED'],
  BOOKING_PENDING: ['CONFIRMED', 'FAILED', 'MANUAL_REVIEW'],
  CONFIRMED: ['ASSIGNED', 'IN_PROGRESS', 'CANCELLATION_PENDING', 'FAILED', 'MANUAL_REVIEW'],
  ASSIGNED: ['IN_PROGRESS', 'CANCELLATION_PENDING', 'FAILED', 'MANUAL_REVIEW'],
  IN_PROGRESS: ['COMPLETED', 'CANCELLATION_PENDING', 'FAILED', 'MANUAL_REVIEW'],
  COMPLETED: ['REFUND_PENDING', 'REFUNDED'],
  CANCELLATION_PENDING: ['CANCELLED', 'CONFIRMED', 'ASSIGNED', 'IN_PROGRESS', 'MANUAL_REVIEW'],
  CANCELLED: ['REFUND_PENDING', 'REFUNDED'],
  REFUND_PENDING: ['REFUNDED', 'MANUAL_REVIEW'],
  REFUNDED: [],
  FAILED: ['DISCOVERY'],
  MANUAL_REVIEW: ['CONFIRMED', 'CANCELLED', 'REFUND_PENDING', 'REFUNDED', 'FAILED'],
};

export const canTransitionMoveBooking = (from: MoveBookingState, to: MoveBookingState) =>
  TRANSITIONS[from].includes(to);

export const assertMoveBookingTransition = (from: MoveBookingState, to: MoveBookingState) => {
  if (!canTransitionMoveBooking(from, to)) {
    throw new Error(`INVALID_MOVE_BOOKING_TRANSITION:${from}->${to}`);
  }
};

export const canRetryMoveProviderBooking = (state: MoveBookingState) =>
  state === 'DISCOVERY' || state === 'FAILED';

export const requiresMoveManualReview = (input: {
  bookingState: MoveBookingState;
  providerStatusUnknown: boolean;
  moneyCaptured: boolean;
}) => {
  if (input.providerStatusUnknown && (input.moneyCaptured || input.bookingState === 'BOOKING_PENDING')) return true;
  return input.bookingState === 'MANUAL_REVIEW';
};
