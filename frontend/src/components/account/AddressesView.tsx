import React, { useState, useEffect } from "react";
import api from "../../../api/api";

interface Address {
  id: string | number;
  type: "Home" | "Work" | "Other";
  recipientName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

interface AddressesViewProps {
  orders?: any[];
}

export const AddressesView: React.FC<AddressesViewProps> = ({ orders = [] }) => {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  // Form State
  const [type, setType] = useState<"Home" | "Work" | "Other">("Home");
  const [recipientName, setRecipientName] = useState("");
  const [phone, setPhone] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("Bengaluru");
  const [state, setState] = useState("Karnataka");
  const [pincode, setPincode] = useState("560001");
  const [isDefault, setIsDefault] = useState(false);

  // Load addresses from backend database with fallback to past orders / localStorage
  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const res = await api.get("/users/addresses");
      if (Array.isArray(res.data) && res.data.length > 0) {
        const mapped: Address[] = res.data.map((a: any) => ({
          id: a.id,
          type: a.type || "Home",
          recipientName: a.recipient_name,
          phone: a.phone,
          street: a.street,
          city: a.city,
          state: a.state,
          pincode: a.pincode,
          isDefault: Boolean(a.is_default),
        }));
        setAddresses(mapped);
        localStorage.setItem("deliveryhub_user_addresses", JSON.stringify(mapped));
        return;
      }
    } catch (err) {
      console.warn("Could not fetch addresses from backend:", err);
    } finally {
      setLoading(false);
    }

    // Fallback: check localStorage or past orders
    const saved = localStorage.getItem("deliveryhub_user_addresses");
    if (saved) {
      try {
        setAddresses(JSON.parse(saved));
        return;
      } catch (e) {
        // Fall through
      }
    }

    const firstOrderWithAddress = orders.find((o) => o.delivery_address);
    if (firstOrderWithAddress) {
      const initial: Address[] = [
        {
          id: "addr-1",
          type: "Home",
          recipientName: firstOrderWithAddress.recipient_name || localStorage.getItem("userName") || "Rahul Sharma",
          phone: firstOrderWithAddress.customer_phone || "+91 98765 43210",
          street: firstOrderWithAddress.delivery_address || "#402, Lotus Residency, 4th Cross, Indiranagar",
          city: firstOrderWithAddress.city || "Bengaluru",
          state: firstOrderWithAddress.state || "Karnataka",
          pincode: firstOrderWithAddress.pincode || "560038",
          isDefault: true,
        },
      ];
      setAddresses(initial);
      localStorage.setItem("deliveryhub_user_addresses", JSON.stringify(initial));
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, [orders]);

  const handleOpenAdd = () => {
    setEditingAddress(null);
    setType("Home");
    setRecipientName(localStorage.getItem("userName") || "");
    setPhone(localStorage.getItem("userPhone") || "");
    setStreet("");
    setCity("Bengaluru");
    setState("Karnataka");
    setPincode("560001");
    setIsDefault(addresses.length === 0);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (addr: Address) => {
    setEditingAddress(addr);
    setType(addr.type);
    setRecipientName(addr.recipientName);
    setPhone(addr.phone);
    setStreet(addr.street);
    setCity(addr.city);
    setState(addr.state);
    setPincode(addr.pincode);
    setIsDefault(addr.isDefault);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string | number) => {
    const ok = window.confirm("Are you sure you want to delete this address?");
    if (!ok) return;

    try {
      await api.delete(`/users/addresses/${id}`);
    } catch (err) {
      console.warn("Server delete address failed, continuing locally:", err);
    }

    const remaining = addresses.filter((a) => a.id !== id);
    if (remaining.length > 0 && !remaining.some((a) => a.isDefault)) {
      remaining[0].isDefault = true;
    }
    setAddresses(remaining);
    localStorage.setItem("deliveryhub_user_addresses", JSON.stringify(remaining));
  };

  const handleSetDefault = async (id: string | number) => {
    const target = addresses.find((a) => a.id === id);
    if (target) {
      try {
        await api.put(`/users/addresses/${id}`, {
          ...target,
          isDefault: true,
        });
      } catch (err) {
        console.warn("Server set default failed, continuing locally:", err);
      }
    }

    const updated = addresses.map((a) => ({
      ...a,
      isDefault: a.id === id,
    }));
    setAddresses(updated);
    localStorage.setItem("deliveryhub_user_addresses", JSON.stringify(updated));
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientName.trim() || !phone.trim() || !street.trim()) {
      alert("Please fill in all mandatory fields.");
      return;
    }

    try {
      if (editingAddress) {
        await api.put(`/users/addresses/${editingAddress.id}`, {
          type,
          recipientName: recipientName.trim(),
          phone: phone.trim(),
          street: street.trim(),
          city: city.trim(),
          state: state.trim(),
          pincode: pincode.trim(),
          isDefault,
        });
      } else {
        await api.post("/users/addresses", {
          type,
          recipientName: recipientName.trim(),
          phone: phone.trim(),
          street: street.trim(),
          city: city.trim(),
          state: state.trim(),
          pincode: pincode.trim(),
          isDefault,
        });
      }
      await fetchAddresses();
    } catch (err: any) {
      console.warn("Address API save failed, applying local state:", err);
      // Local fallback
      if (editingAddress) {
        const updated = addresses.map((a) => {
          if (a.id === editingAddress.id) {
            return {
              ...a,
              type,
              recipientName,
              phone,
              street,
              city,
              state,
              pincode,
              isDefault: isDefault ? true : a.isDefault,
            };
          }
          return isDefault ? { ...a, isDefault: false } : a;
        });
        setAddresses(updated);
        localStorage.setItem("deliveryhub_user_addresses", JSON.stringify(updated));
      } else {
        const newAddr: Address = {
          id: `addr-${Date.now()}`,
          type,
          recipientName,
          phone,
          street,
          city,
          state,
          pincode,
          isDefault: isDefault || addresses.length === 0,
        };
        const updated = isDefault
          ? [...addresses.map((a) => ({ ...a, isDefault: false })), newAddr]
          : [...addresses, newAddr];
        setAddresses(updated);
        localStorage.setItem("deliveryhub_user_addresses", JSON.stringify(updated));
      }
    }

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#171717] tracking-tight">
            Saved Addresses
          </h2>
          <p className="text-xs text-[#737373] mt-1">
            Manage and organize your residential and corporate shipping destinations
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-all shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
          </svg>
          <span>Add New Address</span>
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center text-[#737373]">
          <div className="inline-block w-8 h-8 border-2 border-[#171717] border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-xs font-bold text-[#171717]">Loading delivery addresses...</p>
        </div>
      ) : addresses.length === 0 ? (
        <div className="bg-[#FAFAFA] rounded-[24px] p-12 text-center text-[#737373] border border-[#EAEAEA]">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white border border-[#EAEAEA] flex items-center justify-center text-orange-500 shadow-sm">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <p className="font-extrabold text-base text-[#171717]">No saved addresses yet.</p>
          <p className="text-xs text-[#888888] mt-1 max-w-sm mx-auto">
            Add your primary shipping destination for lightning-fast checkout.
          </p>
          <div className="pt-6">
            <button
              onClick={handleOpenAdd}
              className="px-6 py-2.5 rounded-full bg-[#171717] hover:bg-black text-white text-xs font-bold uppercase tracking-wider"
            >
              Add First Address
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className={`rounded-2xl border p-5 sm:p-6 transition-all duration-200 flex flex-col justify-between ${
                addr.isDefault
                  ? "bg-white border-orange-400 shadow-subtle ring-1 ring-orange-400"
                  : "bg-white border-[#EAEAEA] hover:border-gray-300"
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#F3F4F6] text-[#374151]">
                      {addr.type}
                    </span>
                    {addr.isDefault && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-orange-100 text-orange-700">
                        Default
                      </span>
                    )}
                  </div>

                  {!addr.isDefault && (
                    <button
                      onClick={() => handleSetDefault(addr.id)}
                      className="text-[11px] font-bold text-orange-600 hover:underline"
                    >
                      Set as Default
                    </button>
                  )}
                </div>

                <h4 className="font-bold text-sm text-[#171717]">{addr.recipientName}</h4>
                <p className="text-xs text-[#555555] mt-1 leading-relaxed">{addr.street}</p>
                <p className="text-xs text-[#737373] mt-0.5">
                  {addr.city}, {addr.state} - <span className="font-semibold text-[#171717]">{addr.pincode}</span>
                </p>
                <p className="text-xs text-[#555555] mt-2 font-medium">Phone: {addr.phone}</p>
              </div>

              <div className="pt-4 mt-4 border-t border-[#F0F0F0] flex items-center justify-end gap-3">
                <button
                  onClick={() => handleOpenEdit(addr)}
                  className="px-3 py-1.5 rounded-lg border border-[#DCDCDC] text-xs font-semibold text-[#555555] hover:bg-[#F7F7F7] transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(addr.id)}
                  className="px-3 py-1.5 rounded-lg border border-rose-200 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Address Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-[#EAEAEA] animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-[#F0F0F0]">
              <h3 className="text-lg font-bold text-[#171717]">
                {editingAddress ? "Edit Shipping Address" : "Add New Shipping Address"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#F7F7F7] hover:bg-[#EDEDED] flex items-center justify-center text-[#777777]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#444444] mb-1.5">Address Type</label>
                <div className="flex gap-2">
                  {(["Home", "Work", "Other"] as const).map((t) => (
                    <button
                      type="button"
                      key={t}
                      onClick={() => setType(t)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-colors ${
                        type === t
                          ? "bg-[#171717] text-white border-[#171717]"
                          : "bg-white text-[#555555] border-[#DCDCDC] hover:bg-[#F7F7F7]"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#444444] mb-1">
                    Contact Name <span className="text-orange-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="Recipient name"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCDCDC] text-xs font-medium focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#444444] mb-1">
                    Mobile Phone <span className="text-orange-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCDCDC] text-xs font-medium focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#444444] mb-1">
                  Street Address & Flat / House No. <span className="text-orange-500">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  placeholder="e.g. Flat 304, Green Park Heights, Ring Road"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCDCDC] text-xs font-medium focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#444444] mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#DCDCDC] text-xs font-medium outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#444444] mb-1">State</label>
                  <input
                    type="text"
                    required
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#DCDCDC] text-xs font-medium outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#444444] mb-1">Pincode</label>
                  <input
                    type="text"
                    required
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#DCDCDC] text-xs font-medium outline-none"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isDefault}
                    onChange={(e) => setIsDefault(e.target.checked)}
                    className="w-4 h-4 rounded text-orange-500 focus:ring-orange-400"
                  />
                  <span className="text-xs font-medium text-[#444444]">Make this my default shipping address</span>
                </label>
              </div>

              <div className="pt-4 border-t border-[#F0F0F0] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-full border border-[#DCDCDC] text-xs font-bold text-[#555555] hover:bg-[#F7F7F7]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-7 py-2.5 rounded-full bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-sm"
                >
                  Save Address
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddressesView;
