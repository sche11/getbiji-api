/**
 * 视频信息提取模块
 * 支持 Bilibili 和 YouTube
 */

const axios = require('axios');
const cheerio = require('cheerio');

/**
 * 检测视频平台类型
 * @param {string} url - 视频链接
 * @returns {string|null} - 平台类型或null
 */
function detectPlatform(url) {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();

    if (hostname.includes('bilibili.com')) {
      return 'bilibili';
    }
    if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
      return 'youtube';
    }
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * 提取 Bilibili 视频信息
 * @param {string} url - B站视频链接
 * @returns {Promise<Object>} - 视频信息
 */
async function extractBilibiliInfo(url) {
  try {
    // 清理URL，移除查询参数
    const cleanUrl = url.split('?')[0];

    // 获取页面HTML
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Referer': 'https://www.bilibili.com'
      },
      timeout: 10000
    });

    const $ = cheerio.load(response.data);

    // 尝试多种选择器获取标题
    let title = '';
    const titleSelectors = [
      'h1.video-title',
      '.video-title.van-ellipsis',
      '.tit',
      '[data-title]',
      'h1.title'
    ];

    for (const selector of titleSelectors) {
      const element = $(selector).first();
      if (element.length && element.text().trim()) {
        title = element.text().trim();
        break;
      }
    }

    // 如果还是没找到，尝试从meta标签获取
    if (!title) {
      title = $('meta[property="og:title"]').attr('content') ||
              $('meta[name="title"]').attr('content') ||
              document.title;
    }

    // 清理标题（移除B站后缀）
    title = title.replace(/_哔哩哔哩 \(゜-゜\)つロ 干杯~-bilibili/, '').trim();
    title = title.replace(/_哔哩哔哩_bilibili/, '').trim();

    // 提取BV号
    const bvMatch = cleanUrl.match(/BV[a-zA-Z0-9]+/);
    const bvid = bvMatch ? bvMatch[0] : null;

    return {
      platform: 'Bilibili',
      url: cleanUrl,
      title: title || '未知标题',
      bvid: bvid,
      success: true
    };
  } catch (error) {
    // 如果网络请求失败，尝试从URL解析基本信息
    const cleanUrl = url.split('?')[0];
    const bvMatch = cleanUrl.match(/BV[a-zA-Z0-9]+/);

    return {
      platform: 'Bilibili',
      url: cleanUrl,
      title: `B站视频 ${bvMatch ? bvMatch[0] : ''}`,
      bvid: bvMatch ? bvMatch[0] : null,
      success: false,
      error: error.message
    };
  }
}

/**
 * 提取 YouTube 视频信息
 * @param {string} url - YouTube视频链接
 * @returns {Promise<Object>} - 视频信息
 */
async function extractYouTubeInfo(url) {
  try {
    // 清理URL，只保留视频ID部分
    let cleanUrl = url;
    const urlObj = new URL(url);

    // 处理 youtu.be 短链接
    if (urlObj.hostname.includes('youtu.be')) {
      const videoId = urlObj.pathname.slice(1);
      cleanUrl = `https://www.youtube.com/watch?v=${videoId}`;
    } else {
      // 只保留 v 参数
      const videoId = urlObj.searchParams.get('v');
      if (videoId) {
        cleanUrl = `https://www.youtube.com/watch?v=${videoId}`;
      }
    }

    // 获取页面HTML
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Referer': 'https://www.youtube.com'
      },
      timeout: 10000
    });

    const $ = cheerio.load(response.data);

    // 尝试多种方式获取标题
    let title = '';

    // 从meta标签获取
    title = $('meta[property="og:title"]').attr('content') ||
            $('meta[name="title"]').attr('content');

    // 从页面元素获取
    if (!title) {
      const titleSelectors = [
        'h1.title',
        'h1.ytd-watch-metadata',
        '#title h1',
        '.watch-title'
      ];

      for (const selector of titleSelectors) {
        const element = $(selector).first();
        if (element.length && element.text().trim()) {
          title = element.text().trim();
          break;
        }
      }
    }

    // 清理标题
    if (title) {
      title = title.replace(/ - YouTube$/, '').trim();
    }

    // 提取视频ID
    const videoIdMatch = cleanUrl.match(/[?&]v=([a-zA-Z0-9_-]+)/);
    const videoId = videoIdMatch ? videoIdMatch[1] : null;

    return {
      platform: 'YouTube',
      url: cleanUrl,
      title: title || '未知标题',
      videoId: videoId,
      success: true
    };
  } catch (error) {
    // 如果网络请求失败，尝试从URL解析基本信息
    let cleanUrl = url;
    try {
      const urlObj = new URL(url);
      if (urlObj.hostname.includes('youtu.be')) {
        const videoId = urlObj.pathname.slice(1);
        cleanUrl = `https://www.youtube.com/watch?v=${videoId}`;
      } else {
        const videoId = urlObj.searchParams.get('v');
        if (videoId) {
          cleanUrl = `https://www.youtube.com/watch?v=${videoId}`;
        }
      }
    } catch (e) {}

    const videoIdMatch = cleanUrl.match(/[?&]v=([a-zA-Z0-9_-]+)/);
    const videoId = videoIdMatch ? videoIdMatch[1] : null;

    return {
      platform: 'YouTube',
      url: cleanUrl,
      title: `YouTube视频 ${videoId || ''}`,
      videoId: videoId,
      success: false,
      error: error.message
    };
  }
}

/**
 * 提取视频信息（通用入口）
 * @param {string} url - 视频链接
 * @returns {Promise<Object>} - 视频信息
 */
async function extractVideoInfo(url) {
  const platform = detectPlatform(url);

  if (!platform) {
    return {
      platform: 'unknown',
      url: url,
      title: '未知视频',
      success: false,
      error: '不支持的视频平台，目前仅支持 Bilibili 和 YouTube'
    };
  }

  if (platform === 'bilibili') {
    return await extractBilibiliInfo(url);
  } else if (platform === 'youtube') {
    return await extractYouTubeInfo(url);
  }
}

module.exports = {
  detectPlatform,
  extractVideoInfo,
  extractBilibiliInfo,
  extractYouTubeInfo
};
