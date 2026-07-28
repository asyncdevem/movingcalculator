'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, Loader2, X } from 'lucide-react';

interface GoogleMapsSelectorProps {
  pickupAddress: string;
  deliveryAddress: string;
  onPickupChange: (address: string, lat?: number, lng?: number) => void;
  onDeliveryChange: (address: string, lat?: number, lng?: number) => void;
  onRouteCalculated?: (distance: number, duration: number) => void;
}

declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

export const GoogleMapsSelector: React.FC<GoogleMapsSelectorProps> = ({
  pickupAddress,
  deliveryAddress,
  onPickupChange,
  onDeliveryChange,
  onRouteCalculated,
}) => {
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectingType, setSelectingType] = useState<'pickup' | 'delivery'>('pickup');
  const [error, setError] = useState<string>('');

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const pickupMarkerRef = useRef<any>(null);
  const deliveryMarkerRef = useRef<any>(null);
  const directionsRendererRef = useRef<any>(null);
  const geocoderRef = useRef<any>(null);
  const pickupAutocompleteRef = useRef<any>(null);
  const deliveryAutocompleteRef = useRef<any>(null);

  const pickupInputRef = useRef<HTMLInputElement>(null);
  const deliveryInputRef = useRef<HTMLInputElement>(null);

  // Load Google Maps Script
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const loadGoogleMaps = async () => {
      // Check if script already exists
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      
      if (window.google && window.google.maps) {
        setMapLoaded(true);
        setIsLoading(false);
        return;
      }

      if (existingScript) {
        // Script is loading, wait for it
        const checkLoaded = setInterval(() => {
          if (window.google && window.google.maps) {
            setMapLoaded(true);
            setIsLoading(false);
            clearInterval(checkLoaded);
          }
        }, 100);
        return;
      }

      setIsLoading(true);
      try {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}&libraries=places,geometry&loading=async`;
        script.async = true;
        script.defer = true;

        script.onload = () => {
          setMapLoaded(true);
          setIsLoading(false);
        };

        script.onerror = () => {
          setError('Failed to load Google Maps. Please check your API key.');
          setIsLoading(false);
        };

        document.head.appendChild(script);
      } catch (err) {
        setError('Error loading Google Maps');
        setIsLoading(false);
      }
    };

    loadGoogleMaps();
  }, []);

  // Initialize Map
  useEffect(() => {
    if (!mapLoaded || !isMapOpen || !mapRef.current || mapInstanceRef.current) return;

    const initializeMap = () => {
      try {
        // Create map centered on USA
        const map = new window.google.maps.Map(mapRef.current, {
          center: { lat: 39.8283, lng: -98.5795 }, // Center of USA
          zoom: 4,
          mapTypeControl: true,
          streetViewControl: false,
          fullscreenControl: true,
        });

        mapInstanceRef.current = map;
        geocoderRef.current = new window.google.maps.Geocoder();
        directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
          map: map,
          suppressMarkers: false,
        });

        // Setup autocomplete for inputs
        if (pickupInputRef.current) {
          pickupAutocompleteRef.current = new window.google.maps.places.Autocomplete(
            pickupInputRef.current,
            {
              componentRestrictions: { country: 'us' },
              fields: ['formatted_address', 'geometry', 'name'],
            }
          );

          pickupAutocompleteRef.current.addListener('place_changed', () => {
            const place = pickupAutocompleteRef.current.getPlace();
            if (place.geometry) {
              handleLocationSelect(
                place.formatted_address || place.name,
                place.geometry.location.lat(),
                place.geometry.location.lng(),
                'pickup'
              );
            }
          });
        }

        if (deliveryInputRef.current) {
          deliveryAutocompleteRef.current = new window.google.maps.places.Autocomplete(
            deliveryInputRef.current,
            {
              componentRestrictions: { country: 'us' },
              fields: ['formatted_address', 'geometry', 'name'],
            }
          );

          deliveryAutocompleteRef.current.addListener('place_changed', () => {
            const place = deliveryAutocompleteRef.current.getPlace();
            if (place.geometry) {
              handleLocationSelect(
                place.formatted_address || place.name,
                place.geometry.location.lat(),
                place.geometry.location.lng(),
                'delivery'
              );
            }
          });
        }

        // Click on map to set location
        map.addListener('click', (e: any) => {
          const lat = e.latLng.lat();
          const lng = e.latLng.lng();
          reverseGeocode(lat, lng, selectingType);
        });

        // Initialize with existing addresses if available
        if (pickupAddress) {
          geocodeAddress(pickupAddress, 'pickup');
        }
        if (deliveryAddress) {
          geocodeAddress(deliveryAddress, 'delivery');
        }
      } catch (err) {
        console.error('Map initialization error:', err);
        setError('Failed to initialize map');
      }
    };

    initializeMap();
  }, [mapLoaded, isMapOpen]);

  const reverseGeocode = (lat: number, lng: number, type: 'pickup' | 'delivery') => {
    if (!geocoderRef.current) return;

    geocoderRef.current.geocode(
      { location: { lat, lng } },
      (results: any[], status: string) => {
        if (status === 'OK' && results[0]) {
          handleLocationSelect(results[0].formatted_address, lat, lng, type);
        }
      }
    );
  };

  const geocodeAddress = (address: string, type: 'pickup' | 'delivery') => {
    if (!geocoderRef.current || !address) return;

    geocoderRef.current.geocode({ address }, (results: any[], status: string) => {
      if (status === 'OK' && results[0]) {
        const location = results[0].geometry.location;
        handleLocationSelect(
          results[0].formatted_address,
          location.lat(),
          location.lng(),
          type
        );
      }
    });
  };

  const handleLocationSelect = (
    address: string,
    lat: number,
    lng: number,
    type: 'pickup' | 'delivery'
  ) => {
    if (!mapInstanceRef.current) return;

    const position = { lat, lng };

    if (type === 'pickup') {
      // Remove old marker
      if (pickupMarkerRef.current) {
        pickupMarkerRef.current.setMap(null);
      }

      // Create new marker
      pickupMarkerRef.current = new window.google.maps.Marker({
        position,
        map: mapInstanceRef.current,
        title: 'Pickup Location',
        label: 'P',
        icon: {
          url: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
        },
      });

      onPickupChange(address, lat, lng);
    } else {
      // Remove old marker
      if (deliveryMarkerRef.current) {
        deliveryMarkerRef.current.setMap(null);
      }

      // Create new marker
      deliveryMarkerRef.current = new window.google.maps.Marker({
        position,
        map: mapInstanceRef.current,
        title: 'Delivery Location',
        label: 'D',
        icon: {
          url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
        },
      });

      onDeliveryChange(address, lat, lng);
    }

    // If both markers exist, calculate route
    if (pickupMarkerRef.current && deliveryMarkerRef.current) {
      calculateAndDisplayRoute();
    }

    // Center map on new marker
    mapInstanceRef.current.panTo(position);
  };

  const calculateAndDisplayRoute = () => {
    if (!pickupMarkerRef.current || !deliveryMarkerRef.current) return;

    const directionsService = new window.google.maps.DirectionsService();

    directionsService.route(
      {
        origin: pickupMarkerRef.current.getPosition(),
        destination: deliveryMarkerRef.current.getPosition(),
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result: any, status: string) => {
        if (status === 'OK' && result.routes[0]) {
          directionsRendererRef.current.setDirections(result);

          const route = result.routes[0];
          const leg = route.legs[0];

          // Extract distance and duration
          const distanceMiles = Math.round((leg.distance.value / 1609.34) * 10) / 10;
          const durationHours = Math.round((leg.duration.value / 3600) * 10) / 10;

          if (onRouteCalculated) {
            onRouteCalculated(distanceMiles, durationHours);
          }
        }
      }
    );
  };

  const handleOpenMap = () => {
    setIsMapOpen(true);
  };

  const handleCloseMap = () => {
    setIsMapOpen(false);
  };

  if (!isMapOpen) {
    return (
      <button
        type="button"
        onClick={handleOpenMap}
        disabled={isLoading}
        className="flex items-center gap-2 px-4 py-2 bg-[#e62329] hover:bg-[#cc1b21] text-white text-xs font-black rounded-xl shadow-md shadow-red-900/30 transition-all uppercase"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Loading Maps...</span>
          </>
        ) : (
          <>
            <Navigation className="w-4 h-4" />
            <span>Open Map Selector</span>
          </>
        )}
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-[#141419] rounded-3xl border border-[#22222a] shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#22222a]">
          <div>
            <h2 className="text-lg font-black text-white uppercase flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[#e62329]" />
              Select Pickup & Delivery Locations
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              Click on the map or use the search boxes to set locations
            </p>
          </div>
          <button
            onClick={handleCloseMap}
            className="p-2 hover:bg-[#1f1f27] rounded-xl transition-colors"
          >
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        {/* Address Input Fields */}
        <div className="p-6 border-b border-[#22222a] space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1.5 uppercase">
                Pickup Address
              </label>
              <div className="relative">
                <input
                  ref={pickupInputRef}
                  type="text"
                  defaultValue={pickupAddress}
                  placeholder="Search pickup location..."
                  onFocus={() => setSelectingType('pickup')}
                  className="w-full px-3.5 py-2.5 pl-10 bg-[#0b0b0e] border-2 border-green-600 rounded-xl text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <MapPin className="w-4 h-4 text-green-500 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1.5 uppercase">
                Delivery Address
              </label>
              <div className="relative">
                <input
                  ref={deliveryInputRef}
                  type="text"
                  defaultValue={deliveryAddress}
                  placeholder="Search delivery location..."
                  onFocus={() => setSelectingType('delivery')}
                  className="w-full px-3.5 py-2.5 pl-10 bg-[#0b0b0e] border-2 border-[#e62329] rounded-xl text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-[#e62329]"
                />
                <MapPin className="w-4 h-4 text-[#e62329] absolute left-3 top-3" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-zinc-400">Currently selecting:</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSelectingType('pickup')}
                className={`px-3 py-1 rounded-lg font-bold uppercase transition-all ${
                  selectingType === 'pickup'
                    ? 'bg-green-600 text-white'
                    : 'bg-[#0b0b0e] text-zinc-400 hover:bg-[#1f1f27]'
                }`}
              >
                <MapPin className="w-3 h-3 inline mr-1" />
                Pickup
              </button>
              <button
                type="button"
                onClick={() => setSelectingType('delivery')}
                className={`px-3 py-1 rounded-lg font-bold uppercase transition-all ${
                  selectingType === 'delivery'
                    ? 'bg-[#e62329] text-white'
                    : 'bg-[#0b0b0e] text-zinc-400 hover:bg-[#1f1f27]'
                }`}
              >
                <MapPin className="w-3 h-3 inline mr-1" />
                Delivery
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-900/20 border border-red-900/40 rounded-xl text-xs text-red-400">
              {error}
            </div>
          )}
        </div>

        {/* Map Container */}
        <div className="flex-1 min-h-0 p-6">
          <div
            ref={mapRef}
            className="w-full h-full rounded-2xl border-2 border-[#22222a] overflow-hidden"
            style={{ minHeight: '400px' }}
          />
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[#22222a] flex justify-end gap-3">
          <button
            onClick={handleCloseMap}
            className="px-6 py-2.5 bg-[#e62329] hover:bg-[#cc1b21] text-white text-xs font-black rounded-xl shadow-md shadow-red-900/30 transition-all uppercase"
          >
            Done - Use Selected Locations
          </button>
        </div>
      </div>
    </div>
  );
};
