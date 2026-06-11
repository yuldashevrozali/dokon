'use client'
import { useEffect, useState } from 'react'
import styles from "./dashboard.module.css"

type Sale = {
  _id: string
  productName: string
  quantity: number
  unit: string
  sellPrice: number
  total: number
  profit: number
  timestamp: string
  payment?: "Naqd" | "Karta" | "Qarz"
}

type LowStockProduct = {
  _id: string
  name: string
  stock: number
  unit: string
  lowStockLimit: number
}

type DashboardData = {
  todayTotal: number
  todayProfit: number
  todaySalesCount: number
  totalProducts: number
  totalStock: number
  outOfStock: number
  lowStockProducts: LowStockProduct[]
  recentSales: Sale[]
}

function formatUZS(n: number) {
  if (!Number.isFinite(n)) return "0"
  return new Intl.NumberFormat("en-US").format(Math.round(n))
}

function formatTime(ts: string) {
  const d = new Date(ts)
  return d.toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" })
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [resetting, setResetting] = useState(false)

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error)
        setData(d)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  async function handleReset() {
    const confirmed = window.confirm(
      "⚠️ DIQQAT!\n\nQuyidagilar O'CHIRILADI:\n• Barcha savdolar\n• Barcha kirimlar (ombor)\n• Barcha kassa harakatlari\n• Barcha qarzlar\n• Barcha mahsulotlar soni → 0 ga tushadi\n\nMahsulot nomlari va narxlari SAQLANADI.\n\nDavom etasizmi?"
    )
    if (!confirmed) return
    const confirmed2 = window.confirm("Oxirgi tasdiqlash: Hamma ma'lumot o'chiriladi. Ishonchingiz komilmi?")
    if (!confirmed2) return

    setResetting(true)
    try {
      const res = await fetch("/api/reset", { method: "POST" })
      if (!res.ok) throw new Error("Reset muvaffaqiyatsiz")
      window.location.reload()
    } catch (e) {
      alert("Xatolik: " + (e instanceof Error ? e.message : "Noma'lum xato"))
    } finally {
      setResetting(false)
    }
  }

  return (
    <>
      <header className={`${styles.topbar} fade-in`}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <button
            className={`${styles.hamburger} hamburger`}
            onClick={() => window.dispatchEvent(new CustomEvent("toggleSidebar"))}
          >
            ☰
          </button>
          <div className={styles.topLeft}>
            <h1 className={styles.pageTitle}>Dashboard</h1>
            <p className={styles.pageSubtitle}>
              Bugungi holat: <span className={styles.badgeOk}>Ochiq</span>{" "}
              <span className={styles.dot} /> Sana:{" "}
              {new Date().toLocaleDateString("uz-UZ")}
            </p>
          </div>
        </div>
        <div className={styles.topRight}>
          <div className={styles.searchWrap}>
            <IconSearch />
            <input className={styles.search} placeholder="Mahsulot yoki chek qidirish..." />
          </div>
          <button className={styles.iconBtn} title="Bildirishnomalar">
            <IconBell />
            <span className={styles.ping} />
          </button>
          <button
            onClick={handleReset}
            disabled={resetting}
            title="Tizimni qayta boshlash"
            style={{
              padding: "8px 14px",
              borderRadius: 12,
              border: "1px solid #fecaca",
              background: resetting ? "#f1f5f9" : "#fff5f5",
              color: "#b91c1c",
              fontWeight: 800,
              fontSize: 13,
              cursor: resetting ? "not-allowed" : "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {resetting ? "..." : "⟳ Restart"}
          </button>
        </div>
      </header>

      <section className={`${styles.content} slide-in`}>
        {loading && (
          <div style={{ textAlign: "center", padding: 60, color: "#94a3b8" }}>
            Ma&apos;lumotlar yuklanmoqda...
          </div>
        )}
        {error && (
          <div style={{ textAlign: "center", padding: 40, color: "#b91c1c", background: "#fee2e2", borderRadius: 14 }}>
            Xatolik: {error}
          </div>
        )}

        {data && (
          <>
            {/* Stat cards */}
            <div className={styles.statsGrid}>
              <StatCard
                icon={<IconBag />}
                label="Bugungi savdo"
                value={`${formatUZS(data.todayTotal)} so'm`}
                sub={`${data.todaySalesCount} ta chek`}
                delay={0}
              />
              <StatCard
                icon={<IconChart />}
                label="Bugungi foyda"
                value={`${formatUZS(data.todayProfit)} so'm`}
                sub={
                  data.todayTotal > 0
                    ? `Marja ~${Math.round((data.todayProfit / data.todayTotal) * 100)}%`
                    : "Hali savdo yo'q"
                }
                delay={0.1}
              />
              <StatCard
                icon={<IconWallet />}
                label="Qarzlar (jami)"
                value="—"
                sub="Qarz moduli tez kunda"
                delay={0.2}
              />
              <StatCard
                icon={<IconBox />}
                label="Ombor qoldiq"
                value={`${formatUZS(data.totalStock)} dona`}
                sub={`${data.lowStockProducts.length} ta oz qoldi${data.outOfStock ? `, ${data.outOfStock} ta tugagan` : ""}`}
                delay={0.3}
              />
            </div>

            {/* Quick actions */}
            <div className={`${styles.quickRow} fade-in`} style={{ animationDelay: "0.4s" }}>
              <a href="/savdo" className={styles.primaryBtn} style={{ textDecoration: "none", display: "inline-flex", gap: 10, alignItems: "center" }}>
                <IconPlus />
                Yangi savdo
              </a>
              <a href="/mahsulotlar" className={styles.secondaryBtn} style={{ textDecoration: "none", display: "inline-flex", gap: 10, alignItems: "center" }}>
                <IconPlus />
                Mahsulot qo&apos;shish
              </a>
              <a href="/qarz" className={styles.secondaryBtn} style={{ textDecoration: "none", display: "inline-flex", gap: 10, alignItems: "center" }}>
                <IconPlus />
                Qarz yozish
              </a>
              <button className={styles.ghostBtn}>
                <IconDownload />
                Excel eksport
              </button>
            </div>

            {/* Two columns */}
            <div className={`${styles.twoCol} fade-in`} style={{ animationDelay: "0.5s" }}>
              {/* Recent sales */}
              <div className={styles.panel}>
                <div className={styles.panelHeader}>
                  <div>
                    <div className={styles.panelTitle}>So&apos;nggi savdolar</div>
                    <div className={styles.panelSub}>Bugun va avvalgi cheklar</div>
                  </div>
                  <a href="/hisobot" className={styles.linkBtn}>Hammasi →</a>
                </div>

                {data.recentSales.length === 0 ? (
                  <div style={{ padding: 24, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
                    Hali savdo amalga oshirilmagan
                  </div>
                ) : (
                  <div className={styles.tableWrap}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Vaqt</th>
                          <th>Mahsulot</th>
                          <th>Miqdor</th>
                          <th>Narx</th>
                          <th className={styles.right}>Jami</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.recentSales.map((s) => (
                          <tr key={s._id}>
                            <td className={styles.mono}>{formatTime(s.timestamp)}</td>
                            <td>{s.productName}</td>
                            <td className={styles.mono}>{s.quantity} {s.unit}</td>
                            <td className={styles.mono}>{formatUZS(s.sellPrice)}</td>
                            <td className={`${styles.right} ${styles.mono}`}>
                              {formatUZS(s.total)} so&apos;m
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Right column */}
              <div className={styles.stack}>
                {/* Low stock */}
                <div className={styles.panel}>
                  <div className={styles.panelHeader}>
                    <div>
                      <div className={styles.panelTitle}>Ombor: oz qoldi</div>
                      <div className={styles.panelSub}>Limitdan past tushganlar</div>
                    </div>
                    <a href="/mahsulotlar" className={styles.linkBtn}>Inventar →</a>
                  </div>

                  {data.lowStockProducts.length === 0 ? (
                    <div style={{ padding: 20, textAlign: "center", color: "#16a34a", fontSize: 13 }}>
                      ✅ Barcha mahsulotlar yetarli
                    </div>
                  ) : (
                    <div className={styles.list}>
                      {data.lowStockProducts.map((p) => (
                        <div key={p._id} className={styles.listRow}>
                          <div className={styles.listLeft}>
                            <div className={styles.listName}>{p.name}</div>
                            <div className={styles.listMeta}>
                              Qoldi: <span className={styles.mono}>{p.stock} {p.unit}</span>
                              {" / limit: "}<span className={styles.mono}>{p.lowStockLimit}</span>
                            </div>
                          </div>
                          <span className={p.stock <= Math.floor(p.lowStockLimit / 2) ? styles.badgeDanger : styles.badgeWarn}>
                            {p.stock <= Math.floor(p.lowStockLimit / 2) ? "Juda kam" : "Kam"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Summary */}
                <div className={styles.panel}>
                  <div className={styles.panelHeader}>
                    <div>
                      <div className={styles.panelTitle}>Ombor xulosasi</div>
                      <div className={styles.panelSub}>Umumiy holat</div>
                    </div>
                  </div>
                  <div className={styles.debtList}>
                    <div className={styles.debtRow}>
                      <div className={styles.debtName}>Jami mahsulot turlari</div>
                      <div className={styles.debtMeta}>
                        <span className={styles.mono}>{data.totalProducts} xil</span>
                      </div>
                    </div>
                    <div className={styles.debtRow}>
                      <div className={styles.debtName}>Jami ombor qoldig&apos;i</div>
                      <div className={styles.debtMeta}>
                        <span className={styles.mono}>{formatUZS(data.totalStock)} dona</span>
                      </div>
                    </div>
                    <div className={styles.debtRow}>
                      <div className={styles.debtName}>Tugagan mahsulotlar</div>
                      <div className={styles.debtMeta}>
                        <span className={styles.mono} style={{ color: data.outOfStock > 0 ? "#b91c1c" : "#16a34a" }}>
                          {data.outOfStock} ta
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className={styles.debtFooter}>
                    <div className={styles.smallNote}>
                      Omborni muntazam tekshiring — tugagan mahsulot savdoni to&apos;xtatadi.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.footerNote}>
              <span className={styles.muted}>
                Ma&apos;lumotlar real vaqtda MongoDB&apos;dan olinmoqda.
              </span>
            </div>
          </>
        )}
      </section>
    </>
  )
}

function StatCard({ icon, label, value, sub, delay }: {
  icon: React.ReactNode
  label: string
  value: string
  sub?: string
  delay?: number
}) {
  return (
    <div className={`${styles.statCard} fade-in`} style={{ animationDelay: `${delay ?? 0}s` }}>
      <div className={styles.statTop}>
        <div className={styles.statIcon}>{icon}</div>
        <div className={styles.statLabel}>{label}</div>
      </div>
      <div className={styles.statValue}>{value}</div>
      {sub && <div className={styles.statSub}>{sub}</div>}
    </div>
  )
}

function IconBag() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M7 8V6a5 5 0 0 1 10 0v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M6 8h12l-1 13H7L6 8Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  )
}
function IconChart() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M4 19V5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M4 19h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M7 15l4-4 3 3 5-6" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}
function IconWallet() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v3h-6a2 2 0 0 0-2 2v0a2 2 0 0 0 2 2h6v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M15 12h7v4h-7a2 2 0 0 1-2-2v0a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  )
}
function IconBox() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M21 8.5 12 3 3 8.5 12 14l9-5.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M3 8.5V17l9 5 9-5V8.5" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M12 14v8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}
function IconSearch() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M10.5 18a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15Z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M21 21l-4.2-4.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}
function IconBell() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 7h18s-3 0-3-7Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M13.7 21a2 2 0 0 1-3.4 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}
function IconPlus() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}
function IconDownload() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M12 3v10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M8 11l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 21h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}
