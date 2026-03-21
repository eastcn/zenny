import { create } from 'zustand';
import { transactionRepo } from '../database/repositories/transactionRepo';

export const useTransactionStore = create((set) => ({
  currentList: [],
  isLoading: false,

  async loadByDate(date) {
    set({ isLoading: true });
    const list = await transactionRepo.getByDate(date);
    set({ currentList: list, isLoading: false });
  },

  async loadByDateRange(startDate, endDate) {
    set({ isLoading: true });
    const list = await transactionRepo.getByDateRange(startDate, endDate);
    set({ currentList: list, isLoading: false });
  },

  async createTransaction(data) {
    const id = await transactionRepo.create(data);
    return id;
  },

  async updateTransaction(id, data) {
    await transactionRepo.update(id, data);
  },

  async deleteTransaction(id) {
    await transactionRepo.softDelete(id);
  },

  async getById(id) {
    return await transactionRepo.getById(id);
  },

  async search(keyword) {
    set({ isLoading: true });
    const list = await transactionRepo.search(keyword);
    set({ currentList: list, isLoading: false });
  },
}));
