"use client"

import { useEffect, useState } from "react"

type PeriodStat = { total: number; profit: number; count: number }
type DayStat = { date: string; total: number; profit: number; count: number }
type TopProduct = { name: string; quantity: number; revenue: number; profit: number }
type HisobotData = {
  periodStats: { today: PeriodStat; week: PeriodStat; month: PeriodStat; all: PeriodStat }
  dailyStats: DayStat[]
  topProducts: TopProduct[]
}

type Period = "today" | "week" | "month" | "all"
type ChartRange = "7" | "30"

function fmt(n: number) {
  return new Intl.NumberFormat("en-US").format(Math.round(n))
}

// SVG Bar chart
function BarChart({ data, range }: { data: DayStat[]; range: ChartRange }) {
  const days = range === "7" ? data.slice(-7) : data
  const maxVal = Math.max(...days.map(d => d.total), 1)
  const W = 600
  const H = 160
  const barW = Math.floor((W - days.length * 2) / days.length)
  const gap = 2

  function dayLabel(dateStr: string) {
    const d = new Date(dateStr)
    return range === "7"
      ? ["Ya", "Du", "Se", "Ch", "Pa", "Ju", "Sh"][d.getDay()]
      : String(d.getDate())
  }

  return (
    <svg viewBox={`0 0 ${W} ${H + 30}`} style={{ width: "100%", height: "auto", display: "block" }}>
      {days.map((d, i) => {
        const barH = d.total > 0 ? Math.max(4, Math.round((d.total / maxVal) * H)) : 2
        const profitH = d.profit > 0 ? Math.round((d.profit / maxVal) * H) : 0
        const x = i * (barW + gap)
        const isToday = d.date === new Date().toISOString().slice(0, 10)
        return (
          <g key={d.date}>
            {/* Revenue bar */}
            <rect x={x} y={H - barH} width={barW} height={barH} rx={3}
              fill={isToday ? "#2563eb" : "#93c5fd"} opacity={0.9} />
            {/* Profit bar overlay */}
            {profitH > 0 && (
              <rect x={x} y={H - profitH} width={barW} height={profitH} rx={3}
                fill={isToday ? "#16a34a" : "#86efac"} opacity={0.8} />
            )}
            {/* Day label */}
            <text x={x + barW / 2} y={H + 18} textAnchor="middle"
              fontSize={range === "7" ? 11 : 9} fill={isToday ? "#2563eb" : "#94a3b8"} fontWeight={isToday ? "bold" : "normal"}>
              {dayLabel(d.date)}
            </text>
          </g>
        )
      })}
      {/* Baseline */}
      <line x1={0} y1={H} x2={W} y2={H} stroke="#eef2f7" strokeWidth={1} />
    </svg>
  )
}

export default function HisobotPage() {
  const [data, setData] = useState<HisobotData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [period, setPeriod] = useState<Period>("month")
  const [chartRange, setChartRange] = useState<ChartRange>("7")

  useEffect(() => {
    fetch("/api/hisobot")
      .then(r => r.json())
      .then(d => { if (d.error) throw new Error(d.error); setData(d) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const periodLabels: Record<Period, string> = {
    today: "Bugun", week: "Bu hafta", month: "Bu oy", all: "Barcha vaqt",
  }

  const stat = data?.periodStats[period]
  const margin = stat && stat.total > 0 ? Math.round((stat.profit / stat.total) * 100) : 0

  return (
    <div style={{ background: "#f7f8fb", minHeight: "100vh", padding: 22 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22, flexWrap: "wrap" }}>
        <button
          className="hamburger"
          onClick={() => window.dispatchEvent(new CustomEvent("toggleSidebar"))}
          style={{ background: "#2563eb", color: "#fff", border: "none", borderRadius: 8, padding: "8px 12px", cursor: "pointer", fontSize: 16 }}
        >☰</button>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: "#0f172a" }}>Hisobot</h1>
          <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 13 }}>Savdo statistikasi va foyda tahlili</p>
        </div>
        <button
          onClick={() => { setLoading(true); fetch("/api/hisobot").then(r => r.json()).then(d => setData(d)).finally(() => setLoading(false)) }}
          style={{ background: "#fff", border: "1px solid #e5e7ef", borderRadius: 10, padding: "8px 14px", cursor: "pointer", fontSize: 13, fontWeight: 700 }}
        >
          Yangilash
        </button>
      </div>

      {loading && <div style={{ textAlign: "center", padding: 60, color: "#94a3b8" }}>Yuklanmoqda...</div>}
      {error && <div style={{ background: "#fee2e2", color: "#b91c1c", borderRadius: 14, padding: 20 }}>Xatolik: {error}</div>}

      {data && (
        <>
          {/* Period tabs */}
          <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
            {(["today", "week", "month", "all"] as Period[]).map(p => (
              <button key={p} onClick={() => setPeriod(p)} style={{
                padding: "9px 18px", borderRadius: 12, border: "1px solid",
                fontWeight: 700, fontSize: 13, cursor: "pointer",
                background: period === p ? "#2563eb" : "#fff",
                color: period === p ? "#fff" : "#334155",
                borderColor: period === p ? "#2563eb" : "#e5e7ef",
              }}>
                {periodLabels[p]}
              </button>
            ))}
          </div>

          {/* Period stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12, marginBottom: 22 }}>
            <SCard label="Savdo summasi" value={`${fmt(stat!.total)} so'm`} color="#1e40af" bg="#dbeafe" />
            <SCard label="Foyda" value={`${fmt(stat!.profit)} so'm`} color="#065f46" bg="#d1fae5" />
            <SCard label="Marja" value={`${margin}%`} color="#92400e" bg="#fef3c7" />
            <SCard label="Cheklar soni" value={`${stat!.count} ta`} color="#4c1d95" bg="#ede9fe" />
          </div>

          {/* Chart */}
          <div style={{ background: "#fff", border: "1px solid #e8ebf3", borderRadius: 18, padding: "18px 20px", marginBottom: 22, boxShadow: "0 4px 20px rgba(15,23,42,.04)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
              <div>
                <div style={{ fontWeight: 900, fontSize: 15, color: "#0f172a" }}>Kunlik savdo grafigi</div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                  <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 2, background: "#93c5fd", marginRight: 4 }} />Ko&apos;k — savdo &nbsp;
                  <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 2, background: "#86efac", marginRight: 4 }} />Yashil — foyda
                </div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {(["7", "30"] as ChartRange[]).map(r => (
                  <button key={r} onClick={() => setChartRange(r)} style={{
                    padding: "6px 12px", borderRadius: 9, border: "1px solid",
                    fontSize: 12, fontWeight: 700, cursor: "pointer",
                    background: chartRange === r ? "#0f172a" : "#f8fafc",
                    color: chartRange === r ? "#fff" : "#334155",
                    borderColor: chartRange === r ? "#0f172a" : "#e5e7ef",
                  }}>
                    {r === "7" ? "7 kun" : "30 kun"}
                  </button>
                ))}
              </div>
            </div>
            <BarChart data={data.dailyStats} range={chartRange} />
          </div>

          {/* TOP products */}
          <div style={{ background: "#fff", border: "1px solid #e8ebf3", borderRadius: 18, overflow: "hidden", boxShadow: "0 4px 20px rgba(15,23,42,.04)" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #eef2f7" }}>
              <div style={{ fontWeight: 900, fontSize: 15, color: "#0f172a" }}>TOP-10 mahsulotlar</div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>Barcha vaqt bo&apos;yicha daromad bo&apos;yicha saralangan</div>
            </div>

            {data.topProducts.length === 0 ? (
              <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>
                Hali savdo ma&apos;lumoti yo&apos;q
              </div>
            ) : (
              <div style={{ padding: "12px 20px" }}>
                {data.topProducts.map((p, i) => {
                  const maxRev = data.topProducts[0].revenue
                  const pct = Math.round((p.revenue / maxRev) * 100)
                  const margin = p.revenue > 0 ? Math.round((p.profit / p.revenue) * 100) : 0
                  return (
                    <div key={p.name} style={{ marginBottom: 14 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, gap: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                          <span style={{ width: 24, height: 24, borderRadius: 8, background: i < 3 ? ["#fef3c7", "#f1f5f9", "#fce7f3"][i] : "#f8fafc", color: i < 3 ? ["#92400e", "#334155", "#9d174d"][i] : "#64748b", display: "grid", placeItems: "center", fontSize: 11, fontWeight: 900, flexShrink: 0 }}>
                            {i + 1}
                          </span>
                          <span style={{ fontWeight: 800, fontSize: 14, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</span>
                        </div>
                        <div style={{ display: "flex", gap: 16, flexShrink: 0, fontSize: 13 }}>
                          <span style={{ color: "#64748b" }}>{p.quantity} dona</span>
                          <span style={{ color: "#16a34a", fontWeight: 800 }}>{fmt(p.profit)} so&apos;m foyda</span>
                          <span style={{ fontWeight: 900, color: "#0f172a" }}>{fmt(p.revenue)} so&apos;m</span>
                        </div>
                      </div>
                      <div style={{ height: 6, background: "#f1f5f9", borderRadius: 999, overflow: "hidden" }}>
                        <div style={{ display: "flex", height: "100%" }}>
                          <div style={{ width: `${pct - (pct * margin / 100)}%`, background: "#93c5fd", transition: "width 0.4s" }} />
                          <div style={{ width: `${pct * margin / 100}%`, background: "#4ade80", transition: "width 0.4s" }} />
                        </div>
                      </div>
                      <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>Marja: {margin}%</div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}

      <style>{`@media (max-width: 768px) { .hamburger { display: block !important; } }`}</style>
    </div>
  )
}

function SCard({ label, value, color, bg }: { label: string; value: string; color: string; bg: string }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #e8ebf3", borderRadius: 14, padding: "14px 16px", boxShadow: "0 2px 10px rgba(15,23,42,.03)" }}>
      <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700, marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 900, color, background: bg, borderRadius: 8, padding: "4px 10px", display: "inline-block" }}>{value}</div>
    </div>
  )
}
