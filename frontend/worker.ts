interface Env {
  ASSETS: Fetcher;
}

const API_ORIGIN = "https://api.34.149.224.124.sslip.io";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/graphql") {
      const headers = new Headers(request.headers);
      headers.delete("host");
      headers.delete("cf-connecting-ip");
      headers.delete("cf-ray");
      headers.delete("cf-visitor");
      headers.delete("x-forwarded-for");
      headers.delete("x-forwarded-proto");
      headers.delete("x-real-ip");
      headers.set("accept-encoding", "identity");

      const init: RequestInit = {
        method: request.method,
        headers,
        redirect: "manual",
        cf: { cacheEverything: false, scrapeShield: false },
      };

      if (request.method === "POST" || request.method === "PUT" || request.method === "PATCH") {
        init.body = await request.arrayBuffer();
      }

      return fetch(API_ORIGIN + url.pathname + url.search, init);
    }

    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
