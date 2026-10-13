from pydantic import BaseModel, model_validator
from typing import List, Literal

# Skema cakupan AP:
#   capex_opex   : AP = 100% pengembalian capex + biaya O&M (O&M ditanggung BUP)
#   capex_only   : AP = 100% pengembalian capex saja; O&M di luar lingkup BUP
#   capex_persen : AP = (ap_coverage x 100)% pengembalian capex + biaya O&M
APMode = Literal["capex_opex", "capex_only", "capex_persen"]


class GeneralAssumptions(BaseModel):
    inflasi: float = 0.03
    bunga: float = 0.0975
    wacc: float = 0.086922
    ppn: float = 0.12
    pph_badan: float = 0.22
    kurs: float = 16500
    porsi_ekuitas: float = 0.20
    porsi_pinjaman: float = 0.80
    masa_pinjaman: int = 20


class SoftCostAssumptions(BaseModel):
    biaya_perencana: float = 0.0125
    biaya_supervisi: float = 0.0125
    biaya_overhead: float = 0.015
    biaya_eskalasi: float = 0.03
    financial_fee: float = 0.01
    upfront_fee: float = 0.007


class CapexKomponen(BaseModel):
    nama: str
    tipe: str  # "non_komersial" atau "komersial"
    biaya_konstruksi_juta: float
    masa_konstruksi: int
    mulai_konstruksi: int  # tahun kalender, misal 2027
    masa_operasi: int
    masa_pinjaman: int = 20


class KPBUAssumptions(BaseModel):
    ap_start_year: int = 6
    ap_konsesi: int = 20
    ap_mode: APMode = "capex_opex"
    # Persentase pengembalian capex yang ditanggung AP (dipakai pada mode
    # capex_persen; 1.0 = 100%).
    ap_coverage: float = 1.0

    @model_validator(mode="before")
    @classmethod
    def _kompat_lama(cls, v):
        # Payload lama tanpa ap_mode: coverage < 1 dibaca sebagai capex_persen
        if isinstance(v, dict) and "ap_mode" not in v:
            cov = v.get("ap_coverage", 1.0)
            if cov is not None and float(cov) < 0.999:
                v = {**v, "ap_mode": "capex_persen"}
        return v

    def porsi_capex(self) -> float:
        """Porsi pengembalian capex yang dibayar AP (0..1)."""
        if self.ap_mode == "capex_persen":
            return min(max(self.ap_coverage, 0.0), 1.0)
        return 1.0

    def opex_dalam_lingkup(self) -> bool:
        """True bila biaya O&M ditanggung BUP dan dibayar melalui AP."""
        return self.ap_mode != "capex_only"


class SimulationInput(BaseModel):
    tahun_awal: int = 2026
    general: GeneralAssumptions
    soft_cost: SoftCostAssumptions
    komponen: List[CapexKomponen]
    kpbu: KPBUAssumptions
    biaya_om_persen: float = 0.01

    model_config = {
        "json_schema_extra": {
            "example": {
                "tahun_awal": 2026,
                "general": {
                    "inflasi": 0.03,
                    "bunga": 0.0975,
                    "wacc": 0.086922,
                    "ppn": 0.12,
                    "pph_badan": 0.22,
                    "kurs": 16500,
                    "porsi_ekuitas": 0.20,
                    "porsi_pinjaman": 0.80,
                    "masa_pinjaman": 20,
                },
                "soft_cost": {
                    "biaya_perencana": 0.0125,
                    "biaya_supervisi": 0.0125,
                    "biaya_overhead": 0.015,
                    "biaya_eskalasi": 0.03,
                    "financial_fee": 0.01,
                    "upfront_fee": 0.007,
                },
                "komponen": [
                    {
                        "nama": "GSW Timur",
                        "tipe": "non_komersial",
                        "biaya_konstruksi_juta": 32968650,
                        "masa_konstruksi": 3,
                        "mulai_konstruksi": 2027,
                        "masa_operasi": 20,
                        "masa_pinjaman": 20,
                    }
                ],
                "kpbu": {
                    "ap_start_year": 6,
                    "ap_konsesi": 20,
                    "ap_mode": "capex_opex",
                    "ap_coverage": 1.0,
                },
                "biaya_om_persen": 0.01,
            }
        }
    }
