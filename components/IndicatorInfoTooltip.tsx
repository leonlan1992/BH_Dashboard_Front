/**
 * IndicatorInfoTooltip 组件
 * 鼠标悬停在指标名称上时显示详细信息
 */
'use client'

interface IndicatorInfoTooltipProps {
  visible: boolean
  x: number
  y: number
  content: {
    indicatorName: string
    ruleDescription: string
    investmentImplication: string
  }
}

export default function IndicatorInfoTooltip({
  visible,
  x,
  y,
  content
}: IndicatorInfoTooltipProps) {
  if (!visible) return null

  return (
    <div
      className="fixed z-50 bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-xl pointer-events-none max-w-xs"
      style={{
        left: x,
        top: y,
        transform: 'translate(-10%, -100%)'
      }}
    >
      <p className="text-white font-medium text-sm">{content.indicatorName}</p>
      <p className="text-gray-300 text-xs mt-2">
        预警规则: {content.ruleDescription}
      </p>
      <p className="text-gray-300 text-xs mt-2">
        投资意义: {content.investmentImplication}
      </p>
    </div>
  )
}
