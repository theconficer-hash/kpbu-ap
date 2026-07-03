import { useState } from 'react'
import {
  TrendingUp, Landmark, Scale, Receipt, Building2, ArrowLeftRight, PieChart,
  CalendarClock, Compass, Briefcase, BarChart3, Handshake, Shield, Hourglass,
  Wrench, Coins, CalendarDays, ClipboardList, Blocks, HardHat, Settings,
  Search, ChevronDown, Info, ArrowRight, MessageCircle, BookText, Calculator,
  Sigma, SlidersHorizontal, Wallet, SearchX,
} from 'lucide-react'
import useSimStore from '../store/useSimStore'

// Aksen warna per kelompok (kelas literal agar terbaca Tailwind)
const ACCENT = {
  laut: { tile: 'bg-laut-50 text-laut-700', bar: 'bg-laut-700', active: 'bg-laut-700' },
  cyan: { tile: 'bg-cyan-50 text-cyan-700', bar: 'bg-cyan-600', active: 'bg-cyan-600' },
  mangrove: { tile: 'bg-mangrove-50 text-mangrove-600', bar: 'bg-mangrove-600', active: 'bg-mangrove-600' },
  amber: { tile: 'bg-amber-50 text-amber-600', bar: 'bg-amber-500', active: 'bg-amber-500' },
}

// ---------------------------------------------------------------------------
const SECTIONS = [
  {
    id: 'A', label: 'A. Parameter Umum', short: 'Umum', ChipIcon: SlidersHorizontal, accent: 'laut',
    items: [
      {
        Icon: TrendingUp, judul: 'Inflasi',
        ringkas: 'Kenaikan harga barang & jasa dari tahun ke tahun.',
        sederhana:
          'Bayangkan harga semen tahun ini Rp100.000, tahun depan jadi Rp103.000. Kenaikan 3% itulah inflasi. Karena tanggul dibangun bertahun-tahun, biaya tiap tahunnya ikut "naik kelas".',
        teknis:
          'Dipakai untuk mengeskalasi biaya konstruksi per tahun (compounding) sampai tahun pelaksanaan. Lazim diambil dari target inflasi Bank Indonesia (2,5% ± 1%) atau rata-rata realisasi 5–10 tahun.',
        rumus: 'Biaya thnₙ = Biaya dasar × (1 + inflasi)ⁿ',
        contoh: 'Dengan inflasi 3%, biaya konstruksi GSW Timur di 2029 ±9% lebih mahal dibanding harga 2026.',
        rujukan: [
          { label: 'Bank Indonesia — Target Inflasi', url: 'https://www.bi.go.id' },
          { label: 'BPS — Indeks Harga Konsumen', url: 'https://www.bps.go.id' },
        ],
      },
      {
        Icon: Landmark, judul: 'Bunga (Suku Bunga Pinjaman)',
        ringkas: 'Ongkos meminjam uang dari bank per tahun.',
        sederhana:
          'Seperti KPR rumah: pinjam uang bank, tiap tahun bayar "sewa uang". Proyek tanggul meminjam sangat besar, jadi ongkos bunganya sangat menentukan.',
        teknis:
          'Pinjaman domestik mengacu BI-Rate + marjin bank; pinjaman luar negeri (mis. China loan) mengacu LPR/SOFR + marjin. Asumsi awal 9,75% (LPR + 3,5%).',
        contoh: 'Bunga 9,75% atas pinjaman ±Rp38 triliun ≈ bunga tahun pertama operasi ±Rp3,7 triliun.',
        rujukan: [{ label: 'Bank Indonesia — BI-Rate', url: 'https://www.bi.go.id' }],
      },
      {
        Icon: Scale, judul: 'WACC',
        ringkas: 'Rata-rata "ongkos modal" gabungan pinjaman + modal sendiri.',
        sederhana:
          'Modal proyek dari dua kantong: uang sendiri (ekuitas) dan pinjaman. Masing-masing punya "harga". WACC adalah harga campurannya — batas minimal kelayakan: kalau untung proyek (IRR) di bawah WACC, belum layak.',
        teknis:
          'Biaya ekuitas umumnya via CAPM: yield SBN 10 th + beta × premi risiko. Dipakai sebagai tingkat diskonto NPV.',
        rumus: 'WACC = (%Ekuitas × Ke) + (%Pinjaman × Bunga × (1 − PPh))',
        contoh: 'Asumsi awal WACC 8,69% — IRR proyek 10,88% > WACC, artinya proyek layak.',
        rujukan: [
          { label: 'DJPPR Kemenkeu — Yield SBN', url: 'https://www.djppr.kemenkeu.go.id' },
          { label: 'Damodaran — Risk Premium', url: 'https://pages.stern.nyu.edu/~adamodar/' },
        ],
      },
      {
        Icon: Receipt, judul: 'PPN',
        ringkas: 'Pajak Pertambahan Nilai atas biaya konstruksi & jasa.',
        sederhana:
          'Sama seperti PPN saat belanja: setiap pembayaran konstruksi & jasa konsultan kena PPN, sehingga total kebutuhan dana proyek ikut membesar.',
        teknis: 'Default 12% sesuai tarif bertahap UU HPP; dikenakan atas biaya proyek (konstruksi + soft cost).',
        contoh: 'PPN menambah ±Rp4,4 triliun pada capex GSW Timur.',
        rujukan: [{ label: 'DJP — UU HPP', url: 'https://www.pajak.go.id' }],
      },
      {
        Icon: Building2, judul: 'PPh Badan',
        ringkas: 'Pajak penghasilan perusahaan atas laba.',
        sederhana: 'Kalau badan usaha untung, sebagian labanya disetor ke negara — seperti pajak gaji, tapi untuk perusahaan.',
        teknis: 'Tarif umum 22% atas laba kena pajak (EBT). Tahun rugi tidak membayar PPh.',
        contoh: 'Pajak baru muncul di tahun-tahun akhir konsesi saat proyek mulai laba.',
        rujukan: [{ label: 'DJP — UU HPP', url: 'https://www.pajak.go.id' }],
      },
      {
        Icon: ArrowLeftRight, judul: 'Kurs (IDR/USD)',
        ringkas: 'Nilai tukar rupiah untuk komponen biaya dalam dolar.',
        sederhana: 'Sebagian material/peralatan dibeli dengan dolar. Kalau rupiah melemah, biaya dalam rupiah ikut membengkak.',
        teknis: 'Konversi memakai kurs referensi; asumsi awal Rp16.500/USD.',
        contoh: 'Dipakai saat mengonversi estimasi biaya berdenominasi USD ke Rp Juta.',
        rujukan: [{ label: 'BI — Kurs JISDOR', url: 'https://www.bi.go.id' }],
      },
      {
        Icon: PieChart, judul: 'Porsi Ekuitas & Pinjaman',
        ringkas: 'Perbandingan modal sendiri vs pinjaman.',
        sederhana: 'Seperti beli rumah: DP 20% dari tabungan, 80% dari KPR. Proyek ini: 20% modal sponsor, 80% pinjaman bank.',
        teknis: 'Praktik project finance infrastruktur umumnya 20–30% ekuitas.',
        rumus: 'Porsi Pinjaman = 100% − Porsi Ekuitas',
        contoh: 'Dari capex ±Rp47,6 triliun: ekuitas ±Rp9,5 triliun, pinjaman ±Rp38,1 triliun.',
        rujukan: [{ label: 'Bappenas — KPBU', url: 'https://kpbu.bappenas.go.id' }],
      },
      {
        Icon: CalendarClock, judul: 'Masa Pinjaman',
        ringkas: 'Lama waktu mencicil pinjaman sampai lunas.',
        sederhana: 'Seperti tenor KPR 20 tahun: makin panjang tenor, cicilan per tahun lebih ringan, tapi total bunga lebih besar.',
        teknis: 'Termasuk grace period (belum mencicil) selama konstruksi. Infrastruktur besar lazim 15–25 tahun.',
        contoh: 'GSW Timur: konstruksi 2027–2029 (grace), cicilan 2030–2049 (20 tahun).',
        rujukan: [{ label: 'PT SMI', url: 'https://www.ptsmi.co.id' }],
      },
    ],
  },
  {
    id: 'B', label: 'B. Capex & Pembiayaan', short: 'Capex', ChipIcon: Wallet, accent: 'cyan',
    items: [
      {
        Icon: Compass, judul: 'Konsultan Perencana & Pengawas',
        ringkas: 'Ongkos jasa perancang (DED) dan pengawas konstruksi.',
        sederhana: 'Membangun tanggul raksasa butuh "arsitek" dan "mandor ahli". Keduanya dibayar sekian persen dari biaya konstruksi.',
        teknis: 'Masing-masing default 1,25% dari biaya konstruksi tereskalasi.',
        contoh: 'Untuk GSW Timur, keduanya menambah ±Rp0,9 triliun.',
        rujukan: [{ label: 'INKINDO — Billing Rate', url: 'https://www.inkindo.org' }],
      },
      {
        Icon: Briefcase, judul: 'Biaya Overhead',
        ringkas: 'Biaya umum pengelolaan proyek selama pembangunan.',
        sederhana: 'Kantor proyek, tim manajemen, perizinan — semua "biaya di belakang layar" agar proyek berjalan.',
        teknis: 'Default 1,5% dari biaya konstruksi.',
        contoh: 'Ikut dihitung per tahun konstruksi bersama soft cost lain.',
        rujukan: [{ label: 'Benchmark proyek sejenis', url: 'https://kpbu.bappenas.go.id' }],
      },
      {
        Icon: BarChart3, judul: 'Biaya Eskalasi',
        ringkas: 'Cadangan kenaikan harga selama konstruksi.',
        sederhana: 'Harga material merangkak naik tiap tahun — model ini menghitungnya otomatis memakai asumsi inflasi.',
        teknis: 'Eskalasi dihitung menyatu (compounding) memakai asumsi inflasi per tahun.',
        contoh: 'Biaya konstruksi 2029 ±9% lebih tinggi dari harga 2026.',
        rujukan: [{ label: 'BI — Inflasi', url: 'https://www.bi.go.id' }],
      },
      {
        Icon: Handshake, judul: 'Financial Fee (Bank)',
        ringkas: 'Biaya "jasa pengaturan" pinjaman oleh bank.',
        sederhana: 'Seperti biaya provisi saat mengajukan KPR — dibayar sekali di awal ketika pinjaman disiapkan.',
        teknis: 'Default 1% dari total pinjaman, dibebankan di tahun pertama konstruksi.',
        contoh: '1% × pinjaman Rp38,1 triliun ≈ Rp381 miliar di 2027.',
        rujukan: [{ label: 'Term sheet perbankan', url: 'https://www.ptsmi.co.id' }],
      },
      {
        Icon: Shield, judul: 'Upfront Fee PT PII',
        ringkas: 'Biaya penjaminan pemerintah lewat PT PII.',
        sederhana: 'PT PII seperti "penjamin" yang membuat bank berani meminjamkan ke proyek KPBU. Jasanya dibayar di muka.',
        teknis: 'Default 0,7% dari pinjaman, dibayar di tahun pertama konstruksi.',
        contoh: '0,7% × Rp38,1 triliun ≈ Rp267 miliar.',
        rujukan: [{ label: 'PT PII (IIGF)', url: 'https://ptpii.co.id' }],
      },
      {
        Icon: Hourglass, judul: 'IDC (Interest During Construction)',
        ringkas: 'Bunga yang menumpuk selama masa pembangunan.',
        sederhana: 'Selama tanggul dibangun belum ada pemasukan, tapi bunga pinjaman sudah berjalan. Bunga "masa menunggu" ini digulung jadi bagian biaya investasi.',
        teknis: 'Dihitung dari akumulasi drawdown × suku bunga per tahun konstruksi, lalu dikapitalisasi ke capex.',
        rumus: 'IDC = Σ (akumulasi drawdown × bunga) selama konstruksi',
        contoh: 'IDC GSW Timur ±Rp6,3 triliun — komponen terbesar setelah konstruksi & PPN.',
        rujukan: [{ label: 'Turunan jadwal drawdown', url: 'https://kpbu.bappenas.go.id' }],
      },
    ],
  },
  {
    id: 'C', label: 'C. Opex & Skema AP', short: 'Opex & AP', ChipIcon: Coins, accent: 'mangrove',
    items: [
      {
        Icon: Wrench, judul: 'Biaya O&M', mangrove: true,
        ringkas: 'Ongkos merawat & mengoperasikan aset tiap tahun.',
        sederhana: 'Tanggul yang sudah jadi tetap harus dirawat: pompa diservis, pintu air dicek, mangrove di segmen hybrid sea wall dipelihara — seperti servis rutin kendaraan.',
        teknis: 'Ditetapkan % terhadap capex per tahun; benchmark infrastruktur sipil 1–2%. Default 1%.',
        contoh: 'O&M GSW Timur ±Rp476 miliar per tahun selama operasi.',
        rujukan: [{ label: 'Kementerian PUPR', url: 'https://www.pu.go.id' }],
      },
      {
        Icon: Coins, judul: 'AP (Availability Payment)',
        ringkas: 'Pembayaran rutin pemerintah selama layanan tersedia.',
        sederhana: 'Badan usaha membangun dulu dengan uangnya sendiri, lalu pemerintah "berlangganan" — membayar tiap tahun selama tanggul berfungsi baik. Mirip berlangganan layanan, bukan beli putus.',
        teknis: 'Per komponen non-komersial dihitung otomatis, flat selama masa konsesi AP sejak aset beroperasi.',
        rumus: 'AP = Capital Recovery (capex) + Biaya O&M',
        contoh: 'AP GSW Timur ±Rp7,4 triliun/tahun selama 2030–2049.',
        rujukan: [
          { label: 'Perpres 38/2015 — KPBU', url: 'https://peraturan.go.id' },
          { label: 'Bappenas — Skema AP', url: 'https://kpbu.bappenas.go.id' },
        ],
      },
      {
        Icon: CalendarDays, judul: 'AP Konsesi',
        ringkas: 'Berapa lama pemerintah membayar AP.',
        sederhana: 'Masa "berlangganan" pemerintah — asumsi awal 20 tahun.',
        teknis: 'Lama masa pembayaran AP sesuai perjanjian KPBU.',
        contoh: 'Konsesi 20 tahun → AP dibayar 2030 s.d. 2049.',
        rujukan: [{ label: 'Bappenas — KPBU', url: 'https://kpbu.bappenas.go.id' }],
      },
      {
        Icon: ClipboardList, judul: 'AP Coverage',
        ringkas: 'Cakupan yang ditanggung AP.',
        sederhana: 'Apakah pembayaran pemerintah menutup biaya bangun + biaya rawat (100%), atau biaya bangun saja.',
        teknis: 'Opsi: Capex + Opex (100%) atau Capex Only.',
        contoh: 'Asumsi awal memakai Capex + Opex (100%).',
        rujukan: [{ label: 'Struktur perjanjian KPBU', url: 'https://kpbu.bappenas.go.id' }],
      },
    ],
  },
  {
    id: 'E', label: 'E. Jadwal', short: 'Jadwal', ChipIcon: CalendarDays, accent: 'amber',
    items: [
      {
        Icon: Blocks, judul: 'Komponen & Tipe', mangrove: true,
        ringkas: 'Setiap aset dihitung terpisah sesuai jenisnya.',
        sederhana: 'Proyek besar dipecah per bagian: tanggul timur, tanggul barat, pompa, mangrove... Tipe non-komersial dibayar lewat AP; tipe komersial (pulau, tol) punya pemasukan sendiri.',
        teknis: 'Tiap komponen punya jadwal, capex, pembiayaan, dan stream AP masing-masing, lalu diagregasi.',
        contoh: 'Tambah baris "GSW Barat-1" mulai 2030 → AP-nya otomatis mulai 2033.',
        rujukan: [{ label: 'Masterplan proyek', url: 'https://kpbu.bappenas.go.id' }],
      },
      {
        Icon: HardHat, judul: 'Masa & Mulai Konstruksi',
        ringkas: 'Kapan mulai dibangun dan berapa lama.',
        sederhana: 'Menentukan tahun-tahun keluar uang. Biaya dibagi per tahun pembangunan, lalu naik mengikuti inflasi.',
        teknis: 'Menentukan jadwal drawdown, IDC, dan awal operasi (= mulai konstruksi + masa konstruksi).',
        contoh: 'GSW Timur: mulai 2027, 3 tahun → beroperasi 2030.',
        rujukan: [{ label: 'Jadwal pelaksanaan proyek', url: 'https://kpbu.bappenas.go.id' }],
      },
      {
        Icon: Settings, judul: 'Masa Operasi',
        ringkas: 'Berapa lama aset dipakai setelah jadi.',
        sederhana: 'Umur pakai aset — jadi dasar penyusutan nilai (depresiasi) dan lamanya pembayaran AP.',
        teknis: 'Dasar periode depresiasi dan (bersama AP Konsesi) periode pembayaran AP.',
        contoh: 'Operasi 20 tahun: 2030–2049.',
        rujukan: [{ label: 'Perjanjian KPBU', url: 'https://kpbu.bappenas.go.id' }],
      },
    ],
  },
]

const TOTAL_ISTILAH = SECTIONS.reduce((n, s) => n + s.items.length, 0)

// ---------------------------------------------------------------------------
function TermCard({ item, accent, open, onToggle }) {
  const { Icon } = item
  return (
    <div
      className={
        'group relative overflow-hidden rounded-2xl border bg-white transition ' +
        (open
          ? 'border-slate-300 shadow-lg'
          : 'border-slate-200 shadow-sm hover:-translate-y-0.5 hover:shadow-md')
      }
    >
      {/* bar aksen kiri */}
      <div className={'absolute inset-y-0 left-0 w-1 ' + accent.bar} />

      <button type="button" onClick={onToggle} className="flex w-full items-center gap-4 px-5 py-4 pl-6 text-left">
        <span className={'flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ' + accent.tile}>
          <Icon size={26} strokeWidth={2} />
        </span>
        <span className="flex-1">
          <span className="block text-lg font-bold leading-tight text-laut-900">{item.judul}</span>
          <span className="mt-1 block text-sm leading-snug text-slate-500">{item.ringkas}</span>
        </span>
        <ChevronDown
          size={20}
          className={'shrink-0 text-slate-400 transition-transform group-hover:text-laut-700 ' + (open ? 'rotate-180' : '')}
        />
      </button>

      {open && (
        <div className="px-6 pb-5 pt-1">
          {/* Analogi */}
          <div className="rounded-xl bg-laut-50 px-4 py-3">
            <div className="mb-1 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-laut-700">
              <MessageCircle size={14} /> Analogi sederhana
            </div>
            <p className="text-[15px] leading-relaxed text-slate-700">{item.sederhana}</p>
          </div>

          {/* Teknis */}
          <div className="mt-3 px-1">
            <div className="mb-1 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <BookText size={14} /> Penjelasan teknis
            </div>
            <p className="text-[15px] leading-relaxed text-slate-600">{item.teknis}</p>
          </div>

          {/* Rumus (opsional) */}
          {item.rumus && (
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5">
              <Sigma size={16} className="shrink-0 text-slate-400" />
              <code className="text-[13px] font-semibold text-slate-700">{item.rumus}</code>
            </div>
          )}

          {/* Contoh */}
          <div className="mt-3 rounded-xl bg-mangrove-50 px-4 py-3">
            <div className="mb-1 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-mangrove-700">
              <Calculator size={14} /> Di simulasi ini
            </div>
            <p className="text-[15px] leading-relaxed text-mangrove-700">{item.contoh}</p>
          </div>

          {/* Rujukan */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Rujukan resmi</span>
            {item.rujukan.map((r) => (
              <a key={r.label} href={r.url} target="_blank" rel="noreferrer"
                className="rounded-full border border-laut-100 bg-laut-50 px-3.5 py-1.5 text-xs font-semibold text-laut-700 transition hover:bg-laut-100">
                {r.label} ↗
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
export default function GuidePage() {
  const [tab, setTab] = useState('A')
  const [query, setQuery] = useState('')
  const [openId, setOpenId] = useState(null)
  const setActivePage = useSimStore((s) => s.setActivePage)

  const q = query.trim().toLowerCase()
  const searching = q.length > 0

  const visible = searching
    ? SECTIONS.map((s) => ({
        ...s,
        items: s.items.filter(
          (i) =>
            i.judul.toLowerCase().includes(q) ||
            i.ringkas.toLowerCase().includes(q) ||
            i.sederhana.toLowerCase().includes(q) ||
            i.teknis.toLowerCase().includes(q)
        ),
      })).filter((s) => s.items.length > 0)
    : SECTIONS.filter((s) => s.id === tab)

  const totalHasil = visible.reduce((n, s) => n + s.items.length, 0)

  return (
    <div>
      {/* Intro */}
      <div className="mb-5 rounded-3xl border border-laut-100 bg-gradient-to-br from-laut-50 to-white p-6 sm:p-7">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h2 className="text-2xl font-extrabold tracking-tight text-laut-900 sm:text-3xl">
            Kamus Istilah Asumsi
          </h2>
          <span className="rounded-full bg-laut-700 px-2.5 py-0.5 text-xs font-bold text-white">
            {TOTAL_ISTILAH} istilah
          </span>
        </div>
        <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-slate-600">
          Kenali dulu istilah-istilahnya sebelum mengisi <b>Input Asumsi</b> —
          dijelaskan dengan bahasa sehari-hari, lengkap dengan contoh di proyek
          tanggul laut serta rujukan resmi untuk memutakhirkan angka.{' '}
          <span className="font-bold text-laut-700">#BikinPaham</span>
        </p>
      </div>

      {/* Bar pencarian + kategori (menempel saat scroll) */}
      <div className="sticky top-0 z-20 -mx-6 mb-5 border-b border-slate-200 bg-[#F5F8FB]/85 px-6 py-3 backdrop-blur">
        <div className="relative">
          <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpenId(null) }}
            placeholder="Cari istilah… (mis. WACC, AP, bunga, IDC)"
            className="w-full rounded-2xl border border-slate-300 bg-white py-3 pl-11 pr-4 text-[15px] shadow-sm outline-none transition focus:border-laut-700 focus:ring-2 focus:ring-laut-700/20"
          />
        </div>

        {!searching && (
          <div className="mt-3 flex flex-wrap gap-2">
            {SECTIONS.map((s) => {
              const acc = ACCENT[s.accent]
              const active = tab === s.id
              const { ChipIcon } = s
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => { setTab(s.id); setOpenId(null) }}
                  className={
                    'flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold transition ' +
                    (active
                      ? acc.active + ' border-transparent text-white shadow-sm'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300')
                  }
                >
                  <ChipIcon size={16} strokeWidth={2.4} />
                  {s.short}
                  <span className={'rounded-full px-1.5 text-xs ' + (active ? 'bg-white/25' : 'bg-slate-100 text-slate-500')}>
                    {s.items.length}
                  </span>
                </button>
              )
            })}
          </div>
        )}

        {searching && (
          <p className="mt-2 text-[13px] text-slate-500">
            {totalHasil > 0 ? `${totalHasil} istilah cocok dengan "${query}"` : `Tidak ada hasil untuk "${query}".`}
          </p>
        )}
      </div>

      {/* Kartu istilah */}
      {searching && totalHasil === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <SearchX size={40} className="text-slate-300" />
          <p className="text-slate-500">
            Coba kata kunci lain, mis. <b>WACC</b>, <b>bunga</b>, atau <b>konsesi</b>.
          </p>
        </div>
      ) : (
        visible.map((s) => (
          <div key={s.id} className="mb-6">
            {searching && (
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">{s.label}</h3>
            )}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {s.items.map((item) => {
                const id = s.id + item.judul
                const accent = item.mangrove ? ACCENT.mangrove : ACCENT[s.accent]
                return (
                  <TermCard
                    key={id}
                    item={item}
                    accent={accent}
                    open={openId === id}
                    onToggle={() => setOpenId(openId === id ? null : id)}
                  />
                )
              })}
            </div>
          </div>
        ))
      )}

      {/* CTA */}
      <div className="mt-7 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="flex items-center gap-2 text-[13px] text-slate-500">
          <Info size={16} className="shrink-0 text-laut-700" />
          Angka default adalah <b>asumsi awal</b> — selalu verifikasi ke sumber resmi
          sebelum digunakan untuk pengambilan keputusan.
        </p>
        <button
          type="button"
          onClick={() => setActivePage('input')}
          className="flex items-center gap-2 rounded-xl bg-laut-700 px-6 py-3 text-sm font-bold text-white shadow-md transition hover:bg-laut-900"
        >
          Lanjut ke Input Asumsi
          <ArrowRight size={17} />
        </button>
      </div>
    </div>
  )
}
