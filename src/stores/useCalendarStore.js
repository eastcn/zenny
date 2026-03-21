import { create } from 'zustand';
import dayjs from 'dayjs';
import { transactionRepo } from '../database/repositories/transactionRepo';

export const useCalendarStore = create((set, get) => ({
  currentYear: dayjs().year(),
  currentMonth: dayjs().month() + 1,
  selectedDate: dayjs().format('YYYY-MM-DD'),
  dailySummaryMap: {},
  monthlyTotal: { total_expense: 0, total_income: 0 },

  setMonth(year, month) {
    set({ currentYear: year, currentMonth: month });
    get().loadSummary();
  },

  prevMonth() {
    const { currentYear, currentMonth } = get();
    const d = dayjs(`${currentYear}-${String(currentMonth).padStart(2, '0')}-01`).subtract(1, 'month');
    get().setMonth(d.year(), d.month() + 1);
  },

  nextMonth() {
    const { currentYear, currentMonth } = get();
    const d = dayjs(`${currentYear}-${String(currentMonth).padStart(2, '0')}-01`).add(1, 'month');
    get().setMonth(d.year(), d.month() + 1);
  },

  selectDate(date) {
    set({ selectedDate: date });
  },

  async loadSummary() {
    const { currentYear, currentMonth } = get();
    const yearMonth = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
    const dailyData = await transactionRepo.getDailySummary(yearMonth);
    const map = {};
    dailyData.forEach((d) => {
      map[d.date] = { expense: d.expense || 0, income: d.income || 0 };
    });
    const monthlyTotal = (await transactionRepo.getMonthlySummary(yearMonth)) || { total_expense: 0, total_income: 0 };
    set({ dailySummaryMap: map, monthlyTotal });
  },
}));
