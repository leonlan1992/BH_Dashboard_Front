/**
 * ComparisonChart 组件
 * 绘制两个指标的对比折线图（如 VIX vs VIX3M）
 */
'use client'

import {
  ComposedChart,
  Line,
  ReferenceArea,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { CombinedTimeSeriesPoint } from '@/lib/types'
import { formatDateShort, formatValue, getMonthEndDates } from '@/lib/utils'

interface ComparisonChartProps {
  data: CombinedTimeSeriesPoint[]
  label1: string  // 第一条线标签（如 "VIX"）
  label2: string  // 第二条线标签（如 "VIX3M"）
  isOverviewMode?: boolean
}

export default function ComparisonChart({ data, label1, label2, isOverviewMode = false }: ComparisonChartProps) {
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

  // 计算Y轴范围（带padding）
  const allValues = sortedData.flatMap(d => [d.value1, d.value2])
  const dataMin = Math.min(...allValues)
  const dataMax = Math.max(...allValues)
  const range = dataMax - dataMin
  const padding = range * 0.1 || dataMin * 0.05

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
      return value.toFixed(1)
    } else {
      return value.toFixed(2)
    }
  }

  // 自定义Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const point = payload[0].payload as CombinedTimeSeriesPoint
      return (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-lg">
          <p className="text-gray-300 text-sm mb-2">{point.date}</p>
          <p className="text-blue-400 font-medium">
            {label1}: {formatValue(point.value1)}
          </p>
          <p className="text-emerald-400 font-medium">
            {label2}: {formatValue(point.value2)}
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
        <ComposedChart data={sortedData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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

          {/* 第一条线（VIX）- 蓝色 */}
          <Line
            type="monotone"
            dataKey="value1"
            stroke="#3B82F6"
            strokeWidth={2}
            dot={false}
            name={label1}
          />

          {/* 第二条线（VIX3M/VIX9D）- 绿色 */}
          <Line
            type="monotone"
            dataKey="value2"
            stroke="#10B981"
            strokeWidth={2}
            dot={false}
            name={label2}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
