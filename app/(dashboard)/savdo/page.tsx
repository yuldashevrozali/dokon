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

type Sale = {
  _id: string
  productId: string
  productName: string
  quantity: number
  unit: Unit
  sellPrice: number
  costPrice: number
  total: number
  profit: number
  timestamp: string
}


function formatUZS(n: number) {
  if (!Number.isFinite(n)) return "0"
  return new Intl.NumberFormat("en-US").format(Math.round(n))
}

export default function SavdoPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [query, setQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [quantity, setQuantity] = useState(1)

  // Load products
  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setProducts(data)
        }
      })
      .catch(err => console.error('Error fetching products:', err))
  }, [])

  const categories = useMemo(() => {
    const set = new Set<string>()
    for (const p of products) set.add(p.category || "Umumiy")
    return ["all", ...Array.from(set).sort((a, b) => a.localeCompare(b))]
  }, [products])

  const availableProducts = useMemo(() => {
    const q = query.trim().toLowerCase()
    return products
      .filter((p) => p.stock > 0)
      .filter((p) => {
        if (categoryFilter !== "all" && p.category !== categoryFilter) return false
        if (!q) return true
        return (
          p.name.toLowerCase().includes(q) ||
          (p.barcode ? p.barcode.toLowerCase().includes(q) : false) ||
          p.category.toLowerCase().includes(q)
        )
      })
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [products, query, categoryFilter])

  function selectProduct(p: Product) {
    setSelectedProduct(p)
    setQuantity(1)
  }

  async function sellProduct() {
    if (!selectedProduct) return
    const qty = Number(quantity)
    if (qty <= 0 || qty > selectedProduct.stock) {
      alert("Noto‘g‘ri miqdor!")
      return
    }

    const total = selectedProduct.sellPrice * qty
    const profit = (selectedProduct.sellPrice - selectedProduct.costPrice) * qty
    const saleData = {
      productId: selectedProduct._id,
      productName: selectedProduct.name,
      quantity: qty,
      unit: selectedProduct.unit,
      sellPrice: selectedProduct.sellPrice,
      costPrice: selectedProduct.costPrice,
      total,
      profit,
    }

    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saleData)
      })
      if (!res.ok) throw new Error('Failed to save sale')
      const savedSale = await res.json()

      // Update products locally
      const newStock = selectedProduct.stock - qty
      const updatedProducts = products.map((p) =>
        p._id === selectedProduct._id
          ? { ...p, stock: newStock, updatedAt: new Date().toISOString() }
          : p
      )
      setProducts(updatedProducts)

      alert(`${selectedProduct.name} ${qty} ${selectedProduct.unit} sotildi! Qoldiq: ${newStock}`)
      setSelectedProduct(null)
      setQuantity(1)
    } catch (error) {
      console.error('Error saving sale:', error)
      alert('Savdo saqlashda xatolik yuz berdi!')
    }
  }

  const styles: Record<string, React.CSSProperties> = {
    page: { padding: 22, background: "#f7f8fb", minHeight: "100vh" },
    header: {
      display: "flex",
      gap: 12,
      alignItems: "flex-start",
      justifyContent: "space-between",
      flexWrap: "wrap",
      marginBottom: 20,
    },
    title: { margin: 0, fontSize: 24, fontWeight: 900, color: "#0f172a" },
    sub: { margin: "6px 0 0", color: "#64748b", fontSize: 13 },
    tools: {
      display: "flex",
      gap: 10,
      flexWrap: "wrap",
      alignItems: "center",
      marginBottom: 16,
    },
    input: {
      borderRadius: 14,
      border: "1px solid #e5e7ef",
      padding: "10px 12px",
      background: "#fff",
      outline: "none",
      minWidth: 200,
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
    grid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
      gap: 12,
      marginBottom: 20,
    } as React.CSSProperties,
    card: {
      background: "#fff",
      border: "1px solid #e8ebf3",
      borderRadius: 16,
      padding: 16,
      boxShadow: "0 10px 25px rgba(15,23,42,.04)",
      cursor: "pointer",
      transition: "transform 0.1s",
    },
    cardHover: { transform: "translateY(-2px)" },
    productName: { fontWeight: 900, fontSize: 16, color: "#0f172a", marginBottom: 4 },
    productMeta: { fontSize: 12, color: "#64748b", marginBottom: 8 },
    productPrice: { fontSize: 18, fontWeight: 900, color: "#2563eb" },
    sellSection: {
      background: "#fff",
      border: "1px solid #e8ebf3",
      borderRadius: 16,
      padding: 20,
      boxShadow: "0 10px 25px rgba(15,23,42,.04)",
      maxWidth: 400,
      margin: "0 auto",
    },
    sellTitle: { fontSize: 18, fontWeight: 900, marginBottom: 16, textAlign: "center" },
    sellForm: { display: "grid", gap: 12 },
    label: { fontSize: 14, fontWeight: 900, color: "#334155" },
    quantityInput: {
      borderRadius: 14,
      border: "1px solid #e5e7ef",
      padding: "10px 12px",
      background: "#fff",
      outline: "none",
      fontSize: 16,
    },
    btn: {
      borderRadius: 14,
      padding: "12px 16px",
      background: "#f1f5f9",
      border: "1px solid #e5e7ef",
      color: "#0f172a",
      fontWeight: 900,
      cursor: "pointer",
    },
    btnPrimary: {
      background: "#2563eb",
      color: "#fff",
      border: "1px solid #2563eb",
    },
    backBtn: {
      background: "transparent",
      border: 0,
      color: "#2563eb",
      fontWeight: 900,
      cursor: "pointer",
      padding: "10px",
      marginBottom: 16,
    },
  }

  if (selectedProduct) {
    const total = selectedProduct.sellPrice * quantity
    return (
      <div style={styles.page}>
        <button style={styles.backBtn} onClick={() => setSelectedProduct(null)}>
          ← Orqaga
        </button>
        <div style={styles.sellSection} className="sellSection">
          <h2 style={styles.sellTitle}>📦 {selectedProduct.name} sotish</h2>
          <div style={styles.sellForm}>
            <div>
              <div style={styles.label}>Qoldiq: {selectedProduct.stock} {selectedProduct.unit}</div>
              <div style={styles.label}>Narx: {formatUZS(selectedProduct.sellPrice)} so‘m / {selectedProduct.unit}</div>
            </div>
            <div>
              <div style={styles.label}>Miqdor</div>
              <input
                style={styles.quantityInput}
                type="number"
                min="1"
                max={selectedProduct.stock}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
              />
            </div>
            <div style={styles.label}>Jami: {formatUZS(total)} so‘m</div>
            <button style={{ ...styles.btn, ...styles.btnPrimary }} onClick={sellProduct}>
              ✅ Sotildi
            </button>
          </div>
        </div>
  
        <style>{`
          @media (max-width: 768px) {
            .hamburger {
              display: block !important;
            }
            .grid {
              grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)) !important;
            }
            .sellSection {
              max-width: 100% !important;
              margin: 0 !important;
            }
          }
          @media (max-width: 480px) {
            .page {
              padding: 12px !important;
            }
            .grid {
              grid-template-columns: 1fr !important;
            }
            .header {
              flex-direction: column !important;
              align-items: flex-start !important;
              margin-bottom: 10px !important;
            }
            .tools {
              flex-direction: column !important;
              align-items: stretch !important;
            }
          }
        `}</style>
      </div>
    )
  }

  return (
    <div style={styles.page} className="page fade-in">
      <div style={styles.header}>
        <button
          style={{
            background: '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '8px 12px',
            cursor: 'pointer',
            fontSize: 16,
            marginRight: 10,
          }}
          className="hamburger"
          onClick={() => window.dispatchEvent(new CustomEvent('toggleSidebar'))}
        >
          ☰
        </button>
        <div>
          <h1 style={styles.title}>Savdo qilish</h1>
          <p style={styles.sub}>
            Mahsulotlarni tanlang va sotib yuboring. Qoldiq avtomatik yangilanadi.
          </p>
        </div>
      </div>

      <div style={styles.tools} className="slide-in">
        <input
          style={styles.input}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Qidirish: nomi yoki shtrix-kod..."
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
        <div style={{ color: "#64748b", fontSize: 12 }}>
          Mavjud: {availableProducts.length} ta
        </div>
      </div>

      <div style={styles.grid} className="grid">
        {availableProducts.length === 0 ? (
          <div style={{ ...styles.card, textAlign: "center", gridColumn: "1 / -1" }}>
            <p style={{ color: "#64748b" }}>Savdo qilish uchun mahsulot yo‘q yoki topilmadi.</p>
          </div>
        ) : (
          availableProducts.map((p) => (
            <div
              key={p._id}
              style={styles.card}
              onClick={() => selectProduct(p)}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
            >
              <div style={styles.productName}>{p.name}</div>
              <div style={styles.productMeta}>
                {p.category} • {p.stock} {p.unit} qoldiq
              </div>
              <div style={styles.productPrice}>{formatUZS(p.sellPrice)} so‘m</div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
