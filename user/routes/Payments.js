import express from "express";
const router = express.Router();

import { capturePayment, verifySignature, sendPaymentSuccessEmail } from "../controllers/Payments.js";
import { auth, isStudent } from "../middleware/auth.js";

import { paymentRateLimit } from "../middleware/rateLimit.js";

router.post("/capturePayment", auth, isStudent, paymentRateLimit, capturePayment);
router.post("/verifySignature",auth,isStudent, verifySignature)
router.post("/sendPaymentSuccessEmail",auth,isStudent,sendPaymentSuccessEmail)
export default router;
