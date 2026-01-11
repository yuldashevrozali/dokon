"use client"

import React, { useEffect, useMemo, useState } from "react"

type Unit = "dona" | "kg" | "litr" | "quti"

type Product = {
  _id: string
  name: string
  category: string
  barcode?: string
  unit: Unit
  costPrice: number
  sellPrice: number
  stock: number
  lowStockLimit: number
  createdAt: string
  updatedAt: string
}

function formatUZS(n: number) {
  if (!Number.isFinite(n)) return "0"
  return new Intl.NumberFormat("uz-UZ").format(Math.round(n))
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")

  // Modal states
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: "",
    category: "Umumiy",
    barcode: "",
    unit: "dona" as Unit,
    costPrice: 0,
    sellPrice: 0,
    stock: 0,
    lowStockLimit: 5,
  })

  const loadProducts = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/products", { cache: "no-store" })
      if (res.ok) {
        const data = await res.json()
        setProducts(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error("Error loading products:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProducts()
  }, [])

  // ✅ modal ochilganda body scroll lock + ESC close
  useEffect(() => {
    if (!drawerOpen) return

    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawerOpen(false)
    }
    window.addEventListener("keydown", onKeyDown)

    return () => {
      document.body.style.overflow = prev
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [drawerOpen])

  const categories = useMemo(() => {
    const set = new Set<string>()
    for (const p of products) set.add((p.category || "Umumiy").trim())
    return ["all", ...Array.from(set).filter(Boolean).sort((a, b) => a.localeCompare(b))]
  }, [products])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return products
      .filter((p) => {
        if (categoryFilter !== "all" && p.category !== categoryFilter) return false
        if (!q) return true
        return (
          p.name.toLowerCase().includes(q) ||
          (p.barcode ? p.barcode.toLowerCase().includes(q) : false) ||
          p.category.toLowerCase().includes(q)
        )
      })
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  }, [products, query, categoryFilter])

  const totals = useMemo(() => {
    const items = products.length
    const stockTotal = products.reduce((sum, p) => sum + (p.stock || 0), 0)
    const low = products.filter((p) => p.stock <= p.lowStockLimit).length
    return { items, stockTotal, low }
  }, [products])

  function openCreate() {
    setEditingId(null)
    setForm({
      name: "",
      category: "Umumiy",
      barcode: "",
      unit: "dona",
      costPrice: 0,
      sellPrice: 0,
      stock: 0,
      lowStockLimit: 5,
    })
    setDrawerOpen(true)
  }

  function openEdit(p: Product) {
    setEditingId(p._id)
    setForm({
      name: p.name,
      category: p.category || "Umumiy",
      barcode: p.barcode || "",
      unit: p.unit,
      costPrice: p.costPrice,
      sellPrice: p.sellPrice,
      stock: p.stock,
      lowStockLimit: p.lowStockLimit,
    })
    setDrawerOpen(true)
  }

  function closeDrawer() {
    setDrawerOpen(false)
  }

  function validateForm() {
    const name = form.name.trim()
    if (name.length < 2) return "Mahsulot nomi kamida 2 ta harf bo‘lsin."
    if (form.sellPrice < 0 || form.costPrice < 0) return "Narx manfiy bo‘lmasin."
    if (form.stock < 0) return "Qoldiq manfiy bo‘lmasin."
    if (form.lowStockLimit < 0) return "Limit manfiy bo‘lmasin."
    return null
  }

  async function upsertProduct() {
    const err = validateForm()
    if (err) return alert(err)

    const productData = {
      name: form.name.trim(),
      category: (form.category || "Umumiy").trim(),
      barcode: form.barcode.trim() || undefined,
      unit: form.unit,
      costPrice: Number(form.costPrice) || 0,
      sellPrice: Number(form.sellPrice) || 0,
      stock: Number(form.stock) || 0,
      lowStockLimit: Number(form.lowStockLimit) || 0,
    }

    try {
      setLoading(true)

      const res = !editingId
        ? await fetch("/api/products", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(productData),
          })
        : await fetch(`/api/products/${editingId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(productData),
          })

      if (res.ok) {
        await loadProducts()
        setDrawerOpen(false)
      } else {
        alert(!editingId ? "Mahsulot qo‘shishda xatolik" : "Mahsulot yangilashda xatolik")
      }
    } catch (error) {
      console.error("Error upserting product:", error)
      alert("Xatolik yuz berdi")
    } finally {
      setLoading(false)
    }
  }

  async function deleteProduct(id: string) {
    const p = products.find((x) => x._id === id)
    const ok = confirm(`O‘chirishni tasdiqlaysizmi?\n\n${p?.name ?? "Mahsulot"}`)
    if (!ok) return

    try {
      setLoading(true)
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" })
      if (res.ok) {
        await loadProducts()
      } else {
        alert("Mahsulot o‘chirishda xatolik")
      }
    } catch (error) {
      console.error("Error deleting product:", error)
      alert("Xatolik yuz berdi")
    } finally {
      setLoading(false)
    }
  }

  async function adjustStock(id: string, delta: number) {
    const p = products.find((x) => x._id === id)
    if (!p) return
    const newStock = Math.max(0, (p.stock || 0) + delta)

    try {
      setLoading(true)
      const res = await fetch(`/api/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stock: newStock }),
      })
      if (res.ok) {
        await loadProducts()
      } else {
        alert("Qoldiq yangilashda xatolik")
      }
    } catch (error) {
      console.error("Error adjusting stock:", error)
      alert("Xatolik yuz berdi")
    } finally {
      setLoading(false)
    }
  }

  const profitPreview = Math.max(0, Number(form.sellPrice) - Number(form.costPrice))

  // ---------------- styles ----------------
  const S: Record<string, React.CSSProperties> = {
    page: { padding: 16, background: "#f7f8fb", minHeight: "100vh" },

    header: {
      display: "flex",
      gap: 12,
      alignItems: "flex-start",
      justifyContent: "space-between",
      flexWrap: "wrap",
    },
    headerLeft: { display: "flex", gap: 10, alignItems: "flex-start" },

    title: { margin: 0, fontSize: 20, fontWeight: 900, color: "#0f172a" },
    sub: { margin: "6px 0 0", color: "#64748b", fontSize: 13, maxWidth: 720 },

    actions: { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" },

    btnPrimary: {
      border: 0,
      borderRadius: 14,
      padding: "10px 14px",
      background: "#2563eb",
      color: "#fff",
      fontWeight: 900,
      cursor: "pointer",
      boxShadow: "0 10px 18px rgba(37,99,235,.18)",
      opacity: loading ? 0.7 : 1,
    },
    btn: {
      borderRadius: 14,
      padding: "10px 14px",
      background: "#fff",
      border: "1px solid #e5e7ef",
      color: "#0f172a",
      fontWeight: 900,
      cursor: "pointer",
      opacity: loading ? 0.7 : 1,
    },

    // ✅ hamburger: default hidden, CSS bilan mobilda ko'rsatamiz
    hamburger: {
      border: "none",
      borderRadius: 12,
      padding: "10px 12px",
      cursor: "pointer",
      fontSize: 18,
      fontWeight: 900,
      background: "#2563eb",
      color: "#fff",
      lineHeight: 1,
      boxShadow: "0 10px 18px rgba(37,99,235,.18)",
      display: "none",
    },

    grid: {
      marginTop: 14,
      display: "grid",
      gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
      gap: 12,
    },
    card: {
      background: "#fff",
      border: "1px solid #e8ebf3",
      borderRadius: 16,
      padding: 14,
      boxShadow: "0 10px 25px rgba(15,23,42,.04)",
    },
    cardLabel: { color: "#667085", fontSize: 12, fontWeight: 800 },
    cardValue: { marginTop: 8, fontSize: 20, fontWeight: 900, color: "#0f172a" },

    tools: {
      marginTop: 14,
      display: "flex",
      gap: 10,
      flexWrap: "wrap",
      alignItems: "center",
      justifyContent: "space-between",
    },
    input: {
      borderRadius: 14,
      border: "1px solid #e5e7ef",
      padding: "10px 12px",
      background: "#fff",
      outline: "none",
      minWidth: 220,
      width: "min(420px, 100%)",
    },
    select: {
      borderRadius: 14,
      border: "1px solid #e5e7ef",
      padding: "10px 12px",
      background: "#fff",
      outline: "none",
      minWidth: 180,
      cursor: "pointer",
    },

    tableWrap: {
      marginTop: 12,
      background: "#fff",
      border: "1px solid #e8ebf3",
      borderRadius: 16,
      overflow: "hidden",
      boxShadow: "0 10px 25px rgba(15,23,42,.04)",
    },
    tableScroll: { width: "100%", overflowX: "auto" },
    table: { width: "100%", borderCollapse: "separate", borderSpacing: 0, fontSize: 13, minWidth: 980 },
    th: {
      textAlign: "left",
      color: "#667085",
      fontWeight: 900,
      padding: "12px 10px",
      borderBottom: "1px solid #eef2f7",
      background: "#fbfcff",
      whiteSpace: "nowrap",
    },
    td: {
      padding: "12px 10px",
      borderBottom: "1px solid #f1f5f9",
      color: "#0f172a",
      verticalAlign: "middle",
      whiteSpace: "nowrap",
    },
    mono: {
      fontFamily:
        'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    },
    pill: {
      display: "inline-flex",
      alignItems: "center",
      height: 26,
      padding: "0 10px",
      borderRadius: 999,
      fontSize: 12,
      fontWeight: 900,
      border: "1px solid transparent",
      whiteSpace: "nowrap",
    },
    pillOk: { background: "#eaf7ef", color: "#0f7a3b", borderColor: "#cbead6" },
    pillWarn: { background: "#fff7ed", color: "#c2410c", borderColor: "#fed7aa" },
    pillDanger: { background: "#fee2e2", color: "#b91c1c", borderColor: "#fecaca" },

    rowActions: { display: "flex", gap: 8, flexWrap: "wrap" },
    miniBtn: {
      borderRadius: 12,
      padding: "8px 10px",
      background: "#f1f5f9",
      border: "1px solid #e5e7ef",
      fontWeight: 900,
      cursor: "pointer",
    },
    miniBtnDanger: {
      borderRadius: 12,
      padding: "8px 10px",
      background: "#fff",
      border: "1px solid #fecaca",
      color: "#b91c1c",
      fontWeight: 900,
      cursor: "pointer",
    },

    // ✅ MODAL FIX (mobile friendly)
    drawerBg: {
      position: "fixed",
      inset: 0,
      background: "rgba(15, 23, 42, .45)",
      padding: 12,
      zIndex: 50,
      overflowY: "auto",
      WebkitOverflowScrolling: "touch",
    },
    drawer: {
      width: "min(860px, 100%)",
      margin: "12px auto",
      background: "#fff",
      borderRadius: 18,
      border: "1px solid #e8ebf3",
      overflow: "hidden",
      boxShadow: "0 30px 80px rgba(0,0,0,.2)",
      maxHeight: "calc(100vh - 24px)",
      display: "flex",
      flexDirection: "column",
    },
    drawerHeader: {
      padding: 14,
      borderBottom: "1px solid #eef2f7",
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: 10,
    },
    drawerTitle: { margin: 0, fontSize: 16, fontWeight: 950, color: "#0f172a" },
    drawerSub: { margin: "6px 0 0", fontSize: 12, color: "#64748b" },
    drawerBody: {
      padding: 14,
      display: "grid",
      gap: 12,
      overflowY: "auto",
      WebkitOverflowScrolling: "touch",
    },
    formGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
      gap: 12,
    },
    field: { display: "grid", gap: 6 },
    label: { fontSize: 12, fontWeight: 900, color: "#334155" },
    help: { fontSize: 12, color: "#64748b" },
    drawerFooter: {
      padding: 14,
      borderTop: "1px solid #eef2f7",
      display: "flex",
      gap: 10,
      justifyContent: "flex-end",
      flexWrap: "wrap",
    },
    smallLink: {
      background: "transparent",
      border: 0,
      color: "#2563eb",
      fontWeight: 900,
      cursor: "pointer",
      padding: "10px 8px",
      borderRadius: 12,
    },
  }

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={S.header}>
        <div style={S.headerLeft}>
          {/* ✅ mobilda chiqadigan hamburger */}
          <button
            style={S.hamburger}
            className="hamburgerOnlyMobile"
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent("toggleSidebar"))}
            aria-label="Sidebar ochish"
          >
            ☰
          </button>

          <div>
            <h1 style={S.title}>📦 Mahsulotlar</h1>
            <p style={S.sub}>
              Qo‘shish, tahrirlash, o‘chirish, narx belgilash, qoldiq nazorati.
            </p>
          </div>
        </div>

        <div style={S.actions}>
          <button style={S.btnPrimary} onClick={openCreate} disabled={loading}>
            + Yangi mahsulot
          </button>
          <button style={S.btn} onClick={loadProducts} disabled={loading}>
            Yangilash
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={S.grid}>
        <div style={S.card}>
          <div style={S.cardLabel}>Mahsulotlar</div>
          <div style={S.cardValue}>{totals.items} ta</div>
        </div>
        <div style={S.card}>
          <div style={S.cardLabel}>Jami qoldiq</div>
          <div style={S.cardValue}>{totals.stockTotal} birlik</div>
        </div>
        <div style={S.card}>
          <div style={S.cardLabel}>Oz qolganlar</div>
          <div style={S.cardValue}>{totals.low} ta</div>
        </div>
      </div>

      {/* Tools */}
      <div style={S.tools}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <input
            style={S.input}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Qidirish: nomi, kategoriya yoki shtrix-kod..."
          />

          <select style={S.select} value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === "all" ? "Barcha kategoriya" : c}
              </option>
            ))}
          </select>
        </div>

        <div style={{ color: "#64748b", fontSize: 12 }}>
          Natija: <b>{filtered.length}</b> ta
        </div>
      </div>

      {/* Table */}
      <div style={S.tableWrap}>
        <div style={S.tableScroll}>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Mahsulot</th>
                <th style={S.th}>Kategoriya</th>
                <th style={S.th}>Shtrix-kod</th>
                <th style={S.th}>Qoldiq</th>
                <th style={S.th}>Kelish</th>
                <th style={S.th}>Sotuv</th>
                <th style={S.th}>Foyda / dona</th>
                <th style={S.th}>Holat</th>
                <th style={S.th}>Amallar</th>
              </tr>
            </thead>

            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td style={{ ...S.td, color: "#64748b" }} colSpan={9}>
                    Mahsulot topilmadi. “Yangi mahsulot” bosib qo‘shing.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => {
                  const profit = (p.sellPrice || 0) - (p.costPrice || 0)
                  const isLow = p.stock <= p.lowStockLimit
                  const isCritical = p.stock <= Math.max(1, Math.floor(p.lowStockLimit / 2))

                  return (
                    <tr key={p._id}>
                      <td style={S.td}>
                        <div style={{ fontWeight: 950 }}>{p.name}</div>
                        <div style={{ fontSize: 12, color: "#64748b" }}>
                          Birlik: <span style={S.mono}>{p.unit}</span>
                          <span style={{ margin: "0 8px" }}>•</span>
                          Limit: <span style={S.mono}>{p.lowStockLimit}</span>
                        </div>
                      </td>

                      <td style={S.td}>{p.category}</td>

                      <td style={{ ...S.td, ...S.mono }}>
                        {p.barcode ? p.barcode : <span style={{ color: "#94a3b8" }}>—</span>}
                      </td>

                      <td style={S.td}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ ...S.mono, fontWeight: 900 }}>
                            {p.stock} {p.unit}
                          </span>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button style={S.miniBtn} onClick={() => adjustStock(p._id, -1)} disabled={loading}>
                              -1
                            </button>
                            <button style={S.miniBtn} onClick={() => adjustStock(p._id, +1)} disabled={loading}>
                              +1
                            </button>
                          </div>
                        </div>
                      </td>

                      <td style={{ ...S.td, ...S.mono }}>{formatUZS(p.costPrice)} so‘m</td>
                      <td style={{ ...S.td, ...S.mono }}>{formatUZS(p.sellPrice)} so‘m</td>
                      <td style={{ ...S.td, ...S.mono, fontWeight: 900 }}>{formatUZS(profit)} so‘m</td>

                      <td style={S.td}>
                        {!isLow ? (
                          <span style={{ ...S.pill, ...S.pillOk }}>Normal</span>
                        ) : isCritical ? (
                          <span style={{ ...S.pill, ...S.pillDanger }}>Juda kam</span>
                        ) : (
                          <span style={{ ...S.pill, ...S.pillWarn }}>Kam</span>
                        )}
                      </td>

                      <td style={S.td}>
                        <div style={S.rowActions}>
                          <button style={S.miniBtn} onClick={() => openEdit(p)} disabled={loading}>
                            Tahrirlash
                          </button>
                          <button style={S.miniBtnDanger} onClick={() => deleteProduct(p._id)} disabled={loading}>
                            O‘chirish
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {drawerOpen && (
        <div
          style={S.drawerBg}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeDrawer()
          }}
        >
          <div style={S.drawer} onMouseDown={(e) => e.stopPropagation()}>
            <div style={S.drawerHeader}>
              <div>
                <h2 style={S.drawerTitle}>{editingId ? "✏️ Mahsulotni tahrirlash" : "➕ Yangi mahsulot qo‘shish"}</h2>
                <p style={S.drawerSub}>Mobil uchun: modal ichida scroll bor (buzilmaydi).</p>
              </div>

              <button style={S.smallLink} onClick={closeDrawer} type="button">
                Yopish ✕
              </button>
            </div>

            <div style={S.drawerBody}>
              <div style={S.formGrid} className="formGrid">
                <div style={S.field}>
                  <div style={S.label}>Mahsulot nomi *</div>
                  <input
                    style={S.input}
                    value={form.name}
                    onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                    placeholder="Masalan: Shakar"
                  />
                  <div style={S.help}>Majburiy maydon.</div>
                </div>

                <div style={S.field}>
                  <div style={S.label}>Kategoriya</div>
                  <input
                    style={S.input}
                    value={form.category}
                    onChange={(e) => setForm((s) => ({ ...s, category: e.target.value }))}
                    placeholder="Masalan: Oziq-ovqat"
                  />
                </div>

                <div style={S.field}>
                  <div style={S.label}>Shtrix-kod (ixtiyoriy)</div>
                  <input
                    style={S.input}
                    value={form.barcode}
                    onChange={(e) => setForm((s) => ({ ...s, barcode: e.target.value }))}
                    placeholder="4780..."
                  />
                </div>

                <div style={S.field}>
                  <div style={S.label}>Birlik</div>
                  <select
                    style={S.select}
                    value={form.unit}
                    onChange={(e) => setForm((s) => ({ ...s, unit: e.target.value as Unit }))}
                  >
                    <option value="dona">dona</option>
                    <option value="kg">kg</option>
                    <option value="litr">litr</option>
                    <option value="quti">quti</option>
                  </select>
                </div>

                <div style={S.field}>
                  <div style={S.label}>Kelish narxi (so‘m)</div>
                  <input
                    style={S.input}
                    type="number"
                    inputMode="numeric"
                    value={form.costPrice}
                    onChange={(e) => setForm((s) => ({ ...s, costPrice: Number(e.target.value) }))}
                  />
                </div>

                <div style={S.field}>
                  <div style={S.label}>Sotuv narxi (so‘m)</div>
                  <input
                    style={S.input}
                    type="number"
                    inputMode="numeric"
                    value={form.sellPrice}
                    onChange={(e) => setForm((s) => ({ ...s, sellPrice: Number(e.target.value) }))}
                  />
                  <div style={S.help}>
                    Foyda: <b style={S.mono}>{formatUZS(profitPreview)}</b> so‘m
                  </div>
                </div>

                <div style={S.field}>
                  <div style={S.label}>Qoldiq (stock)</div>
                  <input
                    style={S.input}
                    type="number"
                    inputMode="numeric"
                    value={form.stock}
                    onChange={(e) => setForm((s) => ({ ...s, stock: Number(e.target.value) }))}
                  />
                </div>

                <div style={S.field}>
                  <div style={S.label}>Oz qoldi limiti</div>
                  <input
                    style={S.input}
                    type="number"
                    inputMode="numeric"
                    value={form.lowStockLimit}
                    onChange={(e) => setForm((s) => ({ ...s, lowStockLimit: Number(e.target.value) }))}
                  />
                  <div style={S.help}>Qoldiq shu sondan past bo‘lsa “Kam” chiqadi.</div>
                </div>
              </div>
            </div>

            <div style={S.drawerFooter}>
              <button style={S.btn} onClick={closeDrawer} type="button" disabled={loading}>
                Bekor
              </button>
              <button style={S.btnPrimary} onClick={upsertProduct} type="button" disabled={loading}>
                {editingId ? "Saqlash" : "Qo‘shish"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ CSS: hamburger only mobile + stats grid responsive + form grid responsive */}
      <style>{`
        @media (max-width: 980px) {
          .hamburgerOnlyMobile { display: inline-flex !important; align-items: center; justify-content: center; }
        }
        @media (max-width: 860px) {
          /* stats cards: 3 -> 1 */
          div[style*="gridTemplateColumns: repeat(3"] { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 720px) {
          .formGrid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
