import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import dayjs from 'dayjs';
import CalendarDay from './CalendarDay';
import { colors, typography, spacing } from '../../theme';
import { WEEK_DAYS } from '../../utils/constants';

export default function CalendarGrid({ year, month, selectedDate, dailySummaryMap, onSelectDate }) {
  const weeks = useMemo(() => buildCalendarWeeks(year, month), [year, month]);
  const today = dayjs().format('YYYY-MM-DD');

  return (
    <View style={styles.container}>
      <View style={styles.weekHeader}>
        {WEEK_DAYS.map((d, i) => (
          <View key={i} style={styles.weekHeaderCell}>
            <Text style={[styles.weekHeaderText, (i === 0 || i === 6) && styles.weekendText]}>
              {d}
            </Text>
          </View>
        ))}
      </View>
      {weeks.map((week, wi) => (
        <View key={wi} style={styles.weekRow}>
          {week.map((date, di) => (
            <CalendarDay
              key={di}
              date={date}
              isCurrentMonth={date ? dayjs(date).month() + 1 === month : false}
              isToday={date === today}
              isSelected={date === selectedDate}
              summary={date ? dailySummaryMap[date] : null}
              onPress={onSelectDate}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

function buildCalendarWeeks(year, month) {
  const firstDay = dayjs(`${year}-${String(month).padStart(2, '0')}-01`);
  const startOfWeek = firstDay.startOf('week'); // Sunday
  const lastDay = firstDay.endOf('month');
  const endOfWeek = lastDay.endOf('week');

  const weeks = [];
  let current = startOfWeek;

  while (current.isBefore(endOfWeek) || current.isSame(endOfWeek, 'day')) {
    const week = [];
    for (let i = 0; i < 7; i++) {
      week.push(current.format('YYYY-MM-DD'));
      current = current.add(1, 'day');
    }
    weeks.push(week);
  }
  return weeks;
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.sm,
  },
  weekHeader: {
    flexDirection: 'row',
    paddingVertical: spacing.sm,
  },
  weekHeaderCell: {
    flex: 1,
    alignItems: 'center',
  },
  weekHeaderText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  weekendText: {
    color: colors.expense,
  },
  weekRow: {
    flexDirection: 'row',
  },
});
