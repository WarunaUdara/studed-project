import { type Overrides, Puck, type UiState, usePuck } from "@puckeditor/core";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useEffect, useRef } from "react";
import "@puckeditor/core/puck.css";
import "@/styles/puck-theme.css";
import { type PuckData, puckConfig } from "@/components/puck-blocks/puck-config";
import {
  getPuckDispatch,
  pushPuckData,
  setPuckDispatchHandle,
  setPuckPanelsVisible,
  setPuckSidebarVisible,
} from "./puck-bridge";

export { getPuckDispatch, pushPuckData, setPuckPanelsVisible, setPuckSidebarVisible };

interface PuckCanvasProps {
  data: PuckData;
  onChange: (data: PuckData) => void;
  onPublish: (data: PuckData) => void;
}

// Rendered inside Puck's header via overrides.headerActions. Captures the
// dispatch handle and renders the Notion-style sidebar collapse toggle.
// Puck's own Publish button is NOT rendered: saving is a single explicit
// action in the wave editor header (Save), avoiding duplicate/confusing
// publish affordances.
function PuckBridge() {
  const { dispatch, appState } = usePuck();
  const mounted = useRef(false);

  useEffect(() => {
    setPuckDispatchHandle(dispatch);
    mounted.current = true;
    return () => {
      setPuckDispatchHandle(null);
    };
  }, [dispatch]);

  const leftVisible = appState.ui?.leftSideBarVisible ?? true;

  return (
    <button
      type="button"
      onClick={() =>
        dispatch({
          type: "setUi",
          ui: { leftSideBarVisible: !leftVisible },
        })
      }
      title={leftVisible ? "Collapse panel" : "Expand panel"}
      aria-label="Toggle blocks panel"
      className="puck-sidebar-toggle"
    >
      {leftVisible ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
    </button>
  );
}

// Render only the sidebar toggle in the header actions; drop Puck's Publish
// button (the app header has the single Save action).
const headerActionsOverride: NonNullable<Partial<Overrides>["headerActions"]> = () => (
  <PuckBridge />
);

const puckOverrides: Partial<Overrides> = {
  headerActions: headerActionsOverride,
};

// The editor always opens in full-width viewport mode, and only the
// full-width control is offered (no small/medium/large icons cluttering the
// canvas toolbar — the editor is a desktop-first authoring surface).
const fullWidthViewport: NonNullable<UiState["viewports"]> = {
  current: { width: "100%", height: "auto" },
  options: [{ width: "100%", height: "auto", icon: "FullWidth", label: "Full-width" }],
  controlsVisible: false,
};

const initialUi: Partial<UiState> = {
  viewports: fullWidthViewport,
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

// Isolated into its own module so @puckeditor/core (and its CSS) load as a
// separate chunk, only fetched when the educator wave editor renders.
//
// NOTE: Puck's `data` prop is UNCONTROLLED (seeds the store once on mount).
// External data changes (AI auto-insert) go through pushPuckData() so the
// editor keeps its zoom/selection/undo — never remount, never pass children
// that replace Puck's default UI (children || <FrameProvider>).
export default function PuckCanvas({ data, onChange, onPublish }: PuckCanvasProps) {
  return (
    <Puck
      config={puckConfig}
      data={data}
      onChange={onChange}
      onPublish={onPublish}
      overrides={puckOverrides}
      ui={initialUi}
    />
  );
}
