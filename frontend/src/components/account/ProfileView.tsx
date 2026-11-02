import React, { useState } from "react";
import api from "../../../api/api";

interface ProfileViewProps {
  user: any;
  onProfileUpdated: (updatedUser: any) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ user, onProfileUpdated }) => {
  const [name, setName] = useState(user?.name || localStorage.getItem("userName") || "");
  const [email, setEmail] = useState(user?.email || localStorage.getItem("userEmail") || "");
  const [phone, setPhone] = useState(user?.phone || localStorage.getItem("userPhone") || "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setMessage({ type: "error", text: "Please enter your full name." });
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setMessage({ type: "error", text: "Please enter a valid email address." });
      return;
    }

    try {
      setSaving(true);
      setMessage(null);
      const res = await api.put("/users/profile", {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
      });

      const updated = res.data?.user || { name, email, phone };
      localStorage.setItem("userName", updated.name);
      localStorage.setItem("userEmail", updated.email);
      if (phone) localStorage.setItem("userPhone", phone);

      onProfileUpdated(updated);
      setMessage({ type: "success", text: "Profile information updated successfully!" });
    } catch (err: any) {
      const errText = err.response?.data?.message || err.response?.data?.error || "Failed to update profile.";
      setMessage({ type: "error", text: errText });
    } finally {
      setSaving(false);
    }
  };

  const role = (user?.role || localStorage.getItem("role") || "Customer").toUpperCase();
  const avatarInitials = (name || "Customer")
    .split(" ")
    .map((w: string) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#171717] tracking-tight">
          Personal Profile
        </h2>
        <p className="text-xs text-[#737373] mt-1">
          Review and update your personal contact details and DeliveryHub account preferences.
        </p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-2xl text-xs font-semibold flex items-center gap-3 border ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          {message.type === "success" ? (
            <svg className="w-5 h-5 text-emerald-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-rose-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Profile Overview Card */}
      <div className="bg-[#FAFAFA] border border-[#EAEAEA] rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-5">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-[#171717] text-white flex items-center justify-center text-xl font-bold border-4 border-white shadow-sm overflow-hidden">
            {user?.picture ? (
              <img src={user.picture} alt={name} className="w-full h-full object-cover" />
            ) : (
              <span>{avatarInitials || "DH"}</span>
            )}
          </div>
          <div className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center" title="Active Account">
            <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
          </div>
        </div>

        <div className="flex-1 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <h3 className="text-lg font-bold text-[#171717]">{name || "Valued Customer"}</h3>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-orange-100 text-orange-700">
              {role === "SUPER_ADMIN" ? "Super Admin" : role === "ADMIN" ? "Administrator" : "Verified Customer"}
            </span>
          </div>
          <p className="text-xs text-[#737373] mt-0.5">{email || "customer@deliveryhub.com"}</p>
          <div className="flex items-center justify-center sm:justify-start gap-4 text-[11px] text-[#888888] mt-2">
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Email Verified
            </span>
            <span>•</span>
            <span>Member since 2026</span>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      <form onSubmit={handleSubmit} className="bg-white border border-[#EAEAEA] rounded-2xl p-6 sm:p-8 space-y-5">
        <h4 className="text-sm font-bold text-[#171717] uppercase tracking-wider">Account Information</h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#444444]">
              Full Name <span className="text-orange-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rahul Sharma"
              className="w-full px-4 py-2.5 rounded-xl border border-[#DCDCDC] text-xs font-medium text-[#171717] focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#444444]">
              Email Address <span className="text-orange-500">*</span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. rahul@example.com"
              className="w-full px-4 py-2.5 rounded-xl border border-[#DCDCDC] text-xs font-medium text-[#171717] focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#444444]">
              Mobile Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full px-4 py-2.5 rounded-xl border border-[#DCDCDC] text-xs font-medium text-[#171717] focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
            />
            <p className="text-[11px] text-[#888888]">Used for real-time delivery SMS updates.</p>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#444444]">
              Account Role
            </label>
            <input
              type="text"
              disabled
              value={role}
              className="w-full px-4 py-2.5 rounded-xl border border-[#EAEAEA] bg-[#F7F7F7] text-xs font-medium text-[#777777] cursor-not-allowed"
            />
            <p className="text-[11px] text-[#888888]">Managed via security permissions.</p>
          </div>
        </div>

        <div className="pt-4 border-t border-[#F0F0F0] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => {
              setName(user?.name || localStorage.getItem("userName") || "");
              setEmail(user?.email || localStorage.getItem("userEmail") || "");
              setPhone(user?.phone || localStorage.getItem("userPhone") || "");
            }}
            className="px-5 py-2.5 rounded-full border border-[#DCDCDC] text-xs font-bold text-[#555555] hover:bg-[#F7F7F7] transition-colors"
          >
            Reset
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-7 py-2.5 rounded-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white text-xs font-bold shadow-sm transition-all"
          >
            {saving ? "Saving Changes..." : "Save Profile"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfileView;

