export type Product = {
  id: string
  name: string
  description: string
  price: number
  category: string
  stock: number
  requiresPrescription: boolean
}

export type CartItem = {
  product: Product
  quantity: number
}

export type UserRole = "admin" | "manager" | "staff"
