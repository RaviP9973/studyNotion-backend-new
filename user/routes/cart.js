import express from "express";
import { auth, isStudent } from "../middleware/auth.js";
import { addToCart, getCart, removeFromCart } from "../controllers/cart.js";

const router = express.Router();

router.post("/addToCart", auth, isStudent, addToCart);
router.get("/getCart", auth, isStudent, getCart);
router.delete("/removeFromCart", auth, isStudent, removeFromCart);

export default router;
