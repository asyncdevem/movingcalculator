'use client';

import React, { useState, useEffect } from 'react';
import { Plane, Search, Loader2, DollarSign, Clock, AlertCircle } from 'lucide-react';
import { US_AIRPORT_CODES, searchAirports, findNearestAirport, fetchFlightPrice, AirportCode } from '@/lib/flight-service';

interface FlightPriceFetcherProps {
  deliveryAddress: string;
  moveDate: string;
  truckCount: number;
  onFlightPriceUpdate: (pricePerDriver: number, isRealPrice: boolean) => void;
}

export const FlightPriceFetcher: React.FC<FlightPriceFetcherProps> = ({
  deliveryAddress,
  moveDate,
  truckCount,
  onFlightPriceUpdate,
}) => {
  const [selectedAirport, setSelectedAirport] = useState<AirportCode | null>(null);
  const [airportSearch, setAirportSearch] = useState('');
  const [searchResults, setSearchResults] = useState<AirportCode[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [flightPrice, setFlightPrice] = useState<number | null>(null);
  const [flightDetails, setFlightDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Auto-detect airport from delivery address
  useEffect(() => {
    if (deliveryAddress && !selectedAirport) {
      const nearest = findNearestAirport(deliveryAddress);
      if (nearest) {
        setSelectedAirport(nearest);
        setAirportSearch(`${nearest.code} - ${nearest.city}, ${nearest.state}`);
      }
    }
  }, [deliveryAddress]);

  // Search airports as user types
  useEffect(() => {
    if (airportSearch.length >= 2) {
      const results = searchAirports(airportSearch);
      setSearchResults(results);
      setShowResults(true);
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
  }, [airportSearch]);

  const handleAirportSelect = (airport: AirportCode) => {
    setSelectedAirport(airport);
    setAirportSearch(`${airport.code} - ${airport.city}, ${airport.state}`);
    setShowResults(false);
    setFlightPrice(null);
    setFlightDetails(null);
  };

  const handleFetchPrice = async () => {
    if (!selectedAirport) {
      setError('Please select a departure airport');
      return;
    }

    if (!moveDate) {
      setError('Move date is required');
      return;
    }

    setIsFetching(true);
    setError(null);

    try {
      const result = await fetchFlightPrice(
        selectedAirport.code,
        'MSP', // Always return to MSP
        moveDate
      );

      setFlightPrice(result.price);
      setFlightDetails(result);
      onFlightPriceUpdate(result.price, result.isRealPrice);
      
    } catch (err) {
      setError('Failed to fetch flight price. Using default.');
      setFlightPrice(300);
      onFlightPriceUpdate(300, false);
    } finally {
      setIsFetching(false);
    }
  };

  return (
    <div className="bg-[#141419] p-6 sm:p-8 rounded-3xl border border-[#22222a] shadow-lg space-y-5">
      <div className="flex items-center justify-between border-b border-[#22222a] pb-4">
        <h2 className="text-sm font-black text-white flex items-center gap-2 uppercase tracking-wide">
          <Plane className="w-4 h-4 text-[#e62329]" />
          Return Flight Price (To MSP)
        </h2>
        {flightPrice && (
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${
            flightDetails?.isRealPrice 
              ? 'bg-green-900/30 text-green-400 border border-green-900/40' 
              : 'bg-zinc-800 text-zinc-400'
          }`}>
            {flightDetails?.isRealPrice ? 'Live Price' : 'Estimated'}
          </span>
        )}
      </div>

      <div className="space-y-4">
        {/* Airport Selection */}
        <div>
          <label className="block text-xs font-bold text-zinc-300 mb-1.5 uppercase">
            Departure Airport (Nearest to Delivery)
          </label>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-zinc-500" />
            <input
              type="text"
              value={airportSearch}
              onChange={(e) => setAirportSearch(e.target.value)}
              onFocus={() => airportSearch && setShowResults(true)}
              placeholder="Search by city, state, or code (e.g., LAX, Los Angeles)"
              className="w-full pl-10 pr-3.5 py-2.5 bg-[#0b0b0e] border border-[#22222a] rounded-xl text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-[#e62329]"
            />
            
            {/* Search Results Dropdown */}
            {showResults && searchResults.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-[#0b0b0e] border border-[#22222a] rounded-xl shadow-xl max-h-60 overflow-y-auto">
                {searchResults.map((airport) => (
                  <button
                    key={airport.code}
                    onClick={() => handleAirportSelect(airport)}
                    className="w-full px-4 py-3 text-left hover:bg-[#1f1f27] transition-colors border-b border-[#22222a] last:border-b-0"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-black text-[#e62329] text-sm">{airport.code}</span>
                        <span className="ml-2 text-xs text-white font-bold">{airport.city}, {airport.state}</span>
                      </div>
                    </div>
                    <div className="text-[10px] text-zinc-400 mt-0.5">{airport.name}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
          {selectedAirport && (
            <p className="text-[10px] text-zinc-400 mt-1">
              Selected: {selectedAirport.name} → MSP Minneapolis
            </p>
          )}
        </div>

        {/* Fetch Button */}
        <button
          onClick={handleFetchPrice}
          disabled={!selectedAirport || isFetching}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#e62329] hover:bg-[#cc1b21] text-white text-xs font-black rounded-xl shadow-md shadow-red-900/30 transition-all uppercase disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isFetching ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Fetching Live Price...</span>
            </>
          ) : (
            <>
              <DollarSign className="w-4 h-4" />
              <span>Get Real Flight Price</span>
            </>
          )}
        </button>

        {/* Error Display */}
        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-900/20 border border-red-900/40 rounded-xl">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-300">{error}</p>
          </div>
        )}

        {/* Flight Price Display */}
        {flightPrice && flightDetails && (
          <div className="p-4 bg-[#0b0b0e] rounded-2xl border border-[#22222a] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-300 uppercase">Flight Cost Per Driver</span>
              <span className="text-2xl font-black text-[#e62329]">
                ${flightPrice}
              </span>
            </div>

            {flightDetails.airline && (
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <Plane className="w-3.5 h-3.5" />
                <span>{flightDetails.airline}</span>
                {flightDetails.stops !== undefined && (
                  <span>• {flightDetails.stops === 0 ? 'Nonstop' : `${flightDetails.stops} stop${flightDetails.stops > 1 ? 's' : ''}`}</span>
                )}
              </div>
            )}

            {flightDetails.duration && (
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <Clock className="w-3.5 h-3.5" />
                <span>Flight Time: {flightDetails.duration}</span>
              </div>
            )}

            <div className="pt-3 border-t border-[#22222a]">
              <div className="flex items-center justify-between text-sm font-bold">
                <span className="text-zinc-300">Total for {truckCount} Driver{truckCount > 1 ? 's' : ''}</span>
                <span className="text-white">${(flightPrice * truckCount).toLocaleString()}</span>
              </div>
            </div>

            {!flightDetails.isRealPrice && (
              <p className="text-[10px] text-zinc-500 italic">
                Using default estimated price. Configure SerpAPI key for live prices.
              </p>
            )}
          </div>
        )}

        {/* Info Box */}
        <div className="p-3 bg-[#0b0b0e]/50 rounded-xl border border-[#22222a]">
          <p className="text-[11px] text-zinc-400">
            <span className="font-bold text-white">💡 How it works:</span> Each driver needs a return flight from the delivery destination back to MSP (Minneapolis). Select the nearest airport to your delivery address and fetch live prices.
          </p>
        </div>
      </div>
    </div>
  );
};
