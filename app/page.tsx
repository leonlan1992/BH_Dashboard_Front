/**
 * BH Dashboard 主页面 - 热力图版本
 * GitHub风格的热力图展示，纵轴=指标，横轴=30天日期
 */
'use client'

import { useState, useEffect } from 'react'
import { HeatmapData, IndicatorData } from '@/lib/types'
import { getDateRange } from '@/lib/utils'
import IndicatorHeatmap from '@/components/IndicatorHeatmap'
import TimeSeriesChart from '@/components/TimeSeriesChart'

export default function Home() {
  // 1. 热力图数据
  const [heatmapData, setHeatmapData] = useState<HeatmapData | null>(null)

  // 2. 选中的指标ID
  const [selectedIndicatorId, setSelectedIndicatorId] = useState<string | null>(null)

  // 3. 展开的时序数据
  const [indicatorData, setIndicatorData] = useState<IndicatorData | null>(null)

  // 4. 加载状态
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingChart, setIsLoadingChart] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 获取热力图数据
  const fetchHeatmapData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/heatmap')
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
  const fetchIndicatorData = async (indicatorId: string) => {
    try {
      setIsLoadingChart(true)

      const { startDate, endDate } = getDateRange(730) // 获取2年数据
      const response = await fetch(
        `/api/data/${indicatorId}?start_date=${startDate}&end_date=${endDate}`
      )

      if (!response.ok) {
        throw new Error('Failed to fetch indicator data')
      }

      const data: IndicatorData = await response.json()
      setIndicatorData(data)
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
    } else {
      // 选中新指标
      setSelectedIndicatorId(indicatorId)
      fetchIndicatorData(indicatorId)
    }
  }

  // 刷新数据
  const handleRefresh = () => {
    fetchHeatmapData()
    if (selectedIndicatorId) {
      fetchIndicatorData(selectedIndicatorId)
    }
  }

  // 初始加载
  useEffect(() => {
    fetchHeatmapData()
  }, [])

  return (
    <main className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">BH Dashboard</h1>
            <p className="text-gray-400 mt-1">风险监控仪表盘 - 热力图视图</p>
          </div>

          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-4 py-2 rounded-lg transition"
          >
            {isLoading ? '加载中...' : '🔄 刷新'}
          </button>
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
          />
        )}

        {/* 展开的指标详情 */}
        {selectedIndicatorId && (
          <div className="mt-8 bg-gray-800 rounded-lg p-6">
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
                <TimeSeriesChart data={indicatorData.data} />
              ) : null}
            </div>
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
