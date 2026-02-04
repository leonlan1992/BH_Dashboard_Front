/**
 * 诊断脚本: 检查VIX vs VIX9D数据缺失问题
 *
 * 这个脚本会检查:
 * 1. VIX数据的最新日期
 * 2. VIX9D数据的最新日期
 * 3. 数据缺口
 *
 * 运行方式: NEXT_PUBLIC_SUPABASE_URL=xxx NEXT_PUBLIC_SUPABASE_ANON_KEY=yyy npx tsx scripts/diagnose-vix-data.ts
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase credentials. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function diagnoseVixData() {
  console.log('=== VIX vs VIX9D 数据诊断 ===\n')

  const today = new Date().toISOString().split('T')[0]
  const twoYearsAgo = new Date()
  twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2)
  const startDate = twoYearsAgo.toISOString().split('T')[0]

  console.log(`查询日期范围: ${startDate} 到 ${today}\n`)

  // 检查基础VIX指标
  const vixIndicators = ['bbg_VIX_Index', 'Wind_G0003892', 'FRED_VIXCLS']
  console.log('--- 基础VIX指标检查 ---')

  for (const indicatorId of vixIndicators) {
    const { data, error } = await supabase
      .from('bhdashboard_indicator_data')
      .select('date, value')
      .eq('indicator_id', indicatorId)
      .gte('date', startDate)
      .lte('date', today)
      .order('date', { ascending: false })
      .limit(5)

    if (error) {
      console.log(`❌ ${indicatorId}: 查询错误 - ${error.message}`)
    } else if (!data || data.length === 0) {
      console.log(`❌ ${indicatorId}: 无数据`)
    } else {
      console.log(`✓ ${indicatorId}:`)
      console.log(`  总数据点: ${data.length}`)
      console.log(`  最新日期: ${data[0].date} (值: ${data[0].value})`)
      console.log(`  最近5条:`)
      data.forEach(d => console.log(`    ${d.date}: ${d.value}`))
    }
    console.log()
  }

  // 检查VIX9D指标
  console.log('--- VIX9D指标检查 ---')
  const { data: vix9dData, error: vix9dError } = await supabase
    .from('bhdashboard_indicator_data')
    .select('date, value')
    .eq('indicator_id', 'yhfinance_^VIX9D')
    .gte('date', startDate)
    .lte('date', today)
    .order('date', { ascending: false })
    .limit(10)

  if (vix9dError) {
    console.log(`❌ yhfinance_^VIX9D: 查询错误 - ${vix9dError.message}`)
  } else if (!vix9dData || vix9dData.length === 0) {
    console.log(`❌ yhfinance_^VIX9D: 无数据`)
  } else {
    console.log(`✓ yhfinance_^VIX9D:`)
    console.log(`  最新日期: ${vix9dData[0].date} (值: ${vix9dData[0].value})`)
    console.log(`  最近10条:`)
    vix9dData.forEach(d => console.log(`    ${d.date}: ${d.value}`))
  }
  console.log()

  // 检查差值指标
  console.log('--- 差值指标检查 (VIX9D-VIX) ---')
  const { data: spreadData, error: spreadError } = await supabase
    .from('bhdashboard_indicator_data')
    .select('date, value, status, status_reason')
    .eq('indicator_id', 'yhfinance_VIX9D-VIX')
    .gte('date', startDate)
    .lte('date', today)
    .order('date', { ascending: false })
    .limit(10)

  if (spreadError) {
    console.log(`❌ yhfinance_VIX9D-VIX: 查询错误 - ${spreadError.message}`)
  } else if (!spreadData || spreadData.length === 0) {
    console.log(`❌ yhfinance_VIX9D-VIX: 无数据`)
  } else {
    console.log(`✓ yhfinance_VIX9D-VIX:`)
    console.log(`  最新日期: ${spreadData[0].date} (值: ${spreadData[0].value})`)
    console.log(`  最近10条:`)
    spreadData.forEach(d => console.log(`    ${d.date}: ${d.value} [${d.status || 'normal'}]`))
  }

  console.log('\n=== 诊断完成 ===')
}

diagnoseVixData().catch(console.error)
