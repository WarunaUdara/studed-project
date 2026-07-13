import { createRootRoute } from "@tanstack/react-router";
import { NotFoundPage } from "@/components/error/NotFoundPage";
import { App } from "../App";

export const Route = createRootRoute({
  component: App,
  notFoundComponent: NotFoundPage,
});
