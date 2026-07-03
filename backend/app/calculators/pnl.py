# Kalkulator laba rugi (P&L): EBITDA, EBIT, EBT, EAT

from app.models.assumptions import SimulationInput


def calculate(data: SimulationInput, ap_result: dict, financing_result: dict,
              capex_result: dict, years: list) -> dict:
    """Hitung laporan laba rugi per tahun.

    AP revenue - opex = EBITDA; dikurangi depresiasi -> EBIT; dikurangi bunga
    -> EBT; dikurangi pajak badan -> EAT. Nilai dalam satuan Rp Juta.
    """
    # Pra-hitung total capex & rentang operasi per komponen
    komp_info = []
    for komp in data.komponen:
        capex_komp = capex_result["per_komponen"].get(komp.nama, {})
        total_capex_komponen = sum(v["total"] for v in capex_komp.values())
        op_mulai = komp.mulai_konstruksi + komp.masa_konstruksi
        op_selesai = op_mulai + komp.masa_operasi - 1
        komp_info.append({
            "tipe": komp.tipe,
            "total_capex": total_capex_komponen,
            "depresiasi_tahunan": (
                total_capex_komponen / komp.masa_operasi
                if komp.masa_operasi > 0 else 0.0
            ),
            "opex_tahunan": total_capex_komponen * data.biaya_om_persen,
            "op_mulai": op_mulai,
            "op_selesai": op_selesai,
        })

    result: dict = {}
    for y in years:
        # Opex per komponen non-komersial yang sedang operasi (selaras AP-opex)
        opex = sum(
            k["opex_tahunan"]
            for k in komp_info
            if k["tipe"] == "non_komersial" and k["op_mulai"] <= y <= k["op_selesai"]
        )

        ap_revenue = ap_result["per_tahun"][y]
        ebitda = ap_revenue - opex

        depresiasi = sum(
            k["depresiasi_tahunan"]
            for k in komp_info
            if k["op_mulai"] <= y <= k["op_selesai"]
        )
        ebit = ebitda - depresiasi

        bunga = financing_result["total_per_tahun"][y]["bunga"]
        ebt = ebit - bunga

        pajak = max(0.0, ebt * data.general.pph_badan)
        eat = ebt - pajak

        result[y] = {
            "opex": opex,
            "ap_revenue": ap_revenue,
            "ebitda": ebitda,
            "depresiasi": depresiasi,
            "ebit": ebit,
            "bunga": bunga,
            "ebt": ebt,
            "pajak": pajak,
            "eat": eat,
        }

    return result
