// Ubah state datar di store menjadi struktur bersarang SimulationInput backend
export function buildPayload(a) {
  return {
    tahun_awal: a.tahun_awal,
    general: {
      inflasi: a.inflasi,
      bunga: a.bunga,
      wacc: a.wacc,
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
