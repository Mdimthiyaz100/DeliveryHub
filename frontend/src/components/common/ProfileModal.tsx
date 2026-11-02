import { useState } from "react";
import api from "../../../api/api";

interface ProfileModalProps {
  onClose: () => void;
  onUpdateSuccess: (name: string, email: string) => void;
}

export default function ProfileModal({ onClose, onUpdateSuccess }: ProfileModalProps) {
  const [name, setName] = useState(localStorage.getItem("userName") || "");
  const [email, setEmail] = useState(localStorage.getItem("userEmail") || "");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const role = (localStorage.getItem("role") || "").toLowerCase();
  const isSuperAdmin = role === "super_admin";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const res = await api.put("/users/profile", {
        name,
        email,
        password: password ? password : undefined
      });

      if (res.data && res.data.user) {
        localStorage.setItem("userName", res.data.user.name);
        localStorage.setItem("userEmail", res.data.user.email);
        onUpdateSuccess(res.data.user.name, res.data.user.email);
      }

      setMessage("Profile settings updated successfully!");
      setPassword("");
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update profile settings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-[#1A1C1E] border border-[#2C2E33] rounded-[22px] shadow-2xl w-full max-w-md p-6 relative text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#2C2E33] mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center font-bold text-base shadow-sm">
              {name ? name[0].toUpperCase() : "A"}
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">Profile & Account Settings</h3>
              <p className="text-xs text-gray-400">
                {isSuperAdmin ? "Super Admin Account" : "Admin Account"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#0F1012] border border-[#2C2E33] text-gray-400 hover:text-white flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Notifications */}
        {message && (
          <div className="p-3 mb-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium flex items-center gap-2">
            <span>✓</span>
            <span>{message}</span>
          </div>
        )}
        {error && (
          <div className="p-3 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Edit Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
              Display Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0F1012] border border-[#2C2E33] text-white text-xs placeholder-gray-500 focus:outline-none focus:border-orange-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0F1012] border border-[#2C2E33] text-white text-xs placeholder-gray-500 focus:outline-none focus:border-orange-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
              New Password (Optional)
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Leave blank to keep current password"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0F1012] border border-[#2C2E33] text-white text-xs placeholder-gray-500 focus:outline-none focus:border-orange-500 transition-colors"
            />
            <p className="text-[10px] text-gray-500 mt-1">
              Only enter a new password if you wish to change it.
            </p>
          </div>

          <div className="p-3 bg-[#0F1012] border border-[#2C2E33] rounded-xl text-[11px] text-gray-400">
            <span className="font-bold text-white block mb-0.5">Role Permission:</span>
            <span className="capitalize">{isSuperAdmin ? "Super Administrator (Full System Governance)" : "Administrator"}</span>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-[#2C2E33]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white rounded-xl bg-[#0F1012] border border-[#2C2E33]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-bold uppercase tracking-wider text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-500 rounded-xl shadow-glow-sm disabled:opacity-50 transition-all"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
