const CATEGORY_KEYWORDS = {
  '餐饮': ['午饭', '晚饭', '早饭', '早餐', '午餐', '晚餐', '外卖', '餐', '吃', '饭', '面', '菜',
    '火锅', '烧烤', '奶茶', '咖啡', '饮料', '小吃', '食堂', '快餐', '零食', '水果',
    '蛋糕', '面包', '粥', '包子', '饺子', '麻辣烫', '螺蛳粉', '汉堡', '披萨', '寿司',
    '盒饭', '夜宵', '烤肉', '串串', '甜品', '下午茶', '早点', '宵夜', '米饭', '炒饭',
    '拉面', '米线', '凉皮', '煎饼', '鸡排', '炸鸡', '奶盖', '果汁', '豆浆'],
  '交通': ['地铁', '公交', '打车', '滴滴', '出租', '加油', '停车', '过路费', '高速',
    '火车', '机票', '高铁', '共享单车', '骑车', '摩的', '网约车', '出行', '车费',
    '油费', '洗车', '保养', '修车', '车险', '动车', '飞机', '船票', '汽车票'],
  '购物': ['超市', '淘宝', '京东', '拼多多', '买', '网购', '商场', '市场',
    '天猫', '闲鱼', '抖音', '直播', '代购'],
  '娱乐': ['电影', '游戏', 'KTV', '唱歌', '演出', '演唱会', '门票', '旅游', '景点',
    '酒吧', '桌游', '密室', '剧本杀', '健身', '游泳', '运动', '球', '瑜伽'],
  '住房': ['房租', '租金', '水费', '电费', '燃气', '物业', '宽带', '网费',
    '暖气', '维修', '装修', '家具', '家电'],
  '医疗': ['医院', '看病', '药', '挂号', '体检', '牙', '配眼镜', '门诊',
    '住院', '手术', '检查', '拔牙', '补牙'],
  '教育': ['学费', '培训', '课程', '书', '文具', '考试', '补习', '辅导',
    '网课', '教材', '报名'],
  '日用': ['日用品', '纸巾', '洗衣液', '牙膏', '洗发水', '沐浴露', '毛巾',
    '垃圾袋', '清洁', '卫生纸', '洗洁精'],
  '通讯': ['话费', '流量', '充值', '手机', '电话', '宽带'],
  '服饰': ['衣服', '裤子', '鞋', '帽子', '包', '首饰', '化妆品', '护肤',
    '口红', '面膜', '香水', '围巾', '手套', '内衣', '袜子'],
};

const INCOME_KEYWORDS = ['工资', '薪资', '奖金', '到账', '收入', '红包', '利息', '报销',
  '回款', '分红', '退款', '补贴', '津贴', '提成', '稿费', '兼职收入', '转账收入'];

const INCOME_CATEGORY_KEYWORDS = {
  '工资': ['工资', '薪资', '薪水', '月薪', '底薪'],
  '奖金': ['奖金', '年终奖', '绩效', '提成', '津贴', '补贴'],
  '理财': ['利息', '分红', '收益', '理财', '基金', '股票'],
  '兼职': ['兼职', '外快', '私活', '稿费', '副业'],
  '红包': ['红包', '礼金', '压岁钱'],
};

const AMOUNT_PATTERNS = [
  /(\d+(?:\.\d{1,2})?)\s*[元块圆]/,
  /[¥￥]\s*(\d+(?:\.\d{1,2})?)/,
  /(\d+(?:\.\d{1,2})?)\s*(?:块钱|元钱)/,
  /花了?\s*(\d+(?:\.\d{1,2})?)/,
  /(\d+(?:\.\d{1,2})?)\s*$/,
  /(\d+(?:\.\d{1,2})?)/,
];

export function parseText(text, categories) {
  if (!text || !text.trim()) return null;

  const input = text.trim();
  const result = {
    amount: null,
    categoryName: null,
    categoryId: null,
    type: 'expense',
    note: '',
    confidence: 0,
  };

  // Step 1: Determine income or expense
  const isIncome = INCOME_KEYWORDS.some((kw) => input.includes(kw));
  if (isIncome) {
    result.type = 'income';
  }

  // Step 2: Extract amount
  let amountMatch = null;
  let amountStr = '';
  for (const pattern of AMOUNT_PATTERNS) {
    const match = input.match(pattern);
    if (match) {
      amountMatch = match;
      amountStr = match[0];
      result.amount = parseFloat(match[1]);
      result.confidence += 0.4;
      break;
    }
  }

  // Step 3: Match category
  const keywordsMap = result.type === 'income' ? INCOME_CATEGORY_KEYWORDS : CATEGORY_KEYWORDS;
  let bestCategory = null;
  let bestScore = 0;

  for (const [catName, keywords] of Object.entries(keywordsMap)) {
    for (const kw of keywords) {
      if (input.includes(kw)) {
        const score = kw.length;
        if (score > bestScore) {
          bestScore = score;
          bestCategory = catName;
        }
      }
    }
  }

  if (bestCategory) {
    result.categoryName = bestCategory;
    result.confidence += 0.35;
    // Find category ID from provided categories
    if (categories) {
      const found = categories.find((c) => c.name === bestCategory);
      if (found) result.categoryId = found.id;
    }
  }

  // Step 4: Extract note (remaining text after removing amount and category keywords)
  let noteText = input;
  if (amountStr) {
    noteText = noteText.replace(amountStr, '');
  }
  // Remove common filler words
  noteText = noteText.replace(/[¥￥元块圆花了]/g, '').trim();
  if (noteText && noteText !== input) {
    result.note = noteText;
    result.confidence += 0.15;
  } else if (!amountStr) {
    result.note = input;
  }

  // Minimum confidence for a useful result
  if (result.amount === null && !bestCategory) {
    result.confidence = 0;
  }

  return result;
}
