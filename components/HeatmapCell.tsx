/**
 * HeatmapCell 组件
 * 热力图的单个格子，显示某个指标在某一天的状态
 */
'use client'

import { getHeatmapCellColor } from '@/lib/utils'
import type { HeatmapCellData } from '@/lib/types'

interface HeatmapCellProps {
  indicatorId: string
  indicatorName: string
  date: string
  cellData: HeatmapCellData | null
  isSelected: boolean
  onClick: () => void
  onMouseEnter: (e: React.MouseEvent, content: {
    indicatorName: string
    date: string
    value: number | null
    status: string
    statusReason: string | null
  }) => void
  onMouseLeave: () => void
}

export default function HeatmapCell({
  indicatorId,
  indicatorName,
  date,
  cellData,
  isSelected,
  onClick,
  onMouseEnter,
  onMouseLeave
}: HeatmapCellProps) {
  const status = cellData?.status || null
  const colorClass = getHeatmapCellColor(status)

  const handleMouseEnter = (e: React.MouseEvent) => {
    onMouseEnter(e, {
      indicatorName,
      date,
      value: cellData?.value || null,
      status: status || '无数据',
      statusReason: cellData?.status_reason || null
    })
  }

  return (
    <td
      className={`
        w-3 h-8 cursor-pointer transition-all
        ${colorClass}
        ${isSelected ? 'ring-2 ring-blue-500' : ''}
        hover:scale-110
      `}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={onMouseLeave}
      title={`${indicatorName} - ${date}`}
    />
  )
}
