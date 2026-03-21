import { create } from 'zustand';
import { categoryRepo } from '../database/repositories/categoryRepo';

export const useCategoryStore = create((set, get) => ({
  expenseCategories: [],
  incomeCategories: [],

  async loadAll() {
    const expense = await categoryRepo.getAll('expense');
    const income = await categoryRepo.getAll('income');
    set({ expenseCategories: expense, incomeCategories: income });
  },

  getCategories(type) {
    const { expenseCategories, incomeCategories } = get();
    return type === 'expense' ? expenseCategories : incomeCategories;
  },

  async createCategory(data) {
    const id = await categoryRepo.create(data);
    await get().loadAll();
    return id;
  },

  async updateCategory(id, data) {
    await categoryRepo.update(id, data);
    await get().loadAll();
  },

  async deleteCategory(id) {
    const success = await categoryRepo.softDelete(id);
    if (success) await get().loadAll();
    return success;
  },

  async reorder(type, orderedIds) {
    await categoryRepo.reorder(type, orderedIds);
    await get().loadAll();
  },
}));
