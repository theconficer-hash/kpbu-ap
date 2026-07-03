# Kalkulator pembiayaan: amortisasi pinjaman, drawdown, DSCR

import numpy_financial as npf

from app.models.assumptions import SimulationInput


def calculate(data: SimulationInput, capex_result: dict, years: list) -> dict:
    """Hitung struktur pendanaan per komponen per tahun.

    Drawdown pinjaman & setoran ekuitas proporsional terhadap capex per tahun
    selama konstruksi; grace period selama masa konstruksi; lalu amortisasi
    anuitas tetap (npf.pmt) selama masa pinjaman. Nilai dalam satuan Rp Juta.
    """
    per_komponen: dict = {}
    total_per_tahun: dict = {
        year: {"drawdown": 0.0, "bunga": 0.0, "pokok": 0.0, "anuitas": 0.0}
        for year in years
    }
    total_ekuitas_per_tahun: dict = {year: 0.0 for year in years}

    for komp in data.komponen:
        capex_komp = capex_result["per_komponen"].get(komp.nama, {})

        # LANGKAH A — Total pinjaman & ekuitas komponen
        total_capex_komponen = sum(v["total"] for v in capex_komp.values())
        total_pinjaman = total_capex_komponen * data.general.porsi_pinjaman
        total_ekuitas = total_capex_komponen * data.general.porsi_ekuitas

        komp_result: dict = {year: _empty_year() for year in capex_komp}

        if total_capex_komponen <= 0:
            per_komponen[komp.nama] = komp_result
            continue

        # LANGKAH B & F — Drawdown pinjaman & setoran ekuitas (proporsional)
        for y, cap in capex_komp.items():
            porsi = cap["total"] / total_capex_komponen
            komp_result[y]["drawdown"] = porsi * total_pinjaman
            total_per_tahun[y]["drawdown"] += komp_result[y]["drawdown"]

            ekuitas = porsi * total_ekuitas
            total_ekuitas_per_tahun[y] += ekuitas

        # LANGKAH C — Grace period = masa konstruksi; cicilan mulai setelahnya
        tahun_mulai_cicilan = komp.mulai_konstruksi + komp.masa_konstruksi

        # LANGKAH D — Anuitas tetap
        anuitas = -npf.pmt(data.general.bunga, komp.masa_pinjaman, total_pinjaman)

        # LANGKAH E — Jadwal amortisasi selama masa pinjaman aktif
        saldo_awal = total_pinjaman
        for i in range(komp.masa_pinjaman):
            y = tahun_mulai_cicilan + i
            bunga = saldo_awal * data.general.bunga
            pokok = anuitas - bunga
            saldo_akhir = saldo_awal - pokok

            entry = komp_result.setdefault(y, _empty_year())
            entry["saldo_awal"] = saldo_awal
            entry["bunga"] = bunga
            entry["pokok"] = pokok
            entry["anuitas"] = anuitas
            entry["saldo_akhir"] = saldo_akhir

            if y in total_per_tahun:
                total_per_tahun[y]["bunga"] += bunga
                total_per_tahun[y]["pokok"] += pokok
                total_per_tahun[y]["anuitas"] += anuitas

            saldo_awal = saldo_akhir

        per_komponen[komp.nama] = komp_result

    return {
        "per_komponen": per_komponen,
        "total_per_tahun": total_per_tahun,
        "total_ekuitas_per_tahun": total_ekuitas_per_tahun,
    }


def _empty_year() -> dict:
    return {
        "drawdown": 0.0,
        "saldo_awal": 0.0,
        "bunga": 0.0,
        "pokok": 0.0,
        "anuitas": 0.0,
        "saldo_akhir": 0.0,
    }
