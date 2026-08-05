import type { PagesFunction } from "@cloudflare/workers-types";

const API_ORIGIN = "https://api.34.149.224.124.sslip.io";

export const onRequest: PagesFunction = async (context) => {
  const url = new URL(context.request.url);

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

  return fetch(API_ORIGIN + url.pathname + url.search, init);
};
