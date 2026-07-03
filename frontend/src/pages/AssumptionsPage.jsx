import { useState } from 'react'
import useSimStore from '../store/useSimStore'
import { runSimulation } from '../api/client'
import { buildPayload } from '../utils/payload'

// Tampilkan desimal sebagai persen tanpa galat floating point (0.03 -> 3)
const toPct = (v) => Math.round((v ?? 0) * 1e8) / 1e6

const inputCls =
  'mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm ' +
  'focus:border-laut-700 focus:ring-1 focus:ring-laut-700 outline-none bg-white'

const cellCls =
  'w-full rounded border border-slate-300 px-2 py-1 text-sm ' +
  'focus:border-laut-700 focus:ring-1 focus:ring-laut-700 outline-none bg-white'

function Section({ kode, judul, children, mangrove }) {
  return (
    <section
      className={
        'mb-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm border-t-4 ' +
        (mangrove ? 'border-t-mangrove-600' : 'border-t-laut-700')
      }
    >
      <h2 className="mb-4 text-base font-bold text-laut-900">
        <span className="mr-2 rounded-md bg-laut-50 px-2 py-0.5 text-sm text-laut-700">
          {kode}
        </span>
        {judul}
      </h2>
      {children}
    </section>
  )
}

function Field({ label, children }) {
  return (
    <label className="flex flex-col">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </span>
      {children}
    </label>
  )
}

export default function AssumptionsPage() {
  const [error, setError] = useState(null)

  const a = useSimStore((s) => s.assumptions)
  const setAssumptions = useSimStore((s) => s.setAssumptions)
  const addKomponen = useSimStore((s) => s.addKomponen)
  const removeKomponen = useSimStore((s) => s.removeKomponen)
  const isLoading = useSimStore((s) => s.isLoading)
  const setLoading = useSimStore((s) => s.setLoading)
  const setResults = useSimStore((s) => s.setResults)
  const setActivePage = useSimStore((s) => s.setActivePage)

  const setPct = (key) => (e) => setAssumptions({ [key]: Number(e.target.value) / 100 })
  const setNum = (key) => (e) => setAssumptions({ [key]: Number(e.target.value) })

  const updateKomponen = (i, field, value) => {
    const komponen = a.komponen.map((k, idx) =>
      idx === i ? { ...k, [field]: value } : k
    )
    setAssumptions({ komponen })
  }

  const handleSubmit = async () => {
    setError(null)
    if (a.komponen.length === 0) {
      setError('Tambahkan minimal satu komponen pada bagian E.')
      return
    }
    setLoading(true)
    try {
      const res = await runSimulation(buildPayload(a))
      setResults(res.data)
      setActivePage('results')
    } catch (e) {
      const detail = e?.response?.data?.detail || e?.message || 'Terjadi kesalahan.'
      setError(typeof detail === 'string' ? detail : JSON.stringify(detail))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {/* A. General */}
      <Section kode="A" judul="General Project Assumptions">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Tahun Awal">
            <input type="number" className={inputCls} value={a.tahun_awal}
              onChange={setNum('tahun_awal')} />
          </Field>
          <Field label="Inflasi (%)">
            <input type="number" step="0.1" className={inputCls} value={toPct(a.inflasi)}
              onChange={setPct('inflasi')} />
          </Field>
          <Field label="Bunga (%)">
            <input type="number" step="0.01" className={inputCls} value={toPct(a.bunga)}
              onChange={setPct('bunga')} />
          </Field>
          <Field label="WACC (%)">
            <input type="number" step="0.001" className={inputCls} value={toPct(a.wacc)}
              onChange={setPct('wacc')} />
          </Field>
          <Field label="PPN (%)">
            <input type="number" step="0.1" className={inputCls} value={toPct(a.ppn)}
              onChange={setPct('ppn')} />
          </Field>
          <Field label="PPh Badan (%)">
            <input type="number" step="0.1" className={inputCls} value={toPct(a.pph_badan)}
              onChange={setPct('pph_badan')} />
          </Field>
          <Field label="Kurs (IDR/USD)">
            <input type="number" className={inputCls} value={a.kurs}
              onChange={setNum('kurs')} />
          </Field>
          <Field label="Porsi Ekuitas (%)">
            <input type="number" step="1" className={inputCls} value={toPct(a.porsi_ekuitas)}
              onChange={(e) => {
                const v = Number(e.target.value) / 100
                setAssumptions({ porsi_ekuitas: v, porsi_pinjaman: 1 - v })
              }} />
          </Field>
          <Field label="Masa Pinjaman (tahun)">
            <input type="number" step="1" className={inputCls} value={a.masa_pinjaman}
              onChange={setNum('masa_pinjaman')} />
          </Field>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Porsi Loan otomatis = {(100 - toPct(a.porsi_ekuitas)).toFixed(0)}%
        </p>
      </Section>

      {/* B. Capex */}
      <Section kode="B" judul="Capex Assumptions">
        <p className="mb-3 text-xs text-slate-500">
          Soft cost & fee (% dari biaya konstruksi / pinjaman)
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Biaya Konsultan Perencana (%)">
            <input type="number" step="0.01" className={inputCls}
              value={toPct(a.biaya_perencana)} onChange={setPct('biaya_perencana')} />
          </Field>
          <Field label="Biaya Konsultan Pengawas (%)">
            <input type="number" step="0.01" className={inputCls}
              value={toPct(a.biaya_supervisi)} onChange={setPct('biaya_supervisi')} />
          </Field>
          <Field label="Biaya Overhead (%)">
            <input type="number" step="0.01" className={inputCls}
              value={toPct(a.biaya_overhead)} onChange={setPct('biaya_overhead')} />
          </Field>
          <Field label="Biaya Eskalasi (%)">
            <input type="number" step="0.01" className={inputCls}
              value={toPct(a.biaya_eskalasi)} onChange={setPct('biaya_eskalasi')} />
          </Field>
          <Field label="Financial Fee (%)">
            <input type="number" step="0.01" className={inputCls}
              value={toPct(a.financial_fee)} onChange={setPct('financial_fee')} />
          </Field>
          <Field label="Upfront Fee PT PII (%)">
            <input type="number" step="0.01" className={inputCls}
              value={toPct(a.upfront_fee)} onChange={setPct('upfront_fee')} />
          </Field>
        </div>
        <p className="mb-3 mt-5 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Skema KPBU-AP
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="AP Konsesi (tahun)">
            <input type="number" step="1" className={inputCls} value={a.ap_konsesi}
              onChange={setNum('ap_konsesi')} />
          </Field>
          <Field label="AP Coverage">
            <select className={inputCls} value={a.ap_coverage}
              onChange={(e) => setAssumptions({ ap_coverage: Number(e.target.value) })}>
              <option value={1}>Capex + Opex (100%)</option>
              <option value={0.9999}>Capex Only</option>
            </select>
          </Field>
        </div>
      </Section>

      {/* C. Opex */}
      <Section kode="C" judul="Opex Assumptions">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Biaya O&M (% capex / tahun)">
            <input type="number" step="0.1" className={inputCls}
              value={toPct(a.biaya_om_persen)} onChange={setPct('biaya_om_persen')} />
          </Field>
        </div>
      </Section>

      {/* D. Revenue */}
      <Section kode="D" judul="Revenue Assumptions" mangrove>
        <p className="rounded-lg bg-mangrove-50 px-4 py-3 text-sm text-mangrove-700">
          AP (Availability Payment) untuk komponen <b>non-komersial</b> dihitung
          otomatis dari jadwal & capex tiap komponen pada bagian E di bawah.
        </p>
      </Section>

      {/* E. Schedule */}
      <Section kode="E" judul="Schedule — Daftar Komponen">
        <p className="mb-3 text-xs text-slate-500">
          Tiap baris = 1 aset/komponen dengan jadwalnya sendiri (mis. GSW Timur,
          GSW Barat, jembatan, pompa, mangrove).
        </p>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-laut-50 text-left text-xs uppercase tracking-wide text-laut-900">
                <th className="px-2 py-2 font-semibold">Komponen</th>
                <th className="px-2 py-2 font-semibold">Tipe</th>
                <th className="px-2 py-2 font-semibold">Biaya Konstruksi (Rp Juta)</th>
                <th className="px-2 py-2 font-semibold">Masa Konstruksi</th>
                <th className="px-2 py-2 font-semibold">Mulai Konstruksi</th>
                <th className="px-2 py-2 font-semibold">Masa Operasi</th>
                <th className="px-2 py-2 font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {a.komponen.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-2 py-4 text-center text-slate-400">
                    Belum ada komponen. Tambahkan baris di bawah.
                  </td>
                </tr>
              )}
              {a.komponen.map((k, i) => (
                <tr key={i} className="border-t border-slate-100">
                  <td className="px-2 py-1.5">
                    <input className={cellCls} value={k.nama}
                      onChange={(e) => updateKomponen(i, 'nama', e.target.value)} />
                  </td>
                  <td className="px-2 py-1.5">
                    <select className={cellCls} value={k.tipe}
                      onChange={(e) => updateKomponen(i, 'tipe', e.target.value)}>
                      <option value="non_komersial">non_komersial</option>
                      <option value="komersial">komersial</option>
                    </select>
                  </td>
                  <td className="px-2 py-1.5">
                    <input type="number" className={cellCls} value={k.biaya_konstruksi_juta}
                      onChange={(e) => updateKomponen(i, 'biaya_konstruksi_juta', Number(e.target.value))} />
                  </td>
                  <td className="px-2 py-1.5">
                    <input type="number" className={cellCls} value={k.masa_konstruksi}
                      onChange={(e) => updateKomponen(i, 'masa_konstruksi', Number(e.target.value))} />
                  </td>
                  <td className="px-2 py-1.5">
                    <input type="number" className={cellCls} value={k.mulai_konstruksi}
                      onChange={(e) => updateKomponen(i, 'mulai_konstruksi', Number(e.target.value))} />
                  </td>
                  <td className="px-2 py-1.5">
                    <input type="number" className={cellCls} value={k.masa_operasi}
                      onChange={(e) => updateKomponen(i, 'masa_operasi', Number(e.target.value))} />
                  </td>
                  <td className="px-2 py-1.5 text-center">
                    <button type="button" onClick={() => removeKomponen(i)}
                      className="rounded bg-red-50 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-100">
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button
          type="button"
          onClick={() =>
            addKomponen({
              nama: '',
              tipe: 'non_komersial',
              biaya_konstruksi_juta: 0,
              masa_konstruksi: 1,
              mulai_konstruksi: a.tahun_awal + 1,
              masa_operasi: 20,
              masa_pinjaman: a.masa_pinjaman,
            })
          }
          className="mt-3 rounded-md border border-dashed border-slate-400 px-3 py-1.5 text-sm font-medium text-slate-600 hover:border-laut-700 hover:text-laut-700"
        >
          + Tambah Komponen
        </button>

        {/* Jadwal terhitung */}
        {a.komponen.filter((k) => k.nama).length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Jadwal terhitung (otomatis)
            </p>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-2 py-1.5 font-semibold">Komponen</th>
                    <th className="px-2 py-1.5 font-semibold">Mulai Konstruksi</th>
                    <th className="px-2 py-1.5 font-semibold">Akhir Konstruksi</th>
                    <th className="px-2 py-1.5 font-semibold">Mulai Operasi</th>
                    <th className="px-2 py-1.5 font-semibold">Akhir Operasi</th>
                  </tr>
                </thead>
                <tbody>
                  {a.komponen.filter((k) => k.nama).map((k, i) => {
                    const op = k.mulai_konstruksi + k.masa_konstruksi
                    return (
                      <tr key={i} className="border-t border-slate-100">
                        <td className="px-2 py-1.5 font-medium text-laut-900">{k.nama}</td>
                        <td className="px-2 py-1.5">{k.mulai_konstruksi}</td>
                        <td className="px-2 py-1.5">{k.mulai_konstruksi + k.masa_konstruksi - 1}</td>
                        <td className="px-2 py-1.5">{op}</td>
                        <td className="px-2 py-1.5">{op + k.masa_operasi - 1}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Section>

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Hitung */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={isLoading}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-laut-700 px-6 py-3.5 text-base font-semibold text-white shadow-md hover:bg-laut-900 disabled:cursor-not-allowed disabled:bg-laut-500"
      >
        {isLoading ? (
          <>
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            Menghitung...
          </>
        ) : (
          <>🔢 Hitung Simulasi</>
        )}
      </button>
    </div>
  )
}
