import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  SafeAreaView, Alert, TextInput, Modal,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSettingsStore } from '../../src/stores/useSettingsStore';
import { exportService } from '../../src/services/exportService';
import { getDatabase } from '../../src/database/connection';
import { colors, typography, spacing } from '../../src/theme';

export default function SettingsScreen() {
  const { currency, update } = useSettingsStore();
  const [currencyModal, setCurrencyModal] = useState(false);
  const [tempCurrency, setTempCurrency] = useState(currency);

  const handleExportCSV = async () => {
    try {
      await exportService.exportCSV();
      Alert.alert('成功', '数据已导出');
    } catch (e) {
      Alert.alert('导出失败', e.message);
    }
  };

  const handleClearData = () => {
    Alert.alert(
      '清除所有数据',
      '此操作不可恢复，确定要清除所有记账数据吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确认清除',
          style: 'destructive',
          onPress: () => {
            Alert.alert('二次确认', '真的要删除所有数据吗？', [
              { text: '取消', style: 'cancel' },
              {
                text: '删除',
                style: 'destructive',
                onPress: async () => {
                  const db = getDatabase();
                  await db.execAsync('DELETE FROM images');
                  await db.execAsync('DELETE FROM transactions');
                  Alert.alert('完成', '所有记账数据已清除');
                },
              },
            ]);
          },
        },
      ]
    );
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
            <Text style={styles.appName}>MyMoneyKeeper</Text>
            <Text style={styles.appVersion}>版本 1.0.0</Text>
            <Text style={styles.appDesc}>简洁好用的记账工具</Text>
          </View>
        </View>
      </ScrollView>

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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: spacing.lg, paddingVertical: spacing.lg,
    backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.borderLight,
  },
  headerTitle: { ...typography.h2, color: colors.text },
  section: {
    backgroundColor: colors.white, marginTop: spacing.lg, marginHorizontal: spacing.lg,
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
    backgroundColor: colors.white, borderRadius: 16, padding: spacing.xl, width: 280,
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
});
