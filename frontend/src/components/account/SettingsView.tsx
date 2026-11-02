import React, { useState } from "react";
import api from "../../../api/api";

interface SettingsViewProps {
  onLogout: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onLogout }) => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Notification Preferences
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);

  // Delete modal
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setPasswordMsg({ type: "error", text: "New password must be at least 6 characters long." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: "error", text: "New passwords do not match." });
      return;
    }

    try {
      setSavingPassword(true);
      setPasswordMsg(null);
      const name = localStorage.getItem("userName") || "Customer";
      const email = localStorage.getItem("userEmail") || "";

      await api.put("/users/profile", {
        name,
        email,
        password: newPassword,
      });

      setPasswordMsg({ type: "success", text: "Password updated successfully!" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPasswordMsg({
        type: "error",
        text: err.response?.data?.message || "Failed to update password.",
      });
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#171717] tracking-tight">
          Account Settings
        </h2>
        <p className="text-xs text-[#737373] mt-1">
          Configure security credentials, notification preferences and session access
        </p>
      </div>

      {/* Security: Change Password Form */}
      <form onSubmit={handlePasswordChange} className="bg-white border border-[#EAEAEA] rounded-2xl p-6 sm:p-7 space-y-4">
        <h3 className="text-sm font-bold text-[#171717] uppercase tracking-wider">
          Security & Password
        </h3>

        {passwordMsg && (
          <div
            className={`p-3.5 rounded-xl text-xs font-semibold ${
              passwordMsg.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-rose-50 text-rose-800 border border-rose-200"
            }`}
          >
            {passwordMsg.text}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#444444] mb-1">New Password</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCDCDC] text-xs font-medium focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#444444] mb-1">Confirm New Password</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCDCDC] text-xs font-medium focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none"
            />
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={savingPassword}
            className="px-6 py-2.5 rounded-full bg-[#171717] hover:bg-black text-white text-xs font-bold transition-all shadow-sm disabled:opacity-60"
          >
            {savingPassword ? "Updating Password..." : "Update Password"}
          </button>
        </div>
      </form>

      {/* Notification Preferences */}
      <div className="bg-white border border-[#EAEAEA] rounded-2xl p-6 sm:p-7 space-y-4">
        <h3 className="text-sm font-bold text-[#171717] uppercase tracking-wider">
          Notification Preferences
        </h3>

        <div className="space-y-3 divide-y divide-[#F0F0F0]">
          <div className="pt-2 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-[#171717]">Order & Shipment Updates</p>
              <p className="text-[11px] text-[#737373]">Receive emails whenever your delivery status updates</p>
            </div>
            <input
              type="checkbox"
              checked={emailAlerts}
              onChange={(e) => setEmailAlerts(e.target.checked)}
              className="w-4 h-4 rounded text-orange-500 focus:ring-orange-400"
            />
          </div>

          <div className="pt-3 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-[#171717]">SMS Dispatch Alerts</p>
              <p className="text-[11px] text-[#737373]">Receive text messages for real-time delivery boy assignments</p>
            </div>
            <input
              type="checkbox"
              checked={smsAlerts}
              onChange={(e) => setSmsAlerts(e.target.checked)}
              className="w-4 h-4 rounded text-orange-500 focus:ring-orange-400"
            />
          </div>

          <div className="pt-3 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-[#171717]">Promotions & Curated Drops</p>
              <p className="text-[11px] text-[#737373]">Exclusive weekend offers and new collection launch announcements</p>
            </div>
            <input
              type="checkbox"
              checked={marketingEmails}
              onChange={(e) => setMarketingEmails(e.target.checked)}
              className="w-4 h-4 rounded text-orange-500 focus:ring-orange-400"
            />
          </div>
        </div>
      </div>

      {/* Danger Zone / Logout */}
      <div className="bg-rose-50/50 border border-rose-200/60 rounded-2xl p-6 sm:p-7 space-y-4">
        <h3 className="text-sm font-bold text-rose-800 uppercase tracking-wider">
          Session & Account Actions
        </h3>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-[#171717]">Sign out of this session</p>
            <p className="text-[11px] text-[#737373]">
              Safely terminate your authenticated browsing session on this browser.
            </p>
          </div>
          <button
            onClick={onLogout}
            className="px-5 py-2.5 rounded-full border border-rose-300 text-rose-700 hover:bg-rose-100 text-xs font-bold transition-colors self-start sm:self-auto"
          >
            Sign Out Now
          </button>
        </div>

        <div className="pt-3 border-t border-rose-200/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-rose-700">Deactivate Account</p>
            <p className="text-[11px] text-[#737373]">
              Permanently close your DeliveryHub account and erase saved preferences.
            </p>
          </div>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="px-5 py-2.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors self-start sm:self-auto"
          >
            Deactivate
          </button>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 text-center space-y-4 border border-[#EAEAEA] shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h4 className="font-bold text-base text-[#171717]">Confirm Account Deactivation</h4>
            <p className="text-xs text-[#737373]">
              Are you sure? Once deactivated, you will lose access to order history and saved addresses.
            </p>
            <div className="flex gap-3 justify-center pt-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-5 py-2 rounded-full border border-[#DCDCDC] text-xs font-bold text-[#555555]"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  onLogout();
                }}
                className="px-5 py-2 rounded-full bg-rose-600 text-white text-xs font-bold"
              >
                Yes, Deactivate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsView;

