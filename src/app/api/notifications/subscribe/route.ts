import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import webPush from "web-push";

// 1. ตั้งค่า VAPID Details
webPush.setVapidDetails(
  `mailto:${process.env.VAPID_MAILTO}`,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function POST(req: Request) {
  try {
    const { userId, title, message, url } = await req.json();

    // 2. ดึง Token (Subscription) ทั้งหมดของ User คนนี้จาก DB
    // ใช้ชื่อฟิลด์ user_id ตาม Schema ของคุณ
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { 
        user_id: Number(userId),
        is_active: true 
      },
    });

    if (subscriptions.length === 0) {
      return NextResponse.json({ error: "User นี้ยังไม่ได้ลงทะเบียนเครื่องรับแจ้งเตือน" }, { status: 404 });
    }

    // 3. เตรียมข้อมูลที่จะส่ง (Payload)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ;
    const payload = JSON.stringify({
      title: title || "แจ้งเตือนใหม่",
      body: message || "คุณได้รับข้อความจากระบบ",
      url: baseUrl,
    });

    // 4. วนลูปส่งหาทุกเครื่องที่ User คนนี้มี
    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          await webPush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh_key, // ใช้ชื่อฟิลด์ตาม Schema
                auth: sub.auth_key,     // ใช้ชื่อฟิลด์ตาม Schema
              },
            },
            payload
          );
        } catch (error: unknown) {
          // ถ้า Token หมดอายุ (404, 410) ให้ลบทิ้งจาก DB
          if (error && typeof error === 'object' && 'statusCode' in error) {
            const status = (error as { statusCode: number }).statusCode;
            if (status === 404 || status === 410) {
              await prisma.pushSubscription.delete({ where: { id: sub.id } });
            }
          }
          throw error;
        }
      })
    );

    return NextResponse.json({ 
      success: true, 
      sentCount: results.filter(r => r.status === 'fulfilled').length 
    });

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Internal Server Error";
    console.error("❌ Send Notification Error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}