import * as XLSX from 'xlsx';
import { Transaction, Category, Currency } from '../types/finance';

export interface ParseResult {
  success: boolean;
  transactions: Transaction[];
  totalAmount: number;
  expensesCount: number;
  incomesCount: number;
  message?: string;
  error?: string;
}

/**
 * Normalizes string keys for flexible column matching
 */
function normalizeKey(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Extracts and maps rows from an Excel or CSV sheet to standard Transaction objects
 */
export function mapSheetRowsToTransactions(
  rows: Record<string, any>[],
  existingCategories: Category[]
): Transaction[] {
  const result: Transaction[] = [];

  const categoryMap = new Map<string, string>();
  existingCategories.forEach((c) => {
    categoryMap.set(c.id.toLowerCase(), c.id);
    categoryMap.set(c.name.toLowerCase(), c.id);
    categoryMap.set(normalizeKey(c.name), c.id);
  });

  const defaultCategory = existingCategories[0]?.id || 'supermercado';

  rows.forEach((row, idx) => {
    // Find matching columns by inspecting normalized keys
    let dateVal = '';
    let typeVal: 'expense' | 'income' = 'expense';
    let amountVal = 0;
    let categoryVal = defaultCategory;
    let noteVal = '';
    let timeVal = '12:00';
    let idVal = '';

    for (const [rawKey, rawVal] of Object.entries(row)) {
      if (rawVal === undefined || rawVal === null || rawVal === '') continue;
      const key = normalizeKey(rawKey);
      const strVal = String(rawVal).trim();

      if (key.includes('id') && !idVal) {
        idVal = strVal;
      } else if (key.includes('fecha') || key.includes('date') || key.includes('dia')) {
        // Parse date (could be YYYY-MM-DD or Excel serial number or DD/MM/YYYY)
        if (typeof rawVal === 'number' && rawVal > 30000 && rawVal < 60000) {
          // Excel serial date number
          const excelDate = new Date(Math.round((rawVal - 25569) * 86400 * 1000));
          dateVal = excelDate.toISOString().slice(0, 10);
        } else if (strVal.match(/^\d{4}-\d{2}-\d{2}$/)) {
          dateVal = strVal;
        } else if (strVal.match(/^\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{4}$/)) {
          const parts = strVal.split(/[\/\.-]/);
          // Assume DD/MM/YYYY
          const d = parts[0].padStart(2, '0');
          const m = parts[1].padStart(2, '0');
          const y = parts[2];
          dateVal = `${y}-${m}-${d}`;
        } else {
          const parsed = new Date(strVal);
          if (!isNaN(parsed.getTime())) {
            dateVal = parsed.toISOString().slice(0, 10);
          }
        }
      } else if (key.includes('tipo') || key.includes('type')) {
        const lower = strVal.toLowerCase();
        if (lower.includes('ingreso') || lower.includes('income') || lower.includes('abono') || lower.includes('entrada')) {
          typeVal = 'income';
        } else {
          typeVal = 'expense';
        }
      } else if (key.includes('monto') || key.includes('amount') || key.includes('valor') || key.includes('precio') || key.includes('total') || key.includes('importe')) {
        if (typeof rawVal === 'number') {
          amountVal = Math.abs(rawVal);
        } else {
          // Strip currency symbols, commas or periods
          const clean = strVal.replace(/[^\d.,-]/g, '').trim();
          // If contains comma as decimal: e.g. 15.000,50 vs 15,000.50
          let num = 0;
          if (clean.includes(',') && clean.includes('.')) {
            if (clean.indexOf(',') > clean.indexOf('.')) {
              num = parseFloat(clean.replace(/\./g, '').replace(',', '.'));
            } else {
              num = parseFloat(clean.replace(/,/g, ''));
            }
          } else if (clean.includes(',')) {
            // Check if comma is decimal (2 decimals) or thousand separator
            const parts = clean.split(',');
            if (parts.length === 2 && parts[1].length <= 2) {
              num = parseFloat(parts[0] + '.' + parts[1]);
            } else {
              num = parseFloat(clean.replace(/,/g, ''));
            }
          } else {
            num = parseFloat(clean);
          }
          if (!isNaN(num)) amountVal = Math.abs(num);
        }
      } else if (key.includes('categoria') || key.includes('category') || key.includes('rubro')) {
        const match = categoryMap.get(normalizeKey(strVal)) || categoryMap.get(strVal.toLowerCase());
        if (match) {
          categoryVal = match;
        } else {
          // Try fuzzy match with category names
          const found = existingCategories.find((c) =>
            c.name.toLowerCase().includes(strVal.toLowerCase()) ||
            strVal.toLowerCase().includes(c.name.toLowerCase())
          );
          if (found) {
            categoryVal = found.id;
          }
        }
      } else if (key.includes('descrip') || key.includes('nota') || key.includes('note') || key.includes('concepto') || key.includes('detalle')) {
        noteVal = strVal;
      } else if (key.includes('hora') || key.includes('time')) {
        if (strVal.match(/^\d{1,2}:\d{2}/)) {
          timeVal = strVal.slice(0, 5);
        }
      }
    }

    // Fallback date to today if none was found or invalid
    if (!dateVal || !dateVal.match(/^\d{4}-\d{2}-\d{2}$/)) {
      dateVal = new Date().toISOString().slice(0, 10);
    }

    if (amountVal > 0) {
      result.push({
        id: idVal || `tx_imp_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
        type: typeVal,
        amount: amountVal,
        categoryId: categoryVal,
        note: noteVal || (typeVal === 'income' ? 'Ingreso importado' : 'Gasto importado'),
        date: dateVal,
        time: timeVal,
        createdAt: new Date().toISOString(),
      });
    }
  });

  return result;
}

/**
 * Parses an Excel (.xlsx, .xls) or CSV file from a file input
 */
export async function parseExcelOrCsvFile(
  file: File,
  categories: Category[]
): Promise<ParseResult> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });

    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      return {
        success: false,
        transactions: [],
        totalAmount: 0,
        expensesCount: 0,
        incomesCount: 0,
        error: 'El archivo Excel no contiene hojas de datos legibles.',
      };
    }

    // Prioritize sheet named 'Movimientos' or 'Transacciones' or first sheet
    let targetSheetName = workbook.SheetNames[0];
    const preferred = workbook.SheetNames.find((s) => {
      const lower = s.toLowerCase();
      return lower.includes('movimiento') || lower.includes('transac') || lower.includes('gasto') || lower.includes('datos');
    });
    if (preferred) targetSheetName = preferred;

    const worksheet = workbook.Sheets[targetSheetName];
    const rows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet);

    if (!rows || rows.length === 0) {
      return {
        success: false,
        transactions: [],
        totalAmount: 0,
        expensesCount: 0,
        incomesCount: 0,
        error: `La hoja "${targetSheetName}" está vacía. Asegúrate de incluir encabezados y filas con datos.`,
      };
    }

    const txs = mapSheetRowsToTransactions(rows, categories);

    if (txs.length === 0) {
      return {
        success: false,
        transactions: [],
        totalAmount: 0,
        expensesCount: 0,
        incomesCount: 0,
        error: 'No se encontraron filas con montos válidos. Verifica que las columnas tengan nombres como "Fecha", "Monto", "Tipo" y "Categoría".',
      };
    }

    const totalAmount = txs.reduce((acc, t) => acc + t.amount, 0);
    const expensesCount = txs.filter((t) => t.type === 'expense').length;
    const incomesCount = txs.filter((t) => t.type === 'income').length;

    return {
      success: true,
      transactions: txs,
      totalAmount,
      expensesCount,
      incomesCount,
      message: `Se importaron ${txs.length} movimientos correctamente (${expensesCount} gastos, ${incomesCount} ingresos).`,
    };
  } catch (err: any) {
    return {
      success: false,
      transactions: [],
      totalAmount: 0,
      expensesCount: 0,
      incomesCount: 0,
      error: `Error al procesar el archivo: ${err?.message || 'Formato no soportado'}`,
    };
  }
}

/**
 * Extracts Google Sheets / Google Drive Document ID from any URL format
 */
export function extractGoogleDriveId(url: string): { type: 'sheet' | 'file'; id: string } | null {
  const trimmed = url.trim();

  // Pattern 1: Google Sheets URL
  // https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit?usp=sharing
  const sheetsMatch = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (sheetsMatch && sheetsMatch[1]) {
    return { type: 'sheet', id: sheetsMatch[1] };
  }

  // Pattern 2: Google Drive File URL
  // https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/view?usp=sharing
  const fileMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9-_]+)/);
  if (fileMatch && fileMatch[1]) {
    return { type: 'file', id: fileMatch[1] };
  }

  // Pattern 3: Google Drive open / uc ID
  // https://drive.google.com/open?id=1BxiMVs0... or https://drive.google.com/uc?id=...
  const idParamMatch = trimmed.match(/[?&]id=([a-zA-Z0-9-_]+)/);
  if (idParamMatch && idParamMatch[1]) {
    return { type: 'file', id: idParamMatch[1] };
  }

  return null;
}

/**
 * Fetches and parses a shared Google Drive or Google Sheets link
 */
export async function fetchAndParseGoogleDrive(
  url: string,
  categories: Category[]
): Promise<ParseResult> {
  const extracted = extractGoogleDriveId(url);
  if (!extracted) {
    return {
      success: false,
      transactions: [],
      totalAmount: 0,
      expensesCount: 0,
      incomesCount: 0,
      error: 'El enlace introducido no parece ser un enlace válido de Google Drive o Google Sheets.',
    };
  }

  // Construct direct download or export URL
  let fetchUrl = '';
  if (extracted.type === 'sheet') {
    // Google Sheets directly publishes as CSV export
    fetchUrl = `https://docs.google.com/spreadsheets/d/${extracted.id}/export?format=csv`;
  } else {
    // Direct download link for file uploaded to drive
    fetchUrl = `https://drive.google.com/uc?export=download&id=${extracted.id}`;
  }

  try {
    const response = await fetch(fetchUrl);

    if (!response.ok) {
      if (response.status === 403 || response.status === 401) {
        return {
          success: false,
          transactions: [],
          totalAmount: 0,
          expensesCount: 0,
          incomesCount: 0,
          error: 'Acceso denegado en Google Drive. Verifica que el archivo tenga la opción "Cualquier persona con el enlace puede ver" activada.',
        };
      }
      throw new Error(`Respuesta no satisfactoria (HTTP ${response.status})`);
    }

    const contentType = response.headers.get('content-type') || '';
    let rows: Record<string, any>[] = [];

    if (contentType.includes('html') && !contentType.includes('sheet')) {
      // Returned an HTML page (likely private login required)
      return {
        success: false,
        transactions: [],
        totalAmount: 0,
        expensesCount: 0,
        incomesCount: 0,
        error: 'El enlace requiere iniciar sesión en Google. Por favor, asegúrate de cambiar los permisos del archivo a "Cualquier persona que tenga el vínculo puede ser lector", o descarga el archivo y cárgalo con la opción "Por archivo".',
      };
    }

    // Try parsing as arrayBuffer (handles both CSV and XLSX binary)
    const arrayBuffer = await response.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    rows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet);

    if (!rows || rows.length === 0) {
      return {
        success: false,
        transactions: [],
        totalAmount: 0,
        expensesCount: 0,
        incomesCount: 0,
        error: 'El archivo de Google Drive está vacío o no contiene filas legibles.',
      };
    }

    const txs = mapSheetRowsToTransactions(rows, categories);
    if (txs.length === 0) {
      return {
        success: false,
        transactions: [],
        totalAmount: 0,
        expensesCount: 0,
        incomesCount: 0,
        error: 'No se pudieron extraer transacciones. Comprueba que las columnas contengan "Fecha", "Monto", "Tipo" y "Categoría".',
      };
    }

    const totalAmount = txs.reduce((acc, t) => acc + t.amount, 0);
    const expensesCount = txs.filter((t) => t.type === 'expense').length;
    const incomesCount = txs.filter((t) => t.type === 'income').length;

    return {
      success: true,
      transactions: txs,
      totalAmount,
      expensesCount,
      incomesCount,
      message: `¡Éxito! Se obtuvieron ${txs.length} transacciones desde Google Drive.`,
    };
  } catch (err: any) {
    return {
      success: false,
      transactions: [],
      totalAmount: 0,
      expensesCount: 0,
      incomesCount: 0,
      error: `No se pudo conectar a Google Drive: ${err?.message || 'Error de conexión'}. Te recomendamos descargar el archivo y usar "Importar por archivo".`,
    };
  }
}

/**
 * Generates and triggers download of the Official Excel Template
 */
export function downloadOfficialTemplate(categories: Category[], currency: Currency): string {
  const wb = XLSX.utils.book_new();

  // 1. Template sheet with example data
  const exampleRows = [
    {
      'ID': 'EJ-001',
      'Fecha': '2026-10-01',
      'Tipo': 'Gasto',
      'Categoría': 'Supermercado',
      'Monto': currency === 'COP' ? 45000 : 45.5,
      'Moneda': currency,
      'Nota': 'Compras semanales de víveres',
      'Hora': '11:30'
    },
    {
      'ID': 'EJ-002',
      'Fecha': '2026-10-02',
      'Tipo': 'Gasto',
      'Categoría': 'Gasolina',
      'Monto': currency === 'COP' ? 25000 : 25.0,
      'Moneda': currency,
      'Nota': 'Tanque lleno estación norte',
      'Hora': '08:45'
    },
    {
      'ID': 'EJ-003',
      'Fecha': '2026-10-05',
      'Tipo': 'Ingreso',
      'Categoría': 'Sueldo',
      'Monto': currency === 'COP' ? 2500000 : 2500.0,
      'Moneda': currency,
      'Nota': 'Pago de nómina quincenal',
      'Hora': '09:00'
    },
    {
      'ID': 'EJ-004',
      'Fecha': '2026-10-07',
      'Tipo': 'Gasto',
      'Categoría': 'Salidas',
      'Monto': currency === 'COP' ? 12000 : 12.0,
      'Moneda': currency,
      'Nota': 'Café y postre con amigos',
      'Hora': '17:15'
    },
    {
      'ID': 'EJ-005',
      'Fecha': '2026-10-10',
      'Tipo': 'Gasto',
      'Categoría': 'Servicios',
      'Monto': currency === 'COP' ? 85000 : 85.0,
      'Moneda': currency,
      'Nota': 'Factura de luz e internet',
      'Hora': '14:20'
    }
  ];

  const wsTemplate = XLSX.utils.json_to_sheet(exampleRows);
  // Column widths
  wsTemplate['!cols'] = [
    { wch: 10 }, // ID
    { wch: 12 }, // Fecha
    { wch: 10 }, // Tipo
    { wch: 18 }, // Categoria
    { wch: 14 }, // Monto
    { wch: 8 },  // Moneda
    { wch: 32 }, // Nota
    { wch: 8 }   // Hora
  ];
  XLSX.utils.book_append_sheet(wb, wsTemplate, 'Movimientos');

  // 2. Categories sheet
  const catRows = categories.map((c) => ({
    'ID': c.id,
    'Nombre': c.name,
    'Emoji': c.emoji,
    'Presupuesto Mensual': c.budgetMonthly || 0,
  }));
  const wsCats = XLSX.utils.json_to_sheet(catRows);
  wsCats['!cols'] = [{ wch: 16 }, { wch: 22 }, { wch: 8 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, wsCats, 'Categorías');

  // 3. Instructions sheet
  const instructions = [
    { 'Paso': 1, 'Instrucción': 'Llena tus movimientos en la hoja "Movimientos" respetando las columnas Fecha (AAAA-MM-DD), Tipo (Gasto o Ingreso), Categoría y Monto.' },
    { 'Paso': 2, 'Instrucción': 'Puedes subir este archivo a tu Google Drive para respaldarlo o editarlo desde tu celular o computadora con Google Sheets.' },
    { 'Paso': 3, 'Instrucción': 'Para importar desde Google Drive: comparte el archivo con "Cualquier persona con el enlace", copia el link y pégalo en la app Potle.' },
    { 'Paso': 4, 'Instrucción': 'Para importar localmente: entra a Potle > Sync > "Importar por archivo" y selecciónalo directamente.' },
    { 'Paso': 5, 'Instrucción': '💡 Recomendación: Exporta tu respaldo cada 15 días a Google Drive para evitar pérdidas si formateas o cambias de iPhone.' },
  ];
  const wsInst = XLSX.utils.json_to_sheet(instructions);
  wsInst['!cols'] = [{ wch: 8 }, { wch: 90 }];
  XLSX.utils.book_append_sheet(wb, wsInst, 'Instrucciones');

  const filename = 'Plantilla_Oficial_Potle_Finanzas.xlsx';
  XLSX.writeFile(wb, filename);
  return filename;
}

/**
 * Exports current user transactions into a complete, well-formatted .xlsx file
 */
export function exportUserTransactionsToExcel(
  transactions: Transaction[],
  categories: Category[],
  currency: Currency
): { filename: string; count: number } {
  const wb = XLSX.utils.book_new();

  const catMap = new Map<string, Category>();
  categories.forEach((c) => catMap.set(c.id, c));

  // 1. Data rows
  const rows = transactions.map((tx) => {
    const cat = catMap.get(tx.categoryId);
    return {
      'ID': tx.id,
      'Fecha': tx.date,
      'Tipo': tx.type === 'income' ? 'Ingreso' : 'Gasto',
      'Categoría': cat ? `${cat.emoji} ${cat.name}` : tx.categoryId,
      'Categoría_ID': tx.categoryId,
      'Monto': tx.amount,
      'Moneda': currency,
      'Descripción / Nota': tx.note || '',
      'Hora': tx.time || '12:00',
    };
  });

  const wsData = XLSX.utils.json_to_sheet(rows);
  wsData['!cols'] = [
    { wch: 18 }, // ID
    { wch: 12 }, // Fecha
    { wch: 10 }, // Tipo
    { wch: 22 }, // Categoría
    { wch: 16 }, // Categoría_ID
    { wch: 14 }, // Monto
    { wch: 8 },  // Moneda
    { wch: 35 }, // Descripción
    { wch: 8 },  // Hora
  ];
  XLSX.utils.book_append_sheet(wb, wsData, 'Movimientos');

  // 2. Summary sheet
  const totalIncome = transactions.filter((t) => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = transactions.filter((t) => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  const balance = totalIncome - totalExpense;

  const summaryRows = [
    { 'Concepto': 'Fecha de Respaldo', 'Valor': new Date().toISOString().replace('T', ' ').slice(0, 19) },
    { 'Concepto': 'Moneda', 'Valor': currency },
    { 'Concepto': 'Total Transacciones', 'Valor': transactions.length },
    { 'Concepto': 'Total Ingresos (+)', 'Valor': totalIncome },
    { 'Concepto': 'Total Gastos (-)', 'Valor': totalExpense },
    { 'Concepto': 'Balance Neto', 'Valor': balance },
  ];

  const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
  wsSummary['!cols'] = [{ wch: 24 }, { wch: 24 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumen');

  // 3. Category Breakdown sheet
  const catBreakdown: Record<string, { count: number; total: number; name: string }> = {};
  transactions.filter((t) => t.type === 'expense').forEach((tx) => {
    const cat = catMap.get(tx.categoryId);
    const catName = cat ? `${cat.emoji} ${cat.name}` : tx.categoryId;
    if (!catBreakdown[tx.categoryId]) {
      catBreakdown[tx.categoryId] = { count: 0, total: 0, name: catName };
    }
    catBreakdown[tx.categoryId].count += 1;
    catBreakdown[tx.categoryId].total += tx.amount;
  });

  const catRows = Object.values(catBreakdown).map((item) => ({
    'Categoría': item.name,
    'Cantidad de Gastos': item.count,
    'Total Gastado': item.total,
    '% del Total': totalExpense > 0 ? `${((item.total / totalExpense) * 100).toFixed(1)}%` : '0%',
  }));

  const wsCats = XLSX.utils.json_to_sheet(catRows);
  wsCats['!cols'] = [{ wch: 24 }, { wch: 18 }, { wch: 16 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, wsCats, 'Desglose_Categorías');

  const todayStr = new Date().toISOString().slice(0, 10);
  const filename = `Respaldo_Potle_Finanzas_${todayStr}.xlsx`;
  XLSX.writeFile(wb, filename);

  return { filename, count: transactions.length };
}
