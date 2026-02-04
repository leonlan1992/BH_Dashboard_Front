/**
 * 测试API逻辑: 模拟 /api/data/combined 的数据源选择
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testApiLogic() {
  console.log('=== 模拟 API 数据源选择逻辑 ===\n')

  const today = new Date().toISOString().split('T')[0]
  const twoYearsAgo = new Date()
  twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2)
  const startDate = twoYearsAgo.toISOString().split('T')[0]
  const endDate = today

  console.log(`日期范围: ${startDate} 到 ${endDate}\n`)

  // 模拟API的数据源选择逻辑
  const baseIndicators = ['bbg_VIX_Index', 'Wind_G0003892', 'FRED_VIXCLS']
  let baseData: any[] = []
  let selectedSource = ''

  for (const baseIndicator of baseIndicators) {
    console.log(`尝试数据源: ${baseIndicator}`)
    const { data, error } = await supabase
      .from('bhdashboard_indicator_data')
      .select('date, value')
      .eq('indicator_id', baseIndicator)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true })

    if (error) {
      console.log(`  ❌ 错误: ${error.message}`)
    } else if (!data || data.length === 0) {
      console.log(`  ❌ 无数据`)
    } else {
      console.log(`  ✓ 找到 ${data.length} 条数据`)
      console.log(`  最早: ${data[0].date}`)
      console.log(`  最晚: ${data[data.length - 1].date}`)
      baseData = data
      selectedSource = baseIndicator
      console.log(`  ✅ 选中此数据源!`)
      break
    }
    console.log()
  }

  if (!baseData.length) {
    console.log('\n❌ 未找到任何可用的基础VIX数据源')
    return
  }

  console.log(`\n=== 最终选择: ${selectedSource} ===`)
  console.log(`数据范围: ${baseData[0].date} 到 ${baseData[baseData.length - 1].date}`)
  console.log(`总数据点: ${baseData.length}`)

  // 获取VIX9D数据
  console.log('\n--- VIX9D数据 ---')
  const { data: vix9dData } = await supabase
    .from('bhdashboard_indicator_data')
    .select('date, value')
    .eq('indicator_id', 'yhfinance_^VIX9D')
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true })

  if (vix9dData) {
    console.log(`数据范围: ${vix9dData[0].date} 到 ${vix9dData[vix9dData.length - 1].date}`)
    console.log(`总数据点: ${vix9dData.length}`)
  }

  // 模拟对比数据生成逻辑
  console.log('\n--- 对比图数据交集 ---')
  const baseMap = new Map<string, number>()
  baseData.forEach((d: any) => {
    baseMap.set(d.date, d.value)
  })

  const comparisonData = (vix9dData || [])
    .filter((d: any) => baseMap.has(d.date))

  if (comparisonData.length > 0) {
    console.log(`交集数据点: ${comparisonData.length}`)
    console.log(`最早日期: ${comparisonData[0].date}`)
    console.log(`最晚日期: ${comparisonData[comparisonData.length - 1].date}`)
    console.log(`\n⚠️ 图表将只显示到: ${comparisonData[comparisonData.length - 1].date}`)
  }

  // 分析缺失日期
  console.log('\n--- 缺失数据分析 ---')
  const vix9dDates = new Set((vix9dData || []).map((d: any) => d.date))
  const baseDates = new Set(baseData.map((d: any) => d.date))

  const missingInBase = Array.from(vix9dDates).filter(date => !baseDates.has(date))
  const missingInVix9d = Array.from(baseDates).filter(date => !vix9dDates.has(date))

  if (missingInBase.length > 0) {
    console.log(`\n${selectedSource} 缺失但VIX9D有的日期 (最近10个):`)
    missingInBase.slice(-10).forEach(date => console.log(`  - ${date}`))
  }

  if (missingInVix9d.length > 0) {
    console.log(`\nVIX9D 缺失但${selectedSource}有的日期 (最近10个):`)
    missingInVix9d.slice(-10).forEach(date => console.log(`  - ${date}`))
  }
}

testApiLogic().catch(console.error)
