'use client';

import React from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { POPULAR_ROUTES } from '@/lib/calculator-engine';
import {
  MapPin,
  ArrowRight,
  PlusCircle,
  Clock,
  CheckCircle2,
  Shield,
  Printer,
  Copy,
  ChevronRight,
} from 'lucide-react';

export const DashboardView: React.FC = () => {
  const { savedQuotes, setActiveQuoteForPrint, duplicateQuote } = useApp();

  return (
    <div className="space-y-10 animate-fadeIn">
      {/* Top Hero Section matching Reference UI Screenshot */}
      <div className="text-center space-y-6 py-6 sm:py-10 max-w-4xl mx-auto">
        {/* Pill Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-extrabold text-[#e62329] dan-pill-badge uppercase tracking-wider">
          <Shield className="w-4 h-4 text-[#e62329]" />
          <span>LONG DISTANCE MOVE CALCULATOR PORTAL</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white uppercase leading-none">
          WELCOME TO YOUR
          <span className="block text-[#e62329] mt-2">MOVING CALCULATOR</span>
        </h1>

        {/* Hero Description */}
        <p className="text-sm sm:text-base text-zinc-400 font-medium max-w-2xl mx-auto leading-relaxed">
          Generate accurate long-distance moving quotes in seconds. Driving hours, truck rental rates, fuel costs, hotel stays, employee pay, and profit margins are calculated automatically.
        </p>

        {/* Hero CTA buttons */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/new-quote"
            className="flex items-center gap-2.5 px-6 py-3.5 bg-[#e62329] hover:bg-[#cc1b21] text-white text-xs font-black rounded-2xl shadow-xl shadow-red-900/40 transition-all transform hover:-translate-y-0.5 uppercase tracking-wide"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create New Quote</span>
          </Link>
          <Link
            href="/admin"
            className="flex items-center gap-2 px-5 py-3.5 bg-[#141419] hover:bg-[#1f1f27] text-white text-xs font-bold rounded-2xl border border-[#22222a] transition-colors uppercase tracking-wide"
          >
            <span>Manage Admin Settings</span>
          </Link>
        </div>
      </div>

      {/* Quick Launch Popular Routes */}
      <div className="bg-[#141419] p-6 sm:p-8 rounded-3xl border border-[#22222a] shadow-lg space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-black text-white flex items-center gap-2 uppercase tracking-wide">
              <MapPin className="w-4 h-4 text-[#e62329]" />
              Quick Launch Benchmark Routes
            </h2>
            <p className="text-xs text-zinc-400 font-medium">
              Click any route to generate an estimate instantly with live pricing formulas
            </p>
          </div>
          <Link
            href="/new-quote"
            className="text-xs font-bold text-[#e62329] hover:underline flex items-center gap-1 uppercase"
          >
            Custom Route <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {POPULAR_ROUTES.slice(0, 4).map((route, idx) => (
            <Link
              key={idx}
              href="/new-quote"
              className="group p-4 rounded-2xl bg-[#0b0b0e] border border-[#22222a] hover:border-[#e62329] hover:shadow-md cursor-pointer transition-all space-y-2"
            >
              <div className="flex items-center justify-between text-xs font-bold text-white">
                <span className="truncate">{route.pickup}</span>
                <ArrowRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-[#e62329] transition-colors shrink-0 mx-1" />
                <span className="truncate">{route.delivery}</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-zinc-400 font-medium">
                <span>{route.miles} miles</span>
                <span>~{route.hours} hrs drive</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Quotes Table */}
      <div className="bg-[#141419] rounded-3xl border border-[#22222a] shadow-lg overflow-hidden space-y-0">
        <div className="p-6 border-b border-[#22222a] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-black text-white flex items-center gap-2 uppercase tracking-wide">
              <Clock className="w-4 h-4 text-[#e62329]" />
              Recent Customer Quotes
            </h2>
            <p className="text-xs text-zinc-400 font-medium">
              Manage saved estimates, duplicate, or generate customer PDFs
            </p>
          </div>
          <Link
            href="/quotes"
            className="text-xs font-bold text-[#e62329] hover:underline flex items-center gap-1 uppercase"
          >
            View All Quotes <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[640px]">
            <thead>
              <tr className="bg-[#0b0b0e] text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                <th className="py-3.5 px-4">Quote #</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Route</th>
                <th className="py-3.5 px-4">Trucks</th>
                <th className="py-3.5 px-4">Grand Total</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#22222a] text-xs">
              {savedQuotes.slice(0, 5).map((quote) => (
                <tr key={quote.id} className="hover:bg-[#1f1f27] transition-colors">
                  <td className="py-3.5 px-4 font-mono font-black text-[#e62329]">
                    {quote.quoteNumber}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-white">
                    <div>{quote.customer.name}</div>
                    <div className="text-[10px] text-zinc-400 font-normal">{quote.customer.phone}</div>
                  </td>
                  <td className="py-3.5 px-4 text-zinc-300">
                    <div className="font-semibold">{quote.route.pickupAddress} &rarr; {quote.route.deliveryAddress}</div>
                    <div className="text-[10px] text-zinc-400">{quote.route.distanceMiles} mi ({quote.route.drivingDays} days)</div>
                  </td>
                  <td className="py-3.5 px-4 text-zinc-300 font-medium">
                    {quote.truck.count}x {quote.truck.type} ({quote.truck.selectedProvider})
                  </td>
                  <td className="py-3.5 px-4 font-black text-sm text-white">
                    ${quote.breakdown.grandTotal.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        quote.status === 'Accepted'
                          ? 'bg-[#e62329] text-white'
                          : quote.status === 'Sent'
                          ? 'bg-[#1f1f27] text-white border border-zinc-700'
                          : 'bg-[#141419] text-zinc-400 border border-zinc-800'
                      }`}
                    >
                      {quote.status === 'Accepted' && <CheckCircle2 className="w-3 h-3" />}
                      {quote.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-2">
                    <button
                      onClick={() => setActiveQuoteForPrint(quote)}
                      className="p-1.5 text-zinc-300 hover:text-[#e62329] hover:bg-[#141419] rounded-lg transition-colors"
                      title="Print / View Invoice"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => duplicateQuote(quote.id)}
                      className="p-1.5 text-zinc-300 hover:text-[#e62329] hover:bg-[#141419] rounded-lg transition-colors"
                      title="Duplicate Quote"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
