/**
 * BH Dashboard 主页面 - 热力图版本
 * GitHub风格的热力图展示，纵轴=指标，横轴=30天日期
 */
'use client'

import { useState, useEffect } from 'react'
import { HeatmapData, IndicatorData, CombinedIndicatorData, COMBINED_INDICATOR_CONFIG } from '@/lib/types'
import IndicatorHeatmap from '@/components/IndicatorHeatmap'
import TimeSeriesChart from '@/components/TimeSeriesChart'
import ComparisonChart from '@/components/ComparisonChart'
import SpreadChart from '@/components/SpreadChart'

export default function Home() {
  // 1. 热力图数据
  const [heatmapData, setHeatmapData] = useState<HeatmapData | null>(null)

  // 2. 选中的指标ID
  const [selectedIndicatorId, setSelectedIndicatorId] = useState<string | null>(null)

  // 3. 展开的时序数据
  const [indicatorData, setIndicatorData] = useState<IndicatorData | null>(null)

  // 3.5 组合指标数据（VIX3M/VIX9D 双图表）
  const [combinedData, setCombinedData] = useState<CombinedIndicatorData | null>(null)

  // 4. 加载状态
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingChart, setIsLoadingChart] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [heatmapEndDate, setHeatmapEndDate] = useState(() =>
    new Date().toISOString().split('T')[0]
  )
  const [isOverviewMode, setIsOverviewMode] = useState(false)
  const heatmapDays = isOverviewMode ? 365 : 30

  // 获取热力图数据
  const fetchHeatmapData = async (endDate: string, days: number) => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(`/api/heatmap?end_date=${endDate}&days=${days}`)
      if (!response.ok) {
        throw new Error('Failed to fetch heatmap data')
      }

      const data: HeatmapData = await response.json()
      setHeatmapData(data)
    } catch (err) {
      console.error('Error fetching heatmap data:', err)
      setError('加载热力图数据失败，请刷新重试')
    } finally {
      setIsLoading(false)
    }
  }

  // 获取指标详细时序数据（用于展开的图表）
  // 使用热力图的截止日期作为结束日期，获取该日期前2年的数据
  const fetchIndicatorData = async (indicatorId: string) => {
    try {
      setIsLoadingChart(true)
      // 清空之前的数据
      setIndicatorData(null)
      setCombinedData(null)

      // 使用热力图截止日期作为结束日期，计算2年前的开始日期
      const endDate = heatmapEndDate
      const startDateObj = new Date(`${endDate}T00:00:00`)
      startDateObj.setFullYear(startDateObj.getFullYear() - 2)
      const startDate = startDateObj.toISOString().split('T')[0]

      // 检查是否为组合指标（需要显示双图表）
      if (COMBINED_INDICATOR_CONFIG[indicatorId]) {
        const response = await fetch(
          `/api/data/combined?main_indicator=${encodeURIComponent(indicatorId)}&start_date=${startDate}&end_date=${endDate}`
        )

        if (!response.ok) {
          throw new Error('Failed to fetch combined indicator data')
        }

        const data: CombinedIndicatorData = await response.json()
        setCombinedData(data)
      } else {
        // 普通指标，使用原有逻辑
        const response = await fetch(
          `/api/data/${indicatorId}?start_date=${startDate}&end_date=${endDate}`
        )

        if (!response.ok) {
          throw new Error('Failed to fetch indicator data')
        }

        const data: IndicatorData = await response.json()
        setIndicatorData(data)
      }
    } catch (err) {
      console.error('Error fetching indicator data:', err)
      setError('加载指标数据失败，请重试')
    } finally {
      setIsLoadingChart(false)
    }
  }

  // 处理格子点击
  const handleCellClick = (indicatorId: string) => {
    if (!indicatorId) {
      // 点击同一个格子，取消选中
      setSelectedIndicatorId(null)
      setIndicatorData(null)
      setCombinedData(null)
    } else {
      // 选中新指标
      setSelectedIndicatorId(indicatorId)
      fetchIndicatorData(indicatorId)
    }
  }

  // 判断是否为组合指标模式（VIX3M/VIX9D 或 Tech OAS）
  const isCombinedMode = selectedIndicatorId && COMBINED_INDICATOR_CONFIG[selectedIndicatorId]

  // 刷新数据
  const handleRefresh = () => {
    fetchHeatmapData(heatmapEndDate, heatmapDays)
    if (selectedIndicatorId) {
      fetchIndicatorData(selectedIndicatorId)
    }
  }

  const handleToggleOverview = () => {
    setIsOverviewMode((prev) => {
      const next = !prev
      fetchHeatmapData(heatmapEndDate, next ? 365 : 30)
      return next
    })
  }

  // 初始加载
  useEffect(() => {
    fetchHeatmapData(heatmapEndDate, heatmapDays)
  }, [])

  return (
    <main className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-[1800px] mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-wrap justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">BH Dashboard</h1>
            <p className="text-gray-400 mt-1">风险监控仪表盘 - 热力图视图</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleToggleOverview}
              className={`px-4 py-2 rounded-lg transition ${
                isOverviewMode
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              {isOverviewMode ? '总览模式：365天' : '总览模式：关闭'}
            </button>
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <span>截止日期</span>
              <input
                type="date"
                value={heatmapEndDate}
                onChange={(event) => setHeatmapEndDate(event.target.value)}
                className="bg-gray-800 border border-gray-600 rounded-md px-2 py-1 text-gray-200"
              />
            </div>
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-4 py-2 rounded-lg transition"
            >
              {isLoading ? '加载中...' : '🔄 刷新'}
            </button>
          </div>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="bg-red-900/50 border border-red-600 rounded-lg p-4 mb-6">
            <p className="text-red-200">⚠️ {error}</p>
          </div>
        )}

        {/* 加载状态 */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-500 border-t-blue-500"></div>
            <p className="text-gray-400 mt-4">加载热力图数据中...</p>
          </div>
        )}

        {/* 热力图 */}
        {!isLoading && heatmapData && (
          <IndicatorHeatmap
            data={heatmapData}
            onCellClick={handleCellClick}
            compact={isOverviewMode}
          />
        )}

        {/* 展开的指标详情 */}
        {selectedIndicatorId && (
          <div className="mt-8 bg-gray-800 rounded-lg p-6">
            {/* 组合指标模式（VIX3M/VIX9D 或 Tech OAS）- 双图表 */}
            {isCombinedMode ? (
              <>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-white mb-2">
                    {combinedData?.mainIndicator.indicator_cn || '加载中...'}
                  </h2>
                  <p className="text-gray-400 text-sm mb-1">
                    {combinedData?.mainIndicator.indicator_en}
                  </p>
                  {combinedData && (
                    <p className="text-gray-300 text-sm bg-gray-700 rounded p-3 mt-3">
                      <span className="text-yellow-400 font-medium">规则说明：</span>
                      {combinedData.mainIndicator.rule_description}
                    </p>
                  )}
                </div>

                {/* 统计信息 */}
                {combinedData && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-gray-700 rounded-lg p-4">
                      <div className="text-gray-400 text-xs mb-1">总天数</div>
                      <div className="text-white text-2xl font-bold">
                        {combinedData.stats.total_days}
                      </div>
                    </div>

                    <div className="bg-gray-700 rounded-lg p-4">
                      <div className="text-gray-400 text-xs mb-1">预警天数</div>
                      <div className="text-red-400 text-2xl font-bold">
                        {combinedData.stats.alert_days}
                      </div>
                    </div>

                    <div className="bg-gray-700 rounded-lg p-4">
                      <div className="text-gray-400 text-xs mb-1">预警率</div>
                      <div className="text-yellow-400 text-2xl font-bold">
                        {combinedData.stats.alert_rate}%
                      </div>
                    </div>

                    <div className="bg-gray-700 rounded-lg p-4">
                      <div className="text-gray-400 text-xs mb-1">最新差值</div>
                      <div className={`text-2xl font-bold ${combinedData.stats.latest_value > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                        {combinedData.stats.latest_value.toFixed(2)}
                      </div>
                    </div>
                  </div>
                )}

                {/* 双图表展示 */}
                {isLoadingChart ? (
                  <div className="bg-gray-800 rounded-lg p-8 text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-500 border-t-blue-500"></div>
                    <p className="text-gray-400 mt-2">加载数据中...</p>
                  </div>
                ) : combinedData ? (
                  <div className="space-y-8">
                    {/* 对比图（VIX vs VIX3M/VIX9D） */}
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-4">
                        {combinedData.labels.line1} vs {combinedData.labels.line2} 对比图（2年）
                      </h3>
                      <ComparisonChart
                        data={combinedData.comparisonData}
                        label1={combinedData.labels.line1}
                        label2={combinedData.labels.line2}
                        isOverviewMode={isOverviewMode}
                      />
                    </div>

                    {/* 差值图 */}
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-4">
                        {combinedData.labels.spread} 差值图（2年）
                      </h3>
                      <SpreadChart
                        data={combinedData.spreadData}
                        label={combinedData.labels.spread}
                        isOverviewMode={isOverviewMode}
                      />
                    </div>
                  </div>
                ) : null}
              </>
            ) : (
              /* 普通指标模式 - 单图表 */
              <>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-white mb-2">
                    {indicatorData?.indicator.indicator_cn || '加载中...'}
                  </h2>
                  <p className="text-gray-400 text-sm mb-1">
                    {indicatorData?.indicator.indicator_en}
                  </p>
                  {indicatorData && (
                    <p className="text-gray-300 text-sm bg-gray-700 rounded p-3 mt-3">
                      <span className="text-yellow-400 font-medium">规则说明：</span>
                      {indicatorData.indicator.rule_description}
                    </p>
                  )}
                </div>

                {/* 统计信息 */}
                {indicatorData && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-gray-700 rounded-lg p-4">
                      <div className="text-gray-400 text-xs mb-1">总天数</div>
                      <div className="text-white text-2xl font-bold">
                        {indicatorData.stats.total_days}
                      </div>
                    </div>

                    <div className="bg-gray-700 rounded-lg p-4">
                      <div className="text-gray-400 text-xs mb-1">预警天数</div>
                      <div className="text-red-400 text-2xl font-bold">
                        {indicatorData.stats.alert_days}
                      </div>
                    </div>

                    <div className="bg-gray-700 rounded-lg p-4">
                      <div className="text-gray-400 text-xs mb-1">预警率</div>
                      <div className="text-yellow-400 text-2xl font-bold">
                        {indicatorData.stats.alert_rate}%
                      </div>
                    </div>

                    <div className="bg-gray-700 rounded-lg p-4">
                      <div className="text-gray-400 text-xs mb-1">最新数值</div>
                      <div className="text-blue-400 text-2xl font-bold">
                        {indicatorData.stats.latest_value.toFixed(2)}
                      </div>
                    </div>
                  </div>
                )}

                {/* 时序图 */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">时序图表（2年）</h3>
                  {isLoadingChart ? (
                    <div className="bg-gray-800 rounded-lg p-8 text-center">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-500 border-t-blue-500"></div>
                      <p className="text-gray-400 mt-2">加载数据中...</p>
                    </div>
                  ) : indicatorData ? (
                    <TimeSeriesChart data={indicatorData.data} isOverviewMode={isOverviewMode} />
                  ) : null}
                </div>
              </>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center text-gray-500 text-sm">
          <p>BH Dashboard © 2024 | 数据来源: Fred API</p>
        </div>
      </div>
    </main>
  )
}
