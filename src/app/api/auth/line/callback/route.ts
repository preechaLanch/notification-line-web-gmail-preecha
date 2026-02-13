import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");

  if (!code)
    return NextResponse.json({ error: "No code provided" }, { status: 400 });

  try {
    // 1. แลก code เป็น Access Token
    const tokenRes = await fetch("https://api.line.me/oauth2/v2.1/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/line/callback`,
        client_id: process.env.LINE_CLIENT_ID!,
        client_secret: process.env.LINE_CLIENT_SECRET!,
      }),
    });
    
    const tokens = await tokenRes.json();
    if (tokens.error) throw new Error(tokens.error_description);

    // 2. เอา Access Token ไปขอ Profile
    const profileRes = await fetch("https://api.line.me/v2/profile", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const profile = await profileRes.json();

    // 3. เช็คว่ามี User ในระบบหรือยัง
    const existingUser = await prisma.user.findUnique({
      where: { line_user_id: profile.userId },
    });

    if (!existingUser) {
      return NextResponse.redirect(new URL('/register?error=line_not_linked', req.url));
    }

    // 4. อัปเดตข้อมูล (ลบ any ออก ใช้โครงสร้างข้อมูลปกติ)
    await prisma.user.update({
      where: { line_user_id: profile.userId },
      data: {
        line_display_name: profile.displayName,
        line_picture_url: profile.pictureUrl,
        login_provider: "LINE",
        can_receive_line: true, 
      },
    });

    // 5. สร้าง Session
    const cookieStore = await cookies();
    cookieStore.set("session", "true", {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}`);
    
  } catch (error: unknown) {
    // แก้จุดที่ error: any เป็นการเช็คประเภทแทน
    const message = error instanceof Error ? error.message : "Login failed";
    console.error("❌ LINE_CALLBACK_ERROR:", message);
    return NextResponse.json({ error: "Login failed", details: message }, { status: 500 });
  }
}