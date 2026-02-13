import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { userIds, message } = await req.json();

    // Multicast สามารถส่งได้สูงสุด 500 userIds ต่อหนึ่ง request
    const lineResponse = await fetch('https://api.line.me/v2/bot/message/multicast', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.LINE_MESSAGING_API_TOKEN}`,
      },
      body: JSON.stringify({
        to: userIds,
        messages: [{ type: 'text', text: message }],
      }),
    });

    if (!lineResponse.ok) {
      const errorText = await lineResponse.text();
      return NextResponse.json({ error: errorText }, { status: lineResponse.status });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}