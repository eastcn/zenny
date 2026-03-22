import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Alert, ActivityIndicator, FlatList, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useNavigation } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { pickImportFile, getImportPreview, importTransactions, detectFileType } from '../src/services/import/importService';
import { useCalendarStore } from '../src/stores/useCalendarStore';
import { useTheme, typography, spacing } from '../src/theme';

const FILE_TYPE_LABELS = {
  zenny: 'Zenny 导出',
  alipay: '支付宝',
  wechat: '微信支付',
  jd: '京东',
  totalbelt: '总账/信用卡',
};

export default function ImportScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { loadSummary } = useCalendarStore();
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [fileInfo, setFileInfo] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null); // null | { success: boolean, message: string }
  const [resultVisible, setResultVisible] = useState(false);

  const handlePickFile = async () => {
    setLoading(true);
    setPreview(null);
    setFileInfo(null);
    try {
      const file = await pickImportFile();
      if (!file) {
        setLoading(false);
        return;
      }
      setFileInfo(file);
      const fileType = detectFileType(file.name);
      console.log('[ImportScreen] Selected file:', file.name, 'type:', fileType, 'uri:', file.uri);
      const previewData = await getImportPreview(file.uri, file.name);
      setPreview({ ...previewData, fileType });
    } catch (e) {
      console.error('[ImportScreen] Error:', e);
      Alert.alert('错误', '读取文件失败: ' + (e.message || e));
    } finally {
      setLoading(false);
    }
  };

  // Prevent back navigation when importing
  useEffect(() => {
    if (importing) {
      navigation.setOptions({ gestureEnabled: false });
    } else {
      navigation.setOptions({ gestureEnabled: true });
    }
  }, [importing, navigation]);

  const handleImport = async () => {
    if (!fileInfo) return;
    setImporting(true);
    setImportResult(null);
    try {
      const { parseFile } = await import('../src/services/import/importService');
      const rows = await parseFile(fileInfo.uri, fileInfo.name);
      const result = await importTransactions(rows);
      await loadSummary();
      setImportResult({
        success: true,
        message: `成功导入 ${result.imported} 条记录${result.skipped > 0 ? `，跳过 ${result.skipped} 条` : ''}`,
      });
      setResultVisible(true);
    } catch (e) {
      console.error('[ImportScreen] Import error:', e);
      setImportResult({
        success: false,
        message: e.message || '导入失败，请检查文件格式',
      });
      setResultVisible(true);
    } finally {
      setImporting(false);
    }
  };

  const handleCloseResult = () => {
    setResultVisible(false);
    if (importResult?.success) {
      setFileInfo(null);
      setPreview(null);
    }
  };

  const renderPreviewItem = ({ item }) => (
    <View style={previewStyles.row}>
      <View style={previewStyles.dateCol}>
        <Text style={previewStyles.date}>{item.date}</Text>
      </View>
      <View style={[previewStyles.typeDot, { backgroundColor: item.type === 'expense' ? colors.expense : colors.income }]} />
      <View style={previewStyles.amountCol}>
        <Text style={[previewStyles.amount, { color: item.type === 'expense' ? colors.expense : colors.income }]}>
          {item.type === 'expense' ? '-' : '+'}¥{item.amount.toFixed(2)}
        </Text>
      </View>
      <View style={previewStyles.catCol}>
        <Text style={previewStyles.cat} numberOfLines={1}>
          {item.matchedCategory || item.categoryName || '-'}
        </Text>
        <Text style={previewStyles.source}>{FILE_TYPE_LABELS[item.source] || item.source}</Text>
      </View>
    </View>
  );

  const styles = createStyles(colors);
  const previewStyles = createPreviewStyles(colors);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <MaterialCommunityIcons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>导入数据</Text>
        <View style={styles.closeBtn} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Supported Formats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>支持的格式</Text>
          <View style={styles.formatGrid}>
            {[
              { icon: 'wallet-outline', label: 'Zenny 导出', desc: 'CSV 格式' },
              { icon: 'cash', label: '支付宝', desc: 'CSV 格式' },
              { icon: 'chat-outline', label: '微信支付', desc: 'XLSX 格式' },
              { icon: 'shopping-outline', label: '京东', desc: 'CSV 格式' },
              { icon: 'file-document-outline', label: '总账/信用卡', desc: 'CSV 格式' },
            ].map((fmt) => (
              <View key={fmt.label} style={styles.formatItem}>
                <MaterialCommunityIcons name={fmt.icon} size={24} color={colors.primary} />
                <Text style={styles.formatLabel}>{fmt.label}</Text>
                <Text style={styles.formatDesc}>{fmt.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* File Picker */}
        <TouchableOpacity style={styles.pickBtn} onPress={handlePickFile} disabled={loading}>
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <>
              <MaterialCommunityIcons name="file-upload-outline" size={28} color={colors.white} />
              <Text style={styles.pickBtnText}>选择文件导入</Text>
            </>
          )}
        </TouchableOpacity>

        {/* File Info */}
        {fileInfo && (
          <View style={styles.fileInfo}>
            <MaterialCommunityIcons name="file-check-outline" size={20} color={colors.income} />
            <View style={styles.fileInfoText}>
              <Text style={styles.fileName}>{fileInfo.name}</Text>
              {preview && (
                <Text style={styles.fileMeta}>
                  类型: {FILE_TYPE_LABELS[preview.fileType] || '未知'}
                  {' · '}
                  共 {preview.total} 条记录
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Preview */}
        {preview && preview.preview.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              预览 (前{mini(20, preview.total)}条，共{preview.total}条)
            </Text>
            <View style={previewStyles.table}>
              <View style={previewStyles.tableHeader}>
                <Text style={[previewStyles.th, { width: 80 }]}>日期</Text>
                <Text style={[previewStyles.th, { width: 20 }]}></Text>
                <Text style={[previewStyles.th, { flex: 1 }]}>金额</Text>
                <Text style={[previewStyles.th, { flex: 1 }]}>分类/来源</Text>
              </View>
              <FlatList
                data={preview.preview}
                keyExtractor={(_, i) => i.toString()}
                renderItem={renderPreviewItem}
                scrollEnabled={false}
                style={previewStyles.list}
              />
            </View>
          </View>
        )}

        {preview && preview.total === 0 && (
          <View style={styles.emptyHint}>
            <MaterialCommunityIcons name="file-search-outline" size={48} color={colors.textLight} />
            <Text style={styles.emptyText}>未能解析到有效数据</Text>
            <Text style={styles.emptySubtext}>请确认文件格式是否正确</Text>
          </View>
        )}
      </ScrollView>

      {/* Import Button */}
      {preview && preview.total > 0 && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.importBtn, importing && styles.importBtnDisabled]}
            onPress={handleImport}
            disabled={importing}
          >
            {importing ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <>
                <MaterialCommunityIcons name="database-import-outline" size={22} color={colors.white} />
                <Text style={styles.importBtnText}>
                  导入 {preview.total} 条记录
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Import Progress Overlay - blocks interaction */}
      {importing && (
        <View style={styles.overlay}>
          <View style={styles.overlayContent}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.overlayText}>正在导入数据...</Text>
            <Text style={styles.overlaySubtext}>请勿关闭页面</Text>
          </View>
        </View>
      )}

      {/* Import Result Modal */}
      <Modal visible={resultVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <MaterialCommunityIcons
              name={importResult?.success ? 'check-circle-outline' : 'close-circle-outline'}
              size={64}
              color={importResult?.success ? colors.income : colors.danger}
              style={{ alignSelf: 'center', marginBottom: spacing.md }}
            />
            <Text style={styles.modalTitle}>
              {importResult?.success ? '导入成功' : '导入失败'}
            </Text>
            <Text style={styles.modalMessage}>{importResult?.message}</Text>
            <TouchableOpacity style={styles.modalBtn} onPress={handleCloseResult}>
              <Text style={styles.modalBtnText}>{importResult?.success ? '继续' : '重试'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function mini(a, b) { return a < b ? a : b; }

const createPreviewStyles = (colors) => StyleSheet.create({
  table: { backgroundColor: colors.surface, borderRadius: 12, overflow: 'hidden' },
  tableHeader: { flexDirection: 'row', alignItems: 'center', padding: spacing.sm, backgroundColor: colors.surfaceSecondary },
  th: { ...typography.caption, color: colors.textSecondary, fontWeight: '600' },
  list: { maxHeight: 320 },
  row: { flexDirection: 'row', alignItems: 'center', padding: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  dateCol: { width: 80 },
  date: { ...typography.caption, color: colors.textSecondary },
  typeDot: { width: 8, height: 8, borderRadius: 4, marginHorizontal: 4 },
  amountCol: { flex: 1 },
  amount: { ...typography.smallBold },
  catCol: { flex: 1 },
  cat: { ...typography.caption, color: colors.text },
  source: { ...typography.caption, color: colors.textLight, fontSize: 10 },
});

const createStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  closeBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...typography.h3, color: colors.text },
  content: { flex: 1 },
  contentContainer: { padding: spacing.lg },
  section: { marginBottom: spacing.xl },
  sectionTitle: { ...typography.bodyBold, color: colors.text, marginBottom: spacing.md },
  formatGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  formatItem: { width: '47%', backgroundColor: colors.surface, borderRadius: 12, padding: spacing.lg, alignItems: 'center' },
  formatLabel: { ...typography.bodyBold, color: colors.text, marginTop: spacing.sm },
  formatDesc: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  pickBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary, borderRadius: 12, paddingVertical: spacing.lg, gap: spacing.sm },
  pickBtnText: { ...typography.bodyBold, color: colors.white },
  fileInfo: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.incomeLight, borderRadius: 10, padding: spacing.md, marginTop: spacing.lg, gap: spacing.sm },
  fileInfoText: { flex: 1 },
  fileName: { ...typography.bodyBold, color: colors.text },
  fileMeta: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  emptyHint: { alignItems: 'center', paddingVertical: spacing.xxxl },
  emptyText: { ...typography.body, color: colors.textSecondary, marginTop: spacing.md },
  emptySubtext: { ...typography.caption, color: colors.textLight, marginTop: spacing.xs },
  footer: { padding: spacing.lg, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.borderLight },
  importBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary, borderRadius: 12, paddingVertical: spacing.lg, gap: spacing.sm },
  importBtnDisabled: { opacity: 0.6 },
  importBtnText: { ...typography.bodyBold, color: colors.white },
  // Overlay styles
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  overlayContent: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.xxl,
    alignItems: 'center',
    minWidth: 200,
  },
  overlayText: {
    ...typography.bodyBold,
    color: colors.text,
    marginTop: spacing.lg,
  },
  overlaySubtext: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.xl,
    width: 280,
    alignItems: 'center',
  },
  modalTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
  },
  modalMessage: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  modalBtn: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    minWidth: 100,
    alignItems: 'center',
  },
  modalBtnText: {
    ...typography.bodyBold,
    color: colors.white,
  },
});
