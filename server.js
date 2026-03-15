/**
 * Get笔记 API 服务
 * 将原 Tampermonkey 脚本包装成 HTTP API
 */

const express = require('express');
const cors = require('cors');
const { extractVideoInfo } = require('./videoExtractor');
const { GetBijiClient } = require('./getbijiService');
const { getAvailableVersions } = require('./prompts');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件 - 配置 CORS 允许所有需要的请求头
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id', 'xi-csrf-token']
}));
app.use(express.json());

// 请求日志
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

/**
 * GET / - 服务信息
 */
app.get('/', (req, res) => {
  res.json({
    name: 'Get笔记 API 服务',
    version: '1.0.0',
    description: '将B站/YouTube视频链接通过API发送到Get笔记进行AI总结',
    endpoints: {
      'POST /api/summarize': '提交视频链接进行总结',
      'GET /api/templates': '获取可用的提示词模板列表',
      'GET /api/health': '健康检查',
      'POST /api/validate-auth': '验证Get笔记认证信息'
    }
  });
});

/**
 * GET /api/health - 健康检查
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /api/templates - 获取提示词模板列表
 */
app.get('/api/templates', (req, res) => {
  res.json({
    success: true,
    templates: getAvailableVersions()
  });
});

/**
 * POST /api/validate-auth - 验证Get笔记认证
 */
app.post('/api/validate-auth', async (req, res) => {
  try {
    const { token, cookie } = req.body;

    const client = new GetBijiClient({ token, cookie });
    const isValid = await client.validateAuth();

    res.json({
      success: true,
      valid: isValid,
      message: isValid ? '认证信息有效' : '认证信息无效或缺失'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/summarize - 提交视频链接进行总结
 *
 * 请求体:
 * {
 *   "url": "https://www.bilibili.com/video/BVxxxxx",  // 必填：视频链接
 *   "token": "your-getbiji-token",                      // 可选：Get笔记token
 *   "cookie": "your-getbiji-cookie",                    // 可选：Get笔记cookie
 *   "template": "detailed",                             // 可选：提示词模板版本
 *   "customPrompt": "自定义提示词..."                    // 可选：自定义提示词
 * }
 *
 * 响应:
 * {
 *   "success": true,
 *   "noteId": "xxx",
 *   "noteUrl": "https://www.biji.com/note/xxx",
 *   "videoInfo": {
 *     "url": "...",
 *     "title": "...",
 *     "platform": "Bilibili"
 *   },
 *   "promptVersion": "detailed"
 * }
 */
app.post('/api/summarize', async (req, res) => {
  try {
    const { url, token, cookie, template = 'detailed', customPrompt } = req.body;

    // 参数验证
    if (!url) {
      return res.status(400).json({
        success: false,
        error: '缺少必填参数: url'
      });
    }

    // 检查环境变量或请求参数中是否有认证信息
    const authToken = token || process.env.GETBIJI_TOKEN;
    const authCookie = cookie || process.env.GETBIJI_COOKIE;

    if (!authToken && !authCookie) {
      return res.status(401).json({
        success: false,
        error: '缺少认证信息：请提供Get笔记的token或cookie',
        hint: '可以通过以下方式提供：1) 请求体中传入token/cookie 2) 设置环境变量GETBIJI_TOKEN/GETBIJI_COOKIE'
      });
    }

    // 步骤1: 提取视频信息
    console.log(`[INFO] 正在提取视频信息: ${url}`);
    const videoInfo = await extractVideoInfo(url);

    if (!videoInfo.success && videoInfo.platform === 'unknown') {
      return res.status(400).json({
        success: false,
        error: videoInfo.error,
        videoInfo
      });
    }

    console.log(`[INFO] 视频信息提取完成: ${videoInfo.platform} - ${videoInfo.title}`);

    // 步骤2: 创建Get笔记客户端
    const client = new GetBijiClient({
      token: authToken,
      cookie: authCookie
    });

    // 步骤3: 调用Get笔记API创建笔记
    console.log(`[INFO] 正在创建Get笔记，使用模板: ${template}`);
    const result = await client.createNote(videoInfo, {
      promptVersion: template,
      customPrompt
    });

    console.log(`[INFO] 笔记创建成功: ${result.noteId}`);

    // 返回成功响应
    res.json(result);

  } catch (error) {
    console.error(`[ERROR] ${error.message}`);

    // 根据错误类型返回不同状态码
    let statusCode = 500;
    if (error.message.includes('认证失败')) {
      statusCode = 401;
    } else if (error.message.includes('不支持的视频平台')) {
      statusCode = 400;
    } else if (error.message.includes('请求过于频繁')) {
      statusCode = 429;
    }

    res.status(statusCode).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/summarize/batch - 批量提交视频链接
 *
 * 请求体:
 * {
 *   "urls": ["url1", "url2", ...],
 *   "token": "...",
 *   "cookie": "...",
 *   "template": "detailed"
 * }
 */
app.post('/api/summarize/batch', async (req, res) => {
  try {
    const { urls, token, cookie, template = 'detailed' } = req.body;

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({
        success: false,
        error: '缺少必填参数: urls (必须是数组)'
      });
    }

    const authToken = token || process.env.GETBIJI_TOKEN;
    const authCookie = cookie || process.env.GETBIJI_COOKIE;

    if (!authToken && !authCookie) {
      return res.status(401).json({
        success: false,
        error: '缺少认证信息：请提供Get笔记的token或cookie'
      });
    }

    const results = [];
    const client = new GetBijiClient({ token: authToken, cookie: authCookie });

    // 串行处理每个URL（避免触发频率限制）
    for (const url of urls) {
      try {
        const videoInfo = await extractVideoInfo(url);

        if (!videoInfo.success && videoInfo.platform === 'unknown') {
          results.push({
            url,
            success: false,
            error: videoInfo.error
          });
          continue;
        }

        const result = await client.createNote(videoInfo, { promptVersion: template });
        results.push(result);

        // 添加延迟避免频率限制
        if (urls.length > 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        results.push({
          url,
          success: false,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      total: urls.length,
      succeeded: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    });

  } catch (error) {
    console.error(`[ERROR] ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 404 处理
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: '接口不存在',
    path: req.path
  });
});

// 错误处理
app.use((err, req, res, next) => {
  console.error(`[ERROR] ${err.stack}`);
  res.status(500).json({
    success: false,
    error: '服务器内部错误',
    message: err.message
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════╗
║          Get笔记 API 服务已启动                        ║
╠════════════════════════════════════════════════════════╣
║  端口: ${PORT.toString().padEnd(45)} ║
║  地址: http://localhost:${PORT.toString().padEnd(37)} ║
╠════════════════════════════════════════════════════════╣
║  可用接口:                                             ║
║    POST /api/summarize    - 提交视频链接进行总结       ║
║    POST /api/summarize/batch - 批量提交视频链接        ║
║    GET  /api/templates    - 获取提示词模板列表         ║
║    POST /api/validate-auth - 验证认证信息              ║
║    GET  /api/health       - 健康检查                   ║
╚════════════════════════════════════════════════════════╝
  `);
});

module.exports = app;
