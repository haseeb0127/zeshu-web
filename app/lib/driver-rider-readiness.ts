import 'server-only';

export type DriverRiderRole =
  | 'DELIVERY_RIDER'
  | 'BIKE_COURIER'
  | 'AUTO_DRIVER'
  | 'CAB_DRIVER'
  | 'GOODS_DRIVER'
  | 'PASSENGER_FLEET_OPERATOR'
  | 'LOGISTICS_FLEET_OPERATOR';

export type DriverRiderReadiness = {
  role: DriverRiderRole;
  interestRegistrationAvailable: true;
  documentUploadAvailable: false;
  activationAvailable: false;
  status: 'INTEREST_ONLY';
  nextGate:
    | 'SECURE_KYC_AND_DELIVERY_OPS'
    | 'GOODS_AGENT_AND_PROVIDER_REVIEW'
    | 'TELANGANA_PASSENGER_AGGREGATOR_REVIEW'
    | 'GOODS_PERMIT_AND_AGENT_REVIEW'
    | 'VERIFY_OPERATOR_LICENCE_AND_CONTRACT';
};

export function getDriverRiderReadiness(): Record<DriverRiderRole, DriverRiderReadiness> {
  const make = (role: DriverRiderRole, nextGate: DriverRiderReadiness['nextGate']): DriverRiderReadiness => ({
    role,
    interestRegistrationAvailable: true,
    documentUploadAvailable: false,
    activationAvailable: false,
    status: 'INTEREST_ONLY',
    nextGate,
  });

  return {
    DELIVERY_RIDER: make('DELIVERY_RIDER', 'SECURE_KYC_AND_DELIVERY_OPS'),
    BIKE_COURIER: make('BIKE_COURIER', 'GOODS_AGENT_AND_PROVIDER_REVIEW'),
    AUTO_DRIVER: make('AUTO_DRIVER', 'TELANGANA_PASSENGER_AGGREGATOR_REVIEW'),
    CAB_DRIVER: make('CAB_DRIVER', 'TELANGANA_PASSENGER_AGGREGATOR_REVIEW'),
    GOODS_DRIVER: make('GOODS_DRIVER', 'GOODS_PERMIT_AND_AGENT_REVIEW'),
    PASSENGER_FLEET_OPERATOR: make('PASSENGER_FLEET_OPERATOR', 'VERIFY_OPERATOR_LICENCE_AND_CONTRACT'),
    LOGISTICS_FLEET_OPERATOR: make('LOGISTICS_FLEET_OPERATOR', 'VERIFY_OPERATOR_LICENCE_AND_CONTRACT'),
  };
}
