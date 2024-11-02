export interface ProofRequest {
    circuitId: string;
    id: number;
    query: {
        allowedIssuers: string[];
        context: string;
        type: string;
        groupId: number;
        credentialSubject: {
            [key: string]: any;
        };
    };
} 