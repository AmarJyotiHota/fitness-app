import { createClient } from "@supabase/supabase-js";
import type { Request, Response, NextFunction } from "express";
import { ensureUserExists } from "@workspace/db/queries";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || "";

export const supabase = createClient(supabaseUrl, supabaseKey);

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: any; // Supabase user object
    }
  }
}

export const requireAuthMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ error: "Missing or invalid authorization header" });
      return;
    }

    const token = authHeader.split(" ")[1]!;
    
    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: "Unauthorized" });
  }
};

export const syncUserMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.user && req.user.id) {
      await ensureUserExists(req.user.id, req.user.email || `user-${req.user.id}@example.com`, req.user.user_metadata?.name || "Unknown User");
    }
    next();
  } catch (error) {
    next(error);
  }
};
