export type ViewType = 'dashboard' | 'new-quote' | 'saved-quotes' | 'customers' | 'admin';

export interface RouteInfo {
  pickupAddress: string;
  deliveryAddress: string;
  distanceMiles: number;
  durationHours: number;
  drivingDays: number;
  hotelNights: number;
  googleMapsUrl?: string;
  
  // Manual overrides
  isManualDistance?: boolean;
  isManualHotel?: boolean;
  manualHotelNights?: number;
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
  selectedProvider: 'U-Haul' | 'Penske' | 'DTMM Truck';
  totalWeight?: number; // Total load weight in lbs
  numberOfMovers?: number; // Number of movers for loading/unloading
  loadHours?: number; // Calculated load hours
  unloadHours?: number; // Calculated unload hours
  trucksNeededFromWeight?: number; // Auto-calculated from weight (8000 lbs per truck)
  isWeightBased?: boolean; // Whether truck count is determined by weight
  isManualRental?: boolean; // Whether rental price is manually entered
  manualRentalPrice?: number; // Manual rental price per truck (overrides auto-calculation)
  
  // DTMM-specific fields
  dtmmDispatchLocation?: string; // Selected DTMM location
  dtmmDailyRate?: number; // Daily rate per truck (default $113)
  dtmmDays?: number; // Number of days for DTMM rental
  dtmmRoundTripMiles?: number; // Total round-trip miles
  dtmmRoundTripHours?: number; // Total round-trip hours
  hasExtraDriver?: boolean; // Whether extra driver is added
  extraDriverFee?: number; // Fee for extra driver (default $500)
  dtmmPrice?: number; // Manual DTMM price entry
}

export interface AdminRates {
  gasPricePerGallon: number; // e.g. 3.85
  mpg: number; // e.g. 7
  hotelRatePerNight: number; // e.g. 200
  driverPayPerMile: number; // e.g. 0.50
  laborRatePerHour: number; // e.g. 75 ($ per hour per person for loading/unloading)
  flightDefaultCost: number; // e.g. 300 (now per driver/truck)
  profitMarginPercent: number; // e.g. 30 (for 1.30)
  hoursPerDrivingDay: number; // e.g. 11 (max hours per driving day)
  
  // DTMM-specific rates
  dtmmDailyRate: number; // e.g. 113 ($ per day per truck)
  dtmmExtraDriverFee: number; // e.g. 500 (flat fee for extra driver)
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
  extraDriverCost?: number; // DTMM extra driver fee
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
