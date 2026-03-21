import { generateId } from '../../utils/id';
import { getDatabase } from '../connection';

export const categoryRepo = {
  async getAll(type) {
    const db = getDatabase();
    return await db.getAllAsync(
      'SELECT * FROM categories WHERE is_deleted = 0 AND type = ? ORDER BY sort_order ASC',
      [type]
    );
  },

  async getAllActive() {
    const db = getDatabase();
    return await db.getAllAsync(
      'SELECT * FROM categories WHERE is_deleted = 0 ORDER BY type, sort_order ASC'
    );
  },

  async getById(id) {
    const db = getDatabase();
    return await db.getFirstAsync('SELECT * FROM categories WHERE id = ?', [id]);
  },

  async create({ name, icon, color, type }) {
    const db = getDatabase();
    const id = generateId();
    const now = new Date().toISOString();
    const maxOrder = await db.getFirstAsync(
      'SELECT COALESCE(MAX(sort_order), -1) as max_order FROM categories WHERE type = ? AND is_deleted = 0',
      [type]
    );
    await db.runAsync(
      'INSERT INTO categories (id, name, icon, color, type, sort_order, is_preset, created_at) VALUES (?, ?, ?, ?, ?, ?, 0, ?)',
      [id, name, icon, color, type, (maxOrder?.max_order ?? -1) + 1, now]
    );
    return id;
  },

  async update(id, { name, icon, color }) {
    const db = getDatabase();
    const fields = [];
    const values = [];
    if (name !== undefined) { fields.push('name = ?'); values.push(name); }
    if (icon !== undefined) { fields.push('icon = ?'); values.push(icon); }
    if (color !== undefined) { fields.push('color = ?'); values.push(color); }
    if (fields.length === 0) return;
    values.push(id);
    await db.runAsync(`UPDATE categories SET ${fields.join(', ')} WHERE id = ?`, values);
  },

  async softDelete(id) {
    const db = getDatabase();
    const cat = await db.getFirstAsync('SELECT is_preset FROM categories WHERE id = ?', [id]);
    if (cat?.is_preset) return false;
    await db.runAsync('UPDATE categories SET is_deleted = 1 WHERE id = ?', [id]);
    return true;
  },

  async reorder(type, orderedIds) {
    const db = getDatabase();
    for (let i = 0; i < orderedIds.length; i++) {
      await db.runAsync('UPDATE categories SET sort_order = ? WHERE id = ?', [i, orderedIds[i]]);
    }
  },
};
