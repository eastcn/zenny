import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { useTransactionStore } from '../../src/stores/useTransactionStore';
import { useCategoryStore } from '../../src/stores/useCategoryStore';
import { useCalendarStore } from '../../src/stores/useCalendarStore';
import CategorySelector from '../../src/components/transaction/CategorySelector';
import SmartInput from '../../src/components/transaction/SmartInput';
import ImageAttachment from '../../src/components/transaction/ImageAttachment';
import { imageService } from '../../src/services/imageService';
import { imageRepo } from '../../src/database/repositories/imageRepo';
import { useTheme, typography, spacing } from '../../src/theme';

export default function AddTransactionScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const params = useLocalSearchParams();
  const { createTransaction } = useTransactionStore();
  const { expenseCategories, incomeCategories, loadAll } = useCategoryStore();
  const { loadSummary } = useCalendarStore();

  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState(null);
  const [date, setDate] = useState(params.date || dayjs().format('YYYY-MM-DD'));
  const [note, setNote] = useState('');
  const [images, setImages] = useState([]);

  useEffect(() => {
    loadAll();
  }, []);

  const categories = type === 'expense' ? expenseCategories : incomeCategories;

  // Auto select first category
  useEffect(() => {
    if (categories.length > 0 && !categoryId) {
      setCategoryId(categories[0].id);
    }
  }, [categories, type]);

  const handleTypeChange = useCallback((newType) => {
    setType(newType);
    setCategoryId(null);
  }, []);

  const handleParseResult = useCallback((result) => {
    if (result.amount !== null) setAmount(String(result.amount));
    if (result.categoryId) setCategoryId(result.categoryId);
    if (result.categoryName && !result.categoryId) {
      const cats = result.type === 'income' ? incomeCategories : expenseCategories;
      const found = cats.find((c) => c.name === result.categoryName);
      if (found) setCategoryId(found.id);
    }
    if (result.type) setType(result.type);
    if (result.note) setNote(result.note);
  }, [expenseCategories, incomeCategories]);

  const allCategories = [...expenseCategories, ...incomeCategories];

  const handleAddImage = useCallback(async (fromCamera) => {
    try {
      const assets = fromCamera
        ? await imageService.takePhoto()
        : await imageService.pickImage();
      if (assets.length > 0) {
        const newImages = assets.map((a) => ({
          uri: a.uri,
          width: a.width,
          height: a.height,
        }));
        setImages((prev) => [...prev, ...newImages]);
      }
    } catch (e) {
      Alert.alert('提示', e.message);
    }
  }, []);

  const handleRemoveImage = useCallback((index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSave = useCallback(async () => {
    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum <= 0) {
      Alert.alert('提示', '请输入有效金额');
      return;
    }
    if (!categoryId) {
      Alert.alert('提示', '请选择分类');
      return;
    }

    const txId = await createTransaction({
      amount: amountNum,
      category_id: categoryId,
      type,
      note,
      date,
    });

    // Save images
    for (const img of images) {
      const saved = await imageService.saveImage(img.uri);
      await imageRepo.create({
        transaction_id: txId,
        file_path: saved.filePath,
        thumbnail_path: saved.thumbnailPath,
        width: img.width,
        height: img.height,
      });
    }

    await loadSummary();
    router.back();
  }, [amount, categoryId, type, note, date, images]);

  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
            <MaterialCommunityIcons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>新增记录</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.flex} showsVerticalScrollIndicator={false}>
          {/* Type Toggle */}
          <View style={styles.typeRow}>
            <TouchableOpacity
              style={[styles.typeBtn, type === 'expense' && styles.typeBtnActive]}
              onPress={() => handleTypeChange('expense')}
            >
              <Text style={[styles.typeText, type === 'expense' && styles.typeTextActive]}>支出</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeBtn, type === 'income' && styles.typeBtnIncomeActive]}
              onPress={() => handleTypeChange('income')}
            >
              <Text style={[styles.typeText, type === 'income' && styles.typeTextIncomeActive]}>收入</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            {/* Smart Input */}
            <SmartInput
              categories={allCategories}
              onParseResult={handleParseResult}
            />

            {/* Amount */}
            <Text style={styles.label}>金额</Text>
            <View style={styles.amountRow}>
              <Text style={styles.currencySign}>¥</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="0.00"
                placeholderTextColor={colors.textLight}
                keyboardType="decimal-pad"
                value={amount}
                onChangeText={setAmount}
              />
            </View>

            {/* Category */}
            <Text style={styles.label}>分类</Text>
            <CategorySelector
              categories={categories}
              selectedId={categoryId}
              onSelect={(cat) => setCategoryId(cat.id)}
            />

            {/* Date */}
            <Text style={styles.label}>日期</Text>
            <View style={styles.dateRow}>
              <MaterialCommunityIcons name="calendar" size={20} color={colors.textSecondary} />
              <TextInput
                style={styles.dateInput}
                value={date}
                onChangeText={setDate}
                placeholder="YYYY-MM-DD"
              />
            </View>

            {/* Note */}
            <Text style={styles.label}>备注</Text>
            <TextInput
              style={styles.noteInput}
              placeholder="添加备注..."
              placeholderTextColor={colors.textLight}
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={3}
            />

            {/* Images */}
            <Text style={styles.label}>图片</Text>
            <ImageAttachment
              images={images}
              onAddFromCamera={() => handleAddImage(true)}
              onAddFromLibrary={() => handleAddImage(false)}
              onRemove={handleRemoveImage}
            />
          </View>
        </ScrollView>

        {/* Save Button */}
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.8}>
            <Text style={styles.saveBtnText}>保存</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  closeBtn: { padding: spacing.sm },
  headerTitle: { ...typography.h3, color: colors.text },
  typeRow: {
    flexDirection: 'row',
    padding: spacing.lg,
    gap: spacing.md,
    backgroundColor: colors.surface,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: 10,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
  },
  typeBtnActive: { backgroundColor: colors.expense + '15', borderWidth: 1.5, borderColor: colors.expense },
  typeBtnIncomeActive: { backgroundColor: colors.income + '15', borderWidth: 1.5, borderColor: colors.income },
  typeText: { ...typography.bodyBold, color: colors.textSecondary },
  typeTextActive: { color: colors.expense },
  typeTextIncomeActive: { color: colors.income },
  content: { padding: spacing.lg },
  label: {
    ...typography.smallBold,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    marginTop: spacing.lg,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    paddingHorizontal: spacing.lg,
    height: 56,
  },
  currencySign: { ...typography.h2, color: colors.text, marginRight: spacing.sm },
  amountInput: { flex: 1, ...typography.h2, color: colors.text, height: '100%' },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    paddingHorizontal: spacing.lg,
    height: 46,
    gap: spacing.sm,
  },
  dateInput: { flex: 1, ...typography.body, color: colors.text },
  noteInput: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    padding: spacing.lg,
    ...typography.body,
    color: colors.text,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  bottomBar: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  saveBtnText: { ...typography.bodyBold, color: colors.white },
});
