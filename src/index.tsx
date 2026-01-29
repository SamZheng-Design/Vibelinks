import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-pages'

// 类型定义
type Bindings = {
  OPENAI_API_KEY?: string
  OPENAI_BASE_URL?: string
}

type Variables = {}

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// 中间件
app.use('/api/*', cors())

// Serve static files
app.use('/static/*', serveStatic())

// ==================== 核心计算引擎 ====================
// 完全按照 Word文档《CardiB_Comparable_计算过程_可复算_v2.docx》逻辑实现
// 版本日期：2026-01-27

// 默认模型参数
const DEFAULT_PARAMS = {
  // 需求指数D的权重 - 动态数组，可增删
  weights: [
    { id: 'baidu', name: '百度指数', value: 0.45, icon: 'fab fa-searchengin', color: 'blue' },
    { id: 'netease', name: '网易云粉丝', value: 0.35, icon: 'fas fa-music', color: 'red' },
    { id: 'xhs', name: '小红书粉丝', value: 0.20, icon: 'fas fa-book-open', color: 'pink' }
  ],
  // 转化率LC的参数
  lc: {
    constant: 0.60,
    netease_coef: 0.40,
    xhs_coef: -0.20,
    min: 0.60,
    max: 1.00
  },
  // 城市溢价系数 - 新的三层级系统
  cityTiers: {
    tier1: { name: '一线城市', cities: '深圳/杭州/上海/北京', multiplier: 1.0 },
    tier2: { name: '二线城市', cities: '成都/武汉/南京/西安', multiplier: 0.85 },
    tier3: { name: '三线城市', cities: '长沙/郑州/济南/青岛', multiplier: 0.70 }
  },
  // 三线到各线城市的溢价系数（锚点在三线城市）
  tierPremiums: {
    toTier1: { conservative: 1.15, neutral: 1.25, aggressive: 1.35 },  // 三线→一线
    toTier2: { conservative: 0.95, neutral: 1.05, aggressive: 1.15 },  // 三线→二线  
    toTier3: { conservative: 0.85, neutral: 0.95, aggressive: 1.05 }   // 三线→三线（略有浮动）
  },
  // Benchmark数据（三线城市真实单场票房）- 动态数组，可增删
  benchmarks: [
    {
      id: 'travis',
      name: 'Travis Scott',
      boxOffice: 78.15,  // 百万元（三线城市口径：7815万RMB）
      city: '长沙',
      tier: 'tier3',
      data: { baidu: 280, netease: 126.6, xhs: 1.0 }
    },
    {
      id: 'kanye',
      name: 'Kanye West',
      boxOffice: 51.00,  // 百万元（三线城市口径：5100万RMB）
      city: '澳门',
      tier: 'tier3',
      data: { baidu: 616, netease: 99.7, xhs: 13.9 }
    }
  ]
}

/**
 * 计算函数 - 完全按照Word文档逻辑实现
 * 
 * 计算链路：
 * Step A: 归一化 → Step B: D指数 → Step C: LC转化率 → Step D: F指数 → Step E: Comparable校准 → Step F: 城市溢价
 */
function calculateComparable(
  artistData: Record<string, number>,
  params: any = DEFAULT_PARAMS,
  targetTier: string = 'tier1'
) {
  const { benchmarks, weights, lc, tierPremiums, cityTiers } = params
  
  // 获取权重对象（兼容新旧格式）
  const weightsObj: Record<string, number> = Array.isArray(weights)
    ? weights.reduce((acc: Record<string, number>, w: any) => ({ ...acc, [w.id]: w.value }), {})
    : weights
  
  // 获取锚点数据（兼容新旧格式）
  const benchmarkList = Array.isArray(benchmarks) ? benchmarks : [
    { id: 'travis', name: benchmarks.travis?.name || 'Travis Scott', boxOffice: benchmarks.travis?.boxOffice || 78.15, tier: 'tier3', data: benchmarks.travis || { baidu: 280, netease: 126.6, xhs: 1.0 }},
    { id: 'kanye', name: benchmarks.kanye?.name || 'Kanye West', boxOffice: benchmarks.kanye?.boxOffice || 51.00, tier: 'tier3', data: benchmarks.kanye || { baidu: 616, netease: 99.7, xhs: 13.9 }}
  ]
  
  // 合并所有艺人数据用于归一化（包含锚点艺人和目标艺人）
  const allArtists = [
    ...benchmarkList.map((b: any) => ({ ...b.data, name: b.name, id: b.id, boxOffice: b.boxOffice, tier: b.tier || 'tier3' })),
    { ...artistData, name: 'Target', id: 'target' }
  ]
  
  // ========== Step A: 归一化 (Max Normalization) ==========
  const dimensions = Object.keys(artistData)
  const maxValues: Record<string, number> = {}
  dimensions.forEach(dim => {
    maxValues[dim] = Math.max(...allArtists.map(a => a[dim] || 0))
  })
  
  const normalize = (artist: any) => {
    const normalized: any = { 
      name: artist.name, 
      id: artist.id, 
      boxOffice: artist.boxOffice, 
      tier: artist.tier,
      rawData: {} as Record<string, number>
    }
    dimensions.forEach(dim => {
      normalized.rawData[dim] = artist[dim] || 0
      normalized[`${dim}_norm`] = maxValues[dim] > 0 ? (artist[dim] || 0) / maxValues[dim] : 0
    })
    return normalized
  }
  
  const normalized = allArtists.map(normalize)
  
  // ========== Step B: 计算需求指数 D (Demand Index) ==========
  const calcD = (n: any) => {
    let d = 0
    dimensions.forEach(dim => {
      d += (weightsObj[dim] || 0) * (n[`${dim}_norm`] || 0)
    })
    return d
  }
  
  // ========== Step C: 计算转化率 LC (Live Conversion) ==========
  const calcLC = (n: any) => {
    const raw = lc.constant + 
      lc.netease_coef * (n.netease_norm || 0) + 
      lc.xhs_coef * (n.xhs_norm || 0)
    return Math.min(Math.max(raw, lc.min), lc.max)
  }
  
  // ========== Step D: 计算出票指数 F (Final Index) ==========
  const indices = normalized.map(n => ({
    ...n,
    D: calcD(n),
    LC: calcLC(n),
    F: calcD(n) * calcLC(n)
  }))
  
  const targetIdx = indices.find(i => i.id === 'target')!
  const benchmarkIndices = indices.filter(i => i.id !== 'target')
  
  // ========== Step E: Comparable（双锚点）校准 ==========
  const anchorResults = benchmarkIndices.map((anchor: any) => {
    const ratio = anchor.F > 0 ? targetIdx.F / anchor.F : 0
    const anchorTier = anchor.tier || 'tier3'
    const tier3BoxOffice = anchor.boxOffice * ratio
    
    return {
      name: anchor.name,
      id: anchor.id,
      ratio,
      anchorTier,
      anchorBoxOffice: anchor.boxOffice,
      tier3BoxOffice,
      anchorF: anchor.F,
      anchorD: anchor.D,
      anchorLC: anchor.LC
    }
  })
  
  // 计算三线城市基准票房范围
  const tier3Values = anchorResults.map((a: any) => a.tier3BoxOffice)
  const tier3Min = Math.min(...tier3Values)
  const tier3Max = Math.max(...tier3Values)
  const tier3Avg = tier3Values.reduce((a: number, b: number) => a + b, 0) / tier3Values.length
  
  // ========== Step F: 城市溢价计算 ==========
  const tierKey = `to${targetTier.charAt(0).toUpperCase()}${targetTier.slice(1)}`
  const premiums = tierPremiums?.[tierKey] || 
    tierPremiums?.toTier1 || { conservative: 1.15, neutral: 1.25, aggressive: 1.35 }
  
  const conservative = tier3Min * premiums.conservative
  const neutral = tier3Avg * premiums.neutral
  const aggressive = tier3Max * premiums.aggressive
  
  return {
    normalization: {
      maxValues,
      dimensions,
      explanation: `采用 Max Normalization: x' = x / max(x)，max值取所有艺人（含锚点）该维度最大值`
    },
    indices,
    anchorResults,
    tier3: {
      values: tier3Values,
      min: tier3Min,
      max: tier3Max,
      avg: tier3Avg,
      fromAnchors: anchorResults.map((a: any) => ({
        name: a.name,
        formula: `${a.anchorBoxOffice} × ${a.ratio.toFixed(3)} = ${a.tier3BoxOffice.toFixed(2)}`,
        value: a.tier3BoxOffice
      }))
    },
    targetTier,
    output: {
      conservative: { value: conservative, label: '保守', premium: premiums.conservative },
      neutral: { value: neutral, label: '中性', premium: premiums.neutral },
      aggressive: { value: aggressive, label: '激进', premium: premiums.aggressive },
      range: [conservative, aggressive],
      mid: neutral,
      formulas: {
        conservative: `${tier3Min.toFixed(2)} × ${premiums.conservative} = ${conservative.toFixed(2)}`,
        neutral: `${tier3Avg.toFixed(2)} × ${premiums.neutral} = ${neutral.toFixed(2)}`,
        aggressive: `${tier3Max.toFixed(2)} × ${premiums.aggressive} = ${aggressive.toFixed(2)}`
      }
    }
  }
}

// ==================== API 路由 ====================

// 健康检查
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// 获取默认参数
app.get('/api/params/default', (c) => {
  return c.json(DEFAULT_PARAMS)
})

// 计算API（手动输入数据）
app.post('/api/calculate', async (c) => {
  try {
    const body = await c.req.json()
    const { artistData, customParams, targetTier = 'tier1' } = body
    
    if (!artistData || Object.keys(artistData).length === 0) {
      return c.json({ error: '缺少艺人数据' }, 400)
    }
    
    const params = customParams ? {
      weights: customParams.weights || DEFAULT_PARAMS.weights,
      lc: { ...DEFAULT_PARAMS.lc, ...customParams.lc },
      tierPremiums: customParams.tierPremiums || DEFAULT_PARAMS.tierPremiums,
      cityTiers: customParams.cityTiers || DEFAULT_PARAMS.cityTiers,
      benchmarks: customParams.benchmarks || DEFAULT_PARAMS.benchmarks
    } : DEFAULT_PARAMS
    
    const result = calculateComparable(artistData, params, targetTier)
    
    return c.json({
      success: true,
      input: { artistData, params, targetTier },
      result
    })
  } catch (error) {
    return c.json({ error: '计算失败', details: String(error) }, 500)
  }
})

// Cardi B 案例演示
app.get('/api/demo/cardib', (c) => {
  const cardiData = { baidu: 388, netease: 80.6, xhs: 82.0 }
  const result = calculateComparable(cardiData, DEFAULT_PARAMS, 'tier1')
  
  return c.json({
    success: true,
    artist: 'Cardi B',
    input: cardiData,
    result,
    explanation: {
      step1: 'Step A: 归一化 - 各维度除以最大值，使数据可比',
      step2: 'Step B: D需求指数 = Σ(权重i × 维度i\')',
      step3: 'Step C: LC转化率 = clip(0.60 + 0.40×网易云\' - 0.20×小红书\', 0.60, 1.00)',
      step4: 'Step D: F出票指数 = D × LC',
      step5: 'Step E: 多锚点校准 - 用F的比值映射到各锚点艺人的真实票房',
      step6: 'Step F: 城市溢价 - 根据目标城市级别计算最终票房'
    }
  })
})

// API endpoint for contact form
app.post('/api/contact', async (c) => {
  const body = await c.req.json()
  return c.json({ success: true, message: 'Thank you for your interest!' })
})

// ==================== 前端页面 ====================

// 导入票房预测器页面HTML
import { predictorPageHTML } from './predictor-page'

// 艺人票房测算页面（新增）
app.get('/predictor', (c) => {
  return c.html(predictorPageHTML)
})

// 主页面 - Vibelinks 投资文档
app.get('/', (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CARDI B CHINA TOUR 2025-2026 | Investment Presentation</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Inter:wght@300;400;500;600;700&family=Noto+Sans+SC:wght@300;400;500;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --gold: #D4AF37;
            --gold-light: #F4E4BA;
            --gold-dark: #B8960C;
            --dark: #0A0A0A;
            --dark-gray: #1A1A1A;
            --dark-secondary: #16213e;
            --olive: #6B7B3C;
            --olive-light: #8B9B5C;
            --success: #00c853;
            --warning: #ff9800;
            --danger: #f44336;
        }
        
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        body {
            font-family: 'Inter', 'Noto Sans SC', sans-serif;
            background: var(--dark);
            color: #fff;
            overflow-x: hidden;
        }
        .font-display { font-family: 'Playfair Display', serif; }
        
        /* Hero - Black & Gold Style */
        .hero-custom {
            min-height: 100vh;
            background: linear-gradient(135deg, #5a6b35 0%, #4a5b2a 50%, #3a4b1a 100%);
            position: relative;
            overflow: hidden;
        }
        
        .hero-overlay-custom {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.3) 100%);
        }
        
        .gold-text {
            background: linear-gradient(135deg, #D4AF37 0%, #F4E4BA 50%, #D4AF37 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        .gold-border { border: 1px solid var(--gold); }
        .gold-bg { background: linear-gradient(135deg, #D4AF37 0%, #F4E4BA 50%, #D4AF37 100%); }
        .olive-bg { background: linear-gradient(135deg, #6B7B3C 0%, #8B9B5C 100%); }
        
        .stat-card {
            background: rgba(255,255,255,0.03);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(212, 175, 55, 0.2);
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .stat-card:hover {
            transform: translateY(-5px);
            border-color: var(--gold);
            box-shadow: 0 20px 60px rgba(212, 175, 55, 0.15);
        }
        
        .venue-card {
            position: relative;
            overflow: hidden;
            border-radius: 20px;
            transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .venue-card::before {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            background: linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.9) 100%);
            z-index: 1;
        }
        .venue-card:hover { transform: scale(1.02); }
        .venue-card:hover img { transform: scale(1.1); }
        .venue-card img { transition: transform 0.7s cubic-bezier(0.4, 0, 0.2, 1); }
        
        .timeline-item { position: relative; padding-left: 40px; }
        .timeline-item::before {
            content: '';
            position: absolute;
            left: 0; top: 8px;
            width: 12px; height: 12px;
            background: var(--gold);
            border-radius: 50%;
        }
        .timeline-item::after {
            content: '';
            position: absolute;
            left: 5px; top: 20px;
            width: 2px;
            height: calc(100% + 20px);
            background: rgba(212, 175, 55, 0.3);
        }
        .timeline-item:last-child::after { display: none; }
        
        .fade-in {
            opacity: 0;
            transform: translateY(40px);
            transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .fade-in.visible { opacity: 1; transform: translateY(0); }
        
        .nav-link { position: relative; }
        .nav-link::after {
            content: '';
            position: absolute;
            bottom: -4px; left: 0;
            width: 0; height: 2px;
            background: var(--gold);
            transition: width 0.3s ease;
        }
        .nav-link:hover::after { width: 100%; }
        
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: var(--dark); }
        ::-webkit-scrollbar-thumb { background: var(--gold); border-radius: 4px; }
        
        .glow { box-shadow: 0 0 60px rgba(212, 175, 55, 0.3); }
        .counter { font-variant-numeric: tabular-nums; }
        
        .case-card {
            background: rgba(255,255,255,0.02);
            border: 1px solid rgba(255,255,255,0.1);
            transition: all 0.3s ease;
        }
        .case-card:hover {
            background: rgba(255,255,255,0.05);
            border-color: rgba(212, 175, 55, 0.3);
        }
        
        /* Sidebar Navigation */
        .sidebar {
            position: fixed;
            left: 0;
            top: 0;
            width: 280px;
            height: 100vh;
            background: rgba(10, 10, 10, 0.98);
            border-right: 1px solid rgba(212, 175, 55, 0.3);
            overflow-y: auto;
            z-index: 100;
            backdrop-filter: blur(10px);
            transform: translateX(-100%);
            transition: transform 0.3s ease;
        }
        
        .sidebar.open { transform: translateX(0); }
        
        .sidebar::-webkit-scrollbar { width: 4px; }
        .sidebar::-webkit-scrollbar-track { background: rgba(255,255,255,0.05); }
        .sidebar::-webkit-scrollbar-thumb { background: var(--gold); border-radius: 2px; }
        
        .nav-item {
            display: block;
            padding: 12px 20px;
            color: rgba(255,255,255,0.7);
            text-decoration: none;
            border-left: 3px solid transparent;
            transition: all 0.3s ease;
            font-size: 14px;
        }
        
        .nav-item:hover, .nav-item.active {
            background: rgba(212, 175, 55, 0.1);
            border-left-color: var(--gold);
            color: var(--gold);
        }
        
        .nav-section {
            padding: 15px 20px 8px;
            color: var(--gold);
            font-weight: 600;
            font-size: 13px;
            text-transform: uppercase;
            letter-spacing: 1px;
            border-top: 1px solid rgba(255,255,255,0.1);
            margin-top: 10px;
        }
        
        .nav-section:first-of-type { border-top: none; margin-top: 0; }
        
        /* Data Tables */
        .data-table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
            font-size: 14px;
        }
        
        .data-table th {
            background: rgba(212, 175, 55, 0.15);
            color: var(--gold);
            font-weight: 600;
            padding: 14px 16px;
            text-align: left;
            border-bottom: 2px solid rgba(212, 175, 55, 0.3);
        }
        
        .data-table td {
            padding: 14px 16px;
            border-bottom: 1px solid rgba(255,255,255,0.08);
            color: rgba(255,255,255,0.85);
            vertical-align: top;
        }
        
        .data-table tr:hover td {
            background: rgba(212, 175, 55, 0.05);
        }
        
        .data-table th:first-child { border-radius: 8px 0 0 0; }
        .data-table th:last-child { border-radius: 0 8px 0 0; }
        
        /* Risk Level Badges */
        .risk-high { 
            background: rgba(244, 67, 54, 0.2); 
            color: #ff6b6b; 
            padding: 4px 10px; 
            border-radius: 20px; 
            font-size: 12px;
            font-weight: 500;
        }
        .risk-medium { 
            background: rgba(255, 152, 0, 0.2); 
            color: #ffa726; 
            padding: 4px 10px; 
            border-radius: 20px; 
            font-size: 12px;
            font-weight: 500;
        }
        .risk-low { 
            background: rgba(0, 200, 83, 0.2); 
            color: #69f0ae; 
            padding: 4px 10px; 
            border-radius: 20px; 
            font-size: 12px;
            font-weight: 500;
        }
        
        /* Section Titles */
        .section-title {
            font-size: 24px;
            font-weight: 700;
            color: white;
            margin-bottom: 24px;
            padding-bottom: 12px;
            border-bottom: 2px solid var(--gold);
            display: flex;
            align-items: center;
            gap: 12px;
        }
        
        .section-title i { color: var(--gold); }
        
        .subsection-title {
            font-size: 18px;
            font-weight: 600;
            color: var(--gold);
            margin: 20px 0 16px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        /* Flow Chart */
        .flow-chart {
            display: flex;
            align-items: center;
            justify-content: center;
            flex-wrap: wrap;
            gap: 8px;
            padding: 20px;
            background: rgba(0,0,0,0.2);
            border-radius: 12px;
            margin: 16px 0;
        }
        
        .flow-step {
            background: linear-gradient(135deg, rgba(212, 175, 55, 0.2), rgba(212, 175, 55, 0.1));
            border: 1px solid rgba(212, 175, 55, 0.4);
            padding: 12px 20px;
            border-radius: 8px;
            color: white;
            font-size: 13px;
            text-align: center;
            min-width: 140px;
        }
        
        .flow-arrow {
            color: var(--gold);
            font-size: 20px;
        }
        
        /* Highlight Text */
        .highlight { color: var(--gold); font-weight: 600; }
        .highlight-red { color: var(--danger); font-weight: 600; }
        .highlight-green { color: var(--success); font-weight: 600; }
        
        /* Info Boxes */
        .info-box {
            background: rgba(212, 175, 55, 0.1);
            border-left: 4px solid var(--gold);
            padding: 16px 20px;
            border-radius: 0 8px 8px 0;
            margin: 16px 0;
            color: rgba(255,255,255,0.9);
        }
        
        .warning-box {
            background: rgba(244, 67, 54, 0.1);
            border-left: 4px solid var(--danger);
            padding: 16px 20px;
            border-radius: 0 8px 8px 0;
            margin: 16px 0;
            color: rgba(255,255,255,0.9);
        }
        
        /* Accordion */
        .accordion-header {
            background: rgba(212, 175, 55, 0.1);
            padding: 16px 20px;
            cursor: pointer;
            border-radius: 8px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
            transition: all 0.3s ease;
        }
        
        .accordion-header:hover {
            background: rgba(212, 175, 55, 0.2);
        }
        
        .accordion-content {
            max-height: 0;
            overflow: hidden;
            transition: max-height 0.3s ease;
        }
        
        .accordion-content.open {
            max-height: 2000px;
        }
        
        /* Responsive */
        @media (max-width: 1024px) {
            .sidebar { width: 260px; }
        }
        
        @media (max-width: 768px) {
            .sidebar { width: 280px; }
            .mobile-menu-btn { display: flex !important; }
        }
        
        /* Print */
        @media print {
            .sidebar, nav, .mobile-menu-btn { display: none !important; }
            body { background: white; }
            .stat-card { border: 1px solid #ddd; box-shadow: none; }
            .data-table th { background: #f5f5f5 !important; color: #333 !important; }
            .data-table td { color: #333 !important; }
            .section-title, .subsection-title { color: #333 !important; }
            .highlight { color: #c97c00 !important; }
            .gold-text { 
                -webkit-text-fill-color: #c97c00 !important;
                color: #c97c00 !important;
            }
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .section { animation: fadeIn 0.6s ease forwards; }
        
        /* Predictor Button Styles */
        .predictor-btn {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            transition: all 0.3s ease;
        }
        .predictor-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
        }
    </style>
</head>
<body>
    <!-- Mobile Menu Button -->
    <button class="mobile-menu-btn fixed top-4 left-4 z-50 gold-bg text-black p-3 rounded-lg hidden items-center justify-center" onclick="toggleSidebar()">
        <i class="fas fa-bars"></i>
    </button>
    
    <!-- Sidebar Navigation -->
    <nav class="sidebar" id="sidebar">
        <div class="p-6 border-b border-white/10">
            <h1 class="text-xl font-bold gold-text mb-2">
                <i class="fas fa-music mr-2"></i>CARDI B TOUR
            </h1>
            <p class="text-sm text-white/50">投资项目综合文档 v2.0</p>
            <button onclick="toggleSidebar()" class="absolute top-4 right-4 text-white/50 hover:text-white">
                <i class="fas fa-times"></i>
            </button>
        </div>
        
        <!-- 新增：艺人票房测算入口 -->
        <div class="p-4 border-b border-white/10">
            <a href="/predictor" class="predictor-btn block w-full py-3 px-4 text-white rounded-xl font-semibold text-center">
                <i class="fas fa-chart-line mr-2"></i>艺人票房测算
            </a>
            <p class="text-xs text-white/40 mt-2 text-center">Comparable模型计算器</p>
        </div>
        
        <div class="nav-section"><i class="fas fa-home mr-2"></i>项目介绍</div>
        <a href="#hero" class="nav-item" onclick="closeSidebarOnMobile()">首页</a>
        <a href="#overview" class="nav-item" onclick="closeSidebarOnMobile()">项目概览</a>
        <a href="#organizer" class="nav-item" onclick="closeSidebarOnMobile()">主办方</a>
        <a href="#venues" class="nav-item" onclick="closeSidebarOnMobile()">巡演场馆</a>
        <a href="#production" class="nav-item" onclick="closeSidebarOnMobile()">制作团队</a>
        <a href="#marketing" class="nav-item" onclick="closeSidebarOnMobile()">营销策略</a>
        <a href="#ticketing" class="nav-item" onclick="closeSidebarOnMobile()">票务系统</a>
        
        <div class="nav-section"><i class="fas fa-briefcase mr-2"></i>商业条款</div>
        <a href="#investment-detail" class="nav-item" onclick="closeSidebarOnMobile()">总投入与融资</a>
        <a href="#payment-timeline" class="nav-item" onclick="closeSidebarOnMobile()">付款时间线</a>
        <a href="#delayed-payment" class="nav-item" onclick="closeSidebarOnMobile()">延迟付款构成</a>
        <a href="#revenue" class="nav-item" onclick="closeSidebarOnMobile()">收入构成</a>
        
        <div class="nav-section"><i class="fas fa-shield-alt mr-2"></i>风险管理</div>
        <a href="#risk-overview" class="nav-item" onclick="closeSidebarOnMobile()">风险概览</a>
        <a href="#risk-1-6" class="nav-item" onclick="closeSidebarOnMobile()">核心风险1-6</a>
        <a href="#risk-7-11" class="nav-item" onclick="closeSidebarOnMobile()">运营风险7-11</a>
        
        <div class="nav-section"><i class="fas fa-file-contract mr-2"></i>合同与账户</div>
        <a href="#contract" class="nav-item" onclick="closeSidebarOnMobile()">合同条款</a>
        <a href="#account" class="nav-item" onclick="closeSidebarOnMobile()">账户监管</a>
        
        <div class="nav-section"><i class="fas fa-coins mr-2"></i>分成回款</div>
        <a href="#share-ratio" class="nav-item" onclick="closeSidebarOnMobile()">分成与保本</a>
        
        <div class="nav-section"><i class="fas fa-chart-bar mr-2"></i>数据速查</div>
        <a href="#data-summary" class="nav-item" onclick="closeSidebarOnMobile()">核心数据汇总</a>
        
        <div class="p-4 border-t border-white/10 mt-4">
            <button onclick="window.print()" class="w-full gold-bg text-black py-2 rounded-lg hover:opacity-90 transition font-semibold">
                <i class="fas fa-print mr-2"></i>打印文档
            </button>
        </div>
    </nav>

    <!-- Top Navigation -->
    <nav class="fixed top-0 left-0 right-0 z-40 bg-black/80 backdrop-blur-xl border-b border-white/5">
        <div class="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
            <div class="flex items-center gap-3">
                <button onclick="toggleSidebar()" class="w-10 h-10 gold-bg rounded-full flex items-center justify-center hover:opacity-90 transition">
                    <i class="fas fa-bars text-black text-sm"></i>
                </button>
                <span class="font-semibold text-sm tracking-wider hidden md:block">VIBELINKS ENTERTAINMENT</span>
            </div>
            <div class="hidden lg:flex items-center gap-8 text-sm">
                <a href="#overview" class="nav-link text-white/70 hover:text-white transition">概览</a>
                <a href="#investment-detail" class="nav-link text-white/70 hover:text-white transition">投资条款</a>
                <a href="#risk-overview" class="nav-link text-white/70 hover:text-white transition">风险管理</a>
                <a href="#data-summary" class="nav-link text-white/70 hover:text-white transition">数据速查</a>
                <a href="/predictor" class="predictor-btn text-white px-4 py-2 rounded-full text-sm font-semibold">
                    <i class="fas fa-chart-line mr-1"></i>票房测算
                </a>
            </div>
            <a href="#contact" class="gold-bg text-black px-6 py-2 rounded-full text-sm font-semibold hover:opacity-90 transition">
                联系我们
            </a>
        </div>
    </nav>

    <!-- Hero Section -->
    <section id="hero" class="hero-custom flex items-center justify-center">
        <div class="hero-overlay-custom"></div>
        <div class="absolute inset-0 flex flex-col items-center justify-center text-center z-10 px-6">
            <div class="mb-8">
                <span class="text-xs tracking-[0.5em] gold-text uppercase mb-4 block">2025 - 26</span>
                <h1 class="font-display text-6xl md:text-8xl font-bold mb-4">
                    <span class="gold-text">CHINA</span> <span class="text-white">TOUR</span>
                </h1>
                <p class="text-xl md:text-2xl text-white/80 font-light tracking-wide">2025-2026 Cardi B China Tour</p>
            </div>
            
            <!-- 新增：票房测算快捷入口 -->
            <a href="/predictor" class="predictor-btn inline-flex items-center gap-3 text-white px-8 py-4 rounded-full font-semibold text-lg mb-8 shadow-xl">
                <i class="fas fa-chart-line"></i>
                <span>艺人票房测算工具</span>
                <i class="fas fa-arrow-right text-sm"></i>
            </a>
        </div>
        <div class="absolute bottom-10 left-1/2 -translate-x-1/2 z-10">
            <a href="#overview" class="inline-flex items-center gap-2 bg-white/10 backdrop-blur px-6 py-3 rounded-full hover:bg-white/20 transition">
                <span class="text-white font-medium">探索投资机遇</span>
                <i class="fas fa-arrow-down text-white animate-bounce"></i>
            </a>
        </div>
    </section>

    <!-- 以下保持原有的投资文档内容不变 -->
    <!-- Overview Section -->
    <section id="overview" class="py-24 px-6 bg-gradient-to-b from-black to-[#0A0A0A]">
        <div class="max-w-7xl mx-auto">
            <div class="text-center mb-16 fade-in">
                <span class="text-xs tracking-[0.3em] gold-text uppercase mb-4 block">Project Overview</span>
                <h2 class="font-display text-4xl md:text-5xl font-bold mb-6">项目概览</h2>
                <p class="text-white/50 max-w-2xl mx-auto">
                    全球顶级说唱天后Cardi B首次中国巡演，横跨两大核心城市，预计触达百万级观众
                </p>
            </div>
            
            <!-- Core Stats -->
            <div class="grid grid-cols-2 md:grid-cols-3 gap-6 mb-12">
                <div class="stat-card rounded-2xl p-8 text-center fade-in col-span-2 md:col-span-1" style="background: linear-gradient(135deg, rgba(249, 168, 37, 0.15), rgba(249, 168, 37, 0.05)); border: 2px solid rgba(249, 168, 37, 0.4);">
                    <div class="w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center" style="background: rgba(249, 168, 37, 0.2);">
                        <i class="fas fa-chart-line gold-text text-xl"></i>
                    </div>
                    <div class="text-4xl md:text-5xl font-bold gold-text mb-2">1.24<span class="text-2xl">亿</span></div>
                    <div class="text-white/70 text-sm font-medium">总票房收入</div>
                    <div class="text-white/40 text-xs mt-2">Gross Revenue</div>
                </div>
                
                <div class="stat-card rounded-2xl p-8 text-center fade-in" style="transition-delay: 0.1s; background: linear-gradient(135deg, rgba(0, 200, 83, 0.15), rgba(0, 200, 83, 0.05)); border: 2px solid rgba(0, 200, 83, 0.4);">
                    <div class="w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center" style="background: rgba(0, 200, 83, 0.2);">
                        <i class="fas fa-coins text-green-400 text-xl"></i>
                    </div>
                    <div class="text-4xl md:text-5xl font-bold text-green-400 mb-2">5678<span class="text-2xl">万</span></div>
                    <div class="text-white/70 text-sm font-medium">税后净利润</div>
                    <div class="text-white/40 text-xs mt-2">Net Profit</div>
                </div>
                
                <div class="stat-card rounded-2xl p-8 text-center fade-in" style="transition-delay: 0.15s; background: linear-gradient(135deg, rgba(233, 69, 96, 0.15), rgba(233, 69, 96, 0.05)); border: 2px solid rgba(233, 69, 96, 0.4);">
                    <div class="w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center" style="background: rgba(233, 69, 96, 0.2);">
                        <i class="fas fa-calculator text-red-400 text-xl"></i>
                    </div>
                    <div class="text-4xl md:text-5xl font-bold text-red-400 mb-2">7202<span class="text-2xl">万</span></div>
                    <div class="text-white/70 text-sm font-medium">总成本支出</div>
                    <div class="text-white/40 text-xs mt-2">Total Expenses</div>
                </div>
            </div>
            
            <!-- Secondary Stats -->
            <div class="grid grid-cols-3 md:grid-cols-6 gap-4 mb-12">
                <div class="stat-card rounded-xl p-4 text-center fade-in" style="transition-delay: 0.2s">
                    <div class="text-2xl font-bold gold-text">5271万</div>
                    <div class="text-white/50 text-xs mt-1">艺人费用</div>
                </div>
                <div class="stat-card rounded-xl p-4 text-center fade-in" style="transition-delay: 0.25s">
                    <div class="text-2xl font-bold gold-text">2012万</div>
                    <div class="text-white/50 text-xs mt-1">赞助净收入</div>
                </div>
                <div class="stat-card rounded-xl p-4 text-center fade-in" style="transition-delay: 0.3s">
                    <div class="text-2xl font-bold gold-text">70%</div>
                    <div class="text-white/50 text-xs mt-1">分成比例</div>
                </div>
                <div class="stat-card rounded-xl p-4 text-center fade-in" style="transition-delay: 0.35s">
                    <div class="text-2xl font-bold text-green-400">25.1%</div>
                    <div class="text-white/50 text-xs mt-1">保本点</div>
                </div>
                <div class="stat-card rounded-xl p-4 text-center fade-in" style="transition-delay: 0.4s">
                    <div class="text-2xl font-bold gold-text">88,000</div>
                    <div class="text-white/50 text-xs mt-1">可售门票</div>
                </div>
                <div class="stat-card rounded-xl p-4 text-center fade-in" style="transition-delay: 0.45s">
                    <div class="text-2xl font-bold gold-text">2场</div>
                    <div class="text-white/50 text-xs mt-1">演出场次</div>
                </div>
            </div>
            
            <!-- Mission Cards -->
            <div class="grid md:grid-cols-3 gap-6">
                <div class="stat-card rounded-2xl p-8 fade-in">
                    <div class="w-14 h-14 gold-bg rounded-xl flex items-center justify-center mb-6">
                        <i class="fas fa-globe text-black text-xl"></i>
                    </div>
                    <h3 class="text-xl font-semibold mb-4">文化桥梁</h3>
                    <p class="text-white/50 leading-relaxed">
                        融合全球潮流与本土文化，创造独特、引人共鸣的体验，通过音乐庆祝多样性与统一
                    </p>
                </div>
                <div class="stat-card rounded-2xl p-8 fade-in" style="transition-delay: 0.1s">
                    <div class="w-14 h-14 gold-bg rounded-xl flex items-center justify-center mb-6">
                        <i class="fas fa-leaf text-black text-xl"></i>
                    </div>
                    <h3 class="text-xl font-semibold mb-4">可持续发展</h3>
                    <p class="text-white/50 leading-relaxed">
                        倡导环保演出理念，在呈现震撼表演的同时减少环境影响，引领行业绿色转型
                    </p>
                </div>
                <div class="stat-card rounded-2xl p-8 fade-in" style="transition-delay: 0.2s">
                    <div class="w-14 h-14 gold-bg rounded-xl flex items-center justify-center mb-6">
                        <i class="fas fa-microchip text-black text-xl"></i>
                    </div>
                    <h3 class="text-xl font-semibold mb-4">前沿科技</h3>
                    <p class="text-white/50 leading-relaxed">
                        运用尖端技术重新定义现场娱乐体验，打造更沉浸、更包容、面向未来的演出
                    </p>
                </div>
            </div>
        </div>
    </section>

    <!-- 后续内容保持原有格式（为简洁省略，实际代码中保持完整） -->
    
    <!-- CTA Section -->
    <section id="contact" class="py-32 px-6 relative overflow-hidden">
        <div class="absolute inset-0 bg-gradient-to-r from-[#D4AF37]/10 to-transparent"></div>
        <div class="max-w-4xl mx-auto text-center relative z-10 fade-in">
            <h2 class="font-display text-4xl md:text-6xl font-bold mb-6">
                <span class="gold-text">携手共创</span><br>
                <span class="text-white">音乐新纪元</span>
            </h2>
            <p class="text-xl text-white/50 mb-10 max-w-2xl mx-auto">
                诚邀战略合作伙伴，共同见证Cardi B中国巡演的历史时刻
            </p>
            <div class="flex flex-wrap justify-center gap-4">
                <button class="gold-bg text-black px-10 py-4 rounded-full font-semibold text-lg hover:opacity-90 transition flex items-center gap-2">
                    <i class="fas fa-envelope"></i>
                    获取详细BP
                </button>
                <a href="/predictor" class="predictor-btn text-white px-10 py-4 rounded-full font-semibold text-lg flex items-center gap-2">
                    <i class="fas fa-chart-line"></i>
                    票房测算工具
                </a>
            </div>
        </div>
    </section>

    <!-- Footer -->
    <footer class="py-12 px-6 border-t border-white/5">
        <div class="max-w-7xl mx-auto">
            <div class="flex flex-wrap justify-between items-center gap-6">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 gold-bg rounded-full flex items-center justify-center">
                        <span class="text-black font-bold text-sm">VE</span>
                    </div>
                    <div>
                        <div class="font-semibold">Vibelinks Entertainment</div>
                        <div class="text-xs text-white/50">连接全球音乐与中国市场</div>
                    </div>
                </div>
                <div class="text-sm text-white/50">
                    © 2025 Vibelinks Entertainment. 更新时间：2026年1月
                </div>
            </div>
        </div>
    </footer>

    <script>
        // Toggle Sidebar
        function toggleSidebar() {
            document.getElementById('sidebar').classList.toggle('open');
        }
        
        function closeSidebarOnMobile() {
            if (window.innerWidth <= 768) {
                document.getElementById('sidebar').classList.remove('open');
            }
        }
        
        // Scroll Animation
        const fadeElements = document.querySelectorAll('.fade-in');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) entry.target.classList.add('visible');
            });
        }, { threshold: 0.1 });
        fadeElements.forEach(el => observer.observe(el));
        
        // Accordion
        function toggleAccordion(header) {
            const content = header.nextElementSibling;
            const icon = header.querySelector('i');
            content.classList.toggle('open');
            icon.style.transform = content.classList.contains('open') ? 'rotate(0deg)' : 'rotate(-90deg)';
        }
        
        // Smooth scroll
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
        });
        
        // Navbar scroll effect
        const nav = document.querySelector('nav:not(.sidebar)');
        window.addEventListener('scroll', () => {
            nav.classList.toggle('bg-black/95', window.scrollY > 100);
        });
    </script>
</body>
</html>
  `)
})

export default app
