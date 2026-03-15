---
name: "getbiji-summarize"
description: "Summarize Bilibili/YouTube videos using Get笔记 AI. Invoke when user wants to convert video links to structured notes, create reading versions of videos, or process video content with AI templates."
---

# Get笔记 Summarize Skill

将 B站/YouTube 视频链接转换为结构化的 AI 总结笔记。

## Trigger Conditions

当用户有以下需求时，调用此 Skill：
- 想要总结视频内容
- 将视频链接转换为笔记
- 需要处理 Bilibili 或 YouTube 链接
- 要求生成视频的阅读版本
- 批量处理多个视频

## Tools

### summarize_video

将单个视频链接转换为 AI 总结笔记。

**Parameters:**
- `url` (required): 视频链接，支持 Bilibili 或 YouTube
- `template` (optional): 总结模板类型，默认 "detailed"
  - `default`: 默认简洁版
  - `detailed`: 详细分析版（推荐）
  - `academic`: 学术研究版
  - `reading`: 读书笔记版
- `token` (optional): Get笔记 API Token

**Returns:**
```json
{
  "success": true,
  "noteId": "string",
  "noteUrl": "string",
  "videoInfo": {
    "title": "string",
    "platform": "string",
    "url": "string"
  }
}
```

### batch_summarize

批量将多个视频链接转换为 AI 总结笔记。

**Parameters:**
- `urls` (required): 视频链接数组
- `template` (optional): 总结模板类型，默认 "detailed"
- `token` (optional): Get笔记 API Token

**Returns:**
```json
{
  "success": true,
  "total": 3,
  "succeeded": 3,
  "failed": 0,
  "results": [...]
}
```

### list_templates

获取可用的总结模板列表。

**Returns:**
```json
[
  { "key": "default", "name": "默认简洁版" },
  { "key": "detailed", "name": "详细分析版" },
  { "key": "academic", "name": "学术研究版" },
  { "key": "reading", "name": "读书笔记版" }
]
```

## Configuration

### Environment Variables

```bash
export GETBIJI_API_URL="https://your-project.vercel.app"
export GETBIJI_TOKEN="your-getbiji-token"
```

### Get Token

1. 登录 [Get笔记](https://www.biji.com)
2. 按 F12 打开开发者工具
3. 切换到 Application → Local Storage → https://www.biji.com
4. 复制 `token` 字段的值

## Usage Examples

### Natural Language

```
总结这个视频：https://www.bilibili.com/video/BV1xx411c7mD

用学术研究版模板总结这个 YouTube 视频：https://www.youtube.com/watch?v=...

批量总结这些视频：
- https://www.bilibili.com/video/BV1
- https://www.bilibili.com/video/BV2
- https://www.youtube.com/watch?v=...

列出所有可用的总结模板
```

### Programmatic

```javascript
const { summarizeVideo, batchSummarize, listTemplates } = require('./.trae/skills/getbiji-summarize/getbiji-summarize.js');

// 总结单个视频
const result = await summarizeVideo(
  'https://www.bilibili.com/video/BV1xx411c7mD',
  'detailed'
);
console.log('笔记链接:', result.noteUrl);

// 批量总结
const batchResult = await batchSummarize([
  'https://www.bilibili.com/video/BV1',
  'https://www.youtube.com/watch?v=...'
], 'reading');

// 获取模板列表
const templates = await listTemplates();
```

## Templates

| Template | Description |
|----------|-------------|
| `detailed` | 详细分析版（推荐）- 深入分析，包含框架与心智模型 |
| `default` | 默认简洁版 - 简洁明了，快速获取要点 |
| `reading` | 读书笔记版 - 结构化笔记，适合收藏 |
| `academic` | 学术研究版 - 学术风格，严谨分析 |

## Notes

- Token expires periodically and needs to be refreshed
- Batch processing adds automatic delays to avoid rate limits
- Video summarization may take 30-60 seconds
- Only supports Bilibili and YouTube URLs

## Links

- [Get笔记官网](https://www.biji.com)
- [API Source](https://github.com/sche11/getbiji-api)
