import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../../theme';

export default function CalendarHeader({ year, month, onPrev, onNext, monthlyTotal }) {
  const expense = monthlyTotal?.total_expense || 0;
  const income = monthlyTotal?.total_income || 0;

  return (
    <View style={styles.container}>
      <View style={styles.monthRow}>
        <TouchableOpacity onPress={onPrev} style={styles.arrowBtn}>
          <MaterialCommunityIcons name="chevron-left" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.monthText}>{year}年{month}月</Text>
        <TouchableOpacity onPress={onNext} style={styles.arrowBtn}>
          <MaterialCommunityIcons name="chevron-right" size={28} color={colors.text} />
        </TouchableOpacity>
      </View>
      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>支出</Text>
          <Text style={[styles.summaryAmount, { color: colors.expense }]}>¥{expense.toFixed(2)}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>收入</Text>
          <Text style={[styles.summaryAmount, { color: colors.income }]}>¥{income.toFixed(2)}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>结余</Text>
          <Text style={[styles.summaryAmount, { color: colors.text }]}>
            ¥{(income - expense).toFixed(2)}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  arrowBtn: {
    padding: spacing.sm,
  },
  monthText: {
    ...typography.h3,
    color: colors.text,
    marginHorizontal: spacing.xl,
    minWidth: 100,
    textAlign: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: spacing.lg,
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  summaryAmount: {
    ...typography.smallBold,
  },
  divider: {
    width: 1,
    height: 28,
    backgroundColor: colors.borderLight,
  },
});
