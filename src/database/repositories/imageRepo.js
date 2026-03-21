import { generateId } from '../../utils/id';
import { getDatabase } from '../connection';

export const imageRepo = {
  async create({ transaction_id, file_path, thumbnail_path, width, height }) {
    const db = getDatabase();
    const id = generateId();
    const now = new Date().toISOString();
    await db.runAsync(
      'INSERT INTO images (id, transaction_id, file_path, thumbnail_path, width, height, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, transaction_id, file_path, thumbnail_path || null, width || null, height || null, now]
    );
    return id;
  },

  async getByTransactionId(transactionId) {
    const db = getDatabase();
    return await db.getAllAsync(
      'SELECT * FROM images WHERE transaction_id = ? ORDER BY created_at ASC',
      [transactionId]
    );
  },

  async delete(id) {
    const db = getDatabase();
    await db.runAsync('DELETE FROM images WHERE id = ?', [id]);
  },

  async deleteByTransactionId(transactionId) {
    const db = getDatabase();
    await db.runAsync('DELETE FROM images WHERE transaction_id = ?', [transactionId]);
  },
};
