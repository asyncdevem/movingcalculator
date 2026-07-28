export type ViewType = 'dashboard' | 'new-quote' | 'saved-quotes' | 'customers' | 'admin';

export interface RouteInfo {
  pickupAddress: string;
  deliveryAddress: string;
  distanceMiles: number;
  durationHours: number;
  drivingDays: number;
  hotelNights: number;
  googleMapsUrl?: string;
}

export interface CustomerInfo {
  id?: string;
  name: string;
  phone: string;
  email: string;
  moveDate: string;
  notes?: string;
}

export type TruckType = '26 ft Box Truck' | '16 ft Moving Truck' | '20 ft Truck';

export interface TruckOption {
  type: TruckType;
  count: number; // 1, 2, 3, 4
  uhaulRatePerTruck: number;
  penskeRatePerTruck: number;
  selectedProvider: 'U-Haul' | 'Penske';
  totalWeight?: number; // Total load weight in lbs
  numberOfMovers?: number; // Number of movers for loading/unloading
  loadHours?: number; // Calculated load hours
  unloadHours?: number; // Calculated unload hours
  trucksNeededFromWeight?: number; // Auto-calculated from weight (8000 lbs per truck)
  isWeightBased?: boolean; // Whether truck count is determined by weight
  isManualRental?: boolean; // Whether rental price is manually entered
  manualRentalPrice?: number; // Manual rental price per truck (overrides auto-calculation)
}

export interface AdminRates {
  gasPricePerGallon: number; // e.g. 3.85
  mpg: number; // e.g. 7
  hotelRatePerNight: number; // e.g. 200
  driverPayPerMile: number; // e.g. 0.50
  loadingCost: number; // e.g. 600
  unloadingCost: number; // e.g. 600
  flightDefaultCost: number; // e.g. 300 (now per driver/truck)
  profitMarginPercent: number; // e.g. 30 (for 1.30)
  hoursPerDrivingDay: number; // e.g. 11 (max hours per driving day)
}

export interface QuoteBreakdown {
  driverPay: number;
  fuelCost: number;
  hotelCost: number;
  laborCost: number; // loading + unloading (or hired help)
  loadingCost: number;
  unloadingCost: number;
  hiredHelpCost?: number; // Optional hired help cost
  useHiredHelp?: boolean; // Whether hired help is used for unloading
  flightCost: number;
  truckRentalCost: number;
  subtotal: number;
  profitAmount: number;
  grandTotal: number;
}

export interface QuoteRecord {
  id: string;
  quoteNumber: string;
  createdAt: string;
  customer: CustomerInfo;
  route: RouteInfo;
  truck: TruckOption;
  ratesUsed: AdminRates;
  breakdown: QuoteBreakdown;
  status: 'Draft' | 'Sent' | 'Accepted' | 'Declined';
}
