# Kalkulator metrik kelayakan: IRR proyek, IRR ekuitas, NPV, payback period

import numpy_financial as npf


def calculate(cashflow_result: dict, wacc: float) -> dict:
    """Hitung metrik kelayakan dari arus kas.

    IRR proyek (FCFP), IRR ekuitas (FCFE), NPV proyek, payback period,
    serta statistik DSCR. Nilai moneter dalam satuan Rp Juta.
    """
    sorted_years = sorted(cashflow_result.keys())
    fcfp_array = [cashflow_result[y]["fcfp"] for y in sorted_years]
    fcfe_array = [cashflow_result[y]["fcfe"] for y in sorted_years]

    irr_proyek = npf.irr(fcfp_array)
    irr_ekuitas = npf.irr(fcfe_array)
    npv_proyek = npf.npv(wacc, fcfp_array)

    payback_proyek_tahun = _payback(sorted_years, fcfp_array)
    payback_ekuitas_tahun = _payback(sorted_years, fcfe_array)

    dscr_values = [
        cashflow_result[y]["dscr"]
        for y in sorted_years
        if cashflow_result[y]["dscr"] is not None
    ]
    dscr_min = min(dscr_values) if dscr_values else None
    dscr_avg = sum(dscr_values) / len(dscr_values) if dscr_values else None

    fcfp_kumulatif = {
        tahun: sum(fcfp_array[: i + 1]) for i, tahun in enumerate(sorted_years)
    }
    fcfe_kumulatif = {
        tahun: sum(fcfe_array[: i + 1]) for i, tahun in enumerate(sorted_years)
    }

    return {
        "irr_proyek": irr_proyek,
        "irr_ekuitas": irr_ekuitas,
        "npv_proyek": npv_proyek,
        "payback_proyek_tahun": payback_proyek_tahun,
        "payback_ekuitas_tahun": payback_ekuitas_tahun,
        "dscr_min": dscr_min,
        "dscr_avg": dscr_avg,
        "fcfp_kumulatif": fcfp_kumulatif,
        "fcfe_kumulatif": fcfe_kumulatif,
    }


def _payback(sorted_years: list, arus: list):
    """Tahun saat akumulasi arus kas kembali >= 0 setelah sempat negatif
    (yaitu setelah investasi dikeluarkan); None jika tak pernah tercapai.

    Penjaga 'sudah_negatif' mencegah tahun-tahun awal bernilai nol (sebelum
    investasi) langsung dianggap payback.
    """
    akumulasi = 0.0
    sudah_negatif = False
    for tahun, nilai in zip(sorted_years, arus):
        akumulasi += nilai
        if akumulasi < 0:
            sudah_negatif = True
        elif sudah_negatif:
            return tahun
    return None
