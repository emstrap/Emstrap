import { formatDate } from "./admin.utils";

const formatValue = (value) => {
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (value instanceof Date) return formatDate(value);
  if (!value && value !== 0) return "N/A";
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
};

export default function AdminDetailGrid({ data }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {Object.entries(data).map(([label, value]) => (
        <div key={label} className="rounded-2xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/40">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">{label}</p>
          <pre className="mt-2 whitespace-pre-wrap break-words font-sans text-sm text-gray-700 dark:text-gray-200">
            {formatValue(value)}
          </pre>
        </div>
      ))}
    </div>
  );
}
