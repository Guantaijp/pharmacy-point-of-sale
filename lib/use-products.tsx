"use client"

import type React from "react"

import { useState, useEffect, createContext, useContext } from "react"
import { products as initialProducts } from "@/lib/data"

type Product = {
  id: string
  name: string
  description: string
  price: number
  category: string
  stock: number
  requiresPrescription: boolean
}

type ProductsContextType = {
  products: Product[]
  categories: string[]
  addProduct: (product: Product) => void
  addProducts: (products: Product[]) => void
  updateProduct: (product: Product) => void
  deleteProduct: (id: string) => void
}

const ProductsContext = createContext<ProductsContextType>({
  products: [],
  categories: [],
  addProduct: () => {},
  addProducts: () => {},
  updateProduct: () => {},
  deleteProduct: () => {},
})

export function ProductsProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>(() => {
    // Try to load from localStorage if available
    if (typeof window !== "undefined") {
      const savedProducts = localStorage.getItem("pharmacy-products")
      return savedProducts ? JSON.parse(savedProducts) : initialProducts
    }
    return initialProducts
  })

  // Extract unique categories
  const categories = Array.from(new Set(products.map((p) => p.category)))

  // Save to localStorage whenever products change
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("pharmacy-products", JSON.stringify(products))
    }
  }, [products])

  const addProduct = (product: Product) => {
    setProducts((prev) => {
      // Check if product with this ID already exists
      const exists = prev.some((p) => p.id === product.id)
      if (exists) {
        // Update existing product
        return prev.map((p) => (p.id === product.id ? product : p))
      } else {
        // Add new product
        return [...prev, product]
      }
    })
  }

  const addProducts = (newProducts: Product[]) => {
    setProducts((prev) => {
      const updatedProducts = [...prev]

      newProducts.forEach((newProduct) => {
        const existingIndex = updatedProducts.findIndex((p) => p.id === newProduct.id)
        if (existingIndex >= 0) {
          // Update existing product
          updatedProducts[existingIndex] = newProduct
        } else {
          // Add new product
          updatedProducts.push(newProduct)
        }
      })

      return updatedProducts
    })
  }

  const updateProduct = (product: Product) => {
    setProducts((prev) => prev.map((p) => (p.id === product.id ? product : p)))
  }

  const deleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id))
  }

  return (
    <ProductsContext.Provider
      value={{
        products,
        categories,
        addProduct,
        addProducts,
        updateProduct,
        deleteProduct,
      }}
    >
      {children}
    </ProductsContext.Provider>
  )
}

export function useProducts() {
  return useContext(ProductsContext)
}
