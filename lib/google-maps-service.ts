/**
 * Route & Distance Calculation Service using Directions & Distance Matrix APIs.
 * Calculates exact driving distance (miles) and drive duration (hours).
 */

export interface CalculatedRouteResult {
  pickupAddress: string;
  deliveryAddress: string;
  distanceMiles: number;
  durationHours: number;
  isRealApi: boolean;
}

let googleScriptLoadingPromise: Promise<boolean> | null = null;

/**
 * Loads the Maps API script dynamically into the document if an API key is provided.
 */
export function loadMapsSdk(apiKey?: string): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false);
  
  if ((window as any).google && (window as any).google.maps) {
    return Promise.resolve(true);
  }

  if (googleScriptLoadingPromise) {
    return googleScriptLoadingPromise;
  }

  googleScriptLoadingPromise = new Promise((resolve) => {
    if (!apiKey) {
      resolve(false);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      resolve(true);
    };
    script.onerror = () => {
      resolve(false);
    };
    document.head.appendChild(script);
  });

  return googleScriptLoadingPromise;
}

/**
 * Calculates exact driving distance and time using client-side DirectionsService or REST API fallback.
 */
export async function calculateRouteDistance(
  pickup: string,
  delivery: string,
  apiKey?: string
): Promise<CalculatedRouteResult> {
  if (!pickup || !delivery) {
    return {
      pickupAddress: pickup,
      deliveryAddress: delivery,
      distanceMiles: 0,
      durationHours: 0,
      isRealApi: false,
    };
  }

  // 1. Try client-side Google Maps DirectionsService if SDK loaded
  if (typeof window !== 'undefined' && (window as any).google && (window as any).google.maps) {
    try {
      const directionsService = new (window as any).google.maps.DirectionsService();
      const response = await new Promise<any>((resolve, reject) => {
        directionsService.route(
          {
            origin: pickup,
            destination: delivery,
            travelMode: (window as any).google.maps.TravelMode.DRIVING,
          },
          (result: any, status: any) => {
            if (status === 'OK' && result.routes && result.routes[0]) {
              resolve(result.routes[0]);
            } else {
              reject(status);
            }
          }
        );
      });

      if (response && response.legs && response.legs[0]) {
        const leg = response.legs[0];
        const meters = leg.distance.value;
        const seconds = leg.duration.value;
        const miles = Math.round((meters / 1609.34) * 10) / 10;
        const hours = Math.round((seconds / 3600) * 10) / 10;

        return {
          pickupAddress: leg.start_address || pickup,
          deliveryAddress: leg.end_address || delivery,
          distanceMiles: miles,
          durationHours: hours,
          isRealApi: true,
        };
      }
    } catch (e) {
      console.warn('SDK directions service error, falling back', e);
    }
  }

  // 2. Try server-side/REST API fetch if apiKey present
  if (apiKey && !apiKey.includes('sample_')) {
    try {
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(
        pickup
      )}&destination=${encodeURIComponent(delivery)}&key=${apiKey}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.status === 'OK' && data.routes && data.routes[0] && data.routes[0].legs[0]) {
        const leg = data.routes[0].legs[0];
        const miles = Math.round((leg.distance.value / 1609.34) * 10) / 10;
        const hours = Math.round((leg.duration.value / 3600) * 10) / 10;

        return {
          pickupAddress: leg.start_address || pickup,
          deliveryAddress: leg.end_address || delivery,
          distanceMiles: miles,
          durationHours: hours,
          isRealApi: true,
        };
      }
    } catch (err) {
      console.warn('REST API directions fetch error', err);
    }
  }

  // 3. Fallback deterministic estimation lookup
  const pickupLower = pickup.toLowerCase();
  const deliveryLower = delivery.toLowerCase();

  // Known distances lookup for quick demo calculation
  const knownPresets = [
    { p: 'new york', d: 'miami', m: 1280, h: 19.5 },
    { p: 'los angeles', d: 'dallas', m: 1435, h: 21.0 },
    { p: 'chicago', d: 'houston', m: 1084, h: 16.5 },
    { p: 'seattle', d: 'denver', m: 1305, h: 19.8 },
    { p: 'atlanta', d: 'new york', m: 865, h: 13.5 },
    { p: 'dallas', d: 'atlanta', m: 780, h: 11.8 },
    { p: 'san francisco', d: 'seattle', m: 808, h: 13.0 },
    { p: 'boston', d: 'washington', m: 440, h: 7.2 },
  ];

  const presetMatch = knownPresets.find(
    (k) =>
      (pickupLower.includes(k.p) || k.p.includes(pickupLower)) &&
      (deliveryLower.includes(k.d) || k.d.includes(deliveryLower))
  );

  if (presetMatch) {
    return {
      pickupAddress: pickup,
      deliveryAddress: delivery,
      distanceMiles: presetMatch.m,
      durationHours: presetMatch.h,
      isRealApi: false,
    };
  }

  // Hash-based deterministic distance calculation
  const combine = pickup + '->' + delivery;
  let hash = 0;
  for (let i = 0; i < combine.length; i++) {
    hash = (hash << 5) - hash + combine.charCodeAt(i);
    hash |= 0;
  }
  const distanceMiles = 350 + (Math.abs(hash) % 1850);
  const durationHours = parseFloat((distanceMiles / 55).toFixed(1));

  return {
    pickupAddress: pickup,
    deliveryAddress: delivery,
    distanceMiles,
    durationHours,
    isRealApi: false,
  };
}

/**
 * Parses pasted directions URLs to extract pickup & delivery location strings.
 */
export function parseRouteUrl(url: string): { pickup?: string; delivery?: string } | null {
  try {
    if (!url || (!url.includes('/maps/') && !url.includes('dir/'))) return null;
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;

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
    console.warn('Could not parse route URL', e);
  }
  return null;
}
