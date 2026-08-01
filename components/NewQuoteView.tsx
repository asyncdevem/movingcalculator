'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { TruckOption, TruckType, RouteInfo, CustomerInfo } from '@/types/calculator';
import {
  calculateLogisticsDays,
  calculateTruckRates,
  calculateQuoteBreakdown,
  POPULAR_ROUTES,
  DTMM_DISPATCH_LOCATIONS,
} from '@/lib/calculator-engine';
import {
  calculateRouteDistance,
  parseRouteUrl,
  calculateRoundTripRoute,
} from '@/lib/google-maps-service';
import { GoogleMapsSelector } from '@/components/GoogleMapsSelector';
import { WeightCalculator } from '@/components/WeightCalculator';
import { FlightPriceFetcher } from '@/components/FlightPriceFetcher';
import { CityAutocomplete } from '@/components/CityAutocomplete';
import {
  MapPin,
  Truck,
  Calculator,
  User,
  Link,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Printer,
  Copy,
  Save,
  RotateCcw,
  Clock,
  Bed,
  Fuel,
  Users,
  Plane,
  Loader2,
  CheckCircle2,
} from 'lucide-react';

export const NewQuoteView: React.FC = () => {
  const { adminRates, saveQuote, setActiveQuoteForPrint, showNotification } = useApp();

  // 1. Route state
  const [pickupAddress, setPickupAddress] = useState<string>('New York, NY');
  const [deliveryAddress, setDeliveryAddress] = useState<string>('Miami, FL');
  const [mapsUrlInput, setMapsUrlInput] = useState<string>('');
  const [distanceMiles, setDistanceMiles] = useState<number>(1280);
  const [durationHours, setDurationHours] = useState<number>(19.5);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState<boolean>(false);
  const [isRealApiActive, setIsRealApiActive] = useState<boolean>(false);

  // 2. Customer state
  const [customerName, setCustomerName] = useState<string>('Robert Davis');
  const [customerPhone, setCustomerPhone] = useState<string>('(555) 234-5678');
  const [customerEmail, setCustomerEmail] = useState<string>('robert.davis@example.com');
  const [moveDate, setMoveDate] = useState<string>('2026-08-15');
  const [notes, setNotes] = useState<string>('3-bedroom house move. Requires loading & unloading labor.');

  // 3. Truck options state
  const [truckType, setTruckType] = useState<TruckType>('26 ft Box Truck');
  const [truckCount, setTruckCount] = useState<number>(1);
  
  // 3a. Manual rental prices (no auto-calculation)
  const [uhaulPrice, setUhaulPrice] = useState<number>(0);
  const [penskePrice, setPenskePrice] = useState<number>(0);
  const [selectedProvider, setSelectedProvider] = useState<'U-Haul' | 'Penske' | 'DTMM Truck'>('U-Haul');

  // 3a-dtmm. DTMM-specific state
  const [dtmmDispatchLocation, setDtmmDispatchLocation] = useState<string>(DTMM_DISPATCH_LOCATIONS[0].address);
  const [dtmmDays, setDtmmDays] = useState<number>(1);
  const [dtmmRoundTripMiles, setDtmmRoundTripMiles] = useState<number>(0);
  const [dtmmRoundTripHours, setDtmmRoundTripHours] = useState<number>(0);
  const [hasExtraDriver, setHasExtraDriver] = useState<boolean>(false);
  const [isManualHotel, setIsManualHotel] = useState<boolean>(false);
  const [manualHotelNights, setManualHotelNights] = useState<number>(0);
  const [isManualDistance, setIsManualDistance] = useState<boolean>(false);

  // 3b. Weight-based calculations state
  const [totalWeight, setTotalWeight] = useState<number>(0);
  const [numberOfMovers, setNumberOfMovers] = useState<number>(4);
  const [loadHours, setLoadHours] = useState<number>(0);
  const [unloadHours, setUnloadHours] = useState<number>(0);
  const [useWeightBasedTrucks, setUseWeightBasedTrucks] = useState<boolean>(false);

  // 3c. Hired help option
  const [useHiredHelp, setUseHiredHelp] = useState<boolean>(false);
  const [hiredHelpCost, setHiredHelpCost] = useState<number>(0);

  // 3d. Flight price state
  const [flightPricePerDriver, setFlightPricePerDriver] = useState<number>(0);
  const [isRealFlightPrice, setIsRealFlightPrice] = useState<boolean>(false);

  // 4. Rate Overrides (collapsible section)
  const [showOverrides, setShowOverrides] = useState<boolean>(false);
  const [customRates, setCustomRates] = useState(adminRates);

  React.useEffect(() => {
    setCustomRates(adminRates);
  }, [adminRates]);

  // Update custom rates with flight price when it changes
  React.useEffect(() => {
    if (flightPricePerDriver > 0) {
      setCustomRates(prev => ({
        ...prev,
        flightDefaultCost: flightPricePerDriver,
      }));
    } else {
      // Reset to admin default if no flight price set
      setCustomRates(prev => ({
        ...prev,
        flightDefaultCost: adminRates.flightDefaultCost,
      }));
    }
  }, [flightPricePerDriver, adminRates.flightDefaultCost]);

  // Recalculate route when pickup/delivery change
  const triggerRouteCalculation = async (pickup: string, delivery: string) => {
    if (!pickup || !delivery) return;
    setIsCalculatingRoute(true);
    try {
      if (selectedProvider === 'DTMM Truck' && !isManualDistance) {
        // Calculate round-trip for DTMM
        const roundTrip = await calculateRoundTripRoute(dtmmDispatchLocation, pickup, delivery);
        setDtmmRoundTripMiles(roundTrip.totalMiles);
        setDtmmRoundTripHours(roundTrip.totalHours);
        setDistanceMiles(roundTrip.totalMiles);
        setDurationHours(roundTrip.totalHours);
        setIsRealApiActive(roundTrip.isRealApi);
      } else if (!isManualDistance) {
        // Standard one-way calculation
        const res = await calculateRouteDistance(pickup, delivery);
        setDistanceMiles(res.distanceMiles);
        setDurationHours(res.durationHours);
        setIsRealApiActive(res.isRealApi);
      }
    } catch (e) {
      console.warn('Route calculation error', e);
    } finally {
      setIsCalculatingRoute(false);
    }
  };

  // Recalculate DTMM round-trip when dispatch location changes
  useEffect(() => {
    if (selectedProvider === 'DTMM Truck' && pickupAddress && deliveryAddress && !isManualDistance) {
      triggerRouteCalculation(pickupAddress, deliveryAddress);
    }
  }, [dtmmDispatchLocation, selectedProvider]);

  const { drivingDays, hotelNights } = useMemo(
    () => calculateLogisticsDays(durationHours, customRates.hoursPerDrivingDay),
    [durationHours, customRates.hoursPerDrivingDay]
  );

  const routeInfo: RouteInfo = useMemo(
    () => ({
      pickupAddress,
      deliveryAddress,
      distanceMiles,
      durationHours,
      drivingDays,
      hotelNights,
      googleMapsUrl: mapsUrlInput || undefined,
      isManualDistance,
      isManualHotel,
      manualHotelNights: isManualHotel ? manualHotelNights : undefined,
    }),
    [pickupAddress, deliveryAddress, distanceMiles, durationHours, drivingDays, hotelNights, mapsUrlInput, isManualDistance, isManualHotel, manualHotelNights]
  );

  const truckOption: TruckOption = useMemo(
    () => ({
      type: truckType,
      count: truckCount,
      uhaulRatePerTruck: uhaulPrice,
      penskeRatePerTruck: penskePrice,
      selectedProvider,
      totalWeight: totalWeight > 0 ? totalWeight : undefined,
      numberOfMovers: totalWeight > 0 ? numberOfMovers : undefined,
      loadHours: totalWeight > 0 ? loadHours : undefined,
      unloadHours: totalWeight > 0 ? unloadHours : undefined,
      isWeightBased: useWeightBasedTrucks,
      isManualRental: true, // Always manual now
      manualRentalPrice: selectedProvider === 'U-Haul' ? uhaulPrice : selectedProvider === 'Penske' ? penskePrice : 0,
      // DTMM-specific fields
      dtmmDispatchLocation: selectedProvider === 'DTMM Truck' ? dtmmDispatchLocation : undefined,
      dtmmDailyRate: adminRates.dtmmDailyRate,
      dtmmDays: selectedProvider === 'DTMM Truck' ? dtmmDays : undefined,
      dtmmRoundTripMiles: selectedProvider === 'DTMM Truck' ? dtmmRoundTripMiles : undefined,
      dtmmRoundTripHours: selectedProvider === 'DTMM Truck' ? dtmmRoundTripHours : undefined,
      hasExtraDriver: selectedProvider === 'DTMM Truck' ? hasExtraDriver : undefined,
      extraDriverFee: adminRates.dtmmExtraDriverFee,
    }),
    [truckType, truckCount, uhaulPrice, penskePrice, selectedProvider, totalWeight, numberOfMovers, loadHours, unloadHours, useWeightBasedTrucks, dtmmDispatchLocation, dtmmDays, dtmmRoundTripMiles, dtmmRoundTripHours, hasExtraDriver, adminRates]
  );

  // Handler for weight calculation updates
  const handleWeightCalculationUpdate = (trucks: number, load: number, unload: number) => {
    setLoadHours(load);
    setUnloadHours(unload);
    if (useWeightBasedTrucks) {
      setTruckCount(trucks);
    }
  };

  // Handler for flight price updates from FlightPriceFetcher
  const handleFlightPriceUpdate = (pricePerDriver: number, isRealPrice: boolean) => {
    setFlightPricePerDriver(pricePerDriver);
    setIsRealFlightPrice(isRealPrice);
    showNotification(
      isRealPrice 
        ? `Real-time flight price loaded: $${pricePerDriver}/driver` 
        : `Using estimated flight price: $${pricePerDriver}/driver`
    );
  };

  const breakdown = useMemo(
    () => calculateQuoteBreakdown(routeInfo, truckOption, customRates, hiredHelpCost, useHiredHelp),
    [routeInfo, truckOption, customRates, hiredHelpCost, useHiredHelp]
  );

  const handleParseUrl = () => {
    if (!mapsUrlInput) return;
    const parsed = parseRouteUrl(mapsUrlInput);
    if (parsed && parsed.pickup && parsed.delivery) {
      setPickupAddress(parsed.pickup);
      setDeliveryAddress(parsed.delivery);
      triggerRouteCalculation(parsed.pickup, parsed.delivery);
      showNotification(`Extracted route: ${parsed.pickup} to ${parsed.delivery}`);
    } else {
      showNotification('Could not extract route locations from URL.');
    }
  };

  const handleSelectPresetRoute = (route: { pickup: string; delivery: string; miles: number; hours: number }) => {
    setPickupAddress(route.pickup);
    setDeliveryAddress(route.delivery);
    setDistanceMiles(route.miles);
    setDurationHours(route.hours);
    showNotification(`Loaded route: ${route.pickup} → ${route.delivery}`);
  };

  const handleSave = () => {
    const customer: CustomerInfo = {
      name: customerName || 'Valued Customer',
      phone: customerPhone || '(555) 000-0000',
      email: customerEmail || 'customer@example.com',
      moveDate: moveDate || new Date().toISOString().split('T')[0],
      notes,
    };

    const saved = saveQuote({
      customer,
      route: routeInfo,
      truck: truckOption,
      ratesUsed: customRates,
      breakdown,
      status: 'Draft',
    });

    return saved;
  };

  const handlePrint = async () => {
    const saved = await handleSave();
    setActiveQuoteForPrint(saved);
  };

  const handleCopySummary = () => {
    const text = `
=== DAN - THE MOVING MAN QUOTE ===
Quote Date: ${new Date().toLocaleDateString()}
Customer: ${customerName} (${customerPhone})
Move Date: ${moveDate}

ROUTE DETAILS:
Pickup: ${pickupAddress}
Delivery: ${deliveryAddress}
Distance: ${distanceMiles} miles (~${durationHours} driving hrs)
Logistics: ${drivingDays} Driving Days | ${hotelNights} Hotel Night(s)

TRUCK & LOGISTICS:
Truck Type: ${truckCount}x ${truckType}
Provider Selected: ${selectedProvider} ($${(selectedProvider === 'U-Haul' ? uhaulPrice : penskePrice).toLocaleString()}/truck)

COST BREAKDOWN:
- Driver Driving Pay: $${breakdown.driverPay.toLocaleString()}
- Fuel Estimate (${customRates.mpg} MPG @ $${customRates.gasPricePerGallon}/gal): $${breakdown.fuelCost.toLocaleString()}
- Hotel Accommodations (${hotelNights} night/s): $${breakdown.hotelCost.toLocaleString()}
- Loading & Unloading Labor: $${breakdown.laborCost.toLocaleString()}
- Flight Return Allowance: $${breakdown.flightCost.toLocaleString()}
- Truck Rental Total: $${breakdown.truckRentalCost.toLocaleString()}

---------------------------------
Subtotal: $${breakdown.subtotal.toLocaleString()}
Profit & Overhead (${customRates.profitMarginPercent}%): $${breakdown.profitAmount.toLocaleString()}
GRAND TOTAL QUOTE: $${breakdown.grandTotal.toLocaleString()}
=================================
`.trim();

    navigator.clipboard.writeText(text);
    showNotification('Quote summary copied to clipboard!');
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#141419] p-6 rounded-3xl border border-[#22222a] shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl sm:text-2xl font-black text-white uppercase">DAN -</span>
            <span className="text-xl sm:text-2xl font-black text-[#e62329] uppercase">THE MOVING MAN</span>
          </div>
          <p className="text-xs text-zinc-400 font-medium">
            Automated pricing engine for long-distance moves. Distance, fuel, truck, labor & profit margin update live.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setPickupAddress('New York, NY');
              setDeliveryAddress('Miami, FL');
              setDistanceMiles(1280);
              setDurationHours(19.5);
              setTruckCount(1);
            }}
            className="p-2.5 text-zinc-400 hover:text-white hover:bg-[#1f1f27] rounded-xl transition-colors"
            title="Reset to default"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={handleCopySummary}
            className="flex items-center gap-2 px-3.5 py-2 bg-[#1f1f27] text-white text-xs font-bold rounded-xl hover:bg-[#282832] transition-colors"
          >
            <Copy className="w-4 h-4 text-[#e62329]" />
            <span>Copy Text</span>
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-[#0b0b0e] text-white text-xs font-black rounded-xl border border-[#22222a] hover:bg-[#1f1f27] transition-all"
          >
            <Save className="w-4 h-4 text-[#e62329]" />
            <span>Save Quote</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-[#e62329] hover:bg-[#cc1b21] text-white text-xs font-black rounded-xl shadow-md shadow-red-900/30 transition-all uppercase"
          >
            <Printer className="w-4 h-4" />
            <span>Print / PDF</span>
          </button>
        </div>
      </div>

      {/* Responsive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT COLUMN: Input Forms */}
        <div className="lg:col-span-7 space-y-6">
          {/* Route Input Card */}
          <div className="bg-[#141419] p-6 sm:p-8 rounded-3xl border border-[#22222a] shadow-lg space-y-5">
            <div className="flex items-center justify-between border-b border-[#22222a] pb-4">
              <h2 className="text-sm font-black text-white flex items-center gap-2 uppercase tracking-wide">
                <MapPin className="w-4 h-4 text-[#e62329]" />
                1. Route & Distance Calculation
              </h2>
              <span className="text-[10px] font-bold text-white bg-[#e62329] px-2.5 py-1 rounded-full uppercase flex items-center gap-1">
                {isCalculatingRoute ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" /> Calculating...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3 h-3" /> Live Distance Engine
                  </>
                )}
              </span>
            </div>

            {/* Address fields with Autocomplete */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <CityAutocomplete
                label="Pickup Address / City"
                value={pickupAddress}
                onChange={(address, lat, lng) => {
                  setPickupAddress(address);
                  triggerRouteCalculation(address, deliveryAddress);
                }}
                placeholder="e.g. New York, NY"
              />

              <CityAutocomplete
                label="Delivery Address / City"
                value={deliveryAddress}
                onChange={(address, lat, lng) => {
                  setDeliveryAddress(address);
                  triggerRouteCalculation(pickupAddress, address);
                }}
                placeholder="e.g. Miami, FL"
              />
            </div>

            {/* Paste Directions Link */}
            <div className="pt-1">
              <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                OR Paste Route Directions Link
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Link className="w-3.5 h-3.5 absolute left-3 top-3 text-zinc-500" />
                  <input
                    type="text"
                    value={mapsUrlInput}
                    onChange={(e) => setMapsUrlInput(e.target.value)}
                    placeholder="Paste route URL..."
                    className="w-full pl-9 pr-3 py-2 bg-[#0b0b0e] border border-[#22222a] rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#e62329]"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleParseUrl}
                  className="px-4 py-2 bg-[#e62329] text-white text-xs font-black rounded-xl hover:bg-[#cc1b21] transition-colors uppercase"
                >
                  Extract
                </button>
              </div>
            </div>

            {/* Interactive Map Selector */}
            <div className="pt-1">
              <label className="block text-[11px] font-semibold text-zinc-400 mb-2">
                OR Use Interactive Map
              </label>
              <GoogleMapsSelector
                pickupAddress={pickupAddress}
                deliveryAddress={deliveryAddress}
                onPickupChange={(address) => {
                  setPickupAddress(address);
                  triggerRouteCalculation(address, deliveryAddress);
                }}
                onDeliveryChange={(address) => {
                  setDeliveryAddress(address);
                  triggerRouteCalculation(pickupAddress, address);
                }}
                onRouteCalculated={(distance, duration) => {
                  setDistanceMiles(distance);
                  setDurationHours(duration);
                  showNotification(`Route calculated: ${distance} miles, ${duration} hours`);
                }}
              />
            </div>

            {/* Quick preset route chips */}
            <div>
              <span className="text-[11px] font-bold text-zinc-400 block mb-2 uppercase tracking-wider">
                Popular Benchmark Routes:
              </span>
              <div className="flex flex-wrap gap-2">
                {POPULAR_ROUTES.map((r, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSelectPresetRoute(r)}
                    className={`text-[11px] px-3 py-1.5 rounded-xl border font-bold transition-all ${
                      pickupAddress === r.pickup && deliveryAddress === r.delivery
                        ? 'bg-[#e62329] text-white border-[#e62329] shadow-md shadow-red-900/30'
                        : 'bg-[#0b0b0e] text-zinc-300 border-[#22222a] hover:border-[#e62329]'
                    }`}
                  >
                    {r.pickup.split(',')[0]} &rarr; {r.delivery.split(',')[0]} ({r.miles} mi)
                  </button>
                ))}
              </div>
            </div>

            {/* Distance & Driving Logistics Display */}
            <div className="p-4 bg-[#0b0b0e] text-white rounded-2xl border border-[#22222a] grid grid-cols-2 sm:grid-cols-4 gap-4 shadow-lg">
              <div>
                <span className="text-[10px] uppercase font-bold text-zinc-400 block">Distance</span>
                <div className="flex items-center gap-1 mt-0.5">
                  <input
                    type="number"
                    value={distanceMiles}
                    onChange={(e) => setDistanceMiles(Math.max(0, Number(e.target.value)))}
                    disabled={selectedProvider === 'DTMM Truck' && !isManualDistance}
                    className="w-20 font-black text-xl text-[#e62329] bg-transparent border-b border-[#e62329] focus:outline-none disabled:opacity-50"
                  />
                  <span className="text-xs text-zinc-400">mi</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-zinc-400 block">Drive Hours</span>
                <div className="flex items-center gap-1 mt-0.5">
                  <input
                    type="number"
                    step="0.5"
                    value={durationHours}
                    onChange={(e) => setDurationHours(Math.max(0, Number(e.target.value)))}
                    disabled={selectedProvider === 'DTMM Truck' && !isManualDistance}
                    className="w-16 font-black text-xl text-white bg-transparent border-b border-zinc-700 focus:outline-none disabled:opacity-50"
                  />
                  <span className="text-xs text-zinc-400">hrs</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-zinc-400 block">Driving Days</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Clock className="w-4 h-4 text-[#e62329]" />
                  <span className="font-black text-xl text-white">{drivingDays}</span>
                  <span className="text-[10px] text-zinc-400">(11h max/d)</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-zinc-400 block">Hotel Nights</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Bed className="w-4 h-4 text-[#e62329]" />
                  <span className="font-black text-xl text-white">{isManualHotel ? manualHotelNights : hotelNights}</span>
                  <span className="text-[10px] text-zinc-400">nights</span>
                </div>
              </div>
            </div>

            {/* Manual Override Options for DTMM */}
            {selectedProvider === 'DTMM Truck' && (
              <div className="space-y-3 p-4 bg-[#0b0b0e]/50 rounded-2xl border border-[#22222a]">
                <div className="text-[11px] font-bold text-white uppercase mb-2">Manual Overrides:</div>
                
                {/* Manual Distance Override */}
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="manualDistance"
                    checked={isManualDistance}
                    onChange={(e) => setIsManualDistance(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-[#22222a] bg-[#141419] text-[#e62329] focus:ring-2 focus:ring-[#e62329]"
                  />
                  <div className="flex-1">
                    <label htmlFor="manualDistance" className="text-[11px] font-bold text-zinc-300 cursor-pointer">
                      Manually Override Distance & Hours
                    </label>
                    <p className="text-[10px] text-zinc-400 mt-0.5">Use this if Google Maps shows different values than our calculation</p>
                  </div>
                </div>

                {/* Manual Hotel Override */}
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="manualHotel"
                    checked={isManualHotel}
                    onChange={(e) => setIsManualHotel(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-[#22222a] bg-[#141419] text-[#e62329] focus:ring-2 focus:ring-[#e62329]"
                  />
                  <div className="flex-1">
                    <label htmlFor="manualHotel" className="text-[11px] font-bold text-zinc-300 cursor-pointer">
                      Manually Set Hotel Nights
                    </label>
                    {isManualHotel && (
                      <div className="mt-2">
                        <input
                          type="number"
                          min="0"
                          value={manualHotelNights}
                          onChange={(e) => setManualHotelNights(Math.max(0, Number(e.target.value)))}
                          className="w-24 px-3 py-1.5 bg-[#141419] border border-[#22222a] rounded-lg text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-[#e62329]"
                          placeholder="0"
                        />
                        <span className="text-[10px] text-zinc-400 ml-2">nights</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Truck Selection & Provider Comparison */}
          <div className="bg-[#141419] p-6 sm:p-8 rounded-3xl border border-[#22222a] shadow-lg space-y-5">
            <div className="flex items-center justify-between border-b border-[#22222a] pb-4">
              <h2 className="text-sm font-black text-white flex items-center gap-2 uppercase tracking-wide">
                <Truck className="w-4 h-4 text-[#e62329]" />
                2. Truck Fleet Selection & Provider Comparison
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5 uppercase">
                  Truck Size / Type
                </label>
                <select
                  value={truckType}
                  onChange={(e) => setTruckType(e.target.value as TruckType)}
                  className="w-full px-3.5 py-2.5 bg-[#0b0b0e] border border-[#22222a] rounded-xl text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-[#e62329]"
                >
                  <option value="26 ft Box Truck">26 ft Box Truck (Standard)</option>
                  <option value="20 ft Truck">20 ft Medium Truck</option>
                  <option value="16 ft Moving Truck">16 ft Small Truck</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5 uppercase flex items-center gap-2">
                  Number of Trucks Required
                  {useWeightBasedTrucks && totalWeight > 0 && (
                    <span className="text-[9px] font-black bg-[#e62329] text-white px-2 py-0.5 rounded-full">
                      AUTO FROM WEIGHT
                    </span>
                  )}
                </label>
                <select
                  value={truckCount}
                  onChange={(e) => {
                    setTruckCount(Number(e.target.value));
                    setUseWeightBasedTrucks(false);
                  }}
                  disabled={useWeightBasedTrucks && totalWeight > 0}
                  className="w-full px-3.5 py-2.5 bg-[#0b0b0e] border border-[#22222a] rounded-xl text-xs font-black text-[#e62329] focus:outline-none focus:ring-2 focus:ring-[#e62329] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value={1}>1 Truck</option>
                  <option value={2}>2 Trucks (x2 Multiplier)</option>
                  <option value={3}>3 Trucks (x3 Multiplier)</option>
                  <option value={4}>4 Trucks (x4 Multiplier)</option>
                </select>
                {useWeightBasedTrucks && totalWeight > 0 && (
                  <p className="text-[10px] text-zinc-400 mt-1">
                    Automatically set from weight calculation. Clear weight to manually select.
                  </p>
                )}
              </div>
            </div>

            {/* Provider selection and manual pricing */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs font-bold text-zinc-300 gap-2">
                <span className="uppercase">Select Rental Provider:</span>
                <div className="flex gap-2 text-[11px]">
                  <button
                    onClick={() => {
                      setSelectedProvider('U-Haul');
                      setIsManualDistance(false);
                      setIsManualHotel(false);
                    }}
                    className={`px-2.5 py-1 rounded-lg font-bold uppercase transition-all ${selectedProvider === 'U-Haul' ? 'bg-[#e62329] text-white' : 'bg-[#0b0b0e] text-zinc-400'}`}
                  >
                    U-Haul
                  </button>
                  <button
                    onClick={() => {
                      setSelectedProvider('Penske');
                      setIsManualDistance(false);
                      setIsManualHotel(false);
                    }}
                    className={`px-2.5 py-1 rounded-lg font-bold uppercase transition-all ${selectedProvider === 'Penske' ? 'bg-[#e62329] text-white' : 'bg-[#0b0b0e] text-zinc-400'}`}
                  >
                    Penske
                  </button>
                  <button
                    onClick={() => {
                      setSelectedProvider('DTMM Truck');
                      triggerRouteCalculation(pickupAddress, deliveryAddress);
                    }}
                    className={`px-2.5 py-1 rounded-lg font-bold uppercase transition-all ${selectedProvider === 'DTMM Truck' ? 'bg-[#e62329] text-white' : 'bg-[#0b0b0e] text-zinc-400'}`}
                  >
                    DTMM Truck
                  </button>
                </div>
              </div>

              {selectedProvider === 'DTMM Truck' ? (
                /* DTMM Provider Card */
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl border bg-[#0b0b0e] text-white border-[#e62329] ring-2 ring-red-900/40">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-black text-xs uppercase tracking-wider">DTMM Truck Rental</span>
                      <span className="text-[9px] uppercase font-black bg-[#e62329] text-white px-2 py-0.5 rounded-full">
                        Selected
                      </span>
                    </div>

                    {/* Dispatch Location */}
                    <div className="mb-3">
                      <label className="block text-[10px] font-bold text-zinc-400 mb-1.5 uppercase">
                        Dispatch Location
                      </label>
                      <select
                        value={dtmmDispatchLocation}
                        onChange={(e) => setDtmmDispatchLocation(e.target.value)}
                        className="w-full px-3 py-2.5 bg-[#141419] border border-[#22222a] rounded-xl text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-[#e62329]"
                      >
                        {DTMM_DISPATCH_LOCATIONS.map((loc) => (
                          <option key={loc.name} value={loc.address}>
                            {loc.name} - {loc.address}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* DTMM Days & Daily Rate */}
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-400 mb-1.5 uppercase">
                          Number of Days
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={dtmmDays}
                          onChange={(e) => setDtmmDays(Math.max(1, Number(e.target.value)))}
                          className="w-full px-3 py-2.5 bg-[#141419] border border-[#22222a] rounded-xl text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-[#e62329]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-400 mb-1.5 uppercase">
                          Daily Rate
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-zinc-400 text-xs font-bold">$</span>
                          <input
                            type="text"
                            value={adminRates.dtmmDailyRate}
                            disabled
                            className="w-full pl-7 pr-3 py-2.5 bg-[#141419] border border-[#22222a] rounded-xl text-xs font-bold text-zinc-500 cursor-not-allowed"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Round-trip info */}
                    {dtmmRoundTripMiles > 0 && (
                      <div className="p-2.5 bg-[#141419] rounded-lg border border-[#22222a] text-[10px] text-zinc-400 mb-3">
                        <div className="font-bold text-white mb-1">Round-Trip Route:</div>
                        <div>{DTMM_DISPATCH_LOCATIONS.find(l => l.address === dtmmDispatchLocation)?.name} → Pickup → Delivery → {DTMM_DISPATCH_LOCATIONS.find(l => l.address === dtmmDispatchLocation)?.name}</div>
                        <div className="font-bold text-[#e62329] mt-1">{dtmmRoundTripMiles} miles • {dtmmRoundTripHours} hours</div>
                      </div>
                    )}

                    {/* Extra Driver Option */}
                    <div className="flex items-center gap-2 mb-3">
                      <input
                        type="checkbox"
                        id="extraDriver"
                        checked={hasExtraDriver}
                        onChange={(e) => setHasExtraDriver(e.target.checked)}
                        className="w-4 h-4 rounded border-[#22222a] bg-[#141419] text-[#e62329] focus:ring-2 focus:ring-[#e62329]"
                      />
                      <label htmlFor="extraDriver" className="text-[11px] font-bold text-white">
                        Add Extra Driver (+${adminRates.dtmmExtraDriverFee} flat fee)
                      </label>
                    </div>

                    {/* Calculation */}
                    {truckCount > 0 && dtmmDays > 0 && (
                      <div className="text-[11px] text-zinc-400 font-semibold">
                        Rental: ${adminRates.dtmmDailyRate}/day × {dtmmDays} days × {truckCount} truck{truckCount > 1 ? 's' : ''} = ${(adminRates.dtmmDailyRate * dtmmDays * truckCount).toLocaleString()}
                        {hasExtraDriver && <div className="text-[#e62329]">+ Extra Driver: ${adminRates.dtmmExtraDriverFee}</div>}
                      </div>
                    )}
                  </div>

                  <div className="p-3 bg-[#0b0b0e]/50 rounded-xl border border-[#22222a]">
                    <p className="text-[11px] text-zinc-400">
                      <span className="font-bold text-white">ℹ️ DTMM Truck:</span> Round-trip calculation (dispatch → pickup → delivery → dispatch). No flight cost needed as drivers return in trucks.
                    </p>
                  </div>
                </div>
              ) : (
                /* U-Haul & Penske Cards */
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* U-Haul Card */}
                <div
                  className={`p-4 rounded-2xl border transition-all ${
                    selectedProvider === 'U-Haul'
                      ? 'bg-[#0b0b0e] text-white border-[#e62329] ring-2 ring-red-900/40'
                      : 'bg-[#0b0b0e]/60 border-[#22222a] opacity-70'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-black text-xs uppercase tracking-wider">U-Haul Rental</span>
                    {selectedProvider === 'U-Haul' && (
                      <span className="text-[9px] uppercase font-black bg-[#e62329] text-white px-2 py-0.5 rounded-full">
                        Selected
                      </span>
                    )}
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 mb-1.5 uppercase">
                      Price Per Truck
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-zinc-400 text-xs font-bold">$</span>
                      <input
                        type="number"
                        value={uhaulPrice || ''}
                        onChange={(e) => setUhaulPrice(Math.max(0, Number(e.target.value)))}
                        placeholder="e.g. 1250"
                        className="w-full pl-7 pr-3 py-2.5 bg-[#141419] border border-[#22222a] rounded-xl text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-[#e62329]"
                      />
                    </div>
                  </div>
                  {truckCount > 1 && uhaulPrice > 0 && (
                    <div className="text-[11px] text-zinc-400 font-semibold mt-2">
                      Total ({truckCount} trucks): ${(uhaulPrice * truckCount).toLocaleString()}
                    </div>
                  )}
                </div>

                {/* Penske Card */}
                <div
                  className={`p-4 rounded-2xl border transition-all ${
                    selectedProvider === 'Penske'
                      ? 'bg-[#0b0b0e] text-white border-[#e62329] ring-2 ring-red-900/40'
                      : 'bg-[#0b0b0e]/60 border-[#22222a] opacity-70'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-black text-xs uppercase tracking-wider">Penske Rental</span>
                    {selectedProvider === 'Penske' && (
                      <span className="text-[9px] uppercase font-black bg-[#e62329] text-white px-2 py-0.5 rounded-full">
                        Selected
                      </span>
                    )}
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 mb-1.5 uppercase">
                      Price Per Truck
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-zinc-400 text-xs font-bold">$</span>
                      <input
                        type="number"
                        value={penskePrice || ''}
                        onChange={(e) => setPenskePrice(Math.max(0, Number(e.target.value)))}
                        placeholder="e.g. 1300"
                        className="w-full pl-7 pr-3 py-2.5 bg-[#141419] border border-[#22222a] rounded-xl text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-[#e62329]"
                      />
                    </div>
                  </div>
                  {truckCount > 1 && penskePrice > 0 && (
                    <div className="text-[11px] text-zinc-400 font-semibold mt-2">
                      Total ({truckCount} trucks): ${(penskePrice * truckCount).toLocaleString()}
                    </div>
                  )}
                </div>
              </div>

              <div className="p-3 bg-[#0b0b0e]/50 rounded-xl border border-[#22222a]">
                <p className="text-[11px] text-zinc-400">
                  <span className="font-bold text-white">💡 Tip:</span> Enter the actual quote you received from U-Haul or Penske. The selected provider's price will be used in the final calculation.
                </p>
              </div>
                </>
              )}
            </div>
          </div>

          {/* Weight-Based Calculator Section */}
          <WeightCalculator
            totalWeight={totalWeight}
            numberOfMovers={numberOfMovers}
            onWeightChange={(weight) => {
              setTotalWeight(weight);
              if (weight > 0) {
                setUseWeightBasedTrucks(true);
              }
            }}
            onMoverCountChange={setNumberOfMovers}
            onCalculationUpdate={handleWeightCalculationUpdate}
          />

          {/* Hired Help Option Section */}
          <div className="bg-[#141419] p-6 sm:p-8 rounded-3xl border border-[#22222a] shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-[#22222a] pb-4">
              <h2 className="text-sm font-black text-white flex items-center gap-2 uppercase tracking-wide">
                <Users className="w-4 h-4 text-[#e62329]" />
                Labor Options
              </h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-[#0b0b0e] rounded-xl border border-[#22222a]">
                <input
                  type="checkbox"
                  id="useHiredHelp"
                  checked={useHiredHelp}
                  onChange={(e) => setUseHiredHelp(e.target.checked)}
                  className="w-5 h-5 rounded border-[#22222a] bg-[#0b0b0e] text-[#e62329] focus:ring-2 focus:ring-[#e62329]"
                />
                <label htmlFor="useHiredHelp" className="flex-1">
                  <span className="block text-xs font-bold text-white uppercase">Use Hired Help for Unloading</span>
                  <span className="block text-[10px] text-zinc-400 mt-0.5">
                    Customer hires local help at destination instead of company unloading
                  </span>
                </label>
              </div>

              {useHiredHelp && (
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1.5 uppercase">
                    Hired Help Cost (Total)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-zinc-400 text-xs font-bold">$</span>
                    <input
                      type="number"
                      value={hiredHelpCost || ''}
                      onChange={(e) => setHiredHelpCost(Math.max(0, Number(e.target.value)))}
                      placeholder="e.g. 400"
                      className="w-full pl-7 pr-3.5 py-2.5 bg-[#0b0b0e] border-2 border-green-600 rounded-xl text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <p className="text-[10px] text-zinc-400 mt-1">
                    Company will only provide loading service. Unloading handled by hired help.
                  </p>
                </div>
              )}

              {!useHiredHelp && totalWeight > 0 && numberOfMovers > 0 && (
                <div className="p-4 bg-[#0b0b0e]/50 rounded-xl border border-[#22222a]">
                  <p className="text-xs text-zinc-400">
                    <span className="font-bold text-white">Standard Company Service:</span> Hour-based labor calculation: {loadHours.toFixed(2)}h load + {unloadHours.toFixed(2)}h unload × {numberOfMovers} movers × ${customRates.laborRatePerHour}/hr
                  </p>
                </div>
              )}

              {!useHiredHelp && (!totalWeight || totalWeight === 0) && (
                <div className="p-4 bg-[#0b0b0e]/50 rounded-xl border border-[#22222a]">
                  <p className="text-xs text-zinc-400">
                    <span className="font-bold text-white">Standard Company Service:</span> Enter weight above to calculate hour-based labor costs at ${customRates.laborRatePerHour}/hr per person
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Flight Price Fetcher Section */}
          <FlightPriceFetcher
            deliveryAddress={deliveryAddress}
            moveDate={moveDate}
            truckCount={truckCount}
            onFlightPriceUpdate={handleFlightPriceUpdate}
          />

          {/* Customer Information Section */}
          <div className="bg-[#141419] p-6 sm:p-8 rounded-3xl border border-[#22222a] shadow-lg space-y-4">
            <h2 className="text-sm font-black text-white flex items-center gap-2 border-b border-[#22222a] pb-4 uppercase tracking-wide">
              <User className="w-4 h-4 text-[#e62329]" />
              3. Customer & Moving Schedule
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1 uppercase">Customer Full Name</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full px-3.5 py-2.5 bg-[#0b0b0e] border border-[#22222a] rounded-xl text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-[#e62329]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1 uppercase">Phone Number</label>
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="(555) 000-0000"
                  className="w-full px-3.5 py-2.5 bg-[#0b0b0e] border border-[#22222a] rounded-xl text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-[#e62329]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1 uppercase">Email Address</label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="john@example.com"
                  className="w-full px-3.5 py-2.5 bg-[#0b0b0e] border border-[#22222a] rounded-xl text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-[#e62329]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1 uppercase">Scheduled Move Date</label>
                <input
                  type="date"
                  value={moveDate}
                  onChange={(e) => setMoveDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#0b0b0e] border border-[#22222a] rounded-xl text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-[#e62329]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1 uppercase">Special Move Instructions / Notes</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g., Heavy items, narrow driveway, stairs..."
                className="w-full px-3.5 py-2.5 bg-[#0b0b0e] border border-[#22222a] rounded-xl text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-[#e62329]"
              />
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Live Calculation Card */}
        <div className="lg:col-span-5 space-y-6">
          <div className="sticky top-20 bg-[#141419] text-white p-6 sm:p-8 rounded-3xl shadow-2xl space-y-6 border border-red-900/40 glow-red">
            <div className="flex items-center justify-between border-b border-[#22222a] pb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#e62329]">Live Formula Engine</span>
                <h3 className="text-xl font-black text-white uppercase">DAN - THE MOVING MAN</h3>
              </div>
              <span className="px-3 py-1 rounded-full bg-[#e62329] text-white text-xs font-black">
                FR-11
              </span>
            </div>

            {/* Logistics Badge Summary */}
            <div className="grid grid-cols-2 gap-2 text-xs bg-[#0b0b0e] p-3 rounded-2xl border border-[#22222a]">
              <div>
                <span className="text-[10px] text-zinc-400 block uppercase font-bold">Route Specs</span>
                <span className="font-bold text-white">{distanceMiles} mi ({durationHours}h)</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 block uppercase font-bold">Logistics</span>
                <span className="font-bold text-white">{truckCount}x Trucks ({drivingDays}d, {hotelNights}h)</span>
              </div>
            </div>

            {/* Line Items List */}
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between text-zinc-300">
                <span className="flex items-center gap-2">
                  <Truck className="w-3.5 h-3.5 text-[#e62329]" />
                  Truck Rental ({selectedProvider})
                </span>
                <span className="font-mono font-bold">${breakdown.truckRentalCost.toLocaleString()}</span>
              </div>

              <div className="flex items-center justify-between text-zinc-300">
                <span className="flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-[#e62329]" />
                  Employee Driving Pay ({distanceMiles}mi × ${customRates.driverPayPerMile})
                </span>
                <span className="font-mono font-bold">${breakdown.driverPay.toLocaleString()}</span>
              </div>

              <div className="flex items-center justify-between text-zinc-300">
                <span className="flex items-center gap-2">
                  <Fuel className="w-3.5 h-3.5 text-[#e62329]" />
                  Fuel Expenses ({customRates.mpg} MPG @ ${customRates.gasPricePerGallon}/gal)
                </span>
                <span className="font-mono font-bold">${breakdown.fuelCost.toLocaleString()}</span>
              </div>

              <div className="flex items-center justify-between text-zinc-300">
                <span className="flex items-center gap-2">
                  <Bed className="w-3.5 h-3.5 text-[#e62329]" />
                  Hotel Stays ({hotelNights} nights @ ${customRates.hotelRatePerNight})
                </span>
                <span className="font-mono font-bold">${breakdown.hotelCost.toLocaleString()}</span>
              </div>

              <div className="flex items-center justify-between text-zinc-300">
                <span className="flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-zinc-400" />
                  {totalWeight > 0 && numberOfMovers > 0 ? (
                    `Loading Labor (${loadHours.toFixed(1)}h × ${numberOfMovers} @ $${customRates.laborRatePerHour}/hr)`
                  ) : (
                    'Loading Labor'
                  )}
                </span>
                <span className="font-mono font-bold">${breakdown.loadingCost.toLocaleString()}</span>
              </div>

              <div className="flex items-center justify-between text-zinc-300">
                <span className="flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-zinc-400" />
                  {totalWeight > 0 && numberOfMovers > 0 && !useHiredHelp ? (
                    `Unloading Labor (${unloadHours.toFixed(1)}h × ${numberOfMovers} @ $${customRates.laborRatePerHour}/hr)`
                  ) : useHiredHelp ? (
                    'Hired Help (Unloading)'
                  ) : (
                    'Unloading Labor'
                  )}
                </span>
                <span className="font-mono font-bold">${useHiredHelp && breakdown.hiredHelpCost ? breakdown.hiredHelpCost.toLocaleString() : breakdown.unloadingCost.toLocaleString()}</span>
              </div>

              <div className="flex items-center justify-between text-zinc-300">
                <span className="flex items-center gap-2">
                  <Plane className="w-3.5 h-3.5 text-[#e62329]" />
                  Driver Return Flight Allowance
                </span>
                <span className="font-mono font-bold">${breakdown.flightCost.toLocaleString()}</span>
              </div>

              {/* Subtotal line */}
              <div className="pt-3 border-t border-[#22222a] flex items-center justify-between text-zinc-200 font-bold">
                <span>Subtotal Costs</span>
                <span className="font-mono text-sm">${breakdown.subtotal.toLocaleString()}</span>
              </div>

              {/* Profit line */}
              <div className="flex items-center justify-between text-[#e62329] font-extrabold">
                <span>Company Profit Margin ({customRates.profitMarginPercent}%)</span>
                <span className="font-mono text-sm">+${breakdown.profitAmount.toLocaleString()}</span>
              </div>
            </div>

            {/* Grand Total Highlight Box */}
            <div className="p-6 rounded-2xl bg-[#e62329] text-white shadow-xl space-y-1">
              <span className="text-xs uppercase font-extrabold text-white tracking-wider">Final Customer Quote</span>
              <div className="text-4xl font-black tracking-tight">
                ${breakdown.grandTotal.toLocaleString()}
              </div>
              <p className="text-[11px] text-white/90">Includes fuel, labor, hotel stays, truck rental & company profit.</p>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={handleSave}
                className="w-full py-3.5 bg-[#0b0b0e] hover:bg-[#1f1f27] text-white text-xs font-black rounded-xl border border-[#22222a] transition-all flex items-center justify-center gap-2 uppercase"
              >
                <Save className="w-4 h-4 text-[#e62329]" />
                Save Quote
              </button>

              <button
                onClick={handlePrint}
                className="w-full py-3.5 bg-[#e62329] hover:bg-[#cc1b21] text-white text-xs font-black rounded-xl shadow-lg shadow-red-900/40 transition-all flex items-center justify-center gap-2 uppercase"
              >
                <Printer className="w-4 h-4" />
                Print / PDF
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
