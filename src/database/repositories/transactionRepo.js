import { generateId } from '../../utils/id';
import { getDatabase } from '../connection';

export const transactionRepo = {
  async create({ amount, category_id, type, note, date }) {
    const db = getDatabase();
    const id = generateId();
    const now = new Date().toISOString();
    await db.runAsync(
      'INSERT INTO transactions (id, amount, category_id, type, note, date, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, amount, category_id, type, note || '', date, now, now]
    );
    return id;
  },

  async update(id, { amount, category_id, type, note, date }) {
    const db = getDatabase();
    const now = new Date().toISOString();
    const fields = ['updated_at = ?'];
    const values = [now];
    if (amount !== undefined) { fields.push('amount = ?'); values.push(amount); }
    if (category_id !== undefined) { fields.push('category_id = ?'); values.push(category_id); }
    if (type !== undefined) { fields.push('type = ?'); values.push(type); }
    if (note !== undefined) { fields.push('note = ?'); values.push(note); }
    if (date !== undefined) { fields.push('date = ?'); values.push(date); }
    values.push(id);
    await db.runAsync(`UPDATE transactions SET ${fields.join(', ')} WHERE id = ?`, values);
  },

  async softDelete(id) {
    const db = getDatabase();
    await db.runAsync(
      'UPDATE transactions SET is_deleted = 1, updated_at = ? WHERE id = ?',
      [new Date().toISOString(), id]
    );
  },

  async getById(id) {
    const db = getDatabase();
    const tx = await db.getFirstAsync(
      `SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color
       FROM transactions t
       LEFT JOIN categories c ON t.category_id = c.id
       WHERE t.id = ? AND t.is_deleted = 0`,
      [id]
    );
    if (!tx) return null;
    const images = await db.getAllAsync(
      'SELECT * FROM images WHERE transaction_id = ? ORDER BY created_at ASC',
      [id]
    );
    return { ...tx, images };
  },

  async getByDate(date) {
    const db = getDatabase();
    return await db.getAllAsync(
      `SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color
       FROM transactions t
       LEFT JOIN categories c ON t.category_id = c.id
       WHERE t.date = ? AND t.is_deleted = 0
       ORDER BY t.created_at DESC`,
      [date]
    );
  },

  async getByDateRange(startDate, endDate) {
    const db = getDatabase();
    return await db.getAllAsync(
      `SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color
       FROM transactions t
       LEFT JOIN categories c ON t.category_id = c.id
       WHERE t.date >= ? AND t.date <= ? AND t.is_deleted = 0
       ORDER BY t.date DESC, t.created_at DESC`,
      [startDate, endDate]
    );
  },

  async getDailySummary(yearMonth) {
    const db = getDatabase();
    const startDate = `${yearMonth}-01`;
    const endDate = `${yearMonth}-31`;
    return await db.getAllAsync(
      `SELECT date,
              SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense,
              SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income
       FROM transactions
       WHERE date >= ? AND date <= ? AND is_deleted = 0
       GROUP BY date`,
      [startDate, endDate]
    );
  },

  async getMonthlySummary(yearMonth) {
    const db = getDatabase();
    const startDate = `${yearMonth}-01`;
    const endDate = `${yearMonth}-31`;
    return await db.getFirstAsync(
      `SELECT
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expense,
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income
       FROM transactions
       WHERE date >= ? AND date <= ? AND is_deleted = 0`,
      [startDate, endDate]
    );
  },

  async getCategorySummary(startDate, endDate, type) {
    const db = getDatabase();
    return await db.getAllAsync(
      `SELECT c.id, c.name, c.icon, c.color, SUM(t.amount) as total
       FROM transactions t
       JOIN categories c ON t.category_id = c.id
       WHERE t.date >= ? AND t.date <= ? AND t.type = ? AND t.is_deleted = 0
       GROUP BY c.id
       ORDER BY total DESC`,
      [startDate, endDate, type]
    );
  },

  async search(keyword) {
    const db = getDatabase();
    return await db.getAllAsync(
      `SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color
       FROM transactions t
       LEFT JOIN categories c ON t.category_id = c.id
       WHERE t.note LIKE ? AND t.is_deleted = 0
       ORDER BY t.date DESC, t.created_at DESC
       LIMIT 50`,
      [`%${keyword}%`]
    );
  },

  async getAllForExport() {
    const db = getDatabase();
    return await db.getAllAsync(
      `SELECT t.date, t.type, t.amount, c.name as category_name, t.note, t.created_at
       FROM transactions t
       LEFT JOIN categories c ON t.category_id = c.id
       WHERE t.is_deleted = 0
       ORDER BY t.date DESC, t.created_at DESC`
    );
  },
};
