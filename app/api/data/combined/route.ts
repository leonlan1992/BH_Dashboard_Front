/**
 * GET /api/data/combined
 * 获取组合指标数据（用于 VIX3M/VIX9D 和 Tech OAS 的双图表展示）
 *
 * Query参数：
 * - main_indicator: 主指标ID（如 yhfinance_^VIX3M、yhfinance_^VIX9D、IG Tech OAS等）
 * - days: 获取最近N天数据（默认730，即2年）
 * - start_date: 开始日期 YYYY-MM-DD（可选）
 * - end_date: 结束日期 YYYY-MM-DD（可选）
 */
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import type {
  Indicator,
  CombinedIndicatorData,
  CombinedTimeSeriesPoint,
  SpreadTimeSeriesPoint
} from '@/lib/types'
import { COMBINED_INDICATOR_CONFIG } from '@/lib/types'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const mainIndicatorId = searchParams.get('main_indicator')

    if (!mainIndicatorId) {
      return NextResponse.json(
        { error: 'main_indicator parameter is required' },
        { status: 400 }
      )
    }

    // 检查是否为支持的组合指标
    const config = COMBINED_INDICATOR_CONFIG[mainIndicatorId]
    if (!config) {
      return NextResponse.json(
        { error: `Indicator ${mainIndicatorId} does not support combined view` },
        { status: 400 }
      )
    }

    // 解析日期范围参数
    const days = parseInt(searchParams.get('days') || '730')
    let startDate = searchParams.get('start_date')
    let endDate = searchParams.get('end_date')

    if (!startDate || !endDate) {
      const end = new Date()
      const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000)
      startDate = start.toISOString().split('T')[0]
      endDate = end.toISOString().split('T')[0]
    }

    // 1. 获取显示用的指标元数据
    // 如果用户点击的是差值指标，优先显示差值指标的元数据；否则显示主指标元数据
    const actualMainIndicatorId = config.mainIndicator
    let displayIndicator = null

    // 尝试获取用户点击的指标元数据（可能是主指标或差值指标）
    const { data: clickedIndicator, error: clickedError } = await supabase
      .from('bhdashboard_indicators')
      .select('*')
      .eq('id', mainIndicatorId)
      .eq('is_active', true)
      .single()

    if (clickedIndicator) {
      // 用户点击的指标有元数据，使用它作为显示
      displayIndicator = clickedIndicator
    } else {
      // 否则回退到主指标元数据
      const { data: fallbackIndicator, error: fallbackError } = await supabase
        .from('bhdashboard_indicators')
        .select('*')
        .eq('id', actualMainIndicatorId)
        .eq('is_active', true)
        .single()

      if (fallbackError || !fallbackIndicator) {
        return NextResponse.json(
          { error: 'Indicator not found or inactive' },
          { status: 404 }
        )
      }
      displayIndicator = fallbackIndicator
    }

    // 2. 获取主指标数据（VIX3M/VIX9D，使用actualMainIndicatorId）
    const { data: mainData, error: mainDataError } = await supabase
      .from('bhdashboard_indicator_data')
      .select('date, value, status, status_reason')
      .eq('indicator_id', actualMainIndicatorId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true })

    if (mainDataError) {
      console.error('Failed to fetch main indicator data:', mainDataError)
      return NextResponse.json(
        { error: 'Failed to fetch main indicator data' },
        { status: 500 }
      )
    }

    // 3. 获取基础指标数据（按优先级尝试多个数据源）
    let baseData: any[] = []
    for (const baseIndicator of config.baseIndicators) {
      const { data, error } = await supabase
        .from('bhdashboard_indicator_data')
        .select('date, value')
        .eq('indicator_id', baseIndicator)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true })

      if (!error && data && data.length > 0) {
        baseData = data
        break
      }
    }

    // 4. 获取差值数据
    const { data: spreadData, error: spreadError } = await supabase
      .from('bhdashboard_indicator_data')
      .select('date, value, status, status_reason')
      .eq('indicator_id', config.spreadIndicator)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true })

    if (spreadError) {
      console.error('Failed to fetch spread data:', spreadError)
    }

    // 5. 构建基础指标数据的日期映射
    const baseMap = new Map<string, number>()
    baseData.forEach((d: any) => {
      baseMap.set(d.date, d.value)
    })

    // 6. 构建差值数据的日期映射（用于对比图的status）
    const spreadMap = new Map<string, { status: any; status_reason: any }>()
    ;(spreadData || []).forEach((d: any) => {
      spreadMap.set(d.date, {
        status: d.status,
        status_reason: d.status_reason
      })
    })

    // 7. 构建对比图数据（只保留两个指标都有数据的日期）
    // 注意：对比图的预警状态应该基于差值指标，而不是主指标
    const comparisonData: CombinedTimeSeriesPoint[] = (mainData || [])
      .filter((d: any) => baseMap.has(d.date))
      .map((d: any) => {
        const spreadInfo = spreadMap.get(d.date)
        return {
          date: d.date,
          value1: baseMap.get(d.date)!,  // 基础指标（如 VIX 或 USD IG OAS）
          value2: d.value,                // 主指标（如 VIX3M、VIX9D、IG Tech OAS等）
          status: spreadInfo?.status || null,           // 使用差值指标的status
          status_reason: spreadInfo?.status_reason || null  // 使用差值指标的status_reason
        }
      })

    // 8. 构建差值图数据
    const spreadDataResult: SpreadTimeSeriesPoint[] = (spreadData || []).map((d: any) => ({
      date: d.date,
      value: d.value,
      status: d.status,
      status_reason: d.status_reason
    }))

    // 9. 计算统计数据（基于差值数据）
    const totalDays = spreadDataResult.length
    const alertDays = spreadDataResult.filter(d => d.status === 'alert').length
    const alertRate = totalDays > 0 ? (alertDays / totalDays) * 100 : 0
    const latestSpread = spreadDataResult[spreadDataResult.length - 1]

    // 10. 构建响应
    const response: CombinedIndicatorData = {
      mainIndicator: displayIndicator as Indicator,
      comparisonData,
      spreadData: spreadDataResult,
      labels: config.labels,
      stats: {
        total_days: totalDays,
        alert_days: alertDays,
        alert_rate: parseFloat(alertRate.toFixed(1)),
        latest_value: latestSpread?.value || 0,
        latest_status: latestSpread?.status || null
      }
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
