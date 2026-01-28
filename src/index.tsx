import { Hono } from 'hono'
import { serveStatic } from 'hono/cloudflare-pages'

const app = new Hono()

// Serve static files
app.use('/static/*', serveStatic())

// Main presentation page
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
            --dark: #0A0A0A;
            --dark-gray: #1A1A1A;
            --accent: #FF2D55;
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        html {
            scroll-behavior: smooth;
        }
        
        body {
            font-family: 'Inter', 'Noto Sans SC', sans-serif;
            background: var(--dark);
            color: #fff;
            overflow-x: hidden;
        }
        
        .font-display {
            font-family: 'Playfair Display', serif;
        }
        
        /* Hero Section */
        .hero {
            min-height: 100vh;
            background: linear-gradient(135deg, #0A0A0A 0%, #1A1A1A 50%, #0A0A0A 100%);
            position: relative;
            overflow: hidden;
        }
        
        .hero::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('https://sspark.genspark.ai/cfimages?u1=1veObvbSW3Wz8OP0E%2FxarW6Kl3qe6BpW8Blt6wxV5j7u9tQqcUGIg7D8dpunCgViNAHkpyLXL1YkEvposppCBPQoeuP28E7qq7J96%2BZl1LrzenEjvo%2FlKeERfgLEYM411ryk6YNLyP3iXBAABYJjSrduVBz21Kd1c%2Fw%3D&u2=zUZgcIM1o%2F1T%2B%2Ble&width=2560') center center;
            background-size: cover;
            opacity: 0.3;
            filter: grayscale(30%);
        }
        
        .hero-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(180deg, rgba(10,10,10,0.7) 0%, rgba(10,10,10,0.9) 100%);
        }
        
        .gold-text {
            background: linear-gradient(135deg, #D4AF37 0%, #F4E4BA 50%, #D4AF37 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        .gold-border {
            border: 1px solid var(--gold);
        }
        
        .gold-bg {
            background: linear-gradient(135deg, #D4AF37 0%, #F4E4BA 50%, #D4AF37 100%);
        }
        
        /* Animated Lines */
        .animated-line {
            position: absolute;
            background: linear-gradient(90deg, transparent, var(--gold), transparent);
            height: 1px;
            animation: moveLine 3s linear infinite;
        }
        
        @keyframes moveLine {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
        }
        
        /* Stats Card */
        .stat-card {
            background: rgba(255,255,255,0.03);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(212, 175, 55, 0.2);
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .stat-card:hover {
            transform: translateY(-10px);
            border-color: var(--gold);
            box-shadow: 0 20px 60px rgba(212, 175, 55, 0.15);
        }
        
        /* Venue Card */
        .venue-card {
            position: relative;
            overflow: hidden;
            border-radius: 20px;
            transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .venue-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.9) 100%);
            z-index: 1;
        }
        
        .venue-card:hover {
            transform: scale(1.02);
        }
        
        .venue-card:hover img {
            transform: scale(1.1);
        }
        
        .venue-card img {
            transition: transform 0.7s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        /* Section */
        section {
            position: relative;
        }
        
        .section-divider {
            width: 100%;
            height: 1px;
            background: linear-gradient(90deg, transparent, var(--gold), transparent);
            margin: 4rem 0;
        }
        
        /* Timeline */
        .timeline-item {
            position: relative;
            padding-left: 40px;
        }
        
        .timeline-item::before {
            content: '';
            position: absolute;
            left: 0;
            top: 8px;
            width: 12px;
            height: 12px;
            background: var(--gold);
            border-radius: 50%;
        }
        
        .timeline-item::after {
            content: '';
            position: absolute;
            left: 5px;
            top: 20px;
            width: 2px;
            height: calc(100% + 20px);
            background: rgba(212, 175, 55, 0.3);
        }
        
        .timeline-item:last-child::after {
            display: none;
        }
        
        /* Partner Logo */
        .partner-logo {
            filter: grayscale(100%) brightness(2);
            opacity: 0.7;
            transition: all 0.3s ease;
        }
        
        .partner-logo:hover {
            filter: grayscale(0%) brightness(1);
            opacity: 1;
        }
        
        /* Scroll Animation */
        .fade-in {
            opacity: 0;
            transform: translateY(40px);
            transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .fade-in.visible {
            opacity: 1;
            transform: translateY(0);
        }
        
        /* Navigation */
        .nav-link {
            position: relative;
        }
        
        .nav-link::after {
            content: '';
            position: absolute;
            bottom: -4px;
            left: 0;
            width: 0;
            height: 2px;
            background: var(--gold);
            transition: width 0.3s ease;
        }
        
        .nav-link:hover::after {
            width: 100%;
        }
        
        /* Custom Scrollbar */
        ::-webkit-scrollbar {
            width: 8px;
        }
        
        ::-webkit-scrollbar-track {
            background: var(--dark);
        }
        
        ::-webkit-scrollbar-thumb {
            background: var(--gold);
            border-radius: 4px;
        }
        
        /* Glowing Effect */
        .glow {
            box-shadow: 0 0 60px rgba(212, 175, 55, 0.3);
        }
        
        /* Number Counter Animation */
        .counter {
            font-variant-numeric: tabular-nums;
        }
        
        /* Floating Elements */
        .float {
            animation: float 6s ease-in-out infinite;
        }
        
        @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-20px); }
        }
        
        /* Pulse Effect */
        .pulse {
            animation: pulse 2s ease-in-out infinite;
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
    </style>
</head>
<body>
    <!-- Navigation -->
    <nav class="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/5">
        <div class="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 gold-bg rounded-full flex items-center justify-center">
                    <span class="text-black font-bold text-sm">VE</span>
                </div>
                <span class="font-semibold text-sm tracking-wider">VIBELINKS ENTERTAINMENT</span>
            </div>
            <div class="hidden md:flex items-center gap-8 text-sm">
                <a href="#overview" class="nav-link text-white/70 hover:text-white transition">概览</a>
                <a href="#venues" class="nav-link text-white/70 hover:text-white transition">场馆</a>
                <a href="#partners" class="nav-link text-white/70 hover:text-white transition">合作伙伴</a>
                <a href="#marketing" class="nav-link text-white/70 hover:text-white transition">营销</a>
                <a href="#investment" class="nav-link text-white/70 hover:text-white transition">投资亮点</a>
            </div>
            <button class="gold-bg text-black px-6 py-2 rounded-full text-sm font-semibold hover:opacity-90 transition">
                联系我们
            </button>
        </div>
    </nav>

    <!-- Hero Section -->
    <section class="hero flex items-center justify-center">
        <div class="hero-overlay"></div>
        <div class="relative z-10 text-center px-6 max-w-5xl mx-auto">
            <div class="mb-6 inline-block">
                <span class="text-xs tracking-[0.3em] text-white/50 uppercase">Investment Presentation</span>
            </div>
            <h1 class="font-display text-5xl md:text-7xl lg:text-8xl font-bold mb-6 leading-tight">
                <span class="gold-text">CARDI B</span><br>
                <span class="text-white">CHINA TOUR</span>
            </h1>
            <p class="text-xl md:text-2xl text-white/60 mb-4 font-light">2025 - 2026</p>
            <div class="flex flex-wrap justify-center gap-4 mb-12">
                <span class="px-4 py-1 border border-white/20 rounded-full text-sm text-white/70">杭州</span>
                <span class="px-4 py-1 border border-white/20 rounded-full text-sm text-white/70">深圳</span>
            </div>
            <p class="text-lg text-white/50 max-w-2xl mx-auto leading-relaxed mb-12">
                通过具有变革性的音乐体验搭建文化桥梁<br>
                连接国际艺术家与中国多元化观众
            </p>
            <a href="#overview" class="inline-flex items-center gap-2 gold-border px-8 py-4 rounded-full hover:bg-white/5 transition group">
                <span class="gold-text font-semibold">探索投资机遇</span>
                <i class="fas fa-arrow-down gold-text group-hover:translate-y-1 transition-transform"></i>
            </a>
        </div>
        
        <!-- Scroll Indicator -->
        <div class="absolute bottom-10 left-1/2 -translate-x-1/2">
            <div class="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center pt-2">
                <div class="w-1 h-2 bg-white/50 rounded-full animate-bounce"></div>
            </div>
        </div>
    </section>

    <!-- Overview Section -->
    <section id="overview" class="py-24 px-6 bg-gradient-to-b from-black to-[#0A0A0A]">
        <div class="max-w-7xl mx-auto">
            <div class="text-center mb-20 fade-in">
                <span class="text-xs tracking-[0.3em] gold-text uppercase mb-4 block">Project Overview</span>
                <h2 class="font-display text-4xl md:text-5xl font-bold mb-6">项目概览</h2>
                <p class="text-white/50 max-w-2xl mx-auto">
                    全球顶级说唱天后Cardi B首次中国巡演，横跨两大核心城市，预计触达百万级观众
                </p>
            </div>
            
            <!-- Stats Grid -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20">
                <div class="stat-card rounded-2xl p-8 text-center fade-in">
                    <div class="text-4xl md:text-5xl font-bold gold-text mb-2 counter" data-target="2">0</div>
                    <div class="text-white/50 text-sm">巡演城市</div>
                </div>
                <div class="stat-card rounded-2xl p-8 text-center fade-in" style="transition-delay: 0.1s">
                    <div class="text-4xl md:text-5xl font-bold gold-text mb-2 counter" data-target="120800">0</div>
                    <div class="text-white/50 text-sm">总座位容量</div>
                </div>
                <div class="stat-card rounded-2xl p-8 text-center fade-in" style="transition-delay: 0.2s">
                    <div class="text-4xl md:text-5xl font-bold gold-text mb-2">85%</div>
                    <div class="text-white/50 text-sm">公开售票比例</div>
                </div>
                <div class="stat-card rounded-2xl p-8 text-center fade-in" style="transition-delay: 0.3s">
                    <div class="text-4xl md:text-5xl font-bold gold-text mb-2 counter" data-target="2">0</div>
                    <div class="text-white/50 text-sm">年度跨度</div>
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

    <!-- Venues Section -->
    <section id="venues" class="py-24 px-6">
        <div class="max-w-7xl mx-auto">
            <div class="text-center mb-20 fade-in">
                <span class="text-xs tracking-[0.3em] gold-text uppercase mb-4 block">Tour Venues</span>
                <h2 class="font-display text-4xl md:text-5xl font-bold mb-6">巡演场馆</h2>
                <p class="text-white/50 max-w-2xl mx-auto">
                    精选中国两大顶级体育场馆，覆盖华东、华南核心市场
                </p>
            </div>
            
            <!-- Venue Cards -->
            <div class="space-y-8">
                <!-- Hangzhou -->
                <div class="venue-card h-[500px] relative fade-in">
                    <img src="https://sspark.genspark.ai/cfimages?u1=lbpEjnHAphwJJWog2jYcf4Fy%2FxR0tYQxzT%2B4JnjhaH10EUX9dPgFvEMlUTqaIB0KHRAR2nGiQSXa9KhLUqa4P3EdWBaYL%2FQHjp0OFbUGGALZTohMCrqfEv3gBnebkSQmvDDlTC7VRXg9D3FR3mxlTPgf&u2=PfHrp5kyM3YolfMr&width=2560" 
                         alt="Hangzhou Olympic Sports Centre Stadium" 
                         class="w-full h-full object-cover">
                    <div class="absolute bottom-0 left-0 right-0 p-8 md:p-12 z-10">
                        <div class="flex flex-wrap items-end justify-between gap-6">
                            <div>
                                <span class="inline-block px-4 py-1 gold-bg text-black text-xs font-semibold rounded-full mb-4">旗舰场馆</span>
                                <h3 class="font-display text-3xl md:text-4xl font-bold mb-2">杭州奥体中心主体育场</h3>
                                <p class="text-white/60 mb-4">Hangzhou Olympic Sports Centre Stadium</p>
                                <p class="text-white/50 max-w-xl">
                                    中国第二大体育场，2022年亚运会主场馆，屋顶采用2,800吨钢材，比鸟巢轻1,400吨
                                </p>
                            </div>
                            <div class="flex gap-8">
                                <div class="text-center">
                                    <div class="text-4xl font-bold gold-text">80,800</div>
                                    <div class="text-white/50 text-sm">座位容量</div>
                                </div>
                                <div class="text-center">
                                    <div class="text-4xl font-bold gold-text">216,000</div>
                                    <div class="text-white/50 text-sm">平方米</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Shenzhen -->
                <div class="venue-card h-[400px] relative fade-in">
                    <img src="https://sspark.genspark.ai/cfimages?u1=oqKdduK3jkMMkLTe3EwgkaXPbyivvilO7Q%2Bn%2FQU0AEM3kvYJUG2FcsF59M91hBctY4NXpbICBK5mceigDLTHtKIbjtyBhxG4MMzDI%2B5TCmoQjEu1kFBmL9GkICTIf2zZv6RdYo%2F6U8Axllp%2FP4Iu%2F5iH%2F8TiDYQdjBHxGd9JQilRMvnW8bX9nMfCMATJ&u2=OVgYRz8A133JOH8t&width=2560" 
                         alt="Shenzhen Skyline" 
                         class="w-full h-full object-cover">
                    <div class="absolute bottom-0 left-0 right-0 p-8 md:p-12 z-10">
                        <div class="flex flex-wrap items-end justify-between gap-6">
                            <div>
                                <span class="inline-block px-3 py-1 border border-white/30 text-xs rounded-full mb-3">华南科技中心</span>
                                <h3 class="font-display text-2xl md:text-3xl font-bold mb-2">深圳湾体育中心</h3>
                                <p class="text-white/60 text-sm mb-3">Shenzhen Bay Sports Center (春茧)</p>
                                <p class="text-white/50 max-w-xl text-sm">
                                    深圳地标性体育场馆，被誉为"春茧"，是华南地区顶级演出场地，紧邻深圳湾超级总部基地
                                </p>
                            </div>
                            <div class="flex gap-6">
                                <div class="text-center">
                                    <div class="text-3xl font-bold gold-text">40,000</div>
                                    <div class="text-white/50 text-xs">座位容量</div>
                                </div>
                                <div class="text-center">
                                    <div class="text-3xl font-bold gold-text">2011</div>
                                    <div class="text-white/50 text-xs">大运会主场馆</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Shenzhen Market Analysis -->
    <section class="py-24 px-6 bg-gradient-to-b from-[#0A0A0A] to-black">
        <div class="max-w-7xl mx-auto">
            <div class="grid md:grid-cols-2 gap-12 items-center">
                <div class="fade-in">
                    <span class="text-xs tracking-[0.3em] gold-text uppercase mb-4 block">Market Analysis</span>
                    <h2 class="font-display text-4xl md:text-5xl font-bold mb-6">深圳市场分析</h2>
                    <p class="text-white/50 mb-8 leading-relaxed">
                        深圳作为中国改革开放的前沿阵地，是全国最具活力和消费力的城市之一，年轻人口密度极高
                    </p>
                    
                    <div class="space-y-6">
                        <div class="flex items-center gap-4">
                            <div class="w-12 h-12 gold-bg rounded-lg flex items-center justify-center flex-shrink-0">
                                <i class="fas fa-chart-line text-black"></i>
                            </div>
                            <div>
                                <div class="text-2xl font-bold">¥3.46 万亿</div>
                                <div class="text-white/50 text-sm">2024年GDP（约4,800亿美元）</div>
                            </div>
                        </div>
                        <div class="flex items-center gap-4">
                            <div class="w-12 h-12 gold-bg rounded-lg flex items-center justify-center flex-shrink-0">
                                <i class="fas fa-users text-black"></i>
                            </div>
                            <div>
                                <div class="text-2xl font-bold">1,780 万</div>
                                <div class="text-white/50 text-sm">常住人口</div>
                            </div>
                        </div>
                        <div class="flex items-center gap-4">
                            <div class="w-12 h-12 gold-bg rounded-lg flex items-center justify-center flex-shrink-0">
                                <i class="fas fa-user-graduate text-black"></i>
                            </div>
                            <div>
                                <div class="text-2xl font-bold">79.5%</div>
                                <div class="text-white/50 text-sm">18-45岁人口占比（全国最高）</div>
                            </div>
                        </div>
                        <div class="flex items-center gap-4">
                            <div class="w-12 h-12 gold-bg rounded-lg flex items-center justify-center flex-shrink-0">
                                <i class="fas fa-building text-black"></i>
                            </div>
                            <div>
                                <div class="text-2xl font-bold">Top 3</div>
                                <div class="text-white/50 text-sm">全国演出市场规模</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="relative fade-in" style="transition-delay: 0.2s">
                    <div class="stat-card rounded-3xl p-8 glow">
                        <h4 class="text-lg font-semibold mb-6 gold-text">消费能力指标</h4>
                        <div class="space-y-4">
                            <div>
                                <div class="flex justify-between text-sm mb-2">
                                    <span class="text-white/70">人均可支配收入</span>
                                    <span class="gold-text font-semibold">¥76,910 / 年</span>
                                </div>
                                <div class="h-2 bg-white/10 rounded-full overflow-hidden">
                                    <div class="h-full gold-bg rounded-full" style="width: 95%"></div>
                                </div>
                            </div>
                            <div>
                                <div class="flex justify-between text-sm mb-2">
                                    <span class="text-white/70">娱乐消费增长</span>
                                    <span class="gold-text font-semibold">+28% YoY</span>
                                </div>
                                <div class="h-2 bg-white/10 rounded-full overflow-hidden">
                                    <div class="h-full gold-bg rounded-full" style="width: 85%"></div>
                                </div>
                            </div>
                            <div>
                                <div class="flex justify-between text-sm mb-2">
                                    <span class="text-white/70">演出市场渗透率</span>
                                    <span class="gold-text font-semibold">Top 3 全国</span>
                                </div>
                                <div class="h-2 bg-white/10 rounded-full overflow-hidden">
                                    <div class="h-full gold-bg rounded-full" style="width: 92%"></div>
                                </div>
                            </div>
                            <div>
                                <div class="flex justify-between text-sm mb-2">
                                    <span class="text-white/70">科技/金融从业者占比</span>
                                    <span class="gold-text font-semibold">35%+</span>
                                </div>
                                <div class="h-2 bg-white/10 rounded-full overflow-hidden">
                                    <div class="h-full gold-bg rounded-full" style="width: 88%"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Partners Section -->
    <section id="partners" class="py-24 px-6">
        <div class="max-w-7xl mx-auto">
            <div class="text-center mb-20 fade-in">
                <span class="text-xs tracking-[0.3em] gold-text uppercase mb-4 block">Production Partners</span>
                <h2 class="font-display text-4xl md:text-5xl font-bold mb-6">顶级制作团队</h2>
                <p class="text-white/50 max-w-2xl mx-auto">
                    携手中国领先的舞台制作与视听设备供应商，确保世界级演出品质
                </p>
            </div>
            
            <div class="grid md:grid-cols-2 gap-8 mb-16">
                <!-- LICHAO -->
                <div class="stat-card rounded-3xl p-8 fade-in">
                    <div class="flex items-start gap-6 mb-6">
                        <div class="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                            <span class="text-2xl font-bold gold-text">LC</span>
                        </div>
                        <div>
                            <h3 class="text-xl font-semibold mb-2">LICHAO (LC) STAGE Co., Ltd.</h3>
                            <p class="text-white/50 text-sm">舞台结构建设 · 成立于2001年</p>
                        </div>
                    </div>
                    <p class="text-white/60 mb-6 leading-relaxed">
                        ISO9001认证企业，负责2022北京冬奥会舞台结构建设，拥有20+年大型活动制作经验
                    </p>
                    <div class="flex flex-wrap gap-2">
                        <span class="px-3 py-1 bg-white/5 rounded-full text-xs text-white/70">北京冬奥会</span>
                        <span class="px-3 py-1 bg-white/5 rounded-full text-xs text-white/70">ISO9001</span>
                        <span class="px-3 py-1 bg-white/5 rounded-full text-xs text-white/70">央视晚会</span>
                    </div>
                </div>
                
                <!-- XCAV -->
                <div class="stat-card rounded-3xl p-8 fade-in" style="transition-delay: 0.1s">
                    <div class="flex items-start gap-6 mb-6">
                        <div class="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                            <span class="text-2xl font-bold gold-text">XC</span>
                        </div>
                        <div>
                            <h3 class="text-xl font-semibold mb-2">XCAV</h3>
                            <p class="text-white/50 text-sm">视觉与LED设备 · 成立于2006年（深圳）</p>
                        </div>
                    </div>
                    <p class="text-white/60 mb-6 leading-relaxed">
                        专业视觉与LED设备供应商，服务于各大电视台跨年晚会及顶级明星演唱会
                    </p>
                    <div class="flex flex-wrap gap-2">
                        <span class="px-3 py-1 bg-white/5 rounded-full text-xs text-white/70">跨年晚会</span>
                        <span class="px-3 py-1 bg-white/5 rounded-full text-xs text-white/70">LED视觉</span>
                        <span class="px-3 py-1 bg-white/5 rounded-full text-xs text-white/70">明星演唱会</span>
                    </div>
                </div>
            </div>
            
            <!-- Co-Organizer -->
            <div class="stat-card rounded-3xl p-10 fade-in">
                <div class="grid md:grid-cols-2 gap-10 items-center">
                    <div>
                        <span class="inline-block px-4 py-1 gold-bg text-black text-xs font-semibold rounded-full mb-4">联合主办</span>
                        <h3 class="text-2xl font-semibold mb-4">海南高唐文化传播有限公司</h3>
                        <p class="text-white/50 mb-6 leading-relaxed">
                            具有演出资质的省内外大型文化公司，拥有精英团队和丰富的大型演出运营经验
                        </p>
                    </div>
                    <div>
                        <h4 class="text-sm text-white/50 mb-4 uppercase tracking-wider">成功案例</h4>
                        <div class="space-y-3">
                            <div class="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                                <i class="fas fa-tv gold-text"></i>
                                <span>2023/2024 湖南卫视跨年晚会</span>
                            </div>
                            <div class="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                                <i class="fas fa-microphone gold-text"></i>
                                <span>Charlie Puth 海口巡演 (2024.11)</span>
                            </div>
                            <div class="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                                <i class="fas fa-star gold-text"></i>
                                <span>郭富城巡演 (2024.05)</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Production Showcase -->
    <section class="py-24 px-6 bg-gradient-to-b from-black to-[#0A0A0A]">
        <div class="max-w-7xl mx-auto">
            <div class="text-center mb-16 fade-in">
                <span class="text-xs tracking-[0.3em] gold-text uppercase mb-4 block">World-Class Production</span>
                <h2 class="font-display text-4xl md:text-5xl font-bold mb-6">世界级舞台制作</h2>
            </div>
            
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div class="relative h-64 rounded-2xl overflow-hidden fade-in">
                    <img src="https://sspark.genspark.ai/cfimages?u1=fYvgBx8rcqp1aZZ88QO7raUoTE86wDjRaZ4gmCBeoJAQXL8jQTWDevR9pZT3S8P5y7dLLh4MqgRD9YC8HkN78zMxwXW%2Bswum2KELsoONUC9xcUIoDnpLotwuew4yGUK8Nk7UkUkyLqj%2FyhyLrAGVsZssKfGVZoOgHhva%2BErA6iefG%2BZmYiQFYPPEZ2xZdxdP9GMxXqCEMyqReesNLqqJbhljhR%2F4J9QAttNFoWEp7oXfl%2B4lyOyMJD%2BX2hHY%2FZw7CNgFAUztqtBPPf%2FkIzRA35bgCoryRTFqobtZzgbfeYUUNQ%3D%3D&u2=%2BKpDrgsUmbqDb9R1&width=2560" 
                         alt="Concert Lighting" 
                         class="w-full h-full object-cover">
                </div>
                <div class="relative h-64 rounded-2xl overflow-hidden fade-in" style="transition-delay: 0.1s">
                    <img src="https://sspark.genspark.ai/cfimages?u1=vEd22F5USkUT27lUyj9RGZfzQ2azH3TvwFbjAMM%2F6XF4BfwkSyI6lQ0ldCDyuesF6DEGLrp2uuuw9wfWMYjF08U1wO9npSGWXMzp0ZUEFWHyPDS%2FAd9WRY1uwqi3EV2Rwc5z79fOhHly%2F94tCxzaka0%3D&u2=M54D46x6UuEvXblw&width=2560" 
                         alt="Stage Production" 
                         class="w-full h-full object-cover">
                </div>
                <div class="relative h-64 rounded-2xl overflow-hidden fade-in" style="transition-delay: 0.2s">
                    <img src="https://sspark.genspark.ai/cfimages?u1=H%2B%2BrWmWwdgafQRxxp5pScPIyQuPVFeqZFpgAevBM09NPDMwLCnvcxeML2FmvOelu9UCLVeqqE3P9UeQd7vpTeyRGXGroNTYt4L91yjK021VQ7vXnBCX5QxAuWWaIO6Y%3D&u2=SX2DV1LtXmOShgrz&width=2560" 
                         alt="Stage Lighting" 
                         class="w-full h-full object-cover">
                </div>
                <div class="relative h-64 rounded-2xl overflow-hidden fade-in" style="transition-delay: 0.3s">
                    <img src="https://sspark.genspark.ai/cfimages?u1=PoqNM8ZSC1rHdWTA%2FQKMjmu5nkhKW01d8FI7GtHAFjiv%2Fr%2B3gtO5usccl%2BMTSMHRGBGPjUMhIgO4E5pc3ohr2ATyl5cFRLmS8Rj3Zn3wAstOGDMYiHTPm7ZlwbjrdXnxjfAwEJi7OlbimLQZyueXjrlyfANX3mPvuurQVM3UDUgyjRzGMhTdoBdYSlUJKZl8NC0Kjb%2BepV%2FUowDbNPySSqv97M%2FV1%2Bb1UqPZr%2F3XMoVOA5A%3D&u2=8Jz4NAma3A1vfEyt&width=2560" 
                         alt="Professional Lighting" 
                         class="w-full h-full object-cover">
                </div>
            </div>
        </div>
    </section>

    <!-- Marketing Section -->
    <section id="marketing" class="py-24 px-6">
        <div class="max-w-7xl mx-auto">
            <div class="text-center mb-20 fade-in">
                <span class="text-xs tracking-[0.3em] gold-text uppercase mb-4 block">Marketing Strategy</span>
                <h2 class="font-display text-4xl md:text-5xl font-bold mb-6">全方位营销策略</h2>
                <p class="text-white/50 max-w-2xl mx-auto">
                    从官宣到演出的一年期全周期营销计划，覆盖线上线下全渠道
                </p>
            </div>
            
            <!-- Timeline -->
            <div class="grid md:grid-cols-2 gap-12 mb-20">
                <div class="fade-in">
                    <h3 class="text-2xl font-semibold mb-8 gold-text">营销节奏</h3>
                    <div class="space-y-8">
                        <div class="timeline-item">
                            <div class="text-lg font-semibold mb-2">T-12 个月</div>
                            <p class="text-white/50">项目官宣，媒体预热，艺人社交媒体互动</p>
                        </div>
                        <div class="timeline-item">
                            <div class="text-lg font-semibold mb-2">T-6 个月</div>
                            <p class="text-white/50">杂志合作，深度报道，粉丝社区运营</p>
                        </div>
                        <div class="timeline-item">
                            <div class="text-lg font-semibold mb-2">T-3 个月</div>
                            <p class="text-white/50">票务开放，户外广告投放，KOL营销</p>
                        </div>
                        <div class="timeline-item">
                            <div class="text-lg font-semibold mb-2">T-1 个月</div>
                            <p class="text-white/50">冲刺营销，现场活动预热，最终造势</p>
                        </div>
                    </div>
                </div>
                
                <div class="fade-in" style="transition-delay: 0.2s">
                    <h3 class="text-2xl font-semibold mb-8 gold-text">媒体矩阵</h3>
                    <div class="grid grid-cols-2 gap-4">
                        <div class="stat-card rounded-xl p-6">
                            <i class="fab fa-weibo text-3xl gold-text mb-3"></i>
                            <div class="text-sm font-semibold">微博</div>
                            <div class="text-xs text-white/50">话题营销</div>
                        </div>
                        <div class="stat-card rounded-xl p-6">
                            <i class="fab fa-tiktok text-3xl gold-text mb-3"></i>
                            <div class="text-sm font-semibold">抖音</div>
                            <div class="text-xs text-white/50">短视频传播</div>
                        </div>
                        <div class="stat-card rounded-xl p-6">
                            <i class="fab fa-weixin text-3xl gold-text mb-3"></i>
                            <div class="text-sm font-semibold">微信</div>
                            <div class="text-xs text-white/50">私域运营</div>
                        </div>
                        <div class="stat-card rounded-xl p-6">
                            <i class="fas fa-newspaper text-3xl gold-text mb-3"></i>
                            <div class="text-sm font-semibold">官方媒体</div>
                            <div class="text-xs text-white/50">央视/人民日报</div>
                        </div>
                    </div>
                    
                    <div class="mt-6 stat-card rounded-xl p-6">
                        <h4 class="font-semibold mb-4">杂志合作</h4>
                        <div class="flex flex-wrap gap-3">
                            <span class="px-3 py-1 bg-white/10 rounded-full text-xs">Cosmopolitan 时尚</span>
                            <span class="px-3 py-1 bg-white/10 rounded-full text-xs">National Geographic Traveler</span>
                            <span class="px-3 py-1 bg-white/10 rounded-full text-xs">ELLE</span>
                            <span class="px-3 py-1 bg-white/10 rounded-full text-xs">GQ</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Ticketing -->
            <div class="stat-card rounded-3xl p-10 fade-in">
                <div class="grid md:grid-cols-3 gap-8 items-center">
                    <div class="md:col-span-2">
                        <h3 class="text-2xl font-semibold mb-4">票务系统</h3>
                        <p class="text-white/50 mb-6 leading-relaxed">
                            与中国两大主流票务平台合作，确保票务安全、合规、透明。根据最新反黄牛法规，
                            演出方必须将不少于85%的门票面向公众销售，剩余15%须在演出前24小时绑定身份证。
                        </p>
                        <div class="flex gap-4">
                            <div class="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-lg">
                                <div class="w-8 h-8 bg-red-500 rounded flex items-center justify-center text-white text-xs font-bold">大麦</div>
                                <span class="text-sm">Damai</span>
                            </div>
                            <div class="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-lg">
                                <div class="w-8 h-8 bg-pink-500 rounded flex items-center justify-center text-white text-xs font-bold">猫眼</div>
                                <span class="text-sm">Maoyan</span>
                            </div>
                        </div>
                    </div>
                    <div class="text-center">
                        <div class="inline-block p-8 rounded-full gold-border">
                            <div class="text-5xl font-bold gold-text">85%</div>
                            <div class="text-sm text-white/50 mt-2">公开售票</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Investment Highlights -->
    <section id="investment" class="py-24 px-6 bg-gradient-to-b from-[#0A0A0A] to-black">
        <div class="max-w-7xl mx-auto">
            <div class="text-center mb-20 fade-in">
                <span class="text-xs tracking-[0.3em] gold-text uppercase mb-4 block">Investment Opportunity</span>
                <h2 class="font-display text-4xl md:text-5xl font-bold mb-6">投资亮点</h2>
            </div>
            
            <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div class="stat-card rounded-2xl p-8 fade-in">
                    <div class="text-4xl mb-4">🌟</div>
                    <h3 class="text-xl font-semibold mb-3">顶流艺人</h3>
                    <p class="text-white/50">Cardi B作为全球顶级说唱艺人，在中国拥有庞大的粉丝基础和商业号召力</p>
                </div>
                <div class="stat-card rounded-2xl p-8 fade-in" style="transition-delay: 0.1s">
                    <div class="text-4xl mb-4">🏟️</div>
                    <h3 class="text-xl font-semibold mb-3">顶级场馆</h3>
                    <p class="text-white/50">两大城市均选用当地最大、最现代化的体育场馆，确保演出规模和体验</p>
                </div>
                <div class="stat-card rounded-2xl p-8 fade-in" style="transition-delay: 0.2s">
                    <div class="text-4xl mb-4">👥</div>
                    <h3 class="text-xl font-semibold mb-3">优质团队</h3>
                    <p class="text-white/50">资深主办方携手顶尖制作团队，拥有丰富的大型演出运营经验</p>
                </div>
                <div class="stat-card rounded-2xl p-8 fade-in" style="transition-delay: 0.3s">
                    <div class="text-4xl mb-4">📈</div>
                    <h3 class="text-xl font-semibold mb-3">市场潜力</h3>
                    <p class="text-white/50">覆盖华东、华南两大最具消费力的城市群，年轻人口占比高，娱乐消费强劲增长</p>
                </div>
                <div class="stat-card rounded-2xl p-8 fade-in" style="transition-delay: 0.4s">
                    <div class="text-4xl mb-4">🎯</div>
                    <h3 class="text-xl font-semibold mb-3">合规运营</h3>
                    <p class="text-white/50">严格遵守票务法规，与主流平台合作，确保运营合规透明</p>
                </div>
                <div class="stat-card rounded-2xl p-8 fade-in" style="transition-delay: 0.5s">
                    <div class="text-4xl mb-4">🌐</div>
                    <h3 class="text-xl font-semibold mb-3">全渠道营销</h3>
                    <p class="text-white/50">线上线下全方位营销矩阵，最大化曝光和转化</p>
                </div>
            </div>
        </div>
    </section>

    <!-- CTA Section -->
    <section class="py-32 px-6 relative overflow-hidden">
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
                <button class="gold-border text-white px-10 py-4 rounded-full font-semibold text-lg hover:bg-white/5 transition flex items-center gap-2">
                    <i class="fas fa-calendar"></i>
                    预约会议
                </button>
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
                    © 2025 Vibelinks Entertainment. All rights reserved.
                </div>
            </div>
        </div>
    </footer>

    <script>
        // Scroll Animation
        const fadeElements = document.querySelectorAll('.fade-in');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, { threshold: 0.1 });
        
        fadeElements.forEach(el => observer.observe(el));
        
        // Counter Animation
        const counters = document.querySelectorAll('.counter');
        
        const counterObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const counter = entry.target;
                    const target = parseInt(counter.dataset.target);
                    const duration = 2000;
                    const startTime = performance.now();
                    
                    const updateCounter = (currentTime) => {
                        const elapsed = currentTime - startTime;
                        const progress = Math.min(elapsed / duration, 1);
                        const easeOut = 1 - Math.pow(1 - progress, 3);
                        const current = Math.floor(easeOut * target);
                        
                        counter.textContent = current.toLocaleString();
                        
                        if (progress < 1) {
                            requestAnimationFrame(updateCounter);
                        }
                    };
                    
                    requestAnimationFrame(updateCounter);
                    counterObserver.unobserve(counter);
                }
            });
        }, { threshold: 0.5 });
        
        counters.forEach(counter => counterObserver.observe(counter));
        
        // Smooth scroll for navigation
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });
        
        // Navbar background on scroll
        const nav = document.querySelector('nav');
        window.addEventListener('scroll', () => {
            if (window.scrollY > 100) {
                nav.classList.add('bg-black/95');
            } else {
                nav.classList.remove('bg-black/95');
            }
        });
    </script>
</body>
</html>
  `)
})

// API endpoint for contact form (future use)
app.post('/api/contact', async (c) => {
  const body = await c.req.json()
  return c.json({ success: true, message: 'Thank you for your interest!' })
})

export default app
