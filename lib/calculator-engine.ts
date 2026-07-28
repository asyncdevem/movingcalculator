import { AdminRates, QuoteBreakdown, RouteInfo, TruckOption } from '@/types/calculator';

export const DEFAULT_ADMIN_RATES: AdminRates = {
  gasPricePerGallon: 3.85,
  mpg: 7,
  hotelRatePerNight: 200,
  driverPayPerMile: 0.50,
  loadingCost: 600,
  unloadingCost: 600,
  flightDefaultCost: 300,
  profitMarginPercent: 30, // 30% margin (1.30 multiplier)
  hoursPerDrivingDay: 11, // Max 11 hours driving per day
};

// Weight-based calculation constants
export const POUNDS_PER_TRUCK = 8000; // Max weight capacity per truck
export const POUNDS_PER_MOVER_PER_HOUR = 600; // Each mover can handle 600 lbs/hour
export const DEFAULT_MOVER_COUNT = 4; // Default number of movers

/**
 * Calculates number of trucks needed based on total weight.
 * Formula: CEILING(Weight / 8000)
 * Each truck can carry max 8,000 lbs
 */
export function calculateTrucksNeededFromWeight(weight: number): number {
  if (weight <= 0) return 1;
  return Math.ceil(weight / POUNDS_PER_TRUCK);
}

/**
 * Calculates loading and unloading hours based on weight and number of movers.
 * Formula: Weight / # of Movers / 600
 * Each mover can handle 600 lbs per hour
 */
export function calculateLoadUnloadHours(
  weight: number,
  numberOfMovers: number
): { loadHours: number; unloadHours: number; totalLaborHours: number } {
  if (weight <= 0 || numberOfMovers <= 0) {
    return { loadHours: 0, unloadHours: 0, totalLaborHours: 0 };
  }

  const hoursPerOperation = weight / numberOfMovers / POUNDS_PER_MOVER_PER_HOUR;
  const loadHours = Math.round(hoursPerOperation * 10) / 10; // Round to 1 decimal
  const unloadHours = Math.round(hoursPerOperation * 10) / 10;
  const totalLaborHours = Math.round((loadHours + unloadHours) * 10) / 10;

  return { loadHours, unloadHours, totalLaborHours };
}

// Preset popular long distance routes for instant lookup / testing
export const POPULAR_ROUTES: { pickup: string; delivery: string; miles: number; hours: number }[] = [
  { pickup: 'New York, NY', delivery: 'Miami, FL', miles: 1280, hours: 19.5 },
  { pickup: 'Los Angeles, CA', delivery: 'Dallas, TX', miles: 1435, hours: 21.0 },
  { pickup: 'Chicago, IL', delivery: 'Houston, TX', miles: 1084, hours: 16.5 },
  { pickup: 'Seattle, WA', delivery: 'Denver, CO', miles: 1305, hours: 19.8 },
  { pickup: 'Atlanta, GA', delivery: 'New York, NY', miles: 865, hours: 13.5 },
  { pickup: 'Dallas, TX', delivery: 'Atlanta, GA', miles: 780, hours: 11.8 },
  { pickup: 'San Francisco, CA', delivery: 'Seattle, WA', miles: 808, hours: 13.0 },
  { pickup: 'Boston, MA', delivery: 'Washington, DC', miles: 440, hours: 7.2 },
];

/**
 * Calculates driving days and required hotel nights.
 * Driver limit: Max hours per day (configurable, default 11)
 * Driving Days = Ceiling(Drive Hours / Hours Per Day)
 * Hotel Nights = Driving Days - 1
 */
export function calculateLogisticsDays(driveHours: number, hoursPerDay: number = 11): { drivingDays: number; hotelNights: number } {
  if (driveHours <= 0) return { drivingDays: 0, hotelNights: 0 };
  const drivingDays = Math.ceil(driveHours / hoursPerDay);
  const hotelNights = Math.max(0, drivingDays - 1);
  return { drivingDays, hotelNights };
}

/**
 * Simulates truck rental quotes from U-Haul and Penske based on route distance and days.
 * U-Haul base ~$2.20/mile + base fee
 * Penske base ~$2.10/mile + base fee + $50 day fee
 */
export function calculateTruckRates(miles: number, drivingDays: number): { uhaulRate: number; penskeRate: number; recommended: 'U-Haul' | 'Penske' } {
  if (miles <= 0) return { uhaulRate: 0, penskeRate: 0, recommended: 'U-Haul' };
  
  const uhaulBase = 350 + (miles * 1.95) + (drivingDays * 40);
  const penskeBase = 450 + (miles * 1.85) + (drivingDays * 35);
  
  const uhaulRate = Math.round(uhaulBase);
  const penskeRate = Math.round(penskeBase);
  const recommended = uhaulRate <= penskeRate ? 'U-Haul' : 'Penske';

  return { uhaulRate, penskeRate, recommended };
}

/**
 * Calculates complete quote breakdown using company formulas:
 * - Driver Pay = Distance * driverPayPerMile * TruckCount
 * - Fuel = (Distance / MPG) * GasPrice * TruckCount
 * - Hotel = HotelNights * HotelRate * TruckCount (per truck!)
 * - Labor = (Loading + Unloading OR HiredHelp) * TruckCount
 * - Flight = FlightCost * TruckCount (per driver/truck!)
 * - Truck Rental = (Manual Price OR Auto Rate) * TruckCount
 * - Subtotal = Sum of all above
 * - Profit Amount = Subtotal * (Margin % / 100)
 * - Grand Total = Subtotal + Profit Amount
 */
export function calculateQuoteBreakdown(
  route: RouteInfo,
  truck: TruckOption,
  rates: AdminRates,
  hiredHelpCost?: number,
  useHiredHelp?: boolean
): QuoteBreakdown {
  const miles = Math.max(0, route.distanceMiles);
  const truckCount = Math.max(1, truck.count);
  const hotelNights = route.hotelNights;

  // 1. Employee Driving Pay
  const driverPay = Math.round(miles * rates.driverPayPerMile * truckCount);

  // 2. Fuel Calculation
  const fuelGallons = rates.mpg > 0 ? miles / rates.mpg : 0;
  const fuelCost = Math.round(fuelGallons * rates.gasPricePerGallon * truckCount);

  // 3. Hotel Calculation (PER TRUCK - each truck needs driver accommodations)
  const hotelCost = Math.round(hotelNights * rates.hotelRatePerNight * truckCount);

  // 4. Labor (with hired help option)
  const loadingCost = Math.round(rates.loadingCost * truckCount);
  let unloadingCost: number;
  let laborCost: number;

  if (useHiredHelp && hiredHelpCost !== undefined) {
    // Use hired help for unloading instead of company labor
    unloadingCost = 0; // Company doesn't do unloading
    const hiredHelp = Math.round(hiredHelpCost);
    laborCost = loadingCost + hiredHelp;
  } else {
    // Standard company loading and unloading
    unloadingCost = Math.round(rates.unloadingCost * truckCount);
    laborCost = loadingCost + unloadingCost;
  }

  // 5. Flight Cost (PER DRIVER/TRUCK - each driver needs return flight)
  const flightCost = Math.round(rates.flightDefaultCost * truckCount);

  // 6. Truck Rental Cost (Manual Override OR Auto-Calculated)
  let perTruckRental: number;
  
  if (truck.isManualRental && truck.manualRentalPrice !== undefined) {
    // Use manually entered price
    perTruckRental = truck.manualRentalPrice;
  } else {
    // Use auto-calculated price from provider
    perTruckRental = truck.selectedProvider === 'U-Haul' ? truck.uhaulRatePerTruck : truck.penskeRatePerTruck;
  }
  
  const truckRentalCost = Math.round(perTruckRental * truckCount);

  // 7. Subtotal
  const subtotal = driverPay + fuelCost + hotelCost + laborCost + flightCost + truckRentalCost;

  // 8. Profit & Grand Total
  const profitAmount = Math.round(subtotal * (rates.profitMarginPercent / 100));
  const grandTotal = subtotal + profitAmount;

  return {
    driverPay,
    fuelCost,
    hotelCost,
    laborCost,
    loadingCost,
    unloadingCost,
    hiredHelpCost: useHiredHelp ? hiredHelpCost : undefined,
    useHiredHelp,
    flightCost,
    truckRentalCost,
    subtotal,
    profitAmount,
    grandTotal,
  };
}

/**
 * Extracts pickup/delivery location names from a pasted Google Maps URL.
 */
export function parseGoogleMapsUrl(url: string): { pickup?: string; delivery?: string } | null {
  try {
    if (!url || !url.includes('google.com/maps')) return null;
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    
    // Pattern: /maps/dir/Pickup+Address/Delivery+Address/
    if (pathname.includes('/dir/')) {
      const parts = pathname.split('/dir/')[1].split('/');
      if (parts.length >= 2) {
        const pickup = decodeURIComponent(parts[0].replace(/\+/g, ' '));
        const delivery = decodeURIComponent(parts[1].replace(/\+/g, ' '));
        if (pickup && delivery) {
          return { pickup, delivery };
        }
      }
    }
  } catch (e) {
    console.warn('Could not parse maps URL', e);
  }
  return null;
}

/**
 * Estimates distance and duration between 2 locations if not in presets.
 */
export function estimateRouteDistance(pickup: string, delivery: string): { miles: number; hours: number } {
  const pLower = pickup.toLowerCase();
  const dLower = delivery.toLowerCase();

  const found = POPULAR_ROUTES.find(
    (r) =>
      (r.pickup.toLowerCase().includes(pLower) || pLower.includes(r.pickup.toLowerCase())) &&
      (r.delivery.toLowerCase().includes(dLower) || dLower.includes(r.delivery.toLowerCase()))
  );

  if (found) {
    return { miles: found.miles, hours: found.hours };
  }

  // Hash-based deterministic estimation for custom addresses
  const combine = pickup + '->' + delivery;
  let hash = 0;
  for (let i = 0; i < combine.length; i++) {
    hash = (hash << 5) - hash + combine.charCodeAt(i);
    hash |= 0;
  }
  const miles = 350 + (Math.abs(hash) % 1850);
  const hours = parseFloat((miles / 55).toFixed(1));

  return { miles, hours };
}
