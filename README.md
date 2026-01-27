# 🎤 演唱会票房预测器 - Comparable模型

## 项目概述
- **名称**: Concert Box Office Predictor（演唱会票房预测器）
- **目标**: 基于 Comparable 模型预测欧美明星在中国内地演唱会的票房
- **技术栈**: Hono + TypeScript + TailwindCSS + OpenAI API

## 🔗 访问地址
- **开发环境**: https://3000-izq3mrszxyfa466deoq63-5185f4aa.sandbox.novita.ai

## 🎯 核心功能

### 1. AI智能预测
输入任意欧美艺人名称，AI自动分析并预测票房
- 使用 OpenAI GPT-4o 分析艺人热度数据
- 自动估算百度指数、网易云粉丝、小红书粉丝
- 输出保守/中性/激进三档票房预测

### 2. 手动计算器
手动输入三维度数据，实时计算票房预测
- 百度指数
- 网易云粉丝数（万）
- 小红书粉丝数（万）

### 3. Cardi B案例讲解
完整展示 Comparable 模型的6步计算过程
- Step A: 归一化（Normalization）
- Step B: 需求指数D（Demand Index）
- Step C: 转化率LC（Live Conversion）
- Step D: 出票指数F（Final Index）
- Step E: 双锚点校准（Comparable）
- Step F: 城市溢价（深圳/杭州）

### 4. 参数配置
所有模型参数均可调整：
- D权重：百度(0.45)、网易云(0.35)、小红书(0.20)
- LC参数：常数(0.60)、网易云系数(0.40)、小红书系数(-0.20)
- 城市溢价：保守(1.15)、中性(1.25)、激进(1.35)
- Benchmark锚点：Travis Scott、Kanye West真实票房

## 📊 测算模型逻辑

```
Normalization → D → LC → F → 双锚点 → 城市溢价
```

### Step A: 归一化
```
x' = x / max(x)
```

### Step B: 需求指数 D
```
D = 0.45×百度' + 0.35×网易云' + 0.20×小红书'
```

### Step C: 转化率 LC
```
LC = clip(0.60 + 0.40×网易云' - 0.20×小红书', 0.60, 1.00)
```

### Step D: 出票指数 F
```
F = D × LC
```

### Step E: 双锚点校准
```
r_CT = F_目标 / F_Travis
r_CK = F_目标 / F_Kanye
三线票房_Travis = 78.15 × r_CT
三线票房_Kanye = 51.00 × r_CK
```

### Step F: 城市溢价
```
保守 = Kanye锚点 × 1.15
中性 = 双锚点均值 × 1.25
激进 = Travis锚点 × 1.35
```

## 📡 API 接口

### 健康检查
```
GET /api/health
```

### 获取默认参数
```
GET /api/params/default
```

### 手动计算
```
POST /api/calculate
Body: {
  "artistData": { "baidu": 388, "netease": 80.6, "xhs": 82 },
  "customParams": { ... }  // 可选
}
```

### Cardi B 案例
```
GET /api/demo/cardib
```

### AI分析预测
```
POST /api/ai/analyze
Body: {
  "artistName": "Drake",
  "apiKey": "sk-..."  // 可选
}
```

## 🛠️ 开发指南

### 本地开发
```bash
cd webapp
npm run build
npm run dev:sandbox
```

### 部署到 Cloudflare Pages
```bash
npm run deploy
```

## 📋 Benchmark数据

| 艺人 | 百度指数 | 网易云粉丝(万) | 小红书粉丝(万) | 三线城市票房(百万) |
|------|---------|---------------|---------------|-------------------|
| Travis Scott | 280 | 126.6 | 1.0 | 78.15 |
| Kanye West | 616 | 99.7 | 13.9 | 51.00 |
| Cardi B | 388 | 80.6 | 82.0 | 待预测 |

## 📝 版本日志

### v1.0.0 (2026-01-27)
- ✅ 完成核心计算引擎
- ✅ AI智能预测功能
- ✅ 手动计算器
- ✅ Cardi B案例讲解
- ✅ 可调参数配置面板

## 🚀 下一步开发计划

1. **数据源自动抓取**
   - 集成百度指数API
   - 集成网易云音乐爬虫
   - 集成小红书数据接口

2. **历史数据管理**
   - 使用Cloudflare D1存储预测记录
   - 预测准确度追踪

3. **报告导出**
   - PDF报告生成
   - Excel数据导出

4. **多场景支持**
   - 不同城市溢价配置
   - 多场巡演预测

---

**基于 Comparable 模型 · 专业投委会工具**
