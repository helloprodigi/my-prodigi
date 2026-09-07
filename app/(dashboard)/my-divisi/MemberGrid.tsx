"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, MoreHorizontal, Unlock, User as UserIcon } from "lucide-react";
import toast from "react-hot-toast";

export type Member = {
  id: string;
  name: string;
  nim: string | null;
  nomorWa: string | null;
  photoUrl: string | null;
  label: string;
  hasProkerAccess: boolean;
  isPic: boolean;
};

type PendingAction = { member: Member; type: "grant" | "revoke" };

function MemberCard({
  member,
  canManageAccess,
  openMenuId,
  setOpenMenuId,
  onRequestAction,
}: {
  member: Member;
  canManageAccess: boolean;
  openMenuId: string | null;
  setOpenMenuId: (id: string | null) => void;
  onRequestAction: (action: PendingAction) => void;
}) {
  const showMenu = canManageAccess && !member.isPic;
  const isMenuOpen = openMenuId === member.id;

  return (
    <div
      className={`relative rounded-2xl p-5 border border-[#D9D9D9] ${
        member.isPic ? "bg-[#FFF9E6]" : "bg-white"
      }`}
    >
      {showMenu && (
        <div className="absolute top-4 right-4">
          <button
            onClick={() => setOpenMenuId(isMenuOpen ? null : member.id)}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
            aria-label="Opsi anggota"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 top-9 z-20 w-44 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden py-1">
              {member.hasProkerAccess ? (
                <button
                  onClick={() => {
                    setOpenMenuId(null);
                    onRequestAction({ member, type: "revoke" });
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm text-[#0A1024] hover:bg-gray-50 flex items-center gap-2 font-medium transition-colors"
                >
                  <Lock className="w-4 h-4" />
                  Cabut Akses
                </button>
              ) : (
                <button
                  onClick={() => {
                    setOpenMenuId(null);
                    onRequestAction({ member, type: "grant" });
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm text-[#0A1024] hover:bg-gray-50 flex items-center gap-2 font-medium transition-colors"
                >
                  <Unlock className="w-4 h-4" />
                  Beri Akses
                </button>
              )}
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 shrink-0 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center">
          {member.photoUrl ? (
            <img src={member.photoUrl} alt={member.name} className="w-full h-full object-cover" />
          ) : (
            <UserIcon className="w-6 h-6 text-gray-400" />
          )}
        </div>
        <div className="min-w-0 pr-8">
          <p className="font-bold text-[#0A1024] truncate">{member.name}</p>
          <span
            className={`inline-block text-xs font-medium px-2.5 py-1 rounded-md mt-1 ${
              member.isPic ? "bg-[#FFF3CC] text-[#FFC917]" : "bg-gray-100 text-gray-600"
            }`}
          >
            {member.label}
          </span>
        </div>
      </div>

      <div className="border-t border-[#D9D9D9] pt-3 space-y-1.5">
        <p className="text-sm text-gray-500">
          NIM: <span className={member.isPic ? "font-semibold text-[#0A1024]" : ""}>{member.nim || "-"}</span>
        </p>
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm text-gray-500">
            No HP: <span className={member.isPic ? "font-semibold text-[#0A1024]" : ""}>{member.nomorWa || "-"}</span>
          </p>
          {!member.isPic && member.hasProkerAccess && (
            <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-[#FFF3CC] text-black whitespace-nowrap">
              Akses Diberikan
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function ConfirmAccessModal({ action, onClose }: { action: PendingAction; onClose: () => void }) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const isGrant = action.type === "grant";

  const handleConfirm = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/user/${action.member.id}/akses`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hasProkerAccess: isGrant }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Gagal menyimpan perubahan");
      }
      router.refresh();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan perubahan");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="w-full max-w-md bg-white rounded-2xl p-8 text-center">
        <h2 className="text-2xl font-bold text-[#0A1024] mb-4">Information!</h2>
        <p className="text-gray-500 mb-8">
          {isGrant ? (
            <>
              Dengan memberikan <span className="font-bold text-[#0A1024]">&quot;hak akses&quot;</span> kepada
              anggota divisi, mereka dapat menambah, mengedit, dan menghapus program kerja (proker) di divisi kamu.
            </>
          ) : (
            <>
              Dengan mencabut <span className="font-bold text-[#0A1024]">&quot;hak akses&quot;</span> dari anggota
              divisi, mereka tidak akan bisa lagi menambah, mengedit, dan menghapus program kerja (proker) di divisi
              kamu.
            </>
          )}
        </p>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="bg-[#FFF9E6] text-[#0A1024] font-semibold py-3 rounded-xl hover:bg-[#FFF3CC] transition-colors disabled:opacity-60"
          >
            Batal
          </button>
          <button
            onClick={handleConfirm}
            disabled={isSaving}
            className="bg-[#FFC700] text-[#0A1024] font-semibold py-3 rounded-xl hover:bg-[#e6b400] transition-colors disabled:opacity-60"
          >
            {isSaving ? "Menyimpan..." : isGrant ? "Beri Akses" : "Cabut Akses"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function MemberGrid({ members, canManageAccess }: { members: Member[]; canManageAccess: boolean }) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);

  if (members.length === 0) {
    return <p className="text-sm text-gray-400">Belum ada anggota di divisi ini.</p>;
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
        {members.map((member) => (
          <MemberCard
            key={member.id}
            member={member}
            canManageAccess={canManageAccess}
            openMenuId={openMenuId}
            setOpenMenuId={setOpenMenuId}
            onRequestAction={setPendingAction}
          />
        ))}
      </div>

      {pendingAction && <ConfirmAccessModal action={pendingAction} onClose={() => setPendingAction(null)} />}
    </>
  );
}
