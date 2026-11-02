import { useState, FormEvent } from "react";
import api from "../../../api/api";

interface AddPersonModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

function AddPersonModal({ onClose, onSuccess }: AddPersonModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    vehicleType: "Bike",
    vehicleNumber: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) {
      setError("Name and phone number are required.");
      return;
    }
    setLoading(true);
    setError("");

    api.post("/delivery", {
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim() || null,
      vehicleType: formData.vehicleType,
      vehicleNumber: formData.vehicleNumber.trim()
    })
      .then(() => {
        onSuccess();
        onClose();
      })
      .catch(err => {
        setError(err.response?.data?.message || "Failed to add delivery person");
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#191A1C] border border-[#303236] rounded-2xl shadow-card w-full max-w-md p-6 relative">
        <div className="flex justify-between items-center pb-4 border-b border-[#303236] mb-5">
          <div>
            <span className="text-[10px] font-bold text-[#FF6B00] uppercase tracking-wider">Fleet Expansion</span>
            <h3 className="text-lg font-extrabold text-white">Register Delivery Courier</h3>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-lg bg-[#202225] text-[#A5A5A5] hover:text-white flex items-center justify-center border border-[#303236]"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs p-3 rounded-xl mb-4">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#A5A5A5] mb-2">
              Courier Full Name
            </label>
            <input
              type="text"
              placeholder="e.g. Mohamed Imthiyaz"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2.5 bg-[#202225] border border-[#303236] rounded-xl text-white text-xs placeholder-[#A5A5A5] focus:outline-none focus:border-[#FF6B00]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#A5A5A5] mb-2">
              Direct Phone Number
            </label>
            <input
              type="text"
              placeholder="e.g. +91 98765 43210"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-2.5 bg-[#202225] border border-[#303236] rounded-xl text-white text-xs placeholder-[#A5A5A5] focus:outline-none focus:border-[#FF6B00]"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#A5A5A5] mb-2">
                Vehicle Type
              </label>
              <select
                value={formData.vehicleType}
                onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                className="w-full px-3 py-2.5 bg-[#202225] border border-[#303236] rounded-xl text-white text-xs focus:outline-none focus:border-[#FF6B00]"
              >
                <option value="Bike">Motorcycle</option>
                <option value="Scooter">Scooter</option>
                <option value="Bicycle">Bicycle (Eco)</option>
                <option value="Van">Cargo Van</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#A5A5A5] mb-2">
                License / Plate
              </label>
              <input
                type="text"
                placeholder="e.g. TN-60-AA-8005"
                value={formData.vehicleNumber}
                onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
                className="w-full px-3 py-2.5 bg-[#202225] border border-[#303236] rounded-xl text-white text-xs placeholder-[#A5A5A5] focus:outline-none focus:border-[#FF6B00]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[#303236]">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-4 py-2 text-xs font-semibold text-[#A5A5A5] hover:text-white rounded-xl bg-[#202225] border border-[#303236]"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading} 
              className="px-5 py-2 text-xs font-bold uppercase tracking-wider text-white bg-gradient-to-r from-[#FF6B00] to-[#FF8A24] rounded-xl shadow-glow-sm disabled:opacity-50"
            >
              {loading ? "Registering..." : "Onboard Partner"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddPersonModal;
