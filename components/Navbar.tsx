'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import {
  Truck,
  PlusCircle,
  FileText,
  Users,
  Settings,
  LayoutDashboard,
  Sun,
  Moon,
  CheckCircle2,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const {
    adminRates,
    isDarkMode,
    toggleDarkMode,
    notification,
  } = useApp();

  // Navigation items mapped to routes
  const navItems: { href: string; label: string; icon: React.ReactNode }[] = [
    { href: '/', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { href: '/new-quote', label: 'Calculator', icon: <PlusCircle className="w-4 h-4" /> },
    { href: '/quotes', label: 'Saved Quotes', icon: <FileText className="w-4 h-4" /> },
    { href: '/customers', label: 'Customers', icon: <Users className="w-4 h-4" /> },
    { href: '/admin', label: 'Admin', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#22222a] bg-[#0b0b0e]/95 backdrop-blur-md no-print">
      {/* Toast notification banner */}
      {notification && (
        <div className="bg-[#e62329] text-white text-xs py-1.5 px-4 font-medium flex items-center justify-center gap-2 animate-fadeIn shadow-md">
          <CheckCircle2 className="w-4 h-4" />
          <span>{notification}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          {/* Logo & Branding */}
          <Link href="/" className="flex items-center gap-3 cursor-pointer shrink-0">
            <div className="bg-[#141419] p-2.5 rounded-xl border border-red-900/40 text-[#e62329] shadow-md shadow-red-900/20">
              <Truck className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 text-base sm:text-lg font-black tracking-tight whitespace-nowrap">
                <span className="text-white">DAN -</span>
                <span className="text-[#e62329] uppercase">THE MOVING MAN</span>
              </div>
              <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider whitespace-nowrap">
                LONG DISTANCE CALCULATOR PORTAL
              </p>
            </div>
          </Link>

          {/* Desktop Center Navigation Bar */}
          <nav className="hidden lg:flex items-center gap-2 bg-[#141419] p-1.5 rounded-2xl border border-[#22222a] mx-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 whitespace-nowrap ${
                    isActive
                      ? 'bg-[#e62329] text-white shadow-md shadow-red-900/30 font-black'
                      : 'text-zinc-400 hover:text-white hover:bg-[#1f1f27]'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Header Actions */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Live Pricing Stats pill */}
            <div className="hidden sm:flex items-center gap-3 text-xs bg-[#141419] border border-[#22222a] px-3.5 py-2 rounded-xl text-zinc-300">
              <span>
                Gas: <strong className="text-white">${adminRates.gasPricePerGallon.toFixed(2)}</strong>/gal
              </span>
              <span className="text-zinc-700">|</span>
              <span>
                Margin: <strong className="text-[#e62329]">{adminRates.profitMarginPercent}%</strong>
              </span>
            </div>

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2.5 rounded-xl border border-[#22222a] text-zinc-300 hover:bg-[#1f1f27] transition-colors"
              title="Toggle theme"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-zinc-300" />}
            </button>

            {/* Primary Action Button */}
            <Link
              href="/new-quote"
              className="flex items-center gap-2 px-4 sm:px-5 py-2.5 bg-[#e62329] hover:bg-[#cc1b21] text-white rounded-xl text-xs font-black shadow-md shadow-red-900/30 hover:shadow-lg transition-all uppercase tracking-wide whitespace-nowrap"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create Quote</span>
            </Link>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="flex lg:hidden items-center justify-around py-2.5 border-t border-[#22222a]">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 text-[10px] font-bold ${
                pathname === item.href
                  ? 'text-[#e62329]'
                  : 'text-zinc-400'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
};
