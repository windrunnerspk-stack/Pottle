import React, { useState } from 'react';
import { X, Plus, Edit2, Trash2, Check, Sparkles, Layers } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { Category } from '../types/finance';
import { CATEGORY_TEMPLATES } from '../data/initialData';
import { formatCurrency } from '../utils/formatters';
import { haptics } from '../utils/haptics';

export const CategoryManagerModal: React.FC = () => {
  const {
    isCategoryManagerOpen,
    setIsCategoryManagerOpen,
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
    currency,
  } = useFinance();

  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [customName, setCustomName] = useState('');
  const [customEmoji, setCustomEmoji] = useState('🍿');
  const [customBudget, setCustomBudget] = useState('100000');
  const [activeTab, setActiveTab] = useState<'manage' | 'templates' | 'custom'>('manage');

  if (!isCategoryManagerOpen) return null;

  const handleClose = () => {
    haptics.tap();
    setIsCategoryManagerOpen(false);
    setEditingCategory(null);
  };

  const handleApplyTemplate = (tmpl: Omit<Category, 'id'>) => {
    haptics.success();
    addCategory({
      ...tmpl,
      budgetMonthly: currency === 'COP' ? tmpl.budgetMonthly : Math.max(Math.round(tmpl.budgetMonthly / 4000), 20),
    });
    setActiveTab('manage');
  };

  const handleSaveCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    haptics.success();
    const budgetNum = parseFloat(customBudget) || (currency === 'COP' ? 100000 : 50);

    if (editingCategory) {
      updateCategory(editingCategory.id, {
        name: customName.trim(),
        emoji: customEmoji.trim() || '🏷️',
        budgetMonthly: budgetNum,
      });
      setEditingCategory(null);
    } else {
      addCategory({
        name: customName.trim(),
        emoji: customEmoji.trim() || '🏷️',
        badgeBg: '#FDF0E6',
        badgeBorder: '#FCD8C1',
        textColor: '#9E4424',
        lightBg: '#FFF7F2',
        budgetMonthly: budgetNum,
      });
    }

    setCustomName('');
    setActiveTab('manage');
  };

  const startEdit = (cat: Category) => {
    haptics.tap();
    setEditingCategory(cat);
    setCustomName(cat.name);
    setCustomEmoji(cat.emoji);
    setCustomBudget(String(cat.budgetMonthly || ''));
    setActiveTab('custom');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-auto">
      {/* Blurred Backdrop */}
      <div
        onClick={handleClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-fadeIn"
      />

      {/* Central Modal */}
      <div className="relative w-full max-w-[400px] bg-white rounded-[32px] p-5 ios-float-shadow z-10 border border-stone-100 animate-scaleUp max-h-[88vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-2xl bg-amber-50 border border-amber-200/50 flex items-center justify-center text-amber-600">
              <Layers className="w-4 h-4 stroke-[2]" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-stone-900 leading-tight">
                Gestionar Categorías
              </h3>
              <span className="text-[10px] text-stone-400">
                Personaliza tus iconos y presupuestos
              </span>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Segmented Tab Switcher */}
        <div className="flex items-center p-1 bg-stone-100 rounded-2xl mb-3.5">
          <button
            onClick={() => {
              haptics.tap();
              setActiveTab('manage');
            }}
            className={`flex-1 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'manage'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            Tus Categorías
          </button>
          <button
            onClick={() => {
              haptics.tap();
              setActiveTab('templates');
            }}
            className={`flex-1 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'templates'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            Plantillas (Snacks...)
          </button>
          <button
            onClick={() => {
              haptics.tap();
              setEditingCategory(null);
              setCustomName('');
              setActiveTab('custom');
            }}
            className={`flex-1 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'custom'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            {editingCategory ? 'Editar' : '+ Crear'}
          </button>
        </div>

        {/* Tab 1: Manage Current Categories */}
        {activeTab === 'manage' && (
          <div className="flex-1 overflow-y-auto no-scrollbar space-y-2 pr-0.5">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="p-2.5 rounded-2xl border border-stone-100 bg-stone-50/70 hover:bg-stone-100/70 flex items-center justify-between transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div
                    style={{ backgroundColor: cat.badgeBg }}
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shadow-xs"
                  >
                    {cat.emoji}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-stone-900">
                      {cat.name}
                    </div>
                    <div className="text-[10px] text-stone-400">
                      Límite: {formatCurrency(cat.budgetMonthly, currency)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => startEdit(cat)}
                    className="p-1.5 text-stone-400 hover:text-stone-800 hover:bg-stone-200/60 rounded-lg transition-colors cursor-pointer"
                    title="Editar categoría"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  {categories.length > 3 && (
                    <button
                      onClick={() => deleteCategory(cat.id)}
                      className="p-1.5 text-stone-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Eliminar categoría"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 2: Preset Templates (Snack, Café, etc.) */}
        {activeTab === 'templates' && (
          <div className="flex-1 overflow-y-auto no-scrollbar space-y-2 pr-0.5">
            <p className="text-[11px] text-stone-500 mb-2 px-1">
              Toca cualquier plantilla para añadirla a tu pantalla de inicio:
            </p>
            {CATEGORY_TEMPLATES.map((tmpl, idx) => (
              <button
                key={idx}
                onClick={() => handleApplyTemplate(tmpl)}
                className="w-full p-2.5 rounded-2xl border border-stone-100 bg-stone-50 hover:bg-stone-100 flex items-center justify-between text-left transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <div
                    style={{ backgroundColor: tmpl.badgeBg }}
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shadow-xs group-hover:scale-105 transition-transform"
                  >
                    {tmpl.emoji}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-stone-900">
                      {tmpl.name}
                    </div>
                    <div className="text-[10px] text-stone-400">
                      Presupuesto sugerido: {formatCurrency(currency === 'COP' ? tmpl.budgetMonthly : Math.round(tmpl.budgetMonthly / 4000), currency)}
                    </div>
                  </div>
                </div>

                <div className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl">
                  + Añadir
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Tab 3: Create or Edit Category */}
        {activeTab === 'custom' && (
          <form onSubmit={handleSaveCustom} className="space-y-3 pt-1">
            <div>
              <label className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block mb-1">
                Nombre de la categoría
              </label>
              <input
                type="text"
                required
                placeholder="Ej: Snacks, Cine, Libros..."
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 outline-none focus:border-stone-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block mb-1">
                  Emoji / Icono
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    maxLength={3}
                    value={customEmoji}
                    onChange={(e) => setCustomEmoji(e.target.value)}
                    className="w-12 h-10 text-center text-xl bg-stone-50 border border-stone-200 rounded-xl outline-none"
                  />
                  <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
                    {['🍿', '🥐', '👗', '🎬', '💊', '📚', '🍕', '💻', '🎮'].map((em) => (
                      <button
                        key={em}
                        type="button"
                        onClick={() => setCustomEmoji(em)}
                        className="text-base p-1 hover:scale-120 transition-transform"
                      >
                        {em}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block mb-1">
                  Presupuesto mensual
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={customBudget}
                  onChange={(e) => setCustomBudget(e.target.value)}
                  placeholder={currency === 'COP' ? '100000' : '50'}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 outline-none focus:border-stone-400 tabular-nums"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full h-11 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 mt-2 shadow-md active:scale-98 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{editingCategory ? 'Guardar Cambios' : 'Añadir Categoría'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
