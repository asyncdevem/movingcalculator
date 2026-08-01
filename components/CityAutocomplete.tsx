'use client';

import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Loader2 } from 'lucide-react';

interface CityAutocompleteProps {
  value: string;
  onChange: (address: string, lat?: number, lng?: number) => void;
  placeholder?: string;
  className?: string;
  label?: string;
  icon?: boolean;
  disabled?: boolean;
}

declare global {
  interface Window {
    google: any;
  }
}

/**
 * City Autocomplete Component using Google Maps Places API
 * Provides real-time city and address suggestions as user types
 */
export const CityAutocomplete: React.FC<CityAutocompleteProps> = ({
  value,
  onChange,
  placeholder = 'Search for a city or address...',
  className = '',
  label,
  icon = true,
  disabled = false,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [inputValue, setInputValue] = useState(value);

  // Load Google Maps Script if not already loaded
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkAndLoadMaps = () => {
      // Check if already loaded
      if (window.google && window.google.maps && window.google.maps.places) {
        setMapsLoaded(true);
        setIsLoading(false);
        return;
      }

      // Check if script exists but still loading
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existingScript) {
        const checkInterval = setInterval(() => {
          if (window.google && window.google.maps && window.google.maps.places) {
            setMapsLoaded(true);
            setIsLoading(false);
            clearInterval(checkInterval);
          }
        }, 100);
        return;
      }

      // Load the script
      setIsLoading(true);
      const script = document.createElement('script');
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async`;
      script.async = true;
      script.defer = true;

      script.onload = () => {
        setMapsLoaded(true);
        setIsLoading(false);
      };

      script.onerror = () => {
        console.error('Failed to load Google Maps script');
        setIsLoading(false);
      };

      document.head.appendChild(script);
    };

    checkAndLoadMaps();
  }, []);

  // Initialize autocomplete when maps is loaded and input is available
  useEffect(() => {
    if (!mapsLoaded || !inputRef.current || autocompleteRef.current) return;

    try {
      // Create autocomplete instance
      const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
        componentRestrictions: { country: 'us' }, // Restrict to US
        fields: ['formatted_address', 'geometry', 'name', 'address_components'],
        types: ['(cities)', 'locality', 'postal_code', 'administrative_area_level_1'], // Focus on cities
      });

      autocompleteRef.current = autocomplete;

      // Listen for place selection
      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();

        if (place.geometry && place.geometry.location) {
          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();
          const address = place.formatted_address || place.name || '';

          setInputValue(address);
          onChange(address, lat, lng);
        } else if (place.name) {
          // Fallback if geometry not available
          setInputValue(place.name);
          onChange(place.name);
        }
      });
    } catch (error) {
      console.error('Error initializing autocomplete:', error);
    }

    // Cleanup
    return () => {
      if (autocompleteRef.current) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
        autocompleteRef.current = null;
      }
    };
  }, [mapsLoaded, onChange]);

  // Update input value when prop value changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Handle manual input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    // Also update parent in case user types without selecting from dropdown
    onChange(newValue);
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-xs font-bold text-zinc-300 mb-1.5 uppercase">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <MapPin className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        )}
        {isLoading && (
          <Loader2 className="w-4 h-4 text-[#e62329] absolute right-3 top-1/2 -translate-y-1/2 animate-spin" />
        )}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          disabled={disabled || isLoading}
          className={`w-full ${icon ? 'pl-10' : 'pl-3.5'} ${
            isLoading ? 'pr-10' : 'pr-3.5'
          } py-2.5 bg-[#0b0b0e] border border-[#22222a] rounded-xl text-xs font-bold text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#e62329] disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        />
      </div>
      {!mapsLoaded && !isLoading && (
        <p className="text-[10px] text-yellow-500 mt-1">
          Google Maps autocomplete unavailable - you can still type addresses manually
        </p>
      )}
    </div>
  );
};
