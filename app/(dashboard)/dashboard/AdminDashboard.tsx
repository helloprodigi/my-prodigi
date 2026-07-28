"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { createClient } from "@/utils/supabase/client";

export default function AdminDashboard() {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const fetchUsers = async (page: number = 1) => {
    setIsLoadingUsers(true);
    try {
      const res = await fetch(`/api/admin/users?page=${page}&limit=10`);
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
    fetchUsers(currentPage);
  }, [currentPage]);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUserId(user?.id ?? null);
    });
  }, []);

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
        fetchUsers(currentPage);
      } else {
        toast.error("Gagal update role.");
      }
    } catch (err) {
      console.error(err);
    }
    setUpdatingRole(null);
  };

  return (
    <div className="min-h-screen bg-[#FBFBFB] relative overflow-hidden flex flex-col p-8">
      <div className="w-full z-10">
        <div className="flex items-center justify-between pb-6 w-full">
          <h1 className="text-[22px] sm:text-3xl md:text-4xl font-bold text-[#0A1024]">Dashboard</h1>
        </div>

        <section>
          <h2 className="text-xl font-bold text-[#0A1024] mb-4">Management Akun</h2>

          {isLoadingUsers ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FFC700]"></div>
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
      </div>
    </div>
  );
}
