import { Hono } from 'hono'
import { serveStatic } from 'hono/cloudflare-pages'

const app = new Hono()

// Serve static files
app.use('/static/*', serveStatic())

// Main presentation page with integrated investment details
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
            /* 核心金色系 - 优雅奢华 */
            --gold: #D4AF37;
            --gold-light: #E8D48A;
            --gold-dark: #B8960C;
            --gold-warm: #C9A227;
            
            /* 橄榄绿系 - 高级质感 */
            --olive: #5A6B35;
            --olive-light: #6B7B3C;
            --olive-dark: #4A5B2A;
            --olive-deep: #3A4B1A;
            
            /* 深色背景系 */
            --dark: #0A0A0A;
            --dark-gray: #1A1A1A;
            --dark-warm: #151510;
            
            /* 功能色 */
            --success: #7CB342;
            --warning: #FFB74D;
            --danger: #E57373;
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
        
        /* Hero - Olive & Gold Luxury Style */
        .hero-custom {
            min-height: 100vh;
            background: linear-gradient(135deg, #5A6B35 0%, #4A5B2A 40%, #3A4B1A 70%, #2A3B0A 100%);
            position: relative;
            overflow: hidden;
        }
        
        .hero-overlay-custom {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.4) 100%);
        }
        
        .hero-custom::before {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            background: radial-gradient(ellipse at center top, rgba(212, 175, 55, 0.08) 0%, transparent 60%);
            pointer-events: none;
        }
        
        .gold-text {
            background: linear-gradient(135deg, #C9A227 0%, #E8D48A 40%, #D4AF37 70%, #C9A227 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        .gold-border { border: 1px solid var(--gold); }
        .gold-bg { background: linear-gradient(135deg, #C9A227 0%, #D4AF37 50%, #E8D48A 100%); }
        .olive-bg { background: linear-gradient(135deg, var(--olive) 0%, var(--olive-light) 100%); }
        .olive-gold-bg { background: linear-gradient(135deg, var(--olive-dark) 0%, var(--olive) 50%, rgba(212, 175, 55, 0.2) 100%); }
        
        .stat-card {
            background: rgba(90, 107, 53, 0.08);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(212, 175, 55, 0.15);
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .stat-card:hover {
            transform: translateY(-5px);
            border-color: rgba(212, 175, 55, 0.5);
            box-shadow: 0 20px 60px rgba(90, 107, 53, 0.2), 0 10px 30px rgba(212, 175, 55, 0.1);
            background: rgba(90, 107, 53, 0.12);
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
        
        .glow { box-shadow: 0 0 80px rgba(90, 107, 53, 0.3), 0 0 40px rgba(212, 175, 55, 0.15); }
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
            background: linear-gradient(180deg, rgba(10, 10, 10, 0.98) 0%, rgba(21, 21, 16, 0.98) 100%);
            border-right: 1px solid rgba(90, 107, 53, 0.3);
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
            background: linear-gradient(90deg, rgba(90, 107, 53, 0.2), rgba(212, 175, 55, 0.1));
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
            background: linear-gradient(135deg, rgba(90, 107, 53, 0.2), rgba(212, 175, 55, 0.1));
            color: var(--gold);
            font-weight: 600;
            padding: 14px 16px;
            text-align: left;
            border-bottom: 2px solid rgba(90, 107, 53, 0.4);
        }
        
        .data-table td {
            padding: 14px 16px;
            border-bottom: 1px solid rgba(255,255,255,0.08);
            color: rgba(255,255,255,0.85);
            vertical-align: top;
        }
        
        .data-table tr:hover td {
            background: rgba(90, 107, 53, 0.08);
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
            background: linear-gradient(135deg, rgba(90, 107, 53, 0.3), rgba(212, 175, 55, 0.1));
            border: 1px solid rgba(90, 107, 53, 0.5);
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
            background: linear-gradient(90deg, rgba(90, 107, 53, 0.15), rgba(212, 175, 55, 0.08));
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
            background: linear-gradient(90deg, rgba(90, 107, 53, 0.15), rgba(212, 175, 55, 0.08));
            padding: 16px 20px;
            cursor: pointer;
            border-radius: 8px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
            transition: all 0.3s ease;
            border: 1px solid rgba(90, 107, 53, 0.2);
        }
        
        .accordion-header:hover {
            background: linear-gradient(90deg, rgba(90, 107, 53, 0.25), rgba(212, 175, 55, 0.12));
            border-color: rgba(212, 175, 55, 0.3);
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
    <nav class="fixed top-0 left-0 right-0 z-40 backdrop-blur-xl border-b border-white/5" style="background: linear-gradient(90deg, rgba(10,10,10,0.9) 0%, rgba(21,21,16,0.9) 100%);">
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
        </div>
        <div class="absolute bottom-10 left-1/2 -translate-x-1/2 z-10">
            <a href="#overview" class="inline-flex items-center gap-2 bg-white/10 backdrop-blur px-6 py-3 rounded-full hover:bg-white/20 transition">
                <span class="text-white font-medium">探索投资机遇</span>
                <i class="fas fa-arrow-down text-white animate-bounce"></i>
            </a>
        </div>
    </section>

    <!-- Overview Section -->
    <section id="overview" class="py-24 px-6" style="background: linear-gradient(180deg, #0A0A0A 0%, #0D0D0A 50%, #101010 100%);">
        <div class="max-w-7xl mx-auto">
            <div class="text-center mb-16 fade-in">
                <span class="text-xs tracking-[0.3em] gold-text uppercase mb-4 block">Project Overview</span>
                <h2 class="font-display text-4xl md:text-5xl font-bold mb-6">项目概览</h2>
                <p class="text-white/50 max-w-2xl mx-auto">
                    全球顶级说唱天后Cardi B首次中国巡演，横跨两大核心城市，预计触达百万级观众
                </p>
            </div>
            
            <!-- Core Stats - 美化版 -->
            <div class="grid grid-cols-2 md:grid-cols-3 gap-6 mb-12">
                <!-- 主要财务指标 - 大卡片 -->
                <div class="stat-card rounded-2xl p-8 text-center fade-in col-span-2 md:col-span-1" style="background: linear-gradient(135deg, rgba(90, 107, 53, 0.2), rgba(212, 175, 55, 0.08)); border: 2px solid rgba(212, 175, 55, 0.35);">
                    <div class="w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center" style="background: linear-gradient(135deg, rgba(90, 107, 53, 0.4), rgba(212, 175, 55, 0.2));">
                        <i class="fas fa-chart-line gold-text text-xl"></i>
                    </div>
                    <div class="text-4xl md:text-5xl font-bold gold-text mb-2">1.1<span class="text-2xl">亿</span></div>
                    <div class="text-white/70 text-sm font-medium">总票仓</div>
                    <div class="text-white/40 text-xs mt-2">Gross Revenue</div>
                </div>
                
                <div class="stat-card rounded-2xl p-8 text-center fade-in" style="transition-delay: 0.1s; background: linear-gradient(135deg, rgba(90, 107, 53, 0.15), rgba(124, 179, 66, 0.1)); border: 2px solid rgba(124, 179, 66, 0.4);">
                    <div class="w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center" style="background: rgba(124, 179, 66, 0.25);">
                        <i class="fas fa-coins text-green-400 text-xl"></i>
                    </div>
                    <div class="text-4xl md:text-5xl font-bold text-green-400 mb-2">5678<span class="text-2xl">万</span></div>
                    <div class="text-white/70 text-sm font-medium">税后净利润</div>
                    <div class="text-white/40 text-xs mt-2">Net Profit</div>
                </div>
                
                <div class="stat-card rounded-2xl p-8 text-center fade-in" style="transition-delay: 0.15s; background: linear-gradient(135deg, rgba(90, 107, 53, 0.1), rgba(229, 115, 115, 0.08)); border: 2px solid rgba(229, 115, 115, 0.35);">
                    <div class="w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center" style="background: rgba(229, 115, 115, 0.2);">
                        <i class="fas fa-calculator text-red-400 text-xl"></i>
                    </div>
                    <div class="text-4xl md:text-5xl font-bold text-red-400 mb-2">7000<span class="text-2xl">万</span></div>
                    <div class="text-white/70 text-sm font-medium">总成本支出</div>
                    <div class="text-white/40 text-xs mt-2">Total Expenses</div>
                </div>
            </div>
            
            <!-- 次要指标 - 小卡片 -->
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
                    <div class="text-2xl font-bold text-green-400">25.5%</div>
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

    <!-- Organizer Section -->
    <section id="organizer" class="py-24 px-6" style="background: linear-gradient(180deg, #101010 0%, #0D0D0A 50%, #0A0A0A 100%);">
        <div class="max-w-7xl mx-auto">
            <div class="text-center mb-16 fade-in">
                <span class="text-xs tracking-[0.3em] gold-text uppercase mb-4 block">Main Organizer</span>
                <h2 class="font-display text-4xl md:text-5xl font-bold mb-6">主办方</h2>
            </div>
            
            <!-- Vibelinks -->
            <div class="stat-card rounded-3xl p-10 mb-12 fade-in glow">
                <div class="grid md:grid-cols-2 gap-10 items-start">
                    <div>
                        <span class="inline-block px-4 py-1 gold-bg text-black text-xs font-semibold rounded-full mb-4">主办方</span>
                        <div class="flex items-center gap-4 mb-6">
                            <div class="w-16 h-16 gold-bg rounded-2xl flex items-center justify-center">
                                <span class="text-black font-bold text-xl">VE</span>
                            </div>
                            <div>
                                <h3 class="text-2xl font-semibold">Vibelinks Entertainment</h3>
                                <p class="text-white/50 text-sm">连接全球音乐与中国市场</p>
                            </div>
                        </div>
                        <p class="text-white/50 mb-6 leading-relaxed">
                            Vibelinks Entertainment致力于通过变革性的音乐体验搭建文化桥梁，连接国际艺术家与中国多元化观众，支持中国本土音乐产业的长期发展。
                        </p>
                        <div class="flex flex-wrap gap-2">
                            <span class="px-3 py-1 bg-white/5 rounded-full text-xs text-white/70">国际演出</span>
                            <span class="px-3 py-1 bg-white/5 rounded-full text-xs text-white/70">文化桥梁</span>
                            <span class="px-3 py-1 bg-white/5 rounded-full text-xs text-white/70">科技创新</span>
                        </div>
                    </div>
                    <div>
                        <h4 class="text-sm text-white/50 mb-4 uppercase tracking-wider">核心使命</h4>
                        <div class="space-y-3">
                            <div class="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                                <i class="fas fa-globe gold-text"></i>
                                <span>搭建国际艺术家与中国市场的桥梁</span>
                            </div>
                            <div class="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                                <i class="fas fa-microchip gold-text"></i>
                                <span>运用前沿科技打造沉浸式演出体验</span>
                            </div>
                            <div class="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                                <i class="fas fa-leaf gold-text"></i>
                                <span>倡导环保理念，推动可持续演出</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Co-Organizer -->
            <div class="stat-card rounded-3xl p-10 fade-in">
                <span class="inline-block px-4 py-1 border border-white/30 text-white text-xs font-semibold rounded-full mb-4">联合主办</span>
                <h3 class="text-2xl font-semibold mb-4">海南高唐文化传播有限公司</h3>
                <p class="text-white/50 mb-6 leading-relaxed">
                    具有演出资质的省内外大型文化公司，主要业务包括承办大型演出活动、政府精品演出及涉外演出。拥有精英团队和丰富的大型演出运营经验。
                </p>
                <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div class="case-card rounded-xl p-4">
                        <div class="text-sm font-semibold">湖南卫视跨年演唱会</div>
                        <div class="text-xs text-white/50">2019-2024 连续多年</div>
                    </div>
                    <div class="case-card rounded-xl p-4">
                        <div class="text-sm font-semibold">Charlie Puth 世界巡演</div>
                        <div class="text-xs text-white/50">2024年11月 海口站</div>
                    </div>
                    <div class="case-card rounded-xl p-4">
                        <div class="text-sm font-semibold">《创造营2021》</div>
                        <div class="text-xs text-white/50">腾讯视频 现象级综艺</div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Venues Section -->
    <section id="venues" class="py-24 px-6">
        <div class="max-w-7xl mx-auto">
            <div class="text-center mb-16 fade-in">
                <span class="text-xs tracking-[0.3em] gold-text uppercase mb-4 block">Tour Venues</span>
                <h2 class="font-display text-4xl md:text-5xl font-bold mb-6">巡演场馆</h2>
            </div>
            
            <div class="space-y-8">
                <!-- Hangzhou -->
                <div class="venue-card h-[400px] relative fade-in">
                    <img src="https://sspark.genspark.ai/cfimages?u1=lbpEjnHAphwJJWog2jYcf4Fy%2FxR0tYQxzT%2B4JnjhaH10EUX9dPgFvEMlUTqaIB0KHRAR2nGiQSXa9KhLUqa4P3EdWBaYL%2FQHjp0OFbUGGALZTohMCrqfEv3gBnebkSQmvDDlTC7VRXg9D3FR3mxlTPgf&u2=PfHrp5kyM3YolfMr&width=2560" 
                         alt="Hangzhou Olympic Sports Centre Stadium" 
                         class="w-full h-full object-cover">
                    <div class="absolute bottom-0 left-0 right-0 p-8 z-10">
                        <span class="inline-block px-4 py-1 gold-bg text-black text-xs font-semibold rounded-full mb-3">旗舰场馆</span>
                        <h3 class="font-display text-2xl md:text-3xl font-bold mb-2">杭州奥体中心主体育场</h3>
                        <p class="text-white/60 text-sm mb-4">2023年杭州亚运会主场馆</p>
                        <div class="flex gap-6">
                            <div><span class="text-2xl font-bold gold-text">80,800</span><span class="text-white/50 text-sm ml-2">座位</span></div>
                            <div><span class="text-2xl font-bold gold-text">22.9万</span><span class="text-white/50 text-sm ml-2">平方米</span></div>
                        </div>
                    </div>
                </div>
                
                <!-- Shenzhen -->
                <div class="venue-card h-[300px] relative fade-in">
                    <img src="https://sspark.genspark.ai/cfimages?u1=oqKdduK3jkMMkLTe3EwgkaXPbyivvilO7Q%2Bn%2FQU0AEM3kvYJUG2FcsF59M91hBctY4NXpbICBK5mceigDLTHtKIbjtyBhxG4MMzDI%2B5TCmoQjEu1kFBmL9GkICTIf2zZv6RdYo%2F6U8Axllp%2FP4Iu%2F5iH%2F8TiDYQdjBHxGd9JQilRMvnW8bX9nMfCMATJ&u2=OVgYRz8A133JOH8t&width=2560" 
                         alt="Shenzhen Skyline" 
                         class="w-full h-full object-cover">
                    <div class="absolute bottom-0 left-0 right-0 p-8 z-10">
                        <span class="inline-block px-3 py-1 border border-white/30 text-xs rounded-full mb-3">华南科技中心</span>
                        <h3 class="font-display text-xl md:text-2xl font-bold mb-2">深圳湾体育中心 "春茧"</h3>
                        <div class="flex gap-6">
                            <div><span class="text-xl font-bold gold-text">~12,000</span><span class="text-white/50 text-sm ml-2">座位</span></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Production Partners -->
    <section id="production" class="py-24 px-6 bg-gradient-to-b from-black to-[#0A0A0A]">
        <div class="max-w-7xl mx-auto">
            <div class="text-center mb-16 fade-in">
                <span class="text-xs tracking-[0.3em] gold-text uppercase mb-4 block">Production Partners</span>
                <h2 class="font-display text-4xl md:text-5xl font-bold mb-6">顶级制作团队</h2>
            </div>
            
            <div class="grid md:grid-cols-2 gap-8">
                <div class="stat-card rounded-3xl p-8 fade-in">
                    <div class="flex items-start gap-4 mb-6">
                        <div class="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center">
                            <span class="text-xl font-bold gold-text">LC</span>
                        </div>
                        <div>
                            <h3 class="text-xl font-semibold mb-1">LICHAO Stage</h3>
                            <p class="text-white/50 text-sm">成立于2001年 · ISO9001认证</p>
                        </div>
                    </div>
                    <p class="text-white/60 mb-4">专注舞台设计、CNC机械和结构建设，央视春晚及重大晚会长期合作伙伴</p>
                    <div class="space-y-2 text-sm">
                        <div class="flex items-center gap-2"><i class="fas fa-medal gold-text"></i><span>2022北京冬奥会颁奖广场舞台</span></div>
                        <div class="flex items-center gap-2"><i class="fas fa-flag gold-text"></i><span>《伟大征程》舞台制作</span></div>
                    </div>
                </div>
                
                <div class="stat-card rounded-3xl p-8 fade-in" style="transition-delay: 0.1s">
                    <div class="flex items-start gap-4 mb-6">
                        <div class="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center">
                            <span class="text-xl font-bold gold-text">XC</span>
                        </div>
                        <div>
                            <h3 class="text-xl font-semibold mb-1">XCAV</h3>
                            <p class="text-white/50 text-sm">成立于2006年（深圳）</p>
                        </div>
                    </div>
                    <p class="text-white/60 mb-4">专业LED显示设备租赁及娱乐场所视觉设备安装企业</p>
                    <div class="space-y-2 text-sm">
                        <div class="flex items-center gap-2"><i class="fas fa-tv gold-text"></i><span>国内各大电视台跨年晚会</span></div>
                        <div class="flex items-center gap-2"><i class="fas fa-microphone gold-text"></i><span>顶级明星演唱会视觉服务</span></div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Marketing Section -->
    <section id="marketing" class="py-24 px-6">
        <div class="max-w-7xl mx-auto">
            <div class="text-center mb-16 fade-in">
                <span class="text-xs tracking-[0.3em] gold-text uppercase mb-4 block">Marketing Strategy</span>
                <h2 class="font-display text-4xl md:text-5xl font-bold mb-6">全方位营销策略</h2>
            </div>
            
            <div class="grid md:grid-cols-2 gap-12">
                <div class="fade-in">
                    <h3 class="text-2xl font-semibold mb-8 gold-text">营销节奏</h3>
                    <div class="space-y-8">
                        <div class="timeline-item">
                            <div class="text-lg font-semibold mb-2">T-12 个月</div>
                            <p class="text-white/50">确定日期场馆，制定整体营销计划</p>
                        </div>
                        <div class="timeline-item">
                            <div class="text-lg font-semibold mb-2">T-6 个月</div>
                            <p class="text-white/50">启动线上线下活动，KOL预热</p>
                        </div>
                        <div class="timeline-item">
                            <div class="text-lg font-semibold mb-2">T-3 个月</div>
                            <p class="text-white/50">强化宣传互动，票务开放</p>
                        </div>
                        <div class="timeline-item">
                            <div class="text-lg font-semibold mb-2">T-1 个月</div>
                            <p class="text-white/50">最后冲刺宣传，现场活动预热</p>
                        </div>
                    </div>
                </div>
                
                <div class="fade-in" style="transition-delay: 0.2s">
                    <h3 class="text-2xl font-semibold mb-8 gold-text">媒体矩阵</h3>
                    <div class="grid grid-cols-2 gap-4">
                        <div class="stat-card rounded-xl p-5">
                            <i class="fab fa-weibo text-2xl gold-text mb-2"></i>
                            <div class="text-sm font-semibold">微博</div>
                            <div class="text-xs text-white/50">官方+KOL+话题</div>
                        </div>
                        <div class="stat-card rounded-xl p-5">
                            <i class="fab fa-tiktok text-2xl gold-text mb-2"></i>
                            <div class="text-sm font-semibold">抖音/快手</div>
                            <div class="text-xs text-white/50">预告片+花絮</div>
                        </div>
                        <div class="stat-card rounded-xl p-5">
                            <i class="fab fa-weixin text-2xl gold-text mb-2"></i>
                            <div class="text-sm font-semibold">微信</div>
                            <div class="text-xs text-white/50">公众号+购票</div>
                        </div>
                        <div class="stat-card rounded-xl p-5">
                            <i class="fas fa-music text-2xl gold-text mb-2"></i>
                            <div class="text-sm font-semibold">音乐平台</div>
                            <div class="text-xs text-white/50">QQ/网易云</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Ticketing Section -->
    <section id="ticketing" class="py-24 px-6 bg-gradient-to-b from-[#0A0A0A] to-black">
        <div class="max-w-7xl mx-auto">
            <div class="text-center mb-16 fade-in">
                <span class="text-xs tracking-[0.3em] gold-text uppercase mb-4 block">Ticketing System</span>
                <h2 class="font-display text-4xl md:text-5xl font-bold mb-6">票务系统</h2>
            </div>
            
            <div class="grid md:grid-cols-2 gap-8">
                <div class="stat-card rounded-3xl p-8 fade-in">
                    <h3 class="text-xl font-semibold mb-6">票务平台</h3>
                    <div class="flex gap-4 mb-6">
                        <div class="flex items-center gap-2 px-4 py-3 bg-white/5 rounded-xl flex-1">
                            <div class="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center text-white text-xs font-bold">大麦</div>
                            <div><div class="text-sm font-semibold">Damai</div><div class="text-xs text-white/50">阿里系</div></div>
                        </div>
                        <div class="flex items-center gap-2 px-4 py-3 bg-white/5 rounded-xl flex-1">
                            <div class="w-10 h-10 bg-pink-500 rounded-lg flex items-center justify-center text-white text-xs font-bold">猫眼</div>
                            <div><div class="text-sm font-semibold">Maoyan</div><div class="text-xs text-white/50">美团系</div></div>
                        </div>
                    </div>
                    <div class="text-center p-6 gold-border rounded-2xl">
                        <div class="text-4xl font-bold gold-text mb-2">85%</div>
                        <div class="text-sm text-white/50">最低公开售票比例（法规要求）</div>
                    </div>
                </div>
                
                <div class="stat-card rounded-3xl p-8 fade-in" style="transition-delay: 0.1s">
                    <h3 class="text-xl font-semibold mb-6">实名制与反黄牛</h3>
                    <div class="space-y-4">
                        <div class="p-4 bg-white/5 rounded-xl">
                            <div class="flex items-center gap-3 mb-2"><i class="fas fa-id-card gold-text"></i><span class="font-semibold">实名制购票</span></div>
                            <p class="text-white/50 text-sm">每张身份证单场限购一张，入场刷身份证核验</p>
                        </div>
                        <div class="p-4 bg-white/5 rounded-xl">
                            <div class="flex items-center gap-3 mb-2"><i class="fas fa-clock gold-text"></i><span class="font-semibold">24小时绑定</span></div>
                            <p class="text-white/50 text-sm">剩余15%门票需演出前24小时完成信息绑定</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- ==================== INVESTMENT DETAILS ==================== -->
    
    <!-- Investment & Funding -->
    <section id="investment-detail" class="py-24 px-6">
        <div class="max-w-7xl mx-auto">
            <h2 class="section-title"><i class="fas fa-chart-line"></i>总投入与融资情况</h2>
            
            <div class="stat-card rounded-2xl p-8 mb-8 fade-in">
                <h3 class="subsection-title"><i class="fas fa-dollar-sign"></i>总投入金额对比</h3>
                <div class="overflow-x-auto">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>方案阶段</th>
                                <th>总投入金额</th>
                                <th>构成明细</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td><span class="highlight">初始规划</span></td>
                                <td><strong>超7700万人民币</strong></td>
                                <td>艺人秀费约719.2万USD + 运营支出约7260万人民币</td>
                            </tr>
                            <tr>
                                <td><span class="highlight">调整后方案</span></td>
                                <td><strong>7,000万人民币</strong></td>
                                <td>原7500万，通过成本优化压缩</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="stat-card rounded-2xl p-8 mb-8 fade-in">
                <h3 class="subsection-title"><i class="fas fa-landmark"></i>融资目标与出资结构</h3>
                <div class="overflow-x-auto">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>项目</th>
                                <th>金额</th>
                                <th>详细说明</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>总票仓</td>
                                <td class="highlight">1.1亿人民币</td>
                                <td>调整后方案总票仓基数</td>
                            </tr>
                            <tr>
                                <td>净调整票务收入</td>
                                <td class="highlight">1.187亿人民币</td>
                                <td>扣除税款和3.5%佣金后</td>
                            </tr>
                            <tr>
                                <td>资金结构划分</td>
                                <td class="highlight">优先2000万 + 劣后3000万</td>
                                <td>调整后方案中的资金结构</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="stat-card rounded-2xl p-8 fade-in">
                <h3 class="subsection-title"><i class="fas fa-puzzle-piece"></i>资金缺口覆盖方案</h3>
                <div class="info-box">
                    <strong>调整后缺口：</strong><span class="highlight">2000万</span><br>
                    通过"<strong>延迟付款1002万 + 滴灌通退出时留存900-1000万</strong>"全额覆盖，<span class="highlight-green">无需引入新资方</span>
                </div>
            </div>
        </div>
    </section>

    <!-- Payment Timeline -->
    <section id="payment-timeline" class="py-24 px-6 bg-gradient-to-b from-[#0A0A0A] to-black">
        <div class="max-w-7xl mx-auto">
            <h2 class="section-title"><i class="fas fa-calendar-alt"></i>付款节奏/时间线</h2>
            
            <div class="info-box mb-8">
                <i class="fas fa-lightbulb mr-2 gold-text"></i>
                <strong>核心说明：</strong>实际秀费目标协商为<span class="highlight">300万USD/场</span>，暂按<span class="highlight">320万USD/场</span>核算
            </div>

            <div class="stat-card rounded-2xl p-8 mb-8 fade-in">
                <h3 class="subsection-title"><i class="fas fa-list-ol"></i>完整付款时间线</h3>
                <div class="overflow-x-auto">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>关键时间节点</th>
                                <th>付款内容</th>
                                <th>付款金额</th>
                                <th>备注说明</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td><span class="highlight">签约完成</span></td>
                                <td>10% Shows Fee</td>
                                <td><strong>74.24万USD</strong></td>
                                <td><span class="highlight-green">未拿到批文可退还</span></td>
                            </tr>
                            <tr>
                                <td><span class="highlight">拿到批文</span></td>
                                <td>50% Shows Fee</td>
                                <td><strong>348万USD</strong></td>
                                <td>通过担保账号自动支付</td>
                            </tr>
                            <tr>
                                <td><span class="highlight">艺人到达中国</span></td>
                                <td>40% Shows Fee</td>
                                <td><strong>296.96万USD</strong></td>
                                <td>支付节点可协商</td>
                            </tr>
                            <tr>
                                <td><span class="highlight">演出前1天</span></td>
                                <td>100%剩余Expenses</td>
                                <td>舞美200万+安保150万+行政22万</td>
                                <td>舞美总费用500万，40%定金</td>
                            </tr>
                            <tr>
                                <td><span class="highlight-green">票款到账后</span></td>
                                <td>延迟付款项目</td>
                                <td><strong>合计1002万</strong></td>
                                <td>滴灌通70%分成完成后支付</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
            
            <!-- Payment Flow Chart -->
            <div class="stat-card rounded-2xl p-8 fade-in">
                <h3 class="subsection-title"><i class="fas fa-project-diagram"></i>付款流程可视化</h3>
                <div class="flow-chart">
                    <div class="flow-step">
                        <div class="gold-text font-bold">签约</div>
                        <div class="text-sm">10% = 74.24万USD</div>
                    </div>
                    <i class="fas fa-arrow-right flow-arrow"></i>
                    <div class="flow-step">
                        <div class="gold-text font-bold">拿到批文</div>
                        <div class="text-sm">50% = 348万USD</div>
                    </div>
                    <i class="fas fa-arrow-right flow-arrow"></i>
                    <div class="flow-step">
                        <div class="gold-text font-bold">艺人到华</div>
                        <div class="text-sm">40% = 296.96万USD</div>
                    </div>
                    <i class="fas fa-arrow-right flow-arrow"></i>
                    <div class="flow-step">
                        <div class="gold-text font-bold">票款到账后</div>
                        <div class="text-sm">延迟付款1002万</div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Delayed Payment -->
    <section id="delayed-payment" class="py-24 px-6">
        <div class="max-w-7xl mx-auto">
            <h2 class="section-title"><i class="fas fa-clock"></i>延迟付款成本构成</h2>
            
            <div class="info-box mb-8">
                <i class="fas fa-info-circle mr-2 gold-text"></i>
                <strong>延迟付款定义：</strong>所有票款全额到账、滴灌通完成70%分成提取后，再支付的费用项
            </div>
            
            <div class="stat-card rounded-2xl p-8 fade-in">
                <div class="overflow-x-auto">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>费用类型</th>
                                <th>金额</th>
                                <th>依据说明</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td><i class="fas fa-file-invoice-dollar mr-2 gold-text"></i>税费</td>
                                <td class="highlight">672万</td>
                                <td>通过海口银行特殊关系申请晚付/慢付</td>
                            </tr>
                            <tr>
                                <td><i class="fas fa-palette mr-2 gold-text"></i>舞美尾款</td>
                                <td class="highlight">300万</td>
                                <td>舞美总费用500万，60%尾款延迟支付</td>
                            </tr>
                            <tr>
                                <td><i class="fas fa-users mr-2 gold-text"></i>团队工资</td>
                                <td class="highlight">30万</td>
                                <td>项目筹备期间暂缓发放，随项目利润补足</td>
                            </tr>
                            <tr style="background: rgba(212, 175, 55, 0.1);">
                                <td><strong><i class="fas fa-calculator mr-2 gold-text"></i>合计</strong></td>
                                <td><strong class="text-2xl gold-text">1002万</strong></td>
                                <td>-</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </section>

    <!-- Revenue -->
    <section id="revenue" class="py-24 px-6 bg-gradient-to-b from-[#0A0A0A] to-black">
        <div class="max-w-7xl mx-auto">
            <h2 class="section-title"><i class="fas fa-money-bill-wave"></i>收入构成</h2>
            
            <div class="stat-card rounded-2xl p-8 mb-8 fade-in">
                <h3 class="subsection-title"><i class="fas fa-stream"></i>核心收入来源</h3>
                <div class="overflow-x-auto">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>收入类型</th>
                                <th>说明</th>
                                <th>确定性</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td><i class="fas fa-ticket-alt mr-2 gold-text"></i>票务预售收入</td>
                                <td>拿到批文后大麦、猫眼上架预售</td>
                                <td><span class="risk-low">✅ 确定</span></td>
                            </tr>
                            <tr>
                                <td><i class="fas fa-landmark mr-2 gold-text"></i>政府补贴</td>
                                <td>参考杭州同类项目500-1000万</td>
                                <td><span class="risk-low">✅ 确定</span></td>
                            </tr>
                            <tr>
                                <td><i class="fas fa-handshake mr-2 gold-text"></i>赞助收入</td>
                                <td>已洽谈1500万意向，基线2000万</td>
                                <td><span class="risk-medium">❓ 不确定</span></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="stat-card rounded-2xl p-8 fade-in">
                <h3 class="subsection-title"><i class="fas fa-globe"></i>境内外项目收入核算差异</h3>
                <div class="overflow-x-auto">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>项目类型</th>
                                <th>纳入分账核算范围</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td><i class="fas fa-flag mr-2 gold-text"></i>境内项目</td>
                                <td>仅票务收入 + 账户利息纳入分账核算，<span class="highlight-red">赞助、周边等衍生收入不纳入</span></td>
                            </tr>
                            <tr>
                                <td><i class="fas fa-globe-americas mr-2 gold-text"></i>境外项目</td>
                                <td><span class="highlight">全量收入（含赞助/周边）纳入核算</span>，需审计报告覆盖</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </section>

    <!-- Risk Overview -->
    <section id="risk-overview" class="py-24 px-6">
        <div class="max-w-7xl mx-auto">
            <h2 class="section-title"><i class="fas fa-exclamation-triangle"></i>风险管理概览</h2>
            
            <div class="stat-card rounded-2xl p-8 mb-8 fade-in">
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div class="stat-card" style="border-color: rgba(244, 67, 54, 0.5);">
                        <div class="stat-value text-red-400">6</div>
                        <div class="stat-label">核心风险</div>
                    </div>
                    <div class="stat-card" style="border-color: rgba(255, 152, 0, 0.5);">
                        <div class="stat-value text-orange-400">5</div>
                        <div class="stat-label">运营风险</div>
                    </div>
                    <div class="stat-card" style="border-color: rgba(0, 200, 83, 0.5);">
                        <div class="stat-value text-green-400">6</div>
                        <div class="stat-label">补充风险</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value gold-text">17</div>
                        <div class="stat-label">风险总计</div>
                    </div>
                </div>
                
                <div class="info-box">
                    <strong>风险分类说明：</strong>
                    <ul class="mt-2 space-y-1 text-sm">
                        <li><span class="risk-high">高风险</span> 批文、资金挪用、艺人违约、不可抗力、禁令、主办方违约</li>
                        <li><span class="risk-medium">中风险</span> 投资不匹配、收入核算、票务数据、定价控票、极端情况</li>
                        <li><span class="risk-low">低风险</span> 夹层条款、赞助补贴、支出超支、账户冻结、境外项目、审计</li>
                    </ul>
                </div>
            </div>
        </div>
    </section>

    <!-- Core Risks 1-6 -->
    <section id="risk-1-6" class="py-24 px-6 bg-gradient-to-b from-[#0A0A0A] to-black">
        <div class="max-w-7xl mx-auto">
            <h2 class="section-title"><i class="fas fa-shield-virus"></i>核心风险详情（风险1-6）</h2>
            
            <!-- Risk 1 -->
            <div class="stat-card rounded-2xl p-6 mb-4 fade-in">
                <div class="accordion-header" onclick="toggleAccordion(this)">
                    <span><span class="risk-high mr-2">高</span><strong>风险1：批文风险</strong></span>
                    <i class="fas fa-chevron-down transition-transform"></i>
                </div>
                <div class="accordion-content open">
                    <div class="p-4">
                        <p class="mb-3"><strong>触发条件：</strong>未拿到文旅局/公安局批文，或批文延迟发放</p>
                        <p class="mb-3"><strong>应对措施：</strong>项目方先行支付10%艺人定金；批文获取作为出资前提；提前核查批文申请条件</p>
                        <p><strong>损失承担：</strong><span class="highlight-green">未拿到批文：10% Shows Fee可退还</span>，已发生的行政开支等小额损失不可收回</p>
                    </div>
                </div>
            </div>

            <!-- Risk 2 -->
            <div class="stat-card rounded-2xl p-6 mb-4 fade-in">
                <div class="accordion-header" onclick="toggleAccordion(this)">
                    <span><span class="risk-high mr-2">高</span><strong>风险2：资金挪用风险</strong></span>
                    <i class="fas fa-chevron-down transition-transform"></i>
                </div>
                <div class="accordion-content">
                    <div class="p-4">
                        <p class="mb-3"><strong>触发条件：</strong>运营方将票务收入、共管账户资金用于非约定用途</p>
                        <p class="mb-3"><strong>应对措施：</strong>开立<span class="highlight">中国银行共管账户</span>，双方持U盾；大额支出（＞50万）需双方确认；绑定大麦售票数据与账户进账</p>
                        <p><strong>损失承担：</strong>约定资金挪用的违约赔偿：<span class="highlight-red">本金+20%溢价</span></p>
                    </div>
                </div>
            </div>

            <!-- Risk 3 -->
            <div class="stat-card rounded-2xl p-6 mb-4 fade-in">
                <div class="accordion-header" onclick="toggleAccordion(this)">
                    <span><span class="risk-high mr-2">高</span><strong>风险3：艺人自身原因（违约）风险</strong></span>
                    <i class="fas fa-chevron-down transition-transform"></i>
                </div>
                <div class="accordion-content">
                    <div class="p-4">
                        <p class="mb-3"><strong>触发条件：</strong>签约后因怀孕、个人意愿等放弃演出；艺人发表不当言论等</p>
                        <p class="mb-3"><strong>应对措施：</strong>签约前核查艺人<span class="highlight">文旅部白名单</span>状态；合同明确约定艺人不得发表敏感言论；艺人需签署<span class="highlight">爱国合规承诺</span></p>
                        <p><strong>损失承担：</strong>已拿到批文/艺人到华后：全部秀费需全额退还</p>
                    </div>
                </div>
            </div>

            <!-- Risk 4 -->
            <div class="stat-card rounded-2xl p-6 mb-4 fade-in">
                <div class="accordion-header" onclick="toggleAccordion(this)">
                    <span><span class="risk-high mr-2">高</span><strong>风险4：不可抗力风险</strong></span>
                    <i class="fas fa-chevron-down transition-transform"></i>
                </div>
                <div class="accordion-content">
                    <div class="p-4">
                        <p class="mb-3"><strong>触发条件：</strong>演出前因天气、政治、战争等客观因素无法如期举行</p>
                        <p class="mb-3"><strong>应对措施：</strong>改期成本由运营方承担；滴灌通仅承担<span class="highlight">20%</span>不可抗力损失；剩余资金优先返还滴灌通</p>
                        <p><strong>损失承担：</strong>秀费不可退但可改签；滴灌通仅承担与收入波动相关损失（<span class="highlight-red">上限20%</span>）</p>
                    </div>
                </div>
            </div>

            <!-- Risk 5 -->
            <div class="stat-card rounded-2xl p-6 mb-4 fade-in">
                <div class="accordion-header" onclick="toggleAccordion(this)">
                    <span><span class="risk-high mr-2">高</span><strong>风险5：艺人被中国禁令限制风险</strong></span>
                    <i class="fas fa-chevron-down transition-transform"></i>
                </div>
                <div class="accordion-content">
                    <div class="p-4">
                        <p class="mb-3"><strong>触发条件：</strong>签约后艺人发表不当言论等导致被禁</p>
                        <p class="mb-3"><strong>应对措施：</strong>签约前核查艺人文旅部白名单状态；合同明确约定艺人不得发表敏感言论</p>
                        <p><strong>损失承担：</strong>全部秀费需全额退还；滴灌通可全额收回已出资本金</p>
                    </div>
                </div>
            </div>

            <!-- Risk 6 -->
            <div class="stat-card rounded-2xl p-6 fade-in">
                <div class="accordion-header" onclick="toggleAccordion(this)">
                    <span><span class="risk-high mr-2">高</span><strong>风险6：主办方主观原因（违约）风险</strong></span>
                    <i class="fas fa-chevron-down transition-transform"></i>
                </div>
                <div class="accordion-content">
                    <div class="p-4">
                        <p class="mb-3"><strong>触发条件：</strong>主办方因恶意取消、经营问题等非客观因素主动终止项目</p>
                        <p class="mb-3"><strong>应对措施：</strong>引入<span class="highlight">高唐文化</span>作为兜底方；约定违约时共管账户剩余资金优先返还滴灌通</p>
                        <p><strong>损失承担：</strong>滴灌通可全额收回已出资本金及对应收益，<span class="highlight-red">所有损失由主办方承担</span>；兜底方承担连带责任</p>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Operational Risks 7-11 -->
    <section id="risk-7-11" class="py-24 px-6">
        <div class="max-w-7xl mx-auto">
            <h2 class="section-title"><i class="fas fa-cogs"></i>运营风险详情（风险7-11）</h2>
            
            <div class="grid md:grid-cols-2 gap-4">
                <div class="stat-card rounded-2xl p-6 fade-in">
                    <h4 class="text-lg font-semibold gold-text mb-3"><span class="risk-medium mr-2">中</span>风险7：投资资金与总成本不匹配</h4>
                    <p class="text-white/70 text-sm mb-2"><strong>触发：</strong>项目总成本约7700万，融资仅5000万</p>
                    <p class="text-white/70 text-sm"><strong>应对：</strong>艺人费用按50%预付核算；所有收入优先偿还优先级投资人</p>
                </div>

                <div class="stat-card rounded-2xl p-6 fade-in">
                    <h4 class="text-lg font-semibold gold-text mb-3"><span class="risk-medium mr-2">中</span>风险8：收入分成核算风险</h4>
                    <p class="text-white/70 text-sm mb-2"><strong>触发：</strong>信息流与现金流不一致</p>
                    <p class="text-white/70 text-sm"><strong>应对：</strong>设立共管账户；仅以<span class="highlight">实际到账现金流</span>作为收入分成依据</p>
                </div>

                <div class="stat-card rounded-2xl p-6 fade-in">
                    <h4 class="text-lg font-semibold gold-text mb-3"><span class="risk-medium mr-2">中</span>风险9：票务销售数据核实</h4>
                    <p class="text-white/70 text-sm mb-2"><strong>触发：</strong>多渠道售票数据无法完全归集</p>
                    <p class="text-white/70 text-sm"><strong>应对：</strong>以大麦系统数据为核心；对接API；公安备案交叉验证；赠票上限<span class="highlight">1000张</span></p>
                </div>

                <div class="stat-card rounded-2xl p-6 fade-in">
                    <h4 class="text-lg font-semibold gold-text mb-3"><span class="risk-medium mr-2">中</span>风险10：票务定价与控票</h4>
                    <p class="text-white/70 text-sm mb-2"><strong>触发：</strong>主办方控票或低价倾销门票</p>
                    <p class="text-white/70 text-sm"><strong>应对：</strong>最低售价不低于票面价<span class="highlight">50%-60%</span>；控票比例不超<span class="highlight">20%</span></p>
                </div>
            </div>
        </div>
    </section>

    <!-- Contract Terms -->
    <section id="contract" class="py-24 px-6 bg-gradient-to-b from-[#0A0A0A] to-black">
        <div class="max-w-7xl mx-auto">
            <h2 class="section-title"><i class="fas fa-file-signature"></i>合同条款概览（12大模块）</h2>
            
            <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div class="stat-card rounded-2xl p-6 fade-in">
                    <h3 class="subsection-title text-base"><i class="fas fa-stamp"></i>模块一：批文</h3>
                    <ul class="text-sm text-white/70 space-y-1">
                        <li>• 明确批文申请主体及责任</li>
                        <li>• 约定未获批的退款流程及时限</li>
                        <li>• 禁止项目方擅自放弃批文申请</li>
                    </ul>
                </div>

                <div class="stat-card rounded-2xl p-6 fade-in">
                    <h3 class="subsection-title text-base"><i class="fas fa-university"></i>模块二：资金与账户</h3>
                    <ul class="text-sm text-white/70 space-y-1">
                        <li>• 境内：中国银行双U盾共管账户</li>
                        <li>• 禁止运营方擅自变更账户</li>
                        <li>• 挪用违约：本金+20%溢价赔偿</li>
                    </ul>
                </div>

                <div class="stat-card rounded-2xl p-6 fade-in">
                    <h3 class="subsection-title text-base"><i class="fas fa-user-tie"></i>模块三：艺人</h3>
                    <ul class="text-sm text-white/70 space-y-1">
                        <li>• 艺人需无黑名单记录</li>
                        <li>• 艺人需签署爱国合规承诺</li>
                        <li>• 违约时全额返还已付费用</li>
                    </ul>
                </div>

                <div class="stat-card rounded-2xl p-6 fade-in">
                    <h3 class="subsection-title text-base"><i class="fas fa-bolt"></i>模块四：不可抗力</h3>
                    <ul class="text-sm text-white/70 space-y-1">
                        <li>• 明确不可抗力的界定范围</li>
                        <li>• 滴灌通损失承担上限20%</li>
                        <li>• 明确改期时间限制及成本分摊</li>
                    </ul>
                </div>

                <div class="stat-card rounded-2xl p-6 fade-in">
                    <h3 class="subsection-title text-base"><i class="fas fa-calculator"></i>模块五：支出与预算</h3>
                    <ul class="text-sm text-white/70 space-y-1">
                        <li>• 预算明细作为合同附件</li>
                        <li>• 支出浮动上限±10%</li>
                        <li>• 大额支出三家比价</li>
                    </ul>
                </div>

                <div class="stat-card rounded-2xl p-6 fade-in">
                    <h3 class="subsection-title text-base"><i class="fas fa-chart-pie"></i>模块六：收入与分账</h3>
                    <ul class="text-sm text-white/70 space-y-1">
                        <li>• 境内排除赞助/周边收入</li>
                        <li>• 境外审计覆盖全量收入</li>
                        <li>• 售票数据与进账核对机制</li>
                    </ul>
                </div>

                <div class="stat-card rounded-2xl p-6 fade-in">
                    <h3 class="subsection-title text-base"><i class="fas fa-ticket-alt"></i>模块七：票务</h3>
                    <ul class="text-sm text-white/70 space-y-1">
                        <li>• 赠票上限1000张，需提前报备</li>
                        <li>• 最低售价不低于票面价50%-60%</li>
                        <li>• 控票比例不超20%</li>
                    </ul>
                </div>

                <div class="stat-card rounded-2xl p-6 fade-in">
                    <h3 class="subsection-title text-base"><i class="fas fa-file-invoice"></i>模块八：税务</h3>
                    <ul class="text-sm text-white/70 space-y-1">
                        <li>• 税务支出承担主体为运营方</li>
                        <li>• 税费支付时间为演出后</li>
                        <li>• 税费不得优先于滴灌通分账</li>
                    </ul>
                </div>

                <div class="stat-card rounded-2xl p-6 fade-in">
                    <h3 class="subsection-title text-base"><i class="fas fa-building"></i>模块九至十二</h3>
                    <ul class="text-sm text-white/70 space-y-1">
                        <li>• 主体合规：运营方需无历史债务</li>
                        <li>• 违约与赔偿：兜底方承担连带责任</li>
                        <li>• 审计：1个月内出具第三方审计报告</li>
                        <li>• Penalty：无业界统一标准，需协商</li>
                    </ul>
                </div>
            </div>
        </div>
    </section>

    <!-- Account Supervision -->
    <section id="account" class="py-24 px-6">
        <div class="max-w-7xl mx-auto">
            <h2 class="section-title"><i class="fas fa-lock"></i>共管账户与监管机制</h2>
            
            <div class="grid md:grid-cols-2 gap-8">
                <div class="stat-card rounded-2xl p-8 fade-in">
                    <h3 class="subsection-title"><i class="fas fa-piggy-bank"></i>账户设立</h3>
                    <div class="overflow-x-auto">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>项目类型</th>
                                    <th>账户要求</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>境内项目</td>
                                    <td><span class="highlight">中国银行</span>共管账户，双方持U盾</td>
                                </tr>
                                <tr>
                                    <td>境外项目</td>
                                    <td>指定合规收款账户</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <div class="stat-card rounded-2xl p-8 fade-in">
                    <h3 class="subsection-title"><i class="fas fa-eye"></i>收支监管</h3>
                    <ul class="space-y-3 text-sm">
                        <li class="flex items-start gap-2"><i class="fas fa-check-circle gold-text mt-1"></i><span>大额支出（＞50万）需双方确认</span></li>
                        <li class="flex items-start gap-2"><i class="fas fa-check-circle gold-text mt-1"></i><span>绑定大麦售票数据与账户进账</span></li>
                        <li class="flex items-start gap-2"><i class="fas fa-check-circle gold-text mt-1"></i><span>大额支出实行<span class="highlight">三家比价</span></span></li>
                        <li class="flex items-start gap-2"><i class="fas fa-check-circle gold-text mt-1"></i><span>超预算<span class="highlight">10%</span>的支出不予批付</span></li>
                    </ul>
                </div>
            </div>
        </div>
    </section>

    <!-- Share Ratio & Repayment -->
    <section id="share-ratio" class="py-24 px-6 bg-gradient-to-b from-[#0A0A0A] to-black">
        <div class="max-w-7xl mx-auto">
            <h2 class="section-title"><i class="fas fa-percentage"></i>分成比例与回款顺序</h2>
            
            <div class="stat-card rounded-2xl p-8 mb-8 fade-in">
                <h3 class="subsection-title"><i class="fas fa-chart-pie"></i>分成比例</h3>
                <div class="grid md:grid-cols-2 gap-6">
                    <div class="text-center p-8 rounded-2xl" style="background: linear-gradient(135deg, rgba(249, 168, 37, 0.15), rgba(249, 168, 37, 0.05)); border: 2px solid rgba(249, 168, 37, 0.4);">
                        <div class="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style="background: rgba(249, 168, 37, 0.2);">
                            <i class="fas fa-percentage gold-text text-2xl"></i>
                        </div>
                        <div class="text-5xl font-bold gold-text mb-2">70%</div>
                        <div class="text-white/70 font-medium">滴灌通分成比例</div>
                        <p class="text-sm text-white/50 mt-3">从第一笔票款到账即按此比例提取<br/>30%资金始终留存账上</p>
                    </div>
                    <div class="text-center p-8 rounded-2xl" style="background: linear-gradient(135deg, rgba(0, 200, 83, 0.15), rgba(0, 200, 83, 0.05)); border: 2px solid rgba(0, 200, 83, 0.4);">
                        <div class="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style="background: rgba(0, 200, 83, 0.2);">
                            <i class="fas fa-shield-alt text-green-400 text-2xl"></i>
                        </div>
                        <div class="text-5xl font-bold text-green-400 mb-2">25.5%</div>
                        <div class="text-white/70 font-medium">保本点</div>
                        <p class="text-sm text-white/50 mt-3">需票房收入2,800万即可保本<br/>占总票仓1.1亿的25.5%</p>
                    </div>
                </div>
            </div>

            <div class="stat-card rounded-2xl p-8 fade-in">
                <h3 class="subsection-title"><i class="fas fa-sort-amount-down"></i>回款顺序</h3>
                <div class="flow-chart">
                    <div class="flow-step" style="background: linear-gradient(135deg, rgba(0, 200, 83, 0.3), rgba(0, 200, 83, 0.1)); border-color: rgba(0, 200, 83, 0.5);">
                        <div class="text-green-400 font-bold text-lg">第一顺位</div>
                        <div class="text-white">滴灌通优先级</div>
                        <div class="text-sm text-white/60">2000万</div>
                    </div>
                    <i class="fas fa-arrow-right flow-arrow"></i>
                    <div class="flow-step" style="background: linear-gradient(135deg, rgba(255, 152, 0, 0.3), rgba(255, 152, 0, 0.1)); border-color: rgba(255, 152, 0, 0.5);">
                        <div class="text-orange-400 font-bold text-lg">第二顺位</div>
                        <div class="text-white">夹层</div>
                        <div class="text-sm text-white/60">≤300万</div>
                    </div>
                    <i class="fas fa-arrow-right flow-arrow"></i>
                    <div class="flow-step" style="background: linear-gradient(135deg, rgba(244, 67, 54, 0.3), rgba(244, 67, 54, 0.1)); border-color: rgba(244, 67, 54, 0.5);">
                        <div class="text-red-400 font-bold text-lg">第三顺位</div>
                        <div class="text-white">劣后</div>
                        <div class="text-sm text-white/60">3000万</div>
                    </div>
                </div>
                
                <div class="info-box mt-4">
                    <i class="fas fa-lightbulb mr-2 gold-text"></i>
                    <strong>行业参考：</strong>1亿票仓预售可收2500-3000万预付款，该保本点具备较强可实现性，风险可控
                </div>
            </div>
        </div>
    </section>

    <!-- Data Summary -->
    <section id="data-summary" class="py-24 px-6">
        <div class="max-w-7xl mx-auto">
            <h2 class="section-title"><i class="fas fa-database"></i>核心数据速查表</h2>
            
            <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                <!-- 资金数据 -->
                <div class="stat-card rounded-2xl p-6 fade-in">
                    <h3 class="subsection-title text-base"><i class="fas fa-coins"></i>票务收入数据</h3>
                    <table class="data-table text-sm">
                        <tbody>
                            <tr><td>总票仓</td><td class="highlight">1.1亿</td></tr>
                            <tr><td>净票务收入</td><td class="highlight">1.187亿</td></tr>
                            <tr><td>平均票价</td><td class="highlight">1,412元</td></tr>
                            <tr><td>可售容量/场</td><td class="highlight">44,000张</td></tr>
                            <tr><td>演出场次</td><td class="highlight">2场</td></tr>
                        </tbody>
                    </table>
                </div>

                <!-- 成本数据 -->
                <div class="stat-card rounded-2xl p-6 fade-in">
                    <h3 class="subsection-title text-base"><i class="fas fa-dollar-sign"></i>成本支出数据</h3>
                    <table class="data-table text-sm">
                        <tbody>
                            <tr><td>艺人费用</td><td class="highlight">5,271万</td></tr>
                            <tr><td>差旅费用</td><td class="highlight">154.3万</td></tr>
                            <tr><td>制作费用</td><td class="highlight">535万</td></tr>
                            <tr><td>场地费用</td><td class="highlight">751.2万</td></tr>
                            <tr><td>推广+行政</td><td class="highlight">490.4万</td></tr>
                        </tbody>
                    </table>
                </div>

                <!-- 利润数据 -->
                <div class="stat-card rounded-2xl p-6 fade-in">
                    <h3 class="subsection-title text-base"><i class="fas fa-chart-line"></i>利润数据</h3>
                    <table class="data-table text-sm">
                        <tbody>
                            <tr><td>总成本支出</td><td class="highlight">7,000万</td></tr>
                            <tr><td>赞助净收入</td><td class="highlight">2,012万</td></tr>
                            <tr><td>净收入(含赞助)</td><td class="highlight">6,680万</td></tr>
                            <tr><td><strong>税后净利润</strong></td><td class="gold-text font-bold">5,678万</td></tr>
                        </tbody>
                    </table>
                </div>

                <!-- 分成与保本 -->
                <div class="stat-card rounded-2xl p-6 fade-in">
                    <h3 class="subsection-title text-base"><i class="fas fa-percentage"></i>分成与保本</h3>
                    <table class="data-table text-sm">
                        <tbody>
                            <tr><td>滴灌通分成比例</td><td class="highlight">70%</td></tr>
                            <tr><td>保本点</td><td class="highlight">25.5%</td></tr>
                            <tr><td>保本收入</td><td class="highlight">2,800万</td></tr>
                            <tr><td>税后净利润</td><td class="highlight">5,678万</td></tr>
                        </tbody>
                    </table>
                </div>

                <!-- 票务控制 -->
                <div class="stat-card rounded-2xl p-6 fade-in">
                    <h3 class="subsection-title text-base"><i class="fas fa-ticket-alt"></i>票务控制</h3>
                    <table class="data-table text-sm">
                        <tbody>
                            <tr><td>赠票上限</td><td class="highlight">1000张</td></tr>
                            <tr><td>最低售价</td><td class="highlight">票面价50%-60%</td></tr>
                            <tr><td>控票比例上限</td><td class="highlight">20%</td></tr>
                            <tr><td>正规渠道占比</td><td class="highlight">70%</td></tr>
                        </tbody>
                    </table>
                </div>

                <!-- 其他关键数据 -->
                <div class="stat-card rounded-2xl p-6 fade-in">
                    <h3 class="subsection-title text-base"><i class="fas fa-star"></i>其他关键数据</h3>
                    <table class="data-table text-sm">
                        <tbody>
                            <tr><td>夹层投资上限</td><td class="highlight">300万</td></tr>
                            <tr><td>夹层收益封顶</td><td class="highlight">4个月20%</td></tr>
                            <tr><td>赞助意向</td><td class="highlight">1500万</td></tr>
                            <tr><td>政府补贴</td><td class="highlight">500-1000万</td></tr>
                            <tr><td>不可抗力损失上限</td><td class="highlight">总损失20%</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </section>

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

// API endpoint
app.post('/api/contact', async (c) => {
  const body = await c.req.json()
  return c.json({ success: true, message: 'Thank you for your interest!' })
})

export default app
