/**
 * 检查差值指标的元数据是否存在
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkSpreadIndicators() {
  console.log('=== 检查差值指标元数据 ===\n')

  const spreadIndicators = [
    'yhfinance_VIX-VIX3M',
    'yhfinance_VIX9D-VIX'
  ]

  for (const indicatorId of spreadIndicators) {
    const { data, error } = await supabase
      .from('bhdashboard_indicators')
      .select('*')
      .eq('id', indicatorId)
      .single()

    if (error) {
      console.log(`❌ ${indicatorId}: 不存在或查询错误`)
      console.log(`   错误: ${error.message}\n`)
    } else if (data) {
      console.log(`✓ ${indicatorId}:`)
      console.log(`   中文名: ${data.indicator_cn}`)
      console.log(`   英文名: ${data.indicator_en}`)
      console.log(`   显示名: ${data.display_name}`)
      console.log(`   Factor: ${data.factor}`)
      console.log(`   Tier: ${data.tier}`)
      console.log(`   激活状态: ${data.is_active}\n`)
    }
  }
}

checkSpreadIndicators().catch(console.error)
