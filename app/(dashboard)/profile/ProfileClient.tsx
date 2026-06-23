"use client";

import { useState, useRef, useEffect } from "react";
import { User, Lock, LogOut, FileText, CheckCircle2, Briefcase, Link as LinkIcon, Download, ExternalLink, Info, Upload, Users } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

const SKILL_CATEGORIES = [
  "UI/UX Design", "Frontend Developer", "Backend Developer",
  "Mobile Developer", "AI/ML Engineering", "Data Science",
  "Cybersecurity", "Business Plan", "Public Speaking",
  "Video Editing/Multimedia"
];

const COMPETITION_INTERESTS = [
  "Hackathon", "UI/UX Design", "Business Case", "AI Competition",
  "Innovation Competition", "Web Development", "Data Competition"
];

const ROLES_INFO = [
  { id: "talent", title: "Talent", desc: "Role umum yang dapat mengakses fitur-fitur yang disediakan oleh MyProdigi" },
  { id: "asisten_lab", title: "Asisten Laboratorium", desc: "Role Khusus Aslab DTC yang dapat mengakses fitur-fitur aslab" },
  { id: "admin", title: "Admin", desc: "Role Super yang dapat melakukan management platform" }
];

export default function ProfileClient({ profile }: { profile: any }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("personal");

  const availableRoles = profile.role === 'admin' 
    ? ['talent', 'asisten_lab', 'admin'] 
    : profile.role === 'asisten_lab' 
      ? ['talent', 'asisten_lab'] 
      : ['talent'];

  const [isChangingRole, setIsChangingRole] = useState(false);
  const [activeRole, setActiveRole] = useState(profile.role);
  const [selectedRole, setSelectedRole] = useState(profile.role);

  useEffect(() => {
    const saved = localStorage.getItem('activeRole');
    if (saved && availableRoles.includes(saved)) {
      setActiveRole(saved);
      setSelectedRole(saved);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // State for Personal Info Edit
  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [personalForm, setPersonalForm] = useState({
    name: profile.name || "",
    nim: profile.nim || "",
    nomorWa: profile.nomorWa || "",
    angkatan: profile.angkatan || "",
    jurusan: profile.jurusan || "",
  });
  const [isSavingPersonal, setIsSavingPersonal] = useState(false);

  // State for Skills Edit
  const [isEditingSkills, setIsEditingSkills] = useState(false);
  const [skillsForm, setSkillsForm] = useState<string[]>(profile.skills || []);
  const [interestsForm, setInterestsForm] = useState<string[]>(profile.interests || []);
  const [isSavingSkills, setIsSavingSkills] = useState(false);

  // State for CV Upload
  const [isUploadingCv, setIsUploadingCv] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State for Photo Upload
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // State for Password Reset
  const [resetEmail, setResetEmail] = useState("");
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [resetMessage, setResetMessage] = useState("");

  // State for User Management (Admin only)
  const [users, setUsers] = useState<any[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

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
    if (activeTab === "management" && activeRole === "admin") {
      fetchUsers(currentPage);
    }
  }, [activeTab, activeRole, currentPage]);

  const handleUpdateRole = async (userId: string, newRole: string) => {
    setUpdatingRole(userId);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole })
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

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleSavePersonal = async () => {
    setIsSavingPersonal(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(personalForm)
      });
      if (res.ok) {
        setIsEditingPersonal(false);
        router.refresh();
      } else {
        toast.error("Gagal menyimpan profil.");
      }
    } catch (err) {
      console.error(err);
    }
    setIsSavingPersonal(false);
  };

  const handleSaveSkills = async () => {
    setIsSavingSkills(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skills: skillsForm, interests: interestsForm })
      });
      if (res.ok) {
        setIsEditingSkills(false);
        router.refresh();
      } else {
        toast.error("Gagal menyimpan skill & peminatan.");
      }
    } catch (err) {
      console.error(err);
    }
    setIsSavingSkills(false);
  };

  // Drag and drop handlers for CV
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (file.type !== "application/pdf") {
      toast.error("Mohon unggah file dalam format PDF.");
      return;
    }

    setIsUploadingCv(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        throw new Error("Gagal mengunggah file CV.");
      }

      const { url } = await uploadRes.json();

      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cvUrl: url })
      });

      if (res.ok) {
        toast.success("CV berhasil diunggah.");
        router.refresh();
      } else {
        toast.error("Gagal memperbarui profil.");
      }
    } catch (err: any) {
      console.error("CV upload error:", err);
      toast.error(err.message || "Gagal mengunggah CV.");
    }
    setIsUploadingCv(false);
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (!file.type.startsWith("image/")) {
        toast.error("Mohon unggah file gambar (JPG, PNG).");
        return;
      }
      setIsUploadingPhoto(true);
      try {
        // Upload the file first
        const formData = new FormData();
        formData.append("file", file);

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) {
          throw new Error("Failed to upload image");
        }

        const { url } = await uploadRes.json();

        // Update the profile with the real URL
        const res = await fetch("/api/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ photoUrl: url })
        });
        
        if (res.ok) {
          toast.success("Foto profil berhasil diubah.");
          router.refresh();
        } else {
          toast.error("Gagal mengubah foto profil.");
        }
      } catch (err) {
        console.error(err);
        toast.error("Gagal mengunggah foto profil.");
      }
      setIsUploadingPhoto(false);
    }
  };

  const handleRequestReset = async () => {
    if (!resetEmail) {
      setResetMessage("Masukkan email Anda.");
      return;
    }
    if (resetEmail !== profile.email) {
      setResetMessage("Email tidak sesuai dengan email yang terdaftar pada profil Anda.");
      return;
    }

    setIsSendingReset(true);
    setResetMessage("");
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/forgotPassword`
      });

      if (error) {
        setResetMessage(error.message);
      } else {
        setResetMessage("Tautan atur ulang kata sandi berhasil dikirim ke email Anda!");
        setResetEmail("");
      }
    } catch (err) {
      console.error(err);
      setResetMessage("Terjadi kesalahan.");
    }
    setIsSendingReset(false);
  };

  const toggleSkill = (skill: string) => {
    if (!isEditingSkills) return;
    setSkillsForm(prev => prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]);
  };

  const toggleInterest = (interest: string) => {
    if (!isEditingSkills) return;
    setInterestsForm(prev => prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]);
  };

  const tabs = [
    { id: "personal", label: "Personal Information", icon: User },
    { id: "skills", label: "Skill & Peminatan", icon: Briefcase },
    { id: "role", label: "Role", icon: LinkIcon },
    { id: "cv", label: "CV", icon: FileText },
    { id: "password", label: "Reset Password", icon: Lock },
  ];

  if (activeRole === "admin") {
    tabs.push({ id: "management", label: "Management Akun", icon: Users });
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Sidebar */}
      <div className="w-full lg:w-80 flex-shrink-0 bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col items-center">
        <div className="relative mb-4 mt-4">
          <div className="w-32 h-32 rounded-full border-4 border-[#FFC700] overflow-hidden bg-gray-200">
            {profile.photoUrl ? (
              <img
                src={profile.photoUrl}
                alt="Avatar"
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100">
                <User className="w-16 h-16" />
              </div>
            )}
          </div>
          <button 
            onClick={() => photoInputRef.current?.click()}
            disabled={isUploadingPhoto}
            className="absolute bottom-1 right-1 bg-[#FFC700] p-2 rounded-full text-black hover:scale-105 transition-transform disabled:opacity-50"
          >
            {isUploadingPhoto ? (
              <div className="w-4 h-4 rounded-full border-2 border-black border-t-transparent animate-spin" />
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>
            )}
          </button>
          <input 
            type="file" 
            className="hidden" 
            accept="image/*" 
            ref={photoInputRef}
            onChange={handlePhotoChange} 
          />
        </div>

        <h2 className="text-xl font-bold text-[#0A1024] mt-2 text-center">{profile.name || "User Prodigi"}</h2>
        <p className="text-sm text-gray-500 mb-10 text-center capitalize">{activeRole.replace('_', ' ')}</p>

        <div className="w-full space-y-2 mb-10">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-medium transition-colors ${activeTab === tab.id
                ? "bg-[#FFF9E6] text-[#0A1024]"
                : "text-gray-500 hover:bg-gray-50"
                }`}
            >
              <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? "text-[#FFC700]" : "text-gray-400"}`} />
              {tab.label}
            </button>
          ))}
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-medium text-red-500 hover:bg-red-50 transition-colors mt-auto"
        >
          <LogOut className="w-5 h-5 text-red-500" />
          Log Out
        </button>

        <p className="text-xs text-gray-400 mt-8">MyProdigi V1.0</p>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-white rounded-3xl p-8 shadow-sm border border-gray-100">

        {/* TAB: Personal Information */}
        {activeTab === "personal" && (
          <div className="animate-in fade-in duration-300">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-[#0A1024]">Personal Information</h2>
              {!isEditingPersonal ? (
                <button
                  onClick={() => setIsEditingPersonal(true)}
                  className="bg-[#FFC700] text-[#0A1024] px-6 py-2 rounded-lg font-semibold hover:bg-[#e6b400] transition-colors text-sm"
                >
                  Edit
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setIsEditingPersonal(false);
                      // Revert changes
                      setPersonalForm({
                        name: profile.name || "",
                        nim: profile.nim || "",
                        nomorWa: profile.nomorWa || "",
                        angkatan: profile.angkatan || "",
                        jurusan: profile.jurusan || "",
                      });
                    }}
                    className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg font-semibold hover:bg-gray-200 transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSavePersonal}
                    disabled={isSavingPersonal}
                    className="bg-[#FFC700] text-[#0A1024] px-6 py-2 rounded-lg font-semibold hover:bg-[#e6b400] transition-colors text-sm disabled:opacity-50"
                  >
                    {isSavingPersonal ? "Saving..." : "Save"}
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-600">Nama Lengkap</label>
                {isEditingPersonal ? (
                  <input
                    type="text"
                    value={personalForm.name}
                    onChange={e => setPersonalForm({ ...personalForm, name: e.target.value })}
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#FFC700] outline-none text-gray-900"
                  />
                ) : (
                  <div className="w-full p-4 bg-gray-50 rounded-xl text-gray-900 text-sm border border-transparent">{profile.name || "-"}</div>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-600">NIM</label>
                {isEditingPersonal ? (
                  <input
                    type="text"
                    value={personalForm.nim}
                    onChange={e => setPersonalForm({ ...personalForm, nim: e.target.value })}
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#FFC700] outline-none text-gray-900"
                  />
                ) : (
                  <div className="w-full p-4 bg-gray-50 rounded-xl text-gray-900 text-sm border border-transparent">{profile.nim || "Belum diatur"}</div>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-600">Email</label>
                {/* Email is always disabled */}
                <div className="w-full p-4 bg-gray-100 rounded-xl text-gray-500 text-sm border border-transparent cursor-not-allowed">{profile.email || "-"}</div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-600">Nomor WA</label>
                {isEditingPersonal ? (
                  <input
                    type="text"
                    value={personalForm.nomorWa}
                    onChange={e => setPersonalForm({ ...personalForm, nomorWa: e.target.value })}
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#FFC700] outline-none text-gray-900"
                  />
                ) : (
                  <div className="w-full p-4 bg-gray-50 rounded-xl text-gray-900 text-sm border border-transparent">{profile.nomorWa || "-"}</div>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-600">Angkatan</label>
                {isEditingPersonal ? (
                  <input
                    type="text"
                    value={personalForm.angkatan}
                    onChange={e => setPersonalForm({ ...personalForm, angkatan: e.target.value })}
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#FFC700] outline-none text-gray-900"
                  />
                ) : (
                  <div className="w-full p-4 bg-gray-50 rounded-xl text-gray-900 text-sm border border-transparent">{profile.angkatan || "-"}</div>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-600">Jurusan</label>
                {isEditingPersonal ? (
                  <select
                    value={personalForm.jurusan}
                    onChange={e => setPersonalForm({ ...personalForm, jurusan: e.target.value })}
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#FFC700] outline-none text-gray-900"
                  >
                    <option value="S1 Informatika">S1 Informatika</option>
                    <option value="S1 Teknologi Informasi">S1 Teknologi Informasi</option>
                    <option value="S1 Rekayasa Perangkat Lunak">S1 Rekayasa Perangkat Lunak</option>
                    <option value="S1 Data Science">S1 Data Science</option>
                  </select>
                ) : (
                  <div className="w-full p-4 bg-gray-50 rounded-xl text-gray-900 text-sm border border-transparent">{profile.jurusan || "-"}</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB: Skill & Peminatan */}
        {activeTab === "skills" && (
          <div className="animate-in fade-in duration-300">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-[#0A1024]">Skill & Peminatan</h2>
              {!isEditingSkills ? (
                <button
                  onClick={() => setIsEditingSkills(true)}
                  className="bg-[#FFC700] text-[#0A1024] px-6 py-2 rounded-lg font-semibold hover:bg-[#e6b400] transition-colors text-sm"
                >
                  Edit
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setIsEditingSkills(false);
                      setSkillsForm(profile.skills || []);
                      setInterestsForm(profile.interests || []);
                    }}
                    className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg font-semibold hover:bg-gray-200 transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveSkills}
                    disabled={isSavingSkills}
                    className="bg-[#FFC700] text-[#0A1024] px-6 py-2 rounded-lg font-semibold hover:bg-[#e6b400] transition-colors text-sm disabled:opacity-50"
                  >
                    {isSavingSkills ? "Saving..." : "Save"}
                  </button>
                </div>
              )}
            </div>

            {/* Skill */}
            <h3 className="font-semibold text-gray-700 mb-4">Kategori Skill</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
              {SKILL_CATEGORIES.map(skill => {
                const hasSkill = isEditingSkills ? skillsForm.includes(skill) : (profile.skills || []).includes(skill);
                return (
                  <button
                    key={skill}
                    onClick={() => toggleSkill(skill)}
                    disabled={!isEditingSkills}
                    className={`p-4 border rounded-xl flex justify-between items-center text-sm transition-all ${hasSkill ? "border-[#FFC700] bg-[#FFF9E6] text-[#0A1024] font-medium" : "border-gray-200 text-gray-600"
                      } ${isEditingSkills ? "hover:border-[#FFC700] cursor-pointer" : "cursor-default"}`}
                  >
                    <span>{skill}</span>
                    {hasSkill && <CheckCircle2 className="w-5 h-5 text-[#FFC700]" />}
                  </button>
                )
              })}
            </div>

            {/* Peminatan Lomba */}
            <h3 className="font-semibold text-gray-700 mb-4 mt-10">Peminatan Lomba</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {COMPETITION_INTERESTS.map(interest => {
                const hasInterest = isEditingSkills ? interestsForm.includes(interest) : (profile.interests || []).includes(interest);
                return (
                  <button
                    key={interest}
                    onClick={() => toggleInterest(interest)}
                    disabled={!isEditingSkills}
                    className={`p-4 border rounded-xl flex justify-between items-center text-sm transition-all ${hasInterest ? "border-[#FFC700] bg-[#FFF9E6] text-[#0A1024] font-medium" : "border-gray-200 text-gray-600"
                      } ${isEditingSkills ? "hover:border-[#FFC700] cursor-pointer" : "cursor-default"}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${hasInterest ? "bg-[#FFC700] text-white" : "bg-gray-100 text-gray-400"}`}>
                        <Briefcase className="w-4 h-4" />
                      </div>
                      <span>{interest}</span>
                    </div>
                    {hasInterest && <CheckCircle2 className="w-5 h-5 text-[#FFC700]" />}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* TAB: Role */}
        {activeTab === "role" && (
          <div className="animate-in fade-in duration-300">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-[#0A1024]">Role</h2>
              {availableRoles.length === 1 ? (
                <button disabled className="bg-gray-200 text-gray-500 px-6 py-2 rounded-lg font-semibold cursor-not-allowed text-sm">
                  Ganti Role
                </button>
              ) : (
                <div className="flex gap-2">
                  {isChangingRole && (
                    <button 
                      onClick={() => {
                        setIsChangingRole(false);
                        setSelectedRole(activeRole);
                      }} 
                      className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg font-semibold hover:bg-gray-200 transition-colors text-sm"
                    >
                      Cancel
                    </button>
                  )}
                  <button 
                    onClick={() => {
                      if (!isChangingRole) {
                        setIsChangingRole(true);
                      } else {
                        localStorage.setItem('activeRole', selectedRole);
                        setActiveRole(selectedRole);
                        setIsChangingRole(false);
                        router.push('/');
                        router.refresh();
                      }
                    }}
                    className="bg-[#FFC700] text-[#0A1024] px-6 py-2 rounded-lg font-semibold hover:bg-[#e6b400] transition-colors text-sm"
                  >
                    {isChangingRole ? "Masuk" : "Ganti Role"}
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {ROLES_INFO.filter(r => availableRoles.includes(r.id)).map(roleInfo => {
                const isActive = isChangingRole ? selectedRole === roleInfo.id : activeRole === roleInfo.id;
                return (
                  <div 
                    key={roleInfo.id}
                    onClick={() => {
                      if (isChangingRole) setSelectedRole(roleInfo.id);
                    }}
                    className={`p-6 border rounded-2xl relative transition-all ${
                      isActive 
                        ? "border-[#FFC700] bg-[#FFF9E6]" 
                        : "border-gray-200 bg-gray-50 opacity-60"
                    } ${isChangingRole ? "cursor-pointer hover:border-[#FFC700]" : ""}`}
                  >
                    {isActive && <CheckCircle2 className="w-6 h-6 text-[#FFC700] absolute top-6 right-6" />}
                    <h3 className="text-lg font-bold text-[#0A1024] mb-2">{roleInfo.title}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {roleInfo.desc}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Info className="w-4 h-4" />
              <span>
                {availableRoles.length === 1 
                  ? "saat ini kamu hanya memiliki 1 role" 
                  : `saat ini kamu memiliki ${availableRoles.length} role`}
              </span>
            </div>
          </div>
        )}

        {/* TAB: CV */}
        {activeTab === "cv" && (
          <div className="animate-in fade-in duration-300">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-[#0A1024]">CV</h2>
            </div>

            {profile.cvUrl && (
              <div className="border border-gray-200 rounded-2xl p-6 max-w-sm mb-8">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-[#FFF9E6] rounded-xl flex items-center justify-center">
                    <FileText className="w-6 h-6 text-[#FFC700]" />
                  </div>
                  <div className="overflow-hidden">
                    <h3 className="font-semibold text-[#0A1024] truncate">CV {profile.name || "User"}</h3>
                    <p className="text-xs text-gray-500 truncate">{profile.cvUrl}</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={() => {
                      if (!profile.cvUrl) return;
                      let targetUrl = profile.cvUrl;
                      if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://") && !targetUrl.startsWith("/")) {
                        targetUrl = `/uploads/${targetUrl}`;
                      }
                      window.open(targetUrl, "_blank");
                    }}
                    className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-xl font-medium text-sm hover:bg-gray-50 transition-colors"
                  >
                    Buka
                  </button>
                  <button 
                    onClick={() => {
                      if (!profile.cvUrl) return;
                      let targetUrl = profile.cvUrl;
                      if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://") && !targetUrl.startsWith("/")) {
                        targetUrl = `/uploads/${targetUrl}`;
                      }
                      const link = document.createElement("a");
                      link.href = targetUrl;
                      link.setAttribute("download", `CV_${profile.name || "User"}.pdf`);
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                    className="flex-1 bg-[#FFC700] text-[#0A1024] py-2.5 rounded-xl font-medium text-sm hover:bg-[#e6b400] transition-colors"
                  >
                    Unduh
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900">Upload / Ganti CV Baru</label>
              <div
                className={`border-2 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center text-center cursor-pointer transition-colors max-w-sm ${isDragging ? "border-[#FFC700] bg-[#FFF9E6]" : "border-gray-300 hover:bg-gray-50"}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="w-16 h-16 bg-[#FFF9E6] rounded-full flex items-center justify-center mb-4">
                  <Upload className="w-8 h-8 text-[#FFC700]" />
                </div>
                <p className="font-semibold text-gray-900">
                  {isUploadingCv ? "Uploading..." : "Drag & drop file here or click to browse"}
                </p>
                <p className="text-sm text-gray-500 mt-1">Supported only PDF (Max 5MB)</p>
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB: Reset Password */}
        {activeTab === "password" && (
          <div className="animate-in fade-in duration-300">
            <h2 className="text-2xl font-bold text-[#0A1024] mb-8">Reset Password</h2>
            <div className="max-w-md space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-600">Email Address</label>
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={resetEmail}
                  onChange={e => setResetEmail(e.target.value)}
                  className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#FFC700] outline-none text-gray-900"
                />
                <p className="text-xs text-gray-500">Masukkan email Anda yang terdaftar untuk menerima tautan atur ulang kata sandi.</p>
              </div>

              {resetMessage && (
                <p className={`text-sm ${resetMessage.includes("berhasil") ? "text-green-600" : "text-red-500"}`}>
                  {resetMessage}
                </p>
              )}

              <button
                onClick={handleRequestReset}
                disabled={isSendingReset || !resetEmail}
                className="bg-[#FFC700] text-[#0A1024] px-8 py-3 rounded-xl font-semibold hover:bg-[#e6b400] transition-colors w-full mt-4 disabled:opacity-50"
              >
                {isSendingReset ? "Mengirim..." : "Kirim Tautan Reset Password"}
              </button>
            </div>
          </div>
        )}

        {/* TAB: Management Akun (Admin Only) */}
        {activeTab === "management" && activeRole === "admin" && (
          <div className="animate-in fade-in duration-300">
            <h2 className="text-2xl font-bold text-[#0A1024] mb-8">Management Akun</h2>

            {isLoadingUsers ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FFC700]"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
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
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${u.role === "admin" ? "bg-red-100 text-red-700" :
                            u.role === "asisten_lab" ? "bg-blue-100 text-blue-700" :
                              "bg-gray-100 text-gray-700"
                            }`}>
                            {u.role === "asisten_lab" ? "Asisten Lab" : u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <select
                              className="
        min-w-[220px]
        px-4 py-2.5
        bg-white
        border border-gray-300
        rounded-xl
        text-sm font-medium text-gray-700
        shadow-sm
        transition-all duration-200

        hover:border-gray-400
        focus:outline-none
        focus:ring-2
        focus:ring-[#FFC700]/30
        focus:border-[#FFC700]

        disabled:bg-gray-50
        disabled:text-gray-500
        disabled:border-gray-200
        disabled:cursor-not-allowed
      "
                              value={u.role}
                              onChange={(event) =>
                                handleUpdateRole(u.id, event.target.value)
                              }
                              disabled={updatingRole === u.id || u.id === profile.id}
                            >
                              <option value="talent">Talent</option>
                              <option value="asisten_lab">Asisten Laboratorium</option>
                              <option value="admin">Admin</option>
                            </select>

                            {updatingRole === u.id && (
                              <div
                                className="
          animate-spin
          h-5 w-5
          rounded-full
          border-2 border-gray-200
          border-t-[#FFC700]
        "
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

            {/* Pagination Controls for Management Akun */}
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
          </div>
        )}

      </div>
    </div>
  );
}
