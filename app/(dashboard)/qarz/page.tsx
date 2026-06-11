"use client"

import { useEffect, useState, useMemo } from "react"
import type React from "react"

type Debt = {
  _id: string
  customerName: string
  phone?: string
  amount: number
  paidAmount: number
  note?: string
  dueDate?: string
  saleId?: string
  createdAt: string
}

type ModalType = "add" | "pay" | "detail" | null

function formatUZS(n: number) {
  if (!Number.isFinite(n)) return "0"
  return new Intl.NumberFormat("en-US").format(Math.round(n))
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("uz-UZ")
}

function remaining(d: Debt) {
  return d.amount - d.paidAmount
}

function isOverdue(d: Debt) {
  if (!d.dueDate) return false
  return new Date(d.dueDate) < new Date() && remaining(d) > 0
}

// ---------- Modal ----------
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: 460, boxShadow: "0 24px 60px rgba(0,0,0,.18)", overflow: "hidden" }}>
        <div style={{ padding: "18px 20px", borderBottom: "1px solid #eef2f7", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontWeight: 900, fontSize: 16, color: "#0f172a" }}>{title}</div>
          <button onClick={onClose} style={{ background: "#f1f5f9", border: "none", borderRadius: 10, width: 32, height: 32, cursor: "pointer", fontSize: 18, color: "#64748b", display: "grid", placeItems: "center" }}>×</button>
        </div>
        <div style={{ padding: "20px" }}>{children}</div>
      </div>
    </div>
  )
}

// ---------- AddDebt form ----------
function AddDebtForm({ onSave, onClose }: { onSave: (debt: Debt) => void; onClose: () => void }) {
  const [form, setForm] = useState({ customerName: "", phone: "", amount: "", note: "", dueDate: "" })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState("")

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.customerName.trim()) { setErr("Ism majburiy"); return }
    const amount = Number(form.amount)
    if (!amount || amount <= 0) { setErr("To'g'ri summa kiriting"); return }
    setSaving(true)
    try {
      const res = await fetch("/api/debts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerName: form.customerName.trim(), phone: form.phone.trim() || undefined, amount, note: form.note.trim() || undefined, dueDate: form.dueDate || undefined }),
      })
      if (!res.ok) throw new Error("Saqlashda xatolik")
      const saved = await res.json()
      onSave(saved)
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Xatolik")
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} style={{ display: "grid", gap: 14 }}>
      {err && <div style={{ background: "#fee2e2", color: "#b91c1c", borderRadius: 10, padding: "10px 12px", fontSize: 13 }}>{err}</div>}
      <Field label="Mijoz ismi *">
        <input style={inputStyle} value={form.customerName} onChange={e => set("customerName", e.target.value)} placeholder="Masalan: Otabek" />
      </Field>
      <Field label="Telefon raqam">
        <input style={inputStyle} value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="+998 90 123 45 67" />
      </Field>
      <Field label="Qarz summasi (so'm) *">
        <input style={inputStyle} type="number" min="1" value={form.amount} onChange={e => set("amount", e.target.value)} placeholder="0" />
      </Field>
      <Field label="Izoh (nima uchun)">
        <input style={inputStyle} value={form.note} onChange={e => set("note", e.target.value)} placeholder="Masalan: Oziq-ovqat uchun" />
      </Field>
      <Field label="Qaytarish sanasi">
        <input style={inputStyle} type="date" value={form.dueDate} onChange={e => set("dueDate", e.target.value)} />
      </Field>
      <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
        <button type="button" onClick={onClose} style={secondaryBtnStyle}>Bekor qilish</button>
        <button type="submit" disabled={saving} style={{ ...primaryBtnStyle, flex: 1 }}>
          {saving ? "Saqlanmoqda..." : "Qarz yozish"}
        </button>
      </div>
    </form>
  )
}

// ---------- PayDebt form ----------
function PayDebtForm({ debt, onSave, onClose }: { debt: Debt; onSave: (updated: Debt) => void; onClose: () => void }) {
  const left = remaining(debt)
  const [amount, setAmount] = useState("")
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState("")

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const pay = Number(amount)
    if (!pay || pay <= 0) { setErr("To'g'ri summa kiriting"); return }
    if (pay > left) { setErr(`Qoldiq ${formatUZS(left)} so'm dan ko'p bo'lishi mumkin emas`); return }
    setSaving(true)
    try {
      const res = await fetch(`/api/debts/${debt._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paidAmount: debt.paidAmount + pay }),
      })
      if (!res.ok) throw new Error("Xatolik")
      const updated = await res.json()
      onSave(updated)
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Xatolik")
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} style={{ display: "grid", gap: 14 }}>
      {err && <div style={{ background: "#fee2e2", color: "#b91c1c", borderRadius: 10, padding: "10px 12px", fontSize: 13 }}>{err}</div>}
      <div style={{ background: "#f8fafc", borderRadius: 14, padding: "14px 16px", display: "grid", gap: 6 }}>
        <Row label="Mijoz" value={debt.customerName} />
        <Row label="Jami qarz" value={`${formatUZS(debt.amount)} so'm`} />
        <Row label="To'langan" value={`${formatUZS(debt.paidAmount)} so'm`} />
        <Row label="Qoldiq" value={`${formatUZS(left)} so'm`} bold color="#b91c1c" />
      </div>
      <Field label="To'lov summasi (so'm) *">
        <div style={{ display: "flex", gap: 8 }}>
          <input style={{ ...inputStyle, flex: 1 }} type="number" min="1" max={left} value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" />
          <button type="button" onClick={() => setAmount(String(left))} style={{ ...secondaryBtnStyle, whiteSpace: "nowrap" }}>
            Hammasi
          </button>
        </div>
      </Field>
      <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
        <button type="button" onClick={onClose} style={secondaryBtnStyle}>Bekor qilish</button>
        <button type="submit" disabled={saving} style={{ ...primaryBtnStyle, flex: 1 }}>
          {saving ? "Saqlanmoqda..." : "To'lovni qayd etish"}
        </button>
      </div>
    </form>
  )
}

// ---------- Main page ----------
export default function QarzPage() {
  const [debts, setDebts] = useState<Debt[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [modal, setModal] = useState<ModalType>(null)
  const [selected, setSelected] = useState<Debt | null>(null)
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState<"all" | "active" | "paid" | "overdue">("all")
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/debts")
      .then(r => r.json())
      .then(d => { if (!d.error) { setDebts(d) } else { setError(d.error) } })
      .catch(() => setError("Ma'lumot yuklanmadi"))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return debts.filter(d => {
      if (q && !d.customerName.toLowerCase().includes(q) && !(d.phone || "").includes(q)) return false
      if (filter === "active") return remaining(d) > 0
      if (filter === "paid") return remaining(d) <= 0
      if (filter === "overdue") return isOverdue(d)
      return true
    })
  }, [debts, query, filter])

  const totalDebt = debts.filter(d => remaining(d) > 0).reduce((s, d) => s + remaining(d), 0)
  const totalPaid = debts.reduce((s, d) => s + d.paidAmount, 0)
  const activeCount = debts.filter(d => remaining(d) > 0).length
  const overdueCount = debts.filter(isOverdue).length

  async function deleteDebt(id: string) {
    if (!confirm("Qarzni o'chirishni tasdiqlaysizmi?")) return
    setDeleting(id)
    try {
      await fetch(`/api/debts/${id}`, { method: "DELETE" })
      setDebts(prev => prev.filter(d => d._id !== id))
    } finally {
      setDeleting(null)
    }
  }

  function openPay(d: Debt) { setSelected(d); setModal("pay") }
  function openDetail(d: Debt) { setSelected(d); setModal("detail") }
  function closeModal() { setModal(null); setSelected(null) }

  return (
    <div style={{ padding: 22, background: "#f7f8fb", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <button
          style={{ background: "#2563eb", color: "#fff", border: "none", borderRadius: 8, padding: "8px 12px", cursor: "pointer", fontSize: 16 }}
          className="hamburger"
          onClick={() => window.dispatchEvent(new CustomEvent("toggleSidebar"))}
        >☰</button>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: "#0f172a" }}>Mijozlar / Qarz daftar</h1>
          <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 13 }}>Qarzlarni yozing, to&apos;lovlarni kuzating</p>
        </div>
        <button onClick={() => setModal("add")} style={primaryBtnStyle}>
          + Yangi qarz
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12, marginBottom: 20 }}>
        <SCard label="Faol qarzlar" value={`${formatUZS(totalDebt)} so'm`} sub={`${activeCount} ta mijoz`} color="#b91c1c" bg="#fee2e2" />
        <SCard label="Jami to&apos;langan" value={`${formatUZS(totalPaid)} so'm`} sub="Barcha vaqt" color="#065f46" bg="#d1fae5" />
        <SCard label="Muddati o&apos;tgan" value={`${overdueCount} ta`} sub="Vaqtida to&apos;lanmagan" color="#92400e" bg="#fef3c7" />
        <SCard label="Jami yozuvlar" value={`${debts.length} ta`} sub="Aktiv + to&apos;langan" color="#1e40af" bg="#dbeafe" />
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16, alignItems: "center" }}>
        <input
          style={{ ...inputStyle, minWidth: 220, maxWidth: 320 }}
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Ism yoki telefon raqam..."
        />
        {(["all", "active", "paid", "overdue"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: "8px 16px", borderRadius: 12, border: "1px solid",
              fontWeight: 700, fontSize: 13, cursor: "pointer",
              background: filter === f ? "#2563eb" : "#fff",
              color: filter === f ? "#fff" : "#334155",
              borderColor: filter === f ? "#2563eb" : "#e5e7ef",
            }}
          >
            {{ all: "Hammasi", active: "Faol", paid: "To'langan", overdue: "Muddati o'tgan" }[f]}
          </button>
        ))}
        <span style={{ color: "#64748b", fontSize: 12, marginLeft: "auto" }}>{filtered.length} ta yozuv</span>
      </div>

      {/* List */}
      {loading && <div style={{ textAlign: "center", padding: 60, color: "#94a3b8" }}>Yuklanmoqda...</div>}
      {error && <div style={{ background: "#fee2e2", color: "#b91c1c", borderRadius: 14, padding: 20 }}>{error}</div>}

      {!loading && !error && filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: 60, color: "#94a3b8" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📒</div>
          {debts.length === 0 ? "Hali qarz yozilmagan" : "Qidiruv bo'yicha topilmadi"}
        </div>
      )}

      <div style={{ display: "grid", gap: 10 }}>
        {filtered.map(d => {
          const left = remaining(d)
          const isPaid = left <= 0
          const overdue = isOverdue(d)
          const pct = Math.min(100, Math.round((d.paidAmount / d.amount) * 100))

          return (
            <div
              key={d._id}
              style={{
                background: "#fff",
                border: `1px solid ${overdue ? "#fca5a5" : isPaid ? "#bbf7d0" : "#e8ebf3"}`,
                borderRadius: 16,
                padding: "14px 16px",
                boxShadow: "0 2px 12px rgba(15,23,42,.04)",
              }}
            >
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
                {/* Avatar */}
                <div style={{ width: 44, height: 44, borderRadius: 14, background: isPaid ? "#d1fae5" : overdue ? "#fee2e2" : "#eff6ff", display: "grid", placeItems: "center", fontWeight: 900, fontSize: 18, color: isPaid ? "#065f46" : overdue ? "#b91c1c" : "#2563eb", flexShrink: 0 }}>
                  {d.customerName[0].toUpperCase()}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 900, fontSize: 15, color: "#0f172a" }}>{d.customerName}</span>
                    {d.saleId && <Badge text="Savdodan" bg="#eff6ff" color="#1d4ed8" />}
                    {isPaid && <Badge text="To'langan" bg="#d1fae5" color="#065f46" />}
                    {overdue && <Badge text="Muddati o'tgan" bg="#fee2e2" color="#b91c1c" />}
                    {!isPaid && !overdue && d.dueDate && <Badge text={`Muddat: ${formatDate(d.dueDate)}`} bg="#fef3c7" color="#92400e" />}
                  </div>
                  {d.phone && <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{d.phone}</div>}
                  {d.note && <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2, fontStyle: "italic" }}>{d.note}</div>}

                  {/* Progress bar */}
                  <div style={{ marginTop: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                      <span style={{ color: "#64748b" }}>To&apos;langan: <strong style={{ color: "#16a34a" }}>{formatUZS(d.paidAmount)} so&apos;m</strong></span>
                      <span style={{ color: isPaid ? "#16a34a" : "#b91c1c", fontWeight: 700 }}>
                        {isPaid ? "✅ Tugadi" : `Qoldiq: ${formatUZS(left)} so'm`}
                      </span>
                    </div>
                    <div style={{ height: 6, background: "#f1f5f9", borderRadius: 999, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: isPaid ? "#16a34a" : overdue ? "#ef4444" : "#2563eb", borderRadius: 999, transition: "width 0.3s" }} />
                    </div>
                    <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 3 }}>
                      {pct}% • Jami: {formatUZS(d.amount)} so&apos;m • {formatDate(d.createdAt)} da yozilgan
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
                  <button onClick={() => openDetail(d)} style={ghostSmallBtn} title="Batafsil">
                    <IconEye />
                  </button>
                  {!isPaid && (
                    <button onClick={() => openPay(d)} style={{ ...ghostSmallBtn, background: "#eff6ff", color: "#2563eb", borderColor: "#dbeafe" }}>
                      To&apos;lov
                    </button>
                  )}
                  <button onClick={() => deleteDebt(d._id)} disabled={deleting === d._id} style={{ ...ghostSmallBtn, background: "#fff5f5", color: "#b91c1c", borderColor: "#fecaca" }} title="O'chirish">
                    <IconTrash />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Modals */}
      {modal === "add" && (
        <Modal title="Yangi qarz yozish" onClose={closeModal}>
          <AddDebtForm onSave={d => { setDebts(p => [d, ...p]); closeModal() }} onClose={closeModal} />
        </Modal>
      )}
      {modal === "pay" && selected && (
        <Modal title="To'lov qayd etish" onClose={closeModal}>
          <PayDebtForm debt={selected} onSave={updated => { setDebts(p => p.map(d => d._id === updated._id ? updated : d)); closeModal() }} onClose={closeModal} />
        </Modal>
      )}
      {modal === "detail" && selected && (
        <Modal title="Qarz tafsiloti" onClose={closeModal}>
          <div style={{ display: "grid", gap: 10 }}>
            <div style={{ background: "#f8fafc", borderRadius: 14, padding: "14px 16px", display: "grid", gap: 8 }}>
              <Row label="Mijoz" value={selected.customerName} />
              {selected.phone && <Row label="Telefon" value={selected.phone} />}
              {selected.note && <Row label="Izoh" value={selected.note} />}
              <Row label="Qarz sanasi" value={formatDate(selected.createdAt)} />
              {selected.dueDate && <Row label="Qaytarish sanasi" value={formatDate(selected.dueDate)} />}
              <hr style={{ border: "none", borderTop: "1px solid #e8ebf3", margin: "4px 0" }} />
              <Row label="Jami qarz" value={`${formatUZS(selected.amount)} so'm`} />
              <Row label="To'langan" value={`${formatUZS(selected.paidAmount)} so'm`} bold color="#16a34a" />
              <Row label="Qoldiq" value={`${formatUZS(remaining(selected))} so'm`} bold color={remaining(selected) > 0 ? "#b91c1c" : "#16a34a"} />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={closeModal} style={{ ...secondaryBtnStyle, flex: 1 }}>Yopish</button>
              {remaining(selected) > 0 && (
                <button onClick={() => setModal("pay")} style={{ ...primaryBtnStyle, flex: 1 }}>
                  To&apos;lov qilish
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}

      <style>{`@media (max-width: 768px) { .hamburger { display: block !important; } }`}</style>
    </div>
  )
}

// --- small helpers ---

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "grid", gap: 6 }}>
      <label style={{ fontSize: 13, fontWeight: 700, color: "#334155" }}>{label}</label>
      {children}
    </div>
  )
}

function Row({ label, value, bold, color }: { label: string; value: string; bold?: boolean; color?: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 13 }}>
      <span style={{ color: "#64748b" }}>{label}</span>
      <span style={{ fontWeight: bold ? 900 : 600, color: color || "#0f172a", textAlign: "right" }}>{value}</span>
    </div>
  )
}

function Badge({ text, bg, color }: { text: string; bg: string; color: string }) {
  return (
    <span style={{ background: bg, color, borderRadius: 999, padding: "2px 10px", fontSize: 11, fontWeight: 800, whiteSpace: "nowrap" }}>
      {text}
    </span>
  )
}

function SCard({ label, value, sub, color, bg }: { label: string; value: string; sub: string; color: string; bg: string }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #e8ebf3", borderRadius: 16, padding: 16, boxShadow: "0 4px 16px rgba(15,23,42,.04)" }}>
      <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700, marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 900, color, background: bg, borderRadius: 10, padding: "6px 12px", display: "inline-block" }}>{value}</div>
      <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 6 }}>{sub}</div>
    </div>
  )
}

function IconEye() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  )
}

function IconTrash() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M3 6h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M8 6V4h8v2" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  )
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  borderRadius: 12,
  border: "1px solid #e5e7ef",
  padding: "10px 12px",
  background: "#fff",
  outline: "none",
  fontSize: 14,
  boxSizing: "border-box",
}

const primaryBtnStyle: React.CSSProperties = {
  padding: "10px 16px",
  background: "#2563eb",
  color: "#fff",
  border: "none",
  borderRadius: 12,
  fontWeight: 800,
  fontSize: 14,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
}

const secondaryBtnStyle: React.CSSProperties = {
  padding: "10px 16px",
  background: "#f1f5f9",
  color: "#334155",
  border: "1px solid #e5e7ef",
  borderRadius: 12,
  fontWeight: 700,
  fontSize: 14,
  cursor: "pointer",
}

const ghostSmallBtn: React.CSSProperties = {
  padding: "7px 10px",
  background: "#f8fafc",
  color: "#334155",
  border: "1px solid #e5e7ef",
  borderRadius: 10,
  fontWeight: 700,
  fontSize: 13,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
}
