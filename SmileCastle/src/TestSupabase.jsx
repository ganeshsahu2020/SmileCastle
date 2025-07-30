import { useEffect, useState } from 'react'
import { supabase } from './utils/supabaseClient'

export default function TestSupabase() {
  const [status, setStatus] = useState('Checking connection...')

  useEffect(() => {
    const check = async () => {
      const { data, error } = await supabase.from('test_table').select('*').limit(1)
      if (error) setStatus('❌ Supabase Error: ' + error.message)
      else setStatus('✅ Supabase Connected! Rows: ' + (data?.length || 0))
    }
    check()
  }, [])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-lg font-medium">
      {status}
    </div>
  )
}
