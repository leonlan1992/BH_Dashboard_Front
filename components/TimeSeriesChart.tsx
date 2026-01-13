/**
 * TimeSeriesChart 组件
 * 绘制指标的时序图（绿色折线 + 红色预警点）
 */
'use client'

import {
  ComposedChart,
  Line,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { TimeSeriesPoint } from '@/lib/types'
import { formatDateShort, formatValue } from '@/lib/utils'

interface TimeSeriesChartProps {
  data: TimeSeriesPoint[]
}

export default function TimeSeriesChart({ data }: TimeSeriesChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-8 text-center">
        <p className="text-gray-400">暂无数据</p>
      </div>
    )
  }

  // 计算Y轴范围（带padding，避免折线贴边）
  const values = data.map(d => d.value)
  const dataMin = Math.min(...values)
  const dataMax = Math.max(...values)
  const range = dataMax - dataMin
  const padding = range * 0.1 || dataMin * 0.05  // 如果range为0，用5%的dataMin

  const yAxisDomain = [
    dataMin - padding,
    dataMax + padding
  ]

  // 筛选出预警点
  const alertPoints = data.filter(d => d.status === 'alert')

  // Y轴刻度格式化（避免过长小数）
  const formatYAxis = (value: number) => {
    if (Math.abs(value) >= 100) {
      return value.toFixed(0)  // 大数值，显示整数
    } else if (Math.abs(value) >= 1) {
      return value.toFixed(2)  // 中等数值，2位小数
    } else {
      return value.toFixed(3)  // 小数值，3位小数
    }
  }

  // 自定义Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const point = payload[0].payload as TimeSeriesPoint
      return (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-lg">
          <p className="text-gray-300 text-sm mb-1">{point.date}</p>
          <p className="text-white font-medium">
            数值: {formatValue(point.value)}
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
      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />

          <XAxis
            dataKey="date"
            stroke="#9CA3AF"
            tick={{ fill: '#9CA3AF', fontSize: 12 }}
            tickFormatter={(date) => formatDateShort(date)}
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

          {/* 绿色折线图（所有数据点） */}
          <Line
            type="monotone"
            dataKey="value"
            stroke="#10B981"
            strokeWidth={2}
            dot={false}
            name="指标数值"
          />

          {/* 红色散点（预警点） */}
          {alertPoints.length > 0 && (
            <Scatter
              data={alertPoints}
              dataKey="value"
              fill="#EF4444"
              shape="circle"
              name="预警点"
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
