import { useState } from 'react'
import {
  BarChart, Bar, Cell, LineChart, Line, XAxis, YAxis, Tooltip, Legend,
  ReferenceLine, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import useSimStore from '../store/useSimStore'
import { downloadExcel } from '../api/client'
import { buildPayload, computeWacc } from '../utils/payload'

// ---- Formatter ----
const idFmt = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 })

function fmtPct(v) {
  if (v === null || v === undefined) return '–'
  return (v * 100).toFixed(2) + '%'
}

function Num({ value }) {
  if (value === null || value === undefined)
    return <span className="text-slate-400">–</span>
  const n = Number(value)
  const abs = idFmt.format(Math.abs(Math.round(n)))
  if (n < 0) return <span className="text-red-600">({abs})</span>
  return <span>{abs}</span>
}

// ---- Helper tahun aktif ----
function getActiveYears(r) {
  return r.years.filter((y) => {
    const cap = r.capex.total_per_tahun[y]
    const p = r.pnl[y]
    const f = r.financing.total_per_tahun[y]
    const c = r.cashflow[y]
    return (
      cap ||
      (p && (p.ap_revenue || p.opex || p.ebitda || p.depresiasi || p.bunga || p.eat)) ||
      (f && (f.drawdown || f.bunga || f.pokok || f.anuitas)) ||
      (c && (c.cfo || c.cfi || c.cff || c.net_cf))
    )
  })
}

// ---- Tabel generik per tahun ----
function YearTable({ years, rows }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse text-sm">
        <thead>
          <tr className="bg-laut-50">
            <th className="sticky left-0 z-10 border-b border-slate-200 bg-laut-50 px-3 py-2 text-left font-semibold text-laut-900">
              Pos
            </th>
            {years.map((y) => (
              <th key={y} className="border-b border-slate-200 px-3 py-2 text-right font-semibold text-laut-900">
                {y}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label} className={r.strong ? 'font-semibold' : ''}>
              <td className="sticky left-0 z-10 border-b border-slate-100 bg-white px-3 py-1.5 text-left">
                {r.label}
              </td>
              {years.map((y) => (
                <td key={y} className="border-b border-slate-100 px-3 py-1.5 text-right tabular-nums">
                  <Num value={r.get(y)} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ---- Kartu metric ----
function MetricCard({ title, value, sub, tone = 'laut' }) {
  const border =
    tone === 'hijau' ? 'border-t-mangrove-600'
    : tone === 'merah' ? 'border-t-red-500'
    : 'border-t-laut-700'
  const color =
    tone === 'hijau' ? 'text-mangrove-600'
    : tone === 'merah' ? 'text-red-600'
    : 'text-laut-900'
  return (
    <div className={'rounded-xl border border-slate-200 border-t-4 bg-white p-4 shadow-sm ' + border}>
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {title}
      </div>
      <div className={'mt-1 text-2xl font-bold ' + color}>{value}</div>
      {sub && <div className="mt-0.5 text-xs text-slate-400">{sub}</div>}
    </div>
  )
}

const DETAIL_TABS = ['Arus Kas', 'P&L', 'Capex', 'Pembiayaan', 'DSCR']

export default function ResultsPage() {
  const results = useSimStore((s) => s.results)
  const assumptions = useSimStore((s) => s.assumptions)
  const setActivePage = useSimStore((s) => s.setActivePage)

  const [tab, setTab] = useState('Arus Kas')
  const [showAll, setShowAll] = useState(false)
  const [downloading, setDownloading] = useState(false)

  if (!results) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
        <p className="text-lg text-slate-600">
          Belum ada simulasi. Silakan isi asumsi dulu.
        </p>
        <button
          type="button"
          onClick={() => setActivePage('input')}
          className="rounded-lg bg-laut-700 px-5 py-2 text-sm font-semibold text-white hover:bg-laut-900"
        >
          ← Ke Input Asumsi
        </button>
      </div>
    )
  }

  const r = results
  const wacc = computeWacc(assumptions)
  const tahunAwal = r.years[0]
  const m = r.metrics

  const activeYears = getActiveYears(r)
  const capexYears = r.years.filter((y) => r.capex.total_per_tahun[y] > 0)

  const finYearsSet = new Set()
  Object.values(r.financing.per_komponen).forEach((obj) =>
    Object.keys(obj).forEach((y) => finYearsSet.add(Number(y)))
  )
  const finYears = [...finYearsSet].sort((a, b) => a - b)

  const handleDownload = async () => {
    setDownloading(true)
    try {
      const res = await downloadExcel(buildPayload(assumptions))
      const url = URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.download = 'Simulasi_KPBU_AP.xlsx'
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } finally {
      setDownloading(false)
    }
  }

  // ---- Baris tabel per tab ----
  const arusKasRows = [
    { label: 'AP Revenue', get: (y) => r.pnl[y].ap_revenue },
    { label: 'Opex', get: (y) => r.pnl[y].opex },
    { label: 'Pajak', get: (y) => r.pnl[y].pajak },
    { label: 'CFO', get: (y) => r.cashflow[y].cfo, strong: true },
    { label: 'Investasi', get: (y) => r.cashflow[y].cfi },
    { label: 'Drawdown', get: (y) => r.financing.total_per_tahun[y].drawdown },
    { label: 'Cicilan', get: (y) => -(r.financing.total_per_tahun[y].pokok + r.financing.total_per_tahun[y].bunga) },
    { label: 'Setoran Ekuitas', get: (y) => r.financing.total_ekuitas_per_tahun[y] },
    { label: 'CFF', get: (y) => r.cashflow[y].cff, strong: true },
    { label: 'Net Cash Flow', get: (y) => r.cashflow[y].net_cf, strong: true },
    { label: 'Kas Akhir', get: (y) => r.cashflow[y].kas_akhir },
    { label: 'FCFP', get: (y) => r.cashflow[y].fcfp, strong: true },
    { label: 'FCFE', get: (y) => r.cashflow[y].fcfe, strong: true },
  ]

  const pnlRows = [
    { label: 'AP Revenue', get: (y) => r.pnl[y].ap_revenue },
    { label: 'Opex', get: (y) => r.pnl[y].opex },
    { label: 'EBITDA', get: (y) => r.pnl[y].ebitda, strong: true },
    { label: 'Depresiasi', get: (y) => r.pnl[y].depresiasi },
    { label: 'EBIT', get: (y) => r.pnl[y].ebit, strong: true },
    { label: 'Bunga', get: (y) => r.pnl[y].bunga },
    { label: 'EBT', get: (y) => r.pnl[y].ebt, strong: true },
    { label: 'Pajak', get: (y) => r.pnl[y].pajak },
    { label: 'EAT', get: (y) => r.pnl[y].eat, strong: true },
  ]

  const capexRows = [
    ...Object.entries(r.capex.per_komponen).map(([nama, perTahun]) => ({
      label: nama,
      get: (y) => perTahun[y]?.total ?? 0,
    })),
    { label: 'Total', get: (y) => r.capex.total_per_tahun[y], strong: true },
  ]

  const pembiayaanRows = [
    { label: 'Drawdown', get: (y) => r.financing.total_per_tahun[y].drawdown },
    {
      label: 'Saldo Pinjaman',
      get: (y) =>
        Object.values(r.financing.per_komponen).reduce(
          (s, obj) => s + (obj[y]?.saldo_akhir ?? 0),
          0
        ),
    },
    { label: 'Bunga', get: (y) => r.financing.total_per_tahun[y].bunga },
    { label: 'Pokok', get: (y) => r.financing.total_per_tahun[y].pokok },
    { label: 'Anuitas', get: (y) => r.financing.total_per_tahun[y].anuitas, strong: true },
  ]

  const dscrData = activeYears
    .filter((y) => r.cashflow[y].dscr !== null && r.cashflow[y].dscr !== undefined)
    .map((y) => ({ tahun: y, dscr: r.cashflow[y].dscr }))

  const cumData = activeYears.map((y) => ({
    tahun: y,
    fcfp: m.fcfp_kumulatif[y],
    fcfe: m.fcfe_kumulatif[y],
  }))

  const dscrColor = (v) => (v >= 1.2 ? '#1B7A5A' : v >= 1.0 ? '#eab308' : '#dc2626')

  const arusKasYears = showAll ? activeYears : activeYears.slice(0, 30)

  const irrP = m.irr_proyek
  const npv = m.npv_proyek
  const paybackDurasi =
    m.payback_proyek_tahun != null ? m.payback_proyek_tahun - tahunAwal : null

  return (
    <div>
      {/* Kartu metrics */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="IRR Proyek"
          value={fmtPct(irrP)}
          sub={`WACC ${fmtPct(wacc)}`}
          tone={irrP != null && irrP > wacc ? 'hijau' : 'merah'}
        />
        <MetricCard title="IRR Ekuitas" value={fmtPct(m.irr_ekuitas)} />
        <MetricCard
          title="NPV Proyek (Rp Juta)"
          value={<Num value={npv} />}
          tone={npv >= 0 ? 'hijau' : 'merah'}
        />
        <MetricCard
          title="Payback Proyek"
          value={paybackDurasi != null ? `${paybackDurasi} tahun` : 'Tidak tercapai'}
          sub={m.payback_proyek_tahun != null ? `tahun ${m.payback_proyek_tahun}` : null}
        />
      </div>

      {/* Aksi */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleDownload}
          disabled={downloading}
          className="rounded-lg bg-mangrove-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-mangrove-700 disabled:bg-mangrove-600/60"
        >
          {downloading ? 'Mengunduh…' : '⬇ Download Excel'}
        </button>
        <button
          type="button"
          onClick={() => setActivePage('input')}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          ✏️ Ubah Asumsi
        </button>
      </div>

      {/* Tab detail */}
      <div className="mb-2 flex flex-wrap gap-2 border-b border-slate-200">
        {DETAIL_TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={
              '-mb-px border-b-2 px-4 py-2 text-sm font-medium ' +
              (tab === t
                ? 'border-laut-700 text-laut-900'
                : 'border-transparent text-slate-500 hover:text-slate-700')
            }
          >
            {t}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        {tab === 'Arus Kas' && (
          <div className="space-y-3">
            <div className="flex justify-end">
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={showAll}
                  onChange={(e) => setShowAll(e.target.checked)}
                />
                Tampilkan semua tahun
              </label>
            </div>
            <YearTable years={arusKasYears} rows={arusKasRows} />
          </div>
        )}
        {tab === 'P&L' && <YearTable years={activeYears} rows={pnlRows} />}
        {tab === 'Capex' && <YearTable years={capexYears} rows={capexRows} />}
        {tab === 'Pembiayaan' && <YearTable years={finYears} rows={pembiayaanRows} />}
        {tab === 'DSCR' && (
          <div className="h-96 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dscrData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="tahun" />
                <YAxis />
                <Tooltip formatter={(v) => Number(v).toFixed(2)} />
                <ReferenceLine y={1.2} stroke="#eab308" strokeDasharray="4 4" label="1.2" />
                <ReferenceLine y={1.0} stroke="#dc2626" strokeDasharray="4 4" label="1.0" />
                <Bar dataKey="dscr">
                  {dscrData.map((d) => (
                    <Cell key={d.tahun} fill={dscrColor(d.dscr)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* FCFP vs FCFE kumulatif */}
      <div className="mt-8">
        <h2 className="mb-3 text-lg font-semibold text-laut-900">
          FCFP vs FCFE Kumulatif
        </h2>
        <div className="h-96 w-full rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={cumData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="tahun" />
              <YAxis tickFormatter={(v) => idFmt.format(v)} width={80} />
              <Tooltip formatter={(v) => idFmt.format(Math.round(v))} />
              <Legend />
              <ReferenceLine y={0} stroke="#374151" />
              <Line type="monotone" dataKey="fcfp" name="FCFP Kumulatif" stroke="#1F5E8C" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="fcfe" name="FCFE Kumulatif" stroke="#1B7A5A" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
