"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import toast from "react-hot-toast";
import { createClient } from "@/utils/supabase/client";
import AnalyticsDashboard from "@/components/admin/AnalyticsDashboard";

type Tab = "accounts" | "analytics";

// Same double-ring spinner as app/(dashboard)/loading.tsx, the app-wide
// loading animation, sized down for use inside a section instead of full-page.
function LoadingSpinner() {
  return (
    <div className="flex justify-center p-8">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#FFC700] border-r-[#FFC700]/50 animate-spin" />
        <div className="absolute inset-2 rounded-full border-4 border-transparent border-t-[#FFC700]/30 border-l-[#FFC700]/10 animate-spin" />
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("accounts");

  const [users, setUsers] = useState<any[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [activeSearch, setActiveSearch] = useState("");

  const fetchUsers = async (page: number = 1, search: string = "") => {
    setIsLoadingUsers(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "10" });
      if (search) params.set("search", search);
      const res = await fetch(`/api/admin/users?${params.toString()}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
        setCurrentPage(data.currentPage || 1);
        setTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      console.error(err);
    }
    setIsLoadingUsers(false);
  };

  useEffect(() => {
    fetchUsers(currentPage, activeSearch);
  }, [currentPage, activeSearch]);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUserId(user?.id ?? null);
    });
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    setActiveSearch(searchInput.trim());
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    setUpdatingRole(userId);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole }),
      });
      if (res.ok) {
        toast.success("Role berhasil diupdate!");
        fetchUsers(currentPage, activeSearch);
      } else {
        toast.error("Gagal update role.");
      }
    } catch (err) {
      console.error(err);
    }
    setUpdatingRole(null);
  };

  return (
    <div className="min-h-screen bg-[#FBFBFB] relative overflow-hidden flex flex-col p-4 sm:p-6 lg:p-8">
      <div className="w-full z-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 w-full">
          <h1 className="text-[22px] sm:text-3xl md:text-4xl font-bold text-[#0A1024]">Dashboard</h1>

          <div className="flex items-center gap-1 border border-gray-200 rounded-lg p-1 bg-white self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setActiveTab("accounts")}
              className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
                activeTab === "accounts" ? "bg-[#FFC700] text-[#0A1024]" : "text-gray-500 hover:text-gray-800"
              }`}
            >
              Management Akun
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("analytics")}
              className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
                activeTab === "analytics" ? "bg-[#FFC700] text-[#0A1024]" : "text-gray-500 hover:text-gray-800"
              }`}
            >
              Analytics
            </button>
          </div>
        </div>

        {activeTab === "accounts" ? (
          <section key="accounts" className="animate-fade-up">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <h2 className="text-xl font-bold text-[#0A1024]">Management Akun</h2>

              <form onSubmit={handleSearchSubmit} className="w-full sm:w-72">
                <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 focus-within:border-[#FFC700] transition-colors">
                  <Search className="w-4 h-4 text-gray-400 shrink-0" />
                  <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Cari nama atau email..."
                    className="w-full text-sm text-[#0A1024] bg-transparent outline-none"
                  />
                </div>
              </form>
            </div>

            {isLoadingUsers ? (
              <LoadingSpinner />
            ) : users.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-lg p-10 text-center text-sm text-gray-500">
                Tidak ada akun yang cocok dengan pencarian &quot;{activeSearch}&quot;.
              </div>
            ) : (
              <div className="bg-white rounded-xl overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="py-4 px-4 font-semibold text-gray-600">Nama</th>
                      <th className="py-4 px-4 font-semibold text-gray-600">Email</th>
                      <th className="py-4 px-4 font-semibold text-gray-600">Role Saat Ini</th>
                      <th className="py-4 px-4 font-semibold text-gray-600">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u: any) => (
                      <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-4 text-gray-900">{u.name || "-"}</td>
                        <td className="py-4 px-4 text-gray-600 text-sm">{u.email}</td>
                        <td className="py-4 px-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              u.role === "admin"
                                ? "bg-red-100 text-red-700"
                                : u.role === "asisten_lab"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {u.role === "asisten_lab" ? "Asisten Lab" : u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <select
                              className="min-w-[220px] px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-700 shadow-sm transition-all duration-200 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FFC700]/30 focus:border-[#FFC700] disabled:bg-gray-50 disabled:text-gray-500 disabled:border-gray-200 disabled:cursor-not-allowed"
                              value={u.role}
                              onChange={(event) => handleUpdateRole(u.id, event.target.value)}
                              disabled={updatingRole === u.id || u.id === currentUserId}
                            >
                              <option value="talent">Talent</option>
                              <option value="asisten_lab">Asisten Laboratorium</option>
                              <option value="admin">Admin</option>
                            </select>

                            {updatingRole === u.id && (
                              <div
                                className="animate-spin h-5 w-5 rounded-full border-2 border-gray-200 border-t-[#FFC700]"
                                role="status"
                                aria-label="Memperbarui role pengguna"
                              />
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {!isLoadingUsers && totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-8">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage <= 1}
                  className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-sm font-medium text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage >= totalPages}
                  className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </section>
        ) : (
          <div key="analytics" className="animate-fade-up">
            <AnalyticsDashboard />
          </div>
        )}
      </div>
    </div>
  );
}
