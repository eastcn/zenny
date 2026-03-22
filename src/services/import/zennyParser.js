import { readTextFile } from '../../utils/fileRead';

const ZENNY_HEADERS = ['日期', '类型', '金额', '分类', '备注', '创建时间'];

export async function parseZennyCSV(uri) {
  try {
    const content = await readTextFile(uri, 'utf8');
    // Remove BOM
    const cleaned = content.replace(/^\uFEFF/, '');
    const lines = cleaned.split('\n').filter(l => l.trim());

    // Check if it's Zenny format
    if (lines.length === 0) return [];

    const firstLine = lines[0].trim();
    const isZennyFormat = ZENNY_HEADERS.every(h => firstLine.includes(h));

    if (!isZennyFormat) {
      console.log('[ZennyParser] Not a Zenny export file');
      return [];
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const rows = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = parseCSVLine(line);
      if (values.length < 5) continue; // At least need date, type, amount, category, note

      const row = {};
      headers.forEach((h, idx) => {
        row[h] = (values[idx] || '').trim();
      });
      rows.push(row);
    }

    console.log('[ZennyParser] Parsed rows:', rows.length);
    return rows;
  } catch (e) {
    console.error('[ZennyParser] Error:', e);
    return [];
  }
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuote = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuote && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuote = !inQuote;
      }
    } else if (ch === ',' && !inQuote) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

export function detectZennyType(rows) {
  return rows.map(row => {
    const typeStr = row['类型'] || '';
    const isExpense = typeStr.includes('支出') || typeStr === 'expense';
    const amount = parseFloat(row['金额']) || 0;
    const dateStr = row['日期'] || '';
    const category = row['分类'] || '';
    const note = row['备注'] || '';

    return {
      date: dateStr.slice(0, 10),
      amount,
      type: isExpense ? 'expense' : 'income',
      categoryName: category,
      note,
      source: 'zenny',
      raw: JSON.stringify(row),
    };
  });
}

// Check if file is Zenny export format
export function isZennyExportFile(filename, content) {
  const lower = (filename || '').toLowerCase();
  // Check filename pattern
  if (lower.includes('记账数据') || lower.includes('zenny')) {
    return true;
  }
  // Check content pattern
  if (content && ZENNY_HEADERS.every(h => content.includes(h))) {
    return true;
  }
  return false;
}
