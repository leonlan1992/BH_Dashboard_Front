/**
 * GET /api/data/combined
 * 获取组合指标数据（用于 VIX3M/VIX9D 的双图表展示）
 *
 * Query参数：
 * - main_indicator: 主指标ID（yhfinance_^VIX3M 或 yhfinance_^VIX9D）
 * - days: 获取最近N天数据（默认30）
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
import { VIX_COMBINED_CONFIG } from '@/lib/types'

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
    const config = VIX_COMBINED_CONFIG[mainIndicatorId]
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

    // 1. 获取主指标元数据
    const { data: mainIndicator, error: indicatorError } = await supabase
      .from('bhdashboard_indicators')
      .select('*')
      .eq('id', mainIndicatorId)
      .eq('is_active', true)
      .single()

    if (indicatorError || !mainIndicator) {
      return NextResponse.json(
        { error: 'Main indicator not found or inactive' },
        { status: 404 }
      )
    }

    // 2. 获取主指标数据（VIX3M/VIX9D）
    const { data: mainData, error: mainDataError } = await supabase
      .from('bhdashboard_indicator_data')
      .select('date, value, status, status_reason')
      .eq('indicator_id', mainIndicatorId)
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

    // 3. 获取 VIX 数据（按优先级尝试多个数据源）
    let vixData: any[] = []
    for (const vixIndicator of config.vixIndicators) {
      const { data, error } = await supabase
        .from('bhdashboard_indicator_data')
        .select('date, value')
        .eq('indicator_id', vixIndicator)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true })

      if (!error && data && data.length > 0) {
        vixData = data
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

    // 5. 构建 VIX 数据的日期映射
    const vixMap = new Map<string, number>()
    vixData.forEach((d: any) => {
      vixMap.set(d.date, d.value)
    })

    // 6. 构建对比图数据（只保留 VIX 和主指标都有数据的日期）
    const comparisonData: CombinedTimeSeriesPoint[] = (mainData || [])
      .filter((d: any) => vixMap.has(d.date))
      .map((d: any) => ({
        date: d.date,
        value1: vixMap.get(d.date)!,  // VIX
        value2: d.value,               // VIX3M/VIX9D
        status: d.status,
        status_reason: d.status_reason
      }))

    // 7. 构建差值图数据
    const spreadDataResult: SpreadTimeSeriesPoint[] = (spreadData || []).map((d: any) => ({
      date: d.date,
      value: d.value,
      status: d.status,
      status_reason: d.status_reason
    }))

    // 8. 计算统计数据（基于差值数据）
    const totalDays = spreadDataResult.length
    const alertDays = spreadDataResult.filter(d => d.status === 'alert').length
    const alertRate = totalDays > 0 ? (alertDays / totalDays) * 100 : 0
    const latestSpread = spreadDataResult[spreadDataResult.length - 1]

    // 9. 构建响应
    const response: CombinedIndicatorData = {
      mainIndicator: mainIndicator as Indicator,
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
