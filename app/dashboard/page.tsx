import styles from "./dashboard.module.css"

type Stat = {
  label: string
  value: string
  sub?: string
  icon: React.ReactNode
}

type SaleRow = {
  time: string
  receipt: string
  cashier: string
  items: number
  payment: "Naqd" | "Karta" | "Qarz"
  total: string
}

type LowStock = {
  name: string
  left: number
  unit: string
  status: "low" | "critical"
}

export default function DashboardPage() {
  // Demo data (keyin API’dan ulaysan)
  const stats: Stat[] = [
    {
      label: "Bugungi savdo",
      value: "1 250 000 so‘m",
      sub: "+12% kechagiga nisbatan",
      icon: <IconBag />,
    },
    {
      label: "Bugungi foyda",
      value: "320 000 so‘m",
      sub: "O‘rtacha marja ~25%",
      icon: <IconChart />,
    },
    {
      label: "Qarzlar (jami)",
      value: "540 000 so‘m",
      sub: "14 ta mijoz",
      icon: <IconWallet />,
    },
    {
      label: "Ombor qoldiq",
      value: "186 ta mahsulot",
      sub: "8 ta oz qoldi",
      icon: <IconBox />,
    },
  ]

  const recentSales: SaleRow[] = [
    {
      time: "10:12",
      receipt: "#A-1023",
      cashier: "Sotuvchi 1",
      items: 8,
      payment: "Naqd",
      total: "112 000",
    },
    {
      time: "11:05",
      receipt: "#A-1024",
      cashier: "Sotuvchi 2",
      items: 3,
      payment: "Karta",
      total: "58 000",
    },
    {
      time: "12:44",
      receipt: "#A-1025",
      cashier: "Sotuvchi 1",
      items: 12,
      payment: "Qarz",
      total: "205 000",
    },
    {
      time: "14:20",
      receipt: "#A-1026",
      cashier: "Sotuvchi 2",
      items: 2,
      payment: "Naqd",
      total: "21 000",
    },
  ]

  const lowStock: LowStock[] = [
    { name: "Shakar", left: 5, unit: "dona", status: "critical" },
    { name: "Un (2kg)", left: 3, unit: "dona", status: "critical" },
    { name: "Choy", left: 9, unit: "quti", status: "low" },
    { name: "Yog‘ (1L)", left: 7, unit: "dona", status: "low" },
  ]

  const topDebts = [
    { name: "Otabek", amount: "160 000", days: 12 },
    { name: "Dilshod", amount: "120 000", days: 8 },
    { name: "Mahliyo", amount: "90 000", days: 20 },
  ]

  return (
    <>
      {/* Topbar */}
      <header className={`${styles.topbar} fade-in`}>
        <button className={styles.hamburger} onClick={() => window.dispatchEvent(new CustomEvent('toggleSidebar'))}>
          ☰
        </button>
        <div className={styles.topLeft}>
          <h1 className={styles.pageTitle}>Dashboard</h1>
          <p className={styles.pageSubtitle}>
            Bugungi holat: <span className={styles.badgeOk}>Ochiq</span>{" "}
            <span className={styles.dot} /> Sana:{" "}
            {new Date().toLocaleDateString()}
          </p>
        </div>

        <div className={styles.topRight}>
          <div className={styles.searchWrap}>
            <IconSearch />
            <input
              className={styles.search}
              placeholder="Mahsulot, mijoz yoki чек qidirish..."
            />
          </div>

          <button className={styles.iconBtn} title="Bildirishnomalar">
            <IconBell />
            <span className={styles.ping} />
          </button>
        </div>
      </header>

      {/* Content grid */}
      <section className={`${styles.content} slide-in`}>
        {/* Stat cards */}
        <div className={styles.statsGrid}>
          {stats.map((s, i) => (
            <div key={s.label} className={`${styles.statCard} fade-in`} style={{ animationDelay: `${i * 0.1}s` }}>
              <div className={styles.statTop}>
                <div className={styles.statIcon}>{s.icon}</div>
                <div className={styles.statLabel}>{s.label}</div>
              </div>
              <div className={styles.statValue}>{s.value}</div>
              {s.sub ? <div className={styles.statSub}>{s.sub}</div> : null}
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div className={`${styles.quickRow} fade-in`} style={{ animationDelay: '0.4s' }}>
          <button className={styles.primaryBtn}>
            <IconPlus />
            Yangi savdo
          </button>
          <button className={styles.secondaryBtn}>
            <IconPlus />
            Mahsulot qo‘shish
          </button>
          <button className={styles.secondaryBtn}>
            <IconPlus />
            Qarz yozish
          </button>
          <button className={styles.ghostBtn}>
            <IconDownload />
            Excel eksport
          </button>
        </div>

        {/* Two columns */}
        <div className={`${styles.twoCol} fade-in`} style={{ animationDelay: '0.5s' }}>
          {/* Left column */}
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <div className={styles.panelTitle}>So‘nggi savdolar</div>
                <div className={styles.panelSub}>
                  Bugun amalga oshgan cheklar
                </div>
              </div>
              <button className={styles.linkBtn}>Hammasi →</button>
            </div>

            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Vaqt</th>
                    <th>Chek</th>
                    <th>Sotuvchi</th>
                    <th>Item</th>
                    <th>To‘lov</th>
                    <th className={styles.right}>Summa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentSales.map((r) => (
                      <tr key={r.receipt}>
                        <td className={styles.mono}>{r.time}</td>
                        <td className={styles.mono}>{r.receipt}</td>
                        <td>{r.cashier}</td>
                        <td className={styles.mono}>{r.items}</td>
                        <td>
                          <PaymentPill value={r.payment} />
                        </td>
                        <td className={`${styles.right} ${styles.mono}`}>
                          {r.total} so‘m
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right column */}
            <div className={styles.stack}>
              {/* Low stock */}
              <div className={styles.panel}>
                <div className={styles.panelHeader}>
                  <div>
                    <div className={styles.panelTitle}>Ombor: oz qoldi</div>
                    <div className={styles.panelSub}>
                      Limitdan past tushganlar
                    </div>
                  </div>
                  <button className={styles.linkBtn}>Inventar →</button>
                </div>

                <div className={styles.list}>
                  {lowStock.map((p) => (
                    <div key={p.name} className={styles.listRow}>
                      <div className={styles.listLeft}>
                        <div className={styles.listName}>{p.name}</div>
                        <div className={styles.listMeta}>
                          Qoldi:{" "}
                          <span className={styles.mono}>
                            {p.left} {p.unit}
                          </span>
                        </div>
                      </div>
                      <span
                        className={
                          p.status === "critical"
                            ? styles.badgeDanger
                            : styles.badgeWarn
                        }
                      >
                        {p.status === "critical" ? "Juda kam" : "Kam"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Debts */}
              <div className={styles.panel}>
                <div className={styles.panelHeader}>
                  <div>
                    <div className={styles.panelTitle}>Qarzlar TOP</div>
                    <div className={styles.panelSub}>
                      Eng katta qarzdorlar
                    </div>
                  </div>
                  <button className={styles.linkBtn}>Qarz daftar →</button>
                </div>

                <div className={styles.debtList}>
                  {topDebts.map((d) => (
                    <div key={d.name} className={styles.debtRow}>
                      <div className={styles.debtName}>{d.name}</div>
                      <div className={styles.debtMeta}>
                        <span className={styles.mono}>{d.amount} so‘m</span>
                        <span className={styles.dot} />
                        <span>{d.days} kun</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className={styles.debtFooter}>
                  <div className={styles.smallNote}>
                    Eslatma: qarzlar tarixini muntazam yuritsangiz, “unutib
                    ketish” kamayadi.
                  </div>
                  <button className={styles.secondaryBtn}>
                    <IconPlus />
                    Qarz qo‘shish
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div className={styles.footerNote}>
            <span className={styles.muted}>
              Bu dizayn demo. Keyin API ulanadi: savdo, qoldiq, foyda, qarz —
              hammasi real bo‘ladi.
            </span>
          </div>
        </section>
    </>
  )
}


function PaymentPill({ value }: { value: "Naqd" | "Karta" | "Qarz" }) {
  const cls =
    value === "Naqd"
      ? styles.pillOk
      : value === "Karta"
        ? styles.pillInfo
        : styles.pillWarn

  return <span className={`${styles.pill} ${cls}`}>{value}</span>
}

function IconBag() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M7 8V6a5 5 0 0 1 10 0v2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M6 8h12l-1 13H7L6 8Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  )
}
function IconChart() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 19V5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M4 19h16"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M7 15l4-4 3 3 5-6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )
}
function IconWallet() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v3h-6a2 2 0 0 0-2 2v0a2 2 0 0 0 2 2h6v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M15 12h7v4h-7a2 2 0 0 1-2-2v0a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  )
}
function IconBox() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M21 8.5 12 3 3 8.5 12 14l9-5.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M3 8.5V17l9 5 9-5V8.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M12 14v8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}
function IconSearch() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M10.5 18a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M21 21l-4.2-4.2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}
function IconBell() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 7h18s-3 0-3-7Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M13.7 21a2 2 0 0 1-3.4 0"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}
function IconPlus() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 5v14M5 12h14"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}
function IconDownload() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 3v10"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M8 11l4 4 4-4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 21h16"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}
