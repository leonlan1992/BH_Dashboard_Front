/**
 * HeatmapSection 组件
 * 按factor分组显示的热力图区块
 */
'use client'

import { formatDateShort } from '@/lib/utils'
import HeatmapCell from './HeatmapCell'
import type { Indicator, HeatmapCellData } from '@/lib/types'

interface HeatmapSectionProps {
  factor: {
    key: string
    name: string
    nameEn: string
    description: string
  }
  indicators: Indicator[]
  dates: string[]
  statusMap: Record<string, Record<string, HeatmapCellData | null>>
  selectedCell: { indicatorId: string; date: string } | null
  onCellClick: (indicatorId: string, date: string) => void
  onCellMouseEnter: (e: React.MouseEvent, content: any) => void
  onCellMouseLeave: () => void
}

export default function HeatmapSection({
  factor,
  indicators,
  dates,
  statusMap,
  selectedCell,
  onCellClick,
  onCellMouseEnter,
  onCellMouseLeave
}: HeatmapSectionProps) {
  if (indicators.length === 0) return null

  return (
    <div className="mb-8">
      {/* 分组标题 */}
      <div className="mb-4">
        <h2 className="text-xl font-bold text-white">
          {factor.key} - {factor.name}
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          {factor.nameEn} | {factor.description}
        </p>
      </div>

      {/* 热力图表格 */}
      <div className="overflow-x-auto bg-gray-800 rounded-lg p-4">
        <table className="w-full">
          <thead>
            <tr>
              <th className="text-left text-gray-400 text-xs font-medium py-2 pr-4 sticky left-0 bg-gray-800 z-10 min-w-[200px]">
                指标名称
              </th>
              {dates.map((date) => (
                <th
                  key={date}
                  className="text-gray-400 text-xs font-medium py-2 px-0.5"
                >
                  {formatDateShort(date)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {indicators.map((indicator) => (
              <tr key={indicator.id} className="border-t border-gray-700">
                <td className="text-white text-sm py-2 pr-4 sticky left-0 bg-gray-800 z-10">
                  <div className="truncate max-w-[200px]" title={indicator.indicator_cn}>
                    {indicator.indicator_cn}
                  </div>
                  <div className="text-gray-500 text-xs truncate max-w-[200px]">
                    {indicator.indicator_en}
                  </div>
                </td>
                {dates.map((date) => (
                  <HeatmapCell
                    key={`${indicator.id}-${date}`}
                    indicatorId={indicator.id}
                    indicatorName={indicator.indicator_cn}
                    date={date}
                    cellData={statusMap[indicator.id]?.[date] || null}
                    isSelected={
                      selectedCell?.indicatorId === indicator.id &&
                      selectedCell?.date === date
                    }
                    onClick={() => onCellClick(indicator.id, date)}
                    onMouseEnter={onCellMouseEnter}
                    onMouseLeave={onCellMouseLeave}
                  />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
