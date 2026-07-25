'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { TruckOption, TruckType, RouteInfo, CustomerInfo } from '@/types/calculator';
import {
  calculateLogisticsDays,
  calculateTruckRates,
  calculateQuoteBreakdown,
  parseGoogleMapsUrl,
  estimateRouteDistance,
  POPULAR_ROUTES,
} from '@/lib/calculator-engine';
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
  Shield,
} from 'lucide-react';

export const NewQuoteView: React.FC = () => {
  const { adminRates, saveQuote, setActiveQuoteForPrint, showNotification } = useApp();

  // 1. Route state
  const [pickupAddress, setPickupAddress] = useState<string>('New York, NY');
  const [deliveryAddress, setDeliveryAddress] = useState<string>('Miami, FL');
  const [mapsUrlInput, setMapsUrlInput] = useState<string>('');
  const [distanceMiles, setDistanceMiles] = useState<number>(1280);
  const [durationHours, setDurationHours] = useState<number>(19.5);

  // 2. Customer state
  const [customerName, setCustomerName] = useState<string>('Robert Davis');
  const [customerPhone, setCustomerPhone] = useState<string>('(555) 234-5678');
  const [customerEmail, setCustomerEmail] = useState<string>('robert.davis@example.com');
  const [moveDate, setMoveDate] = useState<string>('2026-08-15');
  const [notes, setNotes] = useState<string>('3-bedroom house move. Requires loading & unloading labor.');

  // 3. Truck options state
  const [truckType, setTruckType] = useState<TruckType>('26 ft Box Truck');
  const [truckCount, setTruckCount] = useState<number>(1);
  const [providerOverride, setProviderOverride] = useState<'U-Haul' | 'Penske' | 'Auto'>('Auto');

  // 4. Rate Overrides (collapsible section)
  const [showOverrides, setShowOverrides] = useState<boolean>(false);
  const [customRates, setCustomRates] = useState(adminRates);

  React.useEffect(() => {
    setCustomRates(adminRates);
  }, [adminRates]);

  const { drivingDays, hotelNights } = useMemo(
    () => calculateLogisticsDays(durationHours),
    [durationHours]
  );

  const { uhaulRate, penskeRate, recommended } = useMemo(
    () => calculateTruckRates(distanceMiles, drivingDays),
    [distanceMiles, drivingDays]
  );

  const selectedProvider = providerOverride === 'Auto' ? recommended : providerOverride;

  const routeInfo: RouteInfo = useMemo(
    () => ({
      pickupAddress,
      deliveryAddress,
      distanceMiles,
      durationHours,
      drivingDays,
      hotelNights,
      googleMapsUrl: mapsUrlInput || undefined,
    }),
    [pickupAddress, deliveryAddress, distanceMiles, durationHours, drivingDays, hotelNights, mapsUrlInput]
  );

  const truckOption: TruckOption = useMemo(
    () => ({
      type: truckType,
      count: truckCount,
      uhaulRatePerTruck: uhaulRate,
      penskeRatePerTruck: penskeRate,
      selectedProvider,
    }),
    [truckType, truckCount, uhaulRate, penskeRate, selectedProvider]
  );

  const breakdown = useMemo(
    () => calculateQuoteBreakdown(routeInfo, truckOption, customRates),
    [routeInfo, truckOption, customRates]
  );

  const handleCalculateRoute = (pickup: string, delivery: string) => {
    if (!pickup || !delivery) return;
    const est = estimateRouteDistance(pickup, delivery);
    setDistanceMiles(est.miles);
    setDurationHours(est.hours);
  };

  const handleParseMapsUrl = () => {
    if (!mapsUrlInput) return;
    const parsed = parseGoogleMapsUrl(mapsUrlInput);
    if (parsed && parsed.pickup && parsed.delivery) {
      setPickupAddress(parsed.pickup);
      setDeliveryAddress(parsed.delivery);
      handleCalculateRoute(parsed.pickup, parsed.delivery);
      showNotification(`Extracted: ${parsed.pickup} to ${parsed.delivery}`);
    } else {
      showNotification('Could not extract route from Google Maps URL.');
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

  const handlePrint = () => {
    const saved = handleSave();
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
Provider Selected: ${selectedProvider} ($${(selectedProvider === 'U-Haul' ? uhaulRate : penskeRate).toLocaleString()}/truck)

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
          {/* FR-1 & FR-2: Route Input Card */}
          <div className="bg-[#141419] p-6 sm:p-8 rounded-3xl border border-[#22222a] shadow-lg space-y-5">
            <div className="flex items-center justify-between border-b border-[#22222a] pb-4">
              <h2 className="text-sm font-black text-white flex items-center gap-2 uppercase tracking-wide">
                <MapPin className="w-4 h-4 text-[#e62329]" />
                1. Route & Distance Calculation
              </h2>
              <span className="text-[10px] font-bold text-white bg-[#e62329] px-2.5 py-1 rounded-full uppercase">
                Google Directions API
              </span>
            </div>

            {/* Address fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5 uppercase">
                  Pickup Address / City
                </label>
                <input
                  type="text"
                  value={pickupAddress}
                  onChange={(e) => {
                    setPickupAddress(e.target.value);
                    handleCalculateRoute(e.target.value, deliveryAddress);
                  }}
                  placeholder="e.g. New York, NY"
                  className="w-full px-3.5 py-2.5 bg-[#0b0b0e] border border-[#22222a] rounded-xl text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-[#e62329]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5 uppercase">
                  Delivery Address / City
                </label>
                <input
                  type="text"
                  value={deliveryAddress}
                  onChange={(e) => {
                    setDeliveryAddress(e.target.value);
                    handleCalculateRoute(pickupAddress, e.target.value);
                  }}
                  placeholder="e.g. Miami, FL"
                  className="w-full px-3.5 py-2.5 bg-[#0b0b0e] border border-[#22222a] rounded-xl text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-[#e62329]"
                />
              </div>
            </div>

            {/* Google Maps URL Paste */}
            <div className="pt-1">
              <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                OR Paste Google Maps Directions URL
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Link className="w-3.5 h-3.5 absolute left-3 top-3 text-zinc-500" />
                  <input
                    type="text"
                    value={mapsUrlInput}
                    onChange={(e) => setMapsUrlInput(e.target.value)}
                    placeholder="https://www.google.com/maps/dir/..."
                    className="w-full pl-9 pr-3 py-2 bg-[#0b0b0e] border border-[#22222a] rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#e62329]"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleParseMapsUrl}
                  className="px-4 py-2 bg-[#e62329] text-white text-xs font-black rounded-xl hover:bg-[#cc1b21] transition-colors uppercase"
                >
                  Extract
                </button>
              </div>
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

            {/* Calculated Distance & Driving Logistics Display */}
            <div className="p-4 bg-[#0b0b0e] text-white rounded-2xl border border-[#22222a] grid grid-cols-2 sm:grid-cols-4 gap-4 shadow-lg">
              <div>
                <span className="text-[10px] uppercase font-bold text-zinc-400 block">Distance</span>
                <div className="flex items-center gap-1 mt-0.5">
                  <input
                    type="number"
                    value={distanceMiles}
                    onChange={(e) => setDistanceMiles(Math.max(0, Number(e.target.value)))}
                    className="w-20 font-black text-xl text-[#e62329] bg-transparent border-b border-[#e62329] focus:outline-none"
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
                    className="w-16 font-black text-xl text-white bg-transparent border-b border-zinc-700 focus:outline-none"
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
                  <span className="font-black text-xl text-white">{hotelNights}</span>
                  <span className="text-[10px] text-zinc-400">nights</span>
                </div>
              </div>
            </div>
          </div>

          {/* FR-3 & FR-4: Truck Selection & Provider Comparison Card */}
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
                <label className="block text-xs font-bold text-zinc-300 mb-1.5 uppercase">
                  Number of Trucks Required
                </label>
                <select
                  value={truckCount}
                  onChange={(e) => setTruckCount(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-[#0b0b0e] border border-[#22222a] rounded-xl text-xs font-black text-[#e62329] focus:outline-none focus:ring-2 focus:ring-[#e62329]"
                >
                  <option value={1}>1 Truck</option>
                  <option value={2}>2 Trucks (x2 Multiplier)</option>
                  <option value={3}>3 Trucks (x3 Multiplier)</option>
                  <option value={4}>4 Trucks (x4 Multiplier)</option>
                </select>
              </div>
            </div>

            {/* Provider comparison cards */}
            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs font-bold text-zinc-300 gap-2">
                <span className="uppercase">Rental Provider Rates Comparison:</span>
                <div className="flex gap-2 text-[11px]">
                  <button
                    onClick={() => setProviderOverride('Auto')}
                    className={`px-2.5 py-1 rounded-lg font-bold uppercase transition-all ${providerOverride === 'Auto' ? 'bg-[#e62329] text-white' : 'bg-[#0b0b0e] text-zinc-400'}`}
                  >
                    Auto Select Cheapest
                  </button>
                  <button
                    onClick={() => setProviderOverride('U-Haul')}
                    className={`px-2.5 py-1 rounded-lg font-bold uppercase transition-all ${providerOverride === 'U-Haul' ? 'bg-[#e62329] text-white' : 'bg-[#0b0b0e] text-zinc-400'}`}
                  >
                    U-Haul
                  </button>
                  <button
                    onClick={() => setProviderOverride('Penske')}
                    className={`px-2.5 py-1 rounded-lg font-bold uppercase transition-all ${providerOverride === 'Penske' ? 'bg-[#e62329] text-white' : 'bg-[#0b0b0e] text-zinc-400'}`}
                  >
                    Penske
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* U-Haul card */}
                <div
                  onClick={() => setProviderOverride('U-Haul')}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    selectedProvider === 'U-Haul'
                      ? 'bg-[#0b0b0e] text-white border-[#e62329] ring-2 ring-red-900/40'
                      : 'bg-[#0b0b0e]/60 border-[#22222a] opacity-70'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-xs uppercase tracking-wider">U-Haul Rental</span>
                    {recommended === 'U-Haul' && (
                      <span className="text-[9px] uppercase font-black bg-[#e62329] text-white px-2 py-0.5 rounded-full">
                        Cheapest Rate
                      </span>
                    )}
                  </div>
                  <div className="mt-2 text-2xl font-black text-white">
                    ${uhaulRate.toLocaleString()} <span className="text-xs font-normal text-zinc-400">/truck</span>
                  </div>
                  {truckCount > 1 && (
                    <div className="text-[11px] text-zinc-400 font-semibold mt-1">
                      Total ({truckCount} trucks): ${(uhaulRate * truckCount).toLocaleString()}
                    </div>
                  )}
                </div>

                {/* Penske card */}
                <div
                  onClick={() => setProviderOverride('Penske')}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    selectedProvider === 'Penske'
                      ? 'bg-[#0b0b0e] text-white border-[#e62329] ring-2 ring-red-900/40'
                      : 'bg-[#0b0b0e]/60 border-[#22222a] opacity-70'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-xs uppercase tracking-wider">Penske Rental</span>
                    {recommended === 'Penske' && (
                      <span className="text-[9px] uppercase font-black bg-[#e62329] text-white px-2 py-0.5 rounded-full">
                        Cheapest Rate
                      </span>
                    )}
                  </div>
                  <div className="mt-2 text-2xl font-black text-white">
                    ${penskeRate.toLocaleString()} <span className="text-xs font-normal text-zinc-400">/truck</span>
                  </div>
                  {truckCount > 1 && (
                    <div className="text-[11px] text-zinc-400 font-semibold mt-1">
                      Total ({truckCount} trucks): ${(penskeRate * truckCount).toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

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
                  Loading Labor (${customRates.loadingCost} × {truckCount})
                </span>
                <span className="font-mono font-bold">${breakdown.loadingCost.toLocaleString()}</span>
              </div>

              <div className="flex items-center justify-between text-zinc-300">
                <span className="flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-zinc-400" />
                  Unloading Labor (${customRates.unloadingCost} × {truckCount})
                </span>
                <span className="font-mono font-bold">${breakdown.unloadingCost.toLocaleString()}</span>
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
