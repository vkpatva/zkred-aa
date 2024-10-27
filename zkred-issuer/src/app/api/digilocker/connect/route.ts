import { NextResponse } from 'next/server';

const SETU_API_URL = 'https://api-playground.setu.co/api/product-api';

export async function POST() {
    try {
        const requestBody = {
            "requestObj": {
                "parameters": {
                    "header": [
                        {
                            "x-client-id": process.env.CLIENT_ID
                        },
                        {
                            "x-client-secret": process.env.CLIENT_SECRET
                        },
                        {
                            "x-product-instance-id": process.env.PRODUCT_INSTANCE_ID
                        }
                    ]
                },
                "body": {
                    "redirectUrl": process.env.CALLBACK_URL
                }
            },
            "url": "https://dg-sandbox.setu.co/api/digilocker",
            "requestBooleanData": {
                "header": true,
                "path": false,
                "query": false,
                "body": true
            },
            "method": "post",
            "operationId": "CreateaDigilockerRequest",
            "selectedProduct": {
                "label": "DigiLocker",
                "value": "data/digilocker"
            }
        }
        const response = await fetch(SETU_API_URL, {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'content-type': 'application/json',
                'origin': 'https://api-playground.setu.co',
            },
            body: JSON.stringify(requestBody)
        });

        const data = await response.json();
        console.log("---------------------------------");
        console.log(JSON.stringify(data));
        console.log("---------------------------------");
        return NextResponse.json({ url: data.url });
    } catch (error) {
        console.error('DigiLocker API Error:', error);
        return NextResponse.json(
            { error: 'Failed to connect to DigiLocker' },
            { status: 500 }
        );
    }
}
