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
  // 需求指数D的权重
  weights: {
    baidu: 0.45,
    netease: 0.35,
    xhs: 0.20
  },
  // 转化率LC的参数
  lc: {
    constant: 0.60,
    netease_coef: 0.40,
    xhs_coef: -0.20,
    min: 0.60,
    max: 1.00
  },
  // 城市溢价系数
  premium: {
    conservative: 1.15,
    neutral: 1.25,
    aggressive: 1.35
  },
  // Benchmark数据（三线城市真实单场票房）
  benchmarks: {
    travis: {
      name: 'Travis Scott',
      boxOffice: 78.15,  // 百万元
      baidu: 280,
      netease: 126.6,
      xhs: 1.0
    },
    kanye: {
      name: 'Kanye West',
      boxOffice: 51.00,  // 百万元
      baidu: 616,
      netease: 99.7,
      xhs: 13.9
    }
  }
}

// 计算函数
function calculateComparable(
  artistData: { baidu: number; netease: number; xhs: number },
  params = DEFAULT_PARAMS
) {
  const { benchmarks, weights, lc, premium } = params
  
  // 合并所有艺人数据用于归一化
  const allArtists = [
    { ...benchmarks.travis },
    { ...benchmarks.kanye },
    { ...artistData, name: 'Target' }
  ]
  
  // Step A: 归一化 (Max Normalization)
  const maxBaidu = Math.max(...allArtists.map(a => a.baidu))
  const maxNetease = Math.max(...allArtists.map(a => a.netease))
  const maxXhs = Math.max(...allArtists.map(a => a.xhs))
  
  const normalize = (artist: typeof allArtists[0]) => ({
    name: artist.name,
    baidu_norm: artist.baidu / maxBaidu,
    netease_norm: artist.netease / maxNetease,
    xhs_norm: artist.xhs / maxXhs
  })
  
  const normalized = allArtists.map(normalize)
  
  // Step B: 计算需求指数 D
  const calcD = (n: typeof normalized[0]) => 
    weights.baidu * n.baidu_norm + 
    weights.netease * n.netease_norm + 
    weights.xhs * n.xhs_norm
  
  // Step C: 计算转化率 LC
  const calcLC = (n: typeof normalized[0]) => {
    const raw = lc.constant + lc.netease_coef * n.netease_norm + lc.xhs_coef * n.xhs_norm
    return Math.min(Math.max(raw, lc.min), lc.max)  // clip
  }
  
  // Step D: 计算出票指数 F
  const indices = normalized.map(n => ({
    name: n.name,
    baidu_norm: n.baidu_norm,
    netease_norm: n.netease_norm,
    xhs_norm: n.xhs_norm,
    D: calcD(n),
    LC: calcLC(n),
    F: calcD(n) * calcLC(n)
  }))
  
  const travisIdx = indices.find(i => i.name === benchmarks.travis.name)!
  const kanyeIdx = indices.find(i => i.name === benchmarks.kanye.name)!
  const targetIdx = indices.find(i => i.name === 'Target')!
  
  // Step E: Comparable双锚点校准
  const r_CT = targetIdx.F / travisIdx.F  // 相对Travis
  const r_CK = targetIdx.F / kanyeIdx.F   // 相对Kanye
  
  const t3_from_travis = benchmarks.travis.boxOffice * r_CT
  const t3_from_kanye = benchmarks.kanye.boxOffice * r_CK
  
  // Step F: 城市溢价计算
  const conservative = t3_from_kanye * premium.conservative
  const neutral = ((t3_from_travis + t3_from_kanye) / 2) * premium.neutral
  const aggressive = t3_from_travis * premium.aggressive
  
  return {
    // 归一化最大值
    normalization: {
      maxBaidu,
      maxNetease,
      maxXhs
    },
    // 各艺人指数
    indices,
    // 比例映射
    ratios: {
      r_CT,
      r_CK
    },
    // 三线城市票房（双锚点）
    tier3: {
      from_travis: t3_from_travis,
      from_kanye: t3_from_kanye,
      range: [Math.min(t3_from_travis, t3_from_kanye), Math.max(t3_from_travis, t3_from_kanye)]
    },
    // 最终输出（深圳/杭州）
    output: {
      conservative: { value: conservative, label: '保守', premium: premium.conservative },
      neutral: { value: neutral, label: '中性', premium: premium.neutral },
      aggressive: { value: aggressive, label: '激进', premium: premium.aggressive },
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
    const { artistData, customParams } = body
    
    if (!artistData || !artistData.baidu || !artistData.netease || !artistData.xhs) {
      return c.json({ error: '缺少艺人数据：需要 baidu, netease, xhs 三个字段' }, 400)
    }
    
    // 合并自定义参数
    const params = customParams ? {
      weights: { ...DEFAULT_PARAMS.weights, ...customParams.weights },
      lc: { ...DEFAULT_PARAMS.lc, ...customParams.lc },
      premium: { ...DEFAULT_PARAMS.premium, ...customParams.premium },
      benchmarks: {
        travis: { ...DEFAULT_PARAMS.benchmarks.travis, ...customParams.benchmarks?.travis },
        kanye: { ...DEFAULT_PARAMS.benchmarks.kanye, ...customParams.benchmarks?.kanye }
      }
    } : DEFAULT_PARAMS
    
    const result = calculateComparable(artistData, params)
    
    return c.json({
      success: true,
      input: { artistData, params },
      result
    })
  } catch (error) {
    return c.json({ error: '计算失败', details: String(error) }, 500)
  }
})

// Cardi B 案例演示
app.get('/api/demo/cardib', (c) => {
  const cardiData = { baidu: 388, netease: 80.6, xhs: 82.0 }
  const result = calculateComparable(cardiData)
  
  return c.json({
    success: true,
    artist: 'Cardi B',
    input: cardiData,
    result,
    explanation: {
      step1: 'Step A: 归一化 - 各维度除以最大值，使数据可比',
      step2: 'Step B: D需求指数 = 0.45×百度\' + 0.35×网易云\' + 0.20×小红书\'',
      step3: 'Step C: LC转化率 = clip(0.60 + 0.40×网易云\' - 0.20×小红书\', 0.60, 1.00)',
      step4: 'Step D: F出票指数 = D × LC',
      step5: 'Step E: 双锚点校准 - 用F的比值映射到Travis和Kanye的真实票房',
      step6: 'Step F: 城市溢价 - 从三线城市调整到深圳/杭州'
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
                <button onclick="switchTab('ai')" id="tab-ai" class="tab-active py-4 px-2 text-sm font-medium">
                    <i class="fas fa-robot mr-2"></i>AI智能预测
                </button>
                <button onclick="switchTab('manual')" id="tab-manual" class="py-4 px-2 text-sm font-medium text-gray-500 hover:text-gray-700">
                    <i class="fas fa-calculator mr-2"></i>手动计算器
                </button>
                <button onclick="switchTab('cardib')" id="tab-cardib" class="py-4 px-2 text-sm font-medium text-gray-500 hover:text-gray-700">
                    <i class="fas fa-graduation-cap mr-2"></i>Cardi B案例讲解
                </button>
                <button onclick="switchTab('params')" id="tab-params" class="py-4 px-2 text-sm font-medium text-gray-500 hover:text-gray-700">
                    <i class="fas fa-cog mr-2"></i>参数设置
                </button>
            </div>
        </div>
    </nav>

    <!-- 主内容区 -->
    <main class="max-w-6xl mx-auto px-4 py-8">
        
        <!-- AI智能预测面板 -->
        <div id="panel-ai" class="space-y-6">
            <div class="glass rounded-2xl shadow-xl p-8">
                <div class="text-center mb-8">
                    <div class="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
                        <i class="fas fa-magic text-3xl text-purple-600"></i>
                    </div>
                    <h2 class="text-2xl font-bold text-gray-800">AI智能票房预测</h2>
                    <p class="text-gray-500 mt-2">输入任意欧美艺人名称，AI自动分析并预测票房</p>
                </div>
                
                <div class="max-w-xl mx-auto">
                    <div class="flex gap-4">
                        <div class="flex-1 relative">
                            <input type="text" id="ai-artist-input" 
                                placeholder="输入艺人英文名，如: Drake, Taylor Swift, Bad Bunny..."
                                autocomplete="off"
                                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg">
                            <!-- 自动补全下拉框 -->
                            <div id="autocomplete-dropdown" class="hidden absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                                <!-- 动态填充 -->
                            </div>
                        </div>
                        <button onclick="runAIAnalysis()" id="ai-analyze-btn"
                            class="px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-indigo-700 transition-all flex items-center gap-2">
                            <i class="fas fa-search"></i>
                            分析预测
                        </button>
                    </div>
                    
                    <!-- OpenAI Key 输入（可选） -->
                    <details class="mt-4">
                        <summary class="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
                            <i class="fas fa-key mr-1"></i>配置 OpenAI API Key（可选）
                        </summary>
                        <div class="mt-2 p-4 bg-gray-50 rounded-lg">
                            <input type="password" id="openai-key-input" 
                                placeholder="sk-..."
                                class="w-full px-3 py-2 border border-gray-300 rounded text-sm">
                            <p class="text-xs text-gray-400 mt-2">您的Key只在本地使用，不会被存储</p>
                        </div>
                    </details>
                </div>
                
                <!-- AI 分析结果 -->
                <div id="ai-result" class="mt-8 hidden">
                    <!-- 动态填充 -->
                </div>
            </div>
            
            <!-- 快速测试按钮 -->
            <div class="text-center">
                <p class="text-gray-500 mb-3">快速测试：</p>
                <div class="flex flex-wrap justify-center gap-2">
                    <button onclick="quickTest('Drake')" class="px-4 py-2 bg-white border border-gray-300 rounded-full text-sm hover:bg-gray-50">Drake</button>
                    <button onclick="quickTest('Taylor Swift')" class="px-4 py-2 bg-white border border-gray-300 rounded-full text-sm hover:bg-gray-50">Taylor Swift</button>
                    <button onclick="quickTest('Bad Bunny')" class="px-4 py-2 bg-white border border-gray-300 rounded-full text-sm hover:bg-gray-50">Bad Bunny</button>
                    <button onclick="quickTest('Dua Lipa')" class="px-4 py-2 bg-white border border-gray-300 rounded-full text-sm hover:bg-gray-50">Dua Lipa</button>
                    <button onclick="quickTest('Post Malone')" class="px-4 py-2 bg-white border border-gray-300 rounded-full text-sm hover:bg-gray-50">Post Malone</button>
                </div>
            </div>
        </div>

        <!-- 手动计算器面板 -->
        <div id="panel-manual" class="hidden space-y-6">
            <div class="grid md:grid-cols-2 gap-6">
                <!-- 输入区 -->
                <div class="glass rounded-2xl shadow-xl p-6">
                    <h3 class="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <i class="fas fa-edit text-purple-600"></i>
                        输入艺人数据
                    </h3>
                    
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">
                                <i class="fab fa-searchengin mr-1 text-blue-500"></i>百度指数
                            </label>
                            <input type="number" id="manual-baidu" value="388" 
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                            <p class="text-xs text-gray-400 mt-1">日均搜索量（参考：Kanye 616, Cardi B 388, Travis 280）</p>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">
                                <i class="fas fa-music mr-1 text-red-500"></i>网易云粉丝数（万）
                            </label>
                            <input type="number" id="manual-netease" value="80.6" step="0.1"
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                            <p class="text-xs text-gray-400 mt-1">参考：Travis 126.6万, Kanye 99.7万, Cardi B 80.6万</p>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">
                                <i class="fas fa-book-open mr-1 text-pink-500"></i>小红书粉丝数（万）
                            </label>
                            <input type="number" id="manual-xhs" value="82" step="0.1"
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                            <p class="text-xs text-gray-400 mt-1">参考：Cardi B 82万, Kanye 13.9万, Travis 1万</p>
                        </div>
                        
                        <button onclick="runManualCalculation()" 
                            class="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-indigo-700 transition-all">
                            <i class="fas fa-calculator mr-2"></i>开始计算
                        </button>
                    </div>
                </div>
                
                <!-- 结果区 -->
                <div class="glass rounded-2xl shadow-xl p-6">
                    <h3 class="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <i class="fas fa-chart-pie text-purple-600"></i>
                        计算结果
                    </h3>
                    
                    <div id="manual-result">
                        <div class="text-center text-gray-400 py-12">
                            <i class="fas fa-arrow-left text-4xl mb-4"></i>
                            <p>输入数据后点击"开始计算"</p>
                        </div>
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

        <!-- 参数设置面板 -->
        <div id="panel-params" class="hidden space-y-6">
            <div class="glass rounded-2xl shadow-xl p-6">
                <h3 class="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <i class="fas fa-sliders-h text-purple-600"></i>
                    模型参数配置
                </h3>
                
                <div class="grid md:grid-cols-3 gap-6">
                    <!-- D权重 -->
                    <div class="bg-gray-50 rounded-xl p-4">
                        <h4 class="font-medium text-gray-700 mb-4">
                            <i class="fas fa-balance-scale mr-2 text-blue-500"></i>
                            需求指数D权重
                        </h4>
                        <div class="space-y-3">
                            <div>
                                <label class="text-sm text-gray-600">百度指数权重</label>
                                <input type="number" id="param-w-baidu" value="0.45" step="0.05" min="0" max="1"
                                    class="w-full px-3 py-2 border rounded mt-1">
                            </div>
                            <div>
                                <label class="text-sm text-gray-600">网易云权重</label>
                                <input type="number" id="param-w-netease" value="0.35" step="0.05" min="0" max="1"
                                    class="w-full px-3 py-2 border rounded mt-1">
                            </div>
                            <div>
                                <label class="text-sm text-gray-600">小红书权重</label>
                                <input type="number" id="param-w-xhs" value="0.20" step="0.05" min="0" max="1"
                                    class="w-full px-3 py-2 border rounded mt-1">
                            </div>
                        </div>
                    </div>
                    
                    <!-- LC参数 -->
                    <div class="bg-gray-50 rounded-xl p-4">
                        <h4 class="font-medium text-gray-700 mb-4">
                            <i class="fas fa-exchange-alt mr-2 text-green-500"></i>
                            转化率LC参数
                        </h4>
                        <div class="space-y-3">
                            <div>
                                <label class="text-sm text-gray-600">基础常数</label>
                                <input type="number" id="param-lc-const" value="0.60" step="0.05" min="0" max="1"
                                    class="w-full px-3 py-2 border rounded mt-1">
                            </div>
                            <div>
                                <label class="text-sm text-gray-600">网易云系数</label>
                                <input type="number" id="param-lc-netease" value="0.40" step="0.05"
                                    class="w-full px-3 py-2 border rounded mt-1">
                            </div>
                            <div>
                                <label class="text-sm text-gray-600">小红书系数</label>
                                <input type="number" id="param-lc-xhs" value="-0.20" step="0.05"
                                    class="w-full px-3 py-2 border rounded mt-1">
                            </div>
                        </div>
                    </div>
                    
                    <!-- 城市溢价 -->
                    <div class="bg-gray-50 rounded-xl p-4">
                        <h4 class="font-medium text-gray-700 mb-4">
                            <i class="fas fa-city mr-2 text-purple-500"></i>
                            城市溢价系数
                        </h4>
                        <div class="space-y-3">
                            <div>
                                <label class="text-sm text-gray-600">保守情景</label>
                                <input type="number" id="param-p-conservative" value="1.15" step="0.05" min="1"
                                    class="w-full px-3 py-2 border rounded mt-1">
                            </div>
                            <div>
                                <label class="text-sm text-gray-600">中性情景</label>
                                <input type="number" id="param-p-neutral" value="1.25" step="0.05" min="1"
                                    class="w-full px-3 py-2 border rounded mt-1">
                            </div>
                            <div>
                                <label class="text-sm text-gray-600">激进情景</label>
                                <input type="number" id="param-p-aggressive" value="1.35" step="0.05" min="1"
                                    class="w-full px-3 py-2 border rounded mt-1">
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Benchmark数据 -->
                <div class="mt-6 bg-gray-50 rounded-xl p-4">
                    <h4 class="font-medium text-gray-700 mb-4">
                        <i class="fas fa-anchor mr-2 text-orange-500"></i>
                        Benchmark锚点数据（三线城市真实票房）
                    </h4>
                    <div class="grid md:grid-cols-2 gap-6">
                        <div class="bg-white rounded-lg p-4">
                            <h5 class="font-medium mb-3">Travis Scott</h5>
                            <div class="grid grid-cols-2 gap-3">
                                <div>
                                    <label class="text-xs text-gray-500">单场票房(百万)</label>
                                    <input type="number" id="param-travis-box" value="78.15" step="0.01"
                                        class="w-full px-2 py-1 border rounded text-sm mt-1">
                                </div>
                                <div>
                                    <label class="text-xs text-gray-500">百度指数</label>
                                    <input type="number" id="param-travis-baidu" value="280"
                                        class="w-full px-2 py-1 border rounded text-sm mt-1">
                                </div>
                                <div>
                                    <label class="text-xs text-gray-500">网易云(万)</label>
                                    <input type="number" id="param-travis-netease" value="126.6" step="0.1"
                                        class="w-full px-2 py-1 border rounded text-sm mt-1">
                                </div>
                                <div>
                                    <label class="text-xs text-gray-500">小红书(万)</label>
                                    <input type="number" id="param-travis-xhs" value="1.0" step="0.1"
                                        class="w-full px-2 py-1 border rounded text-sm mt-1">
                                </div>
                            </div>
                        </div>
                        <div class="bg-white rounded-lg p-4">
                            <h5 class="font-medium mb-3">Kanye West</h5>
                            <div class="grid grid-cols-2 gap-3">
                                <div>
                                    <label class="text-xs text-gray-500">单场票房(百万)</label>
                                    <input type="number" id="param-kanye-box" value="51.00" step="0.01"
                                        class="w-full px-2 py-1 border rounded text-sm mt-1">
                                </div>
                                <div>
                                    <label class="text-xs text-gray-500">百度指数</label>
                                    <input type="number" id="param-kanye-baidu" value="616"
                                        class="w-full px-2 py-1 border rounded text-sm mt-1">
                                </div>
                                <div>
                                    <label class="text-xs text-gray-500">网易云(万)</label>
                                    <input type="number" id="param-kanye-netease" value="99.7" step="0.1"
                                        class="w-full px-2 py-1 border rounded text-sm mt-1">
                                </div>
                                <div>
                                    <label class="text-xs text-gray-500">小红书(万)</label>
                                    <input type="number" id="param-kanye-xhs" value="13.9" step="0.1"
                                        class="w-full px-2 py-1 border rounded text-sm mt-1">
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="mt-6 flex gap-4">
                    <button onclick="saveParams()" class="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                        <i class="fas fa-save mr-2"></i>保存参数
                    </button>
                    <button onclick="resetParams()" class="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
                        <i class="fas fa-undo mr-2"></i>恢复默认
                    </button>
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
            const input = document.getElementById('ai-artist-input');
            const dropdown = document.getElementById('autocomplete-dropdown');
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
                         data-name="\${artist.name}" data-index="\${index}">
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
                        input.value = item.dataset.name;
                        dropdown.classList.add('hidden');
                        input.focus();
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
                    input.value = items[selectedIndex].dataset.name;
                    dropdown.classList.add('hidden');
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
        
        // ==================== AI 分析 ====================
        async function runAIAnalysis() {
            const artistName = document.getElementById('ai-artist-input').value.trim();
            if (!artistName) {
                alert('请输入艺人名称');
                return;
            }
            
            const btn = document.getElementById('ai-analyze-btn');
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>AI分析中...';
            
            try {
                const apiKey = document.getElementById('openai-key-input').value.trim();
                const customParams = getCustomParams();
                
                const res = await fetch('/api/ai/analyze', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        artistName, 
                        apiKey: apiKey || undefined,
                        customParams
                    })
                });
                
                const data = await res.json();
                
                if (data.error) {
                    throw new Error(data.error + (data.message ? ': ' + data.message : ''));
                }
                
                displayAIResult(data);
            } catch (error) {
                alert('分析失败: ' + error.message);
            } finally {
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-search"></i> 分析预测';
            }
        }
        
        function displayAIResult(data) {
            const container = document.getElementById('ai-result');
            container.classList.remove('hidden');
            
            const { ai, calculation, summary } = data;
            
            container.innerHTML = \`
                <div class="fade-in space-y-6">
                    <!-- 艺人信息 -->
                    <div class="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-6">
                        <div class="flex items-center gap-4 mb-4">
                            <div class="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                                \${summary.artistName.charAt(0)}
                            </div>
                            <div>
                                <h3 class="text-xl font-bold text-gray-800">\${summary.artistName}</h3>
                                \${summary.artistNameCn ? '<p class="text-gray-500">' + summary.artistNameCn + '</p>' : ''}
                                <span class="inline-block mt-1 px-2 py-0.5 text-xs rounded-full \${
                                    ai.confidence === 'high' ? 'bg-green-100 text-green-700' :
                                    ai.confidence === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-red-100 text-red-700'
                                }">
                                    数据可信度: \${ai.confidence}
                                </span>
                            </div>
                        </div>
                        <p class="text-gray-600 text-sm">\${ai.reasoning}</p>
                        \${ai.notes ? '<p class="text-gray-500 text-sm mt-2 italic">' + ai.notes + '</p>' : ''}
                    </div>
                    
                    <!-- 数据输入 -->
                    <div class="grid grid-cols-3 gap-4">
                        <div class="bg-blue-50 rounded-xl p-4 text-center">
                            <i class="fab fa-searchengin text-blue-500 text-2xl mb-2"></i>
                            <p class="text-sm text-gray-500">百度指数</p>
                            <p class="text-2xl font-bold text-gray-800">\${ai.data.baidu}</p>
                        </div>
                        <div class="bg-red-50 rounded-xl p-4 text-center">
                            <i class="fas fa-music text-red-500 text-2xl mb-2"></i>
                            <p class="text-sm text-gray-500">网易云粉丝</p>
                            <p class="text-2xl font-bold text-gray-800">\${ai.data.netease}万</p>
                        </div>
                        <div class="bg-pink-50 rounded-xl p-4 text-center">
                            <i class="fas fa-book-open text-pink-500 text-2xl mb-2"></i>
                            <p class="text-sm text-gray-500">小红书粉丝</p>
                            <p class="text-2xl font-bold text-gray-800">\${ai.data.xhs}万</p>
                        </div>
                    </div>
                    
                    <!-- 票房预测 -->
                    <div class="bg-white rounded-xl border-2 border-purple-200 p-6">
                        <h4 class="text-lg font-bold text-gray-800 mb-4 text-center">
                            <i class="fas fa-ticket-alt text-purple-600 mr-2"></i>
                            深圳/杭州 单场票房预测
                        </h4>
                        <div class="grid grid-cols-3 gap-4">
                            <div class="text-center p-4 bg-yellow-50 rounded-lg">
                                <p class="text-sm text-yellow-600 font-medium">保守</p>
                                <p class="text-2xl font-bold text-yellow-700">\${calculation.output.conservative.value.toFixed(2)}</p>
                                <p class="text-xs text-gray-500">百万元</p>
                                <p class="text-sm text-yellow-600 mt-1">\${(calculation.output.conservative.value * 100).toFixed(0)}万</p>
                            </div>
                            <div class="text-center p-4 bg-purple-100 rounded-lg border-2 border-purple-300">
                                <p class="text-sm text-purple-600 font-medium">中性</p>
                                <p class="text-3xl font-bold text-purple-700">\${calculation.output.neutral.value.toFixed(2)}</p>
                                <p class="text-xs text-gray-500">百万元</p>
                                <p class="text-sm text-purple-600 mt-1">\${(calculation.output.neutral.value * 100).toFixed(0)}万</p>
                            </div>
                            <div class="text-center p-4 bg-green-50 rounded-lg">
                                <p class="text-sm text-green-600 font-medium">激进</p>
                                <p class="text-2xl font-bold text-green-700">\${calculation.output.aggressive.value.toFixed(2)}</p>
                                <p class="text-xs text-gray-500">百万元</p>
                                <p class="text-sm text-green-600 mt-1">\${(calculation.output.aggressive.value * 100).toFixed(0)}万</p>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 计算详情（折叠） -->
                    <details class="bg-gray-50 rounded-xl">
                        <summary class="p-4 cursor-pointer font-medium text-gray-700 hover:bg-gray-100 rounded-xl">
                            <i class="fas fa-info-circle mr-2"></i>查看详细计算过程
                        </summary>
                        <div class="p-4 pt-0 space-y-4">
                            \${generateCalculationDetails(calculation)}
                        </div>
                    </details>
                </div>
            \`;
        }
        
        function quickTest(name) {
            document.getElementById('ai-artist-input').value = name;
            runAIAnalysis();
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
                            <p class="text-sm">max(百度)=\${result.normalization.maxBaidu}, max(网易云)=\${result.normalization.maxNetease}, max(小红书)=\${result.normalization.maxXhs}</p>
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
                                        <tr class="\${i.name === 'Target' ? 'bg-yellow-50 font-bold' : ''}">
                                            <td class="p-2">\${i.name === 'Target' ? 'Cardi B' : i.name}</td>
                                            <td class="p-2 text-right">\${i.baidu_norm.toFixed(3)}</td>
                                            <td class="p-2 text-right">\${i.netease_norm.toFixed(3)}</td>
                                            <td class="p-2 text-right">\${i.xhs_norm.toFixed(3)}</td>
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
                            <p class="text-sm font-mono">D = 0.45×百度' + 0.35×网易云' + 0.20×小红书'</p>
                        </div>
                        <div class="mt-4 grid grid-cols-3 gap-4">
                            \${result.indices.map(i => \`
                                <div class="text-center p-3 \${i.name === 'Target' ? 'bg-yellow-100 rounded-lg' : ''}">
                                    <p class="text-sm text-gray-500">\${i.name === 'Target' ? 'Cardi B' : i.name}</p>
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
                                <div class="text-center p-3 \${i.name === 'Target' ? 'bg-yellow-100 rounded-lg' : ''}">
                                    <p class="text-sm text-gray-500">\${i.name === 'Target' ? 'Cardi B' : i.name}</p>
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
                                <div class="text-center p-3 \${i.name === 'Target' ? 'bg-yellow-100 rounded-lg' : ''}">
                                    <p class="text-sm text-gray-500">\${i.name === 'Target' ? 'Cardi B' : i.name}</p>
                                    <p class="text-xl font-bold">\${i.F.toFixed(3)}</p>
                                </div>
                            \`).join('')}
                        </div>
                    </div>
                    
                    <!-- Step E: 双锚点 -->
                    <div class="step-card bg-white rounded-xl shadow p-6 border-l-4 border-red-500">
                        <div class="flex items-center gap-3 mb-4">
                            <span class="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center font-bold">E</span>
                            <h4 class="text-lg font-bold text-gray-800">双锚点校准 (Comparable)</h4>
                        </div>
                        <p class="text-gray-600 mb-4">\${explanation.step5}</p>
                        <div class="grid md:grid-cols-2 gap-4">
                            <div class="bg-red-50 rounded-lg p-4">
                                <p class="font-medium text-red-700">Travis Scott 锚点</p>
                                <p class="text-sm mt-2">r_CT = F_Cardi / F_Travis = \${result.ratios.r_CT.toFixed(3)}</p>
                                <p class="text-sm">三线票房 = 78.15 × \${result.ratios.r_CT.toFixed(3)} = <strong>\${result.tier3.from_travis.toFixed(2)} 百万元</strong></p>
                            </div>
                            <div class="bg-amber-50 rounded-lg p-4">
                                <p class="font-medium text-amber-700">Kanye West 锚点</p>
                                <p class="text-sm mt-2">r_CK = F_Cardi / F_Kanye = \${result.ratios.r_CK.toFixed(3)}</p>
                                <p class="text-sm">三线票房 = 51.00 × \${result.ratios.r_CK.toFixed(3)} = <strong>\${result.tier3.from_kanye.toFixed(2)} 百万元</strong></p>
                            </div>
                        </div>
                        <div class="mt-4 bg-gray-100 rounded-lg p-4 text-center">
                            <p class="text-sm text-gray-600">三线城市单场票房区间</p>
                            <p class="text-xl font-bold text-gray-800">\${result.tier3.from_kanye.toFixed(2)} ~ \${result.tier3.from_travis.toFixed(2)} 百万元</p>
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
        
        // ==================== 参数管理 ====================
        function getCustomParams() {
            return {
                weights: {
                    baidu: parseFloat(document.getElementById('param-w-baidu')?.value || 0.45),
                    netease: parseFloat(document.getElementById('param-w-netease')?.value || 0.35),
                    xhs: parseFloat(document.getElementById('param-w-xhs')?.value || 0.20)
                },
                lc: {
                    constant: parseFloat(document.getElementById('param-lc-const')?.value || 0.60),
                    netease_coef: parseFloat(document.getElementById('param-lc-netease')?.value || 0.40),
                    xhs_coef: parseFloat(document.getElementById('param-lc-xhs')?.value || -0.20),
                    min: 0.60,
                    max: 1.00
                },
                premium: {
                    conservative: parseFloat(document.getElementById('param-p-conservative')?.value || 1.15),
                    neutral: parseFloat(document.getElementById('param-p-neutral')?.value || 1.25),
                    aggressive: parseFloat(document.getElementById('param-p-aggressive')?.value || 1.35)
                },
                benchmarks: {
                    travis: {
                        name: 'Travis Scott',
                        boxOffice: parseFloat(document.getElementById('param-travis-box')?.value || 78.15),
                        baidu: parseFloat(document.getElementById('param-travis-baidu')?.value || 280),
                        netease: parseFloat(document.getElementById('param-travis-netease')?.value || 126.6),
                        xhs: parseFloat(document.getElementById('param-travis-xhs')?.value || 1.0)
                    },
                    kanye: {
                        name: 'Kanye West',
                        boxOffice: parseFloat(document.getElementById('param-kanye-box')?.value || 51.00),
                        baidu: parseFloat(document.getElementById('param-kanye-baidu')?.value || 616),
                        netease: parseFloat(document.getElementById('param-kanye-netease')?.value || 99.7),
                        xhs: parseFloat(document.getElementById('param-kanye-xhs')?.value || 13.9)
                    }
                }
            };
        }
        
        function saveParams() {
            const params = getCustomParams();
            localStorage.setItem('comparableParams', JSON.stringify(params));
            alert('参数已保存');
        }
        
        function resetParams() {
            localStorage.removeItem('comparableParams');
            location.reload();
        }
        
        function generateCalculationDetails(calc) {
            return \`
                <div class="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <p class="font-medium">归一化最大值</p>
                        <p>百度: \${calc.normalization.maxBaidu}</p>
                        <p>网易云: \${calc.normalization.maxNetease}</p>
                        <p>小红书: \${calc.normalization.maxXhs}</p>
                    </div>
                    <div>
                        <p class="font-medium">目标艺人指数</p>
                        <p>D: \${calc.indices[2].D.toFixed(4)}</p>
                        <p>LC: \${calc.indices[2].LC.toFixed(4)}</p>
                        <p>F: \${calc.indices[2].F.toFixed(4)}</p>
                    </div>
                    <div>
                        <p class="font-medium">比例映射</p>
                        <p>r_CT: \${calc.ratios.r_CT.toFixed(4)}</p>
                        <p>r_CK: \${calc.ratios.r_CK.toFixed(4)}</p>
                    </div>
                    <div>
                        <p class="font-medium">三线城市票房</p>
                        <p>Travis锚点: \${calc.tier3.from_travis.toFixed(2)} 百万</p>
                        <p>Kanye锚点: \${calc.tier3.from_kanye.toFixed(2)} 百万</p>
                    </div>
                </div>
            \`;
        }
        
        // 加载保存的参数
        window.addEventListener('load', () => {
            const saved = localStorage.getItem('comparableParams');
            if (saved) {
                const params = JSON.parse(saved);
                // 填充表单...
                if (params.weights) {
                    document.getElementById('param-w-baidu').value = params.weights.baidu;
                    document.getElementById('param-w-netease').value = params.weights.netease;
                    document.getElementById('param-w-xhs').value = params.weights.xhs;
                }
                if (params.lc) {
                    document.getElementById('param-lc-const').value = params.lc.constant;
                    document.getElementById('param-lc-netease').value = params.lc.netease_coef;
                    document.getElementById('param-lc-xhs').value = params.lc.xhs_coef;
                }
                if (params.premium) {
                    document.getElementById('param-p-conservative').value = params.premium.conservative;
                    document.getElementById('param-p-neutral').value = params.premium.neutral;
                    document.getElementById('param-p-aggressive').value = params.premium.aggressive;
                }
            }
        });
    </script>
</body>
</html>`)
})

export default app
