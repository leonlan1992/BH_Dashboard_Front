/**
 * TypeScript类型定义
 * 定义BH Dashboard的数据结构
 */

// 指标元数据
export interface Indicator {
  id: string                    // 如 'FRED_DFII10'
  display_name: string          // 如 'Real rate'
  factor: 'D' | 'C' | 'V'      // D=利率, C=信用, V=波动率
  tier: 'Core' | 'Watch' | 'Confirm'
  indicator_cn: string          // 中文名称
  indicator_en: string          // 英文名称
  source: string                // 'FRED', 'BLOOMBERG'
  series_id: string             // Fred API的系列ID
  frequency: string             // 'Daily', 'Weekly'
  rule_description: string      // 规则文字描述
  investment_implication?: string
  why_it_matter?: string
  url?: string
  source_url?: string
  link?: string
  is_active: boolean
  created_at?: string
  updated_at?: string
}

// 时间序列数据点
export interface TimeSeriesPoint {
  date: string                  // 日期 'YYYY-MM-DD'
  value: number                 // 指标数值
  status: 'normal' | 'alert' | null  // 预警状态
  status_reason?: string | null       // 预警原因
}

// 指标数据（包含元数据和时序数据）
export interface IndicatorData {
  indicator: Indicator
  data: TimeSeriesPoint[]
  stats: {
    total_days: number
    alert_days: number
    alert_rate: number
    latest_value: number
    latest_status: 'normal' | 'alert' | null
  }
}

// 按factor分组的指标
export interface IndicatorsByFactor {
  D: Indicator[]   // 利率指标
  C: Indicator[]   // 信用指标
  V: Indicator[]   // 波动率指标
}

// Factor信息
export interface FactorInfo {
  key: 'D' | 'C' | 'V'
  name: string
  nameEn: string
  description: string
}

export const FACTORS: FactorInfo[] = [
  {
    key: 'D',
    name: '利率指标',
    nameEn: 'Duration / Discount',
    description: '监控长短端利率、期限溢价和通胀预期'
  },
  {
    key: 'C',
    name: '信用指标',
    nameEn: 'Credit',
    description: '监控信用利差、违约风险和金融条件'
  },
  {
    key: 'V',
    name: '波动率指标',
    nameEn: 'Volatility',
    description: '监控市场波动和风险情绪'
  }
]

// 热力图单元格数据
export interface HeatmapCellData {
  status: 'normal' | 'alert' | null
  status_reason: string | null
  value: number
}

// 热力图数据
export interface HeatmapData {
  dates: string[]  // 日期数组 ['2024-12-15', '2024-12-16', ...]
  indicators: IndicatorsByFactor  // 按factor分组的指标
  statusMap: Record<string, Record<string, HeatmapCellData | null>>  // indicatorId -> date -> cellData
}

// 组合指标时序数据点（包含多个指标的值）
export interface CombinedTimeSeriesPoint {
  date: string
  value1: number        // 第一个指标（VIX）
  value2: number        // 第二个指标（VIX3M/VIX9D）
  status: 'normal' | 'alert' | null
  status_reason?: string | null
}

// 差值时序数据点
export interface SpreadTimeSeriesPoint {
  date: string
  value: number         // 差值
  status: 'normal' | 'alert' | null
  status_reason?: string | null
}

// 组合指标数据（用于 VIX3M/VIX9D 的双图表展示）
export interface CombinedIndicatorData {
  mainIndicator: Indicator                    // 主指标元数据（VIX3M/VIX9D）
  comparisonData: CombinedTimeSeriesPoint[]   // 对比图数据（VIX vs VIX3M/VIX9D）
  spreadData: SpreadTimeSeriesPoint[]         // 差值图数据
  labels: {
    line1: string       // 第一条线标签（如 "VIX"）
    line2: string       // 第二条线标签（如 "VIX3M"）
    spread: string      // 差值标签（如 "VIX-VIX3M"）
  }
  stats: {
    total_days: number
    alert_days: number
    alert_rate: number
    latest_value: number
    latest_status: 'normal' | 'alert' | null
  }
}

// VIX 组合指标配置
export const VIX_COMBINED_CONFIG: Record<string, {
  vixIndicators: string[]      // VIX 数据源（按优先级）
  spreadIndicator: string      // 差值指标 ID
  labels: { line1: string; line2: string; spread: string }
}> = {
  'yhfinance_^VIX3M': {
    vixIndicators: ['Wind_G0003892', 'FRED_VIXCLS'],
    spreadIndicator: 'yhfinance_VIX-VIX3M',
    labels: { line1: 'VIX', line2: 'VIX3M', spread: 'VIX-VIX3M' }
  },
  'yhfinance_^VIX9D': {
    vixIndicators: ['Wind_G0003892', 'FRED_VIXCLS'],
    spreadIndicator: 'yhfinance_VIX9D-VIX',
    labels: { line1: 'VIX', line2: 'VIX9D', spread: 'VIX9D-VIX' }
  }
}
