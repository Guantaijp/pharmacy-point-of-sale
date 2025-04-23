"use client"

import type React from "react"

import { useState, useEffect, createContext, useContext } from "react"

type SaleItem = {
  productId: string
  productName: string
  quantity: number
  unitPrice: number
  total: number
}

type Sale = {
  id: string
  pharmacyId: string
  items: SaleItem[]
  subtotal: number
  tax: number
  total: number
  date: Date | string
  paymentMethod: string
}

type SalesContextType = {
  sales: Sale[]
  addSale: (sale: Sale) => void
  getSalesByPharmacy: (pharmacyId: string) => Sale[]
}

const SalesContext = createContext<SalesContextType>({
  sales: [],
  addSale: () => {},
  getSalesByPharmacy: () => [],
})

export function SalesProvider({ children }: { children: React.ReactNode }) {
  const [sales, setSales] = useState<Sale[]>(() => {
    // Try to load from localStorage if available
    if (typeof window !== "undefined") {
      const savedSales = localStorage.getItem("pharmacy-sales")
      return savedSales ? JSON.parse(savedSales) : []
    }
    return []
  })

  // Save to localStorage whenever sales change
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("pharmacy-sales", JSON.stringify(sales))
    }
  }, [sales])

  const addSale = (sale: Sale) => {
    setSales((prev) => [...prev, sale])
  }

  const getSalesByPharmacy = (pharmacyId: string) => {
    return sales.filter((sale) => sale.pharmacyId === pharmacyId)
  }

  return (
    <SalesContext.Provider
      value={{
        sales,
        addSale,
        getSalesByPharmacy,
      }}
    >
      {children}
    </SalesContext.Provider>
  )
}

export function useSales() {
  return useContext(SalesContext)
}
