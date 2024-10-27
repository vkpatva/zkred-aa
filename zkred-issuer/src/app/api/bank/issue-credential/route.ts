import { NextResponse } from 'next/server'
import { parseStringPromise } from 'xml2js'

const AUTH_HEADER = process.env.TRUFIU_AUTH_HEADER
const BASE_URL = process.env.TRUFIU_BASE_URL
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
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
        console.log(consentsData)
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
        const fetchDataResponse = await fetchData(requestDataResponse.session_id)
        // console.log('-----------------------------')
        // console.log(fetchDataResponse)
        // console.log('-----------------------------')

        // // Parse all XML data
        // const parsedAccounts = []
        // for (const fip of fetchDataResponse.fips || []) {
        //     for (const account of fip.accounts || []) {
        //         const parsedData = await parseAccountData(account.data)
        //         if (parsedData) {
        //             parsedAccounts.push({
        //                 ...parsedData,
        //                 maskedAccountNumber: account.masked_account_number,
        //                 linkRefNumber: account.link_ref_number
        //             })
        //         }
        //     }
        // }
        // console.log('--------parsedData--------')
        // console.log(parsedAccounts)
        // console.log('--------parsedData--------')

        return NextResponse.json({
            accounts: [],
            deepLink: `zkred://credentials/${dataId}`,
            universalLink: `https://your-domain.com/credentials/${dataId}`
        })

    } catch (error) {
        console.error('Error in issue-credential:', error)
        return NextResponse.json(
            { error: 'Failed to issue credentials' },
            { status: 500 }
        )
    }
}
