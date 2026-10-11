import React, { useState, useRef } from 'react';
import { 
  Cloud, 
  FileSpreadsheet, 
  Upload, 
  Download, 
  Link as LinkIcon, 
  AlertTriangle, 
  CheckCircle2, 
  ExternalLink, 
  RefreshCw,
  Clock,
  Layers,
  Sparkles,
  Info,
  X,
  FileCheck
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency } from '../utils/formatters';
import { haptics } from '../utils/haptics';
import { 
  parseExcelOrCsvFile, 
  fetchAndParseGoogleDrive, 
  downloadOfficialTemplate, 
  exportUserTransactionsToExcel,
  ParseResult 
} from '../utils/excelSync';
import { Transaction } from '../types/finance';

export const SyncBackupView: React.FC = () => {
  const {
    transactions,
    categories,
    currency,
    lastBackupDate,
    setLastBackupDate,
    importTransactions,
  } = useFinance();

  const [activeImportMode, setActiveImportMode] = useState<'drive' | 'file'>('drive');
  const [driveUrl, setDriveUrl] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modal preview state for parsed transactions before applying
  const [previewData, setPreviewData] = useState<ParseResult | null>(null);
  const [importResolution, setImportResolution] = useState<'merge' | 'replace'>('merge');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const calculateDaysSinceBackup = (): { days: number | null; isUrgent: boolean } => {
    if (!lastBackupDate) return { days: null, isUrgent: true };
    const last = new Date(lastBackupDate);
    const now = new Date();
    const diffMs = now.getTime() - last.getTime();
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    return { days, isUrgent: days >= 15 };
  };

  const backupStatus = calculateDaysSinceBackup();

  const showToast = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4500);
  };

  // Export User Data
  const handleExportExcel = () => {
    haptics.success();
    try {
      const result = exportUserTransactionsToExcel(transactions, categories, currency);
      const now = new Date().toISOString();
      setLastBackupDate(now);
      showToast('success', `¡Respaldo descargado! (${result.count} movimientos guardados en ${result.filename})`);
    } catch (err: any) {
      showToast('error', `Error al exportar: ${err?.message || 'Error desconocido'}`);
    }
  };

  // Download Official Template
  const handleDownloadTemplate = () => {
    haptics.tap();
    try {
      const filename = downloadOfficialTemplate(categories, currency);
      showToast('success', `¡Plantilla descargada (${filename})! Puedes abrirla en Excel o Google Sheets.`);
    } catch (err: any) {
      showToast('error', `Error al generar la plantilla: ${err?.message || 'Error desconocido'}`);
    }
  };

  // Import via Local File (.xlsx, .xls, .csv)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    haptics.tap();
    setIsProcessing(true);
    try {
      const result = await parseExcelOrCsvFile(file, categories);
      if (result.success && result.transactions.length > 0) {
        haptics.success();
        setPreviewData(result);
      } else {
        haptics.error();
        showToast('error', result.error || 'No se pudieron leer datos válidos del archivo.');
      }
    } catch (err: any) {
      haptics.error();
      showToast('error', err?.message || 'Error al procesar el archivo.');
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Import via Google Drive URL
  const handleImportGoogleDrive = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!driveUrl.trim()) {
      showToast('error', 'Por favor, introduce un enlace de Google Drive o Google Sheets.');
      return;
    }

    haptics.tap();
    setIsProcessing(true);
    try {
      const result = await fetchAndParseGoogleDrive(driveUrl.trim(), categories);
      if (result.success && result.transactions.length > 0) {
        haptics.success();
        setPreviewData(result);
      } else {
        haptics.error();
        showToast('error', result.error || 'No se pudieron importar transacciones desde el enlace.');
      }
    } catch (err: any) {
      haptics.error();
      showToast('error', err?.message || 'Error al conectar con Google Drive.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Confirm and apply import
  const handleConfirmImport = () => {
    if (!previewData || previewData.transactions.length === 0) return;
    haptics.success();

    const count = importTransactions(previewData.transactions, importResolution);
    const now = new Date().toISOString();
    setLastBackupDate(now);

    setPreviewData(null);
    setDriveUrl('');
    showToast(
      'success',
      `¡Importación completada con éxito! ${count} transacciones ${
        importResolution === 'merge' ? 'añadidas y combinadas' : 'establecidas como base'
      }.`
    );
  };

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar px-4 pt-3 pb-24">
      {/* Header */}
      <header className="mb-4 px-1">
        <span className="text-[11px] font-medium text-stone-400 uppercase tracking-wider block">
          Respaldo & Sincronización
        </span>
        <h1 className="font-serif text-2xl font-bold text-stone-900 tracking-tight">
          Google Drive & Excel
        </h1>
        <p className="text-xs text-stone-500 mt-0.5">
          Guarda tus datos en la nube sin necesidad de contraseñas ni inicios de sesión.
        </p>
      </header>

      {/* Feedback Toast */}
      {feedback && (
        <div
          className={`mb-4 p-3 rounded-2xl text-xs flex items-center gap-2.5 animate-fadeIn shadow-lg ${
            feedback.type === 'success'
              ? 'bg-stone-900 text-white'
              : 'bg-rose-900 text-white'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-300 shrink-0" />
          )}
          <span className="flex-1 font-medium">{feedback.message}</span>
        </div>
      )}

      {/* 15-Day Security Reminder Notice (Requested by User) */}
      <section className="mb-5">
        <div className="p-4 rounded-3xl bg-amber-50/80 border border-amber-200/70 shadow-xs relative overflow-hidden">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-2xl bg-amber-500/15 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-xs font-bold text-amber-950">
                  Aviso importante de respaldo
                </h2>
                <span
                  className={`text-[9px] font-semibold px-2 py-0.5 rounded-full ${
                    backupStatus.isUrgent
                      ? 'bg-amber-200/80 text-amber-900'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {backupStatus.days === null
                    ? 'Sin respaldo'
                    : backupStatus.isUrgent
                    ? `Hace ${backupStatus.days} días`
                    : `Al día (hace ${backupStatus.days} d)`}
                </span>
              </div>
              <p className="text-[11px] text-amber-900/80 leading-relaxed">
                Te recomendamos guardar tu información cada <strong>15 días</strong> en tu Google Drive para evitar pérdidas si pierdes tu teléfono, cambias de iPhone o realizas un reseteo de fábrica.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 1: Export Options */}
      <section className="mb-6">
        <div className="flex items-center justify-between mb-2.5 px-1">
          <h2 className="text-xs font-semibold text-stone-800 flex items-center gap-1.5">
            <Download className="w-3.5 h-3.5 text-stone-700" />
            <span>Exportar Datos & Plantilla</span>
          </h2>
          <span className="text-[10px] text-stone-400 font-medium">Formato .xlsx</span>
        </div>

        <div className="bg-white rounded-3xl p-4.5 ios-card-shadow border border-stone-100 space-y-3">
          {/* Main Export to Excel Button */}
          <div className="p-3.5 bg-stone-50/80 rounded-2xl border border-stone-200/50 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-stone-900">
                    Exportar a Excel (.xlsx)
                  </div>
                  <div className="text-[10px] text-stone-500">
                    {transactions.length} transacciones registradas actualmente
                  </div>
                </div>
              </div>

              <button
                onClick={handleExportExcel}
                className="px-3.5 py-2 rounded-xl bg-[#1F242D] hover:bg-stone-800 text-white text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition-all shadow-xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Exportar</span>
              </button>
            </div>

            {/* Quick helper link to Google Drive */}
            <div className="pt-2 border-t border-stone-200/40 flex items-center justify-between text-[10px]">
              <span className="text-stone-500">
                ¿Descargaste el archivo? Súbelo a tu Google Drive:
              </span>
              <a
                href="https://drive.google.com"
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 active:underline cursor-pointer"
              >
                <span>Abrir Drive</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Download Official Template */}
          <button
            onClick={handleDownloadTemplate}
            className="w-full p-3 rounded-2xl bg-white hover:bg-stone-50 border border-stone-200 text-stone-800 text-xs font-semibold flex items-center justify-between active:scale-98 transition-all cursor-pointer shadow-2xs"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-amber-700" />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-stone-900">
                  Descargar Plantilla Oficial Excel
                </div>
                <div className="text-[10px] text-stone-500 font-normal">
                  Estructura pre-diseñada con categorías y ejemplos para rellenar
                </div>
              </div>
            </div>
            <span className="text-[11px] text-stone-400 font-medium">Descargar</span>
          </button>
        </div>
      </section>

      {/* Section 2: Import Options (Google Drive or File) */}
      <section className="mb-6">
        <div className="flex items-center justify-between mb-2.5 px-1">
          <h2 className="text-xs font-semibold text-stone-800 flex items-center gap-1.5">
            <Upload className="w-3.5 h-3.5 text-stone-700" />
            <span>Importar Datos</span>
          </h2>
          <span className="text-[10px] text-stone-400 font-medium">Restaurar</span>
        </div>

        {/* Tab switch between Google Drive and File */}
        <div className="grid grid-cols-2 gap-2 mb-3 bg-stone-100 p-1 rounded-2xl">
          <button
            onClick={() => {
              haptics.tap();
              setActiveImportMode('drive');
            }}
            className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeImportMode === 'drive'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <Cloud className="w-3.5 h-3.5" />
            <span>Google Drive</span>
          </button>

          <button
            onClick={() => {
              haptics.tap();
              setActiveImportMode('file');
            }}
            className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeImportMode === 'file'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Por Archivo</span>
          </button>
        </div>

        {/* Option A: Import from Google Drive Link */}
        {activeImportMode === 'drive' && (
          <div className="bg-white rounded-3xl p-4.5 ios-card-shadow border border-stone-100 animate-fadeIn space-y-3.5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                  <LinkIcon className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-xs font-bold text-stone-900">
                  Importar desde enlace de Google Drive
                </h3>
              </div>
              <p className="text-[11px] text-stone-500 leading-relaxed">
                Pega el enlace de tu archivo compartido en Google Drive o Google Sheets.
              </p>
            </div>

            <form onSubmit={handleImportGoogleDrive} className="space-y-3">
              <div>
                <input
                  type="url"
                  value={driveUrl}
                  onChange={(e) => setDriveUrl(e.target.value)}
                  placeholder="https://drive.google.com/file/d/... o spreadsheets/d/..."
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-stone-50 border border-stone-200 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-all"
                />
              </div>

              <div className="p-2.5 rounded-2xl bg-stone-50/80 border border-stone-200/50 flex items-start gap-2">
                <Info className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" />
                <p className="text-[10px] text-stone-500 leading-tight">
                  Consejo: En Google Drive, haz clic en <strong>Compartir</strong> y asegúrate de que esté configurado como <strong>"Cualquier persona que tenga el vínculo puede ver"</strong>.
                </p>
              </div>

              <button
                type="submit"
                disabled={isProcessing || !driveUrl.trim()}
                className="w-full py-2.5 rounded-2xl bg-[#1F242D] hover:bg-stone-800 disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer shadow-xs"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Conectando y procesando...</span>
                  </>
                ) : (
                  <>
                    <Cloud className="w-3.5 h-3.5" />
                    <span>Importar desde Google Drive</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Option B: Import via File */}
        {activeImportMode === 'file' && (
          <div className="bg-white rounded-3xl p-4.5 ios-card-shadow border border-stone-100 animate-fadeIn space-y-3.5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-xs font-bold text-stone-900">
                  Importar por archivo (.xlsx o .csv)
                </h3>
              </div>
              <p className="text-[11px] text-stone-500 leading-relaxed">
                Selecciona directamente un archivo descargado desde tu iPhone, iCloud Drive o computador.
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="hidden"
            />

            <button
              onClick={() => {
                haptics.tap();
                fileInputRef.current?.click();
              }}
              disabled={isProcessing}
              className="w-full p-6 border-2 border-dashed border-stone-200 hover:border-stone-400 bg-stone-50/50 hover:bg-stone-50 rounded-2xl flex flex-col items-center justify-center gap-2 text-stone-600 transition-all cursor-pointer active:scale-98"
            >
              <div className="w-10 h-10 rounded-2xl bg-white text-stone-800 flex items-center justify-center shadow-xs">
                {isProcessing ? (
                  <RefreshCw className="w-5 h-5 animate-spin text-emerald-600" />
                ) : (
                  <Upload className="w-5 h-5 text-emerald-600" />
                )}
              </div>
              <div className="text-center">
                <span className="text-xs font-bold text-stone-900 block">
                  {isProcessing ? 'Procesando archivo...' : 'Toca para elegir tu archivo'}
                </span>
                <span className="text-[10px] text-stone-400">
                  Archivos soportados: Excel (.xlsx, .xls) o CSV
                </span>
              </div>
            </button>
          </div>
        )}
      </section>

      {/* Confirmation Modal for Previewing & Applying Data */}
      {previewData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white w-full max-w-sm rounded-[32px] p-5 shadow-2xl border border-stone-100 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <FileCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-stone-900">
                    Confirmar Importación
                  </h3>
                  <span className="text-[10px] text-stone-400">
                    Revisión de datos antes de guardar
                  </span>
                </div>
              </div>
              <button
                onClick={() => setPreviewData(null)}
                className="w-7 h-7 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/60 space-y-2 text-xs">
              <div className="flex justify-between text-stone-600">
                <span>Total movimientos detectados:</span>
                <span className="font-bold text-stone-900">{previewData.transactions.length}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Gastos ({previewData.expensesCount}):</span>
                <span className="font-semibold text-rose-600">
                  -{formatCurrency(
                    previewData.transactions
                      .filter((t) => t.type === 'expense')
                      .reduce((acc, t) => acc + t.amount, 0),
                    currency
                  )}
                </span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Ingresos ({previewData.incomesCount}):</span>
                <span className="font-semibold text-emerald-600">
                  +{formatCurrency(
                    previewData.transactions
                      .filter((t) => t.type === 'income')
                      .reduce((acc, t) => acc + t.amount, 0),
                    currency
                  )}
                </span>
              </div>
            </div>

            {/* Resolution Selector: Merge or Replace */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider block">
                ¿Cómo deseas aplicar estos datos?
              </label>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setImportResolution('merge')}
                  className={`p-2.5 rounded-2xl border text-[11px] font-semibold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                    importResolution === 'merge'
                      ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                      : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Combinar</span>
                  <span className="text-[9px] opacity-75 font-normal">Mantiene lo actual</span>
                </button>

                <button
                  type="button"
                  onClick={() => setImportResolution('replace')}
                  className={`p-2.5 rounded-2xl border text-[11px] font-semibold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                    importResolution === 'replace'
                      ? 'bg-rose-900 text-white border-rose-900 shadow-xs'
                      : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reemplazar todo</span>
                  <span className="text-[9px] opacity-75 font-normal">Limpia y sobreescribe</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setPreviewData(null)}
                className="flex-1 py-2.5 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmImport}
                className="flex-1 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-all shadow-xs cursor-pointer active:scale-95"
              >
                Aplicar datos
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
