import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  StyleSheet, Alert, Modal, Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCategoryStore } from '../../src/stores/useCategoryStore';
import { batchUpdateCategory } from '../../src/services/import/importService';
import { useTheme, typography, spacing } from '../../src/theme';
import { CATEGORY_ICONS, CATEGORY_COLORS } from '../../src/utils/constants';

export default function CategoriesScreen() {
  const { colors } = useTheme();
  const {
    expenseCategories, incomeCategories,
    loadAll, createCategory, updateCategory, deleteCategory,
  } = useCategoryStore();
  const [tab, setTab] = useState('expense');
  const [modalVisible, setModalVisible] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formName, setFormName] = useState('');
  const [formIcon, setFormIcon] = useState(CATEGORY_ICONS[0]);
  const [formColor, setFormColor] = useState(CATEGORY_COLORS[0]);

  // Batch merge state
  const [mergeModalVisible, setMergeModalVisible] = useState(false);
  const [fromCategory, setFromCategory] = useState(null);
  const [toCategory, setToCategory] = useState(null);
  const [isMerging, setIsMerging] = useState(false);
  const [mergeSuccess, setMergeSuccess] = useState(false);
  const mergeSuccessTimer = useRef(null);

  // 页面获得焦点时刷新数据
  useFocusEffect(
    useCallback(() => {
      loadAll();
    }, [])
  );

  const categories = tab === 'expense' ? expenseCategories : incomeCategories;

  const openAdd = useCallback(() => {
    setEditId(null);
    setFormName('');
    setFormIcon(CATEGORY_ICONS[0]);
    setFormColor(CATEGORY_COLORS[0]);
    setModalVisible(true);
  }, []);

  const openEdit = useCallback((cat) => {
    setEditId(cat.id);
    setFormName(cat.name);
    setFormIcon(cat.icon);
    setFormColor(cat.color);
    setModalVisible(true);
  }, []);

  const handleSave = useCallback(async () => {
    if (!formName.trim()) {
      Alert.alert('提示', '请输入分类名称');
      return;
    }
    if (editId) {
      await updateCategory(editId, { name: formName.trim(), icon: formIcon, color: formColor });
    } else {
      await createCategory({ name: formName.trim(), icon: formIcon, color: formColor, type: tab });
    }
    setModalVisible(false);
  }, [editId, formName, formIcon, formColor, tab]);

  const handleDelete = useCallback((cat) => {
    if (cat.is_preset) {
      Alert.alert('提示', '预设分类不能删除');
      return;
    }
    Alert.alert('确认删除', `确定要删除分类「${cat.name}」吗？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '删除', style: 'destructive',
        onPress: async () => {
          const success = await deleteCategory(cat.id);
          if (!success) Alert.alert('提示', '删除失败');
        },
      },
    ]);
  }, []);

  // Batch merge functions
  const openMergeModal = useCallback(() => {
    setFromCategory(null);
    setToCategory(null);
    setMergeModalVisible(true);
  }, []);

  const handleFromCategorySelect = useCallback((cat) => {
    setFromCategory(cat);
    // Clear toCategory if it's the same as the newly selected fromCategory
    setToCategory((prev) => (prev?.id === cat.id ? null : prev));
  }, []);

  const handleToCategorySelect = useCallback((cat) => {
    setToCategory(cat);
  }, []);

  const executeMerge = useCallback(async () => {
    console.log('[Merge] Execute merge', { fromCategory, toCategory });
    setIsMerging(true);
    try {
      await batchUpdateCategory(fromCategory.id, toCategory.id);
      await deleteCategory(fromCategory.id);
      setIsMerging(false);
      setMergeSuccess(true);
      // Show success message for 1.5s then close modal
      mergeSuccessTimer.current = setTimeout(() => {
        setMergeModalVisible(false);
        setMergeSuccess(false);
        // Reset selections after successful merge
        setFromCategory(null);
        setToCategory(null);
      }, 1500);
    } catch (e) {
      console.error('[Merge] Error:', e);
      setIsMerging(false);
      if (Platform.OS === 'web') {
        window.alert('合并失败: ' + e.message);
      } else {
        Alert.alert('错误', '合并失败: ' + e.message);
      }
    }
  }, [fromCategory, toCategory, deleteCategory]);

  // Clear timer on unmount
  useEffect(() => {
    return () => {
      if (mergeSuccessTimer.current) {
        clearTimeout(mergeSuccessTimer.current);
      }
    };
  }, []);

  const handleMerge = useCallback(() => {
    console.log('[Merge] handleMerge called', { fromCategory, toCategory });
    if (!fromCategory) {
      if (Platform.OS === 'web') {
        window.alert('请选择要合并的分类');
      } else {
        Alert.alert('提示', '请选择要合并的分类');
      }
      return;
    }
    if (!toCategory) {
      if (Platform.OS === 'web') {
        window.alert('请选择合并到哪个分类');
      } else {
        Alert.alert('提示', '请选择合并到哪个分类');
      }
      return;
    }
    if (fromCategory.id === toCategory.id) {
      if (Platform.OS === 'web') {
        window.alert('不能合并到同一个分类');
      } else {
        Alert.alert('提示', '不能合并到同一个分类');
      }
      return;
    }

    // Execute merge directly without confirmation dialog
    executeMerge();
  }, [fromCategory, toCategory, executeMerge]);

  const allCategories = [...expenseCategories, ...incomeCategories];
  // Source category: only non-preset (can be deleted)
  const selectableCategories = allCategories.filter(c => !c.is_preset);
  // Target category: all categories including preset (can merge to preset)

  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>分类管理</Text>
          <TouchableOpacity style={styles.mergeBtn} onPress={openMergeModal}>
            <MaterialCommunityIcons name="merge" size={20} color={colors.primary} />
            <Text style={styles.mergeBtnText}>批量合并</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tab Toggle */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'expense' && styles.tabBtnActive]}
          onPress={() => setTab('expense')}
        >
          <Text style={[styles.tabText, tab === 'expense' && styles.tabTextActive]}>支出分类</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'income' && styles.tabBtnActive]}
          onPress={() => setTab('income')}
        >
          <Text style={[styles.tabText, tab === 'income' && styles.tabTextActive]}>收入分类</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.grid}>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={styles.catItem}
            onPress={() => openEdit(cat)}
            onLongPress={() => handleDelete(cat)}
          >
            <View style={[styles.catIcon, { backgroundColor: cat.color + '20' }]}>
              <MaterialCommunityIcons name={cat.icon} size={28} color={cat.color} />
            </View>
            <Text style={styles.catName} numberOfLines={1}>{cat.name}</Text>
            {cat.is_preset ? <Text style={styles.presetBadge}>预设</Text> : null}
          </TouchableOpacity>
        ))}
        {/* Add Button */}
        <TouchableOpacity style={styles.catItem} onPress={openAdd}>
          <View style={[styles.catIcon, { backgroundColor: colors.surfaceSecondary }]}>
            <MaterialCommunityIcons name="plus" size={28} color={colors.textSecondary} />
          </View>
          <Text style={styles.catName}>新增</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editId ? '编辑分类' : '新增分类'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Preview */}
            <View style={styles.previewRow}>
              <View style={[styles.previewIcon, { backgroundColor: formColor + '20' }]}>
                <MaterialCommunityIcons name={formIcon} size={32} color={formColor} />
              </View>
              <Text style={[styles.previewName, { color: formColor }]}>{formName || '分类名称'}</Text>
            </View>

            {/* Name Input */}
            <TextInput
              style={styles.nameInput}
              placeholder="分类名称"
              placeholderTextColor={colors.textLight}
              value={formName}
              onChangeText={setFormName}
              maxLength={10}
            />

            {/* Icon Picker */}
            <Text style={styles.pickerLabel}>选择图标</Text>
            <ScrollView style={styles.iconGrid} contentContainerStyle={styles.iconGridContent}>
              {CATEGORY_ICONS.map((icon) => (
                <TouchableOpacity
                  key={icon}
                  style={[styles.iconItem, formIcon === icon && { backgroundColor: formColor + '20', borderColor: formColor, borderWidth: 2 }]}
                  onPress={() => setFormIcon(icon)}
                >
                  <MaterialCommunityIcons name={icon} size={22} color={formIcon === icon ? formColor : colors.textSecondary} />
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Color Picker */}
            <Text style={styles.pickerLabel}>选择颜色</Text>
            <View style={styles.colorRow}>
              {CATEGORY_COLORS.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.colorItem, { backgroundColor: c }, formColor === c && styles.colorItemActive]}
                  onPress={() => setFormColor(c)}
                >
                  {formColor === c && <MaterialCommunityIcons name="check" size={16} color="#fff" />}
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.modalSaveBtn} onPress={handleSave}>
              <Text style={styles.modalSaveBtnText}>保存</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Batch Merge Modal */}
      <Modal visible={mergeModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>批量合并分类</Text>
              <TouchableOpacity onPress={() => setMergeModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.mergeHint}>
                将一个分类的所有记录合并到另一个分类，源分类将被删除
              </Text>

              {/* From Category */}
              <Text style={styles.mergeLabel}>选择要合并的分类</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mergeScroll}>
                <View style={styles.mergeRow}>
                  {selectableCategories.map((cat) => (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        styles.mergeCatItem,
                        fromCategory?.id === cat.id && styles.mergeCatItemSelected,
                      ]}
                      onPress={() => handleFromCategorySelect(cat)}
                    >
                      <MaterialCommunityIcons
                        name={cat.icon}
                        size={20}
                        color={fromCategory?.id === cat.id ? colors.white : cat.color}
                      />
                      <Text
                        style={[
                          styles.mergeCatText,
                          fromCategory?.id === cat.id && styles.mergeCatTextSelected,
                        ]}
                        numberOfLines={1}
                      >
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              {/* Arrow */}
              <View style={styles.mergeArrow}>
                <MaterialCommunityIcons name="arrow-down" size={24} color={colors.textSecondary} />
                <Text style={styles.mergeArrowText}>合并到</Text>
                <MaterialCommunityIcons name="arrow-down" size={24} color={colors.textSecondary} />
              </View>

              {/* To Category */}
              <Text style={styles.mergeLabel}>选择目标分类</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mergeScroll}>
                <View style={styles.mergeRow}>
                  {allCategories
                    .filter(c => c.id !== fromCategory?.id)
                    .map((cat) => (
                      <TouchableOpacity
                        key={cat.id}
                        style={[
                          styles.mergeCatItem,
                          toCategory?.id === cat.id && styles.mergeCatItemSelected,
                        ]}
                        onPress={() => handleToCategorySelect(cat)}
                      >
                        <MaterialCommunityIcons
                          name={cat.icon}
                          size={20}
                          color={toCategory?.id === cat.id ? colors.white : cat.color}
                        />
                        <Text
                          style={[
                            styles.mergeCatText,
                            toCategory?.id === cat.id && styles.mergeCatTextSelected,
                          ]}
                          numberOfLines={1}
                        >
                          {cat.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                </View>
              </ScrollView>
            </ScrollView>

            {/* Merge button with loading and success states */}
            {mergeSuccess ? (
              <View style={[styles.modalSaveBtn, styles.modalSaveBtnSuccess]}>
                <MaterialCommunityIcons name="check-circle" size={20} color={colors.white} style={styles.successIcon} />
                <Text style={styles.modalSaveBtnText}>合并成功</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={[
                  styles.modalSaveBtn,
                  (!fromCategory || !toCategory || isMerging) && styles.modalSaveBtnDisabled,
                ]}
                onPress={handleMerge}
                disabled={!fromCategory || !toCategory || isMerging}
              >
                {isMerging ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Text style={styles.modalSaveBtnText}>确认合并</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: spacing.lg, paddingVertical: spacing.lg,
    backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.borderLight,
  },
  headerTitle: { ...typography.h2, color: colors.text },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mergeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '15',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    gap: 4,
  },
  mergeBtnText: {
    ...typography.small,
    color: colors.primary,
    fontWeight: '500',
  },
  tabRow: {
    flexDirection: 'row', margin: spacing.lg, backgroundColor: colors.surfaceSecondary,
    borderRadius: 10, padding: 3,
  },
  tabBtn: { flex: 1, paddingVertical: spacing.sm, borderRadius: 8, alignItems: 'center' },
  tabBtnActive: { backgroundColor: colors.surface },
  tabText: { ...typography.small, color: colors.textSecondary },
  tabTextActive: { color: colors.text, fontWeight: '600' },
  grid: {
    flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing.md,
  },
  catItem: {
    width: '25%', alignItems: 'center', paddingVertical: spacing.md,
  },
  catIcon: {
    width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 6,
  },
  catName: { ...typography.caption, color: colors.text, textAlign: 'center' },
  presetBadge: { fontSize: 9, color: colors.textLight, backgroundColor: colors.surfaceSecondary, borderRadius: 4, paddingHorizontal: 4, marginTop: 2 },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: spacing.xl, maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg,
  },
  modalTitle: { ...typography.h3, color: colors.text },
  previewRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: spacing.lg, gap: spacing.md,
  },
  previewIcon: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  previewName: { ...typography.h3 },
  nameInput: {
    backgroundColor: colors.surfaceSecondary, borderRadius: 12, padding: spacing.lg,
    ...typography.body, color: colors.text, marginBottom: spacing.lg,
  },
  pickerLabel: { ...typography.smallBold, color: colors.textSecondary, marginBottom: spacing.sm },
  iconGrid: { maxHeight: 160, marginBottom: spacing.lg },
  iconGridContent: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  iconItem: {
    width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.surfaceSecondary,
  },
  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.xl },
  colorItem: {
    width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
  },
  colorItemActive: { borderWidth: 3, borderColor: colors.white, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 4 },
  modalSaveBtn: {
    backgroundColor: colors.primary, borderRadius: 12, paddingVertical: spacing.lg, alignItems: 'center',
  },
  modalSaveBtnDisabled: {
    backgroundColor: colors.textLight,
  },
  modalSaveBtnText: { ...typography.bodyBold, color: colors.white },
  // Merge modal styles
  mergeHint: {
    ...typography.small,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  mergeLabel: {
    ...typography.smallBold,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  mergeScroll: {
    marginBottom: spacing.lg,
  },
  mergeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  mergeCatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    gap: 4,
    minWidth: 60,
  },
  mergeCatItemSelected: {
    backgroundColor: colors.primary,
  },
  mergeCatText: {
    ...typography.small,
    color: colors.text,
  },
  mergeCatTextSelected: {
    color: colors.white,
  },
  modalSaveBtnSuccess: {
    backgroundColor: colors.success,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  successIcon: {
    marginRight: 4,
  },
  mergeArrow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  mergeArrowText: {
    ...typography.small,
    color: colors.textSecondary,
  },
});
