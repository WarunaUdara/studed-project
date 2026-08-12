import type { PagesFunction } from "@cloudflare/workers-types";

interface Env {
  API_ORIGIN?: string;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const apiOrigin = context.env.API_ORIGIN || "https://api.8.233.11.14.sslip.io";

  if (url.pathname !== "/graphql") {
    return new Response("Not found", { status: 404 });
  }

  const headers = new Headers(context.request.headers);
  headers.delete("host");
  headers.delete("cf-connecting-ip");
  headers.delete("cf-ray");
  headers.delete("cf-visitor");
  headers.delete("x-forwarded-for");
  headers.delete("x-forwarded-proto");
  headers.delete("x-real-ip");
  headers.set("accept-encoding", "identity");

  const init: RequestInit = {
    method: context.request.method,
    headers,
    redirect: "manual",
  };

  if (context.request.method === "POST" || context.request.method === "PUT" || context.request.method === "PATCH") {
    init.body = await context.request.arrayBuffer();
  }

  return fetch(apiOrigin + url.pathname + url.search, init);
};
