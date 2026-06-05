"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Code, PenTool, Briefcase, Cpu, Lightbulb, Globe, Database, Upload, FileText } from "lucide-react";
import toast from "react-hot-toast";

const SKILL_CATEGORIES = [
  "UI/UX Design", "Frontend Developer", "Backend Developer",
  "Mobile Developer", "AI/ML Engineering", "Data Science",
  "Cybersecurity", "Business Plan", "Public Speaking",
  "Video Editing/Multimedia"
];

const COMPETITION_INTERESTS = [
  { id: "Hackathon", label: "Hackathon", icon: Code },
  { id: "UI/UX Design", label: "UI/UX Design", icon: PenTool },
  { id: "Business Case", label: "Business Case", icon: Briefcase },
  { id: "AI Competition", label: "AI Competition", icon: Cpu },
  { id: "Innovation Competition", label: "Innovation Competition", icon: Lightbulb },
  { id: "Web Development", label: "Web Development", icon: Globe },
  { id: "Data Competition", label: "Data Competition", icon: Database }
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    jurusan: "S1 Informatika",
    angkatan: "",
    nomorWa: "",
    cvUrl: "",
    skills: [] as string[],
    interests: [] as string[]
  });

  const handleNext = () => setStep(s => Math.min(s + 1, 3));
  const handlePrev = () => setStep(s => Math.max(s - 1, 1));

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type === "application/pdf") {
        setFormData({ ...formData, cvUrl: file.name });
      } else {
        toast.error("Mohon unggah file dalam format PDF.");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.type === "application/pdf") {
        setFormData({ ...formData, cvUrl: file.name });
      } else {
        toast.error("Mohon unggah file dalam format PDF.");
      }
    }
  };

  const toggleSkill = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
  };

  const toggleInterest = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        router.push("/competitions");
      } else {
        const errorData = await res.json();
        console.error("Failed to save onboarding data:", errorData.error);
        toast.error("Error saving data: " + errorData.error);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col font-sans relative overflow-hidden">
      {/* Decorative circle at bottom left */}
      <div className="absolute -bottom-32 -left-32 w-96 h-96 border-[8px] border-[#FFC700] rounded-full opacity-80 pointer-events-none"></div>
      <div className="absolute -bottom-40 -left-20 w-96 h-96 border-[4px] border-[#FFC700] rounded-full opacity-50 pointer-events-none"></div>

      {/* Header */}
      <header className="w-full bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-10 py-4 sticky top-0 z-50 shadow-sm">
        <div className="flex items-center cursor-pointer">
          <Image src="/assets/myprodigi-logo.svg" alt="MyProdigi Logo" width={160} height={48} className="h-12 w-auto object-contain" />
        </div>

        {/* Stepper */}
        <div className="hidden md:flex items-center gap-6 text-sm font-medium">
          <div className={`flex items-center gap-3 transition-colors duration-300 ${step >= 1 ? "text-[#FFC700]" : "text-gray-400"}`}>
            <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-300 shadow-sm ${step >= 1 ? "bg-[#FFC700] border-[#FFC700] text-white shadow-[#FFC700]/40" : "border-gray-300"}`}>1</div>
            <span className={step >= 1 ? "text-[#0A1024] font-bold" : "font-medium"}>Data Diri</span>
          </div>
          <div className={`w-16 h-1.5 rounded-full transition-colors duration-500 ${step >= 2 ? "bg-[#FFC700]" : "bg-gray-200"}`}></div>
          <div className={`flex items-center gap-3 transition-colors duration-300 ${step >= 2 ? "text-[#FFC700]" : "text-gray-400"}`}>
            <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-300 shadow-sm ${step >= 2 ? "bg-[#FFC700] border-[#FFC700] text-white shadow-[#FFC700]/40" : "border-gray-300"}`}>2</div>
            <span className={step >= 2 ? "text-[#0A1024] font-bold" : "font-medium"}>Kategori Skill</span>
          </div>
          <div className={`w-16 h-1.5 rounded-full transition-colors duration-500 ${step >= 3 ? "bg-[#FFC700]" : "bg-gray-200"}`}></div>
          <div className={`flex items-center gap-3 transition-colors duration-300 ${step >= 3 ? "text-[#FFC700]" : "text-gray-400"}`}>
            <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-300 shadow-sm ${step >= 3 ? "bg-[#FFC700] border-[#FFC700] text-white shadow-[#FFC700]/40" : "border-gray-300"}`}>3</div>
            <span className={step >= 3 ? "text-[#0A1024] font-bold" : "font-medium"}>Peminatan Lomba</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-8 z-10">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl p-12">

          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-[#0A1024] mb-2">
              {step === 1 && "Data Diri"}
              {step === 2 && "Kategori Skill"}
              {step === 3 && "Peminatan Lomba"}
            </h1>
            <p className="text-gray-500">Silahkan lengkapi data diri untuk keperluan registrasi</p>
          </div>

          {/* STEP 1: Data Diri */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-gray-900">Jurusan</label>
                  <select
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#FFC700] outline-none text-gray-900"
                    value={formData.jurusan}
                    onChange={(e) => setFormData({ ...formData, jurusan: e.target.value })}
                  >
                    <option value="S1 Informatika">S1 Informatika</option>
                    <option value="S1 Teknologi Informasi">S1 Teknologi Informasi</option>
                    <option value="S1 Rekayasa Perangkat Lunak">S1 Rekayasa Perangkat Lunak</option>
                    <option value="S1 Data Science">S1 Data Science</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-900">Angkatan</label>
                  <input
                    type="text"
                    placeholder="2025"
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#FFC700] outline-none text-gray-900 placeholder:text-gray-400"
                    value={formData.angkatan}
                    onChange={(e) => setFormData({ ...formData, angkatan: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-900">Nomor WA</label>
                  <input
                    type="text"
                    placeholder="+62 8210 6767 6767"
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#FFC700] outline-none text-gray-900 placeholder:text-gray-400"
                    value={formData.nomorWa}
                    onChange={(e) => setFormData({ ...formData, nomorWa: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900">Upload CV</label>
                <div 
                  className={`border-2 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${isDragging ? "border-[#FFC700] bg-[#FFF9E6]" : "border-gray-300 hover:bg-gray-50"}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="w-16 h-16 bg-[#FFF9E6] rounded-full flex items-center justify-center mb-4">
                    <FileText className="w-8 h-8 text-[#FFC700]" />
                  </div>
                  <p className="font-semibold text-gray-900">
                    {formData.cvUrl ? formData.cvUrl : "Drag & drop file here or click to browse"}
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
                {formData.cvUrl && <p className="text-sm text-green-600 mt-2">✓ CV berhasil ditambahkan</p>}
              </div>

              <div className="flex justify-end mt-10">
                <button
                  onClick={handleNext}
                  disabled={!formData.jurusan || !formData.angkatan || !formData.nomorWa || !formData.cvUrl}
                  className="bg-[#FFC700] text-[#0A1024] font-semibold py-3 px-10 rounded-xl hover:bg-[#e6b400] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Kategori Skill */}
          {step === 2 && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {SKILL_CATEGORIES.map(skill => (
                  <button
                    key={skill}
                    onClick={() => toggleSkill(skill)}
                    className={`p-4 border rounded-xl text-left font-medium transition-all ${formData.skills.includes(skill)
                        ? "border-[#FFC700] bg-[#FFF9E6] text-[#0A1024]"
                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}
                  >
                    {skill}
                  </button>
                ))}
              </div>

              <div className="flex justify-end gap-4 mt-10">
                <button
                  onClick={handlePrev}
                  className="bg-white border border-gray-300 text-gray-700 font-semibold py-3 px-8 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={handleNext}
                  disabled={formData.skills.length === 0}
                  className="bg-[#FFC700] text-[#0A1024] font-semibold py-3 px-10 rounded-xl hover:bg-[#e6b400] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Peminatan Lomba */}
          {step === 3 && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {COMPETITION_INTERESTS.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => toggleInterest(id)}
                    className={`p-4 border rounded-xl flex items-center gap-3 font-medium transition-all ${formData.interests.includes(id)
                        ? "border-[#FFC700] bg-[#FFF9E6] text-[#0A1024]"
                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}
                  >
                    <div className={`p-2 rounded-lg ${formData.interests.includes(id) ? "bg-[#FFC700] text-white" : "bg-gray-100 text-gray-500"}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    {label}
                  </button>
                ))}
              </div>

              <div className="flex justify-end gap-4 mt-10">
                <button
                  onClick={handlePrev}
                  className="bg-white border border-gray-300 text-gray-700 font-semibold py-3 px-8 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading || formData.interests.length === 0}
                  className="bg-[#FFC700] text-[#0A1024] font-semibold py-3 px-10 rounded-xl hover:bg-[#e6b400] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Saving..." : "Continue"}
                </button>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
