import { NextRequest, NextResponse } from 'next/server';

/**
 * Server-side API route for Google Maps Distance Matrix API
 * This keeps the API key secure on the server side
 */
export async function POST(request: NextRequest) {
  try {
    const { pickup, delivery } = await request.json();

    if (!pickup || !delivery) {
      return NextResponse.json(
        { error: 'Missing pickup or delivery address' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    if (!apiKey || apiKey === 'YOUR_GOOGLE_MAPS_API_KEY_HERE') {
      // Return fallback calculation if no API key configured
      return NextResponse.json({
        success: false,
        isRealApi: false,
        message: 'Google Maps API key not configured',
      });
    }

    // Use Google Maps Directions API
    const directionsUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(
      pickup
    )}&destination=${encodeURIComponent(delivery)}&key=${apiKey}`;

    const response = await fetch(directionsUrl);
    const data = await response.json();

    if (data.status === 'OK' && data.routes && data.routes[0] && data.routes[0].legs[0]) {
      const leg = data.routes[0].legs[0];
      const distanceMeters = leg.distance.value;
      const durationSeconds = leg.duration.value;

      const distanceMiles = Math.round((distanceMeters / 1609.34) * 10) / 10;
      const durationHours = Math.round((durationSeconds / 3600) * 10) / 10;

      return NextResponse.json({
        success: true,
        isRealApi: true,
        pickupAddress: leg.start_address || pickup,
        deliveryAddress: leg.end_address || delivery,
        distanceMiles,
        durationHours,
        distanceMeters,
        durationSeconds,
      });
    } else {
      return NextResponse.json({
        success: false,
        isRealApi: false,
        error: `Google Maps API error: ${data.status}`,
        message: data.error_message || 'Route calculation failed',
      });
    }
  } catch (error) {
    console.error('Route calculation error:', error);
    return NextResponse.json(
      {
        success: false,
        isRealApi: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
