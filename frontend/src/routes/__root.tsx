import { createRootRoute } from "@tanstack/react-router";
import { App } from "../App";
import { NotFoundPage } from "@/components/error/NotFoundPage";

export const Route = createRootRoute({
  component: App,
  notFoundComponent: NotFoundPage,
});
