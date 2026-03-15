/**
 * Get笔记 API 服务模块
 * 负责调用 Get笔记的 API 创建笔记
 */

const axios = require('axios');
const { getPrompt } = require('./prompts');

/**
 * Get笔记 API 客户端
 */
class GetBijiClient {
  /**
   * @param {Object} options - 配置选项
   * @param {string} options.token - Get笔记的认证token
   * @param {string} options.cookie - Get笔记的cookie（可选）
   */
  constructor(options = {}) {
    this.token = options.token || process.env.GETBIJI_TOKEN;
    this.cookie = options.cookie || process.env.GETBIJI_COOKIE;
    this.baseURL = 'https://get-notes.luojilab.com';
  }

  /**
   * 创建笔记
   * @param {Object} videoInfo - 视频信息
   * @param {string} videoInfo.url - 视频链接
   * @param {string} videoInfo.title - 视频标题
   * @param {string} videoInfo.platform - 视频平台
   * @param {Object} options - 选项
   * @param {string} options.promptVersion - 提示词版本
   * @param {string} options.customPrompt - 自定义提示词
   * @returns {Promise<Object>} - 创建结果
   */
  async createNote(videoInfo, options = {}) {
    const { url, title, platform } = videoInfo;
    const { promptVersion = 'detailed', customPrompt = null } = options;

    // 生成提示词
    const promptContent = getPrompt(url, title, promptVersion, customPrompt);

    // 构建请求数据
    const requestData = {
      attachments: [{
        size: 100,
        type: "link",
        title: title || `${platform}视频`,
        url: url
      }],
      content: promptContent,
      entry_type: "ai",
      note_type: "link",
      source: "web",
      prompt_template_id: ""
    };

    // 生成请求ID
    const requestId = this.generateRequestId();

    // 构建请求头
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream',
      'Origin': 'https://www.biji.com',
      'Referer': 'https://www.biji.com/',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Request-Id': requestId,
      'xi-csrf-token': this.token ? this.extractCsrfToken(this.token) : ''
    };

    if (this.cookie) {
      headers['Cookie'] = this.cookie;
    }
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await axios.post(
        `${this.baseURL}/voicenotes/web/notes/stream`,
        requestData,
        {
          headers,
          timeout: 60000,
          responseType: 'text'
        }
      );

      // 解析 SSE 响应
      const noteId = this.parseNoteIdFromResponse(response.data);

      if (noteId) {
        return {
          success: true,
          noteId: noteId,
          noteUrl: `https://www.biji.com/note/${noteId}`,
          videoInfo: {
            url,
            title,
            platform
          },
          promptVersion
        };
      } else {
        throw new Error('未从API响应中找到笔记ID');
      }
    } catch (error) {
      // 处理特定错误
      if (error.response) {
        const status = error.response.status;
        if (status === 401 || status === 403) {
          throw new Error('认证失败：请检查token是否有效');
        } else if (status === 429) {
          throw new Error('请求过于频繁，请稍后再试');
        } else {
          throw new Error(`API请求失败: ${status} - ${error.response.statusText}`);
        }
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('请求超时(60秒)，请检查网络连接');
      } else {
        throw new Error(`请求失败: ${error.message}`);
      }
    }
  }

  /**
   * 生成请求ID
   * @returns {string} - 请求ID
   */
  generateRequestId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * 从 token 中提取 CSRF token
   * @param {string} token - JWT token
   * @returns {string} - CSRF token
   */
  extractCsrfToken(token) {
    try {
      // 尝试从 JWT payload 中提取
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        // 如果 payload 中有 csrf_token 或类似的字段，使用它
        return payload.csrf_token || payload.csrf || '';
      }
    } catch (e) {
      // 解析失败返回空字符串
    }
    return '';
  }

  /**
   * 从 SSE 响应中解析笔记ID
   * @param {string} responseText - 响应文本
   * @returns {string|null} - 笔记ID
   */
  parseNoteIdFromResponse(responseText) {
    const lines = responseText.split('\n');

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const data = JSON.parse(line.substring(6));
          if (data.data?.note_id) {
            return data.data.note_id;
          }
        } catch (e) {
          // 忽略解析失败的行
        }
      }
    }

    return null;
  }

  /**
   * 验证认证信息是否有效
   * @returns {Promise<boolean>}
   */
  async validateAuth() {
    if (!this.token && !this.cookie) {
      return false;
    }

    try {
      const headers = {
        'Origin': 'https://www.biji.com',
        'Referer': 'https://www.biji.com/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      };

      if (this.cookie) {
        headers['Cookie'] = this.cookie;
      }
      if (this.token) {
        headers['Authorization'] = `Bearer ${this.token}`;
      }

      // 尝试获取笔记列表来验证认证
      await axios.get(`${this.baseURL}/voicenotes/web/notes`, {
        headers,
        timeout: 10000
      });

      return true;
    } catch (error) {
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        return false;
      }
      // 其他错误（如网络问题）不视为认证失败
      return true;
    }
  }
}

module.exports = { GetBijiClient };
