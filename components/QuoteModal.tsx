'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { Truck, Printer, X, CheckCircle, MapPin, Calendar, User, Phone, Mail } from 'lucide-react';

export const QuoteModal: React.FC = () => {
  const { activeQuoteForPrint, setActiveQuoteForPrint, updateQuoteStatus } = useApp();

  // Handle ESC key to close modal
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && activeQuoteForPrint) {
        setActiveQuoteForPrint(null);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [activeQuoteForPrint, setActiveQuoteForPrint]);

  if (!activeQuoteForPrint) return null;

  const quote = activeQuoteForPrint;
  const issueDate = new Date(quote.createdAt).toLocaleDateString();
  const validUntil = new Date(new Date(quote.createdAt).getTime() + 30 * 86400000).toLocaleDateString();

  const handleTriggerPrint = () => {
    // Small delay to ensure styles are applied
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const handleDownloadPDF = () => {
    // Trigger print dialog which allows "Save as PDF"
    handleTriggerPrint();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto animate-fadeIn no-print-backdrop">
      <div className="relative w-full max-w-4xl bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden my-8 print-card">
        {/* Modal Toolbar (hidden when printing) */}
        <div className="no-print space-y-0">
          <div className="flex items-center justify-between px-6 py-4 bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono font-black text-red-600 dark:text-red-500 bg-red-50 dark:bg-red-950/80 px-3 py-1 rounded-xl border border-red-200 dark:border-red-900">
                {quote.quoteNumber}
              </span>
              <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider">MovingDan Customer Quote</span>
            </div>

            <div className="flex items-center gap-2">
              {quote.status !== 'Accepted' && (
                <button
                  onClick={() => updateQuoteStatus(quote.id, 'Accepted')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl text-xs font-bold transition-colors hover:bg-zinc-800 dark:hover:bg-zinc-200"
                >
                  <CheckCircle className="w-3.5 h-3.5 text-red-500" />
                  Mark Accepted
                </button>
              )}
              <button
                onClick={handleTriggerPrint}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md transition-all print-button"
                title="Print or Save as PDF (Ctrl/Cmd + P)"
              >
                <Printer className="w-3.5 h-3.5" />
                Print / Save PDF
              </button>
              <button
                onClick={() => setActiveQuoteForPrint(null)}
                className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-xl hover:bg-zinc-200/50 dark:hover:bg-zinc-800 transition-colors"
                title="Close (ESC)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* PDF Instructions Banner */}
          <div className="px-6 py-3 bg-blue-50 dark:bg-blue-950/30 border-b border-blue-200 dark:border-blue-900">
            <p className="text-xs text-blue-800 dark:text-blue-300 font-medium">
              <span className="font-bold">💡 Save as PDF:</span> Click "Print / Save PDF" → Select "Save as PDF" or "Microsoft Print to PDF" as the printer → Click Save
            </p>
          </div>
        </div>

        {/* PRINTABLE DOCUMENT BODY */}
        <div className="p-8 sm:p-10 space-y-8 print:p-0">
          {/* Header & Logo */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-red-600 text-white rounded-xl">
                  <Truck className="w-6 h-6" />
                </div>
                <span className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white uppercase">
                  Moving<span className="text-red-600">Dan</span> Calculator
                </span>
              </div>
              <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Long Distance Relocation Specialists</p>
              <p className="text-xs text-zinc-500">100 MovingDan Way • Phone: (800) 555-MDAN</p>
            </div>

            <div className="text-left sm:text-right space-y-1">
              <h2 className="text-xl font-black text-red-600 dark:text-red-500 uppercase tracking-wider">
                Official Move Estimate
              </h2>
              <div className="text-xs font-mono text-zinc-600 dark:text-zinc-400">
                <strong>Quote #:</strong> {quote.quoteNumber}
              </div>
              <div className="text-xs text-zinc-600 dark:text-zinc-400">
                <strong>Issue Date:</strong> {issueDate}
              </div>
              <div className="text-xs text-zinc-600 dark:text-zinc-400">
                <strong>Valid Until:</strong> {validUntil}
              </div>
            </div>
          </div>

          {/* Customer & Route Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
            <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2">
              <h3 className="font-extrabold text-red-600 dark:text-red-500 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" /> Customer Details
              </h3>
              <div className="font-extrabold text-sm text-zinc-900 dark:text-white">{quote.customer.name}</div>
              <div className="text-zinc-600 dark:text-zinc-300 flex items-center gap-1.5">
                <Phone className="w-3 h-3 text-zinc-400" /> {quote.customer.phone}
              </div>
              <div className="text-zinc-600 dark:text-zinc-300 flex items-center gap-1.5">
                <Mail className="w-3 h-3 text-zinc-400" /> {quote.customer.email}
              </div>
              <div className="text-zinc-600 dark:text-zinc-300 flex items-center gap-1.5 pt-1">
                <Calendar className="w-3 h-3 text-zinc-400" /> Scheduled Move Date: <strong>{quote.customer.moveDate}</strong>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2">
              <h3 className="font-extrabold text-red-600 dark:text-red-500 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" /> Route & Fleet Schedule
              </h3>
              <div className="font-bold text-zinc-900 dark:text-white">
                {quote.route.pickupAddress} &rarr; {quote.route.deliveryAddress}
              </div>
              <div className="text-zinc-600 dark:text-zinc-300">
                Total Distance: <strong>{quote.route.distanceMiles} miles</strong> (~{quote.route.durationHours} hrs)
              </div>
              <div className="text-zinc-600 dark:text-zinc-300">
                Logistics Schedule: <strong>{quote.route.drivingDays} driving days</strong> ({quote.route.hotelNights} hotel night/s)
              </div>
              <div className="text-zinc-600 dark:text-zinc-300">
                Fleet Allocated: <strong>{quote.truck.count}x {quote.truck.type}</strong> ({quote.truck.selectedProvider})
              </div>
            </div>
          </div>

          {/* Itemized Cost Breakdown Table */}
          <div className="space-y-3">
            <h3 className="text-xs font-black text-zinc-900 dark:text-white uppercase tracking-wider">
              Itemized Pricing Breakdown
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs min-w-[500px]">
                <thead>
                  <tr className="bg-zinc-950 text-white font-bold border-b border-zinc-800">
                    <th className="py-3 px-4">Service / Component</th>
                    <th className="py-3 px-4">Calculation Details</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-zinc-700 dark:text-zinc-300">
                  <tr>
                    <td className="py-3 px-4 font-bold">Truck Rental ({quote.truck.selectedProvider})</td>
                    <td className="py-3 px-4 text-zinc-500">
                      {quote.truck.count}x {quote.truck.type} @ ${(quote.breakdown.truckRentalCost / quote.truck.count).toLocaleString()}/truck
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold">${quote.breakdown.truckRentalCost.toLocaleString()}</td>
                  </tr>

                  <tr>
                    <td className="py-3 px-4 font-bold">Employee Driving Pay</td>
                    <td className="py-3 px-4 text-zinc-500">
                      {quote.route.distanceMiles} miles × ${quote.ratesUsed.driverPayPerMile.toFixed(2)}/mi × {quote.truck.count} truck(s)
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold">${quote.breakdown.driverPay.toLocaleString()}</td>
                  </tr>

                  <tr>
                    <td className="py-3 px-4 font-bold">Fuel Expenses</td>
                    <td className="py-3 px-4 text-zinc-500">
                      {quote.ratesUsed.mpg} MPG @ ${quote.ratesUsed.gasPricePerGallon.toFixed(2)}/gal
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold">${quote.breakdown.fuelCost.toLocaleString()}</td>
                  </tr>

                  <tr>
                    <td className="py-3 px-4 font-bold">Driver Hotel Accommodations</td>
                    <td className="py-3 px-4 text-zinc-500">
                      {quote.route.hotelNights} night(s) @ ${quote.ratesUsed.hotelRatePerNight}/night × {quote.truck.count} truck(s)
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold">${quote.breakdown.hotelCost.toLocaleString()}</td>
                  </tr>

                  <tr>
                    <td className="py-3 px-4 font-bold">Loading & Unloading Labor</td>
                    <td className="py-3 px-4 text-zinc-500">
                      Loading (${quote.ratesUsed.loadingCost}) + Unloading (${quote.ratesUsed.unloadingCost}) × {quote.truck.count}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold">${quote.breakdown.laborCost.toLocaleString()}</td>
                  </tr>

                  <tr>
                    <td className="py-3 px-4 font-bold">Driver Return Flight Allowance</td>
                    <td className="py-3 px-4 text-zinc-500">Standard airfare return ticket per crew</td>
                    <td className="py-3 px-4 text-right font-mono font-bold">${quote.breakdown.flightCost.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Subtotal & Grand Total Box */}
          <div className="flex flex-col sm:flex-row justify-between items-end gap-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <div className="text-xs text-zinc-500 space-y-1 max-w-md">
              <p><strong>Note:</strong> Quote price includes full transport insurance, door-to-door loading, unloading, and fuel fees.</p>
              <p>Payment terms: 50% deposit required upon confirmation, remaining 50% upon delivery.</p>
            </div>

            <div className="w-full sm:w-80 bg-zinc-950 text-white p-5 rounded-2xl border border-zinc-800 space-y-2 text-xs shadow-xl">
              <div className="flex justify-between text-zinc-400">
                <span>Subtotal Costs:</span>
                <span className="font-mono font-bold text-white">${quote.breakdown.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-red-400">
                <span>Profit & Overhead:</span>
                <span className="font-mono font-bold">+${quote.breakdown.profitAmount.toLocaleString()}</span>
              </div>
              <div className="pt-2 border-t border-zinc-800 flex justify-between items-center text-white">
                <span className="font-black text-sm uppercase">Grand Total Quote:</span>
                <span className="font-mono font-black text-xl text-red-500">
                  ${quote.breakdown.grandTotal.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Signature Line */}
          <div className="pt-8 border-t border-zinc-200 dark:border-zinc-800 grid grid-cols-2 gap-8 text-xs">
            <div className="space-y-6">
              <p className="font-bold text-zinc-600 dark:text-zinc-400">Authorized Sales Representative Signature:</p>
              <div className="border-b border-zinc-400 dark:border-zinc-600 w-48"></div>
              <p className="text-[10px] text-zinc-400">MovingDan Quote Specialist</p>
            </div>

            <div className="space-y-6 text-right">
              <p className="font-bold text-zinc-600 dark:text-zinc-400">Customer Acceptance Signature:</p>
              <div className="border-b border-zinc-400 dark:border-zinc-600 w-48 ml-auto"></div>
              <p className="text-[10px] text-zinc-400">Date: ________________________</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
