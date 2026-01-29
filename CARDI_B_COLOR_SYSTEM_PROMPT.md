# Cardi B 品牌配色体系 - 统一设计规范

> **版本**: v2.0
> **更新日期**: 2026-01-29
> **适用范围**: 所有 Vibelinks Entertainment Cardi B 相关项目（含艺人票房测算工具）
> **风格定位**: 奢华街头 + 张扬个性

---

## 一、核心配色定义

### 1.1 基础主色（视觉核心/大面积使用：≥60%）
> 用于：背景、主视觉基底、Logo/标题文字

| 色名 | 十六进制 | RGB | 用途示例 |
|------|---------|-----|---------|
| **纯黑** | `#0b0704` | rgb(11,7,4) | 页面背景、深色区块、主导航背景 |
| **金棕色** | `#b5733f` | rgb(181,115,63) | 金色渐变基调、品牌主色、标题装饰 |

### 1.2 基础辅助色（中等面积使用：20-30%）
> 用于：副标题、装饰元素、视觉分区

| 色名 | 十六进制 | RGB | 用途示例 |
|------|---------|-----|---------|
| **浅棕粉** | `#d9aa9a` | rgb(217,170,154) | 副标题、边框、hover状态文字 |
| **纯白** | `#ffffff` | rgb(255,255,255) | 正文、卡片背景、对比元素 |

### 1.3 标志性强调色（小面积点睛：≤10%）
> 用于：视觉焦点、高光元素、关键符号、状态指示

| 色名 | 十六进制 | RGB | 用途示例 |
|------|---------|-----|---------|
| **深金黄** | `#c39907` | rgb(195,153,7) | 高光、重要数值、强调边框 |
| **浅金黄** | `#d5ac04` | rgb(213,172,4) | 金色渐变终点、hover高光 |
| **亮粉色** | `#f96daa` | rgb(249,109,170) | **主CTA按钮**、焦点元素、WAP主题 |
| **柠檬黄** | `#feff00` | rgb(254,255,0) | 点睛装饰、WAP主题、警示强调 |
| **苹果红** | `#ff0000` | rgb(255,0,0) | 危险/错误状态、Am I The Drama主题 |
| **品红** | `#9b227f` | rgb(155,34,127) | 渐变搭配色、亮粉暗部 |
| **翠绿** | `#00a651` | rgb(0,166,81) | 成功状态、增长指标 |
| **芥末黄** | `#e2b13c` | rgb(226,177,60) | 提示/警告状态、次要强调 |
| **海军蓝** | `#0f2e5a` | rgb(15,46,90) | 数据图表、第三辅助色 |

### 1.4 个人标志性限定色（按需选用/风格强化）
> 用于：细节装饰、专属符号、主题物料

| 色名 | 十六进制 | RGB | 说明 |
|------|---------|-----|------|
| **CL红** | `#cc0000` | rgb(204,0,0) | Christian Louboutin红底鞋同色 |
| **宝蓝** | `#0000FF` | rgb(0,0,255) | 艺人最爱色，高饱和正蓝 |

---

## 二、CSS变量定义标准

```css
:root {
    /* ===== 基础主色 - 视觉核心/大面积使用 ===== */
    --cb-black: #0b0704;        /* 纯黑 */
    --cb-gold-brown: #b5733f;   /* 金棕色 */
    
    /* ===== 基础辅助色 - 中等面积使用 ===== */
    --cb-light-brown-pink: #d9aa9a;  /* 浅棕粉 */
    --cb-pure-white: #ffffff;        /* 纯白 */
    
    /* ===== 标志性强调色 - 小面积点睛 ===== */
    --cb-deep-gold: #c39907;     /* 深金黄 */
    --cb-light-gold: #d5ac04;    /* 浅金黄 */
    --cb-hot-pink: #f96daa;      /* 亮粉色 - 主CTA按钮 */
    --cb-lemon-yellow: #feff00;  /* 柠檬黄 */
    --cb-apple-red: #ff0000;     /* 苹果红 - 危险/错误 */
    --cb-magenta: #9b227f;       /* 品红 */
    --cb-emerald: #00a651;       /* 翠绿 - 成功 */
    --cb-mustard: #e2b13c;       /* 芥末黄 - 警告 */
    --cb-navy: #0f2e5a;          /* 海军蓝 */
    
    /* ===== 个人标志性限定色 - 按需选用 ===== */
    --cb-cl-red: #cc0000;        /* CL红底鞋同色 */
    --cb-royal-blue: #0000FF;    /* 艺人最爱色 */
    
    /* ===== 旧变量兼容（向后兼容） ===== */
    --black: #0b0704;
    --gold-brown: #b5733f;
    --gold: #b5733f;
    --gold-light: #d9aa9a;
    --gold-dark: #c39907;
    --dark: #0b0704;
    --pure-white: #ffffff;
    --hot-pink: #f96daa;
    --light-brown-pink: #d9aa9a;
    --deep-gold: #c39907;
    --light-gold: #d5ac04;
    --apple-red: #ff0000;
    --emerald: #00a651;
    --mustard: #e2b13c;
    --navy: #0f2e5a;
    --magenta: #9b227f;
    --lemon-yellow: #feff00;
}
```

---

## 三、配色应用原则

### 3.1 对比度原则
> 优先高对比组合，确保视觉冲击力，避免同色系低对比搭配

**核心高对比组合**：
- ✅ 黑 + 金（`#0b0704` + `#b5733f`）— **最常用**
- ✅ 黑 + 红（`#0b0704` + `#ff0000`）
- ✅ 白 + 红（`#ffffff` + `#ff0000`）
- ✅ 黑 + 亮粉（`#0b0704` + `#f96daa`）— **CTA按钮**

**避免的低对比组合**：
- ❌ 金棕 + 芥末黄
- ❌ 亮粉 + 品红（可用于渐变）
- ❌ 深金黄 + 浅金黄（可用于渐变）

### 3.2 面积占比原则
```
主色（黑/金棕）    ≥ 60%    背景、大块区域
辅助色（白/浅棕粉）  20-30%   内容区、卡片、文字
强调色              ≤ 10%    按钮、图标、高亮点
限定色              按需      专属符号、主题强化
```

### 3.3 饱和度原则
- **保持高饱和原调**，不降灰度、不加灰度
- 半透明使用 `rgba()` 而非降低饱和度
- 渐变保持同色系色相一致

### 3.4 主题适配原则
> 结合具体作品/主题物料，从强调色中选取主题色

| 主题 | 主色组合 | 示例 |
|------|---------|------|
| **Bodak Yellow** | 金黄系 + 黑 | `#c39907`, `#d5ac04`, `#e2b13c` + `#0b0704` |
| **WAP** | 亮粉 + 柠檬黄 + 黑 | `#f96daa`, `#feff00` + `#0b0704` |
| **Am I The Drama?** | 红 + 白 + 黑 | `#ff0000`, `#ffffff`, `#0b0704` |
| **投资文档/通用** | 黑 + 金 + 亮粉点睛 | 默认组合 |

---

## 四、常用渐变定义

### 4.1 金色渐变（品牌核心）
```css
/* 金色文字渐变 */
.gold-text {
    background: linear-gradient(135deg, #b5733f 0%, #d5ac04 50%, #b5733f 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}

/* 金色背景渐变 */
.gold-bg {
    background: linear-gradient(135deg, #b5733f 0%, #c39907 50%, #b5733f 100%);
}
```

### 4.2 亮粉渐变（CTA按钮）
```css
/* 主CTA按钮 */
.btn-primary {
    background: linear-gradient(135deg, #f96daa 0%, #9b227f 100%);
}

/* 粉色背景渐变 */
.pink-gradient {
    background: linear-gradient(135deg, #f96daa 0%, #9b227f 100%);
}
```

### 4.3 深色背景渐变
```css
/* 页面主背景 */
.gradient-bg {
    background: linear-gradient(135deg, #0b0704 0%, #1a1208 50%, #0b0704 100%);
}

/* 带金色光晕的背景 */
.gradient-bg::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background: radial-gradient(ellipse at 30% 20%, rgba(181,115,63,0.15) 0%, transparent 50%),
                radial-gradient(ellipse at 70% 80%, rgba(249,109,170,0.08) 0%, transparent 50%);
}
```

---

## 五、状态色彩定义

| 状态 | 颜色 | 变量 | 使用场景 |
|------|------|------|---------|
| **成功** | `#00a651` | `--cb-emerald` | 成功提示、增长指标、完成状态 |
| **警告** | `#e2b13c` | `--cb-mustard` | 警告提示、中等风险、待处理 |
| **危险/错误** | `#ff0000` | `--cb-apple-red` | 错误提示、高风险、删除操作 |
| **信息** | `#0f2e5a` | `--cb-navy` | 信息提示、数据展示 |
| **强调/焦点** | `#f96daa` | `--cb-hot-pink` | CTA按钮、主要操作、当前选中 |
| **次要强调** | `#b5733f` | `--cb-gold-brown` | 次要按钮、边框、图标 |

---

## 六、风格与视觉细节

### 6.1 装饰元素搭配
- **水钻/珍珠效果**：使用金色渐变 + 高光点
- **金属光泽**：金棕到深金黄渐变
- **复古肌理**：配合半透明叠加和微妙纹理

### 6.2 边界处理
- 色彩可结合渐变（同色系渐变：金黄系渐变、红金渐变）
- **不做复杂混色**
- **边界保持干净清晰**

### 6.3 阴影与发光
```css
/* 金色发光 */
.glow-gold {
    box-shadow: 0 0 40px rgba(181, 115, 63, 0.3);
}

/* 亮粉发光 */
.glow-pink {
    box-shadow: 0 0 40px rgba(249, 109, 170, 0.3);
}

/* 按钮悬停阴影 */
.btn-primary:hover {
    box-shadow: 0 8px 25px rgba(249, 109, 170, 0.4);
}

.btn-gold:hover {
    box-shadow: 0 8px 25px rgba(181, 115, 63, 0.4);
}
```

---

## 七、Tailwind 覆盖映射

> 用于将 Tailwind 默认色彩映射到 Cardi B 配色体系

```css
/* 紫色系 → 金棕系 */
.from-purple-600, .from-purple-500 { --tw-gradient-from: #b5733f; }
.to-purple-700, .to-indigo-600 { --tw-gradient-to: #c39907; }
.bg-purple-600, .bg-purple-500 { background-color: #b5733f; }
.text-purple-600, .text-purple-700 { color: #b5733f; }
.border-purple-500 { border-color: #b5733f; }

/* 靛蓝系 → 亮粉系 */
.from-indigo-500 { --tw-gradient-from: #f96daa; }
.to-indigo-600 { --tw-gradient-to: #9b227f; }
.bg-indigo-600 { background-color: #f96daa; }

/* 琥珀色 → 芥末黄/深金 */
.bg-amber-100 { background-color: rgba(195,153,7,0.2); }
.text-amber-600 { color: #e2b13c; }

/* 红色 → 苹果红 */
.text-red-500, .text-red-600 { color: #ff0000; }
.bg-red-50 { background-color: rgba(255,0,0,0.08); }

/* 绿色 → 翠绿 */
.text-green-600, .text-green-700 { color: #00a651; }
.bg-green-50 { background-color: rgba(0,166,81,0.1); }

/* 蓝色 → 海军蓝 */
.text-blue-600, .text-blue-700 { color: #0f2e5a; }
.bg-blue-50 { background-color: rgba(15,46,90,0.08); }

/* 橙色 → 金棕 */
.text-orange-600, .text-orange-700 { color: #b5733f; }
.bg-orange-50 { background-color: rgba(181,115,63,0.1); }

/* 灰色 → 基于黑色的灰度 */
.bg-gray-800 { background-color: #0b0704; }
.text-gray-700 { color: rgba(11,7,4,0.85); }
```

---

## 八、代码实现检查清单

### 页面实现检查点
- [ ] CSS变量是否完整定义（基础主色、辅助色、强调色、限定色）
- [ ] 背景是否使用 `#0b0704` 或深色渐变
- [ ] 主CTA按钮是否使用亮粉渐变 `#f96daa → #9b227f`
- [ ] 金色文字是否使用渐变而非纯色
- [ ] 状态色是否符合规范（成功/警告/危险）
- [ ] 高对比度组合是否应用正确
- [ ] 面积占比是否符合 60/20-30/10 原则
- [ ] Tailwind 覆盖是否正确映射

### 当前已实现文件
- ✅ `/home/user/webapp/src/index.tsx` - 主投资文档页面
- ✅ `/home/user/webapp/src/predictor-page.ts` - 艺人票房测算页面
- ✅ `/home/user/webapp/public/static/style.css` - 统一CSS变量文件

---

## 九、使用示例

### 主CTA按钮
```html
<button class="predictor-btn">
    <i class="fas fa-chart-line"></i>
    艺人票房测算
</button>

<style>
.predictor-btn {
    background: linear-gradient(135deg, var(--cb-hot-pink) 0%, var(--cb-magenta) 100%);
    color: var(--cb-pure-white);
}
.predictor-btn:hover {
    box-shadow: 0 10px 30px rgba(249, 109, 170, 0.4);
}
</style>
```

### 金色标题
```html
<h1 class="gold-text">CHINA TOUR</h1>

<style>
.gold-text {
    background: linear-gradient(135deg, var(--cb-gold-brown) 0%, var(--cb-light-gold) 50%, var(--cb-gold-brown) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}
</style>
```

### 状态徽章
```html
<span class="risk-high">高风险</span>
<span class="risk-medium">中等风险</span>
<span class="risk-low">低风险</span>

<style>
.risk-high { background: rgba(255,0,0,0.2); color: #ff0000; }
.risk-medium { background: rgba(226,177,60,0.2); color: #e2b13c; }
.risk-low { background: rgba(0,166,81,0.2); color: #00a651; }
</style>
```

---

> **备注**: 本文档作为 Cardi B 品牌配色的唯一规范来源，所有新页面和组件应严格遵循此规范。如需调整配色，请更新本文档后同步更新相关代码文件。
