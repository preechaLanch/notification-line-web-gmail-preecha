'use client'

import { useState } from 'react'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // ปรับฟังก์ชันให้รับ FormData ตรงๆ จากการกด Submit
  async function handleLoginSubmit(formData: FormData) {
    setLoading(true)
    setError('')
    
    // แปลง FormData เป็น JSON เพื่อส่งให้ API
    const data = Object.fromEntries(formData.entries())

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        // ถ้าล็อกอินสำเร็จ ให้วาร์ปไปหน้าหลักทันที
        window.location.href = "/"
      } else {
        // ถ้า API พ่น Error กลับมา (เช่น รหัสผิด)
        setError(result.error || "Username หรือ Password ไม่ถูกต้อง")
        setLoading(false)
      }
    } catch (err) {
      console.error("Login error:", err)
      setError("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header - ส่วนหัวเดิมของคุณ */}
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl font-bold">📢</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">เข้าสู่ระบบ</h2>
          <p className="mt-2 text-sm text-gray-600">ระบบแจ้งเตือนอเนกประสงค์</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          {error && (
            <div className="mb-4 p-4 rounded-lg bg-red-50 text-red-800 border border-red-200 flex items-center gap-2">
              <span>❌</span> {error}
            </div>
          )}

          {/* Form ใช้ Action เพื่อสร้าง Cookie */}
          <form action={handleLoginSubmit} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">Username</label>
              <input
                id="username"
                name="username" 
                type="text"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                placeholder="username"
                disabled={loading}
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">รหัสผ่าน</label>
              <input
                id="password"
                name="password"
                type="password"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                placeholder="••••••••"
                disabled={loading}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
            >
              {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
            </button>
          </form>

          {/* Divider - เส้นคั่นเดิมของคุณ */}
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

          {/* Social Login - ปุ่มเดิมที่คุณเขียนไว้ (เอากลับมาครบแล้วครับ) */}
          <div className="mt-6 grid grid-cols-2 gap-3">
            {/* ปุ่ม Gmail */}
            <button 
              type="button"
              onClick={() => window.location.href = '/api/auth/google'}
              className="w-full inline-flex justify-center items-center gap-2 py-2 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Gmail
            </button>

            {/* ปุ่ม LINE - ลิงก์ไปยัง API Login ที่เราทำไว้ */}
            <button 
              type="button"
              onClick={() => window.location.href = '/api/auth/line'}
              className="w-full inline-flex justify-center items-center gap-2 py-2 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors"
            >
              <svg className="w-5 h-5" fill="#00C300" viewBox="0 0 24 24">
                <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.630.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.626-.63.352 0 .631.285.631.63v4.771z"/>
                <path d="M23.32 8.608c-.72-4.44-4.44-7.92-8.88-8.64-.72-.12-1.44-.12-2.16 0-4.44.72-8.16 4.2-8.88 8.64-.12.72-.12 1.44 0 2.16.72 4.44 4.44 7.92 8.88 8.64.72.12 1.44.12 2.16 0 4.44-.72 8.16-4.2 8.88-8.64.12-.72.12-1.44 0-2.16zM12 22.08c-5.52 0-10.08-4.56-10.08-10.08S6.48 1.92 12 1.92s10.08 4.56 10.08 10.08S17.52 22.08 12 22.08z"/>
                <path d="M6.84 15.36c-.72 0-1.32-.6-1.32-1.32V9.96c0-.72.6-1.32 1.32-1.32.72 0 1.32.6 1.32 1.32v4.08c0 .72-.6 1.32-1.32 1.32z"/>
              </svg>
              LINE
            </button>
          </div>

          {/* Footer - ลิงก์เดิมของคุณ */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              ยังไม่มีบัญชี?{' '}
              <button 
                onClick={() => window.location.href = '/register'}
                className="font-medium text-blue-600 hover:text-blue-700">
                สมัครสมาชิก
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}