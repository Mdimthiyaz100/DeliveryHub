import StatusBadge from "../common/StatusBadge";

interface DeliveryPersonCardProps {
  person: any;
  onAssignOrder: (person: any) => void;
  onToggleStatus: (id: number, status: string) => void;
  onRemove?: (id: number, name: string) => void;
}

function getInitials(name: string) {
  if (!name) return "DP";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export default function DeliveryPersonCard({ person, onAssignOrder, onToggleStatus, onRemove }: DeliveryPersonCardProps) {
  const initials = getInitials(person.name);
  const isBusy = person.status === "On Delivery";
  const isAvailable = person.status === "Available";

  return (
    <div className="bg-[#202225] rounded-2xl border border-[#303236] p-5 hover:border-[#FF6B00]/40 transition-all shadow-card group relative flex flex-col justify-between">
      {/* Top Header */}
      <div>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FF6B00] to-[#FF8A24] text-white flex items-center justify-center font-bold text-base shadow-sm">
              {initials}
            </div>   
            <div>
              <h4 className="font-extrabold text-white text-sm group-hover:text-[#FF6B00] transition-colors">{person.name}</h4>
              <p className="text-xs text-[#A5A5A5]">{person.phone || "No phone registered"}</p>
              {person.vehicle_type && (
                <span className="inline-block mt-1 text-[10px] font-semibold text-[#FF6B00] bg-[#FF6B00]/10 border border-[#FF6B00]/20 px-2 py-0.5 rounded-md">
                  {person.vehicle_type} • {person.vehicle_number || "TN-EXPRESS"}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end gap-1.5">
            <StatusBadge status={person.status} />
            {!isBusy && onToggleStatus && (
              <button
                type="button"
                onClick={() => onToggleStatus(person.id, isAvailable ? "offline" : "available")}
                className="text-[10px] text-[#A5A5A5] hover:text-[#FF6B00] underline"
              >
                Set {isAvailable ? "Offline" : "Available"}
              </button>
            )}
          </div>
        </div>

        {/* Deliveries & Rating Grid */}
        <div className="grid grid-cols-2 gap-3 py-3 border-t border-b border-[#303236] my-3 text-xs bg-[#191A1C]/60 rounded-xl p-3">
          <div>
            <p className="text-[10px] text-[#A5A5A5] uppercase font-bold tracking-wider">Completed Deliveries</p>
            <p className="text-base font-extrabold text-white">{person.deliveries || 0} orders</p>
          </div>
          <div>
            <p className="text-[10px] text-[#A5A5A5] uppercase font-bold tracking-wider">Driver Rating</p>
            <p className="text-base font-extrabold text-[#FF6B00]">★ {person.rating || "4.9"}</p>
          </div>
        </div>

        {/* Active Orders In Progress banner */}
        {isBusy && (
          <div className="mb-3 px-3 py-2 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-bold">
              <span className="w-2 h-2 rounded-full bg-[#FF6B00] animate-ping" />
              Dispatch in Progress
            </span>
            <span className="font-mono font-bold">{person.activeOrdersCount || 1} package</span>
          </div>
        )}
      </div>

      {/* Action buttons footer */}
      <div className="flex items-center gap-2 mt-2">
        <button
          type="button"
          onClick={() => onAssignOrder(person)}
          className={`flex-1 py-2.5 px-3 text-xs font-bold uppercase tracking-wider rounded-xl border transition-all flex items-center justify-center gap-1.5 shadow-sm ${
            isBusy
              ? "bg-[#191A1C] text-gray-400 border-[#303236] hover:border-gray-500 hover:text-white"
              : "bg-[#191A1C] hover:bg-[#FF6B00] text-white border-[#303236] hover:border-[#FF6B00]"
          }`}
        >
          <span>⚡</span>
          <span>{isBusy ? "Assign Additional" : "Assign Live Order"}</span>
        </button>

        {onRemove && (
          <button
            type="button"
            onClick={() => onRemove(person.id, person.name)}
            className="p-2.5 rounded-xl bg-[#191A1C] hover:bg-rose-500/20 text-gray-500 hover:text-rose-400 border border-[#303236] hover:border-rose-500/30 transition-all text-xs"
            title="Deactivate Partner"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
