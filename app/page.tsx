"use client"
import { useState } from "react"
import { PharmacyPOS } from "@/components/pharmacy-pos"
import { ThemeProvider } from "@/components/theme-provider"
import { ProductsProvider } from "@/lib/use-products"
import { SalesProvider } from "@/lib/use-sales"
import { PharmaciesProvider } from "@/lib/use-pharmacies"
import { PharmacySelector } from "@/components/pharmacy-selector"
import { Dashboard } from "@/components/dashboard"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { UserRole } from "@/lib/types"

export default function Home() {
  const [activeTab, setActiveTab] = useState<"pos" | "dashboard" | "admin">("pos")
  // In a real app, this would come from authentication
  const userRole: UserRole = "admin" // Options: "admin", "manager", "staff"

  return (
    <ThemeProvider attribute="class" defaultTheme="light">
      <PharmaciesProvider>
        <ProductsProvider>
          <SalesProvider>
            <main className="min-h-screen bg-background">
              <div className="container mx-auto p-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                  <h1 className="text-2xl font-bold text-emerald-700 mb-4 md:mb-0">Pharmacy Management System</h1>
                  <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                    <PharmacySelector />
                    {userRole === "admin" && (
                      <Tabs
                        value={activeTab}
                        onValueChange={(value) => setActiveTab(value as any)}
                        className="w-full sm:w-auto"
                      >
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="pos">POS System</TabsTrigger>
                          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                        </TabsList>
                      </Tabs>
                    )}
                  </div>
                </div>

                {activeTab === "pos" ? <PharmacyPOS /> : <Dashboard />}
              </div>
            </main>
          </SalesProvider>
        </ProductsProvider>
      </PharmaciesProvider>
    </ThemeProvider>
  )
}
