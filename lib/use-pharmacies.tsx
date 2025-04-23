"use client"

import type React from "react"

import { useState, useEffect, createContext, useContext } from "react"

type Pharmacy = {
  id: string
  name: string
  address: string
  phone: string
}

type PharmaciesContextType = {
  pharmacies: Pharmacy[]
  activePharmacy: Pharmacy | null
  setActivePharmacy: (pharmacy: Pharmacy) => void
  addPharmacy: (pharmacy: Pharmacy) => void
  updatePharmacy: (pharmacy: Pharmacy) => void
  deletePharmacy: (id: string) => void
}

// Initial sample pharmacies
const initialPharmacies: Pharmacy[] = [
  {
    id: "pharmacy-1",
    name: "Main Street Pharmacy",
    address: "123 Main St, Nairobi",
    phone: "020-123-4567",
  },
  {
    id: "pharmacy-2",
    name: "Westlands Health Center",
    address: "45 Westlands Rd, Nairobi",
    phone: "020-987-6543",
  },
  {
    id: "pharmacy-3",
    name: "Mombasa Road Pharmacy",
    address: "78 Mombasa Rd, Nairobi",
    phone: "020-555-7890",
  },
]

const PharmaciesContext = createContext<PharmaciesContextType>({
  pharmacies: [],
  activePharmacy: null,
  setActivePharmacy: () => {},
  addPharmacy: () => {},
  updatePharmacy: () => {},
  deletePharmacy: () => {},
})

export function PharmaciesProvider({ children }: { children: React.ReactNode }) {
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>(() => {
    // Try to load from localStorage if available
    if (typeof window !== "undefined") {
      const savedPharmacies = localStorage.getItem("pharmacy-locations")
      return savedPharmacies ? JSON.parse(savedPharmacies) : initialPharmacies
    }
    return initialPharmacies
  })

  const [activePharmacy, setActivePharmacy] = useState<Pharmacy | null>(() => {
    // Try to load active pharmacy from localStorage
    if (typeof window !== "undefined") {
      const savedActivePharmacy = localStorage.getItem("active-pharmacy")
      if (savedActivePharmacy) {
        return JSON.parse(savedActivePharmacy)
      }
    }
    return pharmacies.length > 0 ? pharmacies[0] : null
  })

  // Save to localStorage whenever pharmacies change
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("pharmacy-locations", JSON.stringify(pharmacies))
    }
  }, [pharmacies])

  // Save active pharmacy to localStorage
  useEffect(() => {
    if (typeof window !== "undefined" && activePharmacy) {
      localStorage.setItem("active-pharmacy", JSON.stringify(activePharmacy))
    }
  }, [activePharmacy])

  const addPharmacy = (pharmacy: Pharmacy) => {
    setPharmacies((prev) => [...prev, pharmacy])
  }

  const updatePharmacy = (pharmacy: Pharmacy) => {
    setPharmacies((prev) => prev.map((p) => (p.id === pharmacy.id ? pharmacy : p)))

    // Update active pharmacy if it's the one being updated
    if (activePharmacy && activePharmacy.id === pharmacy.id) {
      setActivePharmacy(pharmacy)
    }
  }

  const deletePharmacy = (id: string) => {
    setPharmacies((prev) => prev.filter((p) => p.id !== id))

    // If active pharmacy is deleted, set first available as active
    if (activePharmacy && activePharmacy.id === id) {
      const remaining = pharmacies.filter((p) => p.id !== id)
      setActivePharmacy(remaining.length > 0 ? remaining[0] : null)
    }
  }

  return (
    <PharmaciesContext.Provider
      value={{
        pharmacies,
        activePharmacy,
        setActivePharmacy,
        addPharmacy,
        updatePharmacy,
        deletePharmacy,
      }}
    >
      {children}
    </PharmaciesContext.Provider>
  )
}

export function usePharmacies() {
  return useContext(PharmaciesContext)
}
