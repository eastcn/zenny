import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme, typography, spacing } from '../../theme';

export default function TransactionItem({ item, onPress }) {
  const { colors } = useTheme();
  const isExpense = item.type === 'expense';
  const styles = createStyles(colors);

  return (
    <TouchableOpacity style={styles.container} onPress={() => onPress?.(item)} activeOpacity={0.6}>
      <View style={[styles.iconWrap, { backgroundColor: (item.category_color || colors.textLight) + '20' }]}>
        <MaterialCommunityIcons
          name={item.category_icon || 'help-circle'}
          size={22}
          color={item.category_color || colors.textLight}
        />
      </View>
      <View style={styles.info}>
        <Text style={styles.categoryText}>{item.category_name || '未分类'}</Text>
        {item.note ? (
          <Text style={styles.noteText} numberOfLines={1}>{item.note}</Text>
        ) : null}
      </View>
      <Text style={[styles.amountText, { color: isExpense ? colors.expense : colors.income }]}>
        {isExpense ? '-' : '+'}¥{Number(item.amount).toFixed(2)}
      </Text>
    </TouchableOpacity>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  info: {
    flex: 1,
  },
  categoryText: {
    ...typography.body,
    color: colors.text,
    fontWeight: '500',
  },
  noteText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  amountText: {
    ...typography.bodyBold,
    marginLeft: spacing.sm,
  },
});
