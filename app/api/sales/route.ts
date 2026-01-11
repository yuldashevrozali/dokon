import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Sale from '@/lib/models/Sale'
import Product from '@/lib/models/Product'

export async function GET() {
  try {
    await dbConnect()
    const sales = await Sale.find({}).sort({ timestamp: -1 })
    return NextResponse.json(sales)
  } catch (error) {
    console.error('Error fetching sales:', error)
    return NextResponse.json({ error: 'Failed to fetch sales' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect()
    const body = await request.json()

    // Record the sale
    const sale = new Sale(body)
    await sale.save()

    // Update product stock
    await Product.findByIdAndUpdate(body.productId, {
      $inc: { stock: -body.quantity },
      updatedAt: new Date()
    })

    return NextResponse.json(sale, { status: 201 })
  } catch (error) {
    console.error('Error creating sale:', error)
    return NextResponse.json({ error: 'Failed to create sale' }, { status: 500 })
  }
}