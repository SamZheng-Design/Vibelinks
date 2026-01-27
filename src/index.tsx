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

// 静态文件服务
app.use('/static/*', serveStatic())

// ==================== 核心计算引擎 ====================

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
      boxOffice: 78.15,  // 百万元
      city: '长沙',
      tier: 'tier3',
      data: { baidu: 280, netease: 126.6, xhs: 1.0 }
    },
    {
      id: 'kanye',
      name: 'Kanye West',
      boxOffice: 51.00,  // 百万元
      city: '澳门',
      tier: 'tier3',
      data: { baidu: 616, netease: 99.7, xhs: 13.9 }
    }
  ]
}

// 计算函数 - 支持动态参数和城市级别
function calculateComparable(
  artistData: Record<string, number>,
  params: any = DEFAULT_PARAMS,
  targetTier: string = 'tier1'  // 目标城市级别
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
  
  // 合并所有艺人数据用于归一化
  const allArtists = [
    ...benchmarkList.map((b: any) => ({ ...b.data, name: b.name, id: b.id, boxOffice: b.boxOffice, tier: b.tier || 'tier3' })),
    { ...artistData, name: 'Target', id: 'target' }
  ]
  
  // Step A: 归一化 (Max Normalization) - 动态处理所有维度
  const dimensions = Object.keys(artistData)
  const maxValues: Record<string, number> = {}
  dimensions.forEach(dim => {
    maxValues[dim] = Math.max(...allArtists.map(a => a[dim] || 0))
  })
  
  const normalize = (artist: any) => {
    const normalized: any = { name: artist.name, id: artist.id, boxOffice: artist.boxOffice, tier: artist.tier }
    dimensions.forEach(dim => {
      normalized[`${dim}_norm`] = maxValues[dim] > 0 ? (artist[dim] || 0) / maxValues[dim] : 0
    })
    return normalized
  }
  
  const normalized = allArtists.map(normalize)
  
  // Step B: 计算需求指数 D - 动态权重
  const calcD = (n: any) => {
    let d = 0
    dimensions.forEach(dim => {
      d += (weightsObj[dim] || 0) * (n[`${dim}_norm`] || 0)
    })
    return d
  }
  
  // Step C: 计算转化率 LC
  const calcLC = (n: any) => {
    const raw = lc.constant + 
      lc.netease_coef * (n.netease_norm || 0) + 
      lc.xhs_coef * (n.xhs_norm || 0)
    return Math.min(Math.max(raw, lc.min), lc.max)
  }
  
  // Step D: 计算出票指数 F
  const indices = normalized.map(n => ({
    ...n,
    D: calcD(n),
    LC: calcLC(n),
    F: calcD(n) * calcLC(n)
  }))
  
  const targetIdx = indices.find(i => i.id === 'target')!
  const benchmarkIndices = indices.filter(i => i.id !== 'target')
  
  // 城市级别乘数配置（用于将不同级别城市票房标准化到基准）
  const tierMultipliers = cityTiers || {
    tier1: { multiplier: 1.0 },
    tier2: { multiplier: 0.85 },
    tier3: { multiplier: 0.70 }
  }
  
  // 获取目标城市的乘数
  const targetMultiplier = tierMultipliers[targetTier]?.multiplier || 1.0
  
  // Step E: 多锚点校准 - 支持多个锚点，且每个锚点可以有不同的城市级别
  // 计算思路：
  // 1. 先用 F 比值计算出锚点城市级别的票房
  // 2. 再根据锚点城市与目标城市的级别差异计算溢价/折价
  const anchorResults = benchmarkIndices.map((anchor: any) => {
    const ratio = anchor.F > 0 ? targetIdx.F / anchor.F : 0
    const anchorTier = anchor.tier || 'tier3'
    const anchorMultiplier = tierMultipliers[anchorTier]?.multiplier || 0.70
    
    // 锚点级别票房（用F比值映射）
    const anchorTierBoxOffice = anchor.boxOffice * ratio
    
    // 从锚点级别转换到目标级别的溢价系数
    // 如果锚点在三线，目标在一线，需要用 toTier1 的溢价
    // 如果锚点在一线，目标在三线，需要用反向折价
    const tierKey = `to${targetTier.charAt(0).toUpperCase()}${targetTier.slice(1)}`
    const fromTierKey = `from${anchorTier.charAt(0).toUpperCase()}${anchorTier.slice(1)}`
    
    // 标准化到三线基准，再应用到目标级别的逻辑
    // 基准票房 = 锚点票房 / 锚点级别乘数 * 三线乘数 (0.7)
    const tier3BaseBoxOffice = anchorTierBoxOffice * (0.70 / anchorMultiplier)
    
    return {
      name: anchor.name,
      id: anchor.id,
      ratio,
      anchorTier,
      anchorTierBoxOffice,  // 锚点城市级别的预测票房
      tier3BoxOffice: tier3BaseBoxOffice  // 标准化到三线的基准票房
    }
  })
  
  // 计算三线城市基准票房范围（用于标准化比较）
  const tier3Values = anchorResults.map((a: any) => a.tier3BoxOffice)
  const tier3Min = Math.min(...tier3Values)
  const tier3Max = Math.max(...tier3Values)
  const tier3Avg = tier3Values.reduce((a: number, b: number) => a + b, 0) / tier3Values.length
  
  // Step F: 城市溢价计算 - 从三线基准转换到目标城市级别
  const tierKey = `to${targetTier.charAt(0).toUpperCase()}${targetTier.slice(1)}`
  const premiums = tierPremiums?.[tierKey] || 
    tierPremiums?.toTier1 || { conservative: 1.15, neutral: 1.25, aggressive: 1.35 }
  
  const conservative = tier3Min * premiums.conservative
  const neutral = tier3Avg * premiums.neutral
  const aggressive = tier3Max * premiums.aggressive
  
  return {
    // 归一化最大值
    normalization: {
      maxValues,
      dimensions
    },
    // 各艺人指数
    indices,
    // 多锚点比例映射
    anchorResults,
    // 三线城市基准票房
    tier3: {
      values: tier3Values,
      min: tier3Min,
      max: tier3Max,
      avg: tier3Avg
    },
    // 目标城市输出
    targetTier,
    output: {
      conservative: { value: conservative, label: '保守', premium: premiums.conservative },
      neutral: { value: neutral, label: '中性', premium: premiums.neutral },
      aggressive: { value: aggressive, label: '激进', premium: premiums.aggressive },
      range: [conservative, aggressive],
      mid: neutral
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
    
    // 合并自定义参数 - 支持新的动态结构
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

// AI Agent API - 使用OpenAI分析艺人并搜索数据
app.post('/api/ai/analyze', async (c) => {
  try {
    const body = await c.req.json()
    const { artistName, apiKey } = body
    
    if (!artistName) {
      return c.json({ error: '请输入艺人名称' }, 400)
    }
    
    // 优先使用请求中的apiKey，否则使用环境变量
    const openaiKey = apiKey || c.env.OPENAI_API_KEY
    
    if (!openaiKey) {
      return c.json({ 
        error: '需要OpenAI API Key',
        message: '请在设置中配置API Key或在请求中提供'
      }, 400)
    }
    
    // 构建提示词
    const systemPrompt = `你是一个专业的娱乐数据分析师，专门研究欧美明星在中国市场的热度数据。

你的任务是根据艺人名称，估算该艺人在中国的各平台数据：
1. 百度指数（日均搜索量，通常范围100-1000）
2. 网易云音乐粉丝数（万）
3. 小红书粉丝数（万）

参考基准：
- Travis Scott: 百度指数280, 网易云126.6万, 小红书1.0万
- Kanye West: 百度指数616, 网易云99.7万, 小红书13.9万
- Cardi B: 百度指数388, 网易云80.6万, 小红书82.0万

请根据艺人的知名度、在中国的受欢迎程度、音乐风格等因素进行合理估算。

重要提示：
- 如果你不确定具体数据，请基于艺人知名度进行合理推测
- 考虑艺人的社交媒体活跃度、最近作品、在华活动等因素
- 小红书数据通常反映女性粉丝和时尚/生活方式的关注度`

    const userPrompt = `请分析艺人: ${artistName}

请返回JSON格式的数据估算，包含以下字段：
{
  "artistName": "艺人名称",
  "artistNameCn": "中文名（如有）",
  "data": {
    "baidu": 数字（百度指数）,
    "netease": 数字（网易云粉丝数，单位万）,
    "xhs": 数字（小红书粉丝数，单位万）
  },
  "confidence": "high/medium/low（数据可信度）",
  "reasoning": "简要说明估算依据",
  "notes": "其他相关说明（如近期活动、争议等可能影响票房的因素）"
}`

    // 调用OpenAI API (使用环境变量的BASE_URL)
    const baseUrl = c.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-5',  // 使用GenSpark支持的模型
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7
      })
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      return c.json({ 
        error: 'OpenAI API调用失败',
        details: errorText
      }, 500)
    }
    
    const aiResult = await response.json() as {
      choices: Array<{
        message: {
          content: string
        }
      }>
    }
    const aiData = JSON.parse(aiResult.choices[0].message.content)
    
    // 使用AI返回的数据计算票房
    const artistData = aiData.data
    const calculation = calculateComparable(artistData)
    
    return c.json({
      success: true,
      ai: aiData,
      calculation,
      summary: {
        artistName: aiData.artistName,
        artistNameCn: aiData.artistNameCn,
        confidence: aiData.confidence,
        reasoning: aiData.reasoning,
        notes: aiData.notes,
        forecast: {
          conservative: `${calculation.output.conservative.value.toFixed(2)} 百万元（${(calculation.output.conservative.value * 100).toFixed(0)}万）`,
          neutral: `${calculation.output.neutral.value.toFixed(2)} 百万元（${(calculation.output.neutral.value * 100).toFixed(0)}万）`,
          aggressive: `${calculation.output.aggressive.value.toFixed(2)} 百万元（${(calculation.output.aggressive.value * 100).toFixed(0)}万）`
        }
      }
    })
  } catch (error) {
    return c.json({ 
      error: 'AI分析失败',
      details: String(error)
    }, 500)
  }
})

// ==================== 前端页面 ====================

// 主页面
app.get('/', (c) => {
  return c.html(`<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>演唱会票房预测 - Comparable模型计算器</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        .gradient-bg {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .glass {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
        }
        .step-card {
            transition: all 0.3s ease;
        }
        .step-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 40px rgba(0,0,0,0.1);
        }
        .tab-active {
            border-bottom: 3px solid #667eea;
            color: #667eea;
        }
        .pulse-dot {
            animation: pulse 2s infinite;
        }
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        .result-card {
            transition: all 0.5s ease;
        }
        .fade-in {
            animation: fadeIn 0.5s ease;
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
    </style>
</head>
<body class="bg-gray-50 min-h-screen">
    <!-- 头部 -->
    <header class="gradient-bg text-white py-8 px-4 shadow-lg">
        <div class="max-w-6xl mx-auto">
            <div class="flex items-center justify-between">
                <div>
                    <h1 class="text-3xl font-bold flex items-center gap-3">
                        <i class="fas fa-chart-line"></i>
                        演唱会票房预测器
                    </h1>
                    <p class="mt-2 text-purple-100">Comparable模型 · AI智能测算 · 专业投委会工具</p>
                </div>
                <div class="text-right text-sm text-purple-200">
                    <p>基于 Normalization→D→LC→F→双锚点→城市溢价 逻辑</p>
                    <p class="mt-1">Version 2.0 | 2026-01-27</p>
                </div>
            </div>
        </div>
    </header>

    <!-- 导航标签 -->
    <nav class="bg-white shadow-sm sticky top-0 z-50">
        <div class="max-w-6xl mx-auto px-4">
            <div class="flex space-x-8">
                <button onclick="switchTab('predict')" id="tab-predict" class="tab-active py-4 px-2 text-sm font-medium">
                    <i class="fas fa-chart-line mr-2"></i>演唱会票房预测入口
                </button>
                <button onclick="switchTab('cardib')" id="tab-cardib" class="py-4 px-2 text-sm font-medium text-gray-500 hover:text-gray-700">
                    <i class="fas fa-graduation-cap mr-2"></i>Cardi B案例讲解
                </button>
            </div>
        </div>
    </nav>

    <!-- 主内容区 -->
    <main class="max-w-6xl mx-auto px-4 py-8">
        
        <!-- 演唱会票房预测入口面板（新） -->
        <div id="panel-predict" class="space-y-6">
            <!-- 艺人数据输入区（放在最上面） -->
            <div class="glass rounded-2xl shadow-xl p-6">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <i class="fas fa-user-tie text-purple-600"></i>
                        艺人数据输入
                        <span class="text-sm font-normal text-gray-500 ml-2">（可添加/删除数据维度）</span>
                    </h3>
                    <button onclick="addArtistDataDimension()" class="px-3 py-1.5 bg-purple-500 text-white rounded-lg text-sm hover:bg-purple-600 transition-all">
                        <i class="fas fa-plus mr-1"></i>添加维度
                    </button>
                </div>
                
                <div class="grid md:grid-cols-3 gap-6">
                    <!-- 左侧：数据输入 -->
                    <div class="space-y-4">
                        <!-- 艺人名称搜索（自动匹配） -->
                        <div class="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4 mb-4">
                            <label class="text-sm font-medium text-purple-700 mb-2 block">
                                <i class="fas fa-search mr-1"></i>搜索艺人（自动匹配）
                            </label>
                            <div class="relative">
                                <input type="text" id="artist-search-input" 
                                    placeholder="输入艺人英文名..."
                                    autocomplete="off"
                                    class="w-full px-4 py-3 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-800 bg-white">
                                <div id="artist-autocomplete-dropdown" class="hidden absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                                    <!-- 动态填充 -->
                                </div>
                            </div>
                        </div>
                        
                        <div id="artist-data-inputs">
                            <!-- 动态生成的输入项 -->
                        </div>
                        
                        <!-- 城市级别选择 -->
                        <div class="bg-purple-50 rounded-xl p-4 mt-4">
                            <h4 class="font-medium text-purple-700 mb-3">
                                <i class="fas fa-city mr-2"></i>目标城市级别
                            </h4>
                            <div class="grid grid-cols-3 gap-1">
                                <label class="flex items-center justify-center p-2 bg-white rounded-lg cursor-pointer border-2 border-transparent hover:border-purple-300 transition-all">
                                    <input type="radio" name="targetTier" value="tier1" checked class="mr-1 text-purple-600">
                                    <span class="text-sm font-medium">一线</span>
                                </label>
                                <label class="flex items-center justify-center p-2 bg-white rounded-lg cursor-pointer border-2 border-transparent hover:border-purple-300 transition-all">
                                    <input type="radio" name="targetTier" value="tier2" class="mr-1 text-purple-600">
                                    <span class="text-sm font-medium">二线</span>
                                </label>
                                <label class="flex items-center justify-center p-2 bg-white rounded-lg cursor-pointer border-2 border-transparent hover:border-purple-300 transition-all">
                                    <input type="radio" name="targetTier" value="tier3" class="mr-1 text-purple-600">
                                    <span class="text-sm font-medium">三线</span>
                                </label>
                            </div>
                        </div>
                        
                        <button onclick="runPrediction()" 
                            class="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-indigo-700 transition-all">
                            <i class="fas fa-calculator mr-2"></i>开始预测
                        </button>
                    </div>
                    
                    <!-- 中间：预测结果 -->
                    <div class="bg-gray-50 rounded-xl p-4">
                        <h4 class="font-medium text-gray-700 mb-4">
                            <i class="fas fa-chart-pie mr-2 text-purple-600"></i>
                            预测结果
                        </h4>
                        <div id="prediction-result">
                            <div class="text-center text-gray-400 py-8">
                                <i class="fas fa-arrow-left text-3xl mb-3"></i>
                                <p>输入数据后点击"开始预测"</p>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 右侧：艺人档案 -->
                    <div class="bg-gradient-to-b from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200">
                        <div class="flex justify-between items-center mb-4">
                            <h4 class="font-medium text-amber-700">
                                <i class="fas fa-folder-open mr-2"></i>
                                艺人档案
                            </h4>
                            <span class="text-xs text-amber-500" id="archive-count">0 条记录</span>
                        </div>
                        
                        <!-- 档案列表 -->
                        <div id="artist-archive-list" class="space-y-2 max-h-80 overflow-y-auto">
                            <div class="text-center text-amber-400 py-6">
                                <i class="fas fa-archive text-2xl mb-2"></i>
                                <p class="text-sm">暂无档案</p>
                                <p class="text-xs mt-1">完成预测后可建档保存</p>
                            </div>
                        </div>
                        
                        <!-- 快速操作 -->
                        <div class="mt-4 pt-4 border-t border-amber-200">
                            <button onclick="clearAllArchives()" class="w-full py-2 text-sm text-amber-600 hover:bg-amber-100 rounded-lg transition-all">
                                <i class="fas fa-trash-alt mr-1"></i>清空全部档案
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- 模型参数配置区（放在下面） -->
            <div class="glass rounded-2xl shadow-xl p-6">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <i class="fas fa-sliders-h text-purple-600"></i>
                        模型参数配置
                    </h3>
                    <div class="flex gap-2">
                        <button onclick="saveAllParams()" class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm">
                            <i class="fas fa-save mr-1"></i>保存
                        </button>
                        <button onclick="resetAllParams()" class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm">
                            <i class="fas fa-undo mr-1"></i>重置
                        </button>
                    </div>
                </div>
                
                <div class="grid md:grid-cols-2 gap-6">
                    <!-- 左列 -->
                    <div class="space-y-4">
                        <!-- 需求指数D权重 - 可增删 -->
                        <div class="bg-blue-50 rounded-xl p-4">
                            <div class="flex justify-between items-center mb-4">
                                <h4 class="font-medium text-blue-700">
                                    <i class="fas fa-balance-scale mr-2"></i>
                                    需求指数D权重
                                </h4>
                                <button onclick="addWeightParam()" class="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600">
                                    <i class="fas fa-plus mr-1"></i>添加
                                </button>
                            </div>
                            <div id="weight-params-list" class="space-y-2">
                                <!-- 动态生成 -->
                            </div>
                            <p class="text-xs text-blue-600 mt-3">
                                <i class="fas fa-info-circle mr-1"></i>权重之和建议为1.0
                            </p>
                        </div>
                        
                        <!-- 转化率LC参数 -->
                        <div class="bg-green-50 rounded-xl p-4">
                            <h4 class="font-medium text-green-700 mb-4">
                                <i class="fas fa-exchange-alt mr-2"></i>
                                转化率LC参数
                            </h4>
                            <div class="space-y-3">
                                <div class="flex items-center gap-2">
                                    <label class="text-sm text-gray-600 w-24">基础常数</label>
                                    <input type="number" id="param-lc-const" value="0.60" step="0.05" min="0" max="1"
                                        class="flex-1 px-3 py-2 border rounded">
                                </div>
                                <div class="flex items-center gap-2">
                                    <label class="text-sm text-gray-600 w-24">网易云系数</label>
                                    <input type="number" id="param-lc-netease" value="0.40" step="0.05"
                                        class="flex-1 px-3 py-2 border rounded">
                                </div>
                                <div class="flex items-center gap-2">
                                    <label class="text-sm text-gray-600 w-24">小红书系数</label>
                                    <input type="number" id="param-lc-xhs" value="-0.20" step="0.05"
                                        class="flex-1 px-3 py-2 border rounded">
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 右列 -->
                    <div class="space-y-4">
                        <!-- 城市溢价系数 - 三级配置 -->
                        <div class="bg-purple-50 rounded-xl p-4">
                            <h4 class="font-medium text-purple-700 mb-4">
                                <i class="fas fa-city mr-2"></i>
                                城市溢价系数（三线→目标城市）
                            </h4>
                            <div class="space-y-3">
                                <!-- 三线→一线 -->
                                <div class="bg-white rounded-lg p-3">
                                    <p class="text-sm font-medium text-gray-700 mb-2">三线 → 一线城市</p>
                                    <div class="grid grid-cols-3 gap-2">
                                        <div>
                                            <label class="text-xs text-gray-500">保守</label>
                                            <input type="number" id="tier1-conservative" value="1.15" step="0.05"
                                                class="w-full px-2 py-1 border rounded text-sm">
                                        </div>
                                        <div>
                                            <label class="text-xs text-gray-500">中性</label>
                                            <input type="number" id="tier1-neutral" value="1.25" step="0.05"
                                                class="w-full px-2 py-1 border rounded text-sm">
                                        </div>
                                        <div>
                                            <label class="text-xs text-gray-500">激进</label>
                                            <input type="number" id="tier1-aggressive" value="1.35" step="0.05"
                                                class="w-full px-2 py-1 border rounded text-sm">
                                        </div>
                                    </div>
                                </div>
                                <!-- 三线→二线 -->
                                <div class="bg-white rounded-lg p-3">
                                    <p class="text-sm font-medium text-gray-700 mb-2">三线 → 二线城市</p>
                                    <div class="grid grid-cols-3 gap-2">
                                        <div>
                                            <label class="text-xs text-gray-500">保守</label>
                                            <input type="number" id="tier2-conservative" value="0.95" step="0.05"
                                                class="w-full px-2 py-1 border rounded text-sm">
                                        </div>
                                        <div>
                                            <label class="text-xs text-gray-500">中性</label>
                                            <input type="number" id="tier2-neutral" value="1.05" step="0.05"
                                                class="w-full px-2 py-1 border rounded text-sm">
                                        </div>
                                        <div>
                                            <label class="text-xs text-gray-500">激进</label>
                                            <input type="number" id="tier2-aggressive" value="1.15" step="0.05"
                                                class="w-full px-2 py-1 border rounded text-sm">
                                        </div>
                                    </div>
                                </div>
                                <!-- 三线→三线 -->
                                <div class="bg-white rounded-lg p-3">
                                    <p class="text-sm font-medium text-gray-700 mb-2">三线 → 三线城市</p>
                                    <div class="grid grid-cols-3 gap-2">
                                        <div>
                                            <label class="text-xs text-gray-500">保守</label>
                                            <input type="number" id="tier3-conservative" value="0.85" step="0.05"
                                                class="w-full px-2 py-1 border rounded text-sm">
                                        </div>
                                        <div>
                                            <label class="text-xs text-gray-500">中性</label>
                                            <input type="number" id="tier3-neutral" value="0.95" step="0.05"
                                                class="w-full px-2 py-1 border rounded text-sm">
                                        </div>
                                        <div>
                                            <label class="text-xs text-gray-500">激进</label>
                                            <input type="number" id="tier3-aggressive" value="1.05" step="0.05"
                                                class="w-full px-2 py-1 border rounded text-sm">
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Benchmark锚点数据 - 可增删 -->
                <div class="mt-6 bg-orange-50 rounded-xl p-4">
                    <div class="flex justify-between items-center mb-4">
                        <h4 class="font-medium text-orange-700">
                            <i class="fas fa-anchor mr-2"></i>
                            Benchmark锚点数据
                            <span class="text-sm font-normal text-orange-500 ml-2">（可选择各锚点所属城市级别）</span>
                        </h4>
                        <button onclick="addBenchmark()" class="px-3 py-1 bg-orange-500 text-white rounded text-sm hover:bg-orange-600">
                            <i class="fas fa-plus mr-1"></i>添加锚点
                        </button>
                    </div>
                    <div id="benchmark-list" class="grid md:grid-cols-2 gap-4">
                        <!-- 动态生成 -->
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Cardi B 案例讲解面板 -->
        <div id="panel-cardib" class="hidden space-y-6">
            <div class="glass rounded-2xl shadow-xl p-8">
                <div class="text-center mb-8">
                    <h2 class="text-2xl font-bold text-gray-800">
                        <i class="fas fa-graduation-cap text-purple-600 mr-2"></i>
                        Cardi B 票房预测案例详解
                    </h2>
                    <p class="text-gray-500 mt-2">完整展示 Comparable 模型的6步计算过程</p>
                </div>
                
                <div id="cardib-steps" class="space-y-6">
                    <!-- 动态加载 -->
                    <div class="text-center py-8">
                        <button onclick="loadCardiDemo()" class="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                            <i class="fas fa-play mr-2"></i>加载案例演示
                        </button>
                    </div>
                </div>
            </div>
        </div>


    </main>

    <!-- 底部 -->
    <footer class="bg-gray-800 text-gray-400 py-8 mt-12">
        <div class="max-w-6xl mx-auto px-4 text-center">
            <p class="mb-2">Comparable模型票房预测器 · 专业投委会工具</p>
            <p class="text-sm">基于 Normalization → D → LC → F → 双锚点 → 城市溢价 逻辑链</p>
        </div>
    </footer>

    <script>
        // ==================== 全局状态 ====================
        let currentParams = null;
        
        // 艺人数据库（用于自动补全）
        const ARTIST_DATABASE = [
            // Hip-Hop / Rap
            { name: 'Drake', cn: '德雷克', genre: 'Hip-Hop' },
            { name: 'Travis Scott', cn: '特拉维斯·斯科特', genre: 'Hip-Hop' },
            { name: 'Kanye West', cn: '坎耶·韦斯特', genre: 'Hip-Hop' },
            { name: 'Cardi B', cn: '卡迪·B', genre: 'Hip-Hop' },
            { name: 'Kendrick Lamar', cn: '肯德里克·拉马尔', genre: 'Hip-Hop' },
            { name: 'J. Cole', cn: 'J·科尔', genre: 'Hip-Hop' },
            { name: 'Post Malone', cn: '波斯特·马龙', genre: 'Hip-Hop' },
            { name: 'Lil Baby', cn: '小宝贝', genre: 'Hip-Hop' },
            { name: 'Future', cn: '未来', genre: 'Hip-Hop' },
            { name: '21 Savage', cn: '21·萨维奇', genre: 'Hip-Hop' },
            { name: 'Megan Thee Stallion', cn: '梅根·西·斯塔里昂', genre: 'Hip-Hop' },
            { name: 'Nicki Minaj', cn: '妮琪·米娜', genre: 'Hip-Hop' },
            { name: 'Eminem', cn: '埃米纳姆', genre: 'Hip-Hop' },
            { name: 'Jay-Z', cn: '杰斯', genre: 'Hip-Hop' },
            { name: 'Lil Wayne', cn: '小韦恩', genre: 'Hip-Hop' },
            { name: 'Tyler, The Creator', cn: '泰勒·创造者', genre: 'Hip-Hop' },
            { name: 'A$AP Rocky', cn: 'A$AP洛基', genre: 'Hip-Hop' },
            { name: 'Metro Boomin', cn: '都市轰鸣', genre: 'Hip-Hop' },
            { name: 'Playboi Carti', cn: '花花公子卡地', genre: 'Hip-Hop' },
            { name: 'Doja Cat', cn: '多贾猫', genre: 'Hip-Hop' },
            
            // Pop
            { name: 'Taylor Swift', cn: '泰勒·斯威夫特', genre: 'Pop' },
            { name: 'Ed Sheeran', cn: '艾德·希兰', genre: 'Pop' },
            { name: 'Ariana Grande', cn: '爱莉安娜·格兰德', genre: 'Pop' },
            { name: 'Billie Eilish', cn: '比莉·艾利什', genre: 'Pop' },
            { name: 'The Weeknd', cn: '威肯', genre: 'Pop' },
            { name: 'Justin Bieber', cn: '贾斯汀·比伯', genre: 'Pop' },
            { name: 'Bruno Mars', cn: '布鲁诺·马尔斯', genre: 'Pop' },
            { name: 'Dua Lipa', cn: '杜阿·利帕', genre: 'Pop' },
            { name: 'Harry Styles', cn: '哈里·斯泰尔斯', genre: 'Pop' },
            { name: 'Olivia Rodrigo', cn: '奥利维亚·罗德里戈', genre: 'Pop' },
            { name: 'Lady Gaga', cn: '嘎嘎小姐', genre: 'Pop' },
            { name: 'Beyoncé', cn: '碧昂丝', genre: 'Pop' },
            { name: 'Rihanna', cn: '蕾哈娜', genre: 'Pop' },
            { name: 'Katy Perry', cn: '凯蒂·佩里', genre: 'Pop' },
            { name: 'Selena Gomez', cn: '赛琳娜·戈麦斯', genre: 'Pop' },
            { name: 'Miley Cyrus', cn: '麦莉·赛勒斯', genre: 'Pop' },
            { name: 'Shawn Mendes', cn: '肖恩·门德斯', genre: 'Pop' },
            { name: 'Charlie Puth', cn: '查理·普斯', genre: 'Pop' },
            { name: 'Sia', cn: '希雅', genre: 'Pop' },
            { name: 'Adele', cn: '阿黛尔', genre: 'Pop' },
            { name: 'Sam Smith', cn: '萨姆·史密斯', genre: 'Pop' },
            { name: 'Sabrina Carpenter', cn: '萨布丽娜·卡彭特', genre: 'Pop' },
            { name: 'Chappell Roan', cn: '查佩尔·罗恩', genre: 'Pop' },
            
            // Latin
            { name: 'Bad Bunny', cn: '坏兔子', genre: 'Latin' },
            { name: 'J Balvin', cn: 'J·巴尔文', genre: 'Latin' },
            { name: 'Daddy Yankee', cn: '洋基老爹', genre: 'Latin' },
            { name: 'Ozuna', cn: '奥祖纳', genre: 'Latin' },
            { name: 'Maluma', cn: '马卢马', genre: 'Latin' },
            { name: 'Karol G', cn: '卡罗尔·G', genre: 'Latin' },
            { name: 'Shakira', cn: '夏奇拉', genre: 'Latin' },
            { name: 'Rauw Alejandro', cn: '劳·亚历杭德罗', genre: 'Latin' },
            
            // R&B / Soul
            { name: 'SZA', cn: 'SZA', genre: 'R&B' },
            { name: 'Frank Ocean', cn: '弗兰克·奥申', genre: 'R&B' },
            { name: 'Daniel Caesar', cn: '丹尼尔·凯撒', genre: 'R&B' },
            { name: 'H.E.R.', cn: 'H.E.R.', genre: 'R&B' },
            { name: 'Usher', cn: '亚瑟', genre: 'R&B' },
            { name: 'Chris Brown', cn: '克里斯·布朗', genre: 'R&B' },
            { name: 'Khalid', cn: '哈立德', genre: 'R&B' },
            
            // Rock / Alternative
            { name: 'Coldplay', cn: '酷玩乐队', genre: 'Rock' },
            { name: 'Imagine Dragons', cn: '梦龙乐队', genre: 'Rock' },
            { name: 'Maroon 5', cn: '魔力红', genre: 'Rock' },
            { name: 'OneRepublic', cn: '共和时代', genre: 'Rock' },
            { name: 'The 1975', cn: 'The 1975', genre: 'Rock' },
            { name: 'Arctic Monkeys', cn: '北极猴', genre: 'Rock' },
            { name: 'Twenty One Pilots', cn: '二十一名飞行员', genre: 'Rock' },
            { name: 'Foo Fighters', cn: '喷火战机', genre: 'Rock' },
            { name: 'Green Day', cn: '绿日乐队', genre: 'Rock' },
            { name: 'Linkin Park', cn: '林肯公园', genre: 'Rock' },
            
            // Electronic / DJ
            { name: 'Calvin Harris', cn: '卡尔文·哈里斯', genre: 'Electronic' },
            { name: 'Marshmello', cn: '棉花糖', genre: 'Electronic' },
            { name: 'The Chainsmokers', cn: '烟鬼组合', genre: 'Electronic' },
            { name: 'David Guetta', cn: '大卫·库塔', genre: 'Electronic' },
            { name: 'Kygo', cn: 'Kygo', genre: 'Electronic' },
            { name: 'Tiësto', cn: '铁斯托', genre: 'Electronic' },
            { name: 'Skrillex', cn: '史奇雷克斯', genre: 'Electronic' },
            { name: 'Zedd', cn: '泽德', genre: 'Electronic' },
            { name: 'Martin Garrix', cn: '马丁·盖瑞斯', genre: 'Electronic' },
            
            // K-Pop crossover (有在欧美市场活动的)
            { name: 'BTS', cn: '防弹少年团', genre: 'K-Pop' },
            { name: 'BLACKPINK', cn: 'BLACKPINK', genre: 'K-Pop' },
            { name: 'Lisa', cn: 'Lisa', genre: 'K-Pop' },
            { name: 'Rosé', cn: 'Rosé', genre: 'K-Pop' },
        ];
        
        // 初始化
        document.addEventListener('DOMContentLoaded', async () => {
            // 加载默认参数
            const res = await fetch('/api/params/default');
            currentParams = await res.json();
            console.log('Loaded default params:', currentParams);
            
            // 初始化自动补全
            initAutocomplete();
        });
        
        // ==================== 自动补全功能 ====================
        function initAutocomplete() {
            const input = document.getElementById('artist-search-input');
            const dropdown = document.getElementById('artist-autocomplete-dropdown');
            
            if (!input || !dropdown) return;
            
            let selectedIndex = -1;
            
            // 输入事件
            input.addEventListener('input', (e) => {
                const value = e.target.value.trim().toLowerCase();
                selectedIndex = -1;
                
                if (value.length < 1) {
                    dropdown.classList.add('hidden');
                    return;
                }
                
                // 搜索匹配的艺人
                const matches = ARTIST_DATABASE.filter(artist => 
                    artist.name.toLowerCase().includes(value) || 
                    artist.cn.includes(value)
                ).slice(0, 8);  // 最多显示8个
                
                if (matches.length === 0) {
                    dropdown.classList.add('hidden');
                    return;
                }
                
                // 渲染下拉列表
                dropdown.innerHTML = matches.map((artist, index) => \`
                    <div class="autocomplete-item px-4 py-3 hover:bg-purple-50 cursor-pointer flex justify-between items-center border-b border-gray-100 last:border-0"
                         data-name="\${artist.name}" data-cn="\${artist.cn}" data-index="\${index}">
                        <div>
                            <span class="font-medium text-gray-800">\${highlightMatch(artist.name, value)}</span>
                            <span class="text-gray-400 text-sm ml-2">\${artist.cn}</span>
                        </div>
                        <span class="text-xs px-2 py-1 bg-gray-100 text-gray-500 rounded">\${artist.genre}</span>
                    </div>
                \`).join('');
                
                dropdown.classList.remove('hidden');
                
                // 点击选项
                dropdown.querySelectorAll('.autocomplete-item').forEach(item => {
                    item.addEventListener('click', () => {
                        const artistName = item.dataset.name;
                        input.value = artistName;
                        dropdown.classList.add('hidden');
                        // 自动填充艺人数据
                        fillArtistData(artistName);
                    });
                });
            });
            
            // 键盘导航
            input.addEventListener('keydown', (e) => {
                const items = dropdown.querySelectorAll('.autocomplete-item');
                
                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
                    updateSelection(items, selectedIndex);
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    selectedIndex = Math.max(selectedIndex - 1, 0);
                    updateSelection(items, selectedIndex);
                } else if (e.key === 'Enter' && selectedIndex >= 0) {
                    e.preventDefault();
                    const artistName = items[selectedIndex].dataset.name;
                    input.value = artistName;
                    dropdown.classList.add('hidden');
                    // 自动填充艺人数据
                    fillArtistData(artistName);
                } else if (e.key === 'Escape') {
                    dropdown.classList.add('hidden');
                }
            });
            
            // 点击外部关闭
            document.addEventListener('click', (e) => {
                if (!input.contains(e.target) && !dropdown.contains(e.target)) {
                    dropdown.classList.add('hidden');
                }
            });
            
            // 聚焦时如果有内容则显示建议
            input.addEventListener('focus', () => {
                if (input.value.trim().length >= 1) {
                    input.dispatchEvent(new Event('input'));
                }
            });
        }
        
        // 已知艺人数据（基准数据）
        const KNOWN_ARTIST_DATA = {
            'Travis Scott': { baidu: 280, netease: 126.6, xhs: 1.0 },
            'Kanye West': { baidu: 616, netease: 99.7, xhs: 13.9 },
            'Cardi B': { baidu: 388, netease: 80.6, xhs: 82.0 },
            'Drake': { baidu: 520, netease: 150.0, xhs: 25.0 },
            'Taylor Swift': { baidu: 890, netease: 280.0, xhs: 150.0 },
            'The Weeknd': { baidu: 450, netease: 180.0, xhs: 35.0 },
            'Beyoncé': { baidu: 380, netease: 95.0, xhs: 45.0 },
            'Ed Sheeran': { baidu: 680, netease: 220.0, xhs: 60.0 },
            'Billie Eilish': { baidu: 350, netease: 120.0, xhs: 95.0 },
            'Dua Lipa': { baidu: 420, netease: 140.0, xhs: 88.0 },
            'Post Malone': { baidu: 380, netease: 110.0, xhs: 20.0 },
            'Bad Bunny': { baidu: 280, netease: 45.0, xhs: 15.0 },
            'Ariana Grande': { baidu: 560, netease: 190.0, xhs: 120.0 },
            'Justin Bieber': { baidu: 720, netease: 210.0, xhs: 85.0 },
            'Bruno Mars': { baidu: 480, netease: 160.0, xhs: 40.0 },
            'Rihanna': { baidu: 420, netease: 130.0, xhs: 75.0 },
            'Coldplay': { baidu: 580, netease: 250.0, xhs: 55.0 },
            'BTS': { baidu: 950, netease: 380.0, xhs: 280.0 },
            'BLACKPINK': { baidu: 780, netease: 320.0, xhs: 220.0 },
        };
        
        // 填充艺人数据
        function fillArtistData(artistName) {
            const data = KNOWN_ARTIST_DATA[artistName];
            if (data) {
                // 填充已知数据
                Object.keys(data).forEach(key => {
                    artistInputValues[key] = data[key];
                    const input = document.getElementById('input-' + key);
                    if (input) {
                        input.value = data[key];
                        // 添加高亮动画效果
                        input.classList.add('ring-2', 'ring-green-400');
                        setTimeout(() => {
                            input.classList.remove('ring-2', 'ring-green-400');
                        }, 1000);
                    }
                });
                
                // 显示提示
                showFillNotification(artistName, '已自动填充数据');
            } else {
                // 没有已知数据，提示用户手动输入
                showFillNotification(artistName, '暂无预设数据，请手动输入');
            }
        }
        
        // 显示填充通知
        function showFillNotification(artistName, message) {
            // 创建通知元素
            const notification = document.createElement('div');
            notification.className = 'fixed top-20 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50 fade-in';
            notification.innerHTML = \`
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <i class="fas fa-user text-purple-600"></i>
                    </div>
                    <div>
                        <p class="font-medium text-gray-800">\${artistName}</p>
                        <p class="text-sm text-gray-500">\${message}</p>
                    </div>
                </div>
            \`;
            document.body.appendChild(notification);
            
            // 3秒后移除
            setTimeout(() => {
                notification.remove();
            }, 3000);
        }
        
        function highlightMatch(text, query) {
            const regex = new RegExp(\`(\${query})\`, 'gi');
            return text.replace(regex, '<span class="text-purple-600 font-semibold">$1</span>');
        }
        
        function updateSelection(items, index) {
            items.forEach((item, i) => {
                if (i === index) {
                    item.classList.add('bg-purple-50');
                } else {
                    item.classList.remove('bg-purple-50');
                }
            });
        }
        
        // ==================== 标签切换 ====================
        function switchTab(tabName) {
            // 隐藏所有面板
            document.querySelectorAll('[id^="panel-"]').forEach(p => p.classList.add('hidden'));
            // 显示目标面板
            document.getElementById('panel-' + tabName).classList.remove('hidden');
            
            // 更新标签样式
            document.querySelectorAll('[id^="tab-"]').forEach(t => {
                t.classList.remove('tab-active');
                t.classList.add('text-gray-500');
            });
            document.getElementById('tab-' + tabName).classList.add('tab-active');
            document.getElementById('tab-' + tabName).classList.remove('text-gray-500');
        }
        
        // ==================== 手动计算 ====================
        async function runManualCalculation() {
            const baidu = parseFloat(document.getElementById('manual-baidu').value);
            const netease = parseFloat(document.getElementById('manual-netease').value);
            const xhs = parseFloat(document.getElementById('manual-xhs').value);
            
            if (isNaN(baidu) || isNaN(netease) || isNaN(xhs)) {
                alert('请输入有效的数字');
                return;
            }
            
            try {
                const customParams = getCustomParams();
                
                const res = await fetch('/api/calculate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        artistData: { baidu, netease, xhs },
                        customParams
                    })
                });
                
                const data = await res.json();
                
                if (data.error) {
                    throw new Error(data.error);
                }
                
                displayManualResult(data.result);
            } catch (error) {
                alert('计算失败: ' + error.message);
            }
        }
        
        function displayManualResult(result) {
            const container = document.getElementById('manual-result');
            
            container.innerHTML = \`
                <div class="fade-in space-y-4">
                    <!-- 票房预测 -->
                    <div class="space-y-3">
                        <div class="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                            <span class="text-yellow-700 font-medium">保守</span>
                            <span class="text-xl font-bold text-yellow-700">\${result.output.conservative.value.toFixed(2)} 百万元</span>
                        </div>
                        <div class="flex justify-between items-center p-3 bg-purple-100 rounded-lg border-2 border-purple-300">
                            <span class="text-purple-700 font-medium">中性</span>
                            <span class="text-2xl font-bold text-purple-700">\${result.output.neutral.value.toFixed(2)} 百万元</span>
                        </div>
                        <div class="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                            <span class="text-green-700 font-medium">激进</span>
                            <span class="text-xl font-bold text-green-700">\${result.output.aggressive.value.toFixed(2)} 百万元</span>
                        </div>
                    </div>
                    
                    <!-- 中间指数 -->
                    <div class="bg-gray-100 rounded-lg p-4">
                        <h5 class="font-medium text-gray-700 mb-2">计算指数</h5>
                        <div class="grid grid-cols-3 gap-2 text-sm">
                            <div>D: \${result.indices[2].D.toFixed(3)}</div>
                            <div>LC: \${result.indices[2].LC.toFixed(3)}</div>
                            <div>F: \${result.indices[2].F.toFixed(3)}</div>
                        </div>
                    </div>
                    
                    <!-- 三线票房 -->
                    <div class="bg-orange-50 rounded-lg p-4">
                        <h5 class="font-medium text-orange-700 mb-2">三线城市基准</h5>
                        <p class="text-sm text-gray-600">
                            区间: \${result.tier3.from_kanye.toFixed(2)} ~ \${result.tier3.from_travis.toFixed(2)} 百万元
                        </p>
                    </div>
                </div>
            \`;
        }
        
        // ==================== Cardi B 案例 ====================
        async function loadCardiDemo() {
            try {
                const res = await fetch('/api/demo/cardib');
                const data = await res.json();
                
                displayCardiDemo(data);
            } catch (error) {
                alert('加载失败: ' + error.message);
            }
        }
        
        function displayCardiDemo(data) {
            const container = document.getElementById('cardib-steps');
            const { result, input, explanation } = data;
            
            // 获取最大值
            const maxVals = result.normalization.maxValues || { baidu: 616, netease: 126.6, xhs: 82 };
            
            container.innerHTML = \`
                <div class="fade-in space-y-6">
                    <!-- 原始数据 -->
                    <div class="step-card bg-white rounded-xl shadow p-6 border-l-4 border-blue-500">
                        <div class="flex items-center gap-3 mb-4">
                            <span class="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">0</span>
                            <h4 class="text-lg font-bold text-gray-800">原始输入数据</h4>
                        </div>
                        <div class="grid grid-cols-3 gap-4">
                            <div class="bg-blue-50 rounded-lg p-4 text-center">
                                <p class="text-sm text-gray-500">百度指数</p>
                                <p class="text-2xl font-bold text-blue-600">\${input.baidu}</p>
                            </div>
                            <div class="bg-red-50 rounded-lg p-4 text-center">
                                <p class="text-sm text-gray-500">网易云粉丝</p>
                                <p class="text-2xl font-bold text-red-600">\${input.netease}万</p>
                            </div>
                            <div class="bg-pink-50 rounded-lg p-4 text-center">
                                <p class="text-sm text-gray-500">小红书粉丝</p>
                                <p class="text-2xl font-bold text-pink-600">\${input.xhs}万</p>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Step A: 归一化 -->
                    <div class="step-card bg-white rounded-xl shadow p-6 border-l-4 border-purple-500">
                        <div class="flex items-center gap-3 mb-4">
                            <span class="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold">A</span>
                            <h4 class="text-lg font-bold text-gray-800">归一化 (Normalization)</h4>
                        </div>
                        <p class="text-gray-600 mb-4">\${explanation.step1}</p>
                        <div class="bg-purple-50 rounded-lg p-4">
                            <p class="text-sm font-mono mb-2">公式: x' = x / max(x)</p>
                            <p class="text-sm">max(百度)=\${maxVals.baidu}, max(网易云)=\${maxVals.netease}, max(小红书)=\${maxVals.xhs}</p>
                        </div>
                        <div class="mt-4 overflow-x-auto">
                            <table class="w-full text-sm">
                                <thead class="bg-gray-100">
                                    <tr>
                                        <th class="p-2 text-left">艺人</th>
                                        <th class="p-2 text-right">百度'</th>
                                        <th class="p-2 text-right">网易云'</th>
                                        <th class="p-2 text-right">小红书'</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    \${result.indices.map(i => \`
                                        <tr class="\${i.id === 'target' ? 'bg-yellow-50 font-bold' : ''}">
                                            <td class="p-2">\${i.id === 'target' ? 'Cardi B' : i.name}</td>
                                            <td class="p-2 text-right">\${(i.baidu_norm || 0).toFixed(3)}</td>
                                            <td class="p-2 text-right">\${(i.netease_norm || 0).toFixed(3)}</td>
                                            <td class="p-2 text-right">\${(i.xhs_norm || 0).toFixed(3)}</td>
                                        </tr>
                                    \`).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    
                    <!-- Step B: D指数 -->
                    <div class="step-card bg-white rounded-xl shadow p-6 border-l-4 border-indigo-500">
                        <div class="flex items-center gap-3 mb-4">
                            <span class="w-8 h-8 bg-indigo-500 text-white rounded-full flex items-center justify-center font-bold">B</span>
                            <h4 class="text-lg font-bold text-gray-800">需求指数 D (Demand Index)</h4>
                        </div>
                        <p class="text-gray-600 mb-4">\${explanation.step2}</p>
                        <div class="bg-indigo-50 rounded-lg p-4">
                            <p class="text-sm font-mono">D = Σ(权重i × 维度i')</p>
                        </div>
                        <div class="mt-4 grid grid-cols-3 gap-4">
                            \${result.indices.map(i => \`
                                <div class="text-center p-3 \${i.id === 'target' ? 'bg-yellow-100 rounded-lg' : ''}">
                                    <p class="text-sm text-gray-500">\${i.id === 'target' ? 'Cardi B' : i.name}</p>
                                    <p class="text-xl font-bold">\${i.D.toFixed(3)}</p>
                                </div>
                            \`).join('')}
                        </div>
                    </div>
                    
                    <!-- Step C: LC转化率 -->
                    <div class="step-card bg-white rounded-xl shadow p-6 border-l-4 border-teal-500">
                        <div class="flex items-center gap-3 mb-4">
                            <span class="w-8 h-8 bg-teal-500 text-white rounded-full flex items-center justify-center font-bold">C</span>
                            <h4 class="text-lg font-bold text-gray-800">现场转化率 LC (Live Conversion)</h4>
                        </div>
                        <p class="text-gray-600 mb-4">\${explanation.step3}</p>
                        <div class="bg-teal-50 rounded-lg p-4">
                            <p class="text-sm font-mono">LC = clip(0.60 + 0.40×网易云' - 0.20×小红书', 0.60, 1.00)</p>
                            <p class="text-xs text-gray-500 mt-1">说明：网易云音乐粉丝更可能现场购票，小红书粉丝偏重图文关注</p>
                        </div>
                        <div class="mt-4 grid grid-cols-3 gap-4">
                            \${result.indices.map(i => \`
                                <div class="text-center p-3 \${i.id === 'target' ? 'bg-yellow-100 rounded-lg' : ''}">
                                    <p class="text-sm text-gray-500">\${i.id === 'target' ? 'Cardi B' : i.name}</p>
                                    <p class="text-xl font-bold">\${i.LC.toFixed(3)}</p>
                                </div>
                            \`).join('')}
                        </div>
                    </div>
                    
                    <!-- Step D: F指数 -->
                    <div class="step-card bg-white rounded-xl shadow p-6 border-l-4 border-orange-500">
                        <div class="flex items-center gap-3 mb-4">
                            <span class="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold">D</span>
                            <h4 class="text-lg font-bold text-gray-800">出票指数 F (Final Index)</h4>
                        </div>
                        <p class="text-gray-600 mb-4">\${explanation.step4}</p>
                        <div class="bg-orange-50 rounded-lg p-4">
                            <p class="text-sm font-mono">F = D × LC</p>
                        </div>
                        <div class="mt-4 grid grid-cols-3 gap-4">
                            \${result.indices.map(i => \`
                                <div class="text-center p-3 \${i.id === 'target' ? 'bg-yellow-100 rounded-lg' : ''}">
                                    <p class="text-sm text-gray-500">\${i.id === 'target' ? 'Cardi B' : i.name}</p>
                                    <p class="text-xl font-bold">\${i.F.toFixed(3)}</p>
                                </div>
                            \`).join('')}
                        </div>
                    </div>
                    
                    <!-- Step E: 多锚点 -->
                    <div class="step-card bg-white rounded-xl shadow p-6 border-l-4 border-red-500">
                        <div class="flex items-center gap-3 mb-4">
                            <span class="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center font-bold">E</span>
                            <h4 class="text-lg font-bold text-gray-800">多锚点校准 (Comparable)</h4>
                        </div>
                        <p class="text-gray-600 mb-4">\${explanation.step5}</p>
                        <div class="grid md:grid-cols-2 gap-4">
                            \${(result.anchorResults || []).map((a, idx) => {
                                const tierNames = { tier1: '一线城市', tier2: '二线城市', tier3: '三线城市' };
                                const tierColor = a.anchorTier === 'tier1' ? 'purple' : a.anchorTier === 'tier2' ? 'blue' : 'orange';
                                return \`
                                <div class="bg-\${idx === 0 ? 'red' : 'amber'}-50 rounded-lg p-4">
                                    <div class="flex items-center gap-2 mb-2">
                                        <p class="font-medium text-\${idx === 0 ? 'red' : 'amber'}-700">\${a.name} 锚点</p>
                                        <span class="px-2 py-0.5 text-xs rounded bg-\${tierColor}-100 text-\${tierColor}-600">\${tierNames[a.anchorTier] || '三线城市'}</span>
                                    </div>
                                    <p class="text-sm">ratio = \${a.ratio.toFixed(3)}</p>
                                    <p class="text-sm">锚点城市票房 = \${a.anchorTierBoxOffice?.toFixed(2) || a.tier3BoxOffice.toFixed(2)} 百万元</p>
                                    <p class="text-sm">→ 三线基准 = <strong>\${a.tier3BoxOffice.toFixed(2)} 百万元</strong></p>
                                </div>
                            \`}).join('')}
                        </div>
                        <div class="mt-4 bg-gray-100 rounded-lg p-4 text-center">
                            <p class="text-sm text-gray-600">三线城市基准票房区间</p>
                            <p class="text-xl font-bold text-gray-800">\${result.tier3.min.toFixed(2)} ~ \${result.tier3.max.toFixed(2)} 百万元</p>
                        </div>
                    </div>
                    
                    <!-- Step F: 城市溢价 -->
                    <div class="step-card bg-white rounded-xl shadow p-6 border-l-4 border-green-500">
                        <div class="flex items-center gap-3 mb-4">
                            <span class="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold">F</span>
                            <h4 class="text-lg font-bold text-gray-800">城市溢价 (深圳/杭州)</h4>
                        </div>
                        <p class="text-gray-600 mb-4">\${explanation.step6}</p>
                        <div class="bg-green-50 rounded-lg p-4 mb-4">
                            <p class="text-sm">保守 = Kanye锚点 × 1.15 | 中性 = 双锚点均值 × 1.25 | 激进 = Travis锚点 × 1.35</p>
                        </div>
                        <div class="grid grid-cols-3 gap-4">
                            <div class="text-center p-4 bg-yellow-100 rounded-lg">
                                <p class="text-sm text-yellow-700 font-medium">保守 (×1.15)</p>
                                <p class="text-2xl font-bold text-yellow-700">\${result.output.conservative.value.toFixed(2)}</p>
                                <p class="text-xs text-gray-500">百万元</p>
                            </div>
                            <div class="text-center p-4 bg-purple-200 rounded-lg border-2 border-purple-400">
                                <p class="text-sm text-purple-700 font-medium">中性 (×1.25)</p>
                                <p class="text-3xl font-bold text-purple-700">\${result.output.neutral.value.toFixed(2)}</p>
                                <p class="text-xs text-gray-500">百万元</p>
                            </div>
                            <div class="text-center p-4 bg-green-100 rounded-lg">
                                <p class="text-sm text-green-700 font-medium">激进 (×1.35)</p>
                                <p class="text-2xl font-bold text-green-700">\${result.output.aggressive.value.toFixed(2)}</p>
                                <p class="text-xs text-gray-500">百万元</p>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 最终结论 -->
                    <div class="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-6 text-white">
                        <h4 class="text-xl font-bold mb-4 flex items-center gap-2">
                            <i class="fas fa-flag-checkered"></i>
                            最终结论
                        </h4>
                        <p class="text-lg">
                            Cardi B 深圳/杭州单场票房预测：
                            <strong>\${result.output.conservative.value.toFixed(2)}</strong> ~ 
                            <strong>\${result.output.aggressive.value.toFixed(2)}</strong> 百万元
                        </p>
                        <p class="text-purple-200 mt-2">
                            中性情景约 <strong>\${result.output.neutral.value.toFixed(2)}</strong> 百万元
                            （约 \${(result.output.neutral.value * 100).toFixed(0)} 万元）
                        </p>
                    </div>
                </div>
            \`;
        }
        
        // ==================== 动态数据结构 ====================
        // 默认权重参数
        let weightParams = [
            { id: 'baidu', name: '百度指数', value: 0.45, icon: 'fab fa-searchengin', color: 'blue', unit: '' },
            { id: 'netease', name: '网易云粉丝', value: 0.35, icon: 'fas fa-music', color: 'red', unit: '万' },
            { id: 'xhs', name: '小红书粉丝', value: 0.20, icon: 'fas fa-book-open', color: 'pink', unit: '万' }
        ];
        
        // 默认锚点数据
        let benchmarks = [
            { id: 'travis', name: 'Travis Scott', boxOffice: 78.15, city: '长沙', tier: 'tier3', data: { baidu: 280, netease: 126.6, xhs: 1.0 }},
            { id: 'kanye', name: 'Kanye West', boxOffice: 51.00, city: '澳门', tier: 'tier3', data: { baidu: 616, netease: 99.7, xhs: 13.9 }}
        ];
        
        // ==================== 初始化渲染 ====================
        function initPredictPanel() {
            renderArtistDataInputs();
            renderWeightParams();
            renderBenchmarks();
        }
        
        // 艺人输入数据存储（用于保留用户输入值）
        let artistInputValues = {
            baidu: 388,
            netease: 80.6,
            xhs: 82
        };
        
        // 渲染艺人数据输入区
        function renderArtistDataInputs() {
            const container = document.getElementById('artist-data-inputs');
            container.innerHTML = weightParams.map((p, idx) => \`
                <div class="flex items-center gap-3 bg-gray-50 rounded-lg p-3" data-dim-id="\${p.id}">
                    <div class="w-10 h-10 bg-\${p.color}-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <i class="\${p.icon} text-\${p.color}-500"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2 mb-1">
                            <input type="text" value="\${p.name}" 
                                onchange="updateDimensionName('\${p.id}', this.value)"
                                onblur="updateDimensionName('\${p.id}', this.value)"
                                class="text-sm font-medium text-gray-700 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-purple-500 focus:outline-none px-1 py-0.5 -ml-1 max-w-[120px]"
                                title="点击编辑维度名称">
                            \${p.unit ? '<span class="text-xs text-gray-400">(' + p.unit + ')</span>' : ''}
                            <i class="fas fa-pencil-alt text-gray-300 text-xs" title="可编辑"></i>
                        </div>
                        <input type="number" id="input-\${p.id}" value="\${artistInputValues[p.id] ?? getDefaultValue(p.id)}" step="0.1"
                            onchange="artistInputValues['\${p.id}'] = parseFloat(this.value) || 0"
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                    </div>
                    <button onclick="removeArtistDataDimension('\${p.id}')" 
                        class="px-2 py-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-all flex-shrink-0"
                        title="删除此维度">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            \`).join('');
            
            // 显示维度数量提示
            const countHint = document.getElementById('dimension-count-hint');
            if (countHint) {
                countHint.textContent = \`当前 \${weightParams.length} 个维度\`;
            }
        }
        
        // 更新维度名称（统一函数，同步更新艺人输入区和权重区）
        function updateDimensionName(id, name) {
            const param = weightParams.find(p => p.id === id);
            if (param && param.name !== name) {
                param.name = name;
                // 重新渲染两个区域以保持同步
                renderArtistDataInputs();
                renderWeightParams();
                renderBenchmarks();
            }
        }
        
        function getDefaultValue(id) {
            const defaults = { baidu: 388, netease: 80.6, xhs: 82 };
            return defaults[id] || 100;
        }
        
        // 添加艺人数据维度
        function addArtistDataDimension() {
            const newId = 'dim_' + Date.now();
            const colors = ['blue', 'red', 'pink', 'green', 'yellow', 'indigo', 'purple', 'teal'];
            const icons = ['fas fa-chart-bar', 'fas fa-users', 'fas fa-heart', 'fas fa-star', 'fas fa-fire', 'fas fa-bolt'];
            
            weightParams.push({
                id: newId,
                name: '新维度',
                value: 0.10,
                icon: icons[weightParams.length % icons.length],
                color: colors[weightParams.length % colors.length],
                unit: ''
            });
            
            // 设置默认输入值
            artistInputValues[newId] = 100;
            
            // 同时更新锚点数据中的该维度
            benchmarks.forEach(b => {
                if (!b.data[newId]) b.data[newId] = 100;
            });
            
            renderArtistDataInputs();
            renderWeightParams();
            renderBenchmarks();
        }
        
        // 删除艺人数据维度
        function removeArtistDataDimension(id) {
            if (weightParams.length <= 1) {
                alert('至少需要保留一个维度');
                return;
            }
            
            // 从权重参数中移除
            weightParams = weightParams.filter(p => p.id !== id);
            
            // 从艺人输入值中移除
            delete artistInputValues[id];
            
            // 从锚点数据中移除
            benchmarks.forEach(b => delete b.data[id]);
            
            renderArtistDataInputs();
            renderWeightParams();
            renderBenchmarks();
        }
        
        // 渲染权重参数列表
        function renderWeightParams() {
            const container = document.getElementById('weight-params-list');
            container.innerHTML = weightParams.map((p, idx) => \`
                <div class="flex items-center gap-2 bg-white rounded-lg p-2" data-id="\${p.id}">
                    <input type="text" value="\${p.name}" 
                        onchange="updateWeightName('\${p.id}', this.value)"
                        class="flex-1 px-2 py-1 border rounded text-sm">
                    <input type="number" value="\${p.value}" step="0.05" min="0" max="1"
                        onchange="updateWeightValue('\${p.id}', this.value)"
                        class="w-20 px-2 py-1 border rounded text-sm text-right">
                    <button onclick="removeWeightParam('\${p.id}')" class="px-2 py-1 text-red-500 hover:bg-red-50 rounded">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            \`).join('');
            
            // 更新权重总和显示
            const total = weightParams.reduce((sum, p) => sum + p.value, 0);
            const totalEl = container.parentElement.querySelector('.text-xs');
            if (totalEl) {
                totalEl.innerHTML = \`<i class="fas fa-info-circle mr-1"></i>权重之和: \${total.toFixed(2)} \${Math.abs(total - 1) > 0.01 ? '(建议为1.0)' : '✓'}\`;
            }
        }
        
        // 渲染锚点数据列表
        function renderBenchmarks() {
            const container = document.getElementById('benchmark-list');
            container.innerHTML = benchmarks.map((b, idx) => \`
                <div class="bg-white rounded-lg p-4 border border-orange-200" data-id="\${b.id}">
                    <div class="flex justify-between items-start mb-3">
                        <input type="text" value="\${b.name}" 
                            onchange="updateBenchmark('\${b.id}', 'name', this.value)"
                            class="font-medium text-gray-800 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-orange-500 focus:outline-none">
                        <button onclick="removeBenchmark('\${b.id}')" class="text-red-400 hover:text-red-600 text-sm">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                    <div class="grid grid-cols-2 gap-2 text-sm">
                        <div>
                            <label class="text-xs text-gray-500">单场票房(百万)</label>
                            <input type="number" value="\${b.boxOffice}" step="0.01"
                                onchange="updateBenchmark('\${b.id}', 'boxOffice', parseFloat(this.value))"
                                class="w-full px-2 py-1 border rounded mt-1">
                        </div>
                        <div>
                            <label class="text-xs text-gray-500">城市</label>
                            <input type="text" value="\${b.city || ''}" 
                                onchange="updateBenchmark('\${b.id}', 'city', this.value)"
                                class="w-full px-2 py-1 border rounded mt-1">
                        </div>
                        <div class="col-span-2">
                            <label class="text-xs text-gray-500 mb-1 block">
                                <i class="fas fa-map-marker-alt mr-1 text-orange-500"></i>锚点城市级别
                            </label>
                            <div class="flex gap-1">
                                <label class="flex-1 flex items-center justify-center p-2 border rounded cursor-pointer transition-all \${b.tier === 'tier1' ? 'bg-purple-100 border-purple-400 text-purple-700' : 'bg-white hover:bg-gray-50'}">
                                    <input type="radio" name="tier-\${b.id}" value="tier1" \${b.tier === 'tier1' ? 'checked' : ''}
                                        onchange="updateBenchmark('\${b.id}', 'tier', 'tier1'); renderBenchmarks();"
                                        class="hidden">
                                    <span class="text-xs font-medium">一线</span>
                                </label>
                                <label class="flex-1 flex items-center justify-center p-2 border rounded cursor-pointer transition-all \${b.tier === 'tier2' ? 'bg-blue-100 border-blue-400 text-blue-700' : 'bg-white hover:bg-gray-50'}">
                                    <input type="radio" name="tier-\${b.id}" value="tier2" \${b.tier === 'tier2' ? 'checked' : ''}
                                        onchange="updateBenchmark('\${b.id}', 'tier', 'tier2'); renderBenchmarks();"
                                        class="hidden">
                                    <span class="text-xs font-medium">二线</span>
                                </label>
                                <label class="flex-1 flex items-center justify-center p-2 border rounded cursor-pointer transition-all \${b.tier === 'tier3' ? 'bg-orange-100 border-orange-400 text-orange-700' : 'bg-white hover:bg-gray-50'}">
                                    <input type="radio" name="tier-\${b.id}" value="tier3" \${b.tier === 'tier3' ? 'checked' : ''}
                                        onchange="updateBenchmark('\${b.id}', 'tier', 'tier3'); renderBenchmarks();"
                                        class="hidden">
                                    <span class="text-xs font-medium">三线</span>
                                </label>
                            </div>
                        </div>
                        \${weightParams.map(w => \`
                        <div>
                            <label class="text-xs text-gray-500">\${w.name}</label>
                            <input type="number" value="\${b.data[w.id] || 0}" step="0.1"
                                onchange="updateBenchmarkData('\${b.id}', '\${w.id}', parseFloat(this.value))"
                                class="w-full px-2 py-1 border rounded mt-1">
                        </div>
                        \`).join('')}
                    </div>
                </div>
            \`).join('');
        }
        
        // ==================== 权重参数管理 ====================
        function addWeightParam() {
            // 复用艺人数据维度添加函数，保持同步
            addArtistDataDimension();
        }
        
        function removeWeightParam(id) {
            // 复用艺人数据维度删除函数，保持同步
            removeArtistDataDimension(id);
        }
        
        function updateWeightName(id, name) {
            // 复用统一的维度名称更新函数
            updateDimensionName(id, name);
        }
        
        function updateWeightValue(id, value) {
            const param = weightParams.find(p => p.id === id);
            if (param) param.value = parseFloat(value);
            renderWeightParams();
        }
        
        // ==================== 锚点数据管理 ====================
        function addBenchmark() {
            const newId = 'anchor_' + Date.now();
            const newData = {};
            weightParams.forEach(w => newData[w.id] = 100);
            benchmarks.push({
                id: newId,
                name: '新艺人',
                boxOffice: 50.00,
                city: '',
                tier: 'tier3',
                data: newData
            });
            renderBenchmarks();
        }
        
        function removeBenchmark(id) {
            if (benchmarks.length <= 1) {
                alert('至少需要保留一个锚点');
                return;
            }
            benchmarks = benchmarks.filter(b => b.id !== id);
            renderBenchmarks();
        }
        
        function updateBenchmark(id, field, value) {
            const benchmark = benchmarks.find(b => b.id === id);
            if (benchmark) benchmark[field] = value;
        }
        
        function updateBenchmarkData(id, dimId, value) {
            const benchmark = benchmarks.find(b => b.id === id);
            if (benchmark) benchmark.data[dimId] = value;
        }
        
        // ==================== 预测计算 ====================
        async function runPrediction() {
            // 收集艺人数据
            const artistData = {};
            weightParams.forEach(p => {
                const input = document.getElementById('input-' + p.id);
                artistData[p.id] = parseFloat(input?.value || 0);
            });
            
            // 获取目标城市
            const targetTier = document.querySelector('input[name="targetTier"]:checked')?.value || 'tier1';
            
            // 获取自定义参数
            const customParams = getCustomParams();
            
            try {
                const res = await fetch('/api/calculate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ artistData, customParams, targetTier })
                });
                
                const data = await res.json();
                
                if (data.error) {
                    throw new Error(data.error);
                }
                
                displayPredictionResult(data.result, targetTier);
            } catch (error) {
                alert('预测失败: ' + error.message);
            }
        }
        
        function displayPredictionResult(result, targetTier) {
            const container = document.getElementById('prediction-result');
            const tierNames = { tier1: '一线城市', tier2: '二线城市', tier3: '三线城市' };
            const tierColors = { tier1: 'purple', tier2: 'blue', tier3: 'orange' };
            
            container.innerHTML = \`
                <div class="fade-in space-y-4">
                    <div class="text-center mb-4">
                        <span class="inline-block px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                            <i class="fas fa-map-marker-alt mr-1"></i>目标：\${tierNames[targetTier]}
                        </span>
                    </div>
                    
                    <!-- 票房预测 -->
                    <div class="space-y-2">
                        <div class="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                            <span class="text-yellow-700 font-medium">保守 (×\${result.output.conservative.premium})</span>
                            <span class="text-lg font-bold text-yellow-700">\${result.output.conservative.value.toFixed(2)} 百万</span>
                        </div>
                        <div class="flex justify-between items-center p-4 bg-purple-100 rounded-lg border-2 border-purple-300">
                            <span class="text-purple-700 font-medium">中性 (×\${result.output.neutral.premium})</span>
                            <div class="text-right">
                                <span class="text-2xl font-bold text-purple-700">\${result.output.neutral.value.toFixed(2)}</span>
                                <span class="text-purple-600 text-sm ml-1">百万</span>
                            </div>
                        </div>
                        <div class="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                            <span class="text-green-700 font-medium">激进 (×\${result.output.aggressive.premium})</span>
                            <span class="text-lg font-bold text-green-700">\${result.output.aggressive.value.toFixed(2)} 百万</span>
                        </div>
                    </div>
                    
                    <!-- 锚点校准详情 -->
                    <div class="bg-orange-50 rounded-lg p-3 mt-4">
                        <p class="text-sm text-orange-700 font-medium mb-2">
                            <i class="fas fa-anchor mr-1"></i>锚点校准详情
                        </p>
                        <div class="space-y-2">
                            \${(result.anchorResults || []).map(a => \`
                                <div class="flex items-center justify-between text-sm bg-white rounded p-2">
                                    <div class="flex items-center gap-2">
                                        <span class="font-medium">\${a.name}</span>
                                        <span class="px-1.5 py-0.5 text-xs rounded \${
                                            a.anchorTier === 'tier1' ? 'bg-purple-100 text-purple-600' :
                                            a.anchorTier === 'tier2' ? 'bg-blue-100 text-blue-600' :
                                            'bg-orange-100 text-orange-600'
                                        }">\${tierNames[a.anchorTier] || '三线城市'}</span>
                                    </div>
                                    <span class="text-gray-600">→ 三线基准: \${a.tier3BoxOffice.toFixed(2)}百万</span>
                                </div>
                            \`).join('')}
                        </div>
                        <p class="text-gray-500 text-xs mt-2">
                            三线基准范围: \${result.tier3.min.toFixed(2)} ~ \${result.tier3.max.toFixed(2)} 百万
                        </p>
                    </div>
                    
                    <!-- 指数详情 -->
                    <details class="mt-4">
                        <summary class="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
                            <i class="fas fa-info-circle mr-1"></i>查看计算指数
                        </summary>
                        <div class="mt-2 p-3 bg-gray-100 rounded text-sm">
                            \${result.indices.filter(i => i.id === 'target').map(t => \`
                                <p>D: \${t.D.toFixed(4)} | LC: \${t.LC.toFixed(4)} | F: \${t.F.toFixed(4)}</p>
                            \`).join('')}
                        </div>
                    </details>
                    
                    <!-- 建档按钮 -->
                    <button onclick="showArchiveDialog()" 
                        class="w-full mt-4 py-2 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 transition-all">
                        <i class="fas fa-folder-plus mr-2"></i>建立档案
                    </button>
                </div>
            \`;
            
            // 保存当前预测结果供建档使用
            window.currentPredictionResult = result;
            window.currentTargetTier = targetTier;
        }
        
        // ==================== 参数管理 ====================
        function getCustomParams() {
            // 收集权重
            const weights = weightParams.map(p => ({
                id: p.id,
                name: p.name,
                value: p.value,
                icon: p.icon,
                color: p.color
            }));
            
            // 收集LC参数
            const lc = {
                constant: parseFloat(document.getElementById('param-lc-const')?.value || 0.60),
                netease_coef: parseFloat(document.getElementById('param-lc-netease')?.value || 0.40),
                xhs_coef: parseFloat(document.getElementById('param-lc-xhs')?.value || -0.20),
                min: 0.60,
                max: 1.00
            };
            
            // 收集城市级别乘数配置
            const cityTiers = {
                tier1: { name: '一线城市', multiplier: 1.0 },
                tier2: { name: '二线城市', multiplier: 0.85 },
                tier3: { name: '三线城市', multiplier: 0.70 }
            };
            
            // 收集城市溢价（从三线到各级别的溢价）
            const tierPremiums = {
                toTier1: {
                    conservative: parseFloat(document.getElementById('tier1-conservative')?.value || 1.15),
                    neutral: parseFloat(document.getElementById('tier1-neutral')?.value || 1.25),
                    aggressive: parseFloat(document.getElementById('tier1-aggressive')?.value || 1.35)
                },
                toTier2: {
                    conservative: parseFloat(document.getElementById('tier2-conservative')?.value || 0.95),
                    neutral: parseFloat(document.getElementById('tier2-neutral')?.value || 1.05),
                    aggressive: parseFloat(document.getElementById('tier2-aggressive')?.value || 1.15)
                },
                toTier3: {
                    conservative: parseFloat(document.getElementById('tier3-conservative')?.value || 0.85),
                    neutral: parseFloat(document.getElementById('tier3-neutral')?.value || 0.95),
                    aggressive: parseFloat(document.getElementById('tier3-aggressive')?.value || 1.05)
                }
            };
            
            // 锚点数据（包含城市级别）
            const benchmarksWithTier = benchmarks.map(b => ({
                ...b,
                tier: b.tier || 'tier3'  // 确保每个锚点都有tier属性
            }));
            
            return { weights, lc, cityTiers, tierPremiums, benchmarks: benchmarksWithTier };
        }
        
        function saveAllParams() {
            // 先同步当前输入框的值到 artistInputValues
            weightParams.forEach(p => {
                const input = document.getElementById('input-' + p.id);
                if (input) {
                    artistInputValues[p.id] = parseFloat(input.value) || 0;
                }
            });
            
            const params = {
                weightParams,
                benchmarks,
                artistInputValues,  // 保存艺人输入值
                lc: {
                    constant: parseFloat(document.getElementById('param-lc-const')?.value || 0.60),
                    netease_coef: parseFloat(document.getElementById('param-lc-netease')?.value || 0.40),
                    xhs_coef: parseFloat(document.getElementById('param-lc-xhs')?.value || -0.20)
                },
                tierPremiums: {
                    toTier1: {
                        conservative: parseFloat(document.getElementById('tier1-conservative')?.value || 1.15),
                        neutral: parseFloat(document.getElementById('tier1-neutral')?.value || 1.25),
                        aggressive: parseFloat(document.getElementById('tier1-aggressive')?.value || 1.35)
                    },
                    toTier2: {
                        conservative: parseFloat(document.getElementById('tier2-conservative')?.value || 0.95),
                        neutral: parseFloat(document.getElementById('tier2-neutral')?.value || 1.05),
                        aggressive: parseFloat(document.getElementById('tier2-aggressive')?.value || 1.15)
                    },
                    toTier3: {
                        conservative: parseFloat(document.getElementById('tier3-conservative')?.value || 0.85),
                        neutral: parseFloat(document.getElementById('tier3-neutral')?.value || 0.95),
                        aggressive: parseFloat(document.getElementById('tier3-aggressive')?.value || 1.05)
                    }
                }
            };
            localStorage.setItem('comparableParamsV2', JSON.stringify(params));
            alert('参数已保存');
        }
        
        function resetAllParams() {
            if (confirm('确定要重置所有参数为默认值吗？')) {
                localStorage.removeItem('comparableParamsV2');
                location.reload();
            }
        }
        
        function generateCalculationDetails(calc) {
            const targetIdx = calc.indices.find(i => i.id === 'target');
            return \`
                <div class="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <p class="font-medium">归一化最大值</p>
                        \${Object.entries(calc.normalization.maxValues || {}).map(([k, v]) => \`<p>\${k}: \${v}</p>\`).join('')}
                    </div>
                    <div>
                        <p class="font-medium">目标艺人指数</p>
                        <p>D: \${targetIdx?.D?.toFixed(4) || '-'}</p>
                        <p>LC: \${targetIdx?.LC?.toFixed(4) || '-'}</p>
                        <p>F: \${targetIdx?.F?.toFixed(4) || '-'}</p>
                    </div>
                    <div class="col-span-2">
                        <p class="font-medium">锚点校准</p>
                        \${(calc.anchorResults || []).map(a => \`<p>\${a.name}: ratio=\${a.ratio.toFixed(3)} → \${a.tier3BoxOffice.toFixed(2)}百万</p>\`).join('')}
                    </div>
                </div>
            \`;
        }
        
        // 加载保存的参数
        window.addEventListener('load', () => {
            const saved = localStorage.getItem('comparableParamsV2');
            if (saved) {
                try {
                    const params = JSON.parse(saved);
                    if (params.weightParams) weightParams = params.weightParams;
                    if (params.benchmarks) benchmarks = params.benchmarks;
                    if (params.artistInputValues) artistInputValues = params.artistInputValues;  // 加载艺人输入值
                    if (params.lc) {
                        setTimeout(() => {
                            document.getElementById('param-lc-const').value = params.lc.constant;
                            document.getElementById('param-lc-netease').value = params.lc.netease_coef;
                            document.getElementById('param-lc-xhs').value = params.lc.xhs_coef;
                        }, 100);
                    }
                    if (params.tierPremiums) {
                        setTimeout(() => {
                            document.getElementById('tier1-conservative').value = params.tierPremiums.toTier1?.conservative || 1.15;
                            document.getElementById('tier1-neutral').value = params.tierPremiums.toTier1?.neutral || 1.25;
                            document.getElementById('tier1-aggressive').value = params.tierPremiums.toTier1?.aggressive || 1.35;
                            document.getElementById('tier2-conservative').value = params.tierPremiums.toTier2?.conservative || 0.95;
                            document.getElementById('tier2-neutral').value = params.tierPremiums.toTier2?.neutral || 1.05;
                            document.getElementById('tier2-aggressive').value = params.tierPremiums.toTier2?.aggressive || 1.15;
                            document.getElementById('tier3-conservative').value = params.tierPremiums.toTier3?.conservative || 0.85;
                            document.getElementById('tier3-neutral').value = params.tierPremiums.toTier3?.neutral || 0.95;
                            document.getElementById('tier3-aggressive').value = params.tierPremiums.toTier3?.aggressive || 1.05;
                        }, 100);
                    }
                } catch (e) {
                    console.error('加载保存的参数失败:', e);
                }
            }
            
            // 初始化预测面板
            setTimeout(initPredictPanel, 50);
            
            // 加载艺人档案
            setTimeout(loadArtistArchives, 100);
        });
        
        // ==================== 艺人档案管理 ====================
        let artistArchives = [];  // 档案数组
        
        // 加载档案
        function loadArtistArchives() {
            const saved = localStorage.getItem('artistArchives');
            if (saved) {
                try {
                    artistArchives = JSON.parse(saved);
                } catch (e) {
                    artistArchives = [];
                }
            }
            renderArchiveList();
        }
        
        // 保存档案到本地存储
        function saveArtistArchives() {
            localStorage.setItem('artistArchives', JSON.stringify(artistArchives));
            renderArchiveList();
        }
        
        // 显示建档对话框
        function showArchiveDialog() {
            if (!window.currentPredictionResult) {
                alert('请先进行预测');
                return;
            }
            
            const artistName = document.getElementById('artist-search-input')?.value?.trim() || '';
            
            // 创建对话框
            const dialog = document.createElement('div');
            dialog.id = 'archive-dialog';
            dialog.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
            dialog.innerHTML = \`
                <div class="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4 fade-in">
                    <h3 class="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <i class="fas fa-folder-plus text-amber-500"></i>
                        建立艺人档案
                    </h3>
                    
                    <div class="space-y-4">
                        <div>
                            <label class="text-sm font-medium text-gray-700 block mb-1">艺人名称 *</label>
                            <input type="text" id="archive-artist-name" value="\${artistName}" 
                                placeholder="输入艺人名称"
                                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500">
                        </div>
                        
                        <div>
                            <label class="text-sm font-medium text-gray-700 block mb-1">备注（可选）</label>
                            <textarea id="archive-notes" rows="2" 
                                placeholder="添加备注信息..."
                                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 resize-none"></textarea>
                        </div>
                        
                        <div class="bg-amber-50 rounded-lg p-3">
                            <p class="text-sm text-amber-700 font-medium mb-2">将保存以下数据：</p>
                            <ul class="text-xs text-amber-600 space-y-1">
                                <li>• 平台数据（百度指数、网易云、小红书等）</li>
                                <li>• 预测结果（保守/中性/激进）</li>
                                <li>• 目标城市级别</li>
                                <li>• 建档时间</li>
                            </ul>
                        </div>
                    </div>
                    
                    <div class="flex gap-3 mt-6">
                        <button onclick="closeArchiveDialog()" 
                            class="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all">
                            取消
                        </button>
                        <button onclick="confirmArchive()" 
                            class="flex-1 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-all">
                            <i class="fas fa-check mr-1"></i>确认建档
                        </button>
                    </div>
                </div>
            \`;
            document.body.appendChild(dialog);
            
            // 聚焦到名称输入框
            setTimeout(() => {
                document.getElementById('archive-artist-name')?.focus();
            }, 100);
        }
        
        // 关闭对话框
        function closeArchiveDialog() {
            const dialog = document.getElementById('archive-dialog');
            if (dialog) dialog.remove();
        }
        
        // 确认建档
        function confirmArchive() {
            const artistName = document.getElementById('archive-artist-name')?.value?.trim();
            const notes = document.getElementById('archive-notes')?.value?.trim();
            
            if (!artistName) {
                alert('请输入艺人名称');
                return;
            }
            
            // 收集当前输入的艺人数据
            const inputData = {};
            weightParams.forEach(p => {
                const input = document.getElementById('input-' + p.id);
                inputData[p.id] = parseFloat(input?.value || 0);
            });
            
            // 创建档案记录
            const archive = {
                id: 'archive_' + Date.now(),
                artistName: artistName,
                notes: notes || '',
                createdAt: new Date().toISOString(),
                inputData: inputData,
                targetTier: window.currentTargetTier,
                result: {
                    conservative: window.currentPredictionResult.output.conservative.value,
                    neutral: window.currentPredictionResult.output.neutral.value,
                    aggressive: window.currentPredictionResult.output.aggressive.value
                },
                indices: window.currentPredictionResult.indices?.find(i => i.id === 'target') || {}
            };
            
            // 添加到档案列表
            artistArchives.unshift(archive);  // 最新的在前面
            saveArtistArchives();
            
            closeArchiveDialog();
            showFillNotification(artistName, '档案已建立');
        }
        
        // 渲染档案列表
        function renderArchiveList() {
            const container = document.getElementById('artist-archive-list');
            const countEl = document.getElementById('archive-count');
            
            if (!container) return;
            
            if (countEl) {
                countEl.textContent = artistArchives.length + ' 条记录';
            }
            
            if (artistArchives.length === 0) {
                container.innerHTML = \`
                    <div class="text-center text-amber-400 py-6">
                        <i class="fas fa-archive text-2xl mb-2"></i>
                        <p class="text-sm">暂无档案</p>
                        <p class="text-xs mt-1">完成预测后可建档保存</p>
                    </div>
                \`;
                return;
            }
            
            const tierNames = { tier1: '一线', tier2: '二线', tier3: '三线' };
            
            container.innerHTML = artistArchives.map(a => \`
                <div class="bg-white rounded-lg p-3 border border-amber-100 hover:border-amber-300 transition-all cursor-pointer group"
                    onclick="showArchiveDetail('\${a.id}')">
                    <div class="flex justify-between items-start">
                        <div class="flex-1 min-w-0">
                            <p class="font-medium text-gray-800 truncate">\${a.artistName}</p>
                            <p class="text-xs text-gray-400 mt-1">
                                \${new Date(a.createdAt).toLocaleDateString('zh-CN')}
                                <span class="ml-2 px-1.5 py-0.5 bg-gray-100 rounded">\${tierNames[a.targetTier] || '一线'}</span>
                            </p>
                        </div>
                        <div class="text-right">
                            <p class="text-sm font-bold text-purple-600">\${a.result.neutral.toFixed(1)}</p>
                            <p class="text-xs text-gray-400">百万</p>
                        </div>
                    </div>
                    \${a.notes ? '<p class="text-xs text-gray-500 mt-2 truncate">' + a.notes + '</p>' : ''}
                    <div class="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-all">
                        <button onclick="event.stopPropagation(); loadArchiveData('\${a.id}')" 
                            class="flex-1 py-1 text-xs bg-purple-100 text-purple-600 rounded hover:bg-purple-200">
                            <i class="fas fa-redo mr-1"></i>复用
                        </button>
                        <button onclick="event.stopPropagation(); deleteArchive('\${a.id}')" 
                            class="px-2 py-1 text-xs text-red-500 hover:bg-red-50 rounded">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            \`).join('');
        }
        
        // 显示档案详情
        function showArchiveDetail(archiveId) {
            const archive = artistArchives.find(a => a.id === archiveId);
            if (!archive) return;
            
            const tierNames = { tier1: '一线城市', tier2: '二线城市', tier3: '三线城市' };
            
            const dialog = document.createElement('div');
            dialog.id = 'archive-detail-dialog';
            dialog.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
            dialog.innerHTML = \`
                <div class="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg mx-4 fade-in max-h-[90vh] overflow-y-auto">
                    <div class="flex justify-between items-start mb-4">
                        <div>
                            <h3 class="text-xl font-bold text-gray-800">\${archive.artistName}</h3>
                            <p class="text-sm text-gray-500">\${new Date(archive.createdAt).toLocaleString('zh-CN')}</p>
                        </div>
                        <button onclick="this.closest('#archive-detail-dialog').remove()" 
                            class="text-gray-400 hover:text-gray-600">
                            <i class="fas fa-times text-xl"></i>
                        </button>
                    </div>
                    
                    \${archive.notes ? '<p class="text-gray-600 mb-4 p-3 bg-gray-50 rounded-lg">' + archive.notes + '</p>' : ''}
                    
                    <!-- 输入数据 -->
                    <div class="bg-blue-50 rounded-lg p-4 mb-4">
                        <h4 class="font-medium text-blue-700 mb-2">
                            <i class="fas fa-database mr-1"></i>输入数据
                        </h4>
                        <div class="grid grid-cols-3 gap-2 text-sm">
                            \${Object.entries(archive.inputData).map(([key, val]) => {
                                const param = weightParams.find(p => p.id === key);
                                return \`
                                    <div class="bg-white rounded p-2 text-center">
                                        <p class="text-xs text-gray-500">\${param?.name || key}</p>
                                        <p class="font-bold text-gray-800">\${val}</p>
                                    </div>
                                \`;
                            }).join('')}
                        </div>
                    </div>
                    
                    <!-- 预测结果 -->
                    <div class="bg-purple-50 rounded-lg p-4 mb-4">
                        <h4 class="font-medium text-purple-700 mb-2">
                            <i class="fas fa-chart-line mr-1"></i>预测结果
                            <span class="text-sm font-normal ml-2">(\${tierNames[archive.targetTier]})</span>
                        </h4>
                        <div class="grid grid-cols-3 gap-2">
                            <div class="bg-yellow-100 rounded p-3 text-center">
                                <p class="text-xs text-yellow-600">保守</p>
                                <p class="text-lg font-bold text-yellow-700">\${archive.result.conservative.toFixed(2)}</p>
                                <p class="text-xs text-gray-500">百万</p>
                            </div>
                            <div class="bg-purple-100 rounded p-3 text-center border-2 border-purple-300">
                                <p class="text-xs text-purple-600">中性</p>
                                <p class="text-xl font-bold text-purple-700">\${archive.result.neutral.toFixed(2)}</p>
                                <p class="text-xs text-gray-500">百万</p>
                            </div>
                            <div class="bg-green-100 rounded p-3 text-center">
                                <p class="text-xs text-green-600">激进</p>
                                <p class="text-lg font-bold text-green-700">\${archive.result.aggressive.toFixed(2)}</p>
                                <p class="text-xs text-gray-500">百万</p>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 操作按钮 -->
                    <div class="flex gap-3">
                        <button onclick="loadArchiveData('\${archive.id}'); this.closest('#archive-detail-dialog').remove();" 
                            class="flex-1 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-all">
                            <i class="fas fa-redo mr-1"></i>复用此数据预测
                        </button>
                        <button onclick="deleteArchive('\${archive.id}'); this.closest('#archive-detail-dialog').remove();" 
                            class="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-all">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            \`;
            document.body.appendChild(dialog);
        }
        
        // 加载档案数据进行复用
        function loadArchiveData(archiveId) {
            const archive = artistArchives.find(a => a.id === archiveId);
            if (!archive) return;
            
            // 填充艺人名称
            const searchInput = document.getElementById('artist-search-input');
            if (searchInput) searchInput.value = archive.artistName;
            
            // 填充输入数据
            Object.entries(archive.inputData).forEach(([key, val]) => {
                artistInputValues[key] = val;
                const input = document.getElementById('input-' + key);
                if (input) {
                    input.value = val;
                    input.classList.add('ring-2', 'ring-amber-400');
                    setTimeout(() => input.classList.remove('ring-2', 'ring-amber-400'), 1000);
                }
            });
            
            // 设置目标城市
            const tierRadio = document.querySelector(\`input[name="targetTier"][value="\${archive.targetTier}"]\`);
            if (tierRadio) tierRadio.checked = true;
            
            showFillNotification(archive.artistName, '已加载档案数据，可进行预测');
        }
        
        // 删除档案
        function deleteArchive(archiveId) {
            if (!confirm('确定要删除此档案吗？')) return;
            
            artistArchives = artistArchives.filter(a => a.id !== archiveId);
            saveArtistArchives();
        }
        
        // 清空全部档案
        function clearAllArchives() {
            if (artistArchives.length === 0) {
                alert('暂无档案可清空');
                return;
            }
            
            if (!confirm(\`确定要清空全部 \${artistArchives.length} 条档案吗？此操作不可恢复。\`)) return;
            
            artistArchives = [];
            saveArtistArchives();
        }
    </script>
</body>
</html>`)
})

export default app
