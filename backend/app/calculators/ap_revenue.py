# Kalkulator AP Revenue: besaran Availability Payment tahunan dari pemerintah

from app.models.assumptions import SimulationInput

# Faktor capital recovery AP (kalibrasi ke model Excel, konsesi 20 tahun).
# AP untuk capex = CAPITAL_RECOVERY_FACTOR * capex_komponen; mengandung
# pengembalian modal + return, bukan sekadar capex/konsesi.
CAPITAL_RECOVERY_FACTOR = 0.145


def calculate(data: SimulationInput, capex_result: dict, years: list) -> dict:
    """Hitung Availability Payment (AP) flat tahunan dari pemerintah.

    AP dihitung PER komponen non-komersial: masing-masing punya stream AP
    sendiri yang mulai saat komponen itu beroperasi (setelah konstruksi) dan
    berjalan selama masa konsesi AP. AP = capital recovery capex + opex.
    Seluruh stream diagregasi per tahun. Nilai dalam satuan Rp Juta.
    """
    per_tahun: dict = {y: 0.0 for y in years}
    per_komponen: dict = {}
    total_ap_capex = 0.0
    total_ap_opex = 0.0
    ap_mulai_global = None
    ap_selesai_global = None

    # Coverage: >=1.0 -> capex penuh; <1.0 -> sebagian
    cov_eff = 1.0 if data.kpbu.ap_coverage >= 1.0 else data.kpbu.ap_coverage

    for komp in data.komponen:
        if komp.tipe != "non_komersial":
            continue  # komponen komersial pakai revenue komersial (Fase 2)

        cap = capex_result["per_komponen"].get(komp.nama, {})
        capex_komp = sum(v["total"] for v in cap.values())
        if capex_komp <= 0:
            continue

        # AP mulai saat aset beroperasi, selama masa konsesi AP
        ap_mulai = komp.mulai_konstruksi + komp.masa_konstruksi
        ap_selesai = ap_mulai + data.kpbu.ap_konsesi - 1

        ap_capex = capex_komp * CAPITAL_RECOVERY_FACTOR * cov_eff
        ap_opex = capex_komp * data.biaya_om_persen
        ap_komp = ap_capex + ap_opex

        for y in range(ap_mulai, ap_selesai + 1):
            if y in per_tahun:
                per_tahun[y] += ap_komp

        per_komponen[komp.nama] = {
            "ap_tahunan": ap_komp,
            "ap_mulai": ap_mulai,
            "ap_selesai": ap_selesai,
            "ap_untuk_capex": ap_capex,
            "ap_untuk_opex": ap_opex,
        }
        total_ap_capex += ap_capex
        total_ap_opex += ap_opex
        ap_mulai_global = (ap_mulai if ap_mulai_global is None
                           else min(ap_mulai_global, ap_mulai))
        ap_selesai_global = (ap_selesai if ap_selesai_global is None
                             else max(ap_selesai_global, ap_selesai))

    total_AP = sum(v["ap_tahunan"] for v in per_komponen.values()) * data.kpbu.ap_konsesi

    return {
        # ap_tahunan = jumlah seluruh stream (nilai puncak bila semua overlap)
        "ap_tahunan": total_ap_capex + total_ap_opex,
        "ap_mulai": ap_mulai_global,
        "ap_selesai": ap_selesai_global,
        "per_tahun": per_tahun,
        "per_komponen": per_komponen,
        "total_AP": total_AP,
        "breakdown": {
            "ap_untuk_capex": total_ap_capex,
            "ap_untuk_opex": total_ap_opex,
        },
    }
