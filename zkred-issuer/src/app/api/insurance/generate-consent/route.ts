import { NextResponse } from 'next/server'

interface ConsentRequest {
    mobileNumber: string
}

export async function POST(request: Request) {
    try {
        // Parse request body
        const body: ConsentRequest = await request.json()
        const { mobileNumber } = body

        if (!mobileNumber) {
            return NextResponse.json(
                { error: 'Mobile number is required' },
                { status: 400 }
            )
        }


        const currentTime = new Date().toISOString()
        const expiryTime = new Date(Date.now() + 60 * 60 * 1000).toISOString()
        const payload = {
            redirect_params: {
                callback_url: `${process.env.TRUFIU_CALLBACK_URL as string}/insurance`,
                language_code: "en-IN"
            },
            consents: [{
                consent_start: currentTime,
                consent_expiry: expiryTime,
                consent_mode: "STORE",
                fetch_type: "PERIODIC",
                consent_types: ["PROFILE", "SUMMARY"],
                fi_types: ["INSURANCE_POLICIES"],
                frequency: {
                    unit: "DAY",
                    value: 1
                },
                customer: {
                    identifiers: [{
                        type: "MOBILE",
                        value: mobileNumber
                    }]
                },
                purpose: {
                    code: "101",
                    text: "Zkred Verifiable Credentials Issuance"
                }
            }]
        }

        // Make request to consent API
        const response = await fetch(process.env.TRUFIU_URL as string, {
            method: 'POST',
            headers: {
                'fiu_entity_id': 'zkred',
                'aa_entity_id': 'saafe-sandbox',
                'Content-Type': 'application/json',
                'Authorization': process.env.TRUFIU_HEADER as string
            },
            body: JSON.stringify(payload)
        })

        const data = await response.json()
        return NextResponse.json({ url: data.redirect_url })

    } catch (error) {
        console.error('Error generating consent:', error)
        return NextResponse.json(
            { error: 'Failed to generate consent' },
            { status: 500 }
        )
    }
}

