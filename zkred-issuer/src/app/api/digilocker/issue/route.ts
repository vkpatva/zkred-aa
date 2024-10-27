import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
        return NextResponse.json(
            { error: 'No authorization code received' },
            { status: 400 }
        );
    }

    try {
        return NextResponse.redirect(new URL('/aadhar', request.url));
    } catch (error) {
        console.error('DigiLocker Callback Error:', error);
        return NextResponse.json(
            { error: 'Failed to process DigiLocker callback' },
            { status: 500 }
        );
    }
}
