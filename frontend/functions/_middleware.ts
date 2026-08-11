interface Env {
  API_ORIGIN?: string;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);

  // Proxy the API surface; everything else is served as a static asset.
  // /v1/uploads covers both educator image uploads and the public read route
  // that <img> tags point at.
  const PROXIED_PREFIXES = ['/graphql', '/health', '/v1/uploads', '/ai/chat'];
  const isProxied = PROXIED_PREFIXES.some((prefix) => url.pathname.startsWith(prefix));
  if (!isProxied) {
    return context.next();
  }

  const apiOrigin = env.API_ORIGIN || 'http://localhost:8080';
  const targetUrl = `${apiOrigin}${url.pathname}${url.search}`;

  const reqHeaders = new Headers(request.headers);
  const clientIP = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || '';
  if (clientIP) {
    reqHeaders.set('x-studed-client-ip', clientIP);
  }

  // GraphQL is short-lived, but file uploads over mobile links and the SSE
  // agent stream both routinely exceed 15s; aborting them mid-flight would
  // surface as a truncated upload or a dead chat panel.
  const isLongRunning =
    url.pathname.startsWith('/v1/uploads') || url.pathname.startsWith('/ai/chat');
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), isLongRunning ? 120000 : 15000);

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
