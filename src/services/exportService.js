import { transactionRepo } from '../database/repositories/transactionRepo';
import { Platform } from 'react-native';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

export const exportService = {
  async exportCSV() {
    const data = await transactionRepo.getAllForExport();
    const header = '日期,类型,金额,分类,备注,创建时间\n';
    const rows = data.map((r) =>
      `${r.date},${r.type === 'expense' ? '支出' : '收入'},${r.amount},${r.category_name || ''},${(r.note || '').replace(/,/g, '，')},${r.created_at}`
    ).join('\n');
    const csv = '\uFEFF' + header + rows; // BOM for Excel Chinese support

    if (Platform.OS === 'web') {
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `记账数据_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      return true;
    }

    const fileUri = `${FileSystem.cacheDirectory}记账数据_${new Date().toISOString().slice(0, 10)}.csv`;
    await FileSystem.writeAsStringAsync(fileUri, csv, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    await Sharing.shareAsync(fileUri, {
      mimeType: 'text/csv',
      dialogTitle: '导出记账数据',
    });
    return true;
  },
};
