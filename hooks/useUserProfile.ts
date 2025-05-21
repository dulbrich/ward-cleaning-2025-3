"use client";

import { useEffect, useState } from "react";

export type UserProfile = {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  username: string;
  avatar_url: string;
  phone_number: string;
  is_phone_verified: boolean;
  has_accepted_terms: boolean;
  created_at: string;
  updated_at: string;
  role?: string;
};

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUserProfile() {
      try {
        setLoading(true);
        const response = await fetch('/api/user-profile');
        
        if (!response.ok) {
          throw new Error('Failed to fetch user profile');
        }
        
        const { data } = await response.json();
        setProfile(data);
      } catch (err) {
        console.error('Error fetching user profile:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchUserProfile();
  }, []);

  return { profile, loading, error };
} 