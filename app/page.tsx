'use client';

import React from 'react';
import { AppProvider, useApp } from '@/context/AppContext';
import { Navbar } from '@/components/Navbar';
import { DashboardView } from '@/components/DashboardView';
import { NewQuoteView } from '@/components/NewQuoteView';
import { SavedQuotesView } from '@/components/SavedQuotesView';
import { CustomersView } from '@/components/CustomersView';
import { AdminSettingsView } from '@/components/AdminSettingsView';
import { QuoteModal } from '@/components/QuoteModal';

function MainApp() {
  const { currentView } = useApp();

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0b0e] text-white font-sans antialiased">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'dashboard' && <DashboardView />}
        {currentView === 'new-quote' && <NewQuoteView />}
        {currentView === 'saved-quotes' && <SavedQuotesView />}
        {currentView === 'customers' && <CustomersView />}
        {currentView === 'admin' && <AdminSettingsView />}
      </main>

      <footer className="border-t border-[#22222a] bg-[#0b0b0e] py-6 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-400">
          <div>
            &copy; {new Date().getFullYear()} <strong className="text-white">DAN - <span className="text-[#e62329]">THE MOVING MAN</span></strong>. Compliance & Long Distance Quote Portal.
          </div>
          <div className="flex items-center gap-4 font-bold">
            <span>Version 1.0</span>
            <span>•</span>
            <span className="text-[#e62329]">100% Mobile Responsive</span>
          </div>
        </div>
      </footer>

      {/* Printable Invoice Modal */}
      <QuoteModal />
    </div>
  );
}

export default function Page() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}
