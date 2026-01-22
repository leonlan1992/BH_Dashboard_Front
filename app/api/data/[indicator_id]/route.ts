/**
 * GET /api/data/[indicator_id]
 * 获取某个指标的时序数据和预警状态
 *
 * Query参数：
 * - days: 获取最近N天数据（默认30）
 * - start_date: 开始日期 YYYY-MM-DD（可选）
 * - end_date: 结束日期 YYYY-MM-DD（可选）
 */
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import type { Indicator, TimeSeriesPoint, IndicatorData } from '@/lib/types'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ indicator_id: string }> }
) {
  try {
    const { indicator_id } = await params
    const searchParams = request.nextUrl.searchParams

    // 解析查询参数
    const days = parseInt(searchParams.get('days') || '30')
    let startDate = searchParams.get('start_date')
    let endDate = searchParams.get('end_date')

    // 如果没有提供日期范围，使用days计算
    if (!startDate || !endDate) {
      const end = new Date()
      const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000)

      startDate = start.toISOString().split('T')[0]
      endDate = end.toISOString().split('T')[0]
    }

    // 1. 获取指标元数据
    const { data: indicator, error: indicatorError } = await supabase
      .from('bhdashboard_indicators')
      .select('*')
      .eq('id', indicator_id)
      .eq('is_active', true)
      .single()

    if (indicatorError || !indicator) {
      return NextResponse.json(
        { error: 'Indicator not found or inactive' },
        { status: 404 }
      )
    }

    // 2. 获取时序数据
    const { data: timeSeriesData, error: dataError } = await supabase
      .from('bhdashboard_indicator_data')
      .select('date, value, status, status_reason')
      .eq('indicator_id', indicator_id)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true })

    if (dataError) {
      console.error('Supabase query error:', dataError)
      return NextResponse.json(
        { error: 'Failed to fetch time series data' },
        { status: 500 }
      )
    }

    // 3. 计算统计数据
    const totalDays = timeSeriesData?.length || 0
    const alertDays = timeSeriesData?.filter((d: TimeSeriesPoint) => d.status === 'alert').length || 0
    const alertRate = totalDays > 0 ? (alertDays / totalDays) * 100 : 0

    const latestPoint = timeSeriesData?.[timeSeriesData.length - 1]
    const latestValue = latestPoint?.value || 0
    const latestStatus = latestPoint?.status || null

    // 4. 构建响应
    const response: IndicatorData = {
      indicator: indicator as Indicator,
      data: (timeSeriesData || []) as TimeSeriesPoint[],
      stats: {
        total_days: totalDays,
        alert_days: alertDays,
        alert_rate: parseFloat(alertRate.toFixed(1)),
        latest_value: latestValue,
        latest_status: latestStatus
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
