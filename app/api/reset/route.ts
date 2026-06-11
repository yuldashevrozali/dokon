import { NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Sale from '@/lib/models/Sale'
import StockEntry from '@/lib/models/StockEntry'
import KassaTransaction from '@/lib/models/KassaTransaction'
import Debt from '@/lib/models/Debt'
import Product from '@/lib/models/Product'

export async function POST() {
  try {
    await dbConnect()

    await Promise.all([
      Sale.deleteMany({}),
      StockEntry.deleteMany({}),
      KassaTransaction.deleteMany({}),
      Debt.deleteMany({}),
      Product.updateMany({}, { $set: { stock: 0 } }),
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Reset error:', error)
    return NextResponse.json({ error: 'Reset failed' }, { status: 500 })
  }
}
