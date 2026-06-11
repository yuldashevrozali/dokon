import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Debt from '@/lib/models/Debt'

export async function GET() {
  try {
    await dbConnect()
    const debts = await Debt.find({}).sort({ createdAt: -1 })
    return NextResponse.json(debts)
  } catch (error) {
    console.error('Error fetching debts:', error)
    return NextResponse.json({ error: 'Failed to fetch debts' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect()
    const body = await request.json()
    const debt = new Debt({ ...body, paidAmount: 0 })
    await debt.save()
    return NextResponse.json(debt, { status: 201 })
  } catch (error) {
    console.error('Error creating debt:', error)
    return NextResponse.json({ error: 'Failed to create debt' }, { status: 500 })
  }
}
