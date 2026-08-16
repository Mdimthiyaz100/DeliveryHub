// 👤 Card showing delivery person info
import StatusBadge from "../common/StatusBadge";

function DeliveryPersonCard({ person, onAssignOrder, onDeletePerson, onToggleStatus }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow relative">
      {/* Header with avatar and status */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-xl">
            👤
          </div>   
          <div>
            <h4 className="font-semibold text-gray-800">{person.name}</h4>
            <p className="text-sm text-gray-500">{person.phone}</p>
            {person.vehicle_type && (
              <p className="text-xs text-blue-600 mt-0.5">{person.vehicle_type} • {person.vehicle_number || "N/A"}</p>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <StatusBadge status={person.status} />
          {person.status !== "On Delivery" && onToggleStatus && (
            <button
              onClick={() => onToggleStatus(person.id, person.status === "Available" ? "offline" : "available")}
              className="text-[10px] text-gray-400 hover:text-gray-600 underline"
            >
              Set {person.status === "Available" ? "Offline" : "Available"}
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
        <div>
          <p className="text-xs text-gray-500 uppercase">Deliveries</p>
          <p className="text-lg font-bold text-gray-800">{person.deliveries || 0}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase">Rating</p>
          <p className="text-lg font-bold text-yellow-500">⭐ {person.rating}</p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 mt-4">
        <button
          onClick={() => onAssignOrder(person)}
          className="flex-1 py-2 text-sm font-medium bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
        >
          Assign Order
        </button>
      </div>
    </div>
  );
}

export default DeliveryPersonCard;