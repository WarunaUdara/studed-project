import { spawnSync } from "bun";
import { resolve } from "path";

const DEFAULT_GATEWAY = "http://localhost:8080";

export interface SessionUser {
  id: string;
  email: string;
  role: string;
}

export class GraphQLClient {
  readonly gateway: string;
  readonly cookieJarPath?: string;
  cookies: string[] = [];

  constructor(opts: { gateway?: string; cookieJarPath?: string } = {}) {
    this.gateway = (opts.gateway ?? process.env.STUDED_API_URL ?? DEFAULT_GATEWAY).replace(/\/$/, "");
    this.cookieJarPath = opts.cookieJarPath;
  }

  async request<T = unknown>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (this.cookies.length > 0) {
      headers["Cookie"] = this.cookies.join("; ");
    }

    const res = await fetch(`${this.gateway}/graphql`, {
      method: "POST",
      headers,
      body: JSON.stringify({ query, variables }),
    });

    const setCookie = res.headers.get("set-cookie");
    if (setCookie) {
      for (const part of setCookie.split(",")) {
        const name = part.split("=")[0].trim();
        this.cookies = this.cookies.filter((c) => !c.startsWith(`${name}=`));
        this.cookies.push(part.split(";")[0].trim());
      }
      if (this.cookieJarPath) {
        await Bun.write(this.cookieJarPath, this.cookies.join("; "));
      }
    }

    const body = (await res.json()) as {
      data?: T;
      errors?: { message: string }[];
    };

    if (body.errors?.length) {
      throw new Error(body.errors.map((e) => e.message).join("; "));
    }
    return body.data as T;
  }
}

async function waitForGateway(gateway: string): Promise<void> {
  const base = gateway.replace(/\/$/, "");
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(`${base}/health`);
      if (res.ok) return;
    } catch {
      // gateway not up yet
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error(`API gateway at ${base} did not become ready in time`);
}

function promoteRoleIfNeeded(email: string, role: string, userRole: string): void {
  if (userRole === role) return;
  const dbUrl =
    process.env.STUDED_DATABASE_URL ?? process.env.DATABASE_CONNECTION_STRING ?? process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error(
      `account ${email} has role ${userRole} but ${role} is required. ` +
        "Set STUDED_DATABASE_URL to auto-promote via provision-educator.sh.",
    );
  }
  const root = resolve(import.meta.dir, "../../..");
  const result = spawnSync(["./scripts/provision-educator.sh", email, role], {
    cwd: root,
    env: { ...process.env, STUDED_DATABASE_URL: dbUrl },
  });
  if (result.exitCode !== 0) {
    throw new Error(`failed to promote ${email} to ${role}: ${result.stderr?.toString()}`);
  }
}

export async function authenticate(opts: {
  gateway?: string;
  email?: string;
  password?: string;
  role?: "EDUCATOR" | "STUDENT";
  fullName?: string;
  grade?: string;
  cookieJarPath?: string;
}): Promise<{ client: GraphQLClient; user: SessionUser }> {
  const gateway = (opts.gateway ?? process.env.STUDED_API_URL ?? DEFAULT_GATEWAY).replace(/\/$/, "");
  const email = opts.email ?? process.env.STUDED_EDUCATOR_EMAIL ?? "demo.educator@studed.lk";
  const password = opts.password ?? process.env.STUDED_EDUCATOR_PASSWORD ?? "password1234";
  const role = opts.role ?? "EDUCATOR";
  const fullName = opts.fullName ?? (role === "EDUCATOR" ? "Demo Educator" : "Demo Student");
  const grade = opts.grade ?? "";

  await waitForGateway(gateway);
  const client = new GraphQLClient({ gateway, cookieJarPath: opts.cookieJarPath });

  const registerInput: Record<string, unknown> = {
    email,
    password,
    fullName,
    preferredLanguage: "en",
  };
  if (grade) registerInput.grade = grade;

  let data: {
    register?: { user: SessionUser };
    login?: { user: SessionUser };
  } = {};
  try {
    data = await client.request(
      `mutation Register($input: RegisterInput!) {
        register(input: $input) { user { id email role } }
      }`,
      { input: registerInput },
    );
  } catch {
    data = await client.request(
      `mutation Login($input: LoginInput!) {
        login(input: $input) { user { id email role } }
      }`,
      { input: { email, password } },
    );
  }

  const user = data?.register?.user ?? data?.login?.user;
  if (!user) {
    throw new Error(`failed to authenticate ${email}`);
  }
  promoteRoleIfNeeded(email, role, user.role);

  return { client, user };
}
