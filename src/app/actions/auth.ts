"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function loginAction(formData: FormData) {
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;
  
    

  if (username === "admin" && password === "123456") {
    // ต้องใส่ await ที่ cookies()
    const cookieStore = await cookies();
    cookieStore.set("session", "true", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 วัน
    });
    redirect("/"); 
  }
  return { error: "Username หรือ Password ไม่ถูกต้อง" };
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete("session");
  redirect("/login");
}
