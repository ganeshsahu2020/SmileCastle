import { useState, useEffect } from 'react'
import { supabase } from '../../utils/supabaseClient'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

export default function Reports() {
  const [report, setReport] = useState([])
  const [employees, setEmployees] = useState([])
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedEmployees, setSelectedEmployees] = useState([])
  const [loadingReport, setLoadingReport] = useState(false)

  // ✅ Load Employees for custom filtering
  const loadEmployees = async () => {
    const { data } = await supabase.from('users').select('id,name').order('name', { ascending: true })
    if (data) setEmployees(data)
  }

  useEffect(() => { loadEmployees() }, [])

  // ✅ Reports Functions
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

  // ✅ CSV Export
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

  // ✅ PDF Export
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
    setSelectedEmployees(prev =>
      prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
    )
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4 text-green-600">Reports</h2>

      {/* Report Buttons */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button onClick={generateDailyReport} className="bg-purple-600 text-white px-3 py-2 rounded">Daily Report</button>
        <button onClick={generateBiweeklyReport} className="bg-indigo-600 text-white px-3 py-2 rounded">Biweekly Report</button>
        <button onClick={downloadCSV} className="bg-gray-700 text-white px-3 py-2 rounded">Export CSV</button>
        <button onClick={downloadPDF} className="bg-gray-800 text-white px-3 py-2 rounded">Export PDF</button>
      </div>

      {/* Custom Report Section */}
      <div className="p-3 rounded border mb-4 bg-gray-50">
        <h3 className="font-semibold mb-2">Custom Report</h3>
        <div className="flex flex-col sm:flex-row gap-3 mb-3">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="p-2 rounded border flex-1"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="p-2 rounded border flex-1"
          />
        </div>
        <div className="flex flex-wrap gap-2 mb-2">
          {employees.map(emp => (
            <label key={emp.id} className="flex items-center gap-1 text-sm">
              <input
                type="checkbox"
                checked={selectedEmployees.includes(emp.id)}
                onChange={() => toggleEmployeeSelect(emp.id)}
              />
              {emp.name}
            </label>
          ))}
        </div>
        <button onClick={generateCustomReport} className="bg-blue-600 text-white px-4 py-2 rounded">
          {loadingReport ? 'Generating...' : 'Generate Custom'}
        </button>
      </div>

      {/* Report Table */}
      <div>
        {loadingReport ? (
          <p className="text-sm text-gray-400">Loading report...</p>
        ) : report.length > 0 ? (
          <table className="w-full text-sm border mt-2">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border">Name</th>
                <th className="p-2 border">Worked Hours</th>
                <th className="p-2 border">Break Hours</th>
                <th className="p-2 border">Total Hours</th>
              </tr>
            </thead>
            <tbody>
              {report.map((r, idx) => (
                <tr key={idx}>
                  <td className="p-2 border">{r.name}</td>
                  <td className="p-2 border">{r.worked_hours || 0}</td>
                  <td className="p-2 border">{r.break_hours || 0}</td>
                  <td className="p-2 border font-semibold">{r.total_hours || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-gray-400">No report generated yet.</p>
        )}
      </div>
    </div>
  )
}
