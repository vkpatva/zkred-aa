import { NextResponse } from 'next/server'
import { parseStringPromise } from 'xml2js'

const AUTH_HEADER = process.env.TRUFIU_AUTH_HEADER
const BASE_URL = process.env.TRUFIU_BASE_URL

async function fetchConsents(handle: string) {
    const response = await fetch(`${BASE_URL}/v2/consents/fetch`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': AUTH_HEADER || ''
        },
        body: JSON.stringify({ handle })
    })
    return await response.json()
}

async function requestData(consentHandle: string) {
    const to = new Date()
    const from = new Date()
    from.setFullYear(from.getFullYear() - 1)

    const response = await fetch(`${BASE_URL}/v2/data/request`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': AUTH_HEADER || ''
        },
        body: JSON.stringify({
            consent_handle: consentHandle,
            from: from.toISOString(),
            to: to.toISOString(),
            curve: "Curve25519"
        })
    })
    return await response.json()
}

async function fetchData(sessionId: string) {

    const response = await fetch(`${BASE_URL}/v2/data/fetch`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': AUTH_HEADER || ''
        },
        body: JSON.stringify({ session_id: sessionId })
    })
    console.log('\n\n\n\n----------FETCH DATA RESPONSE------------------')
    console.log(response)
    console.log('\n\n\n\n----------FETCH DATA RESPONSE------------------')
    return await response.json()
}

async function parseInsuranceData(xmlData: string) {
    try {
        const result = await parseStringPromise(xmlData, { explicitArray: false })
        // Extract relevant fields from the parsed XML
        const policy = result.Account

        // Transform the data to match our credential schema
        return {
            name: policy.Profile?.Holders?.Holder?.$.name || "",
            policyNumber: policy.Summary?.$.policyNumber || "",
            policyType: policy.Summary?.$.policyType || "",
            sumAssured: parseFloat(policy.Summary?.$.sumAssured || "0"),
            coverType: policy.Summary?.$.coverType || "",
            premiumAmount: parseFloat(policy.Summary?.$.premiumAmount || "0"),
            policyStartDate: policy.Summary?.$.policyStartDate || "",
            maturityDate: policy.Summary?.$.maturityDate || ""
        }
    } catch (error) {
        console.error('Error parsing XML:', error)
        return null
    }
}

export async function GET(request: Request) {
    try {
        // Get dataId from query params
        const { searchParams } = new URL(request.url)
        const dataId = searchParams.get('dataId')

        if (!dataId) {
            return NextResponse.json({ error: 'Missing dataId parameter' }, { status: 400 })
        }

        // Step 1: Fetch Consents
        const consentsData = await fetchConsents(dataId)
        if (!consentsData.consents?.[0]) {
            return NextResponse.json({ error: 'No consent found' }, { status: 404 })
        }

        console.log('--------------------------')
        console.log(consentsData);
        console.log('--------------------------')
        // Step 2: Request Data
        const requestDataResponse = await requestData(dataId)
        if (!requestDataResponse.session_id) {
            return NextResponse.json({ error: 'Failed to get session ID' }, { status: 500 })
        }
        console.log('----------REQUEST DATA RESPONSE------------------')
        console.log(requestDataResponse)
        console.log('----------REQUEST DATA RESPONSE------------------')


        // Step 3: Fetch Data
        await new Promise(resolve => setTimeout(resolve, 5000));
        const fetchDataResponse = await fetchData(requestDataResponse.session_id)
        console.log('fetchDataResponse -----------------------------')
        console.log(fetchDataResponse)
        console.log('-----------------------------')
        console.log('fetchDataResponse.fips -----------------------------')
        console.log(fetchDataResponse.fips)
        console.log('-----------------------------')
        // Parse insurance data
        const parsedPolicies = []
        for (const fip of fetchDataResponse.fips || []) {
            for (const policy of fip.accounts || []) {  // Note: API still uses 'accounts' key
                const parsedData = await parseInsuranceData(policy.data)
                if (parsedData) {
                    parsedPolicies.push({
                        ...parsedData,
                        maskedAccountNumber: policy.masked_account_number,
                        linkRefNumber: policy.link_ref_number
                    })
                }
            }
        }
        console.log('parsedPolicies -----------------------------')
        console.log(JSON.stringify(parsedPolicies))
        console.log('-----------------------------')
        console.log('issuance started')
        const zkredResponse = await fetch(process.env.ISSUER_URL as string, {
            method: 'POST',
            headers: {
                'Authorization': process.env.ISSUER_HEADER as string,
                'Content-Type': 'application/json',
            },
            // body: JSON.stringify({
            //     credentialExpiration: null,
            //     credentialSubject: {
            //         name: parsedPolicies[0]?.name || "",
            //         policyNumber: parsedPolicies[0]?.policyNumber || "",
            //         policyType: parsedPolicies[0]?.policyType || "",
            //         sumAssured: parsedPolicies[0]?.sumAssured || 0,
            //         coverType: parsedPolicies[0]?.coverType || "",
            //         premiumAmount: parsedPolicies[0]?.premiumAmount || 0,
            //         policyStartDate: parsedPolicies[0]?.policyStartDate || "",
            //         maturityDate: parsedPolicies[0]?.maturityDate || ""
            //     },
            //     expiration: null,
            //     limitedClaims: 1,
            //     mtProof: false,
            //     refreshService: null,
            //     schemaID: process.env.INSURANCE_SCHEMA_ID as string,
            //     signatureProof: true
            // })
            body: JSON.stringify({
                credentialSubject: {
                    "name": "Ajay Sharma",
                    "pan": "ABCDE0011A",
                    policyNumber: "LIC24250001234",
                    policyType: "TERM_PLAN",
                    sumAssured: 1000000,
                    coverType: "LIFE",
                    premiumAmount: 25000,
                    policyStartDate: "2020-01-01",
                    maturityDate: "2090-01-01"

                },
                credentialExpiration: null,
                expiration: null,
                limitedClaims: 1,
                mtProof: false,
                refreshService: null,
                schemaID: process.env.INSURANCE_SCHEMA_ID as string,
                signatureProof: true
            })
        });
        console.log('issuance completed')
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
            accounts: parsedPolicies,
            deepLink: offerData.deepLink,
            universalLink: offerData.universalLink
        });


    } catch (error) {
        console.error('Error in issue-credential:', error)
        return NextResponse.json(
            { error: 'Failed to issue insurance credentials' },
            { status: 500 }
        )
    }
}
