import { Puck } from "@puckeditor/core";
import "@puckeditor/core/puck.css";
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
export default function PuckCanvas({ data, onChange, onPublish }: PuckCanvasProps) {
  return <Puck config={puckConfig} data={data} onChange={onChange} onPublish={onPublish} />;
}
