import { generateId } from '../utils/id';
import { EXPENSE_CATEGORIES_SEED, INCOME_CATEGORIES_SEED } from '../utils/constants';

export async function runSeeds(db) {
  const count = await db.getFirstAsync('SELECT COUNT(*) as cnt FROM categories');
  if (count.cnt > 0) return;

  const now = new Date().toISOString();

  for (let i = 0; i < EXPENSE_CATEGORIES_SEED.length; i++) {
    const cat = EXPENSE_CATEGORIES_SEED[i];
    await db.runAsync(
      'INSERT INTO categories (id, name, icon, color, type, sort_order, is_preset, created_at) VALUES (?, ?, ?, ?, ?, ?, 1, ?)',
      [generateId(), cat.name, cat.icon, cat.color, 'expense', i, now]
    );
  }

  for (let i = 0; i < INCOME_CATEGORIES_SEED.length; i++) {
    const cat = INCOME_CATEGORIES_SEED[i];
    await db.runAsync(
      'INSERT INTO categories (id, name, icon, color, type, sort_order, is_preset, created_at) VALUES (?, ?, ?, ?, ?, ?, 1, ?)',
      [generateId(), cat.name, cat.icon, cat.color, 'income', i, now]
    );
  }
}
