# 🔮 命运之轮 - Mystic Tarot

一个融合了 AI 深度解读的在线塔罗牌占卜 Web 应用。用户输入问题，抽取三张塔罗牌，由 AI 进行个性化、有温度的深度解读。

## ✨ 功能特性

- **78 张完整塔罗牌** — 包含大阿尔卡纳（22 张）和小阿尔卡纳（56 张），正位/逆位随机
- **三牌阵占卜** — 经典"过去-现在-未来"时间流牌阵
- **AI 深度解读** — 基于 DeepSeek 大语言模型，为每张牌结合用户的具体问题定制解读
- **流畅的翻牌动画** — 扇形展牌、选牌、翻牌的沉浸式交互体验
- **神秘星域视觉风格** — 深色星空主题 UI，营造占卜仪式感

## 🧠 实现原理

### 整体架构

```
用户浏览器 (HTML/CSS/JS)  ←→  Node.js/Express 后端  ←→  DeepSeek AI API
```

前端纯静态（无框架），后端 Express 提供 API 并代理 AI 请求。

### 数据流

```
① 用户输入问题 → 点击"洗牌"
② 后端随机打乱 78 张牌，随机分配正/逆位 → 返回洗好的牌组
③ 牌以扇形展开 → 用户点击选择 3 张牌
④ 选牌后翻转动画 → 自动发送 POST 请求到后端
⑤ 后端将【用户问题 + 三张牌信息】组装成提示词 → 调用 DeepSeek API
⑥ AI 返回结构化解读（命运的映射 / 时光的流转 / 宇宙的神谕）→ 渲染展示
```

### 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | 原生 HTML5 + CSS3 + JavaScript (ES6) |
| 后端 | Node.js + Express 4.x |
| 外部 API | DeepSeek Chat API（deepseek-chat 模型） |
| 静态资源 | 78 张塔罗牌图片（JPEG） |

### 关键设计

- **安全**：API Key 通过环境变量注入，前端无法获取，仅服务端持有
- **洗牌**：Fisher-Yates 洗牌算法 + 50% 概率随机正逆位
- **提示词工程**：精心设计的系统提示词，要求 AI 避免笼统解读，必须结合具体问题进行针对性分析
- **结构化输出**：AI 输出 HTML 格式的解读，分三个章节直接渲染

## 🚀 本地运行

```bash
# 安装依赖
npm install

# 配置环境变量（复制并修改）
cp .env.example .env
# 编辑 .env 填入你的 DeepSeek API Key

# 启动服务
npm start

# 访问 http://localhost:3000
```

## 📦 项目结构

```
塔罗牌/
├── public/                    # 静态资源（对外公开）
│   ├── index.html             # 主页面
│   ├── style.css              # 样式表
│   ├── app.js                 # 前端交互逻辑
│   └── images/                # 78 张塔罗牌图片
├── server.js                  # Express 后端服务器
├── tarot-data.json            # 78 张塔罗牌数据
├── tarot-utils.js             # 工具函数
├── package.json
├── .env                       # 环境变量（不提交 git）
└── .env.example               # 环境变量模板
```

## 🛠 部署

推荐使用 Zeabur（国内访问快）或 Railway 一键部署：

1. 推送到 GitHub
2. 在 Zeabur 中导入仓库
3. 设置环境变量 `DEEPSEEK_API_KEY`
4. 自动部署完成

## 📄 许可证

MIT License
