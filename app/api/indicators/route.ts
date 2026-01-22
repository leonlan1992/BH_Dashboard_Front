/**
 * GET /api/indicators
 * 获取所有指标元数据，按factor分组
 */
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import type { Indicator, IndicatorsByFactor } from '@/lib/types'

export async function GET() {
  try {
    // 查询所有活跃指标
    const { data, error } = await supabase
      .from('bhdashboard_indicators')
      .select('*')
      .eq('is_active', true)
      .order('factor, tier')

    if (error) {
      console.error('Supabase query error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch indicators' },
        { status: 500 }
      )
    }

    if (!data || data.length === 0) {
      return NextResponse.json({
        D: [],
        C: [],
        V: [],
        A: []
      })
    }

    // 按factor分组
    const grouped: IndicatorsByFactor = data.reduce((acc, indicator: Indicator) => {
      const factor = indicator.factor
      if (!acc[factor]) {
        acc[factor] = []
      }
      acc[factor].push(indicator)
      return acc
    }, { D: [], C: [], V: [], A: [] } as IndicatorsByFactor)

    return NextResponse.json(grouped)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
