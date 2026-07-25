'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { QuoteRecord } from '@/types/calculator';
import {
  FileText,
  Search,
  PlusCircle,
  Printer,
  Copy,
  Trash2,
  CheckCircle2,
  Download,
} from 'lucide-react';

export const SavedQuotesView: React.FC = () => {
  const {
    savedQuotes,
    setView,
    setActiveQuoteForPrint,
    duplicateQuote,
    deleteQuote,
    updateQuoteStatus,
    showNotification,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  const filteredQuotes = savedQuotes.filter((quote) => {
    const matchesSearch =
      quote.quoteNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.route.pickupAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.route.deliveryAddress.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'All' || quote.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleExportCSV = () => {
    if (savedQuotes.length === 0) return;
    const headers = ['Quote Number', 'Date', 'Customer', 'Phone', 'Pickup', 'Delivery', 'Miles', 'Trucks', 'Grand Total', 'Status'];
    const rows = savedQuotes.map((q) => [
      q.quoteNumber,
      new Date(q.createdAt).toLocaleDateString(),
      `"${q.customer.name}"`,
      q.customer.phone,
      `"${q.route.pickupAddress}"`,
      `"${q.route.deliveryAddress}"`,
      q.route.distanceMiles,
      q.truck.count,
      q.breakdown.grandTotal,
      q.status,
    ]);

    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `movingdan_quotes_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification('Exported quotes to CSV successfully!');
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white flex items-center gap-2 uppercase tracking-tight">
            <FileText className="w-6 h-6 text-red-600 dark:text-red-500" />
            Moving<span className="text-red-600">Dan</span> Saved Quotes
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
            Search, filter by status, duplicate, and export historical quote records.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3.5 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs font-bold rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
          >
            <Download className="w-4 h-4 text-red-600" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => setView('new-quote')}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-black rounded-xl shadow-md shadow-red-600/30 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Quote</span>
          </button>
        </div>
      </div>

      {/* Controls Bar: Search & Status Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-zinc-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by quote #, customer, city..."
            className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {['All', 'Draft', 'Sent', 'Accepted', 'Declined'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                statusFilter === status
                  ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Quotes Table with responsive wrapper */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        {filteredQuotes.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <FileText className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto" />
            <h3 className="text-base font-bold text-zinc-900 dark:text-white">No quotes found</h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              Try adjusting your search criteria or create a new quote.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[640px]">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-800/60 text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Quote # & Date</th>
                  <th className="py-3.5 px-4">Customer Info</th>
                  <th className="py-3.5 px-4">Route Specs</th>
                  <th className="py-3.5 px-4">Fleet Allocated</th>
                  <th className="py-3.5 px-4">Quote Total</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-xs">
                {filteredQuotes.map((quote) => (
                  <tr key={quote.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors">
                    <td className="py-4 px-4">
                      <div className="font-mono font-black text-red-600 dark:text-red-400">{quote.quoteNumber}</div>
                      <div className="text-[10px] text-zinc-400">{new Date(quote.createdAt).toLocaleDateString()}</div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="font-bold text-zinc-900 dark:text-white">{quote.customer.name}</div>
                      <div className="text-[10px] text-zinc-500">{quote.customer.phone}</div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="font-bold text-zinc-800 dark:text-zinc-200">
                        {quote.route.pickupAddress} &rarr; {quote.route.deliveryAddress}
                      </div>
                      <div className="text-[10px] text-zinc-500">
                        {quote.route.distanceMiles} miles • {quote.route.drivingDays} driving days ({quote.route.hotelNights} hotel night/s)
                      </div>
                    </td>

                    <td className="py-4 px-4 text-zinc-700 dark:text-zinc-300 font-medium">
                      {quote.truck.count}x {quote.truck.type} ({quote.truck.selectedProvider})
                    </td>

                    <td className="py-4 px-4 font-black text-sm text-zinc-900 dark:text-white">
                      ${quote.breakdown.grandTotal.toLocaleString()}
                    </td>

                    <td className="py-4 px-4">
                      <select
                        value={quote.status}
                        onChange={(e) => updateQuoteStatus(quote.id, e.target.value as QuoteRecord['status'])}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black focus:outline-none cursor-pointer border ${
                          quote.status === 'Accepted'
                            ? 'bg-red-600 text-white border-red-600'
                            : quote.status === 'Sent'
                            ? 'bg-zinc-900 text-white border-zinc-800 dark:bg-zinc-100 dark:text-zinc-900'
                            : 'bg-zinc-100 text-zinc-700 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-300'
                        }`}
                      >
                        <option value="Draft">Draft</option>
                        <option value="Sent">Sent</option>
                        <option value="Accepted">Accepted</option>
                        <option value="Declined">Declined</option>
                      </select>
                    </td>

                    <td className="py-4 px-4 text-right space-x-1.5">
                      <button
                        onClick={() => setActiveQuoteForPrint(quote)}
                        className="p-1.5 text-zinc-600 dark:text-zinc-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                        title="Print / View Invoice"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => duplicateQuote(quote.id)}
                        className="p-1.5 text-zinc-600 dark:text-zinc-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                        title="Duplicate Quote"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteQuote(quote.id)}
                        className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg transition-colors"
                        title="Delete Quote"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
