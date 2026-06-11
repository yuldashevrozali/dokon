"use client"

import { useEffect, useState, useMemo } from "react"

type Unit = "dona" | "kg" | "litr" | "quti"
type Product = { _id: string; name: string; category: string; unit: Unit; costPrice: number; stock: number }
type Entry = {
  _id: string
  productId: string
  productName: string
  quantity: number
  unit: string
  costPrice: number
  supplierName?: string
  note?: string
  createdAt: string
}

function fmt(n: number) {
  return new Intl.NumberFormat("en-US").format(Math.round(n))
}
function fmtDate(s: string) {
  const d = new Date(s)
  return d.toLocaleDateString("uz-UZ") + " " + d.toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" })
}

export default function KirimPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [query, setQuery] = useState("")

  const [form, setForm] = useState({
    productId: "",
    quantity: "",
    costPrice: "",
    supplierName: "",
    note: "",
  })
  const [err, setErr] = useState("")

  useEffect(() => {
    Promise.all([
      fetch("/api/products").then(r => r.json()),
      fetch("/api/stock-entries").then(r => r.json()),
    ]).then(([prods, ents]) => {
      if (Array.isArray(prods)) setProducts(prods)
      if (Array.isArray(ents)) setEntries(ents)
    }).finally(() => setLoading(false))
  }, [])

  const selectedProduct = useMemo(
    () => products.find(p => p._id === form.productId) ?? null,
    [products, form.productId]
  )

  function setF(k: string, v: string) {
    setErr("")
    setForm(f => ({ ...f, [k]: v }))
  }

  // Mahsulot tanlanganda kelish narxini avtomatik to'ldirish
  function selectProduct(id: string) {
    const p = products.find(x => x._id === id)
    setForm(f => ({ ...f, productId: id, costPrice: p ? String(p.costPrice) : "" }))
    setErr("")
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.productId) { setErr("Mahsulot tanlang"); return }
    const qty = Number(form.quantity)
    if (!qty || qty <= 0) { setErr("To'g'ri miqdor kiriting"); return }
    const cost = Number(form.costPrice)
    if (!cost || cost <= 0) { setErr("Kelish narxini kiriting"); return }

    setSaving(true)
    try {
      const res = await fetch("/api/stock-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: form.productId,
          productName: selectedProduct!.name,
          quantity: qty,
          unit: selectedProduct!.unit,
          costPrice: cost,
          supplierName: form.supplierName.trim() || undefined,
          note: form.note.trim() || undefined,
        }),
      })
      if (!res.ok) throw new Error("Saqlashda xatolik")
      const saved: Entry = await res.json()
      setEntries(prev => [saved, ...prev])
      // Mahalliy stock yangilashtir
      setProducts(prev => prev.map(p => p._id === form.productId ? { ...p, stock: p.stock + qty, costPrice: cost } : p))
      setForm({ productId: "", quantity: "", costPrice: "", supplierName: "", note: "" })
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Xatolik")
    } finally {
      setSaving(false)
    }
  }

  async function deleteEntry(id: string) {
    if (!confirm("Bu kirimni o'chirsangiz mahsulot qoldig'i ham kamayadi. Davom etasizmi?")) return
    setDeleting(id)
    try {
      await fetch(`/api/stock-entries/${id}`, { method: "DELETE" })
      const entry = entries.find(e => e._id === id)
      setEntries(prev => prev.filter(e => e._id !== id))
      if (entry) {
        setProducts(prev => prev.map(p => p._id === entry.productId ? { ...p, stock: Math.max(0, p.stock - entry.quantity) } : p))
      }
    } finally {
      setDeleting(null)
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return entries
    return entries.filter(e =>
      e.productName.toLowerCase().includes(q) ||
      (e.supplierName || "").toLowerCase().includes(q) ||
      (e.note || "").toLowerCase().includes(q)
    )
  }, [entries, query])

  const totalToday = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0)
    return entries.filter(e => new Date(e.createdAt) >= today).reduce((s, e) => s + e.costPrice * e.quantity, 0)
  }, [entries])

  return (
    <div style={{ background: "#f7f8fb", minHeight: "100vh", padding: 22 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22, flexWrap: "wrap" }}>
        <button
          className="hamburger"
          onClick={() => window.dispatchEvent(new CustomEvent("toggleSidebar"))}
          style={{ background: "#2563eb", color: "#fff", border: "none", borderRadius: 8, padding: "8px 12px", cursor: "pointer", fontSize: 16 }}
        >☰</button>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: "#0f172a" }}>Ombor kirim</h1>
          <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 13 }}>
            Yetkazib beruvchidan kelgan mahsulotlarni qayd eting
          </p>
        </div>
      </div>

      <div className="kirimGrid">
        {/* LEFT: tarix */}
        <div>
          {/* Stats */}
          <div className="kirimStats">
            {[
              { label: "Jami kirimlar", value: `${entries.length} ta` },
              { label: "Bugungi xarajat", value: `${fmt(totalToday)} so'm` },
              { label: "Mahsulot turlari", value: `${products.length} ta` },
            ].map(c => (
              <div key={c.label} style={{ background: "#fff", border: "1px solid #e8ebf3", borderRadius: 14, padding: "14px 16px" }}>
                <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>{c.label}</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: "#0f172a", marginTop: 6 }}>{c.value}</div>
              </div>
            ))}
          </div>

          {/* Search */}
          <input
            style={{ width: "100%", boxSizing: "border-box", borderRadius: 12, border: "1px solid #e5e7ef", padding: "10px 12px", background: "#fff", outline: "none", fontSize: 14, marginBottom: 12 }}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Mahsulot nomi yoki yetkazib beruvchi..."
          />

          {/* Table */}
          <div style={{ background: "#fff", border: "1px solid #e8ebf3", borderRadius: 16, overflow: "hidden", boxShadow: "0 4px 20px rgba(15,23,42,.04)" }}>
            {loading ? (
              <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>Yuklanmoqda...</div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>📦</div>
                {entries.length === 0 ? "Hali kirim qilinmagan" : "Topilmadi"}
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, fontSize: 13, minWidth: 560 }}>
                  <thead>
                    <tr style={{ background: "#fbfcff" }}>
                      {["Sana", "Mahsulot", "Miqdor", "Kelish narxi", "Jami", "Yetkazib beruvchi", ""].map(h => (
                        <th key={h} style={{ textAlign: "left", padding: "11px 12px", borderBottom: "1px solid #eef2f7", color: "#667085", fontWeight: 800, fontSize: 12, whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(e => (
                      <tr key={e._id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={td}><span style={{ fontFamily: "monospace", fontSize: 12 }}>{fmtDate(e.createdAt)}</span></td>
                        <td style={td}>
                          <div style={{ fontWeight: 800 }}>{e.productName}</div>
                          {e.note && <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2, fontStyle: "italic" }}>{e.note}</div>}
                        </td>
                        <td style={td}><span style={{ fontWeight: 900 }}>{e.quantity}</span> {e.unit}</td>
                        <td style={td}>{fmt(e.costPrice)} so&apos;m</td>
                        <td style={{ ...td, fontWeight: 900, color: "#0f172a" }}>{fmt(e.costPrice * e.quantity)} so&apos;m</td>
                        <td style={td}>{e.supplierName || <span style={{ color: "#94a3b8" }}>—</span>}</td>
                        <td style={td}>
                          <button
                            onClick={() => deleteEntry(e._id)}
                            disabled={deleting === e._id}
                            style={{ background: "#fff5f5", color: "#b91c1c", border: "1px solid #fecaca", borderRadius: 8, padding: "5px 10px", cursor: "pointer", fontSize: 12, fontWeight: 700 }}
                          >
                            O&apos;chirish
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: form */}
        <div className="kirimFormWrap">
          <div style={{ fontWeight: 900, fontSize: 16, color: "#0f172a", marginBottom: 4 }}>Yangi kirim qo&apos;shish</div>
          <div style={{ fontSize: 13, color: "#64748b", marginBottom: 18 }}>Mahsulot tanlang va miqdorni kiriting</div>

          <form onSubmit={submit} style={{ display: "grid", gap: 14 }}>
            {err && <div style={{ background: "#fee2e2", color: "#b91c1c", borderRadius: 10, padding: "10px 12px", fontSize: 13 }}>{err}</div>}

            <FField label="Mahsulot *">
              <select
                style={inp}
                value={form.productId}
                onChange={e => selectProduct(e.target.value)}
              >
                <option value="">— Mahsulot tanlang —</option>
                {products.map(p => (
                  <option key={p._id} value={p._id}>
                    {p.name} ({p.stock} {p.unit} qoldiq)
                  </option>
                ))}
              </select>
            </FField>

            {selectedProduct && (
              <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "10px 12px", fontSize: 13 }}>
                Hozirgi qoldiq: <strong>{selectedProduct.stock} {selectedProduct.unit}</strong>
                {form.quantity && Number(form.quantity) > 0 && (
                  <span style={{ color: "#16a34a" }}> → {selectedProduct.stock + Number(form.quantity)} {selectedProduct.unit}</span>
                )}
              </div>
            )}

            <FField label="Miqdor *">
              <input style={inp} type="number" min="1" value={form.quantity} onChange={e => setF("quantity", e.target.value)} placeholder="50" />
            </FField>

            <FField label="Kelish narxi (so'm) *">
              <input style={inp} type="number" min="1" value={form.costPrice} onChange={e => setF("costPrice", e.target.value)} placeholder="5000" />
              {form.costPrice && form.quantity && (
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                  Jami xarajat: <strong>{fmt(Number(form.costPrice) * Number(form.quantity))} so&apos;m</strong>
                </div>
              )}
            </FField>

            <FField label="Yetkazib beruvchi">
              <input style={inp} value={form.supplierName} onChange={e => setF("supplierName", e.target.value)} placeholder="Ali savdo, Hamid ombori..." />
            </FField>

            <FField label="Izoh">
              <input style={inp} value={form.note} onChange={e => setF("note", e.target.value)} placeholder="Ixtiyoriy eslatma" />
            </FField>

            <button
              type="submit"
              disabled={saving}
              style={{ padding: "12px", background: saving ? "#93c5fd" : "#2563eb", color: "#fff", border: "none", borderRadius: 12, fontWeight: 900, fontSize: 15, cursor: saving ? "not-allowed" : "pointer", boxShadow: "0 6px 16px rgba(37,99,235,.2)" }}
            >
              {saving ? "Saqlanmoqda..." : "📦 Kirim qo'shish"}
            </button>
          </form>
        </div>
      </div>

      <style>{`
        .kirimGrid {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 20px;
          align-items: start;
        }
        .kirimStats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-bottom: 16px;
        }
        .kirimFormWrap {
          background: #fff;
          border: 1px solid #e8ebf3;
          border-radius: 18px;
          padding: 20px;
          box-shadow: 0 4px 20px rgba(15,23,42,.05);
          position: sticky;
          top: 20px;
        }
        @media (max-width: 768px) {
          .hamburger { display: block !important; }
          .kirimGrid { grid-template-columns: 1fr; }
          .kirimStats { grid-template-columns: repeat(3, 1fr); gap: 8px; }
          .kirimFormWrap { position: static; }
        }
        @media (max-width: 480px) {
          .kirimStats { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  )
}

function FField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "grid", gap: 6 }}>
      <label style={{ fontSize: 13, fontWeight: 700, color: "#334155" }}>{label}</label>
      {children}
    </div>
  )
}

const inp: React.CSSProperties = {
  width: "100%", boxSizing: "border-box", borderRadius: 11, border: "1px solid #e5e7ef",
  padding: "10px 12px", background: "#fff", outline: "none", fontSize: 14,
}

const td: React.CSSProperties = {
  padding: "11px 12px", color: "#0f172a", verticalAlign: "middle",
}
