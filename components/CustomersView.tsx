'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { Users, Phone, Mail, Calendar, PlusCircle, Search, ArrowRight } from 'lucide-react';

export const CustomersView: React.FC = () => {
  const { savedQuotes, setActiveQuoteForPrint } = useApp();
  const [searchTerm, setSearchTerm] = useState('');

  const customersMap = new Map<string, {
    name: string;
    phone: string;
    email: string;
    quotes: typeof savedQuotes;
    totalSpent: number;
    lastMoveDate: string;
  }>();

  savedQuotes.forEach((quote) => {
    const key = (quote.customer.name || 'Unknown').toLowerCase();
    if (!customersMap.has(key)) {
      customersMap.set(key, {
        name: quote.customer.name,
        phone: quote.customer.phone,
        email: quote.customer.email,
        quotes: [quote],
        totalSpent: quote.status === 'Accepted' ? quote.breakdown.grandTotal : 0,
        lastMoveDate: quote.customer.moveDate,
      });
    } else {
      const existing = customersMap.get(key)!;
      existing.quotes.push(quote);
      if (quote.status === 'Accepted') {
        existing.totalSpent += quote.breakdown.grandTotal;
      }
    }
  });

  const customerList = Array.from(customersMap.values()).filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm)
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white flex items-center gap-2 uppercase tracking-tight">
            <Users className="w-6 h-6 text-red-600 dark:text-red-500" />
            Moving<span className="text-red-600">Dan</span> Customer Directory
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
            Customer profiles, move schedules, total bookings, and quote history.
          </p>
        </div>

        <Link
          href="/new-quote"
          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-black rounded-xl shadow-md shadow-red-600/30 transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Quote</span>
        </Link>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-zinc-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search customers by name, email, phone..."
            className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>
      </div>

      {/* Customer Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {customerList.map((customer, idx) => (
          <div
            key={idx}
            className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-red-600 text-white font-black flex items-center justify-center text-base shadow-md shadow-red-600/30">
                    {customer.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-zinc-900 dark:text-white">{customer.name}</h3>
                    <span className="text-[10px] font-bold text-zinc-400">{customer.quotes.length} Quote(s)</span>
                  </div>
                </div>

                <span className="text-xs font-mono font-black text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/80 px-2.5 py-1 rounded-xl border border-red-200 dark:border-red-900">
                  ${customer.totalSpent.toLocaleString()}
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-zinc-600 dark:text-zinc-300 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-zinc-400" />
                  <span>{customer.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-zinc-400" />
                  <span>{customer.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Move Date: {customer.lastMoveDate}</span>
                </div>
              </div>

              {/* Past Quote badges */}
              <div className="pt-2">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">Quote History</span>
                <div className="space-y-1.5">
                  {customer.quotes.map((q) => (
                    <div
                      key={q.id}
                      onClick={() => setActiveQuoteForPrint(q)}
                      className="p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-700/60 flex items-center justify-between text-xs cursor-pointer hover:border-red-500 transition-colors"
                    >
                      <span className="font-mono text-red-600 dark:text-red-400 font-black text-[11px]">
                        {q.quoteNumber}
                      </span>
                      <span className="font-bold text-zinc-900 dark:text-white">${q.breakdown.grandTotal.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <Link
              href="/new-quote"
              className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2 mt-4"
            >
              <span>Create Quote for {customer.name.split(' ')[0]}</span>
              <ArrowRight className="w-3.5 h-3.5 text-red-500" />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};
