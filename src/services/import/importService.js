import * as DocumentPicker from 'expo-document-picker';
import { getDatabase } from '../../database/connection';
import { generateId } from '../../utils/id';
import { parseAlipayCSV, detectAlipayType } from './alipayParser';
import { parseWeChatXLSX, detectWeChatType } from './wechatParser';
import { parseTotalBeltCSV, detectTotalBeltType } from './totalBeltParser';
import { parseJDCVS, detectJDType } from './jdParser';
import { parseZennyCSV, detectZennyType, isZennyExportFile } from './zennyParser';

export async function pickImportFile() {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', '*/*'],
    copyToCacheDirectory: true,
  });

  if (result.canceled || !result.assets || result.assets.length === 0) {
    return null;
  }

  const file = result.assets[0];
  return {
    uri: file.uri,
    name: file.name,
    mimeType: file.mimeType || 'text/csv',
    size: file.size,
  };
}

export function detectFileType(filename) {
  const lower = (filename || '').toLowerCase();
  if (lower.includes('记账数据') || lower.includes('zenny')) return 'zenny';
  if (lower.includes('支付宝')) return 'alipay';
  if (lower.includes('微信')) return 'wechat';
  if (lower.includes('京东')) return 'jd';
  if (lower.includes('totalbelt') || lower.includes('总账')) return 'totalbelt';
  return null;
}

export async function parseFile(uri, filename) {
  const fileType = detectFileType(filename);
  let rows = [];

  console.log('[Import] Parsing file:', filename, 'type:', fileType);

  try {
    if (fileType === 'zenny') {
      rows = await parseZennyCSV(uri);
      console.log('[Import] Zenny parsed rows:', rows.length);
      rows = detectZennyType(rows);
    } else if (fileType === 'alipay') {
      rows = await parseAlipayCSV(uri);
      console.log('[Import] Alipay parsed rows:', rows.length);
      rows = detectAlipayType(rows);
    } else if (fileType === 'wechat') {
      rows = await parseWeChatXLSX(uri);
      console.log('[Import] WeChat parsed rows:', rows.length);
      rows = detectWeChatType(rows);
    } else if (fileType === 'jd') {
      rows = await parseJDCVS(uri);
      console.log('[Import] JD parsed rows:', rows.length);
      rows = detectJDType(rows);
    } else if (fileType === 'totalbelt') {
      rows = await parseTotalBeltCSV(uri);
      console.log('[Import] TotalBelt parsed rows:', rows.length);
      rows = detectTotalBeltType(rows);
    } else {
      // Try zenny first as fallback (check by content)
      rows = await parseZennyCSV(uri);
      if (rows.length > 0) {
        console.log('[Import] Fallback Zenny parsed rows:', rows.length);
        rows = detectZennyType(rows);
      } else {
        // Try totalBelt as fallback
        rows = await parseTotalBeltCSV(uri);
        console.log('[Import] Fallback TotalBelt parsed rows:', rows.length);
        rows = detectTotalBeltType(rows);
      }
    }
  } catch (e) {
    console.error('[Import] Parse error:', e);
    throw e; // Re-throw to show error to user
  }

  const filtered = rows.filter(r => r.amount > 0 && r.date);
  console.log('[Import] Filtered valid rows:', filtered.length);
  return filtered;
}

export async function importTransactions(parsedRows) {
  const db = getDatabase();
  const dbCategories = await db.getAllAsync(
    'SELECT id, name, icon, color, type, is_preset FROM categories WHERE is_deleted = 0'
  );

  let imported = 0;
  let skipped = 0;
  const errors = [];

  // For totalBelt: collect unique txTypes to auto-create categories
  const txTypesToCreate = new Set();
  for (const row of parsedRows) {
    if (row.source === 'totalbelt' && row.txType && row.amount > 0) {
      const existing = dbCategories.find(c => c.name === row.txType);
      if (!existing && !txTypesToCreate.has(row.txType)) {
        txTypesToCreate.add(row.txType);
      }
    }
  }

  // Auto-create missing categories for totalBelt
  const iconPool = [
    'food', 'food-outline', 'coffee', 'cart', 'cart-outline',
    'gamepad-variant', 'movie', 'home', 'home-outline',
    'medical-bag', 'school', 'pill', 'phone', 'tshirt-crew',
    'laptop', 'piggy-bank', 'gift', 'star', 'heart',
  ];
  let iconIdx = 0;
  for (const name of txTypesToCreate) {
    const type = 'expense'; // totalBelt txTypes are expenses
    const icon = iconPool[iconIdx % iconPool.length];
    const color = '#8B5CF6';
    try {
      const id = generateId();
      const now = new Date().toISOString();
      await db.runAsync(
        'INSERT INTO categories (id, name, icon, color, type, sort_order, is_preset, created_at) VALUES (?, ?, ?, ?, ?, ?, 0, ?)',
        [id, name, icon, color, type, dbCategories.length + 1, now]
      );
      dbCategories.push({ id, name, icon, color, type, is_preset: 0 });
    } catch (e) {
      // Category may already exist
    }
    iconIdx++;
  }

  for (const row of parsedRows) {
    try {
      let matchedCat = matchCategory(row.categoryName, row.source, dbCategories);

      if (!matchedCat) {
        const defaultType = row.type === 'income' ? 'income' : 'expense';
        matchedCat = dbCategories.find(c => c.type === defaultType && c.name === '其他');
      }

      const category_id = matchedCat ? matchedCat.id : null;
      const now = new Date().toISOString();

      await db.runAsync(
        `INSERT INTO transactions (id, amount, category_id, type, note, date, created_at, updated_at, source, source_raw)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [generateId(), row.amount, category_id, row.type, row.note || '', row.date, now, now, row.source, row.raw]
      );
      imported++;
    } catch (e) {
      errors.push({ row, error: e.message });
      skipped++;
    }
  }

  return { imported, skipped, errors, newCategories: Array.from(txTypesToCreate) };
}

function matchCategory(categoryName, source, dbCategories) {
  if (!categoryName) return null;
  const clean = categoryName.trim();

  // 1. Direct match
  const direct = dbCategories.find(c =>
    c.name === clean || c.name.includes(clean) || clean.includes(c.name)
  );
  if (direct) return direct;

  // 2. Partial keyword match
  const upper = clean.toUpperCase();
  const keywords = {
    'food': ['餐饮', '饮食', '午餐', '晚餐', '早餐', '宵夜', '外卖', '快餐', '饭店', 'food'],
    'transport': ['交通', '出行', '打车', '公交', '地铁', '火车', '机票', 'transport'],
    'shopping': ['购物', '网购', '京东', '淘宝', 'shopping'],
    'entertainment': ['娱乐', '游戏', '电影', '娱乐爱好', 'entertainment', 'game'],
    'housing': ['住房', '家居', '家居用品', '房租', 'housing', 'home'],
    'medical': ['医疗', '医院', '医药', '保健', 'medical'],
    'education': ['教育', '学习', '培训', 'education', 'school'],
    'daily': ['日用', '日用耗品', '日用杂项', '超市', '生活用品', 'daily'],
    'communication': ['通讯', '通讯费', '话费', '流量', 'communication', 'phone'],
    'clothing': ['服饰', '服装', '鞋', '衣', 'clothing', 'tshirt'],
    'drink': ['咖啡', '零食', '饮料', '可乐', '奶茶', 'drink', 'coffee'],
    'pet': ['宠物', '猫', '狗', 'pet'],
    'digital': ['数码', '手机', '电脑', '电子', 'digital', 'laptop'],
    'salary': ['工资', 'salary'],
    'freelance': ['兼职', 'freelance'],
    'refund': ['退款', 'refund'],
  };

  for (const [key, terms] of Object.entries(keywords)) {
    for (const term of terms) {
      if (upper.includes(term.toUpperCase())) {
        const found = dbCategories.find(c => c.type === 'expense' && (
          c.name.includes(key.charAt(0).toUpperCase() + key.slice(1)) ||
          c.name === terms[0]
        ));
        if (found) return found;
      }
    }
  }

  return null;
}

export async function getImportPreview(uri, filename) {
  const rows = await parseFile(uri, filename);
  const db = getDatabase();
  const dbCategories = await db.getAllAsync(
    'SELECT id, name, icon, color, type FROM categories WHERE is_deleted = 0'
  );

  const preview = rows.slice(0, 20).map(row => {
    const matched = matchCategory(row.categoryName, row.source, dbCategories);
    return {
      ...row,
      matchedCategory: matched ? matched.name : null,
      willSkip: row.amount <= 0 || !row.date,
    };
  });

  return {
    total: rows.length,
    preview,
    hasData: rows.length > 0,
  };
}

export async function batchUpdateCategory(fromCategoryId, toCategoryId) {
  const db = getDatabase();
  // Get target category type to ensure transaction type consistency
  const targetCategory = await db.getFirstAsync(
    'SELECT type FROM categories WHERE id = ? AND is_deleted = 0',
    [toCategoryId]
  );
  if (!targetCategory) {
    throw new Error('目标分类不存在');
  }
  // Update both category_id and type to match target category
  const result = await db.runAsync(
    'UPDATE transactions SET category_id = ?, type = ? WHERE category_id = ? AND is_deleted = 0',
    [toCategoryId, targetCategory.type, fromCategoryId]
  );
  return result;
}
