/**
 * Supabase Client for Frontend
 *
 * Used for authentication and real-time features
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Auth helpers
export const auth = {
  signUp: async (email: string, password: string) => {
    return supabase.auth.signUp({ email, password })
  },

  signIn: async (email: string, password: string) => {
    return supabase.auth.signInWithPassword({ email, password })
  },

  signOut: async () => {
    return supabase.auth.signOut()
  },

  getSession: async () => {
    return supabase.auth.getSession()
  },

  getUser: async () => {
    return supabase.auth.getUser()
  },

  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback)
  },
}

export default supabase
