// Database type definitions for the Career Assessment Platform

export type AppRole = 'admin' | 'user';

export interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  job_title: string | null;
  industry: string | null;
  career_goals: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  profile: Profile | null;
  roles: UserRole[];
}
