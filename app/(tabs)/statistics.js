import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import Svg, { G, Path, Circle as SvgCircle, Text as SvgText } from 'react-native-svg';
import { transactionRepo } from '../../src/database/repositories/transactionRepo';
import { colors, typography, spacing } from '../../src/theme';

const PERIODS = [
  { key: 'week', label: '本周' },
  { key: 'month', label: '本月' },
  { key: 'year', label: '本年' },
];

export default function StatisticsScreen() {
  const [period, setPeriod] = useState('month');
  const [viewType, setViewType] = useState('expense');
  const [categorySummary, setCategorySummary] = useState([]);
  const [overallSummary, setOverallSummary] = useState({ expense: 0, income: 0, balance: 0 });

  const dateRange = useMemo(() => {
    const now = dayjs();
    switch (period) {
      case 'week':
        return { start: now.startOf('week').format('YYYY-MM-DD'), end: now.endOf('week').format('YYYY-MM-DD') };
      case 'month':
        return { start: now.startOf('month').format('YYYY-MM-DD'), end: now.endOf('month').format('YYYY-MM-DD') };
      case 'year':
        return { start: now.startOf('year').format('YYYY-MM-DD'), end: now.endOf('year').format('YYYY-MM-DD') };
      default:
        return { start: now.startOf('month').format('YYYY-MM-DD'), end: now.endOf('month').format('YYYY-MM-DD') };
    }
  }, [period]);

  useEffect(() => {
    let cancelled = false;
    async function loadData() {
      const [catData, txData] = await Promise.all([
        transactionRepo.getCategorySummary(dateRange.start, dateRange.end, viewType),
        transactionRepo.getByDateRange(dateRange.start, dateRange.end),
      ]);
      if (cancelled) return;
      setCategorySummary(catData);
      let expense = 0, income = 0;
      txData.forEach((t) => {
        if (t.type === 'expense') expense += t.amount;
        else income += t.amount;
      });
      setOverallSummary({ expense, income, balance: income - expense });
    }
    loadData();
    return () => { cancelled = true; };
  }, [dateRange, viewType]);

  const totalAmount = useMemo(() => {
    return categorySummary.reduce((sum, c) => sum + c.total, 0);
  }, [categorySummary]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>统计</Text>
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Period Selector */}
        <View style={styles.periodRow}>
          {PERIODS.map((p) => (
            <TouchableOpacity
              key={p.key}
              style={[styles.periodBtn, period === p.key && styles.periodBtnActive]}
              onPress={() => setPeriod(p.key)}
            >
              <Text style={[styles.periodText, period === p.key && styles.periodTextActive]}>
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Overview Cards */}
        <View style={styles.overviewRow}>
          <View style={[styles.overviewCard, { backgroundColor: colors.expenseLight }]}>
            <Text style={styles.overviewLabel}>总支出</Text>
            <Text style={[styles.overviewAmount, { color: colors.expense }]}>¥{overallSummary.expense.toFixed(2)}</Text>
          </View>
          <View style={[styles.overviewCard, { backgroundColor: colors.incomeLight }]}>
            <Text style={styles.overviewLabel}>总收入</Text>
            <Text style={[styles.overviewAmount, { color: colors.income }]}>¥{overallSummary.income.toFixed(2)}</Text>
          </View>
        </View>
        <View style={styles.balanceCard}>
          <Text style={styles.overviewLabel}>结余</Text>
          <Text style={[styles.overviewAmount, { color: overallSummary.balance >= 0 ? colors.income : colors.expense }]}>
            ¥{overallSummary.balance.toFixed(2)}
          </Text>
        </View>

        {/* View Type Toggle */}
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[styles.toggleBtn, viewType === 'expense' && styles.toggleBtnActive]}
            onPress={() => setViewType('expense')}
          >
            <Text style={[styles.toggleText, viewType === 'expense' && styles.toggleTextActive]}>支出分析</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, viewType === 'income' && styles.toggleBtnActive]}
            onPress={() => setViewType('income')}
          >
            <Text style={[styles.toggleText, viewType === 'income' && styles.toggleTextActive]}>收入分析</Text>
          </TouchableOpacity>
        </View>

        {/* Pie Chart */}
        {categorySummary.length > 0 ? (
          <View style={styles.chartContainer}>
            <SimplePieChart data={categorySummary} total={totalAmount} />
          </View>
        ) : (
          <View style={styles.emptyChart}>
            <MaterialCommunityIcons name="chart-pie" size={48} color={colors.textLight} />
            <Text style={styles.emptyText}>暂无数据</Text>
          </View>
        )}

        {/* Category Ranking */}
        <View style={styles.rankingSection}>
          <Text style={styles.sectionTitle}>分类排行</Text>
          {categorySummary.map((cat, index) => {
            const percent = totalAmount > 0 ? (cat.total / totalAmount) * 100 : 0;
            return (
              <View key={cat.id} style={styles.rankItem}>
                <View style={styles.rankLeft}>
                  <Text style={styles.rankIndex}>{index + 1}</Text>
                  <View style={[styles.rankIcon, { backgroundColor: cat.color + '20' }]}>
                    <MaterialCommunityIcons name={cat.icon} size={18} color={cat.color} />
                  </View>
                  <Text style={styles.rankName}>{cat.name}</Text>
                </View>
                <View style={styles.rankRight}>
                  <View style={styles.barContainer}>
                    <View style={[styles.bar, { width: `${percent}%`, backgroundColor: cat.color }]} />
                  </View>
                  <Text style={styles.rankAmount}>¥{cat.total.toFixed(2)}</Text>
                  <Text style={styles.rankPercent}>{percent.toFixed(1)}%</Text>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Simple SVG Pie Chart
function SimplePieChart({ data, total }) {
  const size = 200;
  const radius = 80;
  const center = size / 2;

  let currentAngle = -90;
  const slices = data.map((item) => {
    const percent = total > 0 ? item.total / total : 0;
    const angle = percent * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;

    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;
    const x1 = center + radius * Math.cos(startRad);
    const y1 = center + radius * Math.sin(startRad);
    const x2 = center + radius * Math.cos(endRad);
    const y2 = center + radius * Math.sin(endRad);
    const largeArc = angle > 180 ? 1 : 0;

    const d = `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
    return { ...item, d, percent };
  });

  return (
    <View style={{ alignItems: 'center' }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <G>
          {slices.map((slice, i) => (
            <Path key={i} d={slice.d} fill={slice.color || '#ccc'} />
          ))}
          <SvgCircle cx={center} cy={center} r={40} fill="white" />
          <SvgText x={center} y={center - 6} textAnchor="middle" fontSize="12" fill="#666">总计</SvgText>
          <SvgText x={center} y={center + 14} textAnchor="middle" fontSize="14" fontWeight="bold" fill="#333">¥{total.toFixed(0)}</SvgText>
        </G>
      </Svg>
      {/* Legend */}
      <View style={pieStyles.legend}>
        {slices.slice(0, 6).map((s, i) => (
          <View key={i} style={pieStyles.legendItem}>
            <View style={[pieStyles.legendDot, { backgroundColor: s.color }]} />
            <Text style={pieStyles.legendText}>{s.name} {(s.percent * 100).toFixed(0)}%</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const pieStyles = StyleSheet.create({
  legend: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: spacing.md, gap: spacing.md },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: 4 },
  legendText: { ...typography.caption, color: colors.textSecondary },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: spacing.lg, paddingVertical: spacing.lg,
    backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.borderLight,
  },
  headerTitle: { ...typography.h2, color: colors.text },
  periodRow: {
    flexDirection: 'row', padding: spacing.lg, gap: spacing.sm,
  },
  periodBtn: {
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
    borderRadius: 20, backgroundColor: colors.surfaceSecondary,
  },
  periodBtnActive: { backgroundColor: colors.primary },
  periodText: { ...typography.small, color: colors.textSecondary },
  periodTextActive: { color: colors.white, fontWeight: '600' },
  overviewRow: {
    flexDirection: 'row', paddingHorizontal: spacing.lg, gap: spacing.md,
  },
  overviewCard: {
    flex: 1, padding: spacing.lg, borderRadius: 12, alignItems: 'center',
  },
  balanceCard: {
    marginHorizontal: spacing.lg, marginTop: spacing.md, padding: spacing.lg,
    borderRadius: 12, backgroundColor: colors.surfaceSecondary, alignItems: 'center',
  },
  overviewLabel: { ...typography.caption, color: colors.textSecondary, marginBottom: 4 },
  overviewAmount: { ...typography.h3 },
  toggleRow: {
    flexDirection: 'row', margin: spacing.lg, backgroundColor: colors.surfaceSecondary,
    borderRadius: 10, padding: 3,
  },
  toggleBtn: { flex: 1, paddingVertical: spacing.sm, borderRadius: 8, alignItems: 'center' },
  toggleBtnActive: { backgroundColor: colors.white },
  toggleText: { ...typography.small, color: colors.textSecondary },
  toggleTextActive: { color: colors.text, fontWeight: '600' },
  chartContainer: { paddingVertical: spacing.lg, alignItems: 'center' },
  emptyChart: { alignItems: 'center', paddingVertical: spacing.xxxl },
  emptyText: { ...typography.body, color: colors.textLight, marginTop: spacing.md },
  rankingSection: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl },
  sectionTitle: { ...typography.bodyBold, color: colors.text, marginBottom: spacing.lg },
  rankItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  rankLeft: { flexDirection: 'row', alignItems: 'center', width: 120 },
  rankIndex: { ...typography.small, color: colors.textLight, width: 20, textAlign: 'center' },
  rankIcon: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginHorizontal: spacing.sm },
  rankName: { ...typography.small, color: colors.text },
  rankRight: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  barContainer: { flex: 1, height: 8, backgroundColor: colors.surfaceSecondary, borderRadius: 4, overflow: 'hidden' },
  bar: { height: '100%', borderRadius: 4 },
  rankAmount: { ...typography.smallBold, color: colors.text, width: 72, textAlign: 'right' },
  rankPercent: { ...typography.caption, color: colors.textSecondary, width: 40, textAlign: 'right' },
});
