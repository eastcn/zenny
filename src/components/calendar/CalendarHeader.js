import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme, typography, spacing } from '../../theme';

export default function CalendarHeader({ year, month, onPrev, onNext, onMonthSelect, monthlyTotal }) {
  const { colors } = useTheme();
  const [pickerVisible, setPickerVisible] = useState(false);
  const expense = monthlyTotal?.total_expense || 0;
  const income = monthlyTotal?.total_income || 0;

  // Generate years: current year and 2 years back
  const currentYear = new Date().getFullYear();
  const years = [currentYear, currentYear - 1, currentYear - 2];
  const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  const handleMonthPress = (y, m) => {
    onMonthSelect(y, m);
    setPickerVisible(false);
  };

  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <View style={styles.monthRow}>
        <TouchableOpacity onPress={onPrev} style={styles.arrowBtn}>
          <MaterialCommunityIcons name="chevron-left" size={28} color={colors.text} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setPickerVisible(true)} style={styles.monthBtn}>
          <Text style={styles.monthText}>{year}年{month}月</Text>
          <MaterialCommunityIcons name="chevron-down" size={18} color={colors.textSecondary} style={styles.dropdownIcon} />
        </TouchableOpacity>
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

      {/* Month Picker Modal */}
      <Modal visible={pickerVisible} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setPickerVisible(false)}
        >
          <View style={styles.pickerContainer}>
            <Text style={styles.pickerTitle}>选择月份</Text>
            <ScrollView style={styles.pickerScroll}>
              {years.map((y) => (
                <View key={y} style={styles.yearRow}>
                  <Text style={styles.yearLabel}>{y}年</Text>
                  <View style={styles.monthsGrid}>
                    {months.map((m) => (
                      <TouchableOpacity
                        key={`${y}-${m}`}
                        style={[
                          styles.monthItem,
                          y === year && m === month && styles.monthItemSelected,
                        ]}
                        onPress={() => handleMonthPress(y, m)}
                      >
                        <Text
                          style={[
                            styles.monthItemText,
                            y === year && m === month && styles.monthItemTextSelected,
                          ]}
                        >
                          {m}月
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
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
  monthBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  monthText: {
    ...typography.h3,
    color: colors.text,
    marginHorizontal: spacing.sm,
  },
  dropdownIcon: {
    marginLeft: 2,
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerContainer: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    width: 320,
    maxHeight: 400,
  },
  pickerTitle: {
    ...typography.h3,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  pickerScroll: {
    maxHeight: 320,
  },
  yearRow: {
    marginBottom: spacing.md,
  },
  yearLabel: {
    ...typography.bodyBold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  monthsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  monthItem: {
    width: '25%',
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: 8,
  },
  monthItemSelected: {
    backgroundColor: colors.primary + '15',
  },
  monthItemText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  monthItemTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
});
