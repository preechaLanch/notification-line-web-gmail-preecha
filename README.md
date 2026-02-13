https://notification-line-web-gmail-preecha.vercel.app/

# Notification Line Web Gmail (Preecha)

ระบบแจ้งเตือนอเนกประสงค์ (LINE, Gmail, Web Push) ด้วย Next.js, Prisma, Supabase, LINE, Google, Web Push

## วิธีเริ่มต้นใช้งาน

1. **Clone โปรเจกต์นี้**
	```
	git clone https://github.com/preechaLanch/notification-line-web-gmail-preecha.git
	cd notification-line-web-gmail-preecha
	```

2. **ติดตั้ง dependencies**
	```
	npm install
	```

3. **ตั้งค่าไฟล์ .env**
	- สร้างไฟล์ `.env` ที่ root ของโปรเจกต์ (หรือคัดลอกจากตัวอย่างด้านล่าง)
	- ใส่ค่า key ต่างๆ ตามนี้:

```env
DATABASE_URL=...              # URL สำหรับเชื่อมต่อฐานข้อมูล (Postgres/Supabase)
DIRECT_URL=...                # URL สำหรับเชื่อมต่อฐานข้อมูลโดยตรง (ใช้กับ Prisma)

# LINE Login
LINE_CLIENT_ID=...            # Client ID จาก LINE Developer Console
LINE_CLIENT_SECRET=...        # Client Secret จาก LINE Developer Console
NEXTAUTH_URL=...              # URL ของแอป (เช่น http://localhost:3000)

# LINE Messaging API
LINE_MESSAGING_API_TOKEN=...  # Channel access token สำหรับส่งข้อความ LINE

# Google Cloud Console
GOOGLE_CLIENT_ID=...          # Client ID จาก Google Cloud Console
GOOGLE_CLIENT_SECRET=...      # Client Secret จาก Google Cloud Console
GOOGLE_REDIRECT_URI=...       # Redirect URI (เช่น http://localhost:3000/api/auth/google/callback)

# Web Push
NEXT_PUBLIC_VAPID_PUBLIC_KEY=... # Public Key สำหรับ Web Push (ใช้ฝั่ง client)
VAPID_PRIVATE_KEY=...             # Private Key สำหรับ Web Push (ใช้ฝั่ง server)
VAPID_MAILTO=...                  # Email สำหรับติดต่อ (ใช้กับ Web Push)
```

> **หมายเหตุ:**
> - ข้อมูล key ทั้งหมดต้องขอจาก LINE Developer, Google Cloud, และสร้าง Web Push Key Pair เอง
> - ห้าม commit ไฟล์ .env ขึ้น public repo

4. **รันโปรเจกต์**
	```
	npm run dev
	```

## ฟีเจอร์หลัก
- Login/สมัครสมาชิกด้วย LINE, Gmail, Username/Password
- ส่งแจ้งเตือนผ่าน LINE, Gmail, Web Push
- Dashboard เลือกผู้รับและช่องทางได้

## โครงสร้างโปรเจกต์ (บางส่วน)

- `src/app/api/auth/`         : API สำหรับ auth (login, register, LINE, Google)
- `src/app/api/notifications/`: API สำหรับส่งแจ้งเตือน
- `src/components/`           : React Components
- `src/lib/`                  : Prisma, Supabase, Web Push utils

---
ติดต่อผู้พัฒนา: preecha.lanch@gmail.com
