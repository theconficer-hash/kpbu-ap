// ---- WACC dihitung otomatis (dependent), bukan input manual ----
// Cost of Equity via CAPM: Ke = Rf + beta × ERP
export function computeKe(a) {
  return a.rf + a.beta * a.erp
}

// Cost of Debt setelah pajak: Kd = bunga × (1 − PPh)
export function computeKd(a) {
  return a.bunga * (1 - a.pph_badan)
}

// WACC = %Ekuitas × Ke + %Pinjaman × Kd
export function computeWacc(a) {
  return a.porsi_ekuitas * computeKe(a) + (1 - a.porsi_ekuitas) * computeKd(a)
}

// Ubah state datar di store menjadi struktur bersarang SimulationInput backend
export function buildPayload(a) {
  return {
    tahun_awal: a.tahun_awal,
    general: {
      inflasi: a.inflasi,
      bunga: a.bunga,
      wacc: computeWacc(a),
      ppn: a.ppn,
      pph_badan: a.pph_badan,
      kurs: a.kurs,
      porsi_ekuitas: a.porsi_ekuitas,
      porsi_pinjaman: 1 - a.porsi_ekuitas,
      masa_pinjaman: a.masa_pinjaman,
    },
    soft_cost: {
      biaya_perencana: a.biaya_perencana,
      biaya_supervisi: a.biaya_supervisi,
      biaya_overhead: a.biaya_overhead,
      biaya_eskalasi: a.biaya_eskalasi,
      financial_fee: a.financial_fee,
      upfront_fee: a.upfront_fee,
    },
    komponen: a.komponen.map((k) => ({
      ...k,
      masa_pinjaman: k.masa_pinjaman ?? a.masa_pinjaman,
    })),
    kpbu: {
      ap_start_year: a.ap_start_year,
      ap_konsesi: a.ap_konsesi,
      ap_coverage: a.ap_coverage,
    },
    biaya_om_persen: a.biaya_om_persen,
  }
}
