import { NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Sale from '@/lib/models/Sale'

export async function GET() {
  try {
    await dbConnect()

    const now = new Date()

    const todayStart = new Date(now)
    todayStart.setHours(0, 0, 0, 0)

    const weekStart = new Date(now)
    const wd = weekStart.getDay()
    weekStart.setDate(weekStart.getDate() - (wd === 0 ? 6 : wd - 1))
    weekStart.setHours(0, 0, 0, 0)

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    const allSales = await Sale.find({}).sort({ timestamp: 1 }).lean()

    function statsFor(list: typeof allSales) {
      return {
        total: list.reduce((s, x) => s + x.total, 0),
        profit: list.reduce((s, x) => s + x.profit, 0),
        count: list.length,
      }
    }

    const todaySales = allSales.filter(s => new Date(s.timestamp) >= todayStart)
    const weekSales = allSales.filter(s => new Date(s.timestamp) >= weekStart)
    const monthSales = allSales.filter(s => new Date(s.timestamp) >= monthStart)

    // So'nggi 30 kun kunlik statistika
    const dailyMap = new Map<string, { total: number; profit: number; count: number }>()
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      dailyMap.set(d.toISOString().slice(0, 10), { total: 0, profit: 0, count: 0 })
    }
    for (const s of allSales) {
      const key = new Date(s.timestamp).toISOString().slice(0, 10)
      const entry = dailyMap.get(key)
      if (entry) {
        entry.total += s.total
        entry.profit += s.profit
        entry.count += 1
      }
    }

    // TOP mahsulotlar
    const productMap = new Map<string, { name: string; quantity: number; revenue: number; profit: number }>()
    for (const s of allSales) {
      if (!productMap.has(s.productName)) {
        productMap.set(s.productName, { name: s.productName, quantity: 0, revenue: 0, profit: 0 })
      }
      const p = productMap.get(s.productName)!
      p.quantity += s.quantity
      p.revenue += s.total
      p.profit += s.profit
    }
    const topProducts = Array.from(productMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)

    return NextResponse.json({
      periodStats: {
        today: statsFor(todaySales),
        week: statsFor(weekSales),
        month: statsFor(monthSales),
        all: statsFor(allSales),
      },
      dailyStats: Array.from(dailyMap.entries()).map(([date, s]) => ({ date, ...s })),
      topProducts,
    })
  } catch (error) {
    console.error('Hisobot API error:', error)
    return NextResponse.json({ error: 'Failed to fetch report data' }, { status: 500 })
  }
}
