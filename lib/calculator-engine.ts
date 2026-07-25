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
};

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
 * Driver limit: Max 11 Hours / Day.
 * Driving Days = Ceiling(Drive Hours / 11)
 * Hotel Nights = Driving Days - 1
 */
export function calculateLogisticsDays(driveHours: number): { drivingDays: number; hotelNights: number } {
  if (driveHours <= 0) return { drivingDays: 0, hotelNights: 0 };
  const drivingDays = Math.ceil(driveHours / 11);
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
 * Calculates complete quote breakdown using company formulas from PRD:
 * - Driver Pay = Distance * driverPayPerMile * TruckCount
 * - Fuel = (Distance / MPG) * GasPrice * TruckCount
 * - Hotel = HotelNights * HotelRate * TruckCount
 * - Labor = (Loading + Unloading) * TruckCount
 * - Flight = FlightCost (flat allowance)
 * - Truck Rental = Selected Provider Rate * TruckCount
 * - Subtotal = Sum of all above
 * - Profit Amount = Subtotal * (Margin % / 100)
 * - Grand Total = Subtotal + Profit Amount
 */
export function calculateQuoteBreakdown(
  route: RouteInfo,
  truck: TruckOption,
  rates: AdminRates
): QuoteBreakdown {
  const miles = Math.max(0, route.distanceMiles);
  const truckCount = Math.max(1, truck.count);
  const hotelNights = route.hotelNights;

  // 1. Employee Driving Pay
  const driverPay = Math.round(miles * rates.driverPayPerMile * truckCount);

  // 2. Fuel Calculation
  const fuelGallons = rates.mpg > 0 ? miles / rates.mpg : 0;
  const fuelCost = Math.round(fuelGallons * rates.gasPricePerGallon * truckCount);

  // 3. Hotel Calculation
  const hotelCost = Math.round(hotelNights * rates.hotelRatePerNight * truckCount);

  // 4. Labor
  const loadingCost = Math.round(rates.loadingCost * truckCount);
  const unloadingCost = Math.round(rates.unloadingCost * truckCount);
  const laborCost = loadingCost + unloadingCost;

  // 5. Flight Cost
  const flightCost = Math.round(rates.flightDefaultCost);

  // 6. Truck Rental Cost
  const perTruckRental = truck.selectedProvider === 'U-Haul' ? truck.uhaulRatePerTruck : truck.penskeRatePerTruck;
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
