import { chromium } from "@playwright/test";

const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await p.goto("http://localhost:5173/", { waitUntil: "networkidle" });
const tokens = await p.evaluate(() => {
  const cs = getComputedStyle(document.documentElement);
  const names = [
    "--background",
    "--foreground",
    "--primary",
    "--primary-foreground",
    "--secondary",
    "--accent",
    "--muted",
    "--success",
    "--gold",
    "--purple",
    "--radius",
    "--ring",
    "--border",
  ];
  const out: Record<string, string> = {};
  for (const n of names) out[n] = cs.getPropertyValue(n).trim();
  return out;
});
console.log("ROOT TOKENS:", JSON.stringify(tokens, null, 2));
const els = await p.evaluate(() => {
  return Array.from(document.querySelectorAll("a,button"))
    .slice(0, 14)
    .map((e) => ({
      t: (e.textContent || "").trim().slice(0, 30),
      bg: getComputedStyle(e).backgroundColor,
      fg: getComputedStyle(e).color,
      r: getComputedStyle(e).borderRadius,
      ff: getComputedStyle(e).fontFamily.split(",")[0],
      fs: getComputedStyle(e).fontSize,
    }));
});
console.log("ELEMENTS:", JSON.stringify(els, null, 2));
const h = await p.evaluate(() =>
  Array.from(document.querySelectorAll("h1,h2,h3,p"))
    .slice(0, 10)
    .map((e) => ({
      tag: e.tagName,
      t: (e.textContent || "").trim().slice(0, 40),
      ff: getComputedStyle(e).fontFamily.split(",")[0],
      fs: getComputedStyle(e).fontSize,
      lh: getComputedStyle(e).lineHeight,
      fw: getComputedStyle(e).fontWeight,
      c: getComputedStyle(e).color,
    })),
);
console.log("TYPE:", JSON.stringify(h, null, 2));
await b.close();
