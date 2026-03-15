/**
 * Get笔记 Summarize Skill for Claude Code / OpenClaw
 * 
 * 使用方法:
 * 1. 在 Claude Code 或 OpenClaw 中导入此 skill
 * 2. 配置 GETBIJI_API_URL 和 GETBIJI_TOKEN（可选）
 * 3. 使用工具函数调用 API
 */

const GETBIJI_API_URL = process.env.GETBIJI_API_URL || '替换成你的URL';
const GETBIJI_TOKEN = process.env.GETBIJI_TOKEN;

/**
 * 将视频链接转换为 AI 总结笔记
 * @param {string} url - 视频链接 (Bilibili/YouTube)
 * @param {string} template - 模板类型: default|detailed|academic|reading
 * @param {string} token - Get笔记 Token (可选)
 * @returns {Promise<Object>} - 生成结果
 */
async function summarizeVideo(url, template = 'detailed', token = null) {
  const authToken = token || GETBIJI_TOKEN;
  
  if (!authToken) {
    throw new Error('缺少 Get笔记 Token。请在环境变量中设置 GETBIJI_TOKEN，或在调用时传入 token 参数。');
  }

  const response = await fetch(`${GETBIJI_API_URL}/api/summarize`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      url,
      template,
      token: authToken
    })
  });

  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.error || '生成笔记失败');
  }

  return data;
}

/**
 * 批量将视频链接转换为 AI 总结笔记
 * @param {string[]} urls - 视频链接数组
 * @param {string} template - 模板类型
 * @param {string} token - Get笔记 Token (可选)
 * @returns {Promise<Object>} - 批量生成结果
 */
async function batchSummarize(urls, template = 'detailed', token = null) {
  const authToken = token || GETBIJI_TOKEN;
  
  if (!authToken) {
    throw new Error('缺少 Get笔记 Token。');
  }

  const response = await fetch(`${GETBIJI_API_URL}/api/summarize/batch`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      urls,
      template,
      token: authToken
    })
  });

  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.error || '批量生成失败');
  }

  return data;
}

/**
 * 获取可用的模板列表
 * @returns {Promise<Array>} - 模板列表
 */
async function listTemplates() {
  const response = await fetch(`${GETBIJI_API_URL}/api/templates`);
  const data = await response.json();
  
  if (!data.success) {
    throw new Error('获取模板列表失败');
  }

  return data.templates;
}

/**
 * 验证 Token 是否有效
 * @param {string} token - 要验证的 Token
 * @returns {Promise<boolean>} - 是否有效
 */
async function validateToken(token) {
  const authToken = token || GETBIJI_TOKEN;
  
  if (!authToken) {
    return false;
  }

  const response = await fetch(`${GETBIJI_API_URL}/api/validate-auth`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ token: authToken })
  });

  const data = await response.json();
  return data.valid;
}

// 导出工具函数
module.exports = {
  summarizeVideo,
  batchSummarize,
  listTemplates,
  validateToken
};

// 如果直接运行此文件，执行示例
if (require.main === module) {
  async function main() {
    console.log('Get笔记 Summarize Skill');
    console.log('=======================');
    
    // 显示可用模板
    console.log('\n可用模板:');
    const templates = await listTemplates();
    templates.forEach(t => {
      console.log(`  - ${t.key}: ${t.name}`);
    });
    
    console.log('\n使用方法:');
    console.log('  const { summarizeVideo } = require("./getbiji-summarize");');
    console.log('  const result = await summarizeVideo("https://...", "detailed");');
  }
  
  main().catch(console.error);
}
