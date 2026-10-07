import React, { useState, useEffect } from 'react';
import { Wifi, BatteryMedium, Cloud } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';

interface DynamicIslandProps {
  onTap?: () => void;
}

export const DynamicIsland: React.FC<DynamicIslandProps> = ({ onTap }) => {
  const { iCloudSyncStatus } = useFinance();
  const [currentTime, setCurrentTime] = useState('09:41');
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      setCurrentTime(`${hours}:${minutes}`);
    };
    update();
    const interval = setInterval(update, 10000);
    return () => clearInterval(interval);
  }, []);

  // Temporarily expand Dynamic Island when syncing
  useEffect(() => {
    if (iCloudSyncStatus === 'syncing') {
      setIsExpanded(true);
      const t = setTimeout(() => setIsExpanded(false), 2400);
      return () => clearTimeout(t);
    }
  }, [iCloudSyncStatus]);

  return (
    <div className="w-full pt-3 px-6 pb-1 flex items-center justify-between text-black text-xs font-semibold z-30 select-none">
      {/* Time */}
      <span className="w-12 text-left font-sans text-[13px] tracking-tight font-semibold text-slate-800">
        {currentTime}
      </span>

      {/* Dynamic Island pill */}
      <div
        onClick={() => {
          setIsExpanded(!isExpanded);
          if (onTap) onTap();
        }}
        className={`relative bg-black text-white rounded-full flex items-center justify-center transition-all duration-300 ease-out cursor-pointer shadow-sm ${
          isExpanded
            ? 'w-[200px] h-[34px] px-3 gap-2'
            : 'w-[108px] h-[28px] px-2.5 gap-2 hover:w-[114px]'
        }`}
      >
        {isExpanded ? (
          <div className="flex items-center justify-between w-full text-[11px] animate-fadeIn">
            <div className="flex items-center gap-1.5 text-emerald-400">
              <Cloud className="w-3.5 h-3.5 animate-pulse" />
              <span className="text-[11px] font-medium text-slate-100">
                {iCloudSyncStatus === 'syncing' ? 'iCloud sincronizando…' : 'iCloud Activo'}
              </span>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          </div>
        ) : (
          <>
            <div className="w-2.5 h-2.5 rounded-full bg-[#1A1A1A] border border-neutral-800 flex items-center justify-center">
              <div className="w-1 h-1 rounded-full bg-blue-900/40" />
            </div>
            <div className="flex-1 flex justify-end items-center gap-1">
              {iCloudSyncStatus === 'syncing' && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse mr-0.5" />
              )}
              <div className="w-2.5 h-2.5 rounded-full bg-[#1A1A1A] border border-neutral-800" />
            </div>
          </>
        )}
      </div>

      {/* iOS Status Right: Cellular, Wifi, Battery */}
      <div className="w-14 flex items-center justify-end gap-1.5 text-slate-800">
        {/* Cell signal */}
        <div className="flex items-end gap-[1.5px] h-2.5">
          <div className="w-[2.5px] h-1 bg-slate-800 rounded-xs" />
          <div className="w-[2.5px] h-1.5 bg-slate-800 rounded-xs" />
          <div className="w-[2.5px] h-2 bg-slate-800 rounded-xs" />
          <div className="w-[2.5px] h-2.5 bg-slate-800 rounded-xs" />
        </div>
        <Wifi className="w-3.5 h-3.5" />
        <BatteryMedium className="w-4 h-4 text-slate-800" />
      </div>
    </div>
  );
};
