"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter(); // ใช้งาน router

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      // สั่ง Register ทันที ไม่ต้องรอ
      navigator.serviceWorker.register("/sw.js");
    }
  }, []);
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      // 1. Validation ฝั่ง Client
      if (!formData.username.trim()) throw new Error("กรุณากรอก Username");
      if (formData.password.length < 6)
        throw new Error("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
      if (formData.password !== formData.confirmPassword)
        throw new Error("รหัสผ่านไม่ตรงกัน");

      // 2. ยิง API Register
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
        }),
      });

      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error || "เกิดข้อผิดพลาดในการสมัครสมาชิก");

      // 3. ✨ ขั้นตอนการเก็บ Token เครื่อง (Push Subscription)
      if ("serviceWorker" in navigator) {
        try {
          // ใช้ .ready แบบมีสติ
          const registration = await navigator.serviceWorker.ready;

          // ดึง Subscription
          const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(
              process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
            ),
          });

          // ✋ สำคัญมาก: ต้อง await ตัวนี้ให้เสร็จตามที่คุณต้องการ
          const subRes = await fetch("/api/notifications/subscribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: data.userId, subscription }),
          });

          if (subRes.ok) console.log("✅ Token Saved!");
        } catch (pushError) {
          console.error("❌ Push Error:", pushError);
          // ถ้าพลาดตรงนี้ ให้ปล่อยผ่านเพื่อให้ User วาร์ปไปหน้าหลักได้ ไม่ค้างตาย
        }
      }

      // 4. จัดการเมื่อสำเร็จ
      setSuccess(true);
      setFormData({ username: "", password: "", confirmPassword: "" });

      // ✨ เพิ่มบรรทัดนี้: สร้าง Session ทันทีเพื่อให้ Middleware ยอมให้ผ่าน
      document.cookie = "session=true; path=/; max-age=604800";

      setTimeout(() => {
        // ใช้ window.location.href แทน router.push เพื่อให้ Browser โหลดหน้าใหม่และรับ Cookie
        window.location.href = "/";
      }, 1500);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "ระบบขัดข้อง กรุณาลองใหม่",
      );
    } finally {
      setLoading(false);
    }
  };

  // ... (ฟังก์ชัน handleLineLogin / handleGoogleLogin เหมือนเดิม) ...
  const handleLineLogin = () => {
    setLoading(true);
    window.location.href = "/api/auth/line";
  };
  const handleGoogleLogin = () => {
    setLoading(true);
    window.location.href = "/api/auth/google";
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl font-bold">📢</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">สมัครสมาชิก</h2>
          <p className="mt-2 text-sm text-gray-600">ระบบแจ้งเตือนอเนกประสงค์</p>
        </div>

        {/* Register Form */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          {error && (
            <div className="mb-4 p-4 rounded-lg bg-red-50 text-red-800 border border-red-200">
              <div className="flex items-center gap-2">
                <span>❌</span>
                {error}
              </div>
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 rounded-lg bg-green-50 text-green-800 border border-green-200">
              <div className="flex items-center gap-2">
                <span>✅</span>
                สมัครสมาชิกเรียบร้อยแล้ว! กำลังไปหน้าเข้าสู่ระบบ...
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={formData.username}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                placeholder="username"
                disabled={loading}
              />
            </div>

            <div>
              <label
                htmlFor="password"
                title="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                รหัสผ่าน
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                placeholder="••••••••"
                disabled={loading}
              />
              <p className="mt-1 text-xs text-gray-500">
                รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร
              </p>
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                ยืนยันรหัสผ่าน
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                placeholder="••••••••"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  กำลังบันทึกข้อมูล...
                </div>
              ) : (
                "สมัครสมาชิก"
              )}
            </button>
          </form>

          {/* ... ส่วน Social และ Footer เหมือนเดิม ... */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">หรือ</span>
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              onClick={handleGoogleLogin}
              type="button"
              className="w-full inline-flex justify-center items-center gap-2 py-2 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors"
            >
              Gmail
            </button>
            <button
              onClick={handleLineLogin}
              type="button"
              className="w-full inline-flex justify-center items-center gap-2 py-2 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors"
            >
              LINE
            </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              มีบัญชีอยู่แล้ว?{" "}
              <button
                onClick={() => router.push("/login")}
                className="font-medium text-blue-600 hover:text-blue-700"
              >
                เข้าสู่ระบบ
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
