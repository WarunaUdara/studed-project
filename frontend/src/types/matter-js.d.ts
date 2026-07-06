declare module "matter-js" {
  // biome-ignore lint/suspicious/noExplicitAny: matter-js does not ship TypeScript declarations
  const Matter: any;
  export default Matter;
}
