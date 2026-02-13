import { NextResponse } from 'next/server'

export async function GET() {
  const lineAuthURL = `https://access.line.me/oauth2/v2.1/authorize?${new URLSearchParams({
    response_type: 'code',
    client_id: process.env.LINE_CLIENT_ID!,
    redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/line/callback`,
    state: 'random_state_string',
    scope: 'openid profile',
    bot_prompt: 'normal' // เพิ่มบรรทัดนี้ครับ จะมีปุ่มติ๊ก "เพิ่มเพื่อน" ในหน้า Login เลย
  }).toString()}`
  
  return NextResponse.redirect(lineAuthURL)
}