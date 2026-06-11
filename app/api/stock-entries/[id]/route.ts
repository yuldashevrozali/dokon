import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import StockEntry from '@/lib/models/StockEntry'
import Product from '@/lib/models/Product'

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await dbConnect()
    const entry = await StockEntry.findByIdAndDelete(id)
    if (!entry) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Qoliqni qaytarish
    await Product.findByIdAndUpdate(entry.productId, {
      $inc: { stock: -entry.quantity },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting stock entry:', error)
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}
