import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  Platform, TextInput, Modal, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSettingsStore } from '../../src/stores/useSettingsStore';
import { useTheme, typography, spacing } from '../../src/theme';
import { exportService } from '../../src/services/exportService';
import { getDatabase } from '../../src/database/connection';

const THEME_OPTIONS = [
  { key: 'light', label: '浅色', icon: 'white-balance-sunny' },
  { key: 'dark', label: '深色', icon: 'weather-night' },
  { key: 'system', label: '跟随系统', icon: 'theme-light-dark' },
];

export default function SettingsScreen() {
  const router = useRouter();
  const { currency, update } = useSettingsStore();
  const { themeMode, setThemeMode, colors } = useTheme();
  const [currencyModal, setCurrencyModal] = useState(false);
  const [tempCurrency, setTempCurrency] = useState(currency);
  const [clearStep, setClearStep] = useState(0); // 0: hidden, 1: first confirm, 2: second confirm
  const [clearResult, setClearResult] = useState(null); // null | 'success' | string (error)
  const [clearResultVisible, setClearResultVisible] = useState(false); // separate visibility from data
  const [clearing, setClearing] = useState(false);
  const [themeModalVisible, setThemeModalVisible] = useState(false);

  const handleExportCSV = async () => {
    try {
      await exportService.exportCSV();
      if (Platform.OS === 'web') {
        window.alert('数据已导出');
      } else {
        Alert.alert('导出成功', '数据已导出');
      }
    } catch (e) {
      if (Platform.OS === 'web') {
        window.alert('导出失败: ' + e.message);
      } else {
        Alert.alert('导出失败', e.message || '导出过程中发生错误');
      }
    }
  };

  const handleClearData = () => {
    setClearStep(1);
    setClearResult(null);
  };

  const doClearData = async () => {
    if (clearing) return;
    setClearing(true);
    setClearStep(0);
    try {
      const db = getDatabase();
      await db.runAsync('DELETE FROM images');
      await db.runAsync('DELETE FROM transactions');
      setClearResult('success');
      setClearResultVisible(true);
    } catch (e) {
      console.error('Clear data error:', e);
      setClearResult(e.message || '未知错误');
      setClearResultVisible(true);
    } finally {
      setClearing(false);
    }
  };

  const saveCurrency = async () => {
    if (tempCurrency.trim()) {
      await update('currency', tempCurrency.trim());
    }
    setCurrencyModal(false);
  };

  const settingItems = [
    {
      icon: 'currency-sign',
      title: '货币符号',
      subtitle: currency,
      onPress: () => { setTempCurrency(currency); setCurrencyModal(true); },
    },
    {
      icon: 'theme-light-dark',
      title: '主题模式',
      subtitle: THEME_OPTIONS.find(o => o.key === themeMode)?.label || '跟随系统',
      onPress: () => setThemeModalVisible(true),
    },
    {
      icon: 'database-import-outline',
      title: '导入数据',
      subtitle: '从支付宝/微信/京东/信用卡账单导入',
      onPress: () => router.push('/import'),
    },
    {
      icon: 'file-export-outline',
      title: '导出数据 (CSV)',
      subtitle: '导出所有记账记录为 CSV 文件',
      onPress: handleExportCSV,
    },
    {
      icon: 'delete-forever-outline',
      title: '清除所有数据',
      subtitle: '删除所有记账记录（不可恢复）',
      onPress: handleClearData,
      danger: true,
    },
  ];

  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>设置</Text>
      </View>
      <ScrollView>
        <View style={styles.section}>
          {settingItems.map((item, index) => (
            <React.Fragment key={item.title}>
              <TouchableOpacity style={styles.settingItem} onPress={item.onPress}>
                <View style={[styles.settingIcon, item.danger && { backgroundColor: colors.danger + '15' }]}>
                  <MaterialCommunityIcons
                    name={item.icon}
                    size={22}
                    color={item.danger ? colors.danger : colors.primary}
                  />
                </View>
                <View style={styles.settingInfo}>
                  <Text style={[styles.settingTitle, item.danger && { color: colors.danger }]}>
                    {item.title}
                  </Text>
                  <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textLight} />
              </TouchableOpacity>
              {index < settingItems.length - 1 && <View style={styles.divider} />}
            </React.Fragment>
          ))}
        </View>

        {/* About */}
        <View style={styles.section}>
          <View style={styles.aboutCard}>
            <MaterialCommunityIcons name="wallet-outline" size={40} color={colors.primary} />
            <Text style={styles.appName}>Zenny</Text>
            <Text style={styles.appVersion}>版本 1.0.0</Text>
            <Text style={styles.appDesc}>简洁优雅的记账体验</Text>
          </View>
        </View>
      </ScrollView>

      {/* Theme Modal */}
      <Modal visible={themeModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>选择主题</Text>
            {THEME_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.themeOption,
                  themeMode === option.key && styles.themeOptionActive,
                ]}
                onPress={() => {
                  setThemeMode(option.key);
                  setThemeModalVisible(false);
                }}
              >
                <MaterialCommunityIcons
                  name={option.icon}
                  size={22}
                  color={themeMode === option.key ? colors.primary : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.themeOptionText,
                    themeMode === option.key && styles.themeOptionTextActive,
                  ]}
                >
                  {option.label}
                </Text>
                {themeMode === option.key && (
                  <MaterialCommunityIcons name="check" size={20} color={colors.primary} style={styles.checkIcon} />
                )}
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={() => setThemeModalVisible(false)}
            >
              <Text style={styles.modalCancelText}>取消</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Currency Modal */}
      <Modal visible={currencyModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>设置货币符号</Text>
            <TextInput
              style={styles.modalInput}
              value={tempCurrency}
              onChangeText={setTempCurrency}
              maxLength={3}
              placeholder="¥"
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setCurrencyModal(false)}>
                <Text style={styles.modalCancelText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirmBtn} onPress={saveCurrency}>
                <Text style={styles.modalConfirmText}>确定</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Clear Data Confirm Modal - Step 1 */}
      <Modal visible={clearStep === 1} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <MaterialCommunityIcons name="alert-circle-outline" size={48} color={colors.danger} style={{ alignSelf: 'center', marginBottom: spacing.md }} />
            <Text style={styles.modalTitle}>清除所有数据</Text>
            <Text style={styles.clearWarningText}>此操作不可恢复，确定要清除所有记账数据吗？</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setClearStep(0)}>
                <Text style={styles.modalCancelText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.dangerBtn} onPress={() => setClearStep(2)}>
                <Text style={styles.modalConfirmText}>确认清除</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Clear Data Confirm Modal - Step 2 */}
      <Modal visible={clearStep === 2} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <MaterialCommunityIcons name="delete-forever" size={48} color={colors.danger} style={{ alignSelf: 'center', marginBottom: spacing.md }} />
            <Text style={styles.modalTitle}>二次确认</Text>
            <Text style={styles.clearWarningText}>真的要删除所有数据吗？删除后无法恢复！</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setClearStep(0)}>
                <Text style={styles.modalCancelText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.dangerBtn} onPress={doClearData}>
                <Text style={styles.modalConfirmText}>立即删除</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Clear Data Result Modal */}
      <Modal visible={clearResultVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <MaterialCommunityIcons
              name={clearResult === 'success' ? 'check-circle-outline' : 'close-circle-outline'}
              size={48}
              color={clearResult === 'success' ? colors.income : colors.danger}
              style={{ alignSelf: 'center', marginBottom: spacing.md }}
            />
            <Text style={styles.modalTitle}>
              {clearResult === 'success' ? '清除完成' : '清除失败'}
            </Text>
            <Text style={styles.clearWarningText}>
              {clearResult === 'success' ? '所有记账数据已清除' : clearResult}
            </Text>
            <TouchableOpacity style={styles.modalConfirmBtn} onPress={() => setClearResultVisible(false)}>
              <Text style={styles.modalConfirmText}>确定</Text>
            </TouchableOpacity>
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
  section: {
    backgroundColor: colors.surface, marginTop: spacing.lg, marginHorizontal: spacing.lg,
    borderRadius: 12, overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row', alignItems: 'center', padding: spacing.lg,
  },
  settingIcon: {
    width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.primary + '15', marginRight: spacing.md,
  },
  settingInfo: { flex: 1 },
  settingTitle: { ...typography.body, color: colors.text, fontWeight: '500' },
  settingSubtitle: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  divider: { height: 1, backgroundColor: colors.borderLight, marginLeft: 68 },
  aboutCard: {
    alignItems: 'center', paddingVertical: spacing.xxl,
  },
  appName: { ...typography.h3, color: colors.text, marginTop: spacing.md },
  appVersion: { ...typography.caption, color: colors.textSecondary, marginTop: 4 },
  appDesc: { ...typography.small, color: colors.textSecondary, marginTop: spacing.sm },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.surface, borderRadius: 16, padding: spacing.xl, width: 280,
  },
  modalTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.lg, textAlign: 'center' },
  modalInput: {
    backgroundColor: colors.surfaceSecondary, borderRadius: 12, padding: spacing.lg,
    ...typography.h2, textAlign: 'center', color: colors.text,
  },
  modalActions: {
    flexDirection: 'row', marginTop: spacing.xl, gap: spacing.md,
  },
  modalCancelBtn: {
    flex: 1, paddingVertical: spacing.md, borderRadius: 10,
    backgroundColor: colors.surfaceSecondary, alignItems: 'center',
  },
  modalCancelText: { ...typography.bodyBold, color: colors.textSecondary },
  modalConfirmBtn: {
    flex: 1, paddingVertical: spacing.md, borderRadius: 10,
    backgroundColor: colors.primary, alignItems: 'center',
  },
  modalConfirmText: { ...typography.bodyBold, color: colors.white },
  dangerBtn: {
    flex: 1, paddingVertical: spacing.md, borderRadius: 10,
    backgroundColor: colors.danger, alignItems: 'center',
  },
  clearWarningText: {
    ...typography.body, color: colors.textSecondary,
    textAlign: 'center', marginBottom: spacing.lg, lineHeight: 22,
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 10,
    marginBottom: spacing.sm,
    backgroundColor: colors.surfaceSecondary,
  },
  themeOptionActive: {
    backgroundColor: colors.primary + '15',
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  themeOptionText: {
    ...typography.body,
    color: colors.text,
    marginLeft: spacing.md,
    flex: 1,
  },
  themeOptionTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  checkIcon: {
    marginLeft: 'auto',
  },
});
