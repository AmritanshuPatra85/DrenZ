import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { token, title, body, data } = await req.json()

  if (!token) {
    return NextResponse.json({ error: 'No token' }, { status: 400 })
  }

  const accessToken = await getAccessToken()

  const response = await fetch(
    `https://fcm.googleapis.com/v1/projects/drenz-ce592/messages:send`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        message: {
          token,
          notification: { title, body },
          data: data ?? {},
          webpush: {
            notification: {
              title,
              body,
              icon: '/icons/icon-192x192.png',
            },
          },
        },
      }),
    }
  )

  const result = await response.json()
  if (!response.ok) {
    console.error('FCM error:', result)
    return NextResponse.json({ error: result }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

async function getAccessToken(): Promise<string> {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT!)

  const now = Math.floor(Date.now() / 1000)
  const payload = {
    iss: serviceAccount.client_email,
    sub: serviceAccount.client_email,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
  }

  const header = { alg: 'RS256', typ: 'JWT' }

  const encode = (obj: object) =>
    Buffer.from(JSON.stringify(obj)).toString('base64url')

  const unsignedToken = `${encode(header)}.${encode(payload)}`

  const { createSign } = await import('crypto')
  const sign = createSign('RSA-SHA256')
  sign.update(unsignedToken)
  const signature = sign.sign(serviceAccount.private_key, 'base64url')

  const jwt = `${unsignedToken}.${signature}`

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  })

  const tokenData = await tokenRes.json()
  return tokenData.access_token
}