import mongoose from 'mongoose'

export type Unit = "dona" | "kg" | "litr" | "quti"

export interface IProduct {
  _id?: string
  name: string
  category: string
  barcode?: string
  unit: Unit
  costPrice: number
  sellPrice: number
  stock: number
  lowStockLimit: number
  createdAt: Date
  updatedAt: Date
}

const ProductSchema = new mongoose.Schema<IProduct>({
  name: { type: String, required: true },
  category: { type: String, required: true },
  barcode: { type: String },
  unit: { type: String, required: true, enum: ["dona", "kg", "litr", "quti"] },
  costPrice: { type: Number, required: true },
  sellPrice: { type: Number, required: true },
  stock: { type: Number, required: true, default: 0 },
  lowStockLimit: { type: Number, required: true, default: 5 },
}, {
  timestamps: true,
})

export default mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema)