import type { PuckData } from "@/components/puck-blocks/puck-config";

// Generic dispatch handle to avoid top-level Puck imports
type Dispatch = (action: any) => void;

let puckDispatch: Dispatch | null = null;

export function setPuckDispatchHandle(dispatch: Dispatch | null) {
  puckDispatch = dispatch;
}

export function getPuckDispatch(): Dispatch | null {
  return puckDispatch;
}

export function pushPuckData(data: PuckData) {
  puckDispatch?.({
    type: "setData",
    data,
  });
}

export function setPuckSidebarVisible(visible: boolean) {
  puckDispatch?.({
    type: "setUi",
    ui: { leftSideBarVisible: visible },
  });
}

export function setPuckPanelsVisible(visible: boolean) {
  puckDispatch?.({
    type: "setUi",
    ui: { leftSideBarVisible: visible, rightSideBarVisible: visible },
  });
}
