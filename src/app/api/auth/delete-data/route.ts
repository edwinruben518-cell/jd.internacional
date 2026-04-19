import { NextRequest, NextResponse } from 'next/server'

// Meta Data Deletion Callback
// https://developers.facebook.com/docs/facebook-login/handling-user-data-deletion
export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const params = new URLSearchParams(body)
    const signedRequest = params.get('signed_request')

    if (!signedRequest) {
      return NextResponse.json({ error: 'Missing signed_request' }, { status: 400 })
    }

    // Generate a confirmation code
    const confirmationCode = `DEL-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`

    return NextResponse.json({
      url: `https://jadeai.site/delete-data?code=${confirmationCode}`,
      confirmation_code: confirmationCode,
    })
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Data deletion endpoint. Send POST with signed_request from Meta.',
  })
}
