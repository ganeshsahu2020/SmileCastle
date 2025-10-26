// src/pages/admin/PunchHistory.jsx
import { useState, useEffect } from 'react'
import { supabase } from '../../utils/supabaseClient'
import { CalendarDays, ChevronDown } from 'lucide-react'

export default function PunchHistory() {
  const [punches, setPunches] = useState([])
  const [loading, setLoading] = useState(false)

  const loadPunches = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('punches')
      .select('*, users(name, employee_id)')
      .order('timestamp', { ascending: true })
    if (data) setPunches(data)
    setLoading(false)
  }

  useEffect(() => { loadPunches() }, [])

  const buildHierarchy = () => {
    const grouped = {}
    punches.forEach(p => {
      const ts = new Date(p.timestamp)
      const year = ts.getFullYear()
      const month = ts.toLocaleString('default', { month: 'long' })
      const week = `Week ${Math.ceil(ts.getDate() / 7)}`
      const day = ts.toLocaleDateString()
      grouped[year] ??= {}
      grouped[year][month] ??= {}
      grouped[year][month][week] ??= {}
      grouped[year][month][week][day] ??= []
      grouped[year][month][week][day].push(p)
    })
    return grouped
  }

  const hierarchy = buildHierarchy()

  const token = (type) =>
    type === 'IN'
      ? 'bg-emerald-100 text-emerald-900'
      : type === 'OUT'
      ? 'bg-rose-100 text-rose-900'
      : 'bg-amber-100 text-amber-900'

  const card =
    'rounded-2xl border border-white/20 bg-white/60 dark:bg-white/10 ' +
    'backdrop-blur-xl shadow-xl transition-all'

  return (
    <section className="space-y-6">
      <header className="flex items-center gap-2">
        <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 text-white shadow">
          <CalendarDays size={16} aria-hidden />
        </div>
        <h2 className="text-xl font-extrabold tracking-tight">Punch History (All Employees)</h2>
      </header>

      {loading ? (
        <p className="text-sm text-gray-600">Loading…</p>
      ) : Object.keys(hierarchy).length === 0 ? (
        <p className="text-sm text-gray-600">No punches recorded</p>
      ) : (
        <div className={`${card} p-4`}>
          {/* Use <details> for built-in a11y + keyboard support */}
          {Object.entries(hierarchy).map(([year, months]) => (
            <details key={year} className="mb-3 rounded-lg bg-white/50 p-2 open:shadow">
              <summary className="flex cursor-pointer items-center justify-between rounded-lg px-2 py-1 text-base font-semibold hover:bg-white/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-300">
                <span>📅 {year}</span>
                <ChevronDown size={16} aria-hidden />
              </summary>
              <div className="mt-2 space-y-2 pl-3">
                {Object.entries(months).map(([month, weeks]) => (
                  <details key={month} className="rounded-lg bg-white/50 p-2">
                    <summary className="flex cursor-pointer items-center justify-between rounded-lg px-2 py-1 font-semibold hover:bg-white/60">
                      <span>📆 {month}</span>
                      <ChevronDown size={16} aria-hidden />
                    </summary>
                    <div className="mt-2 space-y-2 pl-3">
                      {Object.entries(weeks).map(([week, days]) => (
                        <details key={week} className="rounded-lg bg-white/50 p-2">
                          <summary className="flex cursor-pointer items-center justify-between rounded-lg px-2 py-1 hover:bg-white/60">
                            <span>🗓️ {week}</span>
                            <ChevronDown size={16} aria-hidden />
                          </summary>
                          <div className="mt-2 space-y-3 pl-3">
                            {Object.entries(days).map(([day, list]) => (
                              <div key={day} className="rounded-lg bg-white/40 p-2">
                                <h4 className="mb-1 text-sm font-semibold text-blue-700">{day}</h4>
                                <ul className="space-y-1">
                                  {list.map((p) => (
                                    <li key={p.id} className={`flex items-center gap-2 rounded px-2 py-1 text-sm ${token(p.punch_type)}`}>
                                      <span className="font-semibold">{p.users?.name}</span>
                                      <span className="opacity-70">({p.users?.employee_id})</span>
                                      <span className="opacity-70">•</span>
                                      <span className="font-medium">{p.punch_type}</span>
                                      <span className="opacity-70">@ {new Date(p.timestamp).toLocaleTimeString()}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ))}
                          </div>
                        </details>
                      ))}
                    </div>
                  </details>
                ))}
              </div>
            </details>
          ))}
        </div>
      )}
    </section>
  )
}
