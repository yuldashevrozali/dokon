import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import KassaTransaction from '@/lib/models/KassaTransaction'

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await dbConnect()
    await KassaTransaction.findByIdAndDelete(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Kassa DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}
