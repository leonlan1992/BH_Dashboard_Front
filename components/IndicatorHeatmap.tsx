/**
 * IndicatorHeatmap 组件
 * 热力图主组件，整合D/C/V三个分组
 */
'use client'

import { useState } from 'react'
import { FACTORS } from '@/lib/types'
import HeatmapSection from './HeatmapSection'
import HeatmapTooltip from './HeatmapTooltip'
import IndicatorInfoTooltip from './IndicatorInfoTooltip'
import type { HeatmapData } from '@/lib/types'

interface IndicatorHeatmapProps {
  data: HeatmapData
  onCellClick: (indicatorId: string) => void
}

export default function IndicatorHeatmap({
  data,
  onCellClick
}: IndicatorHeatmapProps) {
  const [selectedCell, setSelectedCell] = useState<{
    indicatorId: string
    date: string
  } | null>(null)

  const [tooltip, setTooltip] = useState<{
    visible: boolean
    x: number
    y: number
    content: {
      indicatorName: string
      date: string
      value: number | null
      status: string
      statusReason: string | null
    }
  }>({
    visible: false,
    x: 0,
    y: 0,
    content: {
      indicatorName: '',
      date: '',
      value: null,
      status: '',
      statusReason: null
    }
  })

  const [indicatorTooltip, setIndicatorTooltip] = useState<{
    visible: boolean
    x: number
    y: number
    content: {
      indicatorName: string
      ruleDescription: string
      investmentImplication: string
    }
  }>({
    visible: false,
    x: 0,
    y: 0,
    content: {
      indicatorName: '',
      ruleDescription: '',
      investmentImplication: ''
    }
  })

  const handleCellClick = (indicatorId: string, date: string) => {
    // 设置选中的格子
    if (selectedCell?.indicatorId === indicatorId && selectedCell?.date === date) {
      // 点击同一个格子，取消选中
      setSelectedCell(null)
      onCellClick('')  // 清空展开的图表
    } else {
      setSelectedCell({ indicatorId, date })
      onCellClick(indicatorId)  // 展开该指标的图表
    }
  }

  const handleIndicatorMouseEnter = (
    e: React.MouseEvent,
    content: {
      indicatorName: string
      ruleDescription: string
      investmentImplication: string
    }
  ) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setIndicatorTooltip({
      visible: true,
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
      content
    })
  }

  const handleIndicatorMouseLeave = () => {
    setIndicatorTooltip({
      ...indicatorTooltip,
      visible: false
    })
  }

  const handleCellMouseEnter = (
    e: React.MouseEvent,
    content: {
      indicatorName: string
      date: string
      value: number | null
      status: string
      statusReason: string | null
    }
  ) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setTooltip({
      visible: true,
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
      content
    })
  }

  const handleCellMouseLeave = () => {
    setTooltip({
      ...tooltip,
      visible: false
    })
  }

  return (
    <div className="relative">
      {/* D、C、V三个factor组 */}
      {FACTORS.map((factor) => (
        <HeatmapSection
          key={factor.key}
          factor={factor}
          indicators={data.indicators[factor.key as 'D' | 'C' | 'V']}
          dates={data.dates}
          statusMap={data.statusMap}
          selectedCell={selectedCell}
          onCellClick={handleCellClick}
          onIndicatorMouseEnter={handleIndicatorMouseEnter}
          onIndicatorMouseLeave={handleIndicatorMouseLeave}
          onCellMouseEnter={handleCellMouseEnter}
          onCellMouseLeave={handleCellMouseLeave}
        />
      ))}

      {/* Tooltip */}
      <HeatmapTooltip
        visible={tooltip.visible}
        x={tooltip.x}
        y={tooltip.y}
        content={tooltip.content}
      />

      <IndicatorInfoTooltip
        visible={indicatorTooltip.visible}
        x={indicatorTooltip.x}
        y={indicatorTooltip.y}
        content={indicatorTooltip.content}
      />
    </div>
  )
}
