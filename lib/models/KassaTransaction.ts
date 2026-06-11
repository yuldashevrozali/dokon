import mongoose from 'mongoose'

export type KassaTxType = 'expense' | 'withdrawal' | 'deposit'

export interface IKassaTransaction {
  _id?: string
  type: KassaTxType
  category: string
  amount: number
  description: string
  createdAt?: Date
}

const schema = new mongoose.Schema<IKassaTransaction>({
  type: { type: String, required: true, enum: ['expense', 'withdrawal', 'deposit'] },
  category: { type: String, required: true },
  amount: { type: Number, required: true },
  description: { type: String, required: true },
}, { timestamps: { createdAt: true, updatedAt: false } })

export default mongoose.models.KassaTransaction ||
  mongoose.model<IKassaTransaction>('KassaTransaction', schema)
