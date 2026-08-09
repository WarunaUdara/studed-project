import { Puck } from "@puckeditor/core";
import "@puckeditor/core/puck.css";
import "@/styles/puck-theme.css";
import { type PuckData, puckConfig } from "@/components/puck-blocks/puck-config";

interface PuckCanvasProps {
  data: PuckData;
  onChange: (data: PuckData) => void;
  onPublish: (data: PuckData) => void;
}

// Isolated into its own module so @puckeditor/core (and its CSS) load as a
// separate chunk, only fetched when the educator wave editor actually
// renders — see frontend/src/routes/.../waves.$waveId.tsx which lazy-loads
// this component.
//
// IMPORTANT: Puck's `data` prop is UNCONTROLLED — it only seeds the internal
// store on mount and is never re-read. Externally-produced data (AI blocks
// inserted from the assistant panel) therefore must remount Puck with a new
// `key` so it reinitializes from the updated data prop. The wave editor does
// this by incrementing a version counter on insert. Passing children to Puck
// would replace its entire editor UI, so this component renders <Puck> bare.
export default function PuckCanvas({ data, onChange, onPublish }: PuckCanvasProps) {
  return <Puck config={puckConfig} data={data} onChange={onChange} onPublish={onPublish} />;
}
