# Zkred Verifier

## API Endpoints

### 1. Initialize Verification

GET /api/verifier/auth-request

Returns:

- `request`: Authorization request object
- `encodedURI`: Direct QR code content
- `shortenURL`: Shortened URL for deep linking
- `verificationId`: Unique verification identifier

### 2. Callback URL

POST /api/verifier/callback?sessionId={sessionId}

Called by Privado Wallet after user generate a proof of the requested credentials.

### 3. Check Verification Status

GET /api/verifier/verification/{verificationId}

Returns:

- `status`: Verification status
- `result`: Verification result (if available)

Application is currently running on `https://zkred-aa.onrender.com`

Curl to initialize verification:

```curl
curl --location 'https://zkred-aa.onrender.com/api/verifier/verify' \
--header 'Content-Type: application/json' \
--data '{
    "aadhar": {
        "required": true,
        "dob": {
            "query": "gt",
            "value": "1999-01-01"
        }
    },
    "bank": {
        "required": true,
        "currentBalance": {
            "query": "gt",
            "value": "14000"
        },
        "currentODLimit": {
            "query": "gt",
            "value": "10000"
        },
        "drawingLimit": {
            "query": "gt",
            "value": "1000"
        }
    },
    "insurance": {
        "required": true,
        "sumAssured": {
            "query": "gt",
            "value": "100000"
        },
        "policyStartDate": {
            "required": true
        },
        "maturityDate": {
            "required": true
        }
    }
}'
```

Curl to check verification status:

```curl
curl -X GET "https://zkred-aa.onrender.com/api/verifier/verification/{verificationId}"
```
