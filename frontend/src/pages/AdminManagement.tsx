import { useState, useEffect, FormEvent } from "react";
import api from "../../api/api";

interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: "super_admin" | "admin" | "user";
  google_id: string | null;
  picture: string | null;
  status: "active" | "inactive";
  created_at: string;
  last_login: string | null;
}

interface Invitation {
  id: number;
  email: string;
  name: string | null;
  status: "pending" | "accepted" | "revoked";
  created_at: string;
  inviter_name?: string;
  inviter_email?: string;
}

export default function AdminManagement() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [counts, setCounts] = useState({
    totalAdmins: 0,
    activeAdmins: 0,
    inactiveAdmins: 0,
    superAdminCount: 0,
  });

  // Modal States
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Remove Admin Modal State
  const [adminToDelete, setAdminToDelete] = useState<AdminUser | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      setErrorMessage("");
      const res = await api.get("/admin/overview");
      setAdmins(res.data.admins || []);
      setInvitations(res.data.invitations || []);
      setCounts({
        totalAdmins: res.data.totalAdmins || 0,
        activeAdmins: res.data.activeAdmins || 0,
        inactiveAdmins: res.data.inactiveAdmins || 0,
        superAdminCount: res.data.superAdminCount || 0,
      });
    } catch (err: any) {
      console.error("Failed to load admin management overview:", err);
      if (err.response?.status === 403) {
        setErrorMessage("Access Denied: You do not have Super Admin privileges to access Admin Management.");
      } else {
        setErrorMessage(err.response?.data?.message || "Failed to load administrator records");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const handleCreateInvite = async (e: FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) {
      setModalError("Please enter an email address.");
      return;
    }
    setModalLoading(true);
    setModalError("");
    try {
      const res = await api.post("/admin/invite", {
        email: inviteEmail,
        name: inviteName,
      });
      setIsInviteModalOpen(false);
      setInviteEmail("");
      setInviteName("");
      setActionMessage(res.data.message || "Administrator account invitation successfully created!");
      setTimeout(() => setActionMessage(""), 6000);
      fetchOverview();
    } catch (err: any) {
      setModalError(err.response?.data?.message || "Failed to create administrator");
    } finally {
      setModalLoading(false);
    }
  };

  const handleToggleStatus = async (user: AdminUser) => {
    const nextStatus = user.status === "active" ? "inactive" : "active";
    const confirmPrompt =
      nextStatus === "inactive"
        ? `Are you sure you want to deactivate ${user.name} (${user.email})? They will immediately lose admin access.`
        : `Activate ${user.name} (${user.email})?`;

    if (!window.confirm(confirmPrompt)) return;

    try {
      const res = await api.patch(`/admin/status/${user.id}`, { status: nextStatus });
      setActionMessage(res.data.message);
      setTimeout(() => setActionMessage(""), 5000);
      fetchOverview();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to update status");
    }
  };

  const confirmRemoveAdmin = async () => {
    if (!adminToDelete) return;
    setDeleteLoading(true);
    try {
      const res = await api.delete(`/admin/${adminToDelete.id}`);
      setActionMessage(res.data.message);
      setTimeout(() => setActionMessage(""), 6000);
      setAdminToDelete(null);
      fetchOverview();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to remove administrator");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleRevokeInvitation = async (id: number, email: string) => {
    if (!window.confirm(`Revoke pending invitation for ${email}?`)) return;
    try {
      await api.delete(`/admin/invitation/${id}`);
      setActionMessage(`Invitation for ${email} revoked.`);
      setTimeout(() => setActionMessage(""), 5000);
      fetchOverview();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to revoke invitation");
    }
  };

  const filteredAdmins = admins.filter(
    (a) =>
      a.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(a.id).includes(searchTerm)
  );

  return (
    <div className="space-y-6 text-white">
      {/* Top Banner / Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#303236]">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#FF6B00] mb-1">
            <span className="w-2 h-2 rounded-full bg-[#FF6B00] shadow-glow-sm"></span>
            Security & Governance • Internal Access
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            Admin Management
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FF6B00]/10 text-[#FF6B00] border border-[#FF6B00]/20">
              Super Admin Only
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-[#A5A5A5] mt-0.5">
            Manage authenticated platform administrators and monitor pending Google Identity invitations.
          </p>
        </div>

        <button
          onClick={() => {
            setIsInviteModalOpen(true);
            setModalError("");
          }}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#FF6B00] to-[#FF8A24] hover:from-[#FF8A24] hover:to-[#FF6B00] text-white text-xs font-bold uppercase tracking-wider shadow-glow-sm transition-all flex items-center justify-center gap-2 self-start sm:self-auto"
        >
          <span>+</span>
          <span>Invite Administrator</span>
        </button>
      </div>

      {/* Success Notification */}
      {actionMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2 font-medium">
            <span>✓</span>
            <span>{actionMessage}</span>
          </div>
          <button onClick={() => setActionMessage("")} className="text-emerald-400 hover:text-white text-xs font-bold">
            Dismiss
          </button>
        </div>
      )}

      {/* Error Notification */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center justify-between">
          <span className="font-medium">⚠️ {errorMessage}</span>
          <button onClick={() => setErrorMessage("")} className="text-rose-400 hover:text-white text-xs font-bold">
            Dismiss
          </button>
        </div>
      )}

      {/* Dashboard Statistics Cards matching dark branding */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#202225] rounded-2xl p-5 border border-[#303236] shadow-card flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-[#A5A5A5] uppercase tracking-wider">Total Administrators</p>
            <p className="text-3xl font-black text-white mt-1">{counts.totalAdmins}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#191A1C] border border-[#303236] flex items-center justify-center text-[#FF6B00] font-bold">
            🛡️
          </div>
        </div>

        <div className="bg-[#202225] rounded-2xl p-5 border border-emerald-500/20 shadow-card flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Active Administrators</p>
            <p className="text-3xl font-black text-emerald-400 mt-1">{counts.activeAdmins}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">
            🟢
          </div>
        </div>

        <div className="bg-[#202225] rounded-2xl p-5 border border-[#303236] shadow-card flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-[#A5A5A5] uppercase tracking-wider">Super Admins</p>
            <p className="text-3xl font-black text-[#FF8A24] mt-1">{counts.superAdminCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-[#FF6B00] font-bold">
            👑
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-[#1A1C1E] p-4 rounded-2xl border border-[#2C2E33] flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Search admins by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3.5 py-2.5 pl-9 rounded-xl bg-[#0F1012] border border-[#2C2E33] text-white text-xs placeholder-[#6B7280] focus:outline-none focus:border-[#FF6B00]"
          />
          <span className="absolute left-3 top-3 text-[#6B7280] text-xs">🔍</span>
        </div>
        <div className="text-xs text-gray-400">
          Total: <strong className="text-white">{filteredAdmins.length}</strong>
        </div>
      </div>

      {/* Table: Active & Authorized Administrators */}
      <div className="bg-[#1A1C1E] rounded-[22px] border border-[#2C2E33] shadow-card overflow-hidden">
        <div className="p-4 bg-[#141619] border-b border-[#2C2E33] flex justify-between items-center">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Active & Authorized Administrators
          </h3>
          <span className="text-xs text-gray-400">{filteredAdmins.length} total</span>
        </div>

        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-left">
            <thead className="bg-[#0F1012] text-[11px] font-bold uppercase tracking-wider text-gray-400 border-b border-[#2C2E33]">
              <tr>
                <th className="px-5 py-3.5">ID</th>
                <th className="px-5 py-3.5">Administrator</th>
                <th className="px-5 py-3.5">Role</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Account Type</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2C2E33]/50 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                    <div className="inline-block w-6 h-6 border-2 border-[#FF6B00] border-t-transparent rounded-full animate-spin mb-2"></div>
                    <p>Loading administrators from database...</p>
                  </td>
                </tr>
              ) : filteredAdmins.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                    No administrators found matching the search.
                  </td>
                </tr>
              ) : (
                filteredAdmins.map((user) => {
                  const isSuper = user.role === "super_admin";
                  return (
                    <tr key={user.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-4 font-mono font-bold text-[#FF8A24]">
                        #{String(user.id).padStart(3, "0")}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF6B00] to-[#FF8A24] text-white flex items-center justify-center font-bold text-xs">
                            {user.name ? user.name[0].toUpperCase() : "A"}
                          </div>
                          <div>
                            <span className="font-bold text-white block">{user.name}</span>
                            <span className="text-[11px] text-gray-400">{user.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            isSuper
                              ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                              : "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                          }`}
                        >
                          {isSuper ? "Super Admin" : "Admin"}
                        </span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            user.status === "active"
                              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                              : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                          }`}
                        >
                          ● {user.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-gray-300 text-xs">
                        {user.google_id ? (
                          <span className="inline-flex items-center gap-1.5 text-blue-400">
                            <span>Google SSO</span>
                          </span>
                        ) : (
                          <span className="text-gray-400">Password / Internal</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        {!isSuper && (
                          <div className="inline-flex items-center gap-2">
                            <button
                              onClick={() => handleToggleStatus(user)}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#0F1012] border border-[#2C2E33] hover:border-gray-500 text-gray-300 hover:text-white transition-all"
                            >
                              {user.status === "active" ? "Deactivate" : "Activate"}
                            </button>
                            <button
                              onClick={() => setAdminToDelete(user)}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold text-rose-400 hover:text-white hover:bg-rose-500/20 border border-rose-500/20 transition-all"
                            >
                              Remove
                            </button>
                          </div>
                        )}
                        {isSuper && (
                          <span className="text-[11px] text-gray-500 font-medium">Protected Account</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Table: Admin Invitations */}
      <div className="bg-[#1A1C1E] rounded-[22px] border border-[#2C2E33] shadow-card overflow-hidden">
        <div className="p-4 bg-[#141619] border-b border-[#2C2E33] flex justify-between items-center">
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Admin Google Invitations
            </h3>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Users invited to gain Administrator privileges when signing in with their Google account.
            </p>
          </div>
          <span className="text-xs text-gray-400">{invitations.length} recorded</span>
        </div>

        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-left">
            <thead className="bg-[#0F1012] text-[11px] font-bold uppercase tracking-wider text-gray-400 border-b border-[#2C2E33]">
              <tr>
                <th className="px-5 py-3.5">Email</th>
                <th className="px-5 py-3.5">Assigned Name</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Invited At</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2C2E33]/50 text-xs">
              {invitations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                    No administrator invitations registered yet.
                  </td>
                </tr>
              ) : (
                invitations.map((inv) => (
                  <tr key={inv.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-4 font-semibold text-white">{inv.email}</td>
                    <td className="px-5 py-4 text-gray-300">{inv.name || "—"}</td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          inv.status === "accepted"
                            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                            : inv.status === "revoked"
                            ? "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                            : "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-400">
                      {new Date(inv.created_at).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-5 py-4 text-right">
                      {inv.status === "pending" && (
                        <button
                          onClick={() => handleRevokeInvitation(inv.id, inv.email)}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold text-rose-400 hover:text-white hover:bg-rose-500/20 border border-rose-500/20 transition-all"
                        >
                          Revoke
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Invite New Admin */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#191A1C] border border-[#303236] rounded-2xl shadow-card w-full max-w-md p-6 relative">
            <div className="flex justify-between items-center pb-4 border-b border-[#303236] mb-5">
              <div>
                <span className="text-[10px] font-bold text-[#FF6B00] uppercase tracking-wider">Super Admin Console</span>
                <h3 className="text-lg font-extrabold text-white">Add Administrator</h3>
              </div>
              <button
                onClick={() => setIsInviteModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-[#202225] text-gray-400 hover:text-white flex items-center justify-center border border-[#303236]"
              >
                ✕
              </button>
            </div>

            {modalError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                {modalError}
              </div>
            )}

            <form onSubmit={handleCreateInvite} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="admin.colleague@domain.com"
                  className="w-full px-4 py-2.5 bg-[#0F1012] border border-[#303236] rounded-xl text-white text-xs focus:outline-none focus:border-[#FF6B00]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                  Full Name (Optional)
                </label>
                <input
                  type="text"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="e.g. Alex Hunter"
                  className="w-full px-4 py-2.5 bg-[#0F1012] border border-[#303236] rounded-xl text-white text-xs focus:outline-none focus:border-[#FF6B00]"
                />
              </div>

              <div className="p-3 bg-[#0F1012] border border-[#303236] rounded-xl text-xs text-gray-400">
                💡 When this user signs in with their Google account or registers, they will automatically receive Administrator rights.
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#303236]">
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white rounded-xl bg-[#202225] border border-[#303236]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-5 py-2 text-xs font-bold uppercase tracking-wider text-white bg-gradient-to-r from-[#FF6B00] to-[#FF8A24] rounded-xl shadow-glow-sm disabled:opacity-50"
                >
                  {modalLoading ? "Creating..." : "Confirm & Authorize"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirm Remove Admin */}
      {adminToDelete && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#191A1C] border border-[#303236] rounded-2xl shadow-card w-full max-w-md p-6 relative">
            <h3 className="text-lg font-extrabold text-white mb-2">Remove Administrator</h3>
            <p className="text-xs text-gray-300 leading-relaxed mb-6">
              Are you sure you want to remove administrator privileges for <strong className="text-white">{adminToDelete.name}</strong> ({adminToDelete.email})? Their account will be converted to a regular customer account and will no longer have access to this portal.
            </p>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setAdminToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white rounded-xl bg-[#202225] border border-[#303236]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmRemoveAdmin}
                disabled={deleteLoading}
                className="px-5 py-2 text-xs font-bold uppercase tracking-wider text-white bg-rose-600 hover:bg-rose-500 rounded-xl disabled:opacity-50"
              >
                {deleteLoading ? "Removing..." : "Confirm Removal"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
