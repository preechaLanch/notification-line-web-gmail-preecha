import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: "กรุณากรอกข้อมูลให้ครบ" }, { status: 400 });
    }

    // 1. เช็คว่า Username ซ้ำไหม
    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser) {
      return NextResponse.json({ error: "Username นี้มีผู้ใช้งานแล้ว" }, { status: 400 });
    }

    // 2. แฮชรหัสผ่านเพื่อความปลอดภัย
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. บันทึกข้อมูล (เน้นรับ Push ตามที่คุณต้องการ)
    const user = await prisma.user.create({
      data: {
        username,
        password_hash: hashedPassword,
        line_display_name: username, // ใช้ username เป็นชื่อโชว์ในระบบ
        login_provider: "CREDENTIALS",
        can_receive_push: true,    // เปิดสิทธิ์ Push ไว้รอเลย
        can_receive_email: false,
        can_receive_line: false,
      },
    });

    return NextResponse.json({ message: "สมัครสมาชิกสำเร็จ", userId: user.id }, { status: 201 });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการสมัคร" }, { status: 500 });
  }
}