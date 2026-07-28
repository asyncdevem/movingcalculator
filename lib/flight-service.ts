/**
 * Flight Service - SerpAPI Google Flights Integration
 * Fetches real-time flight prices for return trips to MSP
 */

export interface AirportCode {
  code: string;
  name: string;
  city: string;
  state: string;
}

export interface FlightPrice {
  price: number;
  currency: string;
  airline?: string;
  duration?: string;
  stops?: number;
  departureTime?: string;
  arrivalTime?: string;
  isRealPrice: boolean;
  source: 'serpapi' | 'default';
}

// Major US Airport Codes (sorted by state)
export const US_AIRPORT_CODES: AirportCode[] = [
  // Minnesota
  { code: 'MSP', name: 'Minneapolis-St. Paul International', city: 'Minneapolis', state: 'MN' },
  
  // California
  { code: 'LAX', name: 'Los Angeles International', city: 'Los Angeles', state: 'CA' },
  { code: 'SFO', name: 'San Francisco International', city: 'San Francisco', state: 'CA' },
  { code: 'SAN', name: 'San Diego International', city: 'San Diego', state: 'CA' },
  { code: 'SJC', name: 'San Jose International', city: 'San Jose', state: 'CA' },
  { code: 'OAK', name: 'Oakland International', city: 'Oakland', state: 'CA' },
  { code: 'BUR', name: 'Hollywood Burbank', city: 'Burbank', state: 'CA' },
  { code: 'ONT', name: 'Ontario International', city: 'Ontario', state: 'CA' },
  { code: 'SMF', name: 'Sacramento International', city: 'Sacramento', state: 'CA' },
  
  // New York
  { code: 'JFK', name: 'John F. Kennedy International', city: 'New York', state: 'NY' },
  { code: 'LGA', name: 'LaGuardia', city: 'New York', state: 'NY' },
  { code: 'EWR', name: 'Newark Liberty International', city: 'Newark', state: 'NJ' },
  { code: 'BUF', name: 'Buffalo Niagara International', city: 'Buffalo', state: 'NY' },
  
  // Texas
  { code: 'DFW', name: 'Dallas/Fort Worth International', city: 'Dallas', state: 'TX' },
  { code: 'IAH', name: 'George Bush Intercontinental', city: 'Houston', state: 'TX' },
  { code: 'HOU', name: 'William P. Hobby', city: 'Houston', state: 'TX' },
  { code: 'AUS', name: 'Austin-Bergstrom International', city: 'Austin', state: 'TX' },
  { code: 'SAT', name: 'San Antonio International', city: 'San Antonio', state: 'TX' },
  { code: 'ELP', name: 'El Paso International', city: 'El Paso', state: 'TX' },
  
  // Florida
  { code: 'MIA', name: 'Miami International', city: 'Miami', state: 'FL' },
  { code: 'FLL', name: 'Fort Lauderdale-Hollywood International', city: 'Fort Lauderdale', state: 'FL' },
  { code: 'MCO', name: 'Orlando International', city: 'Orlando', state: 'FL' },
  { code: 'TPA', name: 'Tampa International', city: 'Tampa', state: 'FL' },
  { code: 'JAX', name: 'Jacksonville International', city: 'Jacksonville', state: 'FL' },
  
  // Illinois
  { code: 'ORD', name: "O'Hare International", city: 'Chicago', state: 'IL' },
  { code: 'MDW', name: 'Midway International', city: 'Chicago', state: 'IL' },
  
  // Georgia
  { code: 'ATL', name: 'Hartsfield-Jackson Atlanta International', city: 'Atlanta', state: 'GA' },
  
  // Washington
  { code: 'SEA', name: 'Seattle-Tacoma International', city: 'Seattle', state: 'WA' },
  
  // Arizona
  { code: 'PHX', name: 'Phoenix Sky Harbor International', city: 'Phoenix', state: 'AZ' },
  { code: 'TUS', name: 'Tucson International', city: 'Tucson', state: 'AZ' },
  
  // Nevada
  { code: 'LAS', name: 'Harry Reid International', city: 'Las Vegas', state: 'NV' },
  
  // Colorado
  { code: 'DEN', name: 'Denver International', city: 'Denver', state: 'CO' },
  
  // Oregon
  { code: 'PDX', name: 'Portland International', city: 'Portland', state: 'OR' },
  
  // Massachusetts
  { code: 'BOS', name: 'Logan International', city: 'Boston', state: 'MA' },
  
  // Pennsylvania
  { code: 'PHL', name: 'Philadelphia International', city: 'Philadelphia', state: 'PA' },
  { code: 'PIT', name: 'Pittsburgh International', city: 'Pittsburgh', state: 'PA' },
  
  // Michigan
  { code: 'DTW', name: 'Detroit Metropolitan Wayne County', city: 'Detroit', state: 'MI' },
  
  // North Carolina
  { code: 'CLT', name: 'Charlotte Douglas International', city: 'Charlotte', state: 'NC' },
  { code: 'RDU', name: 'Raleigh-Durham International', city: 'Raleigh', state: 'NC' },
  
  // Ohio
  { code: 'CVG', name: 'Cincinnati/Northern Kentucky International', city: 'Cincinnati', state: 'OH' },
  { code: 'CLE', name: 'Cleveland Hopkins International', city: 'Cleveland', state: 'OH' },
  { code: 'CMH', name: 'John Glenn Columbus International', city: 'Columbus', state: 'OH' },
  
  // Tennessee
  { code: 'BNA', name: 'Nashville International', city: 'Nashville', state: 'TN' },
  { code: 'MEM', name: 'Memphis International', city: 'Memphis', state: 'TN' },
  
  // Missouri
  { code: 'STL', name: 'St. Louis Lambert International', city: 'St. Louis', state: 'MO' },
  { code: 'MCI', name: 'Kansas City International', city: 'Kansas City', state: 'MO' },
  
  // Louisiana
  { code: 'MSY', name: 'Louis Armstrong New Orleans International', city: 'New Orleans', state: 'LA' },
  
  // Utah
  { code: 'SLC', name: 'Salt Lake City International', city: 'Salt Lake City', state: 'UT' },
  
  // Wisconsin
  { code: 'MKE', name: 'Milwaukee Mitchell International', city: 'Milwaukee', state: 'WI' },
];

/**
 * Find nearest airport to a city/address
 */
export function findNearestAirport(cityOrAddress: string): AirportCode | null {
  const search = cityOrAddress.toLowerCase();
  
  // Try exact city match first
  const exactMatch = US_AIRPORT_CODES.find(
    airport => airport.city.toLowerCase() === search || search.includes(airport.city.toLowerCase())
  );
  if (exactMatch) return exactMatch;
  
  // Try state match
  const stateMatch = US_AIRPORT_CODES.find(
    airport => search.includes(airport.state.toLowerCase())
  );
  if (stateMatch) return stateMatch;
  
  // Default to major hubs if no match
  return US_AIRPORT_CODES.find(a => a.code === 'LAX') || US_AIRPORT_CODES[0];
}

/**
 * Search airports by city, state, or code
 */
export function searchAirports(query: string): AirportCode[] {
  const search = query.toLowerCase();
  return US_AIRPORT_CODES.filter(
    airport =>
      airport.code.toLowerCase().includes(search) ||
      airport.city.toLowerCase().includes(search) ||
      airport.state.toLowerCase().includes(search) ||
      airport.name.toLowerCase().includes(search)
  ).slice(0, 10); // Limit to 10 results
}

/**
 * Fetch flight price from SerpAPI Google Flights
 */
export async function fetchFlightPrice(
  departureAirport: string,
  arrivalAirport: string = 'MSP',
  date: string
): Promise<FlightPrice> {
  try {
    const response = await fetch('/api/get-flight-price', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        departure: departureAirport,
        arrival: arrivalAirport,
        date: date,
      }),
    });

    const data = await response.json();

    if (data.success && data.price) {
      return {
        price: data.price,
        currency: data.currency || 'USD',
        airline: data.airline,
        duration: data.duration,
        stops: data.stops,
        departureTime: data.departureTime,
        arrivalTime: data.arrivalTime,
        isRealPrice: true,
        source: 'serpapi',
      };
    } else {
      throw new Error(data.message || 'Failed to fetch flight price');
    }
  } catch (error) {
    console.warn('Flight API error, using default price:', error);
    // Return default price on error
    return {
      price: 300,
      currency: 'USD',
      isRealPrice: false,
      source: 'default',
    };
  }
}
