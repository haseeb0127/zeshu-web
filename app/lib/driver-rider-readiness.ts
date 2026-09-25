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
  documentUploadAvailable: boolean;
  activationAvailable: false;
  status: 'VERIFICATION_AVAILABLE' | 'INTEREST_ONLY';
  nextGate:
    | 'DOCUMENT_AND_SAFETY_VERIFICATION'
    | 'GOODS_AGENT_AND_PROVIDER_REVIEW'
    | 'TELANGANA_PASSENGER_AGGREGATOR_REVIEW'
    | 'GOODS_PERMIT_AND_AGENT_REVIEW'
    | 'VERIFY_OPERATOR_LICENCE_AND_CONTRACT';
};

export function getDriverRiderReadiness(): Record<DriverRiderRole, DriverRiderReadiness> {
  const make = (
    role: DriverRiderRole,
    nextGate: DriverRiderReadiness['nextGate'],
    documentUploadAvailable = true,
  ): DriverRiderReadiness => ({
    role,
    interestRegistrationAvailable: true,
    documentUploadAvailable,
    activationAvailable: false,
    status: documentUploadAvailable ? 'VERIFICATION_AVAILABLE' : 'INTEREST_ONLY',
    nextGate,
  });

  return {
    DELIVERY_RIDER: make('DELIVERY_RIDER', 'DOCUMENT_AND_SAFETY_VERIFICATION'),
    BIKE_COURIER: make('BIKE_COURIER', 'GOODS_AGENT_AND_PROVIDER_REVIEW'),
    AUTO_DRIVER: make('AUTO_DRIVER', 'TELANGANA_PASSENGER_AGGREGATOR_REVIEW'),
    CAB_DRIVER: make('CAB_DRIVER', 'TELANGANA_PASSENGER_AGGREGATOR_REVIEW'),
    GOODS_DRIVER: make('GOODS_DRIVER', 'GOODS_PERMIT_AND_AGENT_REVIEW'),
    PASSENGER_FLEET_OPERATOR: make('PASSENGER_FLEET_OPERATOR', 'VERIFY_OPERATOR_LICENCE_AND_CONTRACT', false),
    LOGISTICS_FLEET_OPERATOR: make('LOGISTICS_FLEET_OPERATOR', 'VERIFY_OPERATOR_LICENCE_AND_CONTRACT', false),
  };
}
