import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Sale from '@/lib/models/Sale'
import StockEntry from '@/lib/models/StockEntry'
import KassaTransaction from '@/lib/models/KassaTransaction'

export async function GET() {
  try {
    await dbConnect()

    const [sales, stockEntries, manualTx] = await Promise.all([
      Sale.find({}).sort({ timestamp: -1 }).lean(),
      StockEntry.find({}).sort({ createdAt: -1 }).lean(),
      KassaTransaction.find({}).sort({ createdAt: -1 }).lean(),
    ])

    // Faqat naqd/karta savdolar kassa kirimiga kiradi, qarz emas
    const cashSales = sales.filter((s: any) => !s.paymentType || s.paymentType !== 'qarz')
    const totalIncome = cashSales.reduce((s: number, x: any) => s + x.total, 0)
    const totalDeposits = manualTx.filter(t => t.type === 'deposit').reduce((s, t) => s + t.amount, 0)
    const totalStockExpense = stockEntries.reduce((s, x) => s + x.costPrice * x.quantity, 0)
    const totalOtherExpense = manualTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
    const totalWithdrawals = manualTx.filter(t => t.type === 'withdrawal').reduce((s, t) => s + t.amount, 0)
    const balance = totalIncome + totalDeposits - totalStockExpense - totalOtherExpense - totalWithdrawals

    const today = new Date(); today.setHours(0, 0, 0, 0)
    const todayIncome = cashSales.filter((s: any) => new Date(s.timestamp) >= today).reduce((s: number, x: any) => s + x.total, 0)
      + manualTx.filter(t => t.type === 'deposit' && new Date(t.createdAt!) >= today).reduce((s, t) => s + t.amount, 0)
    const todayStockExp = stockEntries.filter(e => new Date(e.createdAt) >= today).reduce((s, x) => s + x.costPrice * x.quantity, 0)
    const todayManualExp = manualTx.filter(t => t.type !== 'deposit' && new Date(t.createdAt!) >= today).reduce((s, t) => s + t.amount, 0)
    const todayExpense = todayStockExp + todayManualExp

    type TxRow = {
      _id: string
      type: 'income' | 'expense' | 'withdrawal' | 'deposit'
      source: 'sale' | 'stock' | 'manual'
      category: string; description: string; amount: number; date: string
    }

    const history: TxRow[] = [
      ...sales.map((s: any) => ({
        _id: String(s._id),
        type: (s.paymentType === 'qarz' ? 'expense' : 'income') as 'income' | 'expense',
        source: 'sale' as const,
        category: s.paymentType === 'qarz' ? 'qarz_savdo' : 'savdo',
        description: s.paymentType === 'qarz'
          ? `Qarz savdo: ${s.productName} (${s.quantity} ${s.unit}) — ${s.customerName || 'Noma\'lum'}`
          : `Savdo: ${s.productName} (${s.quantity} ${s.unit})`,
        amount: s.total, date: String(s.timestamp),
      })),
      ...stockEntries.map(e => ({
        _id: String(e._id), type: 'expense' as const, source: 'stock' as const,
        category: 'mahsulot',
        description: `Mahsulot kirim: ${e.productName} (${e.quantity} ${e.unit})${e.supplierName ? ' — ' + e.supplierName : ''}`,
        amount: e.costPrice * e.quantity, date: String(e.createdAt),
      })),
      ...manualTx.map(t => ({
        _id: String(t._id),
        type: t.type as 'expense' | 'withdrawal' | 'deposit',
        source: 'manual' as const,
        category: t.category, description: t.description,
        amount: t.amount, date: String(t.createdAt),
      })),
    ]

    history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return NextResponse.json({
      balance, totalIncome, totalDeposits, totalStockExpense, totalOtherExpense, totalWithdrawals,
      todayIncome, todayExpense,
      history: history.slice(0, 200),
    })
  } catch (error) {
    console.error('Kassa GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch kassa data' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect()
    const body = await request.json()
    const tx = new KassaTransaction(body)
    await tx.save()
    return NextResponse.json(tx, { status: 201 })
  } catch (error) {
    console.error('Kassa POST error:', error)
    return NextResponse.json({ error: 'Failed to save transaction' }, { status: 500 })
  }
}
