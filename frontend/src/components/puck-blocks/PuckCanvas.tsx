import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useEffect, useRef } from "react";
import { Puck, usePuck, type Overrides } from "@puckeditor/core";
import "@puckeditor/core/puck.css";
import "@/styles/puck-theme.css";
import { type PuckData, puckConfig } from "@/components/puck-blocks/puck-config";

interface PuckCanvasProps {
  data: PuckData;
  onChange: (data: PuckData) => void;
  onPublish: (data: PuckData) => void;
}

// ---------------------------------------------------------------------------
// Module-level bridge: lets the wave editor push data INTO Puck's internal
// store without remounting the editor (remounts reset zoom/selection/undo,
// which the agent must never disturb). The bridge lives inside Puck's React
// tree (via overrides.headerActions) so it can call usePuck() legally.
// ---------------------------------------------------------------------------

type Dispatch = ReturnType<typeof usePuck>["dispatch"];

let puckDispatch: Dispatch | null = null;

/** Non-render accessor for the wave editor. */
export function getPuckDispatch(): Dispatch | null {
  return puckDispatch;
}

/** Push a full data snapshot into Puck's store (keeps zoom/selection/history). */
export function pushPuckData(data: PuckData) {
  puckDispatch?.({
    type: "setData",
    data,
  });
}

// Rendered inside Puck's header via overrides.headerActions. Captures the
// dispatch handle and renders the Notion-style sidebar collapse toggle.
function PuckBridge() {
  const { dispatch, appState } = usePuck();
  const mounted = useRef(false);

  useEffect(() => {
    puckDispatch = dispatch;
    mounted.current = true;
    return () => {
      puckDispatch = null;
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

const headerActionsOverride: NonNullable<Partial<Overrides>["headerActions"]> = ({ children }) => (
  <>
    <PuckBridge />
    {children}
  </>
);

const puckOverrides: Partial<Overrides> = {
  headerActions: headerActionsOverride,
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
    />
  );
}
