---
name: "getbiji-summarize"
description: "将 B站/YouTube 视频链接发送到 Get笔记 进行 AI 总结。Invoke when user wants to summarize video content, convert video to notes, or process Bilibili/YouTube links with AI."
---

# Get笔记 Summarize Skill

将 B站/YouTube 视频链接转换为结构化的 AI 总结笔记。

## 功能

- 支持 Bilibili 和 YouTube 视频链接
- 提供多种总结模板（详细分析版、学术研究版、读书笔记版等）
- 批量处理多个视频链接
- 自动提取视频标题和元信息

## 使用方法

### 环境变量配置

```bash
export GETBIJI_API_URL="https://your-project.vercel.app"
export GETBIJI_TOKEN="your-getbiji-token"
```

### 自然语言调用

用户可以通过自然语言触发：

```
总结这个视频：https://www.bilibili.com/video/BV1xx411c7mD

用学术研究版模板总结这个 YouTube 视频

批量总结这些视频链接
```

### 程序化调用

```javascript
const { summarizeVideo, batchSummarize, listTemplates } = require('./.claude/skills/getbiji-summarize');

// 总结单个视频
const result = await summarizeVideo(
  'https://www.bilibili.com/video/BV1xx411c7mD',
  'detailed'
);

// 批量总结
const batchResult = await batchSummarize([
  'https://www.bilibili.com/video/BV1',
  'https://www.youtube.com/watch?v=...'
], 'reading');

// 获取模板列表
const templates = await listTemplates();
```

## 可用模板

| 模板 | 说明 |
|------|------|
| `detailed` | 详细分析版（推荐）- 深入分析，包含框架与心智模型 |
| `default` | 默认简洁版 - 简洁明了，快速获取要点 |
| `reading` | 读书笔记版 - 结构化笔记，适合收藏 |
| `academic` | 学术研究版 - 学术风格，严谨分析 |

## 获取 Token

1. 登录 [Get笔记](https://www.biji.com)
2. 按 F12 打开开发者工具
3. 切换到 Application → Local Storage → https://www.biji.com
4. 复制 `token` 字段的值

## API 参考

### summarizeVideo(url, template?, token?)

- **url**: 视频链接（Bilibili/YouTube）
- **template**: 模板类型，默认 'detailed'
- **token**: Get笔记 Token（可选）

返回：{ success, noteId, noteUrl, videoInfo }

### batchSummarize(urls, template?, token?)

- **urls**: 视频链接数组
- **template**: 模板类型，默认 'detailed'
- **token**: Get笔记 Token（可选）

返回：{ success, total, succeeded, failed, results }

### listTemplates()

返回：模板列表数组

## 注意事项

- Token 会定期过期，需要重新获取
- 批量处理时会自动添加延迟，避免触发频率限制
- 视频总结可能需要较长时间（30-60秒）

## 相关链接

- [Get笔记官网](https://www.biji.com)
- [API 源码](https://github.com/sche11/getbiji-api)
