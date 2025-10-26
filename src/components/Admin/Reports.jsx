// src/pages/admin/Reports.jsx
import { useState, useEffect } from 'react'
import { supabase } from '../../utils/supabaseClient'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import { BarChart3, Download, CalendarRange, Filter } from 'lucide-react'

export default function Reports() {
  const [report, setReport] = useState([])
  const [employees, setEmployees] = useState([])
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedEmployees, setSelectedEmployees] = useState([])
  const [loadingReport, setLoadingReport] = useState(false)

  const loadEmployees = async () => {
    const { data } = await supabase.from('users').select('id,name').order('name', { ascending: true })
    if (data) setEmployees(data)
  }
  useEffect(() => { loadEmployees() }, [])

  const generateDailyReport = async () => {
    setLoadingReport(true)
    const { data, error } = await supabase.rpc('generate_daily_report')
    setLoadingReport(false)
    if (error) return alert('Daily report failed: ' + error.message)
    setReport(data || [])
  }

  const generateBiweeklyReport = async () => {
    setLoadingReport(true)
    const { data, error } = await supabase.rpc('generate_biweekly_report')
    setLoadingReport(false)
    if (error) return alert('Biweekly report failed: ' + error.message)
    setReport(data || [])
  }

  const generateCustomReport = async () => {
    if (!startDate || !endDate) return alert('Select both start and end dates')
    setLoadingReport(true)
    const { data, error } = await supabase.rpc('generate_custom_report', {
      start_date: startDate,
      end_date: endDate,
      employee_ids: selectedEmployees.length > 0 ? selectedEmployees : null
    })
    setLoadingReport(false)
    if (error) return alert('Custom report failed: ' + error.message)
    setReport(data || [])
  }

  const downloadCSV = () => {
    if (!report || report.length === 0) return alert('No data to export')
    const headers = ['Name', 'Worked Hours', 'Break Hours', 'Total Hours']
    const rows = report.map(r => [r.name, r.worked_hours || 0, r.break_hours || 0, r.total_hours || 0])
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.setAttribute('download', 'report.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const downloadPDF = () => {
    if (!report || report.length === 0) return alert('No data to export')
    const doc = new jsPDF()
    doc.text('Report', 14, 15)
    const headers = [['Name', 'Worked Hours', 'Break Hours', 'Total Hours']]
    const rows = report.map(r => [r.name, r.worked_hours || 0, r.break_hours || 0, r.total_hours || 0])
    doc.autoTable({ head: headers, body: rows, startY: 25 })
    doc.save('report.pdf')
  }

  const toggleEmployeeSelect = (id) => {
    setSelectedEmployees(prev => prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id])
  }

  const card =
    'rounded-2xl border border-white/20 bg-white/60 dark:bg-white/10 ' +
    'backdrop-blur-xl shadow-xl transition-all'

  const btn =
    'inline-flex items-center gap-2 rounded-xl px-3 py-2 font-semibold transition-all ' +
    'focus-visible:outline-none focus-visible:ring-2'

  return (
    <section className="space-y-6">
      <header className="flex items-center gap-2">
        <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 text-white shadow">
          <BarChart3 size={16} aria-hidden />
        </div>
        <h2 className="text-xl font-extrabold tracking-tight text-gray-900 dark:text-white">Reports</h2>
      </header>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        <button onClick={generateDailyReport} className={`${btn} bg-indigo-600 text-white focus-visible:ring-indigo-300`} aria-label="Generate daily report">
          <CalendarRange size={16} aria-hidden />
          Daily
        </button>
        <button onClick={generateBiweeklyReport} className={`${btn} bg-violet-600 text-white focus-visible:ring-violet-300`} aria-label="Generate biweekly report">
          <CalendarRange size={16} aria-hidden />
          Biweekly
        </button>
        <button onClick={downloadCSV} className={`${btn} bg-white/70`} aria-label="Export CSV">
          <Download size={16} aria-hidden />
          CSV
        </button>
        <button onClick={downloadPDF} className={`${btn} bg-white/70`} aria-label="Export PDF">
          <Download size={16} aria-hidden />
          PDF
        </button>
      </div>

      {/* Custom Report */}
      <div className={`${card} p-5`}>
        <div className="mb-3 flex items-center gap-2">
          <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 text-white shadow">
            <Filter size={16} aria-hidden />
          </div>
          <h3 className="text-lg font-bold">Custom Report</h3>
        </div>

        <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="sr-only">Start date</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-xl border border-white/30 bg-white/70 px-3 py-2 shadow-sm outline-none backdrop-blur-md focus:ring-2 focus:ring-emerald-300"
            />
          </label>
          <label className="block">
            <span className="sr-only">End date</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-xl border border-white/30 bg-white/70 px-3 py-2 shadow-sm outline-none backdrop-blur-md focus:ring-2 focus:ring-emerald-300"
            />
          </label>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {employees.map((emp) => {
            const active = selectedEmployees.includes(emp.id)
            return (
              <button
                key={emp.id}
                onClick={() => toggleEmployeeSelect(emp.id)}
                className={`rounded-full border px-3 py-1 text-sm transition-all focus-visible:outline-none focus-visible:ring-2 ${active ? 'border-emerald-400 bg-emerald-100 text-emerald-900' : 'border-white/30 bg-white/60'}`}
                aria-pressed={active}
                aria-label={`Select ${emp.name}`}
              >
                {emp.name}
              </button>
            )
          })}
        </div>

        <button onClick={generateCustomReport} className={`${btn} bg-emerald-600 text-white focus-visible:ring-emerald-300`}>
          {loadingReport ? 'Generating…' : 'Generate Custom'}
        </button>
      </div>

      {/* Table */}
      <div className={`${card} p-5`}>
        {loadingReport ? (
          <p className="text-sm text-gray-600">Loading report…</p>
        ) : report.length > 0 ? (
          <div className="overflow-x-auto rounded-xl">
            <table className="min-w-full text-sm">
              <thead className="bg-white/60 backdrop-blur-md text-left">
                <tr>
                  <th className="p-2">Name</th>
                  <th className="p-2">Worked Hours</th>
                  <th className="p-2">Break Hours</th>
                  <th className="p-2">Total Hours</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/20">
                {report.map((r, idx) => (
                  <tr key={idx} className="hover:bg-white/40">
                    <td className="p-2">{r.name}</td>
                    <td className="p-2">{r.worked_hours || 0}</td>
                    <td className="p-2">{r.break_hours || 0}</td>
                    <td className="p-2 font-semibold">{r.total_hours || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-600">No report generated yet.</p>
        )}
      </div>
    </section>
  )
}
