/**
 * SpreadChart 组件
 * 绘制差值时序图，Y=0 参考线突出显示
 */
'use client'

import {
  ComposedChart,
  Line,
  Area,
  ReferenceLine,
  ReferenceArea,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { SpreadTimeSeriesPoint } from '@/lib/types'
import { formatDateShort, formatValue, getMonthEndDates } from '@/lib/utils'

interface SpreadChartProps {
  data: SpreadTimeSeriesPoint[]
  label: string  // 差值标签（如 "VIX-VIX3M"）
  isOverviewMode?: boolean
}

export default function SpreadChart({ data, label, isOverviewMode = false }: SpreadChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-8 text-center">
        <p className="text-gray-400">暂无数据</p>
      </div>
    )
  }

  const sortedData = [...data].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  // 为正负区域分离数据
  const chartData = sortedData.map(d => ({
    ...d,
    positive: d.value > 0 ? d.value : 0,
    negative: d.value < 0 ? d.value : 0
  }))

  // 计算Y轴范围（确保0在中间或可见位置）
  const values = sortedData.map(d => d.value)
  const dataMin = Math.min(...values, 0)  // 确保包含0
  const dataMax = Math.max(...values, 0)  // 确保包含0
  const range = dataMax - dataMin
  const padding = range * 0.15 || 1  // 更大的padding便于查看

  const yAxisDomain = [
    dataMin - padding,
    dataMax + padding
  ]

  // 计算预警区间
  const oneDayMs = 24 * 60 * 60 * 1000
  const alertRanges: Array<{ start: string; end: string }> = []
  let currentRange: { start: string; end: string } | null = null

  sortedData.forEach((point) => {
    if (point.status === 'alert') {
      if (!currentRange) {
        currentRange = { start: point.date, end: point.date }
        return
      }

      const prevTime = new Date(`${currentRange.end}T00:00:00`).getTime()
      const currentTime = new Date(`${point.date}T00:00:00`).getTime()

      if (currentTime - prevTime === oneDayMs) {
        currentRange.end = point.date
      } else {
        alertRanges.push(currentRange)
        currentRange = { start: point.date, end: point.date }
      }
    } else if (currentRange) {
      alertRanges.push(currentRange)
      currentRange = null
    }
  })

  if (currentRange) {
    alertRanges.push(currentRange)
  }

  const dates = sortedData.map((point) => point.date)
  const dateIndex = new Map(dates.map((date, index) => [date, index]))

  // 总览模式下，只显示每月月底日期作为刻度
  const monthEndTicks = isOverviewMode ? getMonthEndDates(dates) : undefined

  // Y轴刻度格式化
  const formatYAxis = (value: number) => {
    if (Math.abs(value) >= 100) {
      return value.toFixed(0)
    } else if (Math.abs(value) >= 1) {
      return value.toFixed(2)
    } else {
      return value.toFixed(3)
    }
  }

  // 自定义Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const point = payload[0].payload as SpreadTimeSeriesPoint
      const isPositive = point.value > 0
      return (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-lg">
          <p className="text-gray-300 text-sm mb-1">{point.date}</p>
          <p className={`font-medium ${isPositive ? 'text-red-400' : 'text-emerald-400'}`}>
            {label}: {formatValue(point.value)}
          </p>
          {point.status === 'alert' && point.status_reason && (
            <p className="text-red-400 text-xs mt-2">
              ⚠️ {point.status_reason}
            </p>
          )}
        </div>
      )
    }
    return null
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <ResponsiveContainer width="100%" height={350}>
        <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />

          <XAxis
            dataKey="date"
            stroke="#9CA3AF"
            tick={{ fill: '#9CA3AF', fontSize: 12 }}
            tickFormatter={(date) => formatDateShort(date)}
            ticks={monthEndTicks}
          />

          <YAxis
            stroke="#9CA3AF"
            tick={{ fill: '#9CA3AF', fontSize: 12 }}
            domain={yAxisDomain}
            tickFormatter={formatYAxis}
          />

          <Tooltip content={<CustomTooltip />} />

          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="line"
          />

          {/* Y=0 参考线 - 突出显示 */}
          <ReferenceLine
            y={0}
            stroke="#FBBF24"
            strokeWidth={2}
            strokeDasharray="none"
            label={{
              value: 'Y=0',
              position: 'right',
              fill: '#FBBF24',
              fontSize: 12,
              fontWeight: 'bold'
            }}
          />

          {/* 预警区间 */}
          {alertRanges.map((range) => {
            const startIndex = dateIndex.get(range.start) ?? 0
            const endIndex = dateIndex.get(range.end) ?? startIndex
            const renderEnd =
              startIndex === endIndex && endIndex < dates.length - 1
                ? dates[endIndex + 1]
                : range.end

            return (
              <ReferenceArea
                key={`${range.start}-${range.end}`}
                x1={range.start}
                x2={renderEnd}
                fill="#EF4444"
                fillOpacity={0.12}
                strokeOpacity={0}
              />
            )
          })}

          {/* 正值区域填充（红色） */}
          <Area
            type="monotone"
            dataKey="positive"
            stroke="none"
            fill="#EF4444"
            fillOpacity={0.2}
            legendType="none"
          />

          {/* 负值区域填充（绿色） */}
          <Area
            type="monotone"
            dataKey="negative"
            stroke="none"
            fill="#10B981"
            fillOpacity={0.2}
            legendType="none"
          />

          {/* 差值折线 */}
          <Line
            type="monotone"
            dataKey="value"
            stroke="#F59E0B"
            strokeWidth={2}
            dot={false}
            name={label}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
