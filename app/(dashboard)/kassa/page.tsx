"use client"

import { useEffect, useState, useMemo } from "react"

type TxType = "income" | "expense" | "withdrawal" | "deposit"
type TxSource = "sale" | "stock" | "manual"

type TxRow = {
  _id: string
  type: TxType
  source: TxSource
  category: string
  description: string
  amount: number
  date: string
}

type KassaData = {
  balance: number
  totalIncome: number
  totalDeposits: number
  totalStockExpense: number
  totalOtherExpense: number
  totalWithdrawals: number
  todayIncome: number
  todayExpense: number
  history: TxRow[]
}

type ModalType = "expense" | "withdrawal" | "deposit" | null

const EXPENSE_CATEGORIES = [
  { value: "kommunal", label: "Kommunal (suv, svet, gaz)" },
  { value: "soliq", label: "Soliq va davlat to'lovlari" },
  { value: "ijara", label: "Ijara" },
  { value: "ish_haqi", label: "Ish haqi" },
  { value: "taminot", label: "Mahsulot ta'minoti" },
  { value: "tamirlar", label: "Ta'mirlash / texnik" },
  { value: "boshqa", label: "Boshqa xarajat" },
]

function fmt(n: number) {
  return new Intl.NumberFormat("en-US").format(Math.round(Math.abs(n)))
}
function fmtDate(s: string) {
  const d = new Date(s)
  return d.toLocaleDateString("uz-UZ") + " " + d.toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" })
}

const TYPE_META: Record<TxType, { color: string; bg: string; sign: "+" | "−"; label: string }> = {
  income:     { color: "#065f46", bg: "#d1fae5", sign: "+", label: "Savdo kirimi" },
  deposit:    { color: "#1e40af", bg: "#dbeafe", sign: "+", label: "Pul kiritish" },
  expense:    { color: "#b91c1c", bg: "#fee2e2", sign: "−", label: "Chiqim" },
  withdrawal: { color: "#92400e", bg: "#fef3c7", sign: "−", label: "Yechim" },
}
const SOURCE_ICON: Record<TxSource, string> = {
  sale: "🛍", stock: "📦", manual: "📝",
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: 440, boxShadow: "0 24px 60px rgba(0,0,0,.18)" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #eef2f7", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontWeight: 900, fontSize: 16, color: "#0f172a" }}>{title}</div>
          <button onClick={onClose} style={{ background: "#f1f5f9", border: "none", borderRadius: 10, width: 32, height: 32, cursor: "pointer", fontSize: 18, color: "#64748b", display: "grid", placeItems: "center" }}>×</button>
        </div>
        <div style={{ padding: 20 }}>{children}</div>
      </div>
    </div>
  )
}

function TxForm({ type, onSave, onClose }: {
  type: "expense" | "withdrawal" | "deposit"
  onSave: (tx: TxRow) => void
  onClose: () => void
}) {
  const isWithdrawal = type === "withdrawal"
  const isDeposit = type === "deposit"
  const [form, setForm] = useState({
    category: isWithdrawal ? "shaxsiy_yechim" : isDeposit ? "naqd_kirim" : "kommunal",
    description: "",
    amount: "",
  })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState("")

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const amount = Number(form.amount)
    if (!amount || amount <= 0) { setErr("To'g'ri summa kiriting"); return }
    if (!form.description.trim()) { setErr("Tavsif kiriting"); return }
    setSaving(true)
    try {
      const res = await fetch("/api/kassa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, category: form.category, amount, description: form.description.trim() }),
      })
      if (!res.ok) throw new Error("Xatolik")
      const saved = await res.json()
      onSave({
        _id: saved._id, type, source: "manual",
        category: saved.category, description: saved.description,
        amount: saved.amount, date: saved.createdAt,
      })
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Xatolik")
    } finally {
      setSaving(false)
    }
  }

  const btnColor = isDeposit ? "#2563eb" : isWithdrawal ? "#d97706" : "#dc2626"
  const btnLabel = isDeposit ? "💰 Pul kiritish" : isWithdrawal ? "💸 Pul yechish" : "➖ Chiqim qo'shish"

  return (
    <form onSubmit={submit} style={{ display: "grid", gap: 14 }}>
      {err && <div style={{ background: "#fee2e2", color: "#b91c1c", borderRadius: 10, padding: "10px 12px", fontSize: 13 }}>{err}</div>}

      {isDeposit && (
        <div style={{ background: "#dbeafe", border: "1px solid #93c5fd", borderRadius: 10, padding: "10px 12px", fontSize: 13, color: "#1e40af" }}>
          💰 Kassaga naqd pul qo&apos;shiladi. Balans oshadi.
        </div>
      )}

      {!isWithdrawal && !isDeposit && (
        <div style={{ display: "grid", gap: 6 }}>
          <label style={lbl}>Kategoriya</label>
          <select style={inp} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
            {EXPENSE_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
      )}

      <div style={{ display: "grid", gap: 6 }}>
        <label style={lbl}>
          {isDeposit ? "Izoh (masalan: boshlang'ich balans)" : isWithdrawal ? "Izoh (ixtiyoriy)" : "Tavsif *"}
        </label>
        <input
          style={inp}
          value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          placeholder={isDeposit ? "Masalan: Boshlang'ich kassa" : isWithdrawal ? "Shaxsiy xarajat" : "Sentabr ijara to'lovi"}
        />
      </div>

      <div style={{ display: "grid", gap: 6 }}>
        <label style={lbl}>Summa (so&apos;m) *</label>
        <input style={inp} type="number" min="1" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0" />
      </div>

      {isWithdrawal && (
        <div style={{ background: "#fef3c7", border: "1px solid #fde68a", borderRadius: 10, padding: "10px 12px", fontSize: 13, color: "#92400e" }}>
          ⚠️ Bu pul do&apos;kon kassasidan <strong>sizga</strong> o&apos;tadi. Kassa balansi kamayadi.
        </div>
      )}

      <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
        <button type="button" onClick={onClose} style={secondaryBtn}>Bekor qilish</button>
        <button type="submit" disabled={saving} style={{ ...primaryBtn, flex: 1, background: btnColor }}>
          {saving ? "Saqlanmoqda..." : btnLabel}
        </button>
      </div>
    </form>
  )
}

export default function KassaPage() {
  const [data, setData] = useState<KassaData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [modal, setModal] = useState<ModalType>(null)
  const [filterType, setFilterType] = useState<"all" | TxType>("all")
  const [query, setQuery] = useState("")
  const [deleting, setDeleting] = useState<string | null>(null)

  function load() {
    setLoading(true)
    fetch("/api/kassa")
      .then(r => r.json())
      .then(d => { if (d.error) throw new Error(d.error); setData(d) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  function onSaved(tx: TxRow) {
    setModal(null)
    load() // Balansni to'g'ri hisoblash uchun qayta yuklash
  }

  async function deleteManual(id: string) {
    if (!confirm("Ushbu yozuvni o'chirishni tasdiqlaysizmi?")) return
    setDeleting(id)
    try {
      await fetch(`/api/kassa/${id}`, { method: "DELETE" })
      load()
    } finally {
      setDeleting(null)
    }
  }

  const filtered = useMemo(() => {
    if (!data) return []
    const q = query.trim().toLowerCase()
    return data.history.filter(t => {
      if (filterType !== "all" && t.type !== filterType) return false
      if (q && !t.description.toLowerCase().includes(q)) return false
      return true
    })
  }, [data, filterType, query])

  const isPositive = (data?.balance ?? 0) >= 0

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
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: "#0f172a" }}>Kassa</h1>
          <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 13 }}>Do&apos;kon moliyaviy harakatlari</p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={() => setModal("deposit")} style={{ ...primaryBtn, background: "#2563eb" }}>
            💰 Pul kiritish
          </button>
          <button onClick={() => setModal("expense")} style={{ ...primaryBtn, background: "#dc2626" }}>
            ➖ Chiqim
          </button>
          <button onClick={() => setModal("withdrawal")} style={{ ...primaryBtn, background: "#d97706" }}>
            💸 Yechish
          </button>
        </div>
      </div>

      {loading && <div style={{ textAlign: "center", padding: 60, color: "#94a3b8" }}>Yuklanmoqda...</div>}
      {error && <div style={{ background: "#fee2e2", color: "#b91c1c", borderRadius: 14, padding: 20, marginBottom: 16 }}>Xatolik: {error}</div>}

      {data && (
        <>
          {/* Balans kartasi */}
          <div style={{
            background: isPositive
              ? "linear-gradient(135deg,#1d4ed8,#2563eb)"
              : "linear-gradient(135deg,#b91c1c,#dc2626)",
            borderRadius: 20, padding: "24px 28px", marginBottom: 18,
            boxShadow: `0 12px 40px ${isPositive ? "rgba(37,99,235,.25)" : "rgba(185,28,28,.25)"}`,
            color: "#fff",
          }}>
            <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 8, fontWeight: 700, letterSpacing: 1 }}>KASSA BALANSI</div>
            <div style={{ fontSize: 38, fontWeight: 900, letterSpacing: "-1px" }}>
              {isPositive ? "+" : "−"}{fmt(data.balance)}
              <span style={{ fontSize: 20, opacity: 0.7, marginLeft: 8 }}>so&apos;m</span>
            </div>
            <div style={{ display: "flex", gap: 28, marginTop: 16, flexWrap: "wrap" }}>
              <Stat label="Bugungi kirim" value={`+${fmt(data.todayIncome)} so'm`} />
              <Stat label="Bugungi chiqim" value={`−${fmt(data.todayExpense)} so'm`} />
            </div>
          </div>

          {/* Statistika */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: 12, marginBottom: 20 }}>
            <SCard label="Jami savdo kirimi" value={`+${fmt(data.totalIncome)}`} color="#065f46" bg="#d1fae5" />
            <SCard label="Qo'lda kiritilgan" value={`+${fmt(data.totalDeposits)}`} color="#1e40af" bg="#dbeafe" />
            <SCard label="Mahsulot xarajati" value={`−${fmt(data.totalStockExpense)}`} color="#b91c1c" bg="#fee2e2" />
            <SCard label="Boshqa xarajatlar" value={`−${fmt(data.totalOtherExpense)}`} color="#b91c1c" bg="#fee2e2" />
            <SCard label="Jami yechimlar" value={`−${fmt(data.totalWithdrawals)}`} color="#92400e" bg="#fef3c7" />
          </div>

          {/* Filtr */}
          <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
            <input
              style={{ borderRadius: 12, border: "1px solid #e5e7ef", padding: "9px 12px", background: "#fff", outline: "none", fontSize: 14, minWidth: 200 }}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Qidirish..."
            />
            {(["all", "income", "deposit", "expense", "withdrawal"] as const).map(f => (
              <button key={f} onClick={() => setFilterType(f)} style={{
                padding: "7px 13px", borderRadius: 10, border: "1px solid", fontWeight: 700, fontSize: 12, cursor: "pointer",
                background: filterType === f ? "#0f172a" : "#fff",
                color: filterType === f ? "#fff" : "#334155",
                borderColor: filterType === f ? "#0f172a" : "#e5e7ef",
              }}>
                {{ all: "Hammasi", income: "Savdo", deposit: "Kiritish", expense: "Chiqim", withdrawal: "Yechim" }[f]}
              </button>
            ))}
            <span style={{ color: "#64748b", fontSize: 12, marginLeft: "auto" }}>{filtered.length} ta</span>
          </div>

          {/* Tarix */}
          <div style={{ background: "#fff", border: "1px solid #e8ebf3", borderRadius: 18, overflow: "hidden", boxShadow: "0 4px 20px rgba(15,23,42,.04)" }}>
            {filtered.length === 0 ? (
              <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>💰</div>
                Yozuv topilmadi
              </div>
            ) : (
              filtered.map((tx, i) => {
                const meta = TYPE_META[tx.type]
                const canDelete = tx.source === "manual"
                return (
                  <div key={tx._id} style={{
                    display: "flex", alignItems: "center", gap: 14, padding: "13px 18px",
                    borderBottom: i < filtered.length - 1 ? "1px solid #f1f5f9" : "none",
                  }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: meta.bg, display: "grid", placeItems: "center", fontSize: 18, flexShrink: 0 }}>
                      {tx.type === "deposit" ? "💰" : SOURCE_ICON[tx.source]}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: 14, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {tx.description}
                      </div>
                      <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
                        <span style={{ background: meta.bg, color: meta.color, borderRadius: 6, padding: "1px 7px", fontSize: 11, fontWeight: 700, marginRight: 8 }}>
                          {meta.label}
                        </span>
                        {fmtDate(tx.date)}
                      </div>
                    </div>
                    <div style={{ fontWeight: 900, fontSize: 16, color: meta.color, flexShrink: 0 }}>
                      {meta.sign}{fmt(tx.amount)} so&apos;m
                    </div>
                    {canDelete && (
                      <button
                        onClick={() => deleteManual(tx._id)}
                        disabled={deleting === tx._id}
                        title="O'chirish"
                        style={{ background: "#fff5f5", color: "#b91c1c", border: "1px solid #fecaca", borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 16, display: "grid", placeItems: "center", flexShrink: 0 }}
                      >×</button>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </>
      )}

      {(modal === "expense" || modal === "withdrawal" || modal === "deposit") && (
        <Modal
          title={modal === "deposit" ? "💰 Kassaga pul kiritish" : modal === "withdrawal" ? "💸 Kassadan pul yechish" : "➖ Chiqim qo'shish"}
          onClose={() => setModal(null)}
        >
          <TxForm type={modal} onSave={onSaved} onClose={() => setModal(null)} />
        </Modal>
      )}

      <style>{`@media (max-width: 768px) { .hamburger { display: block !important; } }`}</style>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 11, opacity: 0.7 }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 800 }}>{value}</div>
    </div>
  )
}
function SCard({ label, value, color, bg }: { label: string; value: string; color: string; bg: string }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #e8ebf3", borderRadius: 14, padding: "14px 16px" }}>
      <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700, marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 900, color, background: bg, borderRadius: 8, padding: "4px 10px", display: "inline-block" }}>{value} so&apos;m</div>
    </div>
  )
}

const inp: React.CSSProperties = {
  width: "100%", boxSizing: "border-box", borderRadius: 11,
  border: "1px solid #e5e7ef", padding: "10px 12px", background: "#fff", outline: "none", fontSize: 14,
}
const lbl: React.CSSProperties = { fontSize: 13, fontWeight: 700, color: "#334155" }
const primaryBtn: React.CSSProperties = {
  padding: "10px 16px", background: "#2563eb", color: "#fff",
  border: "none", borderRadius: 12, fontWeight: 800, fontSize: 14, cursor: "pointer",
}
const secondaryBtn: React.CSSProperties = {
  padding: "10px 16px", background: "#f1f5f9", color: "#334155",
  border: "1px solid #e5e7ef", borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: "pointer",
}
