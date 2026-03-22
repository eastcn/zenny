# Zenny - 简洁优雅的记账应用

Zenny 是一款基于 React Native + Expo 开发的个人记账应用，支持 iOS、Android 和 Web 三端运行。采用日历视图展示收支记录，支持智能文本识别、语音记账、账单导入等功能。

## 功能特性

- **日历视图** - 直观的月历展示，每日收支一目了然
- **智能记账** - 支持自然语言输入，自动识别金额、分类
- **语音记账** - 语音输入自动转文字记账
- **账单导入** - 支持支付宝、微信、京东、随手记等账单 CSV 导入
- **数据导出** - 支持 Excel 格式导出账单
- **图片附件** - 可为每笔记录添加图片凭证
- **多主题** - 支持浅色/深色模式切换
- **分类管理** - 自定义收支分类，支持图标和颜色设置
- **统计图表** - 月度收支统计与趋势分析

## 技术栈

- **框架**: React Native + Expo
- **路由**: Expo Router
- **状态管理**: Zustand
- **数据库**: Expo SQLite
- **UI 组件**: React Native + 自定义组件
- **动画**: React Native Reanimated
- **图标**: MaterialCommunityIcons

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm start

# 运行 iOS
npm run ios

# 运行 Android
npm run android

# 运行 Web
npm run web
```

## 项目结构

```
app/
  (tabs)/          # 底部导航页面（首页、分类、统计、设置）
  transaction/     # 交易相关页面（新增、编辑、详情）
  import.js        # 账单导入页面

src/
  components/      # 可复用组件
    calendar/      # 日历组件
    transaction/   # 交易相关组件
  database/        # 数据库配置与迁移
  services/        # 业务服务（导入、导出、语音等）
  stores/          # Zustand 状态管理
  theme/           # 主题配置
  utils/           # 工具函数
```

## 账单导入支持

| 平台 | 格式 | 状态 |
|------|------|------|
| 支付宝 | CSV | ✅ 支持 |
| 微信支付 | CSV | ✅ 支持 |
| 京东金融 | CSV | ✅ 支持 |
| 随手记 | CSV | ✅ 支持 |

## 构建发布

```bash
# 预览构建
eas build --profile preview

# 生产构建
eas build --profile production
```

## 许可证

MIT
