/**
 * HeatmapTooltip 组件
 * 鼠标悬停在热力图格子上时显示的提示框
 */
'use client'

import { formatValue } from '@/lib/utils'

interface TooltipContent {
  indicatorName: string
  date: string
  value: number | null
  status: string
  statusReason: string | null
}

interface HeatmapTooltipProps {
  visible: boolean
  x: number
  y: number
  content: TooltipContent
}

export default function HeatmapTooltip({
  visible,
  x,
  y,
  content
}: HeatmapTooltipProps) {
  if (!visible) return null

  return (
    <div
      className="fixed z-50 bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-xl pointer-events-none"
      style={{
        left: x,
        top: y,
        transform: 'translate(-50%, -100%)'
      }}
    >
      <p className="text-white font-medium text-sm">{content.indicatorName}</p>
      <p className="text-gray-400 text-xs mt-1">{content.date}</p>

      {content.value !== null ? (
        <p className="text-white text-sm mt-1">
          数值: <span className="font-mono">{formatValue(content.value)}</span>
        </p>
      ) : (
        <p className="text-gray-500 text-sm mt-1">暂无数据</p>
      )}

      <div className={`text-xs mt-2 px-2 py-1 rounded ${
        content.status === 'alert' ? 'bg-red-900/50 text-red-300' :
        content.status === 'normal' ? 'bg-green-900/50 text-green-300' :
        'bg-gray-800 text-gray-400'
      }`}>
        状态: {content.status}
      </div>

      {content.statusReason && (
        <div className="mt-2 text-red-400 text-xs bg-red-900/30 rounded p-2">
          <span className="font-medium">⚠️ 预警原因:</span>
          <p className="mt-1">{content.statusReason}</p>
        </div>
      )}
    </div>
  )
}
