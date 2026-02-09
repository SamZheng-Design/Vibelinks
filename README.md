# Vibelinks

多项目仓库 - 包含多个独立项目

## 项目列表

| 项目 | 描述 | 技术栈 |
|------|------|--------|
| [concert-artist-test](./concert-artist-test/) | 演唱会票房预测器 (Comparable模型) | Hono + TypeScript + TailwindCSS |

## 项目结构

```
Vibelinks/
├── README.md                    # 本文件
├── .gitignore                   # Git忽略配置
├── concert-artist-test/         # 演唱会票房预测器项目
│   ├── src/                     # 源代码
│   ├── public/                  # 静态资源
│   ├── package.json             # 依赖配置
│   └── README.md                # 项目详细文档
└── [future-projects]/           # 未来更多项目...
```

## 快速开始

进入对应项目目录后，按照各项目的 README 指引操作：

```bash
# 例如：运行演唱会票房预测器
cd concert-artist-test
npm install
npm run build
npm run dev
```

## 项目说明

### concert-artist-test
基于 Comparable 模型的演唱会票房预测工具，用于预测欧美艺人在中国内地演唱会的票房表现。

**核心功能：**
- 多维度数据输入（百度指数、网易云粉丝、小红书粉丝）
- 六步计算模型（归一化→D指数→LC转化率→F指数→锚点校准→城市溢价）
- 双锚点校准（Travis Scott / Kanye West）
- 三档预测输出（保守/中性/激进）

详细文档请查看 [concert-artist-test/README.md](./concert-artist-test/README.md)

---

*Vibelinks - 音乐行业数据分析工具集*
