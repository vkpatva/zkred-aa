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

Application is currently running on `http://localhost:8000/`

Curl to initialize verification:

```curl
curl --location 'http://localhost:8000/api/verifier/verify' \
--header 'Content-Type: application/json' \
--data '{
    "aadhar": {
        "required": true,
        "dob": {
            "query": "lt",
            "value": "2001-01-01"
        }
    }
}'
```

Curl to check verification status:

```
curl -X GET "http://localhost:8000/api/verifier/verification/{verificationId}"
```
