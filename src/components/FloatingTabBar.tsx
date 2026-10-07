import React from 'react';
import { Home, Calendar, BarChart3, Plus, LayoutGrid } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { haptics } from '../utils/haptics';

export const FloatingTabBar: React.FC = () => {
  const { activeTab, setActiveTab, setIsQuickEntryOpen, setQuickEntryCategory, categories } = useFinance();

  const handleQuickAdd = () => {
    haptics.tap();
    // Default to supermarket or first category if none selected
    setQuickEntryCategory(categories[0] || null);
    setIsQuickEntryOpen(true);
  };

  return (
    <div className="w-full px-5 pb-2 pt-1 z-20 pointer-events-auto select-none">
      <nav
        aria-label="Navegación principal"
        className="w-full max-w-[370px] mx-auto h-[62px] px-3 bg-white/85 backdrop-blur-2xl rounded-[32px] border border-white/80 shadow-[0_12px_32px_-6px_rgba(35,45,60,0.12)] flex items-center justify-between"
      >
        {/* Tab 1: Inicio */}
        <button
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center justify-center flex-1 h-full min-h-[44px] transition-all duration-200 ${
            activeTab === 'home'
              ? 'text-slate-900 scale-105 font-medium'
              : 'text-stone-400 hover:text-stone-600'
          }`}
          aria-label="Inicio"
        >
          <Home className={`w-5 h-5 ${activeTab === 'home' ? 'stroke-[2.4]' : 'stroke-[1.8]'}`} />
          <span className="text-[10px] mt-0.5 tracking-tight">Inicio</span>
        </button>

        {/* Tab 2: Calendario */}
        <button
          onClick={() => setActiveTab('calendar')}
          className={`flex flex-col items-center justify-center flex-1 h-full min-h-[44px] transition-all duration-200 ${
            activeTab === 'calendar'
              ? 'text-slate-900 scale-105 font-medium'
              : 'text-stone-400 hover:text-stone-600'
          }`}
          aria-label="Calendario"
        >
          <Calendar className={`w-5 h-5 ${activeTab === 'calendar' ? 'stroke-[2.4]' : 'stroke-[1.8]'}`} />
          <span className="text-[10px] mt-0.5 tracking-tight">Tarifario</span>
        </button>

        {/* Central Prominent (+) Quick Add Button */}
        <div className="flex items-center justify-center px-1">
          <button
            onClick={handleQuickAdd}
            className="w-11 h-11 rounded-full bg-[#1F242D] hover:bg-[#2C333F] text-white flex items-center justify-center shadow-[0_6px_18px_rgba(30,35,45,0.25)] active:scale-90 transition-all duration-150 cursor-pointer"
            aria-label="Registrar nuevo movimiento"
          >
            <Plus className="w-5 h-5 stroke-[2.6]" />
          </button>
        </div>

        {/* Tab 3: Estadísticas */}
        <button
          onClick={() => setActiveTab('stats')}
          className={`flex flex-col items-center justify-center flex-1 h-full min-h-[44px] transition-all duration-200 ${
            activeTab === 'stats'
              ? 'text-slate-900 scale-105 font-medium'
              : 'text-stone-400 hover:text-stone-600'
          }`}
          aria-label="Estadísticas"
        >
          <BarChart3 className={`w-5 h-5 ${activeTab === 'stats' ? 'stroke-[2.4]' : 'stroke-[1.8]'}`} />
          <span className="text-[10px] mt-0.5 tracking-tight">Análisis</span>
        </button>

        {/* Tab 4: Widgets & iCloud */}
        <button
          onClick={() => setActiveTab('widgets')}
          className={`flex flex-col items-center justify-center flex-1 h-full min-h-[44px] transition-all duration-200 ${
            activeTab === 'widgets'
              ? 'text-slate-900 scale-105 font-medium'
              : 'text-stone-400 hover:text-stone-600'
          }`}
          aria-label="Widgets e iCloud"
        >
          <LayoutGrid className={`w-5 h-5 ${activeTab === 'widgets' ? 'stroke-[2.4]' : 'stroke-[1.8]'}`} />
          <span className="text-[10px] mt-0.5 tracking-tight">Widgets</span>
        </button>
      </nav>
    </div>
  );
};
