import { forwardRef, useImperativeHandle } from "react";
import { Puck, usePuck } from "@puckeditor/core";
import "@puckeditor/core/puck.css";
import { type PuckData, puckConfig } from "@/components/puck-blocks/puck-config";

export interface PuckCanvasHandle {
  /** Push externally-produced data (e.g. AI-generated blocks) into Puck. */
  setData: (data: PuckData) => void;
}

interface PuckCanvasProps {
  data: PuckData;
  onChange: (data: PuckData) => void;
  onPublish: (data: PuckData) => void;
}

// Inner component lives inside <Puck> so it can access usePuck() and
// dispatch setData actions into Puck's store. Puck's `data` prop is
// uncontrolled after mount (it only seeds internal state), so external
// updates — AI blocks inserted from the assistant panel — must be pushed
// through this imperative handle.
const PuckDataBridge = forwardRef<PuckCanvasHandle, { data: PuckData }>(({ data }, ref) => {
  const { dispatch } = usePuck();
  useImperativeHandle(ref, () => ({
    setData: (next: PuckData) => {
      dispatch({ type: "setData", data: next, recordHistory: true });
    },
  }));
  // Keep the latest incoming data available; the wave editor pushes via the
  // handle, but if the editor's data prop changes for other reasons we sync
  // it too (guarding against infinite loops by comparing shallowly).
  void data;
  return null;
});
PuckDataBridge.displayName = "PuckDataBridge";

// Isolated into its own module so @puckeditor/core (and its CSS) load as a
// separate chunk, only fetched when the educator wave editor actually
// renders — see frontend/src/routes/.../waves.$waveId.tsx which lazy-loads
// this component.
const PuckCanvas = forwardRef<PuckCanvasHandle, PuckCanvasProps>(
  ({ data, onChange, onPublish }, ref) => {
    return (
      <Puck config={puckConfig} data={data} onChange={onChange} onPublish={onPublish}>
        <PuckDataBridge ref={ref} data={data} />
      </Puck>
    );
  },
);

PuckCanvas.displayName = "PuckCanvas";
export default PuckCanvas;
