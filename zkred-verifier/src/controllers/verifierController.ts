import { RequestHandler } from 'express';
import { auth, resolver } from '@iden3/js-iden3-auth';
import getRawBody from 'raw-body';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import path from 'path';
const requestMap = new Map();
const shortUrlMap = new Map<string, any>();
const verificationMap = new Map<string, { token?: string, status: 'pending' | 'completed' | 'failed', result?: any }>();

export const getAuthRequest: RequestHandler = async (req, res): Promise<void> => {
    const hostUrl = process.env.VERIFIER_BACKEND_HOST;
    const sessionId = uuidv4();
    const callbackURL = "/api/verifier/callback";
    const audience = process.env.VERIFIER_BACKEND_AMOY_SENDER_DID;
    // console.log()
    const uri = `${hostUrl}${callbackURL}?sessionId=${sessionId}`;

    const request = auth.createAuthorizationRequest("Verifying Proof of Personhood", audience as string, uri);

    const requestId = uuidv4();
    const requestThid = uuidv4();
    request.id = requestId;
    request.thid = requestThid;

    const verificationId = uuidv4();

    verificationMap.set(verificationId, { status: 'pending' });



    const scope = request.body.scope ?? [];
    request.body.scope = [...scope];

    console.log(req.body.aadhar.required)
    if (req.body?.aadhar?.required === true) {
        const proofRequest = {
            "circuitId": "credentialAtomicQueryV3-beta.1",
            "id": Date.now(),
            "query": {
                "allowedIssuers": ["did:iden3:polygon:amoy:xC3kP1H11c5EpKrmHXXKSEmkaeim3anmEq8nxcwMd"],
                "context": "ipfs://QmdEfeLfBd6LkhCmMCMmfL55byB5fRsbEFPi8kmV2TFir7",
                "type": "nationalid",
                "groupId": 1,
                "credentialSubject": {
                    "pincode": {}
                }
            }
        };

        const proofRequest2 = {
            "circuitId": "credentialAtomicQueryV3-beta.1",
            "id": Date.now() + 1,
            "query": {
                "allowedIssuers": ["did:iden3:polygon:amoy:xC3kP1H11c5EpKrmHXXKSEmkaeim3anmEq8nxcwMd"],
                "context": "ipfs://QmdEfeLfBd6LkhCmMCMmfL55byB5fRsbEFPi8kmV2TFir7",
                "type": "nationalid",
                "groupId": 1,
                "credentialSubject": {
                    "name": {}
                }
            }
        };

        request.body.scope.push(proofRequest);
        request.body.scope.push(proofRequest2);

        if (req.body.aadhar.dob) {
            const { query, value } = req.body.aadhar.dob;
            const dateValue = `${value}T00:00:00.000Z`;

            let dobQuery = {};
            switch (query) {
                case 'gt':
                    dobQuery = { "$gt": dateValue };
                    break;
                case 'lt':
                    dobQuery = { "$lt": dateValue };
                    break;
                case 'eq':
                    dobQuery = { "$eq": dateValue };
                    break;
                default:
                    dobQuery = {};
            }

            const proofRequest3 = {
                "circuitId": "credentialAtomicQuerySigV2",
                "id": Date.now() + 2,
                "query": {
                    "groupId": 1,
                    "allowedIssuers": ["*"],
                    "context": "ipfs://QmdEfeLfBd6LkhCmMCMmfL55byB5fRsbEFPi8kmV2TFir7",
                    "type": "nationalid",
                    "credentialSubject": {
                        "dob": dobQuery
                    }
                }
            };

            request.body.scope.push(proofRequest3);
        }
    }

    requestMap.set(sessionId, { ...request, verificationId: verificationId });

    const base64Message = btoa(JSON.stringify(request));

    const shortId = crypto.randomBytes(8).toString('hex');
    const shortenedUrl = `${hostUrl}/api/verifier/short-url/${shortId}`;
    shortUrlMap.set(shortId, request);

    const response = {
        request: request,
        encodedURI: `iden3comm://?i_m=${base64Message}`,
        shortenURL: `iden3comm://?request_uri=${shortenedUrl}`,
        verificationId: verificationId
    };
    res.status(200).set("Content-Type", "application/json").send(response);
}

export const callback: RequestHandler = async (req, res): Promise<void> => {
    try {
        console.log('inside callback')
        const sessionId = req.query.sessionId;

        const raw = await getRawBody(req);
        const tokenStr = raw.toString().trim();
        console.log(tokenStr)

        const ethURL = process.env.VERIFIER_BACKEND_AMOY_RPC;
        const contractAddress = "0x1a4cC30f2aA0377b0c3bc9848766D90cb4404124";
        const keyDIR = "../../keys";

        const AMOY_STATE_RESOLVER = new resolver.EthStateResolver(
            ethURL as string,
            contractAddress
        );

        const resolvers = {
            ["polygon:amoy"]: AMOY_STATE_RESOLVER,
            ["privado:main"]: new resolver.EthStateResolver(
                "https://rpc-mainnet.privado.id",
                "0x975556428F077dB5877Ea2474D783D6C69233742",
            ),
            ["privado:test"]: new resolver.EthStateResolver(
                "https://rpc-testnet.privado.id/",
                "0x975556428F077dB5877Ea2474D783D6C69233742",
            ),
        };
        const authRequest = requestMap.get(`${sessionId}`);

        const verificationId = authRequest.verificationId;
        delete authRequest.verificationId;
        const verifier = await auth.Verifier.newVerifier({
            stateResolver: resolvers,
            circuitsDir: path.join(__dirname, keyDIR),
            ipfsGatewayURL: "https://ipfs.io",
        });
        try {
            const opts = {
                acceptedStateTransitionDelay: 5 * 60 * 1000, // 5 minute
            };

            const authResponse = await verifier.fullVerify(tokenStr, authRequest, opts);

            verificationMap.set(verificationId, {
                status: 'completed',
                token: tokenStr,
                result: authResponse
            });

            res
                .status(200)
                .set("Content-Type", "application/json")
                .send({});
        } catch (error) {
            if (authRequest?.verificationId) {
                verificationMap.set(authRequest.verificationId, {
                    status: 'failed',
                    token: tokenStr
                });
            }
            res.status(500).send(error);
        }
    } catch (err) {
        console.error(err);
        res.status(500).send({ error: "internal server error" })
    }
}

export const resolveShortUrl: RequestHandler = async (req, res) => {
    const shortId = req.params.shortId;
    const request = shortUrlMap.get(shortId);

    if (request) {
        res.json(request);
    } else {
        res.status(404).send("Short URL not found");
    }
};

export const getVerificationStatus: RequestHandler = async (req, res): Promise<void> => {
    const verificationId = req.params.verificationId;
    const verification = verificationMap.get(verificationId);
    if (!verification) {
        res.status(404).send({ error: "Verification not found" });
        return;
    }

    res.status(200).json({
        status: verification.status,
        result: verification.result
    });
};
