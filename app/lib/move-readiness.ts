import 'server-only';

export type MoveServiceKey = 'rides' | 'courier' | 'car_share' | 'travel';

export type MoveServiceReadiness = {
  service: MoveServiceKey;
  providerConfigured: boolean;
  executionRequested: boolean;
  customerBookingAvailable: false;
  status: 'COMING_SOON';
};

const enabled = (name: string) => process.env[name]?.trim().toLowerCase() === 'true';
const configured = (name: string) => Boolean(process.env[name]?.trim());

export function getMoveServiceReadiness(): Record<MoveServiceKey, MoveServiceReadiness> {
  const master = enabled('MOVE_EXECUTION_ENABLED');
  const make = (service: MoveServiceKey, flag: string, provider: string): MoveServiceReadiness => ({
    service,
    providerConfigured: configured(provider),
    executionRequested: master && enabled(flag),
    // Intentionally hard-false until each service has a verified booking adapter,
    // transaction state machine, refunds/cancellation handling and compliance sign-off.
    customerBookingAvailable: false,
    status: 'COMING_SOON',
  });

  return {
    rides: make('rides', 'MOVE_RIDES_EXECUTION_ENABLED', 'ZESHU_RIDES_PROVIDER'),
    courier: make('courier', 'MOVE_COURIER_EXECUTION_ENABLED', 'ZESHU_ONDEMAND_COURIER_PROVIDER'),
    car_share: make('car_share', 'MOVE_CAR_SHARE_EXECUTION_ENABLED', 'ZESHU_CAR_SHARE_PROVIDER'),
    travel: make('travel', 'MOVE_TRAVEL_EXECUTION_ENABLED', 'ZESHU_TRAVEL_PROVIDER'),
  };
}
