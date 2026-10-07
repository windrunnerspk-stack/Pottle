import React, { useState } from 'react';
import { Check, Coins, ArrowRight, Sparkles } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { Currency } from '../types/finance';
import { CURRENCIES, formatCurrency } from '../utils/formatters';
import { haptics } from '../utils/haptics';

export const CurrencyPickerModal: React.FC = () => {
  const { isCurrencyPickerOpen, currency, confirmCurrency } = useFinance();
  const [selected, setSelected] = useState<Currency>(currency || 'COP');

  if (!isCurrencyPickerOpen) return null;

  const options: { code: Currency; name: string; example: number }[] = [
    { code: 'COP', name: 'Peso Colombiano (COP)', example: 50000 },
    { code: 'USD', name: 'Dólar Estadounidense (USD)', example: 50 },
    { code: 'EUR', name: 'Euro Europeo (EUR)', example: 50 },
    { code: 'MXN', name: 'Peso Mexicano (MXN)', example: 250 },
  ];

  const handleSelect = (code: Currency) => {
    haptics.tap();
    setSelected(code);
  };

  const handleConfirm = () => {
    confirmCurrency(selected);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-auto">
      {/* Blurred Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity animate-fadeIn" />

      {/* Central Modal */}
      <div className="relative w-full max-w-[390px] bg-white rounded-[32px] p-6 ios-float-shadow z-10 border border-stone-100 animate-scaleUp text-stone-900">
        {/* Top Icon Badge */}
        <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-600 mb-3.5 mx-auto shadow-xs">
          <Coins className="w-6 h-6 stroke-[2]" />
        </div>

        {/* Title */}
        <div className="text-center mb-5">
          <h2 className="font-serif text-2xl font-bold text-stone-900 tracking-tight">
            Escoge tu Moneda
          </h2>
          <p className="text-xs text-stone-500 mt-1 max-w-[280px] mx-auto leading-relaxed">
            Personaliza cómo se mostrarán los montos y accesos rápidos en Potle Finanzas.
          </p>
        </div>

        {/* Currency Options Grid */}
        <div className="space-y-2.5 mb-6">
          {options.map((opt) => {
            const isChosen = selected === opt.code;
            const meta = CURRENCIES[opt.code];

            return (
              <button
                key={opt.code}
                onClick={() => handleSelect(opt.code)}
                className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                  isChosen
                    ? 'bg-stone-900 text-white border-stone-900 shadow-md scale-[1.01]'
                    : 'bg-stone-50/80 border-stone-200/70 text-stone-800 hover:bg-stone-100/80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{meta.flag}</span>
                  <div>
                    <div className="text-xs font-bold leading-tight">
                      {opt.name}
                    </div>
                    <div className={`text-[11px] mt-0.5 font-medium tabular-nums ${isChosen ? 'text-stone-300' : 'text-stone-400'}`}>
                      Ej: {formatCurrency(opt.example, opt.code)}
                    </div>
                  </div>
                </div>

                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                    isChosen ? 'bg-emerald-500 text-white' : 'border border-stone-300'
                  }`}
                >
                  {isChosen && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* CTA Button */}
        <button
          onClick={handleConfirm}
          className="w-full h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md active:scale-98 transition-all cursor-pointer"
        >
          <span>Continuar con {CURRENCIES[selected].label}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
