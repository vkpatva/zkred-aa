import { NextResponse } from 'next/server'

interface DecryptRequest {
    payload: string
}

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

        const response = await fetch('http://localhost:8080/v1/utils/redirect/decrypt', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Basic YWlfdFpDdlBScHBhNEx0Q1dzcU5wZ1J1QXVncWJYaEtHUG86YXNfOGtqTWRwOVFWaHBudnZ5bVdzWHg5ZHV0cldmM1dNNDI='
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
