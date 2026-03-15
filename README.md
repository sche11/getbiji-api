# Get笔记 API 服务

将 B站/YouTube 视频链接通过 API 发送到 Get笔记 进行 AI 总结。

这是原 Tampermonkey 脚本 `getbiji.js` 的 API 包装版本。

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/sche11/getbiji-api)

## 功能特性

- 🎬 支持 Bilibili 和 YouTube 视频链接
- 🤖 自动提取视频标题和元信息
- 📝 多种提示词模板（默认简洁版、详细分析版、学术研究版、读书笔记版）
- ✏️ 支持自定义提示词
- 📦 批量处理多个视频链接
- 🔐 支持通过环境变量或请求参数配置认证信息
- 🚀 支持 Vercel 一键部署

## 快速开始

### 方式一：Vercel 一键部署（推荐）

点击上方按钮，或使用 Vercel CLI：

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录并部署
vercel login
vercel
```

部署完成后，在 Vercel Dashboard → Project Settings → Environment Variables 中添加：
- `GETBIJI_TOKEN` = 你的 Get笔记 Token

### 方式二：本地运行

#### 1. 安装依赖

```bash
cd getbiji-api
npm install
```

#### 2. 配置认证信息

复制 `.env.example` 为 `.env`，并填写你的 Get笔记 认证信息：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
# 从浏览器开发者工具获取（推荐方式）
GETBIJI_TOKEN=your_token_here

# 或者使用 Cookie
GETBIJI_COOKIE=your_cookie_here
```

#### 3. 启动服务

```bash
# 生产模式
npm start

# 开发模式（自动重启）
npm run dev
```

服务将在 `http://localhost:3000` 启动。

---

## 获取 Get笔记 Token

### 方法一：从 Local Storage 获取（推荐）

1. 打开浏览器，登录 [Get笔记](https://www.biji.com)
2. 按 **F12** 打开开发者工具
3. 切换到 **Application** (应用) 标签页
4. 在左侧找到 **Local Storage** → `https://www.biji.com`
5. 查找 `token` 或 `auth_token` 字段，复制其值

### 方法二：从 Network 请求中获取

1. 登录 Get笔记后，在页面中任意操作（如创建笔记）
2. 打开开发者工具 → **Network** (网络) 标签页
3. 找到任意 API 请求（如 `notes/stream`）
4. 在请求头中找到 `Authorization: Bearer eyJhbG...`
5. 复制 `Bearer` 后面的部分（即 token）

### 方法三：从 Cookie 中获取

1. 打开开发者工具 → **Application** → **Cookies**
2. 查找包含 `token`、`auth` 或 `session` 的字段

---

## API 接口

### 1. 提交视频链接进行总结

```http
POST /api/summarize
Content-Type: application/json; charset=utf-8
```

**请求参数：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| url | string | 是 | B站或YouTube视频链接 |
| token | string | 否* | Get笔记认证token |
| cookie | string | 否* | Get笔记cookie |
| template | string | 否 | 提示词模板版本，默认 `detailed` |
| customPrompt | string | 否 | 自定义提示词（template为custom时使用） |

\* 如果环境变量中已配置，则不需要在请求中提供

**template 可选值：**

- `default` - 默认简洁版
- `detailed` - 详细分析版（默认）
- `academic` - 学术研究版
- `reading` - 读书笔记版

**请求示例：**

```bash
# 方式1：通过请求参数传入 token
curl -X POST http://localhost:3000/api/summarize \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.bilibili.com/video/BV1xx411c7mD",
    "template": "detailed",
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }'

# 方式2：使用环境变量中的 token（无需在请求中传入）
curl -X POST http://localhost:3000/api/summarize \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.bilibili.com/video/BV1xx411c7mD",
    "template": "detailed"
  }'
```

**响应示例：**

```json
{
  "success": true,
  "noteId": "abc123def456",
  "noteUrl": "https://www.biji.com/note/abc123def456",
  "videoInfo": {
    "url": "https://www.bilibili.com/video/BV1xx411c7mD",
    "title": "视频标题",
    "platform": "Bilibili",
    "bvid": "BV1xx411c7mD"
  },
  "promptVersion": "detailed"
}
```

### 2. 批量提交视频链接

```http
POST /api/summarize/batch
Content-Type: application/json; charset=utf-8
```

**请求参数：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| urls | array | 是 | 视频链接数组 |
| token | string | 否 | Get笔记认证token |
| cookie | string | 否 | Get笔记cookie |
| template | string | 否 | 提示词模板版本 |

**请求示例：**

```bash
curl -X POST http://localhost:3000/api/summarize/batch \
  -H "Content-Type: application/json" \
  -d '{
    "urls": [
      "https://www.bilibili.com/video/BV1xx411c7mD",
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    ],
    "template": "reading",
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }'
```

### 3. 获取提示词模板列表

```http
GET /api/templates
```

**响应示例：**

```json
{
  "success": true,
  "templates": [
    { "key": "default", "name": "默认简洁版" },
    { "key": "detailed", "name": "详细分析版" },
    { "key": "academic", "name": "学术研究版" },
    { "key": "reading", "name": "读书笔记版" }
  ]
}
```

### 4. 验证认证信息

```http
POST /api/validate-auth
Content-Type: application/json; charset=utf-8
```

**请求参数：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| token | string | 否 | Get笔记认证token |
| cookie | string | 否 | Get笔记cookie |

**响应示例：**

```json
{
  "success": true,
  "valid": true,
  "message": "认证信息有效"
}
```

### 5. 健康检查

```http
GET /api/health
```

---

## 使用示例

### Python 示例

```python
import requests

API_URL = "https://your-project.vercel.app"  # 或本地 http://localhost:3000
TOKEN = "your-getbiji-token"

# 单个视频
response = requests.post(f'{API_URL}/api/summarize', json={
    'url': 'https://www.bilibili.com/video/BV1xx411c7mD',
    'template': 'detailed',
    'token': TOKEN
})
result = response.json()
print(f"笔记链接: {result['noteUrl']}")

# 批量处理
response = requests.post(f'{API_URL}/api/summarize/batch', json={
    'urls': [
        'https://www.bilibili.com/video/BV1xx411c7mD',
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
    ],
    'template': 'reading',
    'token': TOKEN
})
```

### JavaScript/TypeScript 示例

```javascript
const API_URL = 'https://your-project.vercel.app';  // 或本地 http://localhost:3000
const TOKEN = 'your-getbiji-token';

// 单个视频
const response = await fetch(`${API_URL}/api/summarize`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    url: 'https://www.bilibili.com/video/BV1xx411c7mD',
    template: 'detailed',
    token: TOKEN
  })
});
const result = await response.json();
console.log('笔记链接:', result.noteUrl);
```

### 浏览器插件/油猴脚本中使用

```javascript
// 在浏览器环境中调用 API
GM_xmlhttpRequest({
  method: 'POST',
  url: 'https://your-project.vercel.app/api/summarize',
  headers: {
    'Content-Type': 'application/json'
  },
  data: JSON.stringify({
    url: window.location.href,
    template: 'detailed',
    token: 'your-token'  // 或从环境变量/存储中获取
  }),
  onload: function(response) {
    const result = JSON.parse(response.responseText);
    console.log('笔记已创建:', result.noteUrl);
  }
});
```

---

## 提示词模板说明

### 1. 默认简洁版 (default)

提供内容概述，按主题分小节整理，提取关键观点和结论。

### 2. 详细分析版 (detailed) ⭐ 推荐

将视频重写成"阅读版本"，包括：
- **Overview**：核心论题与结论
- **主题梳理**：详细展开每个小节（不少于500字）
- **框架与心智模型**：抽象出 framework & mindset

### 3. 学术研究版 (academic)

学术风格的阅读笔记，包括：
- 研究背景与问题陈述
- 核心理论与概念框架
- 论证过程与证据分析
- 研究方法与方法论反思
- 结论与启示
- 参考文献与延伸阅读建议

### 4. 读书笔记版 (reading)

结构化的读书笔记格式，包括：
- 📖 书籍/内容信息
- 🎯 核心观点
- 💡 精华内容摘录
- 📝 详细内容梳理
- 🔍 我的思考与联想
- ✅ 行动清单
- 📚 延伸阅读推荐

---

## 项目结构

```
getbiji-api/
├── api/
│   └── index.js        # Vercel Serverless 入口
├── server.js           # 本地开发服务器
├── videoExtractor.js   # 视频信息提取模块
├── getbijiService.js   # Get笔记 API 客户端
├── prompts.js          # 提示词模板系统
├── package.json        # 项目配置
├── vercel.json         # Vercel 配置文件
├── .env.example        # 环境变量示例
├── .gitignore          # Git 忽略文件
└── README.md           # 本文档
```

---

## 注意事项

1. **认证信息**：Get笔记 API 需要有效的认证信息（token 或 cookie），请从已登录的浏览器中获取
2. **频率限制**：批量处理时会自动添加延迟（1秒/请求），避免触发频率限制
3. **超时设置**：API 请求超时时间为60秒，视频总结可能需要较长时间
4. **网络要求**：服务器需要能够访问 Bilibili、YouTube 和 Get笔记的服务
5. **Vercel 限制**：Vercel Hobby 计划有 10 秒函数执行时间限制，可能不适合处理长视频

---

## 故障排除

### 认证失败

- 检查 token 是否过期，重新从浏览器获取
- 确保 token 格式正确，不要包含多余的空格或引号
- 使用 `/api/validate-auth` 接口测试 token 是否有效

### 视频信息提取失败

- 检查视频链接是否有效
- 确保服务器能够访问 Bilibili/YouTube
- 某些视频可能需要登录才能访问

### API 请求超时

- 视频总结可能需要较长时间，请耐心等待
- 检查网络连接是否稳定
- 考虑使用其他部署平台（如 Railway、Render）以获得更长的超时时间

### CORS 错误

- 确保请求头中包含 `Content-Type: application/json`
- 如果使用浏览器直接调用，确保处理了 CORS 预检请求

---

## 技术细节

### 请求头说明

API 会自动添加以下请求头调用 Get笔记服务：

```
Content-Type: application/json; charset=utf-8
Accept: text/event-stream
Authorization: Bearer {token}
X-Request-Id: {uuid}
xi-csrf-token: {从token中提取}
Origin: https://www.biji.com
Referer: https://www.biji.com/
```

### 环境变量

| 变量名 | 说明 | 必填 |
|--------|------|------|
| `GETBIJI_TOKEN` | Get笔记认证 Token | 是（或请求中传入） |
| `GETBIJI_COOKIE` | Get笔记 Cookie（可选） | 否 |
| `PORT` | 服务器端口（默认3000） | 否 |

---

## License

MIT
