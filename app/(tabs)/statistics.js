import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import Svg, { G, Path, Circle as SvgCircle, Text as SvgText, Line, Polyline } from 'react-native-svg';
import { transactionRepo } from '../../src/database/repositories/transactionRepo';
import { useTheme, typography, spacing } from '../../src/theme';

const PERIODS = [
  { key: 'week', label: '本周' },
  { key: 'month', label: '本月' },
  { key: 'year', label: '本年' },
];

const MONTHS = [
  { key: '01', label: '1月' }, { key: '02', label: '2月' },
  { key: '03', label: '3月' }, { key: '04', label: '4月' },
  { key: '05', label: '5月' }, { key: '06', label: '6月' },
  { key: '07', label: '7月' }, { key: '08', label: '8月' },
  { key: '09', label: '9月' }, { key: '10', label: '10月' },
  { key: '11', label: '11月' }, { key: '12', label: '12月' },
];

const CHART_TYPES = [
  { key: 'pie', label: '饼图', icon: 'chart-pie' },
  { key: 'line', label: '折线图', icon: 'chart-line' },
];

export default function StatisticsScreen() {
  const { colors } = useTheme();
  const [period, setPeriod] = useState('month');
  const [viewType, setViewType] = useState('expense');
  const [chartType, setChartType] = useState('pie');
  const [categorySummary, setCategorySummary] = useState([]);
  const [dailyData, setDailyData] = useState([]);
  const [overallSummary, setOverallSummary] = useState({ expense: 0, income: 0, balance: 0 });
  const [availableYears, setAvailableYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState(dayjs().format('YYYY'));
  const [selectedMonth, setSelectedMonth] = useState(dayjs().format('MM'));

  // 页面获得焦点时刷新可用年份
  useFocusEffect(
    useCallback(() => {
      async function loadYears() {
        const years = await transactionRepo.getAvailableYears();
        if (years.length > 0) {
          setAvailableYears(years);
          // If current year is not in the list, select the most recent year
          const currentYear = dayjs().format('YYYY');
          if (!years.includes(currentYear)) {
            setSelectedYear(years[0]);
          }
        }
      }
      loadYears();
    }, [])
  );

  const dateRange = useMemo(() => {
    const now = dayjs();
    switch (period) {
      case 'week':
        return { start: now.startOf('week').format('YYYY-MM-DD'), end: now.endOf('week').format('YYYY-MM-DD') };
      case 'month':
        return { start: now.startOf('month').format('YYYY-MM-DD'), end: now.endOf('month').format('YYYY-MM-DD') };
      case 'year':
        return { start: now.startOf('year').format('YYYY-MM-DD'), end: now.endOf('year').format('YYYY-MM-DD') };
      case 'history-year':
        return { start: `${selectedYear}-01-01`, end: `${selectedYear}-12-31` };
      case 'history-month':
        const lastDay = dayjs(`${selectedYear}-${selectedMonth}-01`).endOf('month').format('DD');
        return { start: `${selectedYear}-${selectedMonth}-01`, end: `${selectedYear}-${selectedMonth}-${lastDay}` };
      default:
        return { start: now.startOf('month').format('YYYY-MM-DD'), end: now.endOf('month').format('YYYY-MM-DD') };
    }
  }, [period, selectedYear, selectedMonth]);

  useEffect(() => {
    let cancelled = false;
    async function loadData() {
      const [catData, txData] = await Promise.all([
        transactionRepo.getCategorySummary(dateRange.start, dateRange.end, viewType),
        transactionRepo.getByDateRange(dateRange.start, dateRange.end),
      ]);
      if (cancelled) return;
      setCategorySummary(catData);

      // Build daily data for line chart
      const dailyMap = {};
      txData.forEach((t) => {
        if (!dailyMap[t.date]) {
          dailyMap[t.date] = { date: t.date, expense: 0, income: 0 };
        }
        if (t.type === 'expense') dailyMap[t.date].expense += t.amount;
        else dailyMap[t.date].income += t.amount;
      });
      const dailyArray = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));
      setDailyData(dailyArray);

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

  // Generate period options dynamically based on available years
  const periodOptions = useMemo(() => {
    const options = [
      { key: 'week', label: '本周' },
      { key: 'month', label: '本月' },
      { key: 'year', label: '本年' },
    ];
    // Add historical years if there are multiple years of data
    if (availableYears.length > 1) {
      availableYears.forEach(year => {
        if (year !== dayjs().format('YYYY')) {
          options.push({ key: `history-${year}`, label: `${year}年` });
        }
      });
    }
    return options;
  }, [availableYears]);

  const handlePeriodChange = (key) => {
    if (key.startsWith('history-')) {
      const year = key.replace('history-', '');
      setSelectedYear(year);
      setPeriod('history-year');
    } else {
      setPeriod(key);
    }
  };

  const totalAmount = useMemo(() => {
    return categorySummary.reduce((sum, c) => sum + c.total, 0);
  }, [categorySummary]);

  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>统计</Text>
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Period Selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.periodRow}>
          {periodOptions.map((p) => (
            <TouchableOpacity
              key={p.key}
              style={[
                styles.periodBtn,
                (period === p.key || (p.key.startsWith('history-') && period === 'history-year' && selectedYear === p.key.replace('history-', ''))) && styles.periodBtnActive
              ]}
              onPress={() => handlePeriodChange(p.key)}
            >
              <Text style={[
                styles.periodText,
                (period === p.key || (p.key.startsWith('history-') && period === 'history-year' && selectedYear === p.key.replace('history-', ''))) && styles.periodTextActive
              ]}>
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

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

        {/* Chart Type Toggle */}
        <View style={styles.chartTypeRow}>
          {CHART_TYPES.map((ct) => (
            <TouchableOpacity
              key={ct.key}
              style={[styles.chartTypeBtn, chartType === ct.key && styles.chartTypeBtnActive]}
              onPress={() => setChartType(ct.key)}
            >
              <MaterialCommunityIcons
                name={ct.icon}
                size={18}
                color={chartType === ct.key ? colors.primary : colors.textSecondary}
              />
              <Text style={[styles.chartTypeText, chartType === ct.key && styles.chartTypeTextActive]}>
                {ct.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Chart */}
        {chartType === 'pie' ? (
          categorySummary.length > 0 ? (
            <View style={styles.chartContainer}>
              <SimplePieChart data={categorySummary} total={totalAmount} colors={colors} />
            </View>
          ) : (
            <View style={styles.emptyChart}>
              <MaterialCommunityIcons name="chart-pie" size={48} color={colors.textLight} />
              <Text style={styles.emptyText}>暂无数据</Text>
            </View>
          )
        ) : (
          dailyData.length > 1 ? (
            <View style={styles.chartContainer}>
              <SimpleLineChart data={dailyData} type={viewType} colors={colors} />
            </View>
          ) : (
            <View style={styles.emptyChart}>
              <MaterialCommunityIcons name="chart-line" size={48} color={colors.textLight} />
              <Text style={styles.emptyText}>暂无足够数据</Text>
            </View>
          )
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
function SimplePieChart({ data, total, colors }) {
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
      <View style={createPieStyles(colors).legend}>
        {slices.slice(0, 6).map((s, i) => {
          const pieStyles = createPieStyles(colors);
          return (
            <View key={i} style={pieStyles.legendItem}>
              <View style={[pieStyles.legendDot, { backgroundColor: s.color }]} />
              <Text style={pieStyles.legendText}>{s.name} {(s.percent * 100).toFixed(0)}%</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const createPieStyles = (colors) => StyleSheet.create({
  legend: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: spacing.md, gap: spacing.md },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: 4 },
  legendText: { ...typography.caption, color: colors.textSecondary },
});

// Simple SVG Line Chart
function SimpleLineChart({ data, type, colors }) {
  const chartWidth = 320;
  const chartHeight = 180;
  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const plotWidth = chartWidth - padding.left - padding.right;
  const plotHeight = chartHeight - padding.top - padding.bottom;

  const values = data.map(d => d[type] || 0);
  const maxValue = Math.max(...values, 1);
  const minValue = 0;

  // Generate points
  const points = data.map((d, i) => {
    const x = padding.left + (i / Math.max(data.length - 1, 1)) * plotWidth;
    const y = padding.top + plotHeight - ((d[type] || 0) / maxValue) * plotHeight;
    return { x, y, value: d[type] || 0, date: d.date };
  });

  // Create polyline path
  const polylinePoints = points.map(p => `${p.x},${p.y}`).join(' ');

  // Y-axis labels
  const yLabels = [0, maxValue * 0.25, maxValue * 0.5, maxValue * 0.75, maxValue].map((v, i) => ({
    value: v,
    y: padding.top + plotHeight - (i / 4) * plotHeight,
  }));

  // X-axis labels (show first, middle, last)
  const xLabels = [];
  if (data.length >= 1) {
    xLabels.push({ date: data[0].date, x: points[0].x });
    if (data.length > 2) {
      xLabels.push({ date: data[Math.floor(data.length / 2)].date, x: points[Math.floor(data.length / 2)].x });
    }
    xLabels.push({ date: data[data.length - 1].date, x: points[data.length - 1].x });
  }

  const lineColor = type === 'expense' ? colors.expense : colors.income;

  return (
    <View style={{ alignItems: 'center' }}>
      <Svg width={chartWidth} height={chartHeight}>
        <G>
          {/* Grid lines */}
          {yLabels.map((label, i) => (
            <Line
              key={i}
              x1={padding.left}
              y1={label.y}
              x2={chartWidth - padding.right}
              y2={label.y}
              stroke={colors.borderLight}
              strokeWidth={1}
              strokeDasharray="4,4"
            />
          ))}

          {/* Line */}
          <Polyline
            points={polylinePoints}
            fill="none"
            stroke={lineColor}
            strokeWidth={2.5}
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Data points */}
          {points.map((p, i) => (
            <SvgCircle key={i} cx={p.x} cy={p.y} r={4} fill={lineColor} />
          ))}

          {/* Y-axis labels */}
          {yLabels.map((label, i) => (
            <SvgText
              key={`y-${i}`}
              x={padding.left - 8}
              y={label.y + 4}
              textAnchor="end"
              fontSize={10}
              fill={colors.textSecondary}
            >
              ¥{label.value.toFixed(0)}
            </SvgText>
          ))}

          {/* X-axis labels */}
          {xLabels.map((label, i) => (
            <SvgText
              key={`x-${i}`}
              x={label.x}
              y={chartHeight - 10}
              textAnchor="middle"
              fontSize={10}
              fill={colors.textSecondary}
            >
              {label.date.slice(5)}
            </SvgText>
          ))}
        </G>
      </Svg>
      <Text style={createLineStyles(colors).chartLabel}>
        {type === 'expense' ? '每日支出' : '每日收入'}
      </Text>
    </View>
  );
}

const createLineStyles = (colors) => StyleSheet.create({
  chartLabel: {
    ...typography.small,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
});

const createStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: spacing.lg, paddingVertical: spacing.lg,
    backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.borderLight,
  },
  headerTitle: { ...typography.h2, color: colors.text },
  periodRow: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  periodBtn: {
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
    borderRadius: 20, backgroundColor: colors.surfaceSecondary,
    marginRight: spacing.sm,
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
  toggleBtnActive: { backgroundColor: colors.surface },
  toggleText: { ...typography.small, color: colors.textSecondary },
  toggleTextActive: { color: colors.text, fontWeight: '600' },
  chartTypeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  chartTypeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    backgroundColor: colors.surfaceSecondary,
    gap: 6,
  },
  chartTypeBtnActive: {
    backgroundColor: colors.primary + '15',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  chartTypeText: { ...typography.small, color: colors.textSecondary },
  chartTypeTextActive: { color: colors.primary, fontWeight: '600' },
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
