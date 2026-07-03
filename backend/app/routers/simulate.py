# Router endpoint simulasi: menerima asumsi, memanggil kalkulator, mengembalikan hasil

from fastapi import APIRouter

from app.models.assumptions import (
    SimulationInput,
    GeneralAssumptions,
    SoftCostAssumptions,
    KPBUAssumptions,
    CapexKomponen,
)
from app.calculators import capex, financing, ap_revenue, pnl, cashflow, metrics

router = APIRouter()


@router.post("/simulate")
def simulate(data: SimulationInput):
    years = list(range(data.tahun_awal, data.tahun_awal + 90))

    capex_r = capex.calculate(data, years)
    finance_r = financing.calculate(data, capex_r, years)
    ap_r = ap_revenue.calculate(data, capex_r, years)
    pnl_r = pnl.calculate(data, ap_r, finance_r, capex_r, years)
    cf_r = cashflow.calculate(data, ap_r, capex_r, finance_r, pnl_r, years)
    metric_r = metrics.calculate(cf_r, data.general.wacc)

    return {
        "years": years,
        "capex": capex_r,
        "financing": finance_r,
        "ap_revenue": ap_r,
        "pnl": pnl_r,
        "cashflow": cf_r,
        "metrics": metric_r,
    }


@router.get("/simulate/example")
def example():
    return SimulationInput(
        general=GeneralAssumptions(),
        soft_cost=SoftCostAssumptions(),
        kpbu=KPBUAssumptions(),
        komponen=[
            CapexKomponen(
                nama="GSW Timur",
                tipe="non_komersial",
                biaya_konstruksi_juta=32968650,
                masa_konstruksi=3,
                mulai_konstruksi=2027,
                masa_operasi=20,
                masa_pinjaman=20,
            )
        ],
    )
