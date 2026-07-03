# Kalkulator CAPEX: total investasi per komponen per tahun (eskalasi, PPN, IDC, soft cost)

from app.models.assumptions import SimulationInput


def calculate(data: SimulationInput, years: list) -> dict:
    """Hitung CAPEX per komponen per tahun.

    Untuk setiap komponen: jadwal konstruksi (binary) -> eskalasi inflasi ->
    soft cost -> PPN -> IDC -> financial/upfront fee, lalu dijumlahkan menjadi
    total capex per tahun. Semua nilai moneter dalam satuan Rp Juta.
    """
    per_komponen: dict = {}
    total_per_tahun: dict = {year: 0.0 for year in years}
    grand_total: float = 0.0
    grand_total_nonkomersial: float = 0.0

    for komp in data.komponen:
        # LANGKAH A — Jadwal konstruksi per tahun (binary 0/1)
        start = komp.mulai_konstruksi
        end = komp.mulai_konstruksi + komp.masa_konstruksi - 1
        konstruksi_years = list(range(start, end + 1))
        biaya_dasar = (
            komp.biaya_konstruksi_juta / komp.masa_konstruksi
            if komp.masa_konstruksi > 0
            else 0.0
        )

        # LANGKAH B, C, D — Eskalasi, soft cost, PPN per tahun konstruksi
        yearly: dict = {}
        total_capex_komponen = 0.0
        for y in konstruksi_years:
            faktor_eskalasi = (1 + data.general.inflasi) ** (y - data.tahun_awal)
            biaya_tereskala = biaya_dasar * faktor_eskalasi

            biaya_perencana = biaya_tereskala * data.soft_cost.biaya_perencana
            biaya_supervisi = biaya_tereskala * data.soft_cost.biaya_supervisi
            biaya_overhead = biaya_tereskala * data.soft_cost.biaya_overhead
            soft_cost = biaya_perencana + biaya_supervisi + biaya_overhead

            subtotal = biaya_tereskala + soft_cost
            ppn = subtotal * data.general.ppn

            yearly[y] = {
                "konstruksi": biaya_tereskala,
                "soft_cost": soft_cost,
                "subtotal": subtotal,
                "ppn": ppn,
            }
            total_capex_komponen += subtotal + ppn

        # LANGKAH E — Total pinjaman per komponen + IDC per tahun konstruksi
        total_pinjaman = total_capex_komponen * data.general.porsi_pinjaman
        # Drawdown proporsional terhadap capex per tahun (konsisten dengan
        # financing.py) — bukan rata, karena konstruksi tereskalasi.
        akumulasi_drawdown = 0.0
        for y in konstruksi_years:
            base_tahun = yearly[y]["subtotal"] + yearly[y]["ppn"]
            drawdown = (
                base_tahun / total_capex_komponen * total_pinjaman
                if total_capex_komponen > 0
                else 0.0
            )
            akumulasi_drawdown += drawdown
            yearly[y]["idc"] = akumulasi_drawdown * data.general.bunga

        # LANGKAH F — Financial fee & upfront fee (hanya tahun pertama konstruksi)
        financial_fee = total_pinjaman * data.soft_cost.financial_fee
        upfront_fee = total_pinjaman * data.soft_cost.upfront_fee
        fee_tahun_pertama = financial_fee + upfront_fee

        # LANGKAH G — Total capex per tahun per komponen
        komp_result: dict = {}
        for y in konstruksi_years:
            d = yearly[y]
            fee = fee_tahun_pertama if y == start else 0.0
            total = d["subtotal"] + d["ppn"] + d["idc"] + fee

            komp_result[y] = {
                "konstruksi": d["konstruksi"],
                "soft_cost": d["soft_cost"],
                "ppn": d["ppn"],
                "idc": d["idc"],
                "fee": fee,
                "total": total,
            }

            if y in total_per_tahun:
                total_per_tahun[y] += total
            else:
                total_per_tahun[y] = total
            grand_total += total
            if komp.tipe == "non_komersial":
                grand_total_nonkomersial += total

        per_komponen[komp.nama] = komp_result

    return {
        "per_komponen": per_komponen,
        "total_per_tahun": total_per_tahun,
        "grand_total": grand_total,
        "grand_total_nonkomersial": grand_total_nonkomersial,
    }
