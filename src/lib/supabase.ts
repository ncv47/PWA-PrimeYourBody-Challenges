
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://yzrqvzrgofmxwrclkfmj.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6cnF2enJnb2ZteHdyY2xrZm1qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwODE5NTksImV4cCI6MjA4NDY1Nzk1OX0.KXX7-bLn6uzJaT2mdY-lakUb2Y6jh5nAi2DNKTz2PGE";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
