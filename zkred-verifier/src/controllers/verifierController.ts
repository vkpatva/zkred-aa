import { RequestHandler } from 'express';
import { auth, resolver } from '@iden3/js-iden3-auth';
import getRawBody from 'raw-body';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import path from 'path';
import { ZeroKnowledgeProofRequest } from '@iden3/js-iden3-auth/dist/types/types-sdk';
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

    const request = auth.createAuthorizationRequest("Verifying Credentials", audience as string, uri);

    const requestId = uuidv4();
    const requestThid = uuidv4();
    request.id = requestId;
    request.thid = requestThid;

    const verificationId = uuidv4();

    verificationMap.set(verificationId, { status: 'pending' });



    const scope = request.body.scope ?? [];
    request.body.scope = [...scope];

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

    if (req.body?.bank?.required === true) {
        const proofRequest = {
            "circuitId": "credentialAtomicQuerySigV2",
            "id": Date.now() + 3,
            "query": {
                "groupId": 2,
                "allowedIssuers": [
                    "*"
                ],
                "context": "ipfs://QmQsMPq764m1A7X83DPzKq19pAEbmxsL2Suosy5u497rCP",
                "type": "FinCred",
                "credentialSubject": {
                    "name": {}
                }
            }
        }
        request.body.scope.push(proofRequest);
        const proofRequest2 = {
            "circuitId": "credentialAtomicQuerySigV2",
            "id": Date.now() + 3,
            "query": {
                "groupId": 2,
                "allowedIssuers": [
                    "*"
                ],
                "context": "ipfs://QmQsMPq764m1A7X83DPzKq19pAEbmxsL2Suosy5u497rCP",
                "type": "FinCred",
                "credentialSubject": {
                    "pan": {}
                }
            }
        }
        request.body.scope.push(proofRequest2);

        // Helper function to create balance-type queries
        const createBalanceQuery = (queryType: string, value: string) => {
            switch (queryType) {
                case 'gt':
                    return { "$gt": parseInt(value) };
                case 'lt':
                    return { "$lt": parseInt(value) };
                case 'eq':
                    return { "$eq": parseInt(value) };
                default:
                    return {};
            }
        };

        // Current Balance Check
        if (req.body.bank.currentBalance) {
            const { query, value } = req.body.bank.currentBalance;
            const proofRequest = {
                "circuitId": "credentialAtomicQuerySigV2",
                "id": Date.now() + 4,
                "query": {
                    "groupId": 2,
                    "allowedIssuers": ["*"],
                    "context": "ipfs://QmQsMPq764m1A7X83DPzKq19pAEbmxsL2Suosy5u497rCP",
                    "type": "FinCred",
                    "credentialSubject": {
                        "deposit.currentBalance": createBalanceQuery(query, value)
                    }
                }
            };
            request.body.scope.push(proofRequest as unknown as ZeroKnowledgeProofRequest);
        }

        // OD Limit Check
        if (req.body.bank.currentODLimit) {
            const { query, value } = req.body.bank.currentODLimit;
            const proofRequest = {
                "circuitId": "credentialAtomicQuerySigV2",
                "id": Date.now() + 5,
                "query": {
                    "groupId": 2,
                    "allowedIssuers": ["*"],
                    "context": "ipfs://QmQsMPq764m1A7X83DPzKq19pAEbmxsL2Suosy5u497rCP",
                    "type": "FinCred",
                    "credentialSubject": {
                        "deposit.currentODLimit": createBalanceQuery(query, value)
                    }
                }
            };
            request.body.scope.push(proofRequest as unknown as ZeroKnowledgeProofRequest);
        }

        // Drawing Limit Check
        if (req.body.bank.drawingLimit) {
            const { query, value } = req.body.bank.drawingLimit;
            const proofRequest = {
                "circuitId": "credentialAtomicQuerySigV2",
                "id": Date.now() + 6,
                "query": {
                    "groupId": 2,
                    "allowedIssuers": ["*"],
                    "context": "ipfs://QmQsMPq764m1A7X83DPzKq19pAEbmxsL2Suosy5u497rCP",
                    "type": "FinCred",
                    "credentialSubject": {
                        "deposit.drawingLimit": createBalanceQuery(query, value)
                    }
                }
            };
            request.body.scope.push(proofRequest as unknown as ZeroKnowledgeProofRequest);
        }
    }

    if (req.body?.insurance?.required === true) {
        const proofRequest = {
            "circuitId": "credentialAtomicQuerySigV2",
            "id": Date.now() + 7,
            "query": {
                "groupId": 3,
                "allowedIssuers": [
                    "*"
                ],
                "context": "ipfs://Qmehbcgt83MRN2w8mxgdCh31bNgZVX3bcnZGb6qZeY8Ahu",
                "type": "InsuranceCredential",
                "credentialSubject": {
                    "name": {}
                }
            }
        }
        request.body.scope.push(proofRequest);
        const proofRequest2 = {
            "circuitId": "credentialAtomicQuerySigV2",
            "id": Date.now() + 8,
            "query": {
                "groupId": 3,
                "allowedIssuers": [
                    "*"
                ],
                "context": "ipfs://Qmehbcgt83MRN2w8mxgdCh31bNgZVX3bcnZGb6qZeY8Ahu",
                "type": "InsuranceCredential",
                "credentialSubject": {
                    "pan": {}
                }
            }
        }
        request.body.scope.push(proofRequest2);

        // Sum Assured Check
        if (req.body.insurance.sumAssured) {
            const { query, value } = req.body.insurance.sumAssured;
            let sumAssuredQuery = {};

            switch (query) {
                case 'gt':
                    sumAssuredQuery = { "$gt": parseInt(value) };
                    break;
                case 'lt':
                    sumAssuredQuery = { "$lt": parseInt(value) };
                    break;
                case 'eq':
                    sumAssuredQuery = { "$eq": parseInt(value) };
                    break;
                default:
                    sumAssuredQuery = {};
            }

            const proofRequest3 = {
                "circuitId": "credentialAtomicQuerySigV2",
                "id": Date.now() + 9,
                "query": {
                    "groupId": 3,
                    "allowedIssuers": ["*"],
                    "context": "ipfs://Qmehbcgt83MRN2w8mxgdCh31bNgZVX3bcnZGb6qZeY8Ahu",
                    "type": "InsuranceCredential",
                    "credentialSubject": {
                        "sumAssured": sumAssuredQuery
                    }
                }
            };
            request.body.scope.push(proofRequest3);
        }

        // Policy Start Date Check
        if (req.body.insurance.policyStartDate?.required === true) {
            const proofRequest4 = {
                "circuitId": "credentialAtomicQuerySigV2",
                "id": Date.now() + 10,
                "query": {
                    "groupId": 3,
                    "allowedIssuers": ["*"],
                    "context": "ipfs://Qmehbcgt83MRN2w8mxgdCh31bNgZVX3bcnZGb6qZeY8Ahu",
                    "type": "InsuranceCredential",
                    "credentialSubject": {
                        "policyStartDate": {}
                    }
                }
            };
            request.body.scope.push(proofRequest4);
        }

        // Maturity Date Check
        if (req.body.insurance.maturityDate?.required === true) {
            const proofRequest5 = {
                "circuitId": "credentialAtomicQuerySigV2",
                "id": Date.now() + 11,
                "query": {
                    "groupId": 3,
                    "allowedIssuers": ["*"],
                    "context": "ipfs://Qmehbcgt83MRN2w8mxgdCh31bNgZVX3bcnZGb6qZeY8Ahu",
                    "type": "InsuranceCredential",
                    "credentialSubject": {
                        "maturityDate": {}
                    }
                }
            };
            request.body.scope.push(proofRequest5);
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
        const sessionId = req.query.sessionId;

        const raw = await getRawBody(req);
        const tokenStr = raw.toString().trim();

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
