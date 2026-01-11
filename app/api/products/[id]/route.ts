import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Product from "@/lib/models/Product"

type Ctx = { params: Promise<{ id: string }> }

// PUT /api/products/[id]
export async function PUT(request: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params

  // id bo‘sh bo‘lsa
  if (!id) {
    return NextResponse.json({ error: "Product id is required" }, { status: 400 })
  }

  try {
    await dbConnect()

    const body = await request.json()

    const product = await Product.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    })

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    return NextResponse.json(product)
  } catch (error: any) {
    // Mongoose ObjectId xato bo‘lsa
    if (error?.name === "CastError") {
      return NextResponse.json({ error: "Invalid product id" }, { status: 400 })
    }

    console.error("Error updating product:", error)
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 })
  }
}

// DELETE /api/products/[id]
export async function DELETE(_request: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params

  if (!id) {
    return NextResponse.json({ error: "Product id is required" }, { status: 400 })
  }

  try {
    await dbConnect()

    const product = await Product.findByIdAndDelete(id)

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Product deleted" }, { status: 200 })
  } catch (error: any) {
    if (error?.name === "CastError") {
      return NextResponse.json({ error: "Invalid product id" }, { status: 400 })
    }

    console.error("Error deleting product:", error)
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 })
  }
}
