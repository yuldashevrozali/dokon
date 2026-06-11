import mongoose from 'mongoose'

export interface IDebt {
  _id?: string
  customerName: string
  phone?: string
  amount: number
  paidAmount: number
  note?: string
  dueDate?: Date
  saleId?: string
  createdAt?: Date
  updatedAt?: Date
}

const DebtSchema = new mongoose.Schema<IDebt>({
  customerName: { type: String, required: true },
  phone: { type: String },
  amount: { type: Number, required: true },
  paidAmount: { type: Number, required: true, default: 0 },
  note: { type: String },
  dueDate: { type: Date },
  saleId: { type: String },
}, {
  timestamps: true,
})

export default mongoose.models.Debt || mongoose.model<IDebt>('Debt', DebtSchema)
