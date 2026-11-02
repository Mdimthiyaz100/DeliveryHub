import { useState, useEffect } from "react";
import api from "../../api/api";

function getInitials(name: string) {
  if (!name) return "US";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function Users() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");

  const fetchUsers = () => {
    setLoading(true);
    api
      .get("/users")
      .then((res) => {
        setUsers(res.data || []);
      })
      .catch((err) => {
        console.error("Error fetching users:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      (u.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(u.id).includes(searchQuery);

    const matchesRole =
      roleFilter === "All" ||
      (roleFilter === "admin" && ((u.role || "").toLowerCase() === "admin" || (u.role || "").toLowerCase() === "super_admin")) ||
      (roleFilter === "user" && (u.role || "").toLowerCase() === "user");

    return matchesSearch && matchesRole;
  });

  const totalUsers = users.length;
  const adminCount = users.filter((u) => {
    const r = (u.role || "").toLowerCase();
    return r === "admin" || r === "super_admin";
  }).length;
  const customerCount = totalUsers - adminCount;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#303236]">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#FF6B00] mb-1">
            <span className="w-2 h-2 rounded-full bg-[#FF6B00] shadow-glow-sm"></span>
            User & Customer Directory
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Accounts & Membership
          </h2>
          <p className="text-xs sm:text-sm text-[#A5A5A5] mt-0.5">
            Audit customer engagement, electronics order frequencies, and administrative role assignments.
          </p>
        </div>
        <button
          onClick={fetchUsers}
          className="px-4 py-2.5 bg-[#202225] hover:bg-[#282a2e] text-white border border-[#303236] text-xs font-bold uppercase tracking-wider rounded-xl transition-colors flex items-center gap-2 self-start sm:self-auto"
        >
          <span>🔄</span>
          <span>Sync Directory</span>
        </button>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#202225] rounded-2xl p-5 border border-[#303236] shadow-card flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-[#A5A5A5] uppercase tracking-wider">Total Registered</p>
            <p className="text-3xl font-black text-white mt-1">{totalUsers}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#191A1C] border border-[#303236] flex items-center justify-center text-xl text-[#FF6B00]">
            👥
          </div>
        </div>

        <div className="bg-[#202225] rounded-2xl p-5 border border-[#303236] shadow-card flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-[#A5A5A5] uppercase tracking-wider">Active Customers</p>
            <p className="text-3xl font-black text-emerald-400 mt-1">{customerCount}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#191A1C] border border-[#303236] flex items-center justify-center text-xl text-emerald-400">
            🛍️
          </div>
        </div>

        <div className="bg-[#202225] rounded-2xl p-5 border border-[#303236] shadow-card flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-[#A5A5A5] uppercase tracking-wider">System Admins</p>
            <p className="text-3xl font-black text-[#FF6B00] mt-1">{adminCount}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#191A1C] border border-[#303236] flex items-center justify-center text-xl text-[#FF6B00]">
            🛡️
          </div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-[#202225] rounded-2xl border border-[#303236] p-4 flex flex-col sm:flex-row gap-3 items-center justify-between shadow-card">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Search by name, email or customer ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#191A1C] border border-[#303236] rounded-xl text-xs text-white placeholder-[#A5A5A5] focus:outline-none focus:border-[#FF6B00]"
          />
          <span className="absolute left-3 top-2 text-[#A5A5A5] text-xs">🔍</span>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          {["All", "user", "admin"].map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                roleFilter === r
                  ? "bg-[#FF6B00] text-white shadow-glow-sm"
                  : "bg-[#191A1C] text-[#A5A5A5] hover:text-white border border-[#303236]"
              }`}
            >
              {r === "All" ? "All Users" : r === "user" ? "Customers" : "Admins"}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-[#202225] rounded-2xl border border-[#303236] shadow-card overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-left">
            <thead className="bg-[#141517] text-[11px] font-bold uppercase tracking-wider text-[#A5A5A5] border-b border-[#303236]">
              <tr>
                <th className="px-5 py-3.5">User ID</th>
                <th className="px-5 py-3.5">Full Name</th>
                <th className="px-5 py-3.5">Email Address</th>
                <th className="px-5 py-3.5">Role</th>
                <th className="px-5 py-3.5 text-center">Orders Placed</th>
                <th className="px-5 py-3.5">Date Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#303236]/50 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-[#A5A5A5]">
                    <div className="inline-block w-6 h-6 border-2 border-[#FF6B00] border-t-transparent rounded-full animate-spin mb-2"></div>
                    <p>Loading directory...</p>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-[#A5A5A5]">
                    No accounts found matching search filters.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const roleStr = (u.role || "").toLowerCase();
                  const isSuperAdmin = roleStr === "super_admin";
                  const isAdmin = roleStr === "admin" || isSuperAdmin;
                  const initials = getInitials(u.name);

                  return (
                    <tr key={u.id} className="hover:bg-[#191A1C]/60 transition-colors">
                      <td className="px-5 py-4 font-bold text-[#FF6B00] whitespace-nowrap">
                        #{String(u.id).padStart(3, "0")}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-white shadow-sm flex-shrink-0 ${
                              isSuperAdmin
                                ? "bg-amber-600"
                                : isAdmin
                                ? "bg-gradient-to-br from-[#FF6B00] to-[#FF8A24]"
                                : "bg-[#303236]"
                            }`}
                          >
                            {initials}
                          </div>
                          <span className="font-semibold text-white">{u.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-[#A5A5A5]">{u.email}</td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                            isSuperAdmin
                              ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                              : isAdmin
                              ? "bg-[#FF6B00]/10 text-[#FF6B00] border-[#FF6B00]/20"
                              : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          }`}
                        >
                          {isSuperAdmin ? "Super Admin" : isAdmin ? "Admin" : "Customer"}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center whitespace-nowrap">
                        <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#191A1C] text-white border border-[#303236]">
                          {u.total_orders || 0} order(s)
                        </span>
                      </td>
                      <td className="px-5 py-4 text-[#A5A5A5] whitespace-nowrap">
                        {u.created_at
                          ? new Date(u.created_at).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : "Recently"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Users;
