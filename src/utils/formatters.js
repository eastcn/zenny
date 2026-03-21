import dayjs from 'dayjs';

export function formatAmount(amount, type) {
  const prefix = type === 'income' ? '+' : '-';
  return `${prefix}¥${Number(amount).toFixed(2)}`;
}

export function formatAmountShort(amount, type) {
  const prefix = type === 'income' ? '+' : '-';
  if (amount >= 10000) {
    return `${prefix}${(amount / 10000).toFixed(1)}万`;
  }
  return `${prefix}${Number(amount).toFixed(0)}`;
}

export function formatDate(date, format = 'YYYY-MM-DD') {
  return dayjs(date).format(format);
}

export function formatDateChinese(date) {
  const d = dayjs(date);
  return `${d.month() + 1}月${d.date()}日`;
}

export function getWeekDayName(date) {
  const names = ['日', '一', '二', '三', '四', '五', '六'];
  return '周' + names[dayjs(date).day()];
}
