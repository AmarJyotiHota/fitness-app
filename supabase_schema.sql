-- 1. Create Tables
CREATE TABLE users (
  id text PRIMARY KEY,
  email text UNIQUE NOT NULL,
  name text,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE posts (
  id serial PRIMARY KEY,
  title text NOT NULL,
  content text,
  author_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  published boolean NOT NULL DEFAULT false,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE activities (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  steps integer NOT NULL,
  calories_burned integer NOT NULL,
  date text NOT NULL,
  note text,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE food_logs (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  food_name text NOT NULL,
  calories integer NOT NULL,
  image_base64 text,
  protein integer,
  carbs integer,
  fat integer,
  meal_type text,
  date text NOT NULL,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE water_logs (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount integer NOT NULL,
  date text NOT NULL,
  time text NOT NULL,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE goals (
  user_id text PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  daily_steps integer NOT NULL DEFAULT 10000,
  daily_calories_burned integer NOT NULL DEFAULT 500,
  daily_calories_consumed integer NOT NULL DEFAULT 2000
);

-- Indexes
CREATE INDEX author_id_idx ON posts(author_id);
CREATE INDEX activities_user_id_idx ON activities(user_id);
CREATE INDEX food_logs_user_id_idx ON food_logs(user_id);

-- 2. Enable RLS (Supabase Security Best Practice)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE water_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies
-- Users can read and update their own profile
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid()::text = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid()::text = id);

-- Posts
CREATE POLICY "Users can view own posts" ON posts FOR SELECT USING (auth.uid()::text = author_id);
CREATE POLICY "Users can insert own posts" ON posts FOR INSERT WITH CHECK (auth.uid()::text = author_id);
CREATE POLICY "Users can update own posts" ON posts FOR UPDATE USING (auth.uid()::text = author_id);
CREATE POLICY "Users can delete own posts" ON posts FOR DELETE USING (auth.uid()::text = author_id);

-- Activities
CREATE POLICY "Users can view own activities" ON activities FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "Users can insert own activities" ON activities FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "Users can update own activities" ON activities FOR UPDATE USING (auth.uid()::text = user_id);
CREATE POLICY "Users can delete own activities" ON activities FOR DELETE USING (auth.uid()::text = user_id);

-- Food Logs
CREATE POLICY "Users can view own food logs" ON food_logs FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "Users can insert own food logs" ON food_logs FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "Users can update own food logs" ON food_logs FOR UPDATE USING (auth.uid()::text = user_id);
CREATE POLICY "Users can delete own food logs" ON food_logs FOR DELETE USING (auth.uid()::text = user_id);

-- Water Logs
CREATE POLICY "Users can view own water logs" ON water_logs FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "Users can insert own water logs" ON water_logs FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "Users can update own water logs" ON water_logs FOR UPDATE USING (auth.uid()::text = user_id);
CREATE POLICY "Users can delete own water logs" ON water_logs FOR DELETE USING (auth.uid()::text = user_id);

-- Goals
CREATE POLICY "Users can view own goals" ON goals FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "Users can insert own goals" ON goals FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "Users can update own goals" ON goals FOR UPDATE USING (auth.uid()::text = user_id);
CREATE POLICY "Users can delete own goals" ON goals FOR DELETE USING (auth.uid()::text = user_id);
