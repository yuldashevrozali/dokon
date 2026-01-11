"use client"

import React, { useEffect, useMemo, useState } from "react"

type Unit = "dona" | "kg" | "litr" | "quti"
type Product = {
  _id: string
  name: string
  category: string
  barcode?: string
  unit: Unit
  costPrice: number // kelish narxi
  sellPrice: number // sotuv narxi
  stock: number
  lowStockLimit: number
  createdAt: string
  updatedAt: string
}

function formatUZS(n: number) {
  if (!Number.isFinite(n)) return "0"
  return new Intl.NumberFormat("en-US").format(Math.round(n))
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [query, setQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")

  // Form states
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

  // Load products
  const loadProducts = async () => {
    try {
      const res = await fetch('/api/products')
      if (res.ok) {
        const data = await res.json()
        setProducts(data)
      }
    } catch (error) {
      console.error('Error loading products:', error)
    }
  }

  useEffect(() => {
    loadProducts()
  }, [])

  const categories = useMemo(() => {
    const set = new Set<string>()
    for (const p of products) set.add(p.category || "Umumiy")
    return ["all", ...Array.from(set).sort((a, b) => a.localeCompare(b))]
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
      category: p.category,
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
    if (err) {
      alert(err)
      return
    }

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
      if (!editingId) {
        // Create new product
        const res = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(productData),
        })
        if (res.ok) {
          await loadProducts()
          setDrawerOpen(false)
        } else {
          alert('Mahsulot qo\'shishda xatolik')
        }
      } else {
        // Update existing product
        const res = await fetch(`/api/products/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(productData),
        })
        if (res.ok) {
          await loadProducts()
          setDrawerOpen(false)
        } else {
          alert('Mahsulot yangilashda xatolik')
        }
      }
    } catch (error) {
      console.error('Error upserting product:', error)
      alert('Xatolik yuz berdi')
    }
  }

  async function deleteProduct(id: string) {
    const p = products.find((x) => x._id === id)
    const ok = confirm(`O‘chirishni tasdiqlaysizmi?\n\n${p?.name ?? "Mahsulot"}`)
    if (!ok) return
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' })
      if (res.ok) {
        await loadProducts()
      } else {
        alert('Mahsulot o\'chirishda xatolik')
      }
    } catch (error) {
      console.error('Error deleting product:', error)
      alert('Xatolik yuz berdi')
    }
  }

  async function adjustStock(id: string, delta: number) {
    const p = products.find((x) => x._id === id)
    if (!p) return
    const newStock = Math.max(0, p.stock + delta)
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock: newStock }),
      })
      if (res.ok) {
        await loadProducts()
      } else {
        alert('Qoldiq yangilashda xatolik')
      }
    } catch (error) {
      console.error('Error adjusting stock:', error)
      alert('Xatolik yuz berdi')
    }
  }

  function resetDemo() {
    // For demo, perhaps clear all products
    alert('Demo reset - bu funksiya hali amalga oshirilmagan')
  }

  const styles: Record<string, React.CSSProperties> = {
    page: { padding: 22, background: "#f7f8fb", minHeight: "100vh" },
    header: {
      display: "flex",
      gap: 12,
      alignItems: "flex-start",
      justifyContent: "space-between",
      flexWrap: "wrap",
    },
    title: { margin: 0, fontSize: 20, fontWeight: 900, color: "#0f172a" },
    sub: { margin: "6px 0 0", color: "#64748b", fontSize: 13 },
    actions: { display: "flex", gap: 10, flexWrap: "wrap" },
    btnPrimary: {
      border: 0,
      borderRadius: 14,
      padding: "10px 14px",
      background: "#2563eb",
      color: "#fff",
      fontWeight: 900,
      cursor: "pointer",
      boxShadow: "0 10px 18px rgba(37,99,235,.18)",
    },
    btn: {
      borderRadius: 14,
      padding: "10px 14px",
      background: "#fff",
      border: "1px solid #e5e7ef",
      color: "#0f172a",
      fontWeight: 900,
      cursor: "pointer",
    },
    grid: {
      marginTop: 16,
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
      minWidth: 240,
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
    table: { width: "100%", borderCollapse: "separate", borderSpacing: 0, fontSize: 13 },
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
    drawerBg: {
      position: "fixed",
      inset: 0,
      background: "rgba(15, 23, 42, .45)",
      display: "grid",
      placeItems: "center",
      padding: 16,
      zIndex: 50,
    },
    drawer: {
      width: "min(860px, 100%)",
      background: "#fff",
      borderRadius: 18,
      border: "1px solid #e8ebf3",
      overflow: "hidden",
      boxShadow: "0 30px 80px rgba(0,0,0,.2)",
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
    drawerBody: { padding: 14, display: "grid", gap: 12 },
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
    <div style={styles.page} className="fade-in">
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>📦 Mahsulotlar</h1>
          <p style={styles.sub}>
            Demo versiya: qo‘shish, tahrirlash, o‘chirish, narx belgilash, qoldiq nazorati.
            (Ma’lumotlar brauzerda saqlanadi)
          </p>
        </div>

        <div style={styles.actions}>
          <button style={styles.btnPrimary} onClick={openCreate}>
            + Yangi mahsulot
          </button>
          <button style={styles.btn} onClick={resetDemo} title="Demo ma’lumotlarni tozalash">
            Reset demo
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={styles.grid} className="slide-in">
        <div style={styles.card} className="bounce-in">
          <div style={styles.cardLabel}>Mahsulotlar</div>
          <div style={styles.cardValue}>{totals.items} ta</div>
        </div>
        <div style={{ ...styles.card, animationDelay: '0.1s' }} className="bounce-in">
          <div style={styles.cardLabel}>Jami qoldiq</div>
          <div style={styles.cardValue}>{totals.stockTotal} birlik</div>
        </div>
        <div style={{ ...styles.card, animationDelay: '0.2s' }} className="bounce-in">
          <div style={styles.cardLabel}>Oz qolganlar</div>
          <div style={styles.cardValue}>{totals.low} ta</div>
        </div>
      </div>

      {/* Tools */}
      <div style={styles.tools}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <input
            style={styles.input}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Qidirish: nomi, kategoriya yoki shtrix-kod..."
          />

          <select
            style={styles.select}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
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
      <div style={{ ...styles.tableWrap, animationDelay: '0.5s' }} className="fade-in">
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Mahsulot</th>
              <th style={styles.th}>Kategoriya</th>
              <th style={styles.th}>Shtrix-kod</th>
              <th style={styles.th}>Qoldiq</th>
              <th style={styles.th}>Kelish narxi</th>
              <th style={styles.th}>Sotuv narxi</th>
              <th style={styles.th}>Foyda / dona</th>
              <th style={styles.th}>Holat</th>
              <th style={styles.th}>Amallar</th>
            </tr>
          </thead>

          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td style={{ ...styles.td, color: "#64748b" }} colSpan={9}>
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
                    <td style={styles.td}>
                      <div style={{ fontWeight: 950 }}>{p.name}</div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>
                        Birlik: <span style={styles.mono}>{p.unit}</span>
                        <span style={{ margin: "0 8px" }}>•</span>
                        Limit: <span style={styles.mono}>{p.lowStockLimit}</span>
                      </div>
                    </td>

                    <td style={styles.td}>{p.category}</td>

                    <td style={{ ...styles.td, ...styles.mono }}>
                      {p.barcode ? p.barcode : <span style={{ color: "#94a3b8" }}>—</span>}
                    </td>

                    <td style={styles.td}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ ...styles.mono, fontWeight: 900 }}>
                          {p.stock} {p.unit}
                        </span>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button style={styles.miniBtn} onClick={() => adjustStock(p._id, -1)}>
                            -1
                          </button>
                          <button style={styles.miniBtn} onClick={() => adjustStock(p._id, +1)}>
                            +1
                          </button>
                        </div>
                      </div>
                    </td>

                    <td style={{ ...styles.td, ...styles.mono }}>
                      {formatUZS(p.costPrice)} so‘m
                    </td>

                    <td style={{ ...styles.td, ...styles.mono }}>
                      {formatUZS(p.sellPrice)} so‘m
                    </td>

                    <td style={{ ...styles.td, ...styles.mono, fontWeight: 900 }}>
                      {formatUZS(profit)} so‘m
                    </td>

                    <td style={styles.td}>
                      {!isLow ? (
                        <span style={{ ...styles.pill, ...styles.pillOk }}>Normal</span>
                      ) : isCritical ? (
                        <span style={{ ...styles.pill, ...styles.pillDanger }}>Juda kam</span>
                      ) : (
                        <span style={{ ...styles.pill, ...styles.pillWarn }}>Kam</span>
                      )}
                    </td>

                    <td style={styles.td}>
                      <div style={styles.rowActions}>
                        <button style={styles.miniBtn} onClick={() => openEdit(p)}>
                          Tahrirlash
                        </button>
                        <button style={styles.miniBtnDanger} onClick={() => deleteProduct(p._id)}>
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

      {/* Drawer / Modal */}
      {drawerOpen && (
        <div style={styles.drawerBg} onMouseDown={closeDrawer}>
          <div style={styles.drawer} onMouseDown={(e) => e.stopPropagation()}>
            <div style={styles.drawerHeader}>
              <div>
                <h2 style={styles.drawerTitle}>
                  {editingId ? "✏️ Mahsulotni tahrirlash" : "➕ Yangi mahsulot qo‘shish"}
                </h2>
                <p style={styles.drawerSub}>
                  Demo: hammasi localStorage’da saqlanadi. Keyin API’ga ulaysiz.
                </p>
              </div>

              <button style={styles.smallLink} onClick={closeDrawer}>
                Yopish ✕
              </button>
            </div>

            <div style={styles.drawerBody}>
              <div style={styles.formGrid}>
                <div style={styles.field}>
                  <div style={styles.label}>Mahsulot nomi *</div>
                  <input
                    style={styles.input}
                    value={form.name}
                    onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                    placeholder="Masalan: Shakar"
                  />
                  <div style={styles.help}>Majburiy maydon.</div>
                </div>

                <div style={styles.field}>
                  <div style={styles.label}>Kategoriya</div>
                  <input
                    style={styles.input}
                    value={form.category}
                    onChange={(e) => setForm((s) => ({ ...s, category: e.target.value }))}
                    placeholder="Masalan: Oziq-ovqat"
                  />
                </div>

                <div style={styles.field}>
                  <div style={styles.label}>Shtrix-kod (ixtiyoriy)</div>
                  <input
                    style={styles.input}
                    value={form.barcode}
                    onChange={(e) => setForm((s) => ({ ...s, barcode: e.target.value }))}
                    placeholder="4780..."
                  />
                </div>

                <div style={styles.field}>
                  <div style={styles.label}>Birlik</div>
                  <select
                    style={styles.select}
                    value={form.unit}
                    onChange={(e) => setForm((s) => ({ ...s, unit: e.target.value as Unit }))}
                  >
                    <option value="dona">dona</option>
                    <option value="kg">kg</option>
                    <option value="litr">litr</option>
                    <option value="quti">quti</option>
                  </select>
                </div>

                <div style={styles.field}>
                  <div style={styles.label}>Kelish narxi (so‘m)</div>
                  <input
                    style={styles.input}
                    type="number"
                    value={form.costPrice}
                    onChange={(e) => setForm((s) => ({ ...s, costPrice: Number(e.target.value) }))}
                  />
                </div>

                <div style={styles.field}>
                  <div style={styles.label}>Sotuv narxi (so‘m)</div>
                  <input
                    style={styles.input}
                    type="number"
                    value={form.sellPrice}
                    onChange={(e) => setForm((s) => ({ ...s, sellPrice: Number(e.target.value) }))}
                  />
                  <div style={styles.help}>
                    Foyda:{" "}
                    <b style={styles.mono}>{formatUZS(form.sellPrice - form.costPrice)}</b> so‘m
                  </div>
                </div>

                <div style={styles.field}>
                  <div style={styles.label}>Qoldiq (stock)</div>
                  <input
                    style={styles.input}
                    type="number"
                    value={form.stock}
                    onChange={(e) => setForm((s) => ({ ...s, stock: Number(e.target.value) }))}
                  />
                </div>

                <div style={styles.field}>
                  <div style={styles.label}>Oz qoldi limiti</div>
                  <input
                    style={styles.input}
                    type="number"
                    value={form.lowStockLimit}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, lowStockLimit: Number(e.target.value) }))
                    }
                  />
                  <div style={styles.help}>Qoldiq shu sondan past bo‘lsa “Kam” chiqadi.</div>
                </div>
              </div>
            </div>

            <div style={styles.drawerFooter}>
              <button style={styles.btn} onClick={closeDrawer}>
                Bekor
              </button>
              <button style={styles.btnPrimary} onClick={upsertProduct}>
                {editingId ? "Saqlash" : "Qo‘shish"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Responsive hint */}
      <style>{`
        @media (max-width: 980px) {
          .grid3 { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
