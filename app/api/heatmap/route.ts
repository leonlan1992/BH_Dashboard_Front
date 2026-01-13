/**
 * GET /api/heatmap
 * 获取热力图数据（30天）
 *
 * 返回所有指标在30天内的状态数据
 */
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { generateDateRange } from '@/lib/utils'
import type { Indicator, IndicatorsByFactor, HeatmapData, HeatmapCellData } from '@/lib/types'

export async function GET() {
  try {
    // 1. 生成30天日期范围
    const dates = generateDateRange(30)
    const startDate = dates[0]
    const endDate = dates[dates.length - 1]

    // 2. 获取所有活跃指标
    const { data: allIndicators, error: indicatorsError } = await supabase
      .from('bhdashboard_indicators')
      .select('*')
      .eq('is_active', true)
      .order('factor, tier')

    if (indicatorsError || !allIndicators) {
      console.error('Failed to fetch indicators:', indicatorsError)
      return NextResponse.json(
        { error: 'Failed to fetch indicators' },
        { status: 500 }
      )
    }

    // 3. 按factor分组
    const indicators: IndicatorsByFactor = {
      D: allIndicators.filter((ind: Indicator) => ind.factor === 'D'),
      C: allIndicators.filter((ind: Indicator) => ind.factor === 'C'),
      V: allIndicators.filter((ind: Indicator) => ind.factor === 'V')
    }

    // 4. 批量获取所有指标的30天数据
    const { data: allData, error: dataError } = await supabase
      .from('bhdashboard_indicator_data')
      .select('indicator_id, date, value, status, status_reason')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true })

    if (dataError) {
      console.error('Failed to fetch indicator data:', dataError)
      return NextResponse.json(
        { error: 'Failed to fetch indicator data' },
        { status: 500 }
      )
    }

    // 5. 构建statusMap
    const statusMap: Record<string, Record<string, HeatmapCellData | null>> = {}

    allIndicators.forEach((ind: Indicator) => {
      statusMap[ind.id] = {}

      dates.forEach((date) => {
        // 查找该指标在该日期的数据
        const record = allData?.find(
          (d: any) => d.indicator_id === ind.id && d.date === date
        )

        if (record) {
          statusMap[ind.id][date] = {
            status: record.status,
            status_reason: record.status_reason,
            value: record.value
          }
        } else {
          // 无数据
          statusMap[ind.id][date] = null
        }
      })
    })

    // 6. 构建响应
    const response: HeatmapData = {
      dates,
      indicators,
      statusMap
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
