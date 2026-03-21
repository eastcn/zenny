import React, { useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCalendarStore } from '../../src/stores/useCalendarStore';
import { useTransactionStore } from '../../src/stores/useTransactionStore';
import { useCategoryStore } from '../../src/stores/useCategoryStore';
import { useSettingsStore } from '../../src/stores/useSettingsStore';
import CalendarHeader from '../../src/components/calendar/CalendarHeader';
import CalendarGrid from '../../src/components/calendar/CalendarGrid';
import TransactionList from '../../src/components/transaction/TransactionList';
import { useTheme, typography, spacing } from '../../src/theme';
import { formatDateChinese, getWeekDayName } from '../../src/utils/formatters';

export default function HomeScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const {
    currentYear, currentMonth, selectedDate,
    dailySummaryMap, monthlyTotal,
    prevMonth, nextMonth, selectDate, loadSummary, setMonth,
  } = useCalendarStore();
  const { currentList, loadByDate } = useTransactionStore();
  const { loadAll: loadCategories } = useCategoryStore();
  const { load: loadSettings } = useSettingsStore();

  // 页面获得焦点时刷新数据
  useFocusEffect(
    useCallback(() => {
      loadCategories();
      loadSettings();
      loadSummary();
      if (selectedDate) {
        loadByDate(selectedDate);
      }
    }, [selectedDate])
  );

  const handleSelectDate = useCallback((date) => {
    selectDate(date);
  }, []);

  const handleItemPress = useCallback((item) => {
    router.push(`/transaction/detail/${item.id}`);
  }, []);

  const handleAdd = useCallback(() => {
    router.push({ pathname: '/transaction/add', params: { date: selectedDate } });
  }, [selectedDate]);

  const handleMonthSelect = useCallback((year, month) => {
    setMonth(year, month);
  }, [setMonth]);

  // Calculate selected day summary
  const selectedDaySummary = dailySummaryMap[selectedDate];
  const dayExpense = selectedDaySummary?.expense || 0;
  const dayIncome = selectedDaySummary?.income || 0;

  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.container}>
      <CalendarHeader
        year={currentYear}
        month={currentMonth}
        onPrev={prevMonth}
        onNext={nextMonth}
        onMonthSelect={handleMonthSelect}
        monthlyTotal={monthlyTotal}
      />
      <CalendarGrid
        year={currentYear}
        month={currentMonth}
        selectedDate={selectedDate}
        dailySummaryMap={dailySummaryMap}
        onSelectDate={handleSelectDate}
      />
      <View style={styles.dayHeader}>
        <View>
          <Text style={styles.dayTitle}>
            {formatDateChinese(selectedDate)} {getWeekDayName(selectedDate)}
          </Text>
          {(dayExpense > 0 || dayIncome > 0) && (
            <Text style={styles.daySummary}>
              {dayExpense > 0 ? `支出 ¥${dayExpense.toFixed(2)}` : ''}
              {dayExpense > 0 && dayIncome > 0 ? '  ' : ''}
              {dayIncome > 0 ? `收入 ¥${dayIncome.toFixed(2)}` : ''}
            </Text>
          )}
        </View>
      </View>
      <View style={styles.listContainer}>
        <TransactionList
          data={currentList}
          onItemPress={handleItemPress}
          emptyText="当日暂无记录，点击 + 开始记账"
        />
      </View>
      <TouchableOpacity style={styles.fab} onPress={handleAdd} activeOpacity={0.8}>
        <MaterialCommunityIcons name="plus" size={28} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  dayTitle: {
    ...typography.bodyBold,
    color: colors.text,
  },
  daySummary: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  listContainer: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 80,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});
