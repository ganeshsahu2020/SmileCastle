﻿import { createClient } from '@supabase/supabase-js'

// ✅ Use Vite environment variable
const supabaseUrl = 'https://hdhkvrkfkzeworrbzwcg.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)
