import { NextRequest, NextResponse } from 'next/server';

/**
 * Server-side API route for SerpAPI Google Flights
 * Fetches real-time one-way flight prices securely
 * 
 * Documentation: https://serpapi.com/google-flights-api
 */

interface SerpAPIFlight {
  price?: number;
  total_duration?: number;
  flights?: Array<{
    airline?: string;
    flight_number?: string;
    departure_airport?: {
      name?: string;
      id?: string;
      time?: string;
    };
    arrival_airport?: {
      name?: string;
      id?: string;
      time?: string;
    };
    duration?: number;
  }>;
}

interface SerpAPIResponse {
  search_metadata?: {
    status?: string;
    id?: string;
  };
  best_flights?: SerpAPIFlight[];
  other_flights?: SerpAPIFlight[];
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { departure, arrival, date } = await request.json();

    if (!departure || !arrival || !date) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters: departure, arrival, date' },
        { status: 400 }
      );
    }

    const apiKey = process.env.SERPAPI_KEY;

    if (!apiKey || apiKey === 'YOUR_SERPAPI_KEY_HERE') {
      // Return default if no API key
      return NextResponse.json({
        success: false,
        message: 'SerpAPI key not configured. Using default price.',
        price: 300,
        currency: 'USD',
        isRealPrice: false,
      });
    }

    // Build SerpAPI URL with proper parameters
    const params = new URLSearchParams({
      engine: 'google_flights',
      departure_id: departure.toUpperCase(), // Airport codes must be uppercase
      arrival_id: arrival.toUpperCase(),     // Airport codes must be uppercase
      outbound_date: date,                   // Format: YYYY-MM-DD
      currency: 'USD',
      type: '2',                             // 2 = One-way flight
      hl: 'en',                              // Language: English
      gl: 'us',                              // Country: United States
      api_key: apiKey,
    });

    const serpApiUrl = `https://serpapi.com/search?${params.toString()}`;

    console.log(`Fetching flight price: ${departure} → ${arrival} on ${date}`);
    
    const response = await fetch(serpApiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`SerpAPI HTTP error: ${response.status} ${response.statusText}`);
    }

    const data: SerpAPIResponse = await response.json();

    // Check for API errors
    if (data.error) {
      console.error('SerpAPI error:', data.error);
      return NextResponse.json({
        success: false,
        message: `SerpAPI error: ${data.error}`,
        price: 300,
        currency: 'USD',
        isRealPrice: false,
      });
    }

    // Parse best_flights first (recommended flights)
    if (data.best_flights && data.best_flights.length > 0) {
      const bestFlight = data.best_flights[0];
      const firstSegment = bestFlight.flights?.[0];
      const lastSegment = bestFlight.flights?.[bestFlight.flights.length - 1];
      
      return NextResponse.json({
        success: true,
        price: bestFlight.price || 300,
        currency: 'USD',
        airline: firstSegment?.airline || undefined,
        flightNumber: firstSegment?.flight_number || undefined,
        duration: bestFlight.total_duration ? formatDuration(bestFlight.total_duration) : undefined,
        stops: (bestFlight.flights?.length || 1) - 1, // Number of stops = segments - 1
        departureTime: firstSegment?.departure_airport?.time || undefined,
        arrivalTime: lastSegment?.arrival_airport?.time || undefined,
        departureAirport: firstSegment?.departure_airport?.name || departure,
        arrivalAirport: lastSegment?.arrival_airport?.name || arrival,
        isRealPrice: true,
        source: 'serpapi',
      });
    } 
    
    // Fallback to other_flights if no best_flights
    else if (data.other_flights && data.other_flights.length > 0) {
      const flight = data.other_flights[0];
      const firstSegment = flight.flights?.[0];
      const lastSegment = flight.flights?.[flight.flights.length - 1];
      
      return NextResponse.json({
        success: true,
        price: flight.price || 300,
        currency: 'USD',
        airline: firstSegment?.airline || undefined,
        flightNumber: firstSegment?.flight_number || undefined,
        duration: flight.total_duration ? formatDuration(flight.total_duration) : undefined,
        stops: (flight.flights?.length || 1) - 1,
        departureTime: firstSegment?.departure_airport?.time || undefined,
        arrivalTime: lastSegment?.arrival_airport?.time || undefined,
        departureAirport: firstSegment?.departure_airport?.name || departure,
        arrivalAirport: lastSegment?.arrival_airport?.name || arrival,
        isRealPrice: true,
        source: 'serpapi',
      });
    } 
    
    // No flights found
    else {
      console.warn('No flights found in SerpAPI response');
      return NextResponse.json({
        success: false,
        message: `No flights found for ${departure} → ${arrival} on ${date}`,
        price: 300,
        currency: 'USD',
        isRealPrice: false,
      });
    }
  } catch (error) {
    console.error('Flight price fetch error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch flight price',
      message: error instanceof Error ? error.message : 'Unknown error',
      price: 300,
      currency: 'USD',
      isRealPrice: false,
    }, { status: 500 });
  }
}

/**
 * Format duration from minutes to human-readable string
 */
function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 0) {
    return `${mins}m`;
  } else if (mins === 0) {
    return `${hours}h`;
  } else {
    return `${hours}h ${mins}m`;
  }
}
