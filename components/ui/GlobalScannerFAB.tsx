"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { QrCode, X, Camera, RefreshCw, AlertCircle } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
import { toast } from "react-hot-toast";
import { createClient } from "@/utils/supabase/client";
import { usePathname } from "next/navigation";

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
}

function getStoredRole(): string | null {
  if (typeof window === "undefined") return null;
  const saved = localStorage.getItem("activeRole") || getCookie("activeRole");
  if (!saved) return null;
  const normalized = saved.toLowerCase() === "aslab" ? "asisten_lab" : saved.toLowerCase();
  return normalized;
}

export function GlobalScannerFAB() {
  const pathname = usePathname();
  const [userRole, setUserRole] = useState<string | null>(() => getStoredRole());
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);

  const syncRole = useCallback(async () => {
    // 1. Optimistic check from localStorage / cookie if available
    const clientSavedRole = getStoredRole();
    if (clientSavedRole) {
      setUserRole(clientSavedRole);
    }

    // 2. Authoritative check via /api/profile (Prisma database source of truth)
    try {
      const res = await fetch("/api/profile");
      if (res.ok) {
        const data = await res.json();
        if (data && data.role) {
          const normalized = data.role.toLowerCase() === "aslab" ? "asisten_lab" : data.role.toLowerCase();
          setUserRole(normalized);
          return;
        }
      }
    } catch (e) {
      console.warn("GlobalScannerFAB fetch /api/profile error:", e);
    }

    // 3. Fallback check via Supabase Auth metadata if API fails
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const dbRole = (user.user_metadata?.role || "talent").toLowerCase();
        const normalizedRealRole = dbRole === "aslab" ? "asisten_lab" : dbRole;

        const availableRoles = normalizedRealRole === "admin"
          ? ["talent", "asisten_lab", "admin"]
          : normalizedRealRole === "asisten_lab"
            ? ["talent", "asisten_lab"]
            : ["talent"];

        const savedRole = getStoredRole();
        const effectiveRole = (savedRole && availableRoles.includes(savedRole))
          ? savedRole
          : normalizedRealRole;

        setUserRole(effectiveRole);
      } else {
        setUserRole("talent");
      }
    } catch (err) {
      console.warn("Error syncing role via Supabase:", err);
    }
  }, []);

  // Sync role on mount and on route change
  useEffect(() => {
    syncRole();
  }, [pathname, syncRole]);

  // Listen to profile updates, role switches, and auth state changes
  useEffect(() => {
    function handleProfileUpdated(e: Event) {
      const { role } = (e as CustomEvent<{ photoUrl?: string; role?: string }>).detail ?? {};
      if (role !== undefined) {
        const normalizedRole = role.toLowerCase() === "aslab" ? "asisten_lab" : role.toLowerCase();
        setUserRole(normalizedRole);
      } else {
        syncRole();
      }
    }

    function handleStorageChange(e: StorageEvent) {
      if (e.key === "activeRole") {
        if (e.newValue) {
          const normalizedRole = e.newValue.toLowerCase() === "aslab" ? "asisten_lab" : e.newValue.toLowerCase();
          setUserRole(normalizedRole);
        } else {
          syncRole();
        }
      }
    }

    window.addEventListener("myprodigi:profile-updated", handleProfileUpdated);
    window.addEventListener("myprodigi:role-changed", handleProfileUpdated);
    window.addEventListener("storage", handleStorageChange);

    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === "SIGNED_OUT") {
        setUserRole("talent");
      } else if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        await syncRole();
      }
    });

    return () => {
      window.removeEventListener("myprodigi:profile-updated", handleProfileUpdated);
      window.removeEventListener("myprodigi:role-changed", handleProfileUpdated);
      window.removeEventListener("storage", handleStorageChange);
      subscription.unsubscribe();
    };
  }, [syncRole]);

  useEffect(() => {
    if (showScannerModal && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error("Error getting location:", error);
          toast.error("Gagal mendapatkan lokasi. Absensi memerlukan akses lokasi.");
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }
  }, [showScannerModal]);

  // Only render FAB for asisten_lab / aslab role
  const isAslab = userRole === "asisten_lab" || userRole === "aslab";
  if (!isAslab) {
    return null;
  }

  return (
    <>
      <div className="fixed bottom-8 right-8 z-40">
        <div className="relative">
          <button
            onClick={() => setShowScannerModal(true)}
            aria-label="Scan Absensi"
            className="w-16 h-16 bg-[#0B132B] hover:bg-[#1a2b5e] text-white rounded-2xl flex items-center justify-center shadow-2xl transition-transform hover:scale-105 active:scale-95 cursor-pointer"
          >
            <QrCode className="w-8 h-8 text-[#FFC727]" />
          </button>
        </div>
      </div>

      {showScannerModal && (
        <QRScannerModal
          onClose={() => setShowScannerModal(false)}
          location={location}
          onSuccess={() => {
            setShowScannerModal(false);
            window.location.reload();
          }}
        />
      )}
    </>
  );
}

function QRScannerModal({ onClose, location, onSuccess }: { onClose: () => void, location: {lat: number, lng: number} | null, onSuccess: () => void }) {
  const [scanError, setScanError] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isScanningRef = useRef(false);

  const startScanner = useCallback(async () => {
    setIsInitializing(true);
    setCameraError(null);
    setScanError(null);

    const element = document.getElementById("qr-reader");
    if (element) {
      element.innerHTML = "";
    }

    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch (e) {
        console.warn("Cleanup previous scanner instance error:", e);
      }
    }

    const scanner = new Html5Qrcode("qr-reader");
    scannerRef.current = scanner;

    const qrConfig = {
      fps: 10,
      qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
        const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
        const qrboxSize = Math.floor(minEdge * 0.75);
        return { width: Math.max(qrboxSize, 200), height: Math.max(qrboxSize, 200) };
      },
      aspectRatio: 1.0
    };

    const handleDecodedText = async (decodedText: string) => {
      if (isScanningRef.current) return;
      isScanningRef.current = true;

      try {
        const url = new URL(decodedText);
        const token = url.searchParams.get("token");
        const type = url.searchParams.get("type");

        if (!token || !type) {
          toast.error("Format QR Code tidak valid.");
          isScanningRef.current = false;
          return;
        }

        toast.loading("Memproses absensi...", { id: "absensi" });

        const res = await fetch("/api/absensi/scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token,
            type,
            lat: location?.lat ?? null,
            lng: location?.lng ?? null
          })
        });

        const data = await res.json();
        if (!res.ok) {
          if (data.errorCode === "LATE_DATANG" || data.errorCode === "LATE_PULANG" || data.errorCode === "MISSED_DATANG") {
            setScanError(data.message);
            if (scannerRef.current && scannerRef.current.isScanning) {
              scannerRef.current.pause(true);
            }
          } else {
            toast.error(data.message || data.error || "Gagal absen", { id: "absensi" });
          }
        } else {
          toast.success(data.message || "Absensi berhasil!", { id: "absensi" });
          if (scannerRef.current && scannerRef.current.isScanning) {
            await scannerRef.current.stop();
            scannerRef.current.clear();
          }
          onSuccess();
        }
      } catch (err) {
        console.error(err);
        toast.error("Gagal membaca QR", { id: "absensi" });
      } finally {
        setTimeout(() => { isScanningRef.current = false; }, 3000);
      }
    };

    try {
      // 1. Try to detect camera devices first (best for mobile devices)
      let cameras: Array<{ id: string; label: string }> = [];
      try {
        cameras = await Html5Qrcode.getCameras();
      } catch (e) {
        console.warn("getCameras error (falling back to facingMode):", e);
      }

      if (cameras && cameras.length > 0) {
        const backCamera = cameras.find(c => 
          c.label.toLowerCase().includes("back") ||
          c.label.toLowerCase().includes("belakang") ||
          c.label.toLowerCase().includes("rear") ||
          c.label.toLowerCase().includes("environment")
        );
        const selectedId = backCamera ? backCamera.id : cameras[cameras.length - 1].id;

        await scanner.start(
          selectedId,
          qrConfig,
          handleDecodedText,
          () => {}
        );
      } else {
        // Fallback to environment facingMode
        await scanner.start(
          { facingMode: "environment" },
          qrConfig,
          handleDecodedText,
          () => {}
        );
      }
      setIsInitializing(false);
    } catch (primaryErr: any) {
      console.warn("Primary camera start failed, trying fallback facingMode 'user':", primaryErr);
      try {
        // Fallback to user facingMode or default
        await scanner.start(
          { facingMode: "user" },
          qrConfig,
          handleDecodedText,
          () => {}
        );
        setIsInitializing(false);
      } catch (secondaryErr: any) {
        console.error("Camera start failed completely:", secondaryErr);
        setIsInitializing(false);
        setCameraError(
          "Tidak dapat membuka kamera. Pastikan izin kamera telah diizinkan pada browser Anda."
        );
      }
    }
  }, [location, onSuccess]);

  useEffect(() => {
    let isMounted = true;
    const timer = setTimeout(() => {
      if (isMounted) {
        startScanner();
      }
    }, 200);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      if (scannerRef.current) {
        if (scannerRef.current.isScanning) {
          scannerRef.current.stop().then(() => {
            scannerRef.current?.clear();
          }).catch(console.error);
        } else {
          scannerRef.current.clear();
        }
      }
    };
  }, [startScanner]);

  return (
    <div className="fixed inset-0 bg-black/80 z-[60] flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden relative">
        <div className="p-4 bg-[#0B132B] flex justify-between items-center text-white">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <Camera className="w-5 h-5 text-[#FFC727]" />
            Scan QR Absensi
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-4">
          {!location && (
            <div className="bg-blue-50 text-blue-700 p-3 rounded-lg text-xs mb-4 border border-blue-200 flex items-center gap-2">
              <span>📍 Mendeteksi lokasi... (Izin lokasi diperlukan khusus untuk absensi MyShift di TULT)</span>
            </div>
          )}

          <style dangerouslySetInnerHTML={{__html: `
            #qr-reader {
              border: none !important;
              background: transparent !important;
            }
            #qr-reader__scan_region {
              border-radius: 16px;
              overflow: hidden;
              text-align: center !important;
            }
            #qr-reader__scan_region img {
              margin: 24px auto !important;
            }
            #qr-reader video {
              object-fit: cover !important;
              border-radius: 16px !important;
              width: 100% !important;
            }
            #qr-reader__dashboard_section_csr span {
              display: none !important;
            }
            #qr-reader__dashboard_section_csr button {
              background: #0B132B !important;
              color: white !important;
              border: none !important;
              padding: 12px 24px !important;
              border-radius: 8px !important;
              font-weight: 600 !important;
              margin-top: 12px !important;
              cursor: pointer !important;
              transition: all 0.2s !important;
              width: 100% !important;
            }
            #qr-reader__dashboard_section_csr button:hover {
              background: #1a2b5e !important;
            }
            #html5-qrcode-anchor-scan-type-change {
              text-decoration: none !important;
              color: #FFC700 !important;
              font-weight: 600 !important;
              margin-top: 20px !important;
              display: inline-block !important;
            }
            div:has(> label #html5-qrcode-button-file-selection) {
              position: relative !important;
              min-height: 180px !important;
              border: 2px dashed #D1D5DB !important;
              border-radius: 16px !important;
              background: rgba(244, 244, 245, 0.5) !important;
              padding: 32px 16px 44px !important;
              width: 100% !important;
              max-width: 100% !important;
              box-sizing: border-box !important;
              transition: background-color 0.2s ease, border-color 0.2s ease !important;
            }
            div:has(> label #html5-qrcode-button-file-selection):hover {
              background: #F4F4F5 !important;
            }
            label:has(#html5-qrcode-button-file-selection) {
              position: absolute !important;
              inset: 0 !important;
              margin: 0 !important;
              padding: 24px 16px !important;
              display: flex !important;
              flex-direction: column !important;
              align-items: center !important;
              justify-content: center !important;
              cursor: pointer !important;
              box-sizing: border-box !important;
            }
            label:has(#html5-qrcode-button-file-selection)::before {
              content: "";
              display: block;
              width: 56px;
              height: 56px;
              margin-bottom: 12px;
              flex-shrink: 0;
              border-radius: 9999px;
              background-color: #FFF9E6;
              background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23FFC700' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4'/%3E%3Cpolyline points='17 8 12 3 7 8'/%3E%3Cline x1='12' y1='3' x2='12' y2='15'/%3E%3C/svg%3E");
              background-repeat: no-repeat;
              background-position: center;
              background-size: 26px 26px;
            }
            #html5-qrcode-button-file-selection {
              background: transparent !important;
              border: none !important;
              padding: 0 !important;
              color: #0A1024 !important;
              font-weight: 600 !important;
              font-size: 14px !important;
              cursor: pointer !important;
              text-align: center !important;
              pointer-events: none !important;
            }
            label:has(#html5-qrcode-button-file-selection) + div {
              position: absolute !important;
              left: 0 !important;
              right: 0 !important;
              bottom: 16px !important;
              margin: 0 !important;
              color: #9CA3AF !important;
              font-size: 12px !important;
              font-weight: 400 !important;
              text-align: center !important;
              pointer-events: none !important;
            }
          `}} />

          {cameraError ? (
            <div className="py-8 px-4 text-center flex flex-col items-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center text-red-500">
                <AlertCircle className="w-8 h-8" />
              </div>
              <div className="space-y-1 max-w-xs">
                <p className="font-semibold text-gray-800 text-sm">Gagal Mengakses Kamera</p>
                <p className="text-xs text-gray-500">{cameraError}</p>
              </div>
              <button
                onClick={startScanner}
                className="px-5 py-2.5 bg-[#0B132B] hover:bg-[#1a2b5e] text-white rounded-xl font-medium text-xs flex items-center gap-2 transition-all"
              >
                <RefreshCw className="w-4 h-4" /> Coba Lagi
              </button>
            </div>
          ) : (
            <div id="qr-reader" className="w-full"></div>
          )}

          {scanError && (
            <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm flex flex-col items-center text-center animate-in slide-in-from-bottom-2">
              <p className="font-medium mb-3">{scanError}</p>
              <button
                onClick={() => {
                  setScanError(null);
                  if (scannerRef.current) scannerRef.current.resume();
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors w-full font-medium"
              >
                Scan Ulang
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
