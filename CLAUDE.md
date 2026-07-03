# KPBU-AP Simulator
Aplikasi simulasi keuangan skema KPBU Availability Payment.

## Tentang Aplikasi
- Backend: FastAPI Python di port 8000
- Frontend: React Vite di port 5173
- Semua nilai moneter dalam satuan Rp Juta
- Sumbu waktu: array tahun integer mulai 2026 hingga 2115 (90 tahun)

## Alur Kalkulasi (urutan wajib diikuti)
1. capex.py — total investasi per komponen per tahun (eskalasi, PPN, IDC, soft cost)
2. financing.py — amortisasi pinjaman, drawdown, DSCR
3. ap_revenue.py — besaran AP tahunan dari pemerintah
4. pnl.py — EBITDA, EBIT, EBT, EAT
5. cashflow.py — arus kas operasi + investasi + pendanaan
6. metrics.py — IRR proyek, IRR ekuitas, NPV, payback period

## Konvensi Kode
- Semua fungsi kalkulator menerima parameter (data, years) dan mengembalikan dict {year: nilai}
- Tidak ada logika bisnis di router, hanya memanggil kalkulator
- Semua endpoint di prefix /api
