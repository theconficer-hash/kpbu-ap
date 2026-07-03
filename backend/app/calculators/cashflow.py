# Kalkulator arus kas: operasi + investasi + pendanaan

from app.models.assumptions import SimulationInput


def calculate(data: SimulationInput, ap_result: dict, capex_result: dict,
              financing_result: dict, pnl_result: dict, years: list) -> dict:
    """Hitung arus kas per tahun (CFO/CFI/CFF), saldo kas, FCFP/FCFE, dan DSCR.

    Nilai dalam satuan Rp Juta. CFI negatif menandakan pengeluaran investasi.
    """
    result: dict = {}
    kas_akhir_sebelumnya = 0.0

    for y in years:
        fin = financing_result["total_per_tahun"][y]

        # Arus kas operasi
        cfo = ap_result["per_tahun"][y] - pnl_result[y]["opex"] - pnl_result[y]["pajak"]

        # Arus kas investasi (negatif = pengeluaran)
        cfi = -capex_result["total_per_tahun"][y]

        # Arus kas pendanaan
        cff = (
            fin["drawdown"]
            - fin["pokok"]
            - fin["bunga"]
            + financing_result["total_ekuitas_per_tahun"][y]
        )

        net_cf = cfo + cfi + cff

        kas_awal = kas_akhir_sebelumnya
        kas_akhir = kas_awal + net_cf
        kas_akhir_sebelumnya = kas_akhir

        fcfp = cfo + cfi
        # FCFE tidak memasukkan setoran ekuitas — FCFE negatif saat konstruksi
        # justru merepresentasikan investasi ekuitas itu sendiri.
        fcfe = fcfp + cff - financing_result["total_ekuitas_per_tahun"][y]

        anuitas = fin["anuitas"]
        dscr = cfo / anuitas if anuitas > 0 else None

        result[y] = {
            "cfo": cfo,
            "cfi": cfi,
            "cff": cff,
            "net_cf": net_cf,
            "kas_awal": kas_awal,
            "kas_akhir": kas_akhir,
            "fcfp": fcfp,
            "fcfe": fcfe,
            "dscr": dscr,
        }

    return result
