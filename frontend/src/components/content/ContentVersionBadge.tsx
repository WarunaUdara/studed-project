interface ContentVersionBadgeProps {
  version: number;
  status: "DRAFT" | "PUBLISHED";
}

export function ContentVersionBadge({ version, status }: ContentVersionBadgeProps) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="rounded-full bg-secondary px-2 py-0.5 font-medium">v{version}</span>
      <span
        className={`rounded-full px-2 py-0.5 ${
          status === "PUBLISHED"
            ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-100"
            : "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-100"
        }`}
      >
        {status}
      </span>
    </div>
  );
}
