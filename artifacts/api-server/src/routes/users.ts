import { Router } from "express";
import { requireAuthMiddleware } from "../middleware/auth.js";

const router = Router();

// Protected route to get current user info from Supabase
router.get("/me", requireAuthMiddleware, (req, res) => {
  res.json({ userId: req.user?.id, email: req.user?.email });
});

export default router;
