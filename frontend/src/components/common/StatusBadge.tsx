interface StatusBadgeProps {
  status?: string;
}

function StatusBadge({ status = "Pending" }: StatusBadgeProps) {
  const norm = status.toLowerCase();

  let styles = "bg-[#F7F7F7] text-[#777777] border-[#EAEAEA]";
  let dotColor = "bg-gray-400";

  if (norm.includes("deliver") || norm === "available") {
    styles = "bg-emerald-50 text-emerald-700 border-emerald-200";
    dotColor = "bg-emerald-500";
  } else if (norm.includes("transit") || norm.includes("assign") || norm === "on delivery" || norm === "on_the_way" || norm === "picked_up") {
    styles = "bg-blue-50 text-blue-700 border-blue-200";
    dotColor = "bg-blue-500";
  } else if (norm.includes("cancel") || norm === "offline") {
    styles = "bg-rose-50 text-rose-700 border-rose-200";
    dotColor = "bg-rose-500";
  } else if (norm.includes("pend")) {
    styles = "bg-amber-50 text-amber-700 border-amber-200";
    dotColor = "bg-amber-500";
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${styles}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      <span className="capitalize">{status.replace(/_/g, " ")}</span>
    </span>
  );
}

export default StatusBadge;
