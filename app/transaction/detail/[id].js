import React, { useCallback, useState } from 'react';
import {
  View, Text, ScrollView, Image, TouchableOpacity,
  StyleSheet, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTransactionStore } from '../../../src/stores/useTransactionStore';
import { useCalendarStore } from '../../../src/stores/useCalendarStore';
import { useTheme, typography, spacing } from '../../../src/theme';
import { formatDate } from '../../../src/utils/formatters';

export default function TransactionDetailScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { id } = useLocalSearchParams();
  const { getById, deleteTransaction } = useTransactionStore();
  const { loadSummary } = useCalendarStore();
  const [tx, setTx] = useState(null);

  // 页面获得焦点时刷新数据
  useFocusEffect(
    useCallback(() => {
      async function loadTx() {
        const data = await getById(id);
        setTx(data);
      }
      loadTx();
    }, [id])
  );

  const handleEdit = () => {
    router.push(`/transaction/edit/${id}`);
  };

  const handleDelete = () => {
    Alert.alert('确认删除', '确定要删除这条记录吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          await deleteTransaction(id);
          await loadSummary();
          router.back();
        },
      },
    ]);
  };

  const styles = createStyles(colors);

  if (!tx) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
            <MaterialCommunityIcons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>记录详情</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>记录不存在</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isExpense = tx.type === 'expense';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <MaterialCommunityIcons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>记录详情</Text>
        <TouchableOpacity onPress={handleEdit} style={styles.closeBtn}>
          <MaterialCommunityIcons name="pencil" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.flex}>
        {/* Amount Card */}
        <View style={[styles.amountCard, { backgroundColor: isExpense ? colors.expenseLight : colors.incomeLight }]}>
          <View style={[styles.iconWrap, { backgroundColor: (tx.category_color || colors.textLight) + '30' }]}>
            <MaterialCommunityIcons name={tx.category_icon || 'help-circle'} size={32} color={tx.category_color} />
          </View>
          <Text style={styles.categoryName}>{tx.category_name || '未分类'}</Text>
          <Text style={[styles.amountText, { color: isExpense ? colors.expense : colors.income }]}>
            {isExpense ? '-' : '+'}¥{Number(tx.amount).toFixed(2)}
          </Text>
          <Text style={styles.typeTag}>{isExpense ? '支出' : '收入'}</Text>
        </View>

        {/* Detail Info */}
        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>日期</Text>
            <Text style={styles.infoValue}>{tx.date}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>备注</Text>
            <Text style={styles.infoValue}>{tx.note || '无'}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>创建时间</Text>
            <Text style={styles.infoValue}>{formatDate(tx.created_at, 'YYYY-MM-DD HH:mm')}</Text>
          </View>
        </View>

        {/* Images */}
        {tx.images && tx.images.length > 0 && (
          <View style={styles.imageSection}>
            <Text style={styles.sectionTitle}>图片附件</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {tx.images.map((img) => (
                <Image key={img.id} source={{ uri: img.file_path }} style={styles.image} />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Delete Button */}
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
          <MaterialCommunityIcons name="delete-outline" size={20} color={colors.danger} />
          <Text style={styles.deleteText}>删除记录</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.borderLight,
  },
  closeBtn: { padding: spacing.sm },
  headerTitle: { ...typography.h3, color: colors.text },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { ...typography.body, color: colors.textLight },
  amountCard: {
    alignItems: 'center', padding: spacing.xxl, margin: spacing.lg,
    borderRadius: 16,
  },
  iconWrap: {
    width: 60, height: 60, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md,
  },
  categoryName: { ...typography.bodyBold, color: colors.text, marginBottom: spacing.sm },
  amountText: { fontSize: 32, fontWeight: '700', marginBottom: spacing.sm },
  typeTag: { ...typography.caption, color: colors.textSecondary, backgroundColor: colors.surface, borderRadius: 6, paddingHorizontal: spacing.md, paddingVertical: 2 },
  infoSection: { backgroundColor: colors.surface, marginHorizontal: spacing.lg, borderRadius: 12, padding: spacing.lg },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.md },
  infoLabel: { ...typography.body, color: colors.textSecondary },
  infoValue: { ...typography.body, color: colors.text, fontWeight: '500', flex: 1, textAlign: 'right' },
  divider: { height: 1, backgroundColor: colors.borderLight },
  imageSection: { margin: spacing.lg },
  sectionTitle: { ...typography.bodyBold, color: colors.text, marginBottom: spacing.md },
  image: { width: 120, height: 120, borderRadius: 12, marginRight: spacing.md },
  deleteBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    margin: spacing.lg, padding: spacing.lg, borderRadius: 12,
    backgroundColor: colors.danger + '10', gap: spacing.sm,
  },
  deleteText: { ...typography.bodyBold, color: colors.danger },
});
