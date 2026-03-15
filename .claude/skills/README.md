# Get笔记 Summarize Skill

用于 Claude Code 和 OpenClaw 的 Skill，可以直接将 B站/YouTube 视频链接发送到 Get笔记 进行 AI 总结。

## 文件说明

| 文件 | 说明 |
|------|------|
| `getbiji-summarize.json` | Skill 定义文件（Schema） |
| `getbiji-summarize.js` | Skill 实现代码 |
| `README.md` | 本文档 |

## 安装

### 方法一：复制到配置目录

```bash
# Claude Code
mkdir -p ~/.claude/skills
cp -r .claude/skills/* ~/.claude/skills/

# OpenClaw
mkdir -p ~/.openclaw/skills
cp -r .claude/skills/* ~/.openclaw/skills/
```

### 方法二：符号链接（推荐，便于更新）

```bash
# Claude Code
ln -s /path/to/getbiji-api/.claude/skills/getbiji-summarize ~/.claude/skills/getbiji-summarize

# OpenClaw
ln -s /path/to/getbiji-api/.claude/skills/getbiji-summarize ~/.openclaw/skills/getbiji-summarize
```

## 配置

### 环境变量

```bash
# API 地址（可选，默认使用官方部署）
export GETBIJI_API_URL="https://getbiji-api.vercel.app"

# Get笔记 Token（必需）
export GETBIJI_TOKEN="your-getbiji-token"
```

### 获取 Token

1. 登录 [Get笔记](https://www.biji.com)
2. 按 F12 打开开发者工具
3. 切换到 Application → Local Storage → https://www.biji.com
4. 复制 `token` 字段的值

## 使用

### 自然语言命令

安装 Skill 后，可以直接使用自然语言：

```
总结这个视频：https://www.bilibili.com/video/BV1xx411c7mD

用学术研究版模板总结这个 YouTube 视频：https://www.youtube.com/watch?v=...

批量总结这些视频：
- https://www.bilibili.com/video/BV1
- https://www.bilibili.com/video/BV2
- https://www.youtube.com/watch?v=...

列出所有可用的总结模板
```

### 程序化使用

```javascript
const {
  summarizeVideo,
  batchSummarize,
  listTemplates,
  validateToken
} = require('./getbiji-summarize');

// 总结单个视频
const result = await summarizeVideo(
  'https://www.bilibili.com/video/BV1xx411c7mD',
  'detailed'  // 可选: default, detailed, academic, reading
);
console.log('笔记链接:', result.noteUrl);

// 批量总结
const batchResult = await batchSummarize([
  'https://www.bilibili.com/video/BV1',
  'https://www.youtube.com/watch?v=...'
], 'reading');

// 获取模板列表
const templates = await listTemplates();

// 验证 Token
const isValid = await validateToken();
```

## API 参考

### summarizeVideo(url, template?, token?)

总结单个视频。

**参数：**
- `url` (string): 视频链接，支持 Bilibili 和 YouTube
- `template` (string, 可选): 模板类型，默认 'detailed'
  - `default`: 默认简洁版
  - `detailed`: 详细分析版（默认）
  - `academic`: 学术研究版
  - `reading`: 读书笔记版
- `token` (string, 可选): Get笔记 Token，如不传则使用环境变量

**返回值：**
```javascript
{
  success: true,
  noteId: "abc123",
  noteUrl: "https://www.biji.com/note/abc123",
  videoInfo: {
    title: "视频标题",
    platform: "Bilibili",
    url: "https://..."
  },
  promptVersion: "detailed"
}
```

### batchSummarize(urls, template?, token?)

批量总结多个视频。

**参数：**
- `urls` (string[]): 视频链接数组
- `template` (string, 可选): 模板类型，默认 'detailed'
- `token` (string, 可选): Get笔记 Token

**返回值：**
```javascript
{
  success: true,
  total: 3,
  succeeded: 3,
  failed: 0,
  results: [
    { success: true, noteId: "...", noteUrl: "...", videoInfo: {...} },
    ...
  ]
}
```

### listTemplates()

获取可用的模板列表。

**返回值：**
```javascript
[
  { key: "default", name: "默认简洁版" },
  { key: "detailed", name: "详细分析版" },
  { key: "academic", name: "学术研究版" },
  { key: "reading", name: "读书笔记版" }
]
```

### validateToken(token?)

验证 Token 是否有效。

**参数：**
- `token` (string, 可选): 要验证的 Token，不传则使用环境变量

**返回值：**
```javascript
boolean  // true 表示有效，false 表示无效
```

## 模板说明

### 默认简洁版 (default)
提供内容概述，按主题分小节整理，提取关键观点和结论。

### 详细分析版 (detailed) ⭐ 推荐
将视频重写成"阅读版本"，包括：
- Overview：核心论题与结论
- 主题梳理：详细展开每个小节（不少于500字）
- 框架与心智模型：抽象出 framework & mindset

### 学术研究版 (academic)
学术风格的阅读笔记，包括研究背景、核心理论、论证过程、研究方法、结论与启示等。

### 读书笔记版 (reading)
结构化的读书笔记格式，包括内容信息、核心观点、精华摘录、详细梳理、思考联想、行动清单等。

## 故障排除

### 401 Unauthorized
- Token 已过期，需要重新从 Get笔记 获取
- Token 格式不正确

### 视频信息提取失败
- 视频链接无效
- 视频需要登录才能访问
- 不支持的视频平台（目前仅支持 Bilibili 和 YouTube）

### 请求超时
- 视频总结需要较长时间，请耐心等待
- Get笔记 服务可能繁忙

## 注意事项

1. **Token 安全**：不要将 Token 提交到公共代码仓库
2. **频率限制**：批量处理时会自动添加延迟，避免触发频率限制
3. **Token 过期**：Token 会定期过期，需要重新获取

## 相关链接

- [Get笔记官网](https://www.biji.com)
- [API 源码](https://github.com/sche11/getbiji-api)
- [问题反馈](https://github.com/sche11/getbiji-api/issues)

## License

MIT
