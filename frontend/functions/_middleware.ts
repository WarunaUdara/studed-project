interface Env {
  API_ORIGIN?: string;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);

  // Only proxy /graphql and /health calls
  if (!url.pathname.startsWith('/graphql') && !url.pathname.startsWith('/health')) {
    return context.next();
  }

  const apiOrigin = env.API_ORIGIN || 'http://localhost:8080';
  const targetUrl = `${apiOrigin}${url.pathname}${url.search}`;

  const reqHeaders = new Headers(request.headers);
  const clientIP = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || '';
  if (clientIP) {
    reqHeaders.set('x-studed-client-ip', clientIP);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(targetUrl, {
      method: request.method,
      headers: reqHeaders,
      body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (err: any) {
    clearTimeout(timeoutId);
    return new Response(JSON.stringify({ error: 'Upstream gateway unavailable', details: err.message }), {
      status: 502,
      headers: { 'content-type': 'application/json' },
    });
  }
};
