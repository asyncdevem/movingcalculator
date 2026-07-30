'use client';

import React from 'react';
import { Scale, Users, Clock, Truck, AlertCircle } from 'lucide-react';
import {
  calculateTrucksNeededFromWeight,
  calculateLoadUnloadHours,
  POUNDS_PER_TRUCK,
  POUNDS_PER_MOVER_PER_HOUR,
} from '@/lib/calculator-engine';

interface WeightCalculatorProps {
  totalWeight: number;
  numberOfMovers: number;
  onWeightChange: (weight: number) => void;
  onMoverCountChange: (count: number) => void;
  onCalculationUpdate: (trucks: number, loadHours: number, unloadHours: number) => void;
}

export const WeightCalculator: React.FC<WeightCalculatorProps> = ({
  totalWeight,
  numberOfMovers,
  onWeightChange,
  onMoverCountChange,
  onCalculationUpdate,
}) => {
  const trucksNeeded = calculateTrucksNeededFromWeight(totalWeight);
  const { loadHours, unloadHours, totalLaborHours } = calculateLoadUnloadHours(
    totalWeight,
    numberOfMovers
  );

  // Update parent when calculations change
  React.useEffect(() => {
    if (totalWeight > 0) {
      onCalculationUpdate(trucksNeeded, loadHours, unloadHours);
    }
  }, [totalWeight, numberOfMovers, trucksNeeded, loadHours, unloadHours, onCalculationUpdate]);

  const isHeavyLoad = totalWeight > 32000; // More than 4 trucks worth
  const isManyTrucks = trucksNeeded >= 3;

  return (
    <div className="bg-[#141419] p-6 sm:p-8 rounded-3xl border border-[#22222a] shadow-lg space-y-5">
      <div className="flex items-center justify-between border-b border-[#22222a] pb-4">
        <h2 className="text-sm font-black text-white flex items-center gap-2 uppercase tracking-wide">
          <Scale className="w-4 h-4 text-[#e62329]" />
          Weight-Based Calculations
        </h2>
        <span className="text-[10px] font-bold text-white bg-[#e62329] px-2.5 py-1 rounded-full uppercase flex items-center gap-1">
          Auto Calculate Trucks & Hours
        </span>
      </div>

      {/* Weight & Mover Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-zinc-300 mb-1.5 uppercase">
            Total Load Weight (lbs)
          </label>
          <div className="relative">
            <input
              type="number"
              value={totalWeight || ''}
              onChange={(e) => onWeightChange(Math.max(0, Number(e.target.value)))}
              placeholder="e.g. 8000"
              className="w-full px-3.5 py-2.5 bg-[#0b0b0e] border border-[#22222a] rounded-xl text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-[#e62329]"
            />
            <Scale className="w-4 h-4 text-zinc-500 absolute right-3 top-3" />
          </div>
          <p className="text-[10px] text-zinc-400 mt-1">
            Max {POUNDS_PER_TRUCK.toLocaleString()} lbs per truck
          </p>
        </div>

        <div>
          <label className="block text-xs font-bold text-zinc-300 mb-1.5 uppercase">
            Number of Movers
          </label>
          <select
            value={numberOfMovers}
            onChange={(e) => onMoverCountChange(Number(e.target.value))}
            className="w-full px-3.5 py-2.5 bg-[#0b0b0e] border border-[#22222a] rounded-xl text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-[#e62329]"
          >
            <option value={2}>2 Movers</option>
            <option value={3}>3 Movers</option>
            <option value={4}>4 Movers (Standard)</option>
            <option value={5}>5 Movers</option>
            <option value={6}>6 Movers</option>
          </select>
          <p className="text-[10px] text-zinc-400 mt-1">
            Each handles {POUNDS_PER_MOVER_PER_HOUR} lbs/hour
          </p>
        </div>
      </div>

      {/* Calculation Results */}
      {totalWeight > 0 && (
        <>
          <div className="p-5 bg-[#0b0b0e] rounded-2xl border border-[#22222a] space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {/* Trucks Needed */}
              <div>
                <span className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">
                  Trucks Needed
                </span>
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-[#e62329]" />
                  <span className="font-black text-2xl text-[#e62329]">{trucksNeeded}</span>
                  <span className="text-xs text-zinc-400">
                    {trucksNeeded === 1 ? 'truck' : 'trucks'}
                  </span>
                </div>
              </div>

              {/* Load Hours */}
              <div>
                <span className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">
                  Load Time
                </span>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-green-500" />
                  <span className="font-black text-2xl text-white">{loadHours}</span>
                  <span className="text-xs text-zinc-400">hrs</span>
                </div>
              </div>

              {/* Unload Hours */}
              <div>
                <span className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">
                  Unload Time
                </span>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-500" />
                  <span className="font-black text-2xl text-white">{unloadHours}</span>
                  <span className="text-xs text-zinc-400">hrs</span>
                </div>
              </div>

              {/* Total Labor */}
              <div>
                <span className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">
                  Total Labor
                </span>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#e62329]" />
                  <span className="font-black text-2xl text-white">{totalLaborHours}</span>
                  <span className="text-xs text-zinc-400">hrs</span>
                </div>
              </div>
            </div>

            {/* Formula Explanation */}
            <div className="pt-3 border-t border-[#22222a] space-y-2">
              <p className="text-[10px] text-zinc-400 font-mono">
                <span className="text-zinc-300 font-bold">Time Formula:</span> {totalWeight.toLocaleString()} lbs ÷{' '}
                {numberOfMovers} movers ÷ {POUNDS_PER_MOVER_PER_HOUR} lbs/hr = {loadHours} hrs (each way)
              </p>
              <p className="text-[10px] text-zinc-400 font-mono">
                <span className="text-zinc-300 font-bold">Labor Cost:</span> ({loadHours} + {unloadHours}) hrs × {numberOfMovers} movers × $75/hr/person
              </p>
              <p className="text-[10px] text-[#e62329] font-bold">
                💰 Total man-hours: {(loadHours + unloadHours) * numberOfMovers} hours
              </p>
            </div>
          </div>

          {/* Warnings */}
          {(isHeavyLoad || isManyTrucks) && (
            <div className="flex items-start gap-3 p-4 bg-yellow-900/20 border border-yellow-900/40 rounded-xl">
              <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                {isHeavyLoad && (
                  <p className="text-xs font-bold text-yellow-300">
                    Heavy Load Alert: {totalWeight.toLocaleString()} lbs requires {trucksNeeded} trucks
                  </p>
                )}
                {isManyTrucks && (
                  <p className="text-xs text-yellow-200">
                    Consider additional crew or logistics planning for multi-truck moves
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Quick Reference */}
          <div className="p-3 bg-[#0b0b0e]/50 rounded-xl border border-[#22222a]">
            <p className="text-[11px] text-zinc-400 font-semibold mb-2">📊 Weight-to-Truck Reference:</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
              <div className="text-zinc-400">
                <span className="text-white font-bold">1 truck:</span> ≤ 8,000 lbs
              </div>
              <div className="text-zinc-400">
                <span className="text-white font-bold">2 trucks:</span> 8,001-16,000 lbs
              </div>
              <div className="text-zinc-400">
                <span className="text-white font-bold">3 trucks:</span> 16,001-24,000 lbs
              </div>
              <div className="text-zinc-400">
                <span className="text-white font-bold">4+ trucks:</span> &gt; 24,000 lbs
              </div>
            </div>
          </div>
        </>
      )}

      {totalWeight === 0 && (
        <div className="p-6 bg-[#0b0b0e]/50 rounded-xl border border-dashed border-[#22222a] text-center">
          <Scale className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
          <p className="text-xs text-zinc-400">
            Enter the total weight of the load to calculate required trucks and labor hours
          </p>
        </div>
      )}
    </div>
  );
};
