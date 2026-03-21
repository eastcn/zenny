import * as XLSX from 'xlsx';
import { readFileContent } from '../../utils/fileRead';

const WECHAT_HEADERS = ['交易时间', '交易类型', '交易对方', '商品', '收/支', '金额(元)', '支付方式', '当前状态', '交易单号', '商户单号', '备注'];

function excelDateToJSDate(serial) {
  const utcDays = serial - 25569;
  const daysMs = utcDays * 86400000;
  return new Date(daysMs);
}

export async function parseWeChatXLSX(uri) {
  try {
    console.log('[WeChatParser] Reading file:', uri);
    const buffer = await readFileContent(uri);
    console.log('[WeChatParser] Buffer type:', typeof buffer, 'isUint8Array:', buffer instanceof Uint8Array, 'length:', buffer.length);

    const wb = XLSX.read(buffer, { type: 'array' });
    console.log('[WeChatParser] Sheets:', wb.SheetNames);

    const ws = wb.Sheets[wb.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
    console.log('[WeChatParser] Total rows:', data.length);

    // Find the header row dynamically instead of hardcoding index
    let headerIdx = -1;
    for (let i = 0; i < Math.min(30, data.length); i++) {
      const row = data[i];
      if (row && row[0] === '交易时间' && row[1] === '交易类型') {
        headerIdx = i;
        break;
      }
    }
    console.log('[WeChatParser] Header row index:', headerIdx);
    if (headerIdx === -1) return [];

    const rows = [];
    for (let i = headerIdx + 1; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length === 0) continue;

      const firstCell = row[0];
      // Skip empty or non-data rows
      if (firstCell == null || firstCell === '') continue;
      const firstStr = String(firstCell);
      if (firstStr.includes('---') || firstStr.includes('注：') || firstStr.includes('微信')) continue;

      const r = {};
      WECHAT_HEADERS.forEach((h, idx) => {
        const val = row[idx];
        if (h === '交易时间' && typeof val === 'number') {
          r[h] = excelDateToJSDate(val).toISOString().slice(0, 19).replace('T', ' ');
        } else {
          r[h] = val != null ? String(val) : '';
        }
      });
      rows.push(r);
    }
    console.log('[WeChatParser] Parsed rows:', rows.length);
    return rows;
  } catch (e) {
    console.error('[WeChatParser] Error:', e);
    throw e;
  }
}

export function detectWeChatType(rows) {
  return rows.map(row => {
    const incomeExpense = row['收/支'] || '';
    const isExpense = incomeExpense.includes('支出');
    const isIncome = incomeExpense.includes('收入');
    const amount = parseFloat(row['金额(元)']) || 0;
    const dateStr = row['交易时间'] || '';
    const product = row['商品'] || '';
    const category = row['交易类型'] || '';
    const merchant = row['交易对方'] || '';
    const note = product || merchant;

    return {
      date: dateStr.slice(0, 10),
      amount,
      type: isExpense ? 'expense' : isIncome ? 'income' : 'expense',
      categoryName: category,
      note,
      source: 'wechat',
      raw: JSON.stringify(row),
    };
  });
}
