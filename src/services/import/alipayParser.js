import { decodeGBK } from '../../utils/gbkDecode';
import { readFileContent } from '../../utils/fileRead';

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

function parseGBKCSV(content) {
  const lines = content.split('\n');
  const headerIdx = lines.findIndex(l => l.includes('交易时间'));
  if (headerIdx === -1) return [];
  const headers = lines[headerIdx].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const rows = [];
  for (let i = headerIdx + 1; i < lines.length; i++) {
    const raw = lines[i];
    if (!raw.trim()) continue;
    const values = parseCSVLine(raw);
    if (values.length < 7) continue;
    const row = {};
    headers.forEach((h, idx) => { row[h] = values[idx] || ''; });
    rows.push(row);
  }
  return rows;
}

export async function parseAlipayCSV(uri) {
  try {
    // Use unified file reading - get as binary bytes then decode as GBK
    const buffer = await readFileContent(uri);
    const str = decodeGBK(buffer);
    return parseGBKCSV(str);
  } catch (e) {
    console.error('Alipay parse error:', e);
    return [];
  }
}

export function detectAlipayType(rows) {
  return rows.map(row => {
    const isExpense = row['收/支'] === '支出';
    const amount = parseFloat(row['金额']) || 0;
    const dateStr = row['交易时间'] || '';
    const product = row['商品说明'] || '';
    const category = row['交易分类'] || '';
    const merchant = row['交易对方'] || '';
    const note = product || merchant;

    return {
      date: parseDate(dateStr),
      amount,
      type: isExpense ? 'expense' : 'income',
      categoryName: category,
      note,
      source: 'alipay',
      raw: JSON.stringify(row),
    };
  });
}

function parseDate(str) {
  if (!str) return '';
  const cleaned = str.trim();
  const d = new Date(cleaned.replace(/\//g, '-'));
  if (isNaN(d.getTime())) return cleaned.slice(0, 10);
  return d.toISOString().slice(0, 10);
}
