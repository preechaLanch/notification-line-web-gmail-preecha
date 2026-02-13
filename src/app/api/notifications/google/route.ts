import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { google } from "googleapis";

export async function POST(req: NextRequest) {
  try {
    const { userId, message, subject } = await req.json();

    // 1. ดึง Refresh Token จาก DB
    const user = await prisma.user.findUnique({
      where: {
        id: parseInt(userId), // แปลงค่า userId ให้เป็นตัวเลข (Int)
      },
      select: {
        email: true,
        google_refresh_token: true,
      },
    });

    if (!user?.google_refresh_token)
      throw new Error(
        "ผู้ใช้นี้ยังไม่ได้เชื่อมต่อ Google หรือไม่มีสิทธิ์ส่งเมล",
      );

    // 2. ตั้งค่า Google OAuth
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI,
    );

    oauth2Client.setCredentials({ refresh_token: user.google_refresh_token });

    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    // 3. สร้างเนื้อหาเมลแบบ MIME (รองรับภาษาไทย)
    const utf8Subject = `=?utf-8?B?${Buffer.from(subject || "แจ้งเตือนใหม่").toString("base64")}?=`;
    const emailContent = [
      `To: ${user.email}`,
      "Content-Type: text/html; charset=utf-8",
      "MIME-Version: 1.0",
      `Subject: ${utf8Subject}`,
      "",
      message,
    ].join("\n");

    const encodedMessage = Buffer.from(emailContent)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    // 4. สั่งส่งเมล
    await gmail.users.messages.send({
      userId: "me",
      requestBody: { raw: encodedMessage },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    // ใช้ Type Guard เพื่อเช็คว่าเป็น Error object หรือไม่
    const errorMessage =
      error instanceof Error ? error.message : "Internal Server Error";
    console.error("GMAIL_SEND_ERROR:", errorMessage);

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
