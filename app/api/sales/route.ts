import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Sale from '@/lib/models/Sale'
import Product from '@/lib/models/Product'
import Debt from '@/lib/models/Debt'

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

    const sale = new Sale(body)
    await sale.save()

    // Mahsulot qoldig'ini kamaytirish
    await Product.findByIdAndUpdate(body.productId, {
      $inc: { stock: -body.quantity },
      updatedAt: new Date(),
    })

    // Agar qarz bo'lsa — avtomatik Debt yozuvi yaratish
    if (body.paymentType === 'qarz') {
      const productNames: string[] = body.productNames ?? [body.productName]
      await Debt.create({
        customerName: body.customerName || 'Noma\'lum',
        phone: body.customerPhone || undefined,
        amount: body.total,
        paidAmount: 0,
        note: `Savdodan: ${productNames.join(', ')}`,
        dueDate: body.dueDate || undefined,
        saleId: String(sale._id),
      })
    }

    return NextResponse.json(sale, { status: 201 })
  } catch (error) {
    console.error('Error creating sale:', error)
    return NextResponse.json({ error: 'Failed to create sale' }, { status: 500 })
  }
}
