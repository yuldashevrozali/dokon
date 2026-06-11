import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import StockEntry from '@/lib/models/StockEntry'
import Product from '@/lib/models/Product'

export async function GET() {
  try {
    await dbConnect()
    const entries = await StockEntry.find({}).sort({ createdAt: -1 })
    return NextResponse.json(entries)
  } catch (error) {
    console.error('Error fetching stock entries:', error)
    return NextResponse.json({ error: 'Failed to fetch stock entries' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect()
    const body = await request.json()
    const { productId, quantity, costPrice } = body

    const entry = new StockEntry(body)
    await entry.save()

    // Mahsulot qoldig'ini oshir va narxini yangilashtir
    await Product.findByIdAndUpdate(productId, {
      $inc: { stock: quantity },
      costPrice,
      updatedAt: new Date(),
    })

    return NextResponse.json(entry, { status: 201 })
  } catch (error) {
    console.error('Error creating stock entry:', error)
    return NextResponse.json({ error: 'Failed to create stock entry' }, { status: 500 })
  }
}
