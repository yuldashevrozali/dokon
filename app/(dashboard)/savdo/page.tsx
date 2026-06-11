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

type CartItem = {
  product: Product
  quantity: number
}

type PaymentType = "naqd" | "karta" | "qarz"

function formatUZS(n: number) {
  if (!Number.isFinite(n)) return "0"
  return new Intl.NumberFormat("en-US").format(Math.round(n))
}

export default function SavdoPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [query, setQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [cart, setCart] = useState<CartItem[]>([])
  const [selling, setSelling] = useState(false)

  // To'lov turi
  const [paymentType, setPaymentType] = useState<PaymentType>("naqd")
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [dueDate, setDueDate] = useState("")

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => { if (Array.isArray(data)) setProducts(data) })
      .catch((err) => console.error("Error fetching products:", err))
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

  function addToCart(p: Product) {
    setCart((prev) => {
      const existing = prev.find((c) => c.product._id === p._id)
      if (existing) {
        if (existing.quantity >= p.stock) return prev
        return prev.map((c) =>
          c.product._id === p._id ? { ...c, quantity: c.quantity + 1 } : c
        )
      }
      return [...prev, { product: p, quantity: 1 }]
    })
  }

  function updateQty(id: string, qty: number) {
    setCart((prev) =>
      prev
        .map((c) => (c.product._id === id ? { ...c, quantity: qty } : c))
        .filter((c) => c.quantity > 0)
    )
  }

  function removeFromCart(id: string) {
    setCart((prev) => prev.filter((c) => c.product._id !== id))
  }

  const cartTotal = cart.reduce((sum, c) => sum + c.product.sellPrice * c.quantity, 0)
  const cartProfit = cart.reduce(
    (sum, c) => sum + (c.product.sellPrice - c.product.costPrice) * c.quantity,
    0
  )

  async function sellAll() {
    if (cart.length === 0) return

    // Qarz bo'lsa ism majburiy
    if (paymentType === "qarz" && !customerName.trim()) {
      alert("Qarz uchun mijoz ismini kiriting!")
      return
    }

    setSelling(true)
    try {
      const productNames = cart.map(c => `${c.product.name} (${c.quantity} ${c.product.unit})`)

      for (const item of cart) {
        const saleData = {
          productId: item.product._id,
          productName: item.product.name,
          productNames,
          quantity: item.quantity,
          unit: item.product.unit,
          sellPrice: item.product.sellPrice,
          costPrice: item.product.costPrice,
          total: item.product.sellPrice * item.quantity,
          profit: (item.product.sellPrice - item.product.costPrice) * item.quantity,
          paymentType,
          customerName: paymentType === "qarz" ? customerName.trim() : undefined,
          customerPhone: paymentType === "qarz" && customerPhone.trim() ? customerPhone.trim() : undefined,
          dueDate: paymentType === "qarz" && dueDate ? dueDate : undefined,
        }
        const res = await fetch("/api/sales", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(saleData),
        })
        if (!res.ok) throw new Error(`${item.product.name} saqlashda xatolik`)
      }

      setProducts((prev) =>
        prev.map((p) => {
          const item = cart.find((c) => c.product._id === p._id)
          return item ? { ...p, stock: p.stock - item.quantity } : p
        })
      )

      const payLabel = paymentType === "naqd" ? "Naqd" : paymentType === "karta" ? "Karta" : "Qarz"
      alert(
        `✅ ${cart.length} ta mahsulot sotildi!\nTo'lov: ${payLabel}\nJami: ${formatUZS(cartTotal)} so'm\nFoyda: ${formatUZS(cartProfit)} so'm`
      )
      setCart([])
      setCustomerName("")
      setCustomerPhone("")
      setDueDate("")
      setPaymentType("naqd")
    } catch (err) {
      const message = err instanceof Error ? err.message : "Noma'lum xatolik"
      alert("Xatolik: " + message)
    } finally {
      setSelling(false)
    }
  }

  const inCart = (id: string) => cart.find((c) => c.product._id === id)

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f7f8fb" }}>
      {/* LEFT: mahsulotlar */}
      <div style={{ flex: 1, padding: 22, minWidth: 0 }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
          <button
            style={{ background: "#2563eb", color: "#fff", border: "none", borderRadius: 8, padding: "8px 12px", cursor: "pointer", fontSize: 16 }}
            className="hamburger"
            onClick={() => window.dispatchEvent(new CustomEvent("toggleSidebar"))}
          >
            ☰
          </button>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: "#0f172a" }}>Savdo qilish</h1>
            <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 13 }}>
              Mahsulotlarni savatga qo&apos;shing va birda soting
            </p>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 16 }}>
          <input
            style={{ borderRadius: 14, border: "1px solid #e5e7ef", padding: "10px 12px", background: "#fff", outline: "none", minWidth: 220, fontSize: 14 }}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Qidirish: nomi yoki shtrix-kod..."
          />
          <select
            style={{ borderRadius: 14, border: "1px solid #e5e7ef", padding: "10px 12px", background: "#fff", outline: "none", minWidth: 180, cursor: "pointer", fontSize: 14 }}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            {categories.map((c) => (
              <option key={c} value={c}>{c === "all" ? "Barcha kategoriya" : c}</option>
            ))}
          </select>
          <span style={{ color: "#64748b", fontSize: 12 }}>Mavjud: {availableProducts.length} ta</span>
        </div>

        {/* Product grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
          {availableProducts.length === 0 ? (
            <div style={{ gridColumn: "1/-1", textAlign: "center", color: "#64748b", padding: 40 }}>
              Mahsulot topilmadi
            </div>
          ) : (
            availableProducts.map((p) => {
              const cartItem = inCart(p._id)
              return (
                <div
                  key={p._id}
                  style={{
                    background: "#fff",
                    border: cartItem ? "2px solid #2563eb" : "1px solid #e8ebf3",
                    borderRadius: 16,
                    padding: 14,
                    boxShadow: "0 4px 16px rgba(15,23,42,.05)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    transition: "border 0.15s",
                  }}
                >
                  <div style={{ fontWeight: 900, fontSize: 15, color: "#0f172a" }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>{p.category} • {p.stock} {p.unit} qoldiq</div>
                  <div style={{ fontSize: 17, fontWeight: 900, color: "#2563eb" }}>{formatUZS(p.sellPrice)} so&apos;m</div>

                  {cartItem ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                      <button
                        onClick={() => updateQty(p._id, cartItem.quantity - 1)}
                        style={qtyBtnStyle}
                      >−</button>
                      <span style={{ fontWeight: 900, minWidth: 24, textAlign: "center" }}>{cartItem.quantity}</span>
                      <button
                        onClick={() => cartItem.quantity < p.stock && updateQty(p._id, cartItem.quantity + 1)}
                        style={{ ...qtyBtnStyle, opacity: cartItem.quantity >= p.stock ? 0.4 : 1 }}
                      >+</button>
                      <button
                        onClick={() => removeFromCart(p._id)}
                        style={{ marginLeft: "auto", background: "#fee2e2", color: "#b91c1c", border: "none", borderRadius: 10, padding: "6px 10px", cursor: "pointer", fontSize: 12, fontWeight: 700 }}
                      >O&apos;chirish</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => addToCart(p)}
                      style={{ marginTop: 4, background: "#eff6ff", color: "#2563eb", border: "1px solid #dbeafe", borderRadius: 12, padding: "8px 12px", cursor: "pointer", fontWeight: 800, fontSize: 13 }}
                    >
                      + Savatga
                    </button>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* RIGHT: savat */}
      <div style={{
        width: 320,
        minWidth: 280,
        background: "#fff",
        borderLeft: "1px solid #e8ebf3",
        display: "flex",
        flexDirection: "column",
        position: "sticky",
        top: 0,
        height: "100vh",
        overflowY: "auto",
      }}>
        <div style={{ padding: "18px 16px 12px", borderBottom: "1px solid #eef2f7" }}>
          <div style={{ fontWeight: 900, fontSize: 16, color: "#0f172a" }}>
            🛒 Savat {cart.length > 0 && <span style={{ background: "#2563eb", color: "#fff", borderRadius: 999, padding: "2px 8px", fontSize: 12, marginLeft: 6 }}>{cart.length}</span>}
          </div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
            {cart.length === 0 ? "Hali hech narsa qoʼshilmagan" : `${cart.length} xil mahsulot`}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px" }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: "center", color: "#94a3b8", marginTop: 60, fontSize: 14 }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🛒</div>
              Mahsulot tanlang
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {cart.map((item) => (
                <div key={item.product._id} style={{ border: "1px solid #eef2f7", borderRadius: 14, padding: "10px 12px", background: "#fbfdff" }}>
                  <div style={{ fontWeight: 800, fontSize: 13, color: "#0f172a", marginBottom: 4 }}>{item.product.name}</div>
                  <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>
                    {formatUZS(item.product.sellPrice)} so&apos;m × {item.quantity} {item.product.unit}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <button onClick={() => updateQty(item.product._id, item.quantity - 1)} style={qtyBtnStyle}>−</button>
                      <span style={{ fontWeight: 900, minWidth: 24, textAlign: "center", fontSize: 14 }}>{item.quantity}</span>
                      <button
                        onClick={() => item.quantity < item.product.stock && updateQty(item.product._id, item.quantity + 1)}
                        style={{ ...qtyBtnStyle, opacity: item.quantity >= item.product.stock ? 0.4 : 1 }}
                      >+</button>
                    </div>
                    <div style={{ fontWeight: 900, color: "#2563eb", fontSize: 14 }}>
                      {formatUZS(item.product.sellPrice * item.quantity)} so&apos;m
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div style={{ padding: "14px 16px", borderTop: "1px solid #eef2f7" }}>
            {/* Jami */}
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 13, color: "#64748b" }}>
              <span>Jami summa</span>
              <span style={{ fontWeight: 900, color: "#0f172a" }}>{formatUZS(cartTotal)} so&apos;m</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14, fontSize: 13, color: "#64748b" }}>
              <span>Foyda</span>
              <span style={{ fontWeight: 900, color: "#16a34a" }}>{formatUZS(cartProfit)} so&apos;m</span>
            </div>

            {/* To'lov turi */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 6 }}>To&apos;lov turi</div>
              <div style={{ display: "flex", gap: 6 }}>
                {(["naqd", "karta", "qarz"] as PaymentType[]).map((pt) => (
                  <button
                    key={pt}
                    onClick={() => setPaymentType(pt)}
                    style={{
                      flex: 1,
                      padding: "8px 4px",
                      borderRadius: 10,
                      border: "1px solid",
                      fontWeight: 800,
                      fontSize: 12,
                      cursor: "pointer",
                      background: paymentType === pt
                        ? pt === "qarz" ? "#fee2e2" : pt === "karta" ? "#eff6ff" : "#f0fdf4"
                        : "#f8fafc",
                      color: paymentType === pt
                        ? pt === "qarz" ? "#b91c1c" : pt === "karta" ? "#1d4ed8" : "#065f46"
                        : "#64748b",
                      borderColor: paymentType === pt
                        ? pt === "qarz" ? "#fca5a5" : pt === "karta" ? "#93c5fd" : "#86efac"
                        : "#e5e7ef",
                    }}
                  >
                    {pt === "naqd" ? "💵 Naqd" : pt === "karta" ? "💳 Karta" : "📋 Qarz"}
                  </button>
                ))}
              </div>
            </div>

            {/* Qarz bo'lsa — mijoz ma'lumotlari */}
            {paymentType === "qarz" && (
              <div style={{ background: "#fff5f5", border: "1px solid #fecaca", borderRadius: 12, padding: "12px", marginBottom: 12, display: "grid", gap: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: "#b91c1c", marginBottom: 2 }}>
                  📋 Qarz ma&apos;lumotlari
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#334155", marginBottom: 4 }}>Mijoz ismi *</div>
                  <input
                    style={qarzInp}
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    placeholder="Otabek, Dilshod..."
                  />
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#334155", marginBottom: 4 }}>Telefon (ixtiyoriy)</div>
                  <input
                    style={qarzInp}
                    value={customerPhone}
                    onChange={e => setCustomerPhone(e.target.value)}
                    placeholder="+998 90 123 45 67"
                  />
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#334155", marginBottom: 4 }}>Qaytarish sanasi (ixtiyoriy)</div>
                  <input
                    type="date"
                    style={qarzInp}
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                  />
                </div>
                <div style={{ fontSize: 11, color: "#b91c1c", marginTop: 2 }}>
                  ⚠️ Qarz kassaga kirmaydi — to&apos;langandan keyin kirim bo&apos;ladi
                </div>
              </div>
            )}

            <button
              onClick={sellAll}
              disabled={selling}
              style={{
                width: "100%",
                padding: "13px 16px",
                background: selling ? "#93c5fd" : paymentType === "qarz" ? "#dc2626" : "#2563eb",
                color: "#fff",
                border: "none",
                borderRadius: 14,
                fontWeight: 900,
                fontSize: 15,
                cursor: selling ? "not-allowed" : "pointer",
                boxShadow: paymentType === "qarz" ? "0 8px 18px rgba(220,38,38,.2)" : "0 8px 18px rgba(37,99,235,.2)",
              }}
            >
              {selling
                ? "Saqlanmoqda..."
                : paymentType === "qarz"
                ? `📋 Qarz yozish (${formatUZS(cartTotal)} so'm)`
                : `✅ Sotish — ${formatUZS(cartTotal)} so'm`}
            </button>
            <button
              onClick={() => { setCart([]); setPaymentType("naqd"); setCustomerName(""); setCustomerPhone(""); setDueDate("") }}
              style={{ width: "100%", marginTop: 8, padding: "9px", background: "transparent", border: "1px solid #e5e7ef", borderRadius: 12, color: "#64748b", cursor: "pointer", fontWeight: 700, fontSize: 13 }}
            >
              Savatni tozalash
            </button>
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 768px) {
          .hamburger { display: block !important; }
        }
      `}</style>
    </div>
  )
}

const qarzInp: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box" as const,
  borderRadius: 9,
  border: "1px solid #fca5a5",
  padding: "8px 10px",
  background: "#fff",
  outline: "none",
  fontSize: 13,
}

const qtyBtnStyle: React.CSSProperties = {
  width: 28,
  height: 28,
  borderRadius: 8,
  border: "1px solid #e5e7ef",
  background: "#f8fafc",
  cursor: "pointer",
  fontWeight: 900,
  fontSize: 16,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
}
