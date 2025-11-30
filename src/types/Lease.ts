// types/Lease.ts
export interface BaseLease {
  id: string;
  lessor: string;
  rbaCpiRate: string;
  borrowingRate: string;
  incrementMethods: { [year: number]: string };
  overrideAmounts: { [year: number]: string };
}

export interface PropertyLease extends BaseLease {
  type: 'Property';
  propertyAddress: string;
  commencementDate: string;
  expiryDate: string;
  options: string;
  annualRent: string;
  fixedIncrementRate: string;
}

export interface MotorVehicleLease extends BaseLease {
  type: 'Motor Vehicle';
  entityName: string;
  description: string;
  vinSerialNo: string;
  regoNo: string;
  deliveryDate: string;
  expiryDate: string;
  annualRent: string;
}

export type Lease = PropertyLease | MotorVehicleLease;