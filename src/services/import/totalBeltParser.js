import { readTextFile } from '../../utils/fileRead';

const TOTALBELT_HEADERS = ['日期', '收支大类', '交易分类', '交易类型', '流入金额', '流出金额', '币种', '资金账户', '标签', '备注'];

export async function parseTotalBeltCSV(uri) {
  try {
    const content = await readTextFile(uri, 'utf8');
    const lines = content.split('\n').filter(l => l.trim());
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      const row = {};
      headers.forEach((h, idx) => { row[h] = (values[idx] || '').trim(); });
      rows.push(row);
    }
    return rows;
  } catch (e) {
    console.error('TotalBelt parse error:', e);
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

export function detectTotalBeltType(rows) {
  return rows.map(row => {
    const inAmount = parseFloat(row['流入金额']) || 0;
    const outAmount = parseFloat(row['流出金额']) || 0;
    const isExpense = outAmount > 0 && inAmount === 0;
    const amount = isExpense ? outAmount : inAmount;
    const category = row['交易分类'] || '';
    const txType = row['交易类型'] || '';  // Use transaction type as category
    const note = row['备注'] || '';
    const date = row['日期'] || '';

    return {
      date: date.slice(0, 10),
      amount,
      type: isExpense ? 'expense' : 'income',
      categoryName: txType || category, // Prefer transaction type over category
      originalCategory: category,
      txType,
      note: note.replace(/_[^_]*$/, '').replace(/_/g, ' ').trim(),
      source: 'totalbelt',
      raw: JSON.stringify(row),
    };
  });
}
