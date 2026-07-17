// ============================================================
// 🔧 计数器后端 API —— 用 Vercel KV (Redis) 存数据
// 所有访客共享同一个数字，不丢数据，全球同步 ✅
// ============================================================

// 引入 Vercel KV 数据库
import { kv } from '@vercel/kv';

export const config = {
  runtime: 'edge',  // 用 Edge 运行时，全球响应更快
};

export default async function handler(request) {
  // 允许所有来源访问（你和你朋友在不同地点都能用）
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  // 预检请求直接通过
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  try {
    // === GET：读取当前计数 ===
    if (request.method === 'GET') {
      const count = (await kv.get('page_counter')) ?? 0;
      return new Response(JSON.stringify({ count }), { status: 200, headers });
    }

    // === POST：修改计数 ===
    if (request.method === 'POST') {
      const body = await request.json();
      const { action } = body;

      if (action === 'increment') {
        // incr 是原子操作，100 个人同时点也不会出错
        const count = await kv.incr('page_counter');
        return new Response(JSON.stringify({ count }), { status: 200, headers });
      }

      if (action === 'reset') {
        await kv.set('page_counter', 0);
        return new Response(JSON.stringify({ count: 0 }), { status: 200, headers });
      }

      return new Response(JSON.stringify({ error: '未知操作' }), {
        status: 400,
        headers,
      });
    }

    return new Response(JSON.stringify({ error: '不支持的请求方法' }), {
      status: 405,
      headers,
    });
  } catch (error) {
    console.error('计数器出错:', error);
    return new Response(JSON.stringify({ count: 0, error: '服务器错误' }), {
      status: 500,
      headers,
    });
  }
}
