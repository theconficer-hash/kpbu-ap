# Router endpoint export: menghasilkan file Excel dari hasil simulasi

import io

from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from app.models.assumptions import SimulationInput
from app.calculators import capex, financing, ap_revenue, pnl, cashflow, metrics
from app.exporters import excel

router = APIRouter()


@router.post("/export")
def export(data: SimulationInput):
    years = list(range(data.tahun_awal, data.tahun_awal + 90))

    capex_r = capex.calculate(data, years)
    finance_r = financing.calculate(data, capex_r, years)
    ap_r = ap_revenue.calculate(data, capex_r, years)
    pnl_r = pnl.calculate(data, ap_r, finance_r, capex_r, years)
    cf_r = cashflow.calculate(data, ap_r, capex_r, finance_r, pnl_r, years)
    metric_r = metrics.calculate(cf_r, data.general.wacc)

    content = excel.generate(
        data, years, capex_r, finance_r, ap_r, pnl_r, cf_r, metric_r
    )

    return StreamingResponse(
        io.BytesIO(content),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": "attachment; filename=Simulasi_KPBU_AP.xlsx"
        },
    )
