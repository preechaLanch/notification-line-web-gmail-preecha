import { NextResponse } from 'next/server';

export async function GET() {
  const rootUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
  
  const options = {
    redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
    client_id: process.env.GOOGLE_CLIENT_ID!,
    access_type: 'offline', // เพื่อให้ได้ Refresh Token มาใช้ส่งเมลภายหลัง
    response_type: 'code',
    prompt: 'consent', // บังคับให้หน้าจอขอสิทธิ์ส่ง Gmail ขึ้นมาเสมอ
    scope: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/gmail.send' // สิทธิ์ส่งเมลที่เราตั้งค่าไว้
    ].join(' '),
  };

  const qs = new URLSearchParams(options);
  return NextResponse.redirect(`${rootUrl}?${qs.toString()}`);
}