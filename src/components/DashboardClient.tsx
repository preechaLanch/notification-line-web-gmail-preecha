"use client";

import { useState } from "react";
import Image from "next/image";
import { logoutAction } from "@/app/actions/auth";

interface User {
  id: string;
  name: string | null;
  image: string | null;
  email: string | null;
  lineUserId: string | null;
  canReceiveEmail: boolean;
  canReceiveLine: boolean;
  canReceivePush: boolean;
}

export default function DashboardClient({
  initialUsers,
}: {
  initialUsers: User[];
}) {
  const [users] = useState<User[]>(initialUsers);
  const [message, setMessage] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [channels, setChannels] = useState({
    email: false,
    line: false,
    push: false,
  });
  const [sendAt, setSendAt] = useState("");
  const [isScheduled, setIsScheduled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  // state สำหรับ modal logout
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleUserToggle = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map((u) => u.id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setNotification(null);

    try {
      if (!message.trim()) throw new Error("กรุณาใส่ข้อความ");
      if (selectedUsers.length === 0)
        throw new Error("กรุณาเลือกผู้รับอย่างน้อย 1 คน");
      if (!channels.email && !channels.line && !channels.push)
        throw new Error("กรุณาเลือกช่องทางการส่งอย่างน้อย 1 ช่องทาง");

      // ส่วนการส่ง LINE
      const targetLineIds = users
        .filter((u) => selectedUsers.includes(u.id) && u.canReceiveLine)
        .map((u) => u.lineUserId)
        .filter((id): id is string => !!id);

      if (channels.line && targetLineIds.length > 0) {
        const response = await fetch("/api/notifications/line", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userIds: targetLineIds, message: message }),
        });
        if (!response.ok) throw new Error("ไม่สามารถส่ง LINE ได้");
      }

      // ส่วนการส่ง GOOGLE GMAIL
      if (channels.email) {
        const targetGoogleUsers = users.filter(
          (u) => selectedUsers.includes(u.id) && u.canReceiveEmail,
        );

        if (targetGoogleUsers.length > 0) {
          for (const user of targetGoogleUsers) {
            const response = await fetch("/api/notifications/google", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userId: user.id,
                message: message,
                subject: "แจ้งเตือนจากระบบ",
              }),
            });

            if (!response.ok) {
              const errorData = await response.json();
              console.error(
                `Email failed for user ${user.id}:`,
                errorData.error,
              );
            }
          }
        }
      }

      // ส่วนการส่ง Browser Push
      if (channels.push) {
        const targetPushUsers = users.filter(
          (u) => selectedUsers.includes(u.id) && u.canReceivePush,
        );

        if (targetPushUsers.length > 0) {
          for (const user of targetPushUsers) {
            const response = await fetch("/api/notifications/subscribe", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userId: user.id,
                title: "แจ้งเตือนจากระบบ",
                message: message,
                url: "/"
              }),
            });
            console.log(response)

            if (!response.ok) {
              console.error(`Push failed for user ${user.id}`);
            }
          }
        }
      }

      setNotification({
        type: "success",
        message: isScheduled
          ? "จัดเวลาการแจ้งเตือนเรียบร้อยแล้ว"
          : "ส่งการแจ้งเตือนเรียบร้อยแล้ว",
      });

      // Reset form
      setMessage("");
      setSelectedUsers([]);
      setChannels({ email: false, line: false, push: false });
    } catch (error) {
      setNotification({
        type: "error",
        message: error instanceof Error ? error.message : "เกิดข้อผิดพลาด",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Main Dashboard Content */}
      <div className="min-h-screen bg-gray-50 relative">
        {/* Header */}
        <div className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900">
                ระบบแจ้งเตือนอเนกประสงค์
              </h1>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">A</span>
                  </div>
                  <span className="text-sm text-gray-700">Admin User</span>
                </div>
                <button
                  onClick={() => setShowLogoutModal(true)}
                  className="px-4 py-2 text-sm text-red-600 hover:text-red-700"
                >
                  ออกจากระบบ
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Notification Form */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">
                  สร้างการแจ้งเตือน
                </h2>

                {notification && (
                  <div
                    className={`mb-4 p-4 rounded-lg ${
                      notification.type === "success"
                        ? "bg-green-50 text-green-800 border border-green-200"
                        : "bg-red-50 text-red-800 border border-red-200"
                    }`}
                  >
                    {notification.message}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Message Input */}
                  <div>
                    <label
                      htmlFor="message"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      ข้อความ
                    </label>
                    <textarea
                      id="message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={5}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                      placeholder="พิมพ์ข้อความที่ต้องการส่ง..."
                    />
                  </div>

                  {/* Channels Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ช่องทางการส่ง
                    </label>
                    {(() => {
                      const selectedUsersList = users.filter((u) =>
                        selectedUsers.includes(u.id),
                      );
                      const emailCount = selectedUsersList.filter(
                        (u) => u.canReceiveEmail,
                      ).length;
                      const lineCount = selectedUsersList.filter(
                        (u) => u.canReceiveLine,
                      ).length;
                      const pushCount = selectedUsersList.filter(
                        (u) => u.canReceivePush,
                      ).length;

                      return (
                        <div className="space-y-2">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={channels.email}
                              onChange={(e) =>
                                setChannels({
                                  ...channels,
                                  email: e.target.checked,
                                })
                              }
                              disabled={emailCount === 0}
                              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 disabled:opacity-50"
                            />
                            <span
                              className={`text-sm ${emailCount > 0 ? "text-gray-700" : "text-gray-400"}`}
                            >
                              📧 Email{" "}
                              {emailCount > 0 && (
                                <span className="text-blue-600">
                                  ({emailCount} คน)
                                </span>
                              )}
                            </span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={channels.line}
                              onChange={(e) =>
                                setChannels({
                                  ...channels,
                                  line: e.target.checked,
                                })
                              }
                              disabled={lineCount === 0}
                              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 disabled:opacity-50"
                            />
                            <span
                              className={`text-sm ${lineCount > 0 ? "text-gray-700" : "text-gray-400"}`}
                            >
                              💬 LINE{" "}
                              {lineCount > 0 && (
                                <span className="text-green-600">
                                  ({lineCount} คน)
                                </span>
                              )}
                            </span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={channels.push}
                              onChange={(e) =>
                                setChannels({
                                  ...channels,
                                  push: e.target.checked,
                                })
                              }
                              disabled={pushCount === 0}
                              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 disabled:opacity-50"
                            />
                            <span
                              className={`text-sm ${pushCount > 0 ? "text-gray-700" : "text-gray-400"}`}
                            >
                              🔔 Browser Push{" "}
                              {pushCount > 0 && (
                                <span className="text-yellow-600">
                                  ({pushCount} คน)
                                </span>
                              )}
                            </span>
                          </label>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Schedule Option */}
                  <div>
                    <label className="flex items-center gap-2 cursor-pointer mb-3">
                      <input
                        type="checkbox"
                        checked={isScheduled}
                        onChange={(e) => setIsScheduled(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        กำหนดเวลาส่ง
                      </span>
                    </label>

                    {isScheduled && (
                      <input
                        type="datetime-local"
                        value={sendAt}
                        onChange={(e) => setSendAt(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    )}
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading
                      ? "กำลังส่ง..."
                      : isScheduled
                        ? "จัดเวลาการแจ้งเตือน"
                        : "ส่งการแจ้งเตือนทันที"}
                  </button>
                </form>
              </div>
            </div>

            {/* Recipients Selection */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    เลือกผู้รับ
                  </h2>
                  <button
                    onClick={handleSelectAll}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    {selectedUsers.length === users.length
                      ? "ยกเลิกทั้งหมด"
                      : "เลือกทั้งหมด"}
                  </button>
                </div>

                <div className="mb-4 text-sm text-gray-600">
                  เลือกแล้ว: {selectedUsers.length} / {users.length} คน
                </div>

                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {users.map((user) => (
                    <label
                      key={user.id}
                      className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => handleUserToggle(user.id)}
                        className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center border border-gray-100 shadow-sm">
                            {user.image ? (
                              <Image
                                src={user.image}
                                alt={user.name || user.email || "?"}
                                width={32}
                                height={32}
                                className="w-full h-full object-cover rounded-full"
                                referrerPolicy="no-referrer"
                                onError={() => {}}
                                unoptimized
                              />
                            ) : (
                              <span className="w-full h-full flex items-center justify-center rounded-full bg-gray-200 text-gray-600 text-xs font-bold">
                                {(user.name || user.email || "?")
                                  .charAt(0)
                                  .toUpperCase()}
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {user.name || user.email}
                          </p>
                        </div>
                        {user.email && (
                          <p className="text-xs text-gray-500 truncate">
                            {user.email}
                          </p>
                        )}
                        <div className="flex gap-2 mt-1">
                          {user.canReceiveEmail && (
                            <span
                              className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded"
                              title="ส่ง Email ได้"
                            >
                              📧 Email
                            </span>
                          )}
                          {user.canReceiveLine && (
                            <span
                              className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded"
                              title="ส่ง LINE ได้"
                            >
                              💬 LINE
                            </span>
                          )}
                          {user.canReceivePush && (
                            <span
                              className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded"
                              title="ส่ง Push ได้"
                            >
                              🔔 Push
                            </span>
                          )}
                          {!user.canReceiveEmail &&
                            !user.canReceiveLine &&
                            !user.canReceivePush && (
                              <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                                ยังไม่มีช่องทาง
                              </span>
                            )}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Logout Modal - Rendered outside main layout */}
      {showLogoutModal && (
        <div
          className="fixed inset-0 flex items-center justify-center p-4"
          style={{ 
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 50000,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)'
          }}
        >
          {/* Backdrop Click */}
          <div
            className="absolute inset-0"
            onClick={() => setShowLogoutModal(false)}
            style={{ cursor: 'pointer' }}
          />

          {/* Modal Content */}
          <div
            className="relative w-full max-w-md mx-auto p-8 text-center"
            style={{
              backgroundColor: 'white',
              borderRadius: '20px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border: '1px solid #f3f4f6'
            }}
          >
            {/* Top Decoration */}
            <div
              style={{
                position: 'absolute',
                top: '-12px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '24px',
                height: '24px',
                backgroundColor: 'white',
                borderRadius: '50%',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                border: '1px solid #e5e7eb'
              }}
            />

            {/* Warning Icon */}
            <div style={{ marginBottom: '24px' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  margin: '0 auto 16px',
                  background: 'linear-gradient(135deg, #fb923c 0%, #ef4444 100%)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                }}
              >
                <svg 
                  style={{ width: '32px', height: '32px', color: 'white' }} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" 
                  />
                </svg>
              </div>
            </div>

            {/* Title */}
            <h3
              style={{
                fontSize: '24px',
                fontWeight: '700',
                background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                marginBottom: '12px'
              }}
            >
              ยืนยันการออกจากระบบ
            </h3>

            {/* Description */}
            <div style={{ marginBottom: '32px' }}>
              <p style={{ color: '#6b7280', marginBottom: '8px', lineHeight: '1.6' }}>
                คุณต้องการออกจากระบบใช่หรือไม่?
              </p>
              <p style={{ fontSize: '14px', color: '#9ca3af' }}>
                ระบบจะนำคุณกลับไปยังหน้าเข้าสู่ระบบ
              </p>
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Confirm Button */}
              <button
                onClick={async () => {
                  setShowLogoutModal(false);
                  await logoutAction();
                }}
                style={{
                  width: '100%',
                  padding: '14px 20px',
                  background: 'linear-gradient(135deg, #ef4444 0%, #fb923c 100%)',
                  color: 'white',
                  fontWeight: '600',
                  borderRadius: '12px',
                  border: 'none',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'scale(1.02)';
                  e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.15)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
                }}
              >
                <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                ยืนยันออกจากระบบ
              </button>

              {/* Cancel Button */}
              <button
                onClick={() => setShowLogoutModal(false)}
                style={{
                  width: '100%',
                  padding: '12px 20px',
                  color: '#6b7280',
                  fontWeight: '500',
                  backgroundColor: 'transparent',
                  borderRadius: '12px',
                  border: '1px solid #e5e7eb',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#f9fafb';
                  e.currentTarget.style.borderColor = '#d1d5db';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.borderColor = '#e5e7eb';
                }}
              >
                <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                ยกเลิก
              </button>
            </div>

            {/* Bottom Decoration */}
            <div
              style={{
                position: 'absolute',
                bottom: '0',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '64px',
                height: '4px',
                background: 'linear-gradient(90deg, transparent 0%, #d1d5db 50%, transparent 100%)',
                borderRadius: '2px',
                opacity: '0.5'
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}