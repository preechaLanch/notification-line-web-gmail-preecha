// src/app/page.tsx
import { prisma } from '@/lib/prisma'
import DashboardClient from '@/components/DashboardClient'

export const revalidate = 0 // เพื่อให้ดึงข้อมูลใหม่ทุกครั้งที่รีเฟรช

export default async function Home() {
  // ดึงรายชื่อ User จริงจากฐานข้อมูล
  const usersFromDb = await prisma.user.findMany({
    orderBy: { created_at: 'desc' }
  })

  // แปลงข้อมูลให้เข้ากับโครงสร้าง Interface ที่ UI ต้องการ
  const formattedUsers = usersFromDb.map(user => ({
    id: user.id.toString(),
    name: user.line_display_name || 'No Name',
    image: user.line_picture_url,
    email: user.email || '',
    lineUserId: user.line_user_id,
    canReceiveEmail: user.can_receive_email,
    canReceiveLine: !!user.line_user_id, // ถ้ามี Line ID ถือว่าส่งไลน์ได้
    canReceivePush: user.can_receive_push,
  }))

  return (
    <main>
      <DashboardClient initialUsers={formattedUsers} />
    </main>
  )
}