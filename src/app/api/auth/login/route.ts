import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    const user = await prisma.user.findUnique({ where: { username } });

    if (!user || !user.password_hash) {
      return NextResponse.json({ error: "ไม่พบชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" }, { status: 401 });
    }

    // เทียบรหัสผ่านว่าตรงกับที่แฮชไว้ไหม
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return NextResponse.json({ error: "รหัสผ่านไม่ถูกต้อง" }, { status: 401 });
    }

    // สร้าง Session แบบเรียบง่าย
    const cookieStore = await cookies();
    cookieStore.set("session", "true", { 
      httpOnly: true, 
      path: "/", 
      maxAge: 60 * 60 * 24 * 7 
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    // เพิ่ม log error สำหรับ debug
    console.error("Login error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Login failed" }, { status: 500 });
  }
}