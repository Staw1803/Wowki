-- Schema for Capture The Flag (CTF) IoT Hacking Simulator

-- 1. Profiles Table (Extends Supabase Auth users)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    xp_points INTEGER DEFAULT 0 NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Challenges Table
CREATE TABLE public.challenges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    creator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    wokwi_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    secret_flag TEXT NOT NULL,
    difficulty TEXT CHECK (difficulty IN ('Easy', 'Medium', 'Hard')) DEFAULT 'Easy' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 3. Solves Table (Tracks completed challenges by users)
CREATE TABLE public.solves (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    challenge_id UUID REFERENCES public.challenges(id) ON DELETE CASCADE NOT NULL,
    solved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    CONSTRAINT unique_user_challenge_solve UNIQUE (user_id, challenge_id)
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solves ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies

-- Profiles Policies
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Challenges Policies
CREATE POLICY "Challenges are viewable by everyone" 
ON public.challenges FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create challenges" 
ON public.challenges FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Creators can update or delete their own challenges" 
ON public.challenges FOR UPDATE USING (auth.uid() = creator_id);

-- Solves Policies
CREATE POLICY "Solves are viewable by everyone" 
ON public.solves FOR SELECT USING (true);

CREATE POLICY "Authenticated users can submit solves" 
ON public.solves FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Real-time updates configurations (optional)
alter publication supabase_realtime add table public.challenges;
alter publication supabase_realtime add table public.solves;
alter publication supabase_realtime add table public.profiles;
