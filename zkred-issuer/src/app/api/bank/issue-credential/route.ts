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

async function parseAccountData(xmlData: string) {
    try {
        const result = await parseStringPromise(xmlData, { explicitArray: false })
        return result.Account
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

        // Parse all XML data
        const parsedAccounts = []
        for (const fip of fetchDataResponse.fips || []) {
            for (const account of fip.accounts || []) {
                const parsedData = await parseAccountData(account.data)
                if (parsedData) {
                    parsedAccounts.push({
                        ...parsedData,
                        maskedAccountNumber: account.masked_account_number,
                        linkRefNumber: account.link_ref_number
                    })
                }
            }
        }

        // Add credential issuance
        const zkredResponse = await fetch(process.env.ISSUER_URL as string, {
            method: 'POST',
            headers: {
                'Authorization': process.env.ISSUER_HEADER as string,
                'Content-Type': 'application/json',
            },
            // body: JSON.stringify({
            //     credentialSubject: {
            //         name: parsedAccounts[0]?.Profile?.Name || "",
            //         pan: parsedAccounts[0]?.Profile?.Pan || "",
            //         deposit: {
            //             currentBalance: parseFloat(parsedAccounts[0]?.Summary?.CurrentBalance || "0"),
            //             balanceDateTime: parsedAccounts[0]?.Summary?.CurrentBalanceDateTime || "",
            //             accountType: parsedAccounts[0]?.Summary?.AccountType || "",
            //             currentODLimit: parseFloat(parsedAccounts[0]?.Summary?.CurrentODLimit || "0"),
            //             drawingLimit: parseFloat(parsedAccounts[0]?.Summary?.DrawingLimit || "0"),
            //             status: parsedAccounts[0]?.Summary?.Status || ""
            //         },
            //         recurringDeposit: {
            //             openingDate: parsedAccounts[0]?.RecurringDeposit?.OpeningDate || "",
            //             maturityAmount: parseFloat(parsedAccounts[0]?.RecurringDeposit?.MaturityAmount || "0"),
            //             maturityDate: parsedAccounts[0]?.RecurringDeposit?.MaturityDate || "",
            //             interestRate: parseFloat(parsedAccounts[0]?.RecurringDeposit?.InterestRate || "0"),
            //             principalAmount: parseFloat(parsedAccounts[0]?.RecurringDeposit?.PrincipalAmount || "0"),
            //             recurringAmount: parseFloat(parsedAccounts[0]?.RecurringDeposit?.RecurringAmount || "0"),
            //             interestComputation: parsedAccounts[0]?.RecurringDeposit?.InterestComputation || ""
            //         },
            //         termDeposit: {
            //             openingDate: parsedAccounts[0]?.TermDeposit?.OpeningDate || "",
            //             maturityAmount: parseFloat(parsedAccounts[0]?.TermDeposit?.MaturityAmount || "0"),
            //             maturityDate: parsedAccounts[0]?.TermDeposit?.MaturityDate || "",
            //             interestRate: parseFloat(parsedAccounts[0]?.TermDeposit?.InterestRate || "0"),
            //             principalAmount: parseFloat(parsedAccounts[0]?.TermDeposit?.PrincipalAmount || "0"),
            //             tenureDays: parseInt(parsedAccounts[0]?.TermDeposit?.TenureDays || "0"),
            //             interestComputation: parsedAccounts[0]?.TermDeposit?.InterestComputation || "",
            //             compoundingFrequency: parsedAccounts[0]?.TermDeposit?.CompoundingFrequency || "",
            //             interestOnMaturity: parseFloat(parsedAccounts[0]?.TermDeposit?.InterestOnMaturity || "0"),
            //             currentValue: parseFloat(parsedAccounts[0]?.TermDeposit?.CurrentValue || "0")
            //         }
            //     },
            //     schemaID: process.env.FINCRED_SCHEMA_ID as string,
            //     signatureProof: true,
            //     mtProof: false,
            //     limitedClaims: 1,
            // })
            body: JSON.stringify({
                "credentialExpiration": null,
                "credentialSubject": {
                    "name": "Ajay Sharma",
                    "pan": "ABCDE0011A",
                    "deposit": {
                        "currentBalance": 999997,
                        "balanceDateTime": "2024-11-01T08:00:00.000+05:30",
                        "accountType": "SAVINGS",
                        "currentODLimit": 100000,
                        "drawingLimit": 10000,
                        "status": "ACTIVE"
                    },
                    "recurringDeposit": {
                        "openingDate": "2020-01-01",
                        "maturityAmount": 1326847,
                        "maturityDate": "2029-08-31",
                        "interestRate": 5,
                        "principalAmount": 200000,
                        "recurringAmount": 10000,
                        "interestComputation": "COMPOUND"
                    },
                    "termDeposit": {
                        "openingDate": "2020-01-01",
                        "maturityAmount": 169537,
                        "maturityDate": "2029-08-27",
                        "interestRate": 8.4,
                        "principalAmount": 100000,
                        "tenureDays": 3526,
                        "interestComputation": "COMPOUND",
                        "compoundingFrequency": "QUATERLY",
                        "interestOnMaturity": 69537,
                        "currentValue": 149451
                    }
                },
                "expiration": null,
                "limitedClaims": 1,
                "mtProof": false,
                "refreshService": null,
                "schemaID": process.env.FINCRED_SCHEMA_ID as string,
                "signatureProof": true
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
            accounts: parsedAccounts,
            deepLink: offerData.deepLink,
            universalLink: offerData.universalLink
        });

    } catch (error) {
        console.error('Error in issue-credential:', error)
        return NextResponse.json(
            { error: 'Failed to issue credentials' },
            { status: 500 }
        )
    }
}
