import PageHeader from "@/components/page-header";

const PLACEHOLDER_FIELDS = [
  { label: "Display name", value: "Omar Hindawy" },
  { label: "Theme", value: "Light (token driven)" },
  { label: "Notifications", value: "On · per server env" },
];

export default function Settings() {
  return (
    <>
      <PageHeader
        eyebrow="Settings"
        title="Server-rendered settings placeholder."
        description="In the day-one scaffold this is a read-only placeholder rendered from server state. The interactive form with validation lives in the earlier drill (settings-form-react) — the pattern carries straight over."
      />
      <div className="divide-y divide-ink-300/40 rounded-xl border border-ink-300/40 bg-surface-1">
        {PLACEHOLDER_FIELDS.map(({ label, value }) => (
          <div key={label} className="flex items-center justify-between gap-4 p-5">
            <dt className="text-sm font-medium text-ink-500">{label}</dt>
            <dd className="text-sm font-semibold text-ink-900">{value}</dd>
          </div>
        ))}
      </div>
    </>
  );
}