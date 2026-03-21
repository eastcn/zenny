import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import dayjs from 'dayjs';
import { useTheme, typography, spacing } from '../../theme';

export default function CalendarDay({ date, isCurrentMonth, isToday, isSelected, summary, onPress }) {
  const { colors } = useTheme();
  if (!date) {
    return <View style={styles.cell} />;
  }

  const dayNum = dayjs(date).date();
  const expense = summary?.expense || 0;
  const income = summary?.income || 0;
  const hasData = expense > 0 || income > 0;

  const styles = createStyles(colors);

  return (
    <TouchableOpacity
      style={[
        styles.cell,
        isToday && styles.todayCell,
        isSelected && styles.selectedCell,
        !isCurrentMonth && styles.otherMonthCell,
      ]}
      onPress={() => onPress(date)}
      activeOpacity={0.6}
    >
      <Text
        style={[
          styles.dayText,
          isToday && styles.todayText,
          isSelected && styles.selectedText,
          !isCurrentMonth && styles.otherMonthText,
        ]}
      >
        {dayNum}
      </Text>
      {hasData && isCurrentMonth && (
        <View style={styles.amountContainer}>
          {expense > 0 && (
            <Text style={styles.expenseText} numberOfLines={1}>
              -{formatShort(expense)}
            </Text>
          )}
          {income > 0 && (
            <Text style={styles.incomeText} numberOfLines={1}>
              +{formatShort(income)}
            </Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

function formatShort(amount) {
  if (amount >= 10000) return (amount / 10000).toFixed(1) + '万';
  if (amount >= 1000) return (amount / 1000).toFixed(1) + 'k';
  return amount.toFixed(0);
}

const createStyles = (colors) => StyleSheet.create({
  cell: {
    flex: 1,
    minHeight: 58,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 4,
    paddingBottom: 2,
    borderRadius: 8,
    margin: 1,
  },
  todayCell: {
    backgroundColor: colors.primaryLight + '18',
  },
  selectedCell: {
    backgroundColor: colors.primary + '22',
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  otherMonthCell: {
    opacity: 0.3,
  },
  dayText: {
    ...typography.small,
    fontWeight: '500',
    color: colors.text,
  },
  todayText: {
    color: colors.primary,
    fontWeight: '700',
  },
  selectedText: {
    color: colors.primary,
    fontWeight: '700',
  },
  otherMonthText: {
    color: colors.textLight,
  },
  amountContainer: {
    alignItems: 'center',
    marginTop: 1,
  },
  expenseText: {
    fontSize: 9,
    color: colors.expense,
    fontWeight: '500',
  },
  incomeText: {
    fontSize: 9,
    color: colors.income,
    fontWeight: '500',
  },
});
