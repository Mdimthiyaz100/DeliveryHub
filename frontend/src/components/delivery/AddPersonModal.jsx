import { useState } from "react";
import api from "../../../api/api";

function AddPersonModal({ onClose, onSuccess, person }) {
  const [formData, setFormData] = useState({
    name: person?.name || "",
    phone: person?.phone || "",
    email: person?.email || "",
    vehicleType: person?.vehicle_type || "Bike",
    vehicleNumber: person?.vehicle_number || ""
  });
  const [licenseFile, setLicenseFile] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) {
      setError("Name and phone number are required.");
      return;
    }
    if (!person && !licenseFile) {
      setError("Please choose a driving license PDF or JPEG.");
      return;
    }
    setLoading(true);
    setError("");

    const data = new FormData();
    data.append("name", formData.name.trim());
    data.append("phone", formData.phone.trim());
    data.append("email", formData.email.trim());
    data.append("vehicleType", formData.vehicleType);
    data.append("vehicleNumber", formData.vehicleNumber.trim());
    if (licenseFile) data.append("drivingLicense", licenseFile);

    const request = person
      ? api.put(`/delivery/${person.id}`, data, { headers: { "Content-Type": "multipart/form-data" } })
      : api.post("/delivery", data, { headers: { "Content-Type": "multipart/form-data" } });

    request
      .then(() => {
        onSuccess();
        onClose();
      })
      .catch(err => {
        setError(err.response?.data?.message || err.response?.data?.error || "Failed to add delivery person");
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 relative">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-xl font-bold text-gray-800">{person ? "Edit Delivery Person" : "Add Delivery Person"}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl font-bold p-1">✕</button>
        </div>

        {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4">⚠️ {error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              placeholder="e.g Mohamed Imthiyaz"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <input
              type="text"
              placeholder="e.g +91 9876543210"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Type</label>
              <select
                value={formData.vehicleType}
                onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="Bike">Bike</option>
                <option value="Scooter">Scooter</option>
                <option value="Bicycle">Bicycle</option>
                <option value="Van">Van</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Number</label>
              <input
                type="text"
                placeholder="e.g. TN-60-AA-8005"
                value={formData.vehicleNumber}
                onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Driving License {person ? "(replace optional)" : ""}
            </label>
            <input
              type="file"
              accept="application/pdf,image/jpeg,.pdf,.jpg,.jpeg"
              onChange={(e) => setLicenseFile(e.target.files?.[0] || null)}
              className="w-full px-3 py-2 border rounded-lg text-sm file:mr-3 file:border-0 file:bg-blue-50 file:px-3 file:py-1 file:text-blue-700 file:rounded-md"
              required={!person}
            />
            <p className="text-xs text-gray-500 mt-1">PDF or JPEG, up to 5 MB.</p>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
            <button type="submit" disabled={loading} className="px-5 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50">
              {loading ? "Saving..." : (person ? "Save Changes" : "Add Person")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddPersonModal;
