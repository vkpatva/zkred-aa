import { NextResponse } from 'next/server'


export async function POST(request: Request) {
    try {

        const body = await request.json()
        const { fi, resdate, ecres } = body

        if (!ecres) {
            return NextResponse.json(
                { error: 'Missing ecres parameter' },
                { status: 400 }
            )
        }

        const response = await fetch(`${process.env.TRUFIU_BASE_URL}/v1/utils/redirect/decrypt`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': process.env.TRUFIU_AUTH_HEADER as string
            },
            body: JSON.stringify({
                payload: `fi=${fi}&resdate=${resdate}&ecres=${ecres}`
            })
        })

        const decryptedData = await response.json()
        return NextResponse.json({ id: decryptedData.payload.srcref })

    } catch (error) {
        console.error('Error decoding redirect response:', error)
        return NextResponse.json(
            { error: 'Failed to decode redirect response' },
            { status: 500 }
        )
    }
}
