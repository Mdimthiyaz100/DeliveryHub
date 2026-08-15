import { useEffect, useState } from "react";
import api from "../../../api/api";
import DeliveryPersonCard from "./DeliveryPersonCard";
import AddPersonModal from "./AddPersonModal";
import AssignOrderModal from "./AssignOrderModal";

function DeliveryStatus() {
  const [deliveryPersons, setDeliveryPersons] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [assigningDriver, setAssigningDriver] = useState(null);

  const fetchDeliveryPersons = () => {
    api.get("/delivery")
      .then(res => {
        if (Array.isArray(res.data)) {
          setDeliveryPersons(res.data.map(p => ({
            id: p.id,
            name: p.name,
            phone: p.phone,
            email: p.email,
            vehicle_type: p.vehicle_type,
            vehicle_number: p.vehicle_number,
            status: p.status === "available" ? "Available" : (p.status === "busy" ? "On Delivery" : "Offline"),
            deliveries: Number(p.total_deliveries || 0),
            rating: "4.8"
          })));
        }
      })
      .catch(err => console.error("Error fetching delivery persons:", err));
  };

  useEffect(() => { fetchDeliveryPersons(); }, []);

  const handleDeletePerson = (id, name) => {
    if (window.confirm(`Remove ${name} from delivery team?`)) {
      api.delete(`/delivery/${id}`)
        .then(fetchDeliveryPersons)
        .catch(err => alert("Failed to delete: " + (err.response?.data?.message || err.message)));
    }
  };

  const handleToggleStatus = (id, newStatus) => {
    api.patch(`/delivery/${id}/status`, { status: newStatus })
      .then(fetchDeliveryPersons)
      .catch(err => alert("Failed to change status: " + (err.response?.data?.message || err.message)));
  };

  const availableCount = deliveryPersons.filter(p => p.status === "Available").length;
  const busyCount = deliveryPersons.filter(p => p.status === "On Delivery").length;
  const offlineCount = deliveryPersons.filter(p => p.status === "Offline").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Delivery Person list</h2>
          <p className="text-gray-500 mt-1">Manage your delivery team</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors shadow-sm"
        >
          + Add Person
        </button>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-green-50 rounded-lg p-4 text-center border border-green-100">
          <p className="text-2xl font-bold text-green-600">{availableCount}</p>
          <p className="text-sm text-green-700">Available</p>
        </div>
        <div className="bg-blue-50 rounded-lg p-4 text-center border border-blue-100">
          <p className="text-2xl font-bold text-blue-600">{busyCount}</p>
          <p className="text-sm text-blue-700">On Delivery</p>
        </div>
        <div className="bg-red-50 rounded-lg p-4 text-center border border-red-100">
          <p className="text-2xl font-bold text-red-600">{offlineCount}</p>
          <p className="text-sm text-red-700">Offline</p>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {deliveryPersons.map((person) => (
          <DeliveryPersonCard
            key={person.id}
            person={person}
            onAssignOrder={setAssigningDriver}
            onDeletePerson={handleDeletePerson}
            onToggleStatus={handleToggleStatus}
          />
        ))}
      </div>

      {/* Modals */}
      {showAddModal && <AddPersonModal onClose={() => setShowAddModal(false)} onSuccess={fetchDeliveryPersons} />}
      {assigningDriver && <AssignOrderModal driver={assigningDriver} onClose={() => setAssigningDriver(null)} onSuccess={fetchDeliveryPersons} />}
    </div>
  );
}

export default DeliveryStatus;