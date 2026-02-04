/**
 * 检查VIX9D主指标的status字段
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkVix9dStatus() {
  console.log('=== 检查 yhfinance_^VIX9D 的 status 字段 ===\n')

  // 获取VIX9D主指标的最近数据
  const { data, error } = await supabase
    .from('bhdashboard_indicator_data')
    .select('date, value, status, status_reason')
    .eq('indicator_id', 'yhfinance_^VIX9D')
    .gte('date', '2026-01-20')
    .order('date', { ascending: false })
    .limit(20)

  if (error) {
    console.error('查询错误:', error)
    return
  }

  if (!data || data.length === 0) {
    console.log('未找到数据')
    return
  }

  console.log('yhfinance_^VIX9D 最近20条记录:\n')
  console.log('日期         | 值      | Status  | 原因')
  console.log('-'.repeat(60))

  data.forEach(d => {
    const statusStr = (d.status || 'null').padEnd(8)
    const valueStr = d.value.toFixed(2).padEnd(8)
    const reason = d.status_reason || 'NULL'
    console.log(`${d.date} | ${valueStr} | ${statusStr} | ${reason}`)
  })

  // 统计报警天数
  const alertDays = data.filter(d => d.status === 'alert').length
  console.log(`\n报警天数: ${alertDays}/${data.length}`)
}

checkVix9dStatus().catch(console.error)
