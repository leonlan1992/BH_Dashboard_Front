# BH Dashboard Frontend

风险监控仪表盘前端应用 - 基于 Next.js 构建的现代化数据可视化平台

## 项目概述

BH Dashboard 是一个金融风险监控仪表盘，用于实时监控和展示多个关键经济指标的时序数据和预警状态。该前端应用连接到 BH_Dashboard 后端的 Supabase 数据库，提供直观的可视化界面。

### 核心功能

- **指标分组展示**: 按因子类型（D-利率、C-信用、V-波动率）分组显示14个经济指标
- **热力图视图**: 以日期为横轴、指标为纵轴展示近30天状态
- **交互式展开**: 点击热力图格子展开指标详情与时序图表
- **时序可视化**: 使用 Recharts 绘制绿色折线图和淡红色预警区间
- **实时状态**: 显示每个指标的最新状态（正常/预警）
- **响应式设计**: 支持桌面、平板和移动设备
- **深色主题**: 现代化的深色 UI 设计

## 技术栈

- **框架**: Next.js 15 (App Router)
- **语言**: TypeScript 5
- **UI 库**: React 19
- **样式**: Tailwind CSS 4
- **图表**: Recharts
- **数据库**: Supabase (PostgreSQL)
- **部署**: Vercel (推荐)

## 前置要求

- Node.js 18+
- npm 或 yarn
- Supabase 账号和项目
- BH_Dashboard 后端已部署（数据库表已创建）

## 快速开始

### 1. 克隆或进入项目目录

```bash
cd /Users/leonlan/Jarvis/BH_Dashboard_Front
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

创建 `.env.local` 文件并配置 Supabase 凭证:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**获取 Supabase 凭证**:
1. 登录 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择你的项目
3. 进入 Settings > API
4. 复制 `URL` 和 `anon public` key

### 4. 启动开发服务器

```bash
npm run dev
```

打开浏览器访问 [http://localhost:3000](http://localhost:3000)

### 5. 构建生产版本

```bash
npm run build
npm start
```

## 项目结构

```
BH_Dashboard_Front/
├── app/
│   ├── api/
│   │   ├── indicators/
│   │   │   └── route.ts          # GET /api/indicators - 获取指标列表
│   │   ├── heatmap/
│   │   │   └── route.ts          # GET /api/heatmap - 获取热力图数据
│   │   └── data/
│   │       └── [indicator_id]/
│   │           └── route.ts       # GET /api/data/:id - 获取时序数据
│   ├── layout.tsx                 # 根布局
│   ├── page.tsx                   # 主页面
│   └── globals.css                # 全局样式
├── components/
│   ├── IndicatorHeatmap.tsx       # 热力图主组件
│   ├── HeatmapSection.tsx         # 因子分组热力图
│   ├── HeatmapCell.tsx            # 热力图格子
│   ├── HeatmapTooltip.tsx         # 热力图提示
│   └── TimeSeriesChart.tsx        # 时序图表组件
├── lib/
│   ├── supabase.ts                # Supabase 客户端
│   ├── types.ts                   # TypeScript 类型定义
│   └── utils.ts                   # 工具函数
├── .env.local                     # 环境变量（需自行创建）
├── package.json                   # 项目依赖
├── tsconfig.json                  # TypeScript 配置
├── tailwind.config.ts             # Tailwind CSS 配置
├── next.config.ts                 # Next.js 配置
└── README.md                      # 项目文档
```

## API 端点

### GET `/api/indicators`

获取所有指标列表，按因子分组。

**响应示例**:
```json
{
  "D": [
    {
      "id": "FRED_DFII10",
      "indicator_cn": "10Y 实际利率(TIPS)",
      "indicator_en": "10Y TIPS real yield",
      "factor": "D",
      "tier": "Core",
      "frequency": "Daily"
    }
  ],
  "C": [...],
  "V": [...]
}
```

### GET `/api/data/[indicator_id]`

获取指定指标的时序数据和统计信息。

**查询参数**:
- `days` (可选): 获取最近 N 天数据，默认 30
- `start_date` (可选): 开始日期 YYYY-MM-DD
- `end_date` (可选): 结束日期 YYYY-MM-DD

**响应示例**:
```json
{
  "indicator": {
    "id": "FRED_DFII10",
    "indicator_cn": "10Y 实际利率(TIPS)",
    "rule_description": "10个交易日上行≥25bp 或 创6个月新高"
  },
  "data": [
    {
      "date": "2024-01-01",
      "value": 2.15,
      "status": "normal",
      "status_reason": null
    },
    {
      "date": "2024-01-02",
      "value": 2.45,
      "status": "alert",
      "status_reason": "10日上行30bp (≥25bp)"
    }
  ],
  "stats": {
    "total_days": 30,
    "alert_days": 5,
    "alert_rate": 16.7,
    "latest_value": 2.45,
    "latest_status": "alert"
  }
}
```

## 核心组件

### IndicatorHeatmap

热力图主组件，整合 D/C/V 三个分组，支持格子点击与悬浮提示。

**Props**:
- `data`: 热力图数据
- `onCellClick`: 格子点击处理函数

### HeatmapSection

按因子分组的热力图区域。

**Props**:
- `factor`: 因子信息 (D/C/V)
- `indicators`: 指标数组
- `dates`: 日期数组
- `statusMap`: 状态映射

### TimeSeriesChart

时序图表组件，使用 Recharts 绘制折线图与预警区间。

**Props**:
- `data`: 时序数据点数组

**特性**:
- 绿色折线显示所有数据点
- 淡红色垂直区间标记预警连续区间（单日显示为窄条带）
- 自定义 Tooltip 显示详细信息（日期、数值、预警原因）
- 响应式容器适配不同屏幕尺寸

## 数据库表结构

### bhdashboard_indicators

存储指标元数据。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | text | 主键，如 "FRED_DFII10" |
| indicator_cn | text | 中文名称 |
| indicator_en | text | 英文名称 |
| factor | text | 因子类型 (D/C/V) |
| tier | text | 优先级 (Core/Supportive) |
| frequency | text | 更新频率 (Daily) |
| rule_description | text | 预警规则描述 |
| is_active | boolean | 是否启用 |

### bhdashboard_indicator_data

存储时序数据和预警状态。

| 字段 | 类型 | 说明 |
|------|------|------|
| indicator_id | text | 外键，关联 indicators 表 |
| date | date | 日期 |
| value | numeric | 数值 |
| status | text | 状态 (normal/alert) |
| status_reason | text | 预警原因（可选）|

## 状态管理

主页面使用 React Hooks 进行状态管理:

- `heatmapData`: 热力图数据
- `selectedIndicatorId`: 当前选中的指标 ID
- `indicatorData`: 选中指标的时序数据
- `isLoading`: 初始加载状态
- `isLoadingChart`: 详细数据加载状态
- `error`: 错误信息

## 样式设计

### 颜色方案

- **背景色**:
  - 主背景: `bg-gray-900` (#111827)
  - 卡片背景: `bg-gray-800` (#1F2937)
  - 次级背景: `bg-gray-700` (#374151)
- **文本色**:
  - 主文本: `text-white` (#FFFFFF)
  - 次文本: `text-gray-400` (#9CA3AF)
- **状态色**:
  - 正常: `bg-green-600` (#10B981)
  - 预警: `bg-red-600` (#EF4444)
  - 信息: `bg-blue-600` (#3B82F6)
  - 警告: `bg-yellow-400` (#FBBF24)

### 响应式断点

- **移动端** (< 768px): 单列布局
- **平板** (768px - 1024px): 2列布局
- **桌面** (> 1024px): 3-4列布局

## 性能优化

1. **并行数据加载**: 使用 `Promise.all` 并行获取所有指标的最新状态
2. **按需加载**: 只在点击指标时才加载详细时序数据
3. **响应式容器**: Recharts 的 `ResponsiveContainer` 自动适配容器大小
4. **状态缓存**: 已加载的状态数据保存在组件状态中，减少重复请求

## 部署

### Vercel 部署（推荐）

1. 将代码推送到 GitHub
2. 在 [Vercel](https://vercel.com) 导入项目
3. 配置环境变量:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. 点击部署

### 手动部署

```bash
# 构建
npm run build

# 启动生产服务器
npm start
```

## 开发指南

### 添加新指标

1. 在后端数据库的 `bhdashboard_indicators` 表中添加新记录
2. 前端会自动获取并显示新指标（无需修改代码）

### 修改图表样式

编辑 `components/TimeSeriesChart.tsx`:

```tsx
// 修改折线颜色
<Line stroke="#your-color" />

// 修改预警区间颜色
<ReferenceArea fill="#your-color" />
```

### 调整日期范围

编辑 `app/page.tsx` 中的 `fetchIndicatorData` 函数:

```tsx
const { startDate, endDate } = getDateRange(730) // 修改天数
```

## 故障排查

### 问题: "Failed to fetch indicators"

**解决方案**:
1. 检查 `.env.local` 文件是否正确配置
2. 确认 Supabase 项目 URL 和 API Key 正确
3. 检查数据库表是否存在并有数据

### 问题: 图表不显示

**解决方案**:
1. 检查浏览器控制台是否有错误
2. 确认 `bhdashboard_indicator_data` 表中有对应指标的数据
3. 检查日期范围是否包含数据点

### 问题: 状态徽章显示 "无数据"

**解决方案**:
1. 检查 API 端点 `/api/data/[indicator_id]?days=1` 是否返回数据
2. 确认数据库中有最近 1 天的数据

## 未来扩展

- [ ] 实时数据刷新（WebSocket 或轮询）
- [ ] 日期范围选择器
- [ ] 多指标对比视图
- [ ] 导出图表为 PNG/PDF
- [ ] 预警通知功能（邮件/微信）
- [ ] 移动端 App (React Native)
- [ ] 历史回测功能

## 相关项目

- **后端项目**: `/Users/leonlan/Jarvis/BH_Dashboard`
- **参考项目**: Dashboard_Dobbies

## 技术支持

如有问题或建议，请查看:
- [Next.js 文档](https://nextjs.org/docs)
- [Recharts 文档](https://recharts.org/)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)
- [Supabase 文档](https://supabase.com/docs)

## 许可证

MIT License

---

**BH Dashboard © 2024** | 数据来源: Fred API
