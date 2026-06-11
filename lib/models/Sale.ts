import mongoose from 'mongoose'
import { Unit } from './Product'

export type PaymentType = 'naqd' | 'karta' | 'qarz'

export interface ISale {
  _id?: string
  productId: string
  productName: string
  quantity: number
  unit: Unit
  sellPrice: number
  costPrice: number
  total: number
  profit: number
  paymentType: PaymentType
  customerName?: string
  customerPhone?: string
  timestamp: Date
}

const SaleSchema = new mongoose.Schema<ISale>({
  productId: { type: String, required: true },
  productName: { type: String, required: true },
  quantity: { type: Number, required: true },
  unit: { type: String, required: true, enum: ['dona', 'kg', 'litr', 'quti'] },
  sellPrice: { type: Number, required: true },
  costPrice: { type: Number, required: true },
  total: { type: Number, required: true },
  profit: { type: Number, required: true },
  paymentType: { type: String, required: true, enum: ['naqd', 'karta', 'qarz'], default: 'naqd' },
  customerName: { type: String },
  customerPhone: { type: String },
}, {
  timestamps: { createdAt: 'timestamp', updatedAt: false },
})

export default mongoose.models.Sale || mongoose.model<ISale>('Sale', SaleSchema)
