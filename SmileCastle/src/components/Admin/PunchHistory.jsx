import { useState, useEffect } from 'react'
import { supabase } from '../../utils/supabaseClient'

export default function PunchHistory() {
  const [punches, setPunches] = useState([])
  const [expanded, setExpanded] = useState({})
  const [loading, setLoading] = useState(false)

  const toggle = (key) => {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const loadPunches = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('punches')
      .select('*, users(name, employee_id)')
      .order('timestamp', { ascending: true })
    if (data) setPunches(data)
    setLoading(false)
  }

  const buildHierarchy = () => {
    const grouped = {}
    punches.forEach(p => {
      const ts = new Date(p.timestamp)
      const year = ts.getFullYear()
      const month = ts.toLocaleString('default', { month: 'long' })
      const week = `Week ${Math.ceil(ts.getDate() / 7)}`
      const day = ts.toLocaleDateString()

      if (!grouped[year]) grouped[year] = {}
      if (!grouped[year][month]) grouped[year][month] = {}
      if (!grouped[year][month][week]) grouped[year][month][week] = {}
      if (!grouped[year][month][week][day]) grouped[year][month][week][day] = []

      grouped[year][month][week][day].push(p)
    })
    return grouped
  }

  const punchIcon = (type) => type === 'IN' ? '🟢' : type === 'OUT' ? '🔴' : '☕'
  const punchClass = (type) =>
    type === 'IN' ? 'bg-green-100 text-green-900 px-2 py-1 rounded'
    : type === 'OUT' ? 'bg-red-100 text-red-900 px-2 py-1 rounded'
    : 'bg-yellow-100 text-yellow-900 px-2 py-1 rounded'

  useEffect(() => { loadPunches() }, [])
  const hierarchy = buildHierarchy()

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4 text-blue-600">Punch History (All Employees)</h2>
      {loading ? <p>Loading...</p> : Object.keys(hierarchy).length === 0 ? (
        <p className="text-gray-500">No punches recorded</p>
      ) : (
        Object.entries(hierarchy).map(([year, months]) => (
          <div key={year}>
            <div onClick={() => toggle(year)} className="bg-gray-700 text-white p-2 cursor-pointer rounded">📅 {year}</div>
            {expanded[year] && Object.entries(months).map(([month, weeks]) => (
              <div key={month} className="ml-4">
                <div onClick={() => toggle(`${year}-${month}`)} className="bg-gray-600 text-white p-2 cursor-pointer rounded">📆 {month}</div>
                {expanded[`${year}-${month}`] && Object.entries(weeks).map(([week, days]) => (
                  <div key={week} className="ml-6">
                    <div onClick={() => toggle(`${year}-${month}-${week}`)} className="bg-gray-500 text-white p-2 cursor-pointer rounded">🗓️ {week}</div>
                    {expanded[`${year}-${month}-${week}`] && Object.entries(days).map(([day, punchList]) => (
                      <div key={day} className="ml-8">
                        <h4 className="text-blue-600 font-medium">{day}</h4>
                        <ul className="ml-3 space-y-1">
                          {punchList.map(p => (
                            <li key={p.id} className={`flex items-center gap-2 text-sm ${punchClass(p.punch_type)}`}>
                              <span>{punchIcon(p.punch_type)}</span>
                              <strong>{p.users?.name}</strong> ({p.users?.employee_id}) – {p.punch_type} @ {new Date(p.timestamp).toLocaleTimeString()}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ))}
          </div>
        ))
      )}
    </div>
  )
}
