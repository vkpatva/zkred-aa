import { Router } from 'express';

import {
    getAuthRequest,
    callback,
    resolveShortUrl,
    getVerificationStatus
} from '../controllers/verifierController';

const router = Router();

router.post("/verify", getAuthRequest);
router.post("/callback", callback);
router.get("/short-url/:shortId", resolveShortUrl);
router.get('/verification/:verificationId', getVerificationStatus);

export default router;