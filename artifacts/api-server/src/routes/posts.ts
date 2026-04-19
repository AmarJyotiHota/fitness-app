import { Router } from "express";
import { requireAuthMiddleware, syncUserMiddleware } from "../middleware/auth.js";
import { getPosts, getMyPosts, createPostHandler } from "../controllers/post.controller.js";

const router = Router();

// Public route to fetch posts
router.get("/", getPosts);

// Protected route to fetch only my posts
router.get("/my-posts", requireAuthMiddleware, syncUserMiddleware, getMyPosts);

// Protected route to create post
router.post("/", requireAuthMiddleware, syncUserMiddleware, createPostHandler);

export default router;
