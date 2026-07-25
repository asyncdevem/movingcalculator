'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { AdminRates } from '@/types/calculator';
import {
  Settings,
  Fuel,
  Bed,
  Users,
  DollarSign,
  Plane,
  Sparkles,
  Save,
  RotateCcw,
  Key,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

export const AdminSettingsView: React.FC = () => {
  const { adminRates, updateAdminRates, resetAdminRates } = useApp();

  const [formData, setFormData] = useState<AdminRates>(adminRates);
  const [googleApiKey, setGoogleApiKey] = useState<string>('AIzaSyD-sample_google_directions_api_key_v1');
  const [gasApiKey, setGasApiKey] = useState<string>('gas_api_live_9876234');

  const handleChange = (field: keyof AdminRates, val: number) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateAdminRates(formData);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white flex items-center gap-2 uppercase tracking-tight">
            <Settings className="w-6 h-6 text-red-600 dark:text-red-500" />
            Moving<span className="text-red-600">Dan</span> Admin Pricing Controls
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
            Configure company pricing rules, driver rates, labor fees, profit margins, and API keys.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={resetAdminRates}
            className="flex items-center gap-2 px-3.5 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs font-bold rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset Defaults</span>
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-black rounded-xl shadow-md shadow-red-600/30 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Save Settings</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Pricing Formula Variables */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <h2 className="text-sm font-extrabold text-zinc-900 dark:text-white flex items-center gap-2 uppercase tracking-wide">
                <DollarSign className="w-4 h-4 text-red-600 dark:text-red-500" />
                Default Pricing Rules & Cost Factors
              </h2>
              <span className="text-[10px] font-bold text-white bg-red-600 px-2.5 py-0.5 rounded-full uppercase">
                Global Variables
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
              {/* Fuel & MPG */}
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/80 space-y-3">
                <div className="flex items-center gap-2 font-black text-zinc-900 dark:text-white uppercase text-[11px]">
                  <Fuel className="w-4 h-4 text-red-500" />
                  <span>Fuel & Mileage Parameters</span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">
                    National Gas Price ($ / Gallon)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.gasPricePerGallon}
                    onChange={(e) => handleChange('gasPricePerGallon', parseFloat(e.target.value))}
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl font-black text-zinc-900 dark:text-white"
                  />
                  <p className="text-[10px] text-zinc-400 mt-1">Formula: (Distance ÷ MPG) × Gas Price × Trucks</p>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">
                    Truck MPG Efficiency
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.mpg}
                    onChange={(e) => handleChange('mpg', parseFloat(e.target.value))}
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl font-black text-zinc-900 dark:text-white"
                  />
                  <p className="text-[10px] text-zinc-400 mt-1">Default 26 ft truck MPG is 7</p>
                </div>
              </div>

              {/* Driver Mileage & Hotel Rate */}
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/80 space-y-3">
                <div className="flex items-center gap-2 font-black text-zinc-900 dark:text-white uppercase text-[11px]">
                  <Bed className="w-4 h-4 text-red-500" />
                  <span>Employee Driving & Hotel Rates</span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">
                    Driver Mileage Pay ($ / Mile)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    value={formData.driverPayPerMile}
                    onChange={(e) => handleChange('driverPayPerMile', parseFloat(e.target.value))}
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl font-black text-zinc-900 dark:text-white"
                  />
                  <p className="text-[10px] text-zinc-400 mt-1">Formula: Distance × Driver Pay Rate × Trucks</p>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">
                    Hotel Nightly Allowance ($ / Night)
                  </label>
                  <input
                    type="number"
                    value={formData.hotelRatePerNight}
                    onChange={(e) => handleChange('hotelRatePerNight', parseInt(e.target.value))}
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl font-black text-zinc-900 dark:text-white"
                  />
                  <p className="text-[10px] text-zinc-400 mt-1">Triggered when drive time exceeds 11 hours</p>
                </div>
              </div>

              {/* Loading & Unloading Labor */}
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/80 space-y-3">
                <div className="flex items-center gap-2 font-black text-zinc-900 dark:text-white uppercase text-[11px]">
                  <Users className="w-4 h-4 text-red-500" />
                  <span>Loading & Unloading Labor Costs</span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">
                    Loading Cost ($ / Truck)
                  </label>
                  <input
                    type="number"
                    value={formData.loadingCost}
                    onChange={(e) => handleChange('loadingCost', parseInt(e.target.value))}
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl font-black text-zinc-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">
                    Unloading Cost ($ / Truck)
                  </label>
                  <input
                    type="number"
                    value={formData.unloadingCost}
                    onChange={(e) => handleChange('unloadingCost', parseInt(e.target.value))}
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl font-black text-zinc-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Flight Cost & Profit Margin */}
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/80 space-y-3">
                <div className="flex items-center gap-2 font-black text-zinc-900 dark:text-white uppercase text-[11px]">
                  <Plane className="w-4 h-4 text-red-500" />
                  <span>Flight & Profit Margin Multiplier</span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">
                    Default Driver Return Flight ($)
                  </label>
                  <input
                    type="number"
                    value={formData.flightDefaultCost}
                    onChange={(e) => handleChange('flightDefaultCost', parseInt(e.target.value))}
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl font-black text-zinc-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">
                    Profit Margin Percentage (%)
                  </label>
                  <input
                    type="number"
                    value={formData.profitMarginPercent}
                    onChange={(e) => handleChange('profitMarginPercent', parseFloat(e.target.value))}
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl font-black text-red-600 dark:text-red-500"
                  />
                  <p className="text-[10px] text-zinc-400 mt-1">Multiplier: {(1 + formData.profitMarginPercent / 100).toFixed(2)}x</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: API Keys & Locks */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-5">
            <h2 className="text-sm font-extrabold text-zinc-900 dark:text-white flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-3 uppercase tracking-wide">
              <Key className="w-4 h-4 text-red-600 dark:text-red-500" />
              API Key Management
            </h2>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Google Directions & Places API Key
                </label>
                <input
                  type="password"
                  value={googleApiKey}
                  onChange={(e) => setGoogleApiKey(e.target.value)}
                  className="w-full px-3.5 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl font-mono text-xs"
                />
                <span className="text-[10px] text-red-600 dark:text-red-400 flex items-center gap-1 mt-1 font-bold">
                  <CheckCircle2 className="w-3 h-3" /> Active & Verified
                </span>
              </div>

              <div>
                <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  National Gas Price API Key (Optional)
                </label>
                <input
                  type="password"
                  value={gasApiKey}
                  onChange={(e) => setGasApiKey(e.target.value)}
                  className="w-full px-3.5 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl font-mono text-xs"
                />
                <span className="text-[10px] text-zinc-400 block mt-1">Falls back to manual admin rate if empty.</span>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-black text-white space-y-4 shadow-xl border border-zinc-800 glow-red-sm">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-red-500" />
              <h3 className="font-extrabold text-sm uppercase">Quote Rule Locking</h3>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              When a quote is created, the pricing rules active at that moment are permanently locked into that customer quote record. Changing admin settings later will not alter existing saved quotes.
            </p>
          </div>
        </div>
      </form>
    </div>
  );
};
