import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Debt from '@/lib/models/Debt'
import KassaTransaction from '@/lib/models/KassaTransaction'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await dbConnect()
    const body = await request.json()

    const existing = await Debt.findById(id)
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Yangi to'lov miqdori — kassaga qo'shiladi
    const newPaidAmount = body.paidAmount ?? existing.paidAmount
    const paymentDelta = newPaidAmount - existing.paidAmount

    const debt = await Debt.findByIdAndUpdate(id, body, { new: true })

    // To'lov bo'lsa — kassaga kirim sifatida yozish
    if (paymentDelta > 0) {
      await KassaTransaction.create({
        type: 'deposit',
        category: 'qarz_tolandi',
        amount: paymentDelta,
        description: `Qarz to'lovi: ${existing.customerName}${existing.note ? ' (' + existing.note + ')' : ''}`,
      })
    }

    return NextResponse.json(debt)
  } catch (error) {
    console.error('Error updating debt:', error)
    return NextResponse.json({ error: 'Failed to update debt' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await dbConnect()
    await Debt.findByIdAndDelete(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting debt:', error)
    return NextResponse.json({ error: 'Failed to delete debt' }, { status: 500 })
  }
}
