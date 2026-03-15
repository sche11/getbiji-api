/**
 * 提示词模板系统
 * 从原脚本中提取并整理
 */

const PROMPT_TEMPLATES = {
  // 默认简洁版
  default: {
    name: '默认简洁版',
    content: (videoUrl, title) => `请将以下视频内容转换为结构化的阅读笔记：

视频链接：${videoUrl}
视频标题：${title}

要求：
1. 提供内容概述
2. 按主题分小节整理
3. 提取关键观点和结论`
  },

  // 详细分析版（默认）
  detailed: {
    name: '详细分析版',
    content: (videoUrl, title) => `你将把一段视频重写成"阅读版本"，按内容主题分成若干小节；目标是让读者通过阅读就能完整理解视频讲了什么，就好像是在读一篇 Blog 版的文章一样。

视频链接：${videoUrl}
视频标题：${title}

输出要求：

1. Overview
用一段话点明视频的核心论题与结论。

2. 按照主题来梳理
- 每个小节都需要根据视频中的内容详细展开，让我不需要再二次查看视频了解详情，每个小节不少于 500 字。
- 若出现方法/框架/流程，将其重写为条理清晰的步骤或段落。
- 若有关键数字、定义、原话，请如实保留核心词，并在括号内补充注释。

3. 框架 & 心智模型（Framework & Mindset）
可以从视频中抽象出什么 framework & mindset，将其重写为条理清晰的步骤或段落，每个 framework & mindset 不少于 500 字。

风格与限制：
- 永远不要高度浓缩！
- 不新增事实；若出现含混表述，请保持原意并注明不确定性。
- 专有名词保留原文，并在括号给出中文释义（若转录中出现或能直译）。
- 要求类的问题不用体现出来（例如 > 500 字）。
- 避免一个段落的内容过多，可以拆解成多个逻辑段落（使用 bullet points）。
- 简体中文回答`
  },

  // 学术研究版
  academic: {
    name: '学术研究版',
    content: (videoUrl, title) => `请将以下视频内容转换为学术风格的阅读笔记：

视频链接：${videoUrl}
视频标题：${title}

输出要求：

1. 研究背景与问题陈述
说明视频所讨论的研究领域、核心问题及其学术/实践意义。

2. 核心理论与概念框架
- 详细阐述视频中涉及的主要理论、模型或概念框架
- 对每个理论提供定义、核心要素和应用场景
- 不少于 800 字

3. 论证过程与证据分析
- 梳理视频中的论证逻辑链条
- 分析所使用的证据类型（数据、案例、引用等）
- 评估论证的有效性和局限性

4. 研究方法与方法论反思
如视频中涉及研究方法，请详细说明：
- 研究设计类型
- 数据收集与分析方法
- 方法论的适用性与局限

5. 结论与启示
- 总结核心研究发现或观点
- 讨论理论贡献与实践意义
- 提出未来研究方向或待解决问题

6. 参考文献与延伸阅读建议
列出视频中提及的重要文献、学者或推荐资源。

格式要求：
- 使用学术规范的语言风格
- 重要术语首次出现时提供英文原文
- 使用标题层级（H1-H3）组织内容
- 适当使用表格对比不同观点或概念
- 简体中文回答`
  },

  // 读书笔记版
  reading: {
    name: '读书笔记版',
    content: (videoUrl, title) => `请将以下视频内容转换为读书笔记格式：

视频链接：${videoUrl}
视频标题：${title}

输出结构：

📖 书籍/内容信息
- 内容类型：视频
- 主题领域：（根据内容判断）

🎯 核心观点
用 2-3 句话概括视频传达的最重要的信息。

💡 精华内容摘录
1. 金句摘录：记录 3-5 句原话或核心表述
2. 关键概念：解释视频中出现的 3-5 个重要概念
3. 重要数据/事实：列出关键数字和事实

📝 详细内容梳理
按视频结构或主题，分章节详细整理：
- 每章/每节的核心论点
- 支持论据和案例
- 作者的独特见解

🔍 我的思考与联想
（此部分留空，供读者填写）
- 与已有知识的联系：
- 质疑或不同观点：
- 可以如何应用：

✅ 行动清单
根据视频内容，列出可以立即执行的 3-5 个行动项。

📚 延伸阅读推荐
如视频中有提及相关书籍、文章或其他资源，请列出。

格式要求：
- 使用 emoji 图标增强可读性
- 内容详实，每个部分不少于 300 字
- 使用 bullet points 组织信息
- 简体中文回答`
  }
};

/**
 * 获取提示词
 * @param {string} videoUrl - 视频链接
 * @param {string} title - 视频标题
 * @param {string} version - 模板版本
 * @param {string} customPrompt - 自定义提示词（当version为custom时使用）
 * @returns {string} - 生成的提示词
 */
function getPrompt(videoUrl, title, version = 'detailed', customPrompt = null) {
  const template = PROMPT_TEMPLATES[version] || PROMPT_TEMPLATES.detailed;

  if (version === 'custom' && customPrompt) {
    return customPrompt
      .replace(/\{videoUrl\}/g, videoUrl)
      .replace(/\{title\}/g, title);
  }

  return template.content(videoUrl, title);
}

/**
 * 获取可用的提示词版本列表
 * @returns {Array} - 版本列表
 */
function getAvailableVersions() {
  return Object.entries(PROMPT_TEMPLATES).map(([key, value]) => ({
    key,
    name: value.name
  }));
}

module.exports = {
  getPrompt,
  getAvailableVersions,
  PROMPT_TEMPLATES
};
