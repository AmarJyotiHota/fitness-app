import type { Request, Response, NextFunction } from "express";
import { getAllPosts, getPostsByAuthor, createPost } from "@workspace/db/queries";
import { insertPostSchema } from "@workspace/db/schema";
import { z } from "zod";

export const getPosts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    const posts = await getAllPosts(limit, offset);
    res.json({ data: posts, page, limit });
  } catch (error) {
    next(error);
  }
};

export const getMyPosts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user || !req.user.id) throw new Error("Unauthorized");
    const authorId = req.user.id;
    
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    const posts = await getPostsByAuthor(authorId, limit, offset);
    res.json({ data: posts, page, limit });
  } catch (error) {
    next(error);
  }
};

export const createPostHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user || !req.user.id) throw new Error("Unauthorized");
    const authorId = req.user.id;
    
    // Validate request body
    const validatedData = insertPostSchema
      .omit({ authorId: true, id: true, createdAt: true })
      .parse(req.body);
    
    const post = await createPost({
      ...validatedData,
      authorId,
    });
    
    res.status(201).json(post);
  } catch (error) {
    if (error instanceof z.ZodError) {
       res.status(400).json({ error: "Validation Error", details: error.errors });
       return;
    }
    next(error);
  }
};
