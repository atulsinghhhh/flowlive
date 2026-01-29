import { RtcTokenBuilder, RtcRole } from 'agora-token';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const channelName = searchParams.get('channelName');
  const role = request.nextUrl.searchParams.get('role') || 'publisher'; 
  
  const uid = Math.floor(Math.random() * 20000) + 1;

  if (!channelName) {
    return NextResponse.json({ error: 'Channel name is required' }, { status: 400 });
  }

  const appId = process.env.NEXT_PUBLIC_APP_ID;
  const appCertificate = process.env.AGORA_APP_CERTIFICATE;

  if (!appId || !appCertificate) {
    console.error("Missing Agora Credentials");
    return NextResponse.json({ error: 'Agora credentials missing' }, { status: 500 });
  }

  const rtcRole = role === 'publisher' ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;
  const expirationTimeInSeconds = 3600;
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

  try {
    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channelName,
      uid,
      rtcRole,
      expirationTimeInSeconds,
      privilegeExpiredTs
    );

    console.log(`Token generated for channel: ${channelName}, uid: ${uid}, role: ${role}`);
    return NextResponse.json({ token, uid });
  } catch (err) {
    console.error("Token generation failed:", err);
    return NextResponse.json({ error: 'Token generation failed' }, { status: 500 });
  }
}
