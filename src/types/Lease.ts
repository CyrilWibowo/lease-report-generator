export interface Lease {
  id: string;
  type: 'Property' | 'Motor Vehicle';
  propertyAddress?: string;
  description?: string;
  commencementDate: string;
  expiryDate: string;
  options: string;
  originalAnnualRent: string;
  rbaCpiRate: string;
  fixedIncrementRate: string;
  borrowingRate: string;
  incrementMethods: { [year: number]: string };
  overrideAmounts: { [year: number]: string };
}