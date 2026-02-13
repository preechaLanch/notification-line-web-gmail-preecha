import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");

  if (!code)
    return NextResponse.json({ error: "No code provided" }, { status: 400 });

  try {
    // 1. แลก Code เป็น Token
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      body: JSON.stringify({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI,
        grant_type: "authorization_code",
      }),
    });
    const tokens = await tokenResponse.json();

    // 2. ดึงข้อมูลโปรไฟล์ (เราต้องมี googleUser ก่อนถึงจะเช็ค DB ได้)
    const userRes = await fetch(
      "https://www.googleapis.com/oauth2/v1/userinfo?alt=json",
      {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      },
    );
    const googleUser = await userRes.json();

    // 3. ✨ ส่วนที่เพิ่ม: เช็คว่ามี User ในระบบหรือยัง
    const existingUser = await prisma.user.findUnique({
      where: { email: googleUser.email },
    });

    if (!existingUser) {
      // ❌ ถ้าไม่มีข้อมูล: เด้งไปหน้าสมัครสมาชิก
      return NextResponse.redirect(
        new URL("/register?error=account_not_found", req.url),
      );
    }

    // 4. ✅ ถ้ามีข้อมูล: อัปเดตข้อมูลล่าสุด
    const updateData: Parameters<typeof prisma.user.update>[0]["data"] = {
      line_display_name: googleUser.name,
      line_picture_url: googleUser.picture,
      login_provider: "GOOGLE",
    };

    if (tokens.refresh_token) {
      updateData.google_refresh_token = tokens.refresh_token;
    }

    await prisma.user.update({
      where: { email: googleUser.email },
      data: updateData,
    });

    // 5. ฝัง Cookie เพื่อเข้าสู่ระบบ
    const cookieStore = await cookies();
    cookieStore.set("session", "true", {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return NextResponse.redirect(new URL("/", req.url));
  } catch (error) {
    console.error("GOOGLE_LOGIN_ERROR:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
