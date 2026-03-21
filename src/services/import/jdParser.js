import { readTextFile } from '../../utils/fileRead';

export async function parseJDCVS(uri) {
  try {
    const content = await readTextFile(uri, 'utf8');
    // Remove BOM
    const cleaned = content.replace(/^\uFEFF/, '');
    const lines = cleaned.split('\n');

    const headerIdx = lines.findIndex(l => l.includes('交易时间') && l.includes('商户名称'));
    if (headerIdx === -1) return [];

    const headers = lines[headerIdx].split(',').map(h => h.trim());

    const rows = [];
    for (let i = headerIdx + 1; i < lines.length; i++) {
      let line = lines[i].trim();
      if (!line) continue;

      // JD CSV uses mixed Tab+comma: some fields end with \t before comma
      // e.g. "2026-03-16 22:07:29\t,京东平台商户,..."
      // Clean: replace \t, with just , and strip remaining tabs
      line = line.replace(/\t,/g, ',').replace(/\t/g, '');

      const values = parseCSVLine(line);
      if (values.length < 4) continue;

      const row = {};
      headers.forEach((h, idx) => {
        row[h] = (values[idx] || '').trim();
      });
      rows.push(row);
    }
    return rows;
  } catch (e) {
    console.error('[JDParser] Error:', e);
    throw e;
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

export function detectJDType(rows) {
  return rows.map(row => {
    const incomeExpense = row['收/支'] || '';
    const isExpense = incomeExpense.includes('支出');
    const isIncome = incomeExpense.includes('收入');
    const amount = parseFloat(String(row['金额'] || '0').replace(/,/g, '')) || 0;
    const dateStr = row['交易时间'] || '';
    const product = row['交易说明'] || '';
    const category = row['交易分类'] || '';

    return {
      date: dateStr.slice(0, 10),
      amount,
      type: isExpense ? 'expense' : isIncome ? 'income' : 'expense',
      categoryName: category.replace(/ .*$/, ''),
      note: product.length > 50 ? product.slice(0, 50) : product,
      source: 'jd',
      raw: JSON.stringify(row),
    };
  });
}
