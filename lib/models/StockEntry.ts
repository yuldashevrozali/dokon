import mongoose from 'mongoose'

export interface IStockEntry {
  _id?: string
  productId: string
  productName: string
  quantity: number
  unit: string
  costPrice: number
  supplierName?: string
  note?: string
  createdAt?: Date
}

const StockEntrySchema = new mongoose.Schema<IStockEntry>({
  productId: { type: String, required: true },
  productName: { type: String, required: true },
  quantity: { type: Number, required: true },
  unit: { type: String, required: true },
  costPrice: { type: Number, required: true },
  supplierName: { type: String },
  note: { type: String },
}, { timestamps: { createdAt: true, updatedAt: false } })

export default mongoose.models.StockEntry || mongoose.model<IStockEntry>('StockEntry', StockEntrySchema)
