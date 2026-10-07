import React, { useState } from 'react';
import { Smartphone, Maximize2, Sparkles } from 'lucide-react';
import { haptics } from '../utils/haptics';

interface IPhoneFrameProps {
  children: React.ReactNode;
}

export const IPhoneFrame: React.FC<IPhoneFrameProps> = ({ children }) => {
  const [deviceMode, setDeviceMode] = useState<'iphone' | 'fullscreen'>('iphone');

  const toggleMode = () => {
    haptics.tap();
    setDeviceMode((prev) => (prev === 'iphone' ? 'fullscreen' : 'iphone'));
  };

  return (
    <div className="min-h-screen bg-[#EDE9E0] flex flex-col items-center justify-start md:justify-center p-0 md:p-6 transition-colors duration-300">
      {/* Top Device Switcher Toolbar */}
      <header className="hidden md:flex items-center justify-between w-full max-w-[460px] mb-3 px-3 py-1.5 bg-white/70 backdrop-blur-md rounded-2xl border border-white/60 shadow-xs text-xs text-slate-700">
        <div className="flex items-center gap-1.5 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span className="font-serif italic text-sm text-slate-900">Potle Finanzas</span>
          <span className="text-[11px] text-stone-500 font-sans">· iOS iPhone</span>
        </div>

        <div className="flex items-center gap-1 bg-stone-200/60 p-0.5 rounded-xl">
          <button
            onClick={() => {
              if (deviceMode !== 'iphone') toggleMode();
            }}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
              deviceMode === 'iphone'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-3 h-3" />
            <span>Marco iPhone</span>
          </button>
          <button
            onClick={() => {
              if (deviceMode !== 'fullscreen') toggleMode();
            }}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
              deviceMode === 'fullscreen'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Maximize2 className="w-3 h-3" />
            <span>Completo</span>
          </button>
        </div>
      </header>

      {/* iPhone 16 Pro Container */}
      <div
        className={`relative transition-all duration-300 w-full ${
          deviceMode === 'iphone'
            ? 'md:max-w-[420px] md:h-[890px] md:rounded-[56px] md:ring-[12px] md:ring-[#3B3835] md:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.35),0_0_0_1px_rgba(255,255,255,0.4)]'
            : 'max-w-[540px] min-h-screen md:h-[920px] md:rounded-3xl md:shadow-2xl'
        } bg-[#F8F6F0] overflow-hidden flex flex-col`}
      >
        {/* Subtle Titanium Edge highlights on desktop */}
        {deviceMode === 'iphone' && (
          <>
            {/* Side volume / power notch hints */}
            <div className="hidden md:block absolute -left-[15px] top-[140px] w-[3px] h-[34px] bg-[#615C55] rounded-l-md" />
            <div className="hidden md:block absolute -left-[15px] top-[195px] w-[3px] h-[52px] bg-[#615C55] rounded-l-md" />
            <div className="hidden md:block absolute -left-[15px] top-[260px] w-[3px] h-[52px] bg-[#615C55] rounded-l-md" />
            <div className="hidden md:block absolute -right-[15px] top-[210px] w-[3px] h-[68px] bg-[#615C55] rounded-r-md" />
          </>
        )}

        {/* Inner App Content Screen */}
        <div className="relative flex-1 flex flex-col w-full h-full overflow-hidden bg-[#F8F6F0]">
          {children}

          {/* Home indicator bar at bottom */}
          <div className="w-full h-6 flex items-center justify-center pointer-events-none select-none shrink-0 pb-1">
            <div className="w-32 h-1 bg-slate-400/40 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
};
