import { NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Sale from '@/lib/models/Sale'
import Product from '@/lib/models/Product'

export async function GET() {
  try {
    await dbConnect()

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const [todaySales, allProducts, recentSales] = await Promise.all([
      Sale.find({ timestamp: { $gte: todayStart } }),
      Product.find({}),
      Sale.find({}).sort({ timestamp: -1 }).limit(10),
    ])

    const todayTotal = todaySales.reduce((s, x) => s + x.total, 0)
    const todayProfit = todaySales.reduce((s, x) => s + x.profit, 0)

    const totalStock = allProducts.reduce((s, p) => s + p.stock, 0)
    const lowStockProducts = allProducts
      .filter((p) => p.stock <= p.lowStockLimit && p.stock > 0)
      .sort((a, b) => a.stock - b.stock)
      .slice(0, 6)
    const outOfStock = allProducts.filter((p) => p.stock <= 0).length

    return NextResponse.json({
      todayTotal,
      todayProfit,
      todaySalesCount: todaySales.length,
      totalProducts: allProducts.length,
      totalStock,
      outOfStock,
      lowStockProducts,
      recentSales,
    })
  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 })
  }
}
