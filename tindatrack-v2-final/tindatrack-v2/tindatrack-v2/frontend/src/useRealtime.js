import { useEffect } from 'react'
import { supabase } from './supabase'

// Call this in any page to auto-refresh when DB changes on any device
// table: 'paninda' | 'sales' | 'utangs'
// onUpdate: callback function to re-fetch data
export function useRealtime(table, onUpdate) {
  useEffect(() => {
    const channel = supabase
      .channel(`realtime:${table}`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, () => {
        onUpdate()
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [table, onUpdate])
}
