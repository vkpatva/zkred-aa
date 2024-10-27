import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    try {
        const response = await fetch('https://api-playground.setu.co/api/product-api', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'content-type': 'application/json',
                'origin': 'https://api-playground.setu.co',
            },
            body: JSON.stringify({
                "requestObj": {
                    "parameters": {
                        "path": [{
                            "requestId": id
                        }],
                        "header": [
                            { "x-client-id": process.env.CLIENT_ID },
                            { "x-client-secret": process.env.CLIENT_SECRET },
                            { "x-product-instance-id": process.env.PRODUCT_INSTANCE_ID }
                        ]
                    }
                },
                "url": "https://dg-sandbox.setu.co/api/digilocker/{requestId}/aadhaar",
                "requestBooleanData": {
                    "header": true,
                    "path": true,
                    "query": false,
                    "body": false
                },
                "method": "get",
                "operationId": "Gete-AadhaarXML",
                "selectedProduct": {
                    "label": "DigiLocker",
                    "value": "data/digilocker"
                }
            })
        });

        const data = await response.json();


        // Add date format conversion function
        const formatDate = (dateStr: string) => {
            if (!dateStr) return "2000-01-01";
            const [day, month, year] = dateStr.split("-");
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        };

        const credentials = {
            name: data?.aadhaar?.name || "Ajay Sharma",
            dob: formatDate(data?.aadhaar?.dateOfBirth) || "2000-01-01",
            gender: data?.aadhaar?.gender || "M",
            address: data?.aadhaar?.address?.house
                ? `${data.aadhaar.address.house}, ${data.aadhaar.address.street}`
                : "B-101, Ashray, Ahmedabad",
            city: data?.aadhaar?.address?.vtc || "Ahmedabad",
            pincode: data?.aadhaar?.address?.pin || "380001"
        };


        const zkredResponse = await fetch(process.env.ISSUER_URL as string, {
            method: 'POST',
            headers: {
                'Authorization': process.env.ISSUER_HEADER as string,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                credentialSubject: {
                    name: credentials.name,
                    dob: credentials.dob,
                    address: credentials.address,
                    pincode: credentials.pincode,
                    city: credentials.city
                },
                schemaID: process.env.SCHEMA_ID as string,
                signatureProof: true,
                mtProof: false,
                limitedClaims: 1,
            })
        });

        const zkredData = await zkredResponse.json();

        const linkId = zkredData.id;
        const offerResponse = await fetch(`${process.env.CLAIM_URL as string}${linkId}/offer`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        const offerData = await offerResponse.json();
        return NextResponse.json({
            deepLink: offerData.deepLink,
            universalLink: offerData.universalLink
        });
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
    }
}
