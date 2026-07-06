import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { MediaAttachmentPicker } from "@/components/upload/MediaAttachmentPicker";
import {
  type CreateContentBlockInput,
  createContentBlockSchema,
  type EvaluatePayload,
  evaluatePayloadSchema,
  type LearnPayload,
  learnPayloadSchema,
} from "@/schemas/content";

interface ContentBlockFormProps {
  waveId: string;
  defaultValues?: {
    title?: string;
    type?: "LEARN" | "EVALUATE";
    payloadJson?: string;
  };
  mode: "create" | "update";
  onSubmit: (values: { title: string; type: "LEARN" | "EVALUATE"; payloadJson: string }) => void;
  isSubmitting: boolean;
}

const typeOptions = [
  { value: "LEARN", label: "Learn block" },
  { value: "EVALUATE", label: "Evaluate block" },
];

export function ContentBlockForm({
  waveId,
  defaultValues,
  mode,
  onSubmit,
  isSubmitting,
}: ContentBlockFormProps) {
  const form = useForm<CreateContentBlockInput>({
    resolver: zodResolver(createContentBlockSchema),
    defaultValues: {
      waveId,
      title: defaultValues?.title ?? "",
      type: defaultValues?.type ?? "LEARN",
      payloadJson: defaultValues?.payloadJson ?? "{}",
    },
  });

  const watchedType = useWatch({ control: form.control, name: "type" }) as "LEARN" | "EVALUATE";
  const watchedPayloadJson = useWatch({ control: form.control, name: "payloadJson" }) as string;

  const [payload, setPayload] = useState<LearnPayload | EvaluatePayload>(() =>
    parsePayload(watchedType, watchedPayloadJson),
  );

  useEffect(() => {
    setPayload(parsePayload(watchedType, watchedPayloadJson));
  }, [watchedType, watchedPayloadJson]);

  const optionsText = useMemo(() => {
    if (watchedType !== "EVALUATE") return "";
    return (payload as EvaluatePayload).options?.join("\n") ?? "";
  }, [payload, watchedType]);

  const updatePayload = (next: LearnPayload | EvaluatePayload) => {
    setPayload(next);
    form.setValue("payloadJson", JSON.stringify(next), { shouldValidate: true });
  };

  const handleSubmit = form.handleSubmit(() => {
    const values = form.getValues();
    onSubmit({
      title: values.title,
      type: values.type as "LEARN" | "EVALUATE",
      payloadJson: values.payloadJson,
    });
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {mode === "create" && (
        <div className="space-y-2">
          <Label htmlFor="waveId">Wave ID</Label>
          <Input id="waveId" {...form.register("waveId")} placeholder="e.g. uuid of the wave" />
          {form.formState.errors.waveId && (
            <p className="text-sm text-destructive">{form.formState.errors.waveId.message}</p>
          )}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" {...form.register("title")} placeholder="Block title" />
        {form.formState.errors.title && (
          <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="type">Block type</Label>
        <Select id="type" options={typeOptions} {...form.register("type")} />
      </div>

      {watchedType === "LEARN" ? (
        <LearnFields payload={payload as LearnPayload} onChange={updatePayload} />
      ) : (
        <EvaluateFields
          payload={payload as EvaluatePayload}
          optionsText={optionsText}
          onChange={updatePayload}
        />
      )}

      <div className="space-y-2">
        <Label>Media attachments</Label>
        <MediaAttachmentPicker
          attachments={
            (payload.attachments ?? []) as {
              mediaAssetId: string;
              filename: string;
              cdnUrl: string;
            }[]
          }
          onChange={(attachments) =>
            updatePayload({ ...payload, attachments } as LearnPayload | EvaluatePayload)
          }
        />
      </div>

      {form.formState.errors.payloadJson && (
        <p className="text-sm text-destructive">{form.formState.errors.payloadJson.message}</p>
      )}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : mode === "create" ? "Create block" : "Update block"}
      </Button>
    </form>
  );
}

function LearnFields({
  payload,
  onChange,
}: {
  payload: LearnPayload;
  onChange: (p: LearnPayload) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="blockType">Block subtype</Label>
        <Input
          id="blockType"
          value={payload.type}
          onChange={(e) => onChange({ ...payload, type: e.target.value })}
          placeholder="e.g. text, video, image"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="content">Content</Label>
        <Textarea
          id="content"
          value={payload.content}
          onChange={(e) => onChange({ ...payload, content: e.target.value })}
          placeholder="Write the learning content here..."
          rows={6}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="metadata">Metadata (optional)</Label>
        <Input
          id="metadata"
          value={payload.metadata ?? ""}
          onChange={(e) => onChange({ ...payload, metadata: e.target.value })}
          placeholder="Extra JSON-like metadata string"
        />
      </div>
    </div>
  );
}

function EvaluateFields({
  payload,
  optionsText,
  onChange,
}: {
  payload: EvaluatePayload;
  optionsText: string;
  onChange: (p: EvaluatePayload) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="blockType">Block subtype</Label>
        <Input
          id="blockType"
          value={payload.type}
          onChange={(e) => onChange({ ...payload, type: e.target.value })}
          placeholder="e.g. mcq, true_false"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="question">Question</Label>
        <Textarea
          id="question"
          value={payload.question}
          onChange={(e) => onChange({ ...payload, question: e.target.value })}
          placeholder="Enter the question"
          rows={3}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="options">Options (one per line)</Label>
        <Textarea
          id="options"
          value={optionsText}
          onChange={(e) =>
            onChange({
              ...payload,
              options: e.target.value.split("\n").filter((o) => o.trim() !== ""),
            })
          }
          placeholder="Option A&#10;Option B&#10;Option C"
          rows={4}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="correctAnswer">Correct answer</Label>
        <Input
          id="correctAnswer"
          value={payload.correctAnswer ?? ""}
          onChange={(e) => onChange({ ...payload, correctAnswer: e.target.value })}
          placeholder="The correct answer"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="explanation">Explanation</Label>
        <Textarea
          id="explanation"
          value={payload.explanation ?? ""}
          onChange={(e) => onChange({ ...payload, explanation: e.target.value })}
          placeholder="Explain why the answer is correct"
          rows={3}
        />
      </div>
    </div>
  );
}

function parsePayload(type: "LEARN" | "EVALUATE", json: string): LearnPayload | EvaluatePayload {
  try {
    const parsed = JSON.parse(json);
    if (type === "EVALUATE") {
      const result = evaluatePayloadSchema.safeParse(parsed);
      if (result.success) return result.data;
    } else {
      const result = learnPayloadSchema.safeParse(parsed);
      if (result.success) return result.data;
    }
  } catch {
    /* fallthrough to defaults */
  }

  if (type === "EVALUATE") {
    return { type: "mcq", question: "", options: [], attachments: [] };
  }
  return { type: "text", content: "", attachments: [] };
}
