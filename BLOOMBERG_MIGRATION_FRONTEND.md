# 前端 Bloomberg 指标迁移说明

**执行日期**: 2026-01-28
**关联后端迁移**: `BH_Dashboard/docs/BLOOMBERG_INDICATORS_MIGRATION.md`

---

## 📋 修改总结

由于后端替换了5个指标为Bloomberg数据源，前端需要同步更新VIX组合指标的数据源配置。

### 背景说明

前端Dashboard采用**动态设计**，大部分指标信息从Supabase数据库动态读取，无需硬编码。但VIX组合指标（`yhfinance_^VIX3M` 和 `yhfinance_^VIX9D`）的对比图需要指定基础VIX数据的来源优先级，因此需要更新配置。

---

## ✅ 已完成的修改

### 修改文件：`lib/types.ts`

**位置**: 第160-170行

**修改内容**: 更新 `COMBINED_INDICATOR_CONFIG` 中VIX组合指标的数据源优先级

```typescript
// 修改前
'yhfinance_^VIX3M': {
  baseIndicators: ['Wind_G0003892', 'FRED_VIXCLS'],
  spreadIndicator: 'yhfinance_VIX-VIX3M',
  labels: { line1: 'VIX', line2: 'VIX3M', spread: 'VIX-VIX3M' }
},
'yhfinance_^VIX9D': {
  baseIndicators: ['Wind_G0003892', 'FRED_VIXCLS'],
  spreadIndicator: 'yhfinance_VIX9D-VIX',
  labels: { line1: 'VIX', line2: 'VIX9D', spread: 'VIX9D-VIX' }
}

// 修改后
'yhfinance_^VIX3M': {
  baseIndicators: ['bbg_VIX_Index', 'Wind_G0003892', 'FRED_VIXCLS'],  // 优先Bloomberg，次选Wind，最后FRED
  spreadIndicator: 'yhfinance_VIX-VIX3M',
  labels: { line1: 'VIX', line2: 'VIX3M', spread: 'VIX-VIX3M' }
},
'yhfinance_^VIX9D': {
  baseIndicators: ['bbg_VIX_Index', 'Wind_G0003892', 'FRED_VIXCLS'],  // 优先Bloomberg，次选Wind，最后FRED
  spreadIndicator: 'yhfinance_VIX9D-VIX',
  labels: { line1: 'VIX', line2: 'VIX9D', spread: 'VIX9D-VIX' }
}
```

**影响范围**:
- VIX vs VIX3M 对比图
- VIX9D vs VIX 对比图

**工作原理**:
当用户点击 `yhfinance_^VIX3M` 或 `yhfinance_^VIX9D` 指标查看详情时，前端会：
1. 按优先级尝试从数据库获取VIX数据：`bbg_VIX_Index` → `Wind_G0003892` → `FRED_VIXCLS`
2. 使用找到的第一个有效数据源绘制VIX基线
3. 同时显示VIX差值图（来自衍生指标数据）

---

## 🔍 其他指标的自动更新

以下指标**无需修改前端代码**，因为前端动态从数据库读取：

| 新指标 | 替代指标 | 自动更新机制 |
|--------|---------|-------------|
| `bbg_USGGT10Y_Index` | `Wind_G0005428` | 从 `bhdashboard_indicators` 表动态读取 |
| `bbg_USGG10YR_Index` | `Wind_G0000891` | 从 `bhdashboard_indicators` 表动态读取 |
| `bbg_USGG2YR_Index` | `Wind_G0000887` | 从 `bhdashboard_indicators` 表动态读取 |
| `bbg_USGGBE10_Index` | `FRED_T10YIE` | 从 `bhdashboard_indicators` 表动态读取 |
| `bbg_VIX_Index` | `Wind_G0003892` | 从 `bhdashboard_indicators` 表动态读取 |

**原理**:
- 前端通过 `/api/indicators` 接口从数据库获取 `is_active = true` 的指标列表
- 后端SQL已将旧指标设置为 `is_active = false`，新指标设置为 `is_active = true`
- 前端热力图和详情页会自动显示新的活跃指标

---

## 🚀 验证步骤

### 1. 本地开发验证

```bash
# 启动开发服务器
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)，检查：

- [ ] D因子（利率指标）区域显示新的Bloomberg指标
- [ ] V因子（波动率指标）区域显示 `bbg_VIX_Index`
- [ ] 点击 `yhfinance_^VIX3M` 或 `yhfinance_^VIX9D`，对比图正确显示VIX数据
- [ ] 旧指标（`Wind_G0005428`等）不再出现在热力图中

### 2. API接口验证

```bash
# 测试指标列表接口
curl http://localhost:3000/api/indicators

# 测试新指标数据接口
curl http://localhost:3000/api/data/bbg_VIX_Index?days=30

# 测试VIX组合指标接口
curl http://localhost:3000/api/data/combined?indicator_id=yhfinance_^VIX3M&days=90
```

### 3. 生产部署验证

如果使用Vercel部署：

1. 推送代码到GitHub
2. Vercel自动触发部署
3. 访问生产URL验证功能

---

## 📝 注意事项

1. **向后兼容**: 配置修改保持向后兼容，即使Bloomberg数据不存在，前端会自动回退到Wind或FRED数据源
2. **无需重启**: 指标列表的更新是动态的，后端数据库更新后前端刷新即可看到
3. **缓存清理**: 如果浏览器显示旧数据，尝试硬刷新（Ctrl+Shift+R 或 Cmd+Shift+R）

---

## 🔧 回滚方案

如需回滚前端修改：

```typescript
// 在 lib/types.ts 第162和167行，移除 bbg_VIX_Index
'yhfinance_^VIX3M': {
  baseIndicators: ['Wind_G0003892', 'FRED_VIXCLS'],  // 恢复原配置
  ...
},
'yhfinance_^VIX9D': {
  baseIndicators: ['Wind_G0003892', 'FRED_VIXCLS'],  // 恢复原配置
  ...
}
```

然后重新部署前端应用。

---

## 🎯 相关文档

- **后端迁移文档**: `../BH_Dashboard/docs/BLOOMBERG_INDICATORS_MIGRATION.md`
- **前端项目说明**: `README.md`
- **类型定义**: `lib/types.ts`

---

**最后更新**: 2026-01-28
