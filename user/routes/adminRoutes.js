import express from "express";
import { auth, isAdmin } from "../middleware/auth.js";
import {
  getDashboardStats,
  getUsers,
  blockUser,
  unblockUser,
  updateCategory,
  deleteCategory
} from "../controllers/Admin.js";

const router = express.Router();

// Dashboard Stats
router.get("/dashboard-stats", auth, isAdmin, getDashboardStats);

// User Management (Students & Instructors)
router.get("/users", auth, isAdmin, getUsers);
router.put("/block-user", auth, isAdmin, blockUser);
router.put("/unblock-user", auth, isAdmin, unblockUser);

// Category Management (Create is in existing Category.js, we add Update/Delete here)
router.put("/update-category/:id", auth, isAdmin, updateCategory);
router.delete("/delete-category/:id", auth, isAdmin, deleteCategory);

export default router;