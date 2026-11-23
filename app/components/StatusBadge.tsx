export default function StatusBadge({ status }: { status?: string }) {
  const value = status || "PENDING";
  const tone = value === "DELIVERED" ? "bg-emerald-100 text-emerald-800" : value === "PENDING" ? "bg-amber-100 text-amber-800" : value === "CANCELLED" ? "bg-red-100 text-red-800" : "bg-sky-100 text-sky-800";
  return <span className={`inline-flex rounded-lg px-2.5 py-1 text-[11px] font-black tracking-wide ${tone}`}>{value.replaceAll("_", " ")}</span>;
}
