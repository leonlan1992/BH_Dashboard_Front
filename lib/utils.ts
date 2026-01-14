/**
 * 工具函数
 * 通用辅助函数
 */

/**
 * 格式化日期为中文格式
 */
export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

/**
 * 格式化日期为简短格式（用于图表横轴）
 */
export function formatDateShort(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('zh-CN', {
    timeZone: 'Asia/Shanghai',
    month: '2-digit',
    day: '2-digit'
  })
}

/**
 * 格式化数值（保留小数位）
 */
export function formatValue(value: number, decimals: number = 2): string {
  return value.toFixed(decimals)
}

/**
 * 计算日期范围
 * @param days 天数（默认30天）
 * @returns { startDate, endDate } 格式为 'YYYY-MM-DD'
 */
export function getDateRange(days: number = 30): { startDate: string; endDate: string } {
  const endDate = new Date()
  const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000)

  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0]
  }
}

/**
 * 采样数据（用于图表性能优化）
 * @param data 原始数据
 * @param maxPoints 最大点数（默认200）
 * @returns 采样后的数据
 */
export function sampleData<T>(data: T[], maxPoints: number = 200): T[] {
  if (data.length <= maxPoints) return data

  const step = Math.ceil(data.length / maxPoints)
  return data.filter((_, index) => index % step === 0)
}

/**
 * 根据状态获取徽章颜色类名
 */
export function getStatusBadgeClass(status: 'normal' | 'alert' | null): string {
  switch (status) {
    case 'alert':
      return 'bg-red-600 text-white'
    case 'normal':
      return 'bg-green-600 text-white'
    default:
      return 'bg-gray-600 text-white'
  }
}

/**
 * 根据状态获取状态文本
 */
export function getStatusText(status: 'normal' | 'alert' | null): string {
  switch (status) {
    case 'alert':
      return '预警'
    case 'normal':
      return '正常'
    default:
      return '无数据'
  }
}

/**
 * 生成日期范围数组（用于热力图）
 * @param days 天数（默认30天）
 * @returns 日期字符串数组 ['YYYY-MM-DD', ...]
 */
export function generateDateRange(days: number = 30): string[] {
  return generateDateRangeFromEnd(new Date().toISOString().split('T')[0], days)
}

/**
 * 根据结束日期生成日期范围数组（用于热力图）
 * @param endDateStr 结束日期 'YYYY-MM-DD'
 * @param days 天数（默认30天）
 * @returns 日期字符串数组 ['YYYY-MM-DD', ...]
 */
export function generateDateRangeFromEnd(endDateStr: string, days: number = 30): string[] {
  const dates: string[] = []
  const endDate = new Date(`${endDateStr}T00:00:00`)

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(endDate.getTime() - i * 24 * 60 * 60 * 1000)
    dates.push(date.toISOString().split('T')[0])
  }

  return dates
}

/**
 * 根据状态获取热力图格子的颜色类名
 */
export function getHeatmapCellColor(status: 'normal' | 'alert' | null): string {
  switch (status) {
    case 'normal':
      return 'bg-green-600 hover:bg-green-500'
    case 'alert':
      return 'bg-red-600 hover:bg-red-500'
    default:
      return 'bg-transparent border border-gray-700'
  }
}
