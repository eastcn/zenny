import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTransactionStore } from '../../../src/stores/useTransactionStore';
import { useCategoryStore } from '../../../src/stores/useCategoryStore';
import { useCalendarStore } from '../../../src/stores/useCalendarStore';
import CategorySelector from '../../../src/components/transaction/CategorySelector';
import ImageAttachment from '../../../src/components/transaction/ImageAttachment';
import { imageService } from '../../../src/services/imageService';
import { imageRepo } from '../../../src/database/repositories/imageRepo';
import { colors, typography, spacing } from '../../../src/theme';

export default function EditTransactionScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { getById, updateTransaction } = useTransactionStore();
  const { expenseCategories, incomeCategories, loadAll } = useCategoryStore();
  const { loadSummary } = useCalendarStore();

  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState(null);
  const [date, setDate] = useState('');
  const [note, setNote] = useState('');
  const [images, setImages] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function loadData() {
      await loadAll();
      const tx = await getById(id);
      if (tx) {
        setType(tx.type);
        setAmount(String(tx.amount));
        setCategoryId(tx.category_id);
        setDate(tx.date);
        setNote(tx.note || '');
        setImages(tx.images || []);
        setLoaded(true);
      }
    }
    loadData();
  }, [id]);

  const categories = type === 'expense' ? expenseCategories : incomeCategories;

  const handleAddImage = useCallback(async (fromCamera) => {
    try {
      const assets = fromCamera
        ? await imageService.takePhoto()
        : await imageService.pickImage();
      if (assets.length > 0) {
        const newImages = assets.map((a) => ({ uri: a.uri, width: a.width, height: a.height }));
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

    await updateTransaction(id, { amount: amountNum, category_id: categoryId, type, note, date });

    // Re-save images: delete old, add new
    await imageRepo.deleteByTransactionId(id);
    for (const img of images) {
      const uri = img.file_path || img.uri;
      if (uri) {
        const saved = img.file_path ? img : await imageService.saveImage(uri);
        await imageRepo.create({
          transaction_id: id,
          file_path: saved.filePath || saved.file_path,
          thumbnail_path: saved.thumbnailPath || saved.thumbnail_path,
          width: img.width,
          height: img.height,
        });
      }
    }

    await loadSummary();
    router.back();
  }, [amount, categoryId, type, note, date, images, id]);

  if (!loaded) return null;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
            <MaterialCommunityIcons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>编辑记录</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.flex} showsVerticalScrollIndicator={false}>
          <View style={styles.typeRow}>
            <TouchableOpacity
              style={[styles.typeBtn, type === 'expense' && styles.typeBtnActive]}
              onPress={() => { setType('expense'); setCategoryId(null); }}
            >
              <Text style={[styles.typeText, type === 'expense' && styles.typeTextActive]}>支出</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeBtn, type === 'income' && styles.typeBtnIncomeActive]}
              onPress={() => { setType('income'); setCategoryId(null); }}
            >
              <Text style={[styles.typeText, type === 'income' && styles.typeTextIncomeActive]}>收入</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <Text style={styles.label}>金额</Text>
            <View style={styles.amountRow}>
              <Text style={styles.currencySign}>¥</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="0.00"
                keyboardType="decimal-pad"
                value={amount}
                onChangeText={setAmount}
              />
            </View>

            <Text style={styles.label}>分类</Text>
            <CategorySelector categories={categories} selectedId={categoryId} onSelect={(c) => setCategoryId(c.id)} />

            <Text style={styles.label}>日期</Text>
            <View style={styles.dateRow}>
              <MaterialCommunityIcons name="calendar" size={20} color={colors.textSecondary} />
              <TextInput style={styles.dateInput} value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" />
            </View>

            <Text style={styles.label}>备注</Text>
            <TextInput
              style={styles.noteInput}
              placeholder="添加备注..."
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={3}
            />

            <Text style={styles.label}>图片</Text>
            <ImageAttachment
              images={images}
              onAddFromCamera={() => handleAddImage(true)}
              onAddFromLibrary={() => handleAddImage(false)}
              onRemove={handleRemoveImage}
            />
          </View>
        </ScrollView>

        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.8}>
            <Text style={styles.saveBtnText}>保存修改</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.borderLight,
  },
  closeBtn: { padding: spacing.sm },
  headerTitle: { ...typography.h3, color: colors.text },
  typeRow: { flexDirection: 'row', padding: spacing.lg, gap: spacing.md, backgroundColor: colors.white },
  typeBtn: { flex: 1, paddingVertical: spacing.md, borderRadius: 10, backgroundColor: colors.surfaceSecondary, alignItems: 'center' },
  typeBtnActive: { backgroundColor: colors.expense + '15', borderWidth: 1.5, borderColor: colors.expense },
  typeBtnIncomeActive: { backgroundColor: colors.income + '15', borderWidth: 1.5, borderColor: colors.income },
  typeText: { ...typography.bodyBold, color: colors.textSecondary },
  typeTextActive: { color: colors.expense },
  typeTextIncomeActive: { color: colors.income },
  content: { padding: spacing.lg },
  label: { ...typography.smallBold, color: colors.textSecondary, marginBottom: spacing.sm, marginTop: spacing.lg },
  amountRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceSecondary, borderRadius: 12, paddingHorizontal: spacing.lg, height: 56 },
  currencySign: { ...typography.h2, color: colors.text, marginRight: spacing.sm },
  amountInput: { flex: 1, ...typography.h2, color: colors.text, height: '100%' },
  dateRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceSecondary, borderRadius: 12, paddingHorizontal: spacing.lg, height: 46, gap: spacing.sm },
  dateInput: { flex: 1, ...typography.body, color: colors.text },
  noteInput: { backgroundColor: colors.surfaceSecondary, borderRadius: 12, padding: spacing.lg, ...typography.body, color: colors.text, minHeight: 80, textAlignVertical: 'top' },
  bottomBar: { padding: spacing.lg, backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.borderLight },
  saveBtn: { backgroundColor: colors.primary, borderRadius: 12, paddingVertical: spacing.lg, alignItems: 'center' },
  saveBtnText: { ...typography.bodyBold, color: colors.white },
});
