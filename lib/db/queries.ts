import { db } from "./index.js";
import { posts, users } from "./schema.js";
import { eq } from "drizzle-orm";

export async function getAllPosts(limit = 10, offset = 0) {
  return db
    .select({
      id: posts.id,
      title: posts.title,
      content: posts.content,
      published: posts.published,
      createdAt: posts.createdAt,
      authorId: posts.authorId,
    })
    .from(posts)
    .limit(limit)
    .offset(offset);
}

export async function getPostsByAuthor(authorId: string, limit = 10, offset = 0) {
  return db
    .select()
    .from(posts)
    .where(eq(posts.authorId, authorId))
    .limit(limit)
    .offset(offset);
}

export async function createPost(data: typeof posts.$inferInsert) {
  const [newPost] = await db.insert(posts).values(data).returning();
  return newPost;
}

export async function ensureUserExists(id: string, email: string, name?: string) {
  const [user] = await db
    .insert(users)
    .values({ id, email, name })
    .onConflictDoNothing()
    .returning();
    
  if (!user) {
    const existing = await db.select().from(users).where(eq(users.id, id));
    return existing[0];
  }
  return user;
}
