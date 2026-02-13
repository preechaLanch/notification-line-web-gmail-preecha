import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const session = request.cookies.get("session")?.value;
  const { pathname } = request.nextUrl;

  // 1. ถ้ามี session แล้วพยายามเข้าหน้า Login หรือ Register ให้ส่งไปหน้าแรก
  if (session && (pathname === "/login" || pathname === "/register")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // 2. ถ้าไม่มี session และไม่ใช่หน้า login หรือ register ให้เด้งไปหน้า login
  // *** จุดสำคัญคือต้องเพิ่ม || pathname === "/register" ตรงนี้ ***
  if (!session && pathname !== "/login" && pathname !== "/register") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|sw.js|icon.png).*)',],
};