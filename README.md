# KPBU-AP Simulator

Aplikasi simulasi keuangan skema **KPBU Availability Payment (AP)**. Menghitung
CAPEX, pembiayaan, AP, laba rugi, arus kas, dan metrik kelayakan (IRR, NPV,
payback, DSCR) lalu menyajikannya sebagai dashboard interaktif + ekspor Excel.

- **Backend:** FastAPI (Python) — port 8000
- **Frontend:** React + Vite + Tailwind — port 5173
- Semua nilai moneter dalam satuan **Rp Juta**; sumbu waktu 2026–2115 (90 tahun)

## Struktur

```
kpbu-ap/
├── backend/          FastAPI: kalkulator, router, exporter Excel
│   └── app/
│       ├── calculators/   capex, financing, ap_revenue, pnl, cashflow, metrics
│       ├── routers/       simulate, export  (prefix /api)
│       ├── models/        skema Pydantic
│       └── exporters/     excel.py
└── frontend/         React SPA (input asumsi + halaman hasil)
```

## Menjalankan

### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
python run.py                     # http://localhost:8000  (docs: /docs)
```

### Frontend

```bash
cd frontend
npm install
npm run dev                       # http://localhost:5173
```

Dev server mem-proxy `/api` ke backend di port 8000, jadi jalankan keduanya
bersamaan.

## Alur kalkulasi

`capex → financing → ap_revenue → pnl → cashflow → metrics`

Lihat [CLAUDE.md](CLAUDE.md) untuk konvensi kode dan detail urutan kalkulasi.
