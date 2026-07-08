import express from "express";
const router = express.Router();

import { contactUs } from "../controllers/ContactUs.js";
import { contactUsRateLimit } from "../middleware/rateLimit.js";

router.post("/contactUs",contactUsRateLimit,contactUs);
export default router;