import { create } from 'zustand'

const defaultAssumptions = {
  tahun_awal: 2026,
  inflasi: 0.03,
  bunga: 0.0975,
  wacc: 0.086922,
  ppn: 0.12,
  pph_badan: 0.22,
  kurs: 16500,
  porsi_ekuitas: 0.20,
  porsi_pinjaman: 0.80,
  masa_pinjaman: 20,
  ap_start_year: 6,
  ap_konsesi: 20,
  ap_coverage: 1.0,
  biaya_om_persen: 0.01,
  // Soft cost — default cocok dengan SoftCostAssumptions backend
  biaya_perencana: 0.0125,
  biaya_supervisi: 0.0125,
  biaya_overhead: 0.015,
  biaya_eskalasi: 0.03,
  financial_fee: 0.01,
  upfront_fee: 0.007,
  // Studi kasus: 1 komponen GSW Timur sebagai baris awal
  komponen: [
    {
      nama: 'GSW Timur',
      tipe: 'non_komersial',
      biaya_konstruksi_juta: 32968650,
      masa_konstruksi: 3,
      mulai_konstruksi: 2027,
      masa_operasi: 20,
      masa_pinjaman: 20,
    },
  ],
}

const useSimStore = create((set) => ({
  assumptions: { ...defaultAssumptions },
  results: null,
  isLoading: false,
  activePage: 'panduan', // 'panduan' | 'input' | 'results'

  setAssumptions: (patch) =>
    set((state) => ({ assumptions: { ...state.assumptions, ...patch } })),

  addKomponen: (item) =>
    set((state) => ({
      assumptions: {
        ...state.assumptions,
        komponen: [...state.assumptions.komponen, item],
      },
    })),

  removeKomponen: (index) =>
    set((state) => ({
      assumptions: {
        ...state.assumptions,
        komponen: state.assumptions.komponen.filter((_, i) => i !== index),
      },
    })),

  setResults: (data) => set({ results: data }),
  setLoading: (bool) => set({ isLoading: bool }),
  setActivePage: (page) => set({ activePage: page }),
}))

export default useSimStore
