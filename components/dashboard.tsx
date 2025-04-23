"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { usePharmacies } from "@/lib/use-pharmacies"
import { useSales } from "@/lib/use-sales"
import { formatCurrency } from "@/lib/utils"
import { format, subDays, isAfter, isBefore, isEqual } from "date-fns"
import { CalendarIcon, Download } from "lucide-react"

export function Dashboard() {
  const { pharmacies } = usePharmacies()
  const { sales } = useSales()
  const [selectedPharmacy, setSelectedPharmacy] = useState<string>("all")
  const [dateRange, setDateRange] = useState<{
    from: Date
    to: Date
  }>({
    from: subDays(new Date(), 30),
    to: new Date(),
  })
  const [activeTab, setActiveTab] = useState("overview")

  // Filter sales based on selected pharmacy and date range
  const filteredSales = sales.filter((sale) => {
    const matchesPharmacy = selectedPharmacy === "all" || sale.pharmacyId === selectedPharmacy
    const saleDate = new Date(sale.date)
    const isInDateRange =
      (isAfter(saleDate, dateRange.from) || isEqual(saleDate, dateRange.from)) &&
      (isBefore(saleDate, dateRange.to) || isEqual(saleDate, dateRange.to))
    return matchesPharmacy && isInDateRange
  })

  // Calculate total sales
  const totalSales = filteredSales.reduce((sum, sale) => sum + sale.total, 0)
  const totalTransactions = filteredSales.length
  const averageTransactionValue = totalTransactions > 0 ? totalSales / totalTransactions : 0

  // Group sales by pharmacy
  const salesByPharmacy = pharmacies.map((pharmacy) => {
    const pharmacySales = filteredSales.filter((sale) => sale.pharmacyId === pharmacy.id)
    const total = pharmacySales.reduce((sum, sale) => sum + sale.total, 0)
    return {
      id: pharmacy.id,
      name: pharmacy.name,
      transactions: pharmacySales.length,
      total,
    }
  })

  // Get top selling products
  const productSales: Record<string, { name: string; quantity: number; revenue: number }> = {}
  filteredSales.forEach((sale) => {
    sale.items.forEach((item) => {
      if (!productSales[item.productId]) {
        productSales[item.productId] = {
          name: item.productName,
          quantity: 0,
          revenue: 0,
        }
      }
      productSales[item.productId].quantity += item.quantity
      productSales[item.productId].revenue += item.total
    })
  })

  const topProducts = Object.values(productSales)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10)

  // Export sales data as CSV
  const exportSalesData = () => {
    const headers = "Date,Transaction ID,Pharmacy,Items,Subtotal,Tax,Total"
    const rows = filteredSales.map((sale) => {
      const pharmacy = pharmacies.find((p) => p.id === sale.pharmacyId)?.name || "Unknown"
      const itemCount = sale.items.reduce((sum, item) => sum + item.quantity, 0)
      return `${new Date(sale.date).toLocaleDateString()},${sale.id},${pharmacy},${itemCount},${sale.subtotal},${sale.tax},${sale.total}`
    })
    const csv = [headers, ...rows].join("\n")

    // Create download link
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `pharmacy_sales_${format(dateRange.from, "yyyy-MM-dd")}_to_${format(dateRange.to, "yyyy-MM-dd")}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <CardTitle className="text-xl">Sales Dashboard</CardTitle>
              <CardDescription>View and analyze sales across all pharmacies</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 mt-4 md:mt-0">
              <Select value={selectedPharmacy} onValueChange={setSelectedPharmacy}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select pharmacy" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Pharmacies</SelectItem>
                  {pharmacies.map((pharmacy) => (
                    <SelectItem key={pharmacy.id} value={pharmacy.id}>
                      {pharmacy.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex items-center">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-[280px] justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                          </>
                        ) : (
                          format(dateRange.from, "LLL dd, y")
                        )
                      ) : (
                        <span>Pick a date range</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={dateRange.from}
                      selected={dateRange}
                      onSelect={(range) => range && setDateRange(range)}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <Button variant="outline" onClick={exportSalesData}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="by-pharmacy">By Pharmacy</TabsTrigger>
              <TabsTrigger value="by-product">By Product</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(totalSales)}</div>
                    <p className="text-xs text-muted-foreground">
                      For period {format(dateRange.from, "MMM d, yyyy")} - {format(dateRange.to, "MMM d, yyyy")}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Transactions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{totalTransactions}</div>
                    <p className="text-xs text-muted-foreground">
                      For period {format(dateRange.from, "MMM d, yyyy")} - {format(dateRange.to, "MMM d, yyyy")}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Average Sale</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(averageTransactionValue)}</div>
                    <p className="text-xs text-muted-foreground">
                      For period {format(dateRange.from, "MMM d, yyyy")} - {format(dateRange.to, "MMM d, yyyy")}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recent Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Transaction ID</TableHead>
                          <TableHead>Pharmacy</TableHead>
                          <TableHead>Items</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredSales.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                              No sales data available for the selected period.
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredSales
                            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                            .slice(0, 10)
                            .map((sale) => (
                              <TableRow key={sale.id}>
                                <TableCell>{new Date(sale.date).toLocaleDateString()}</TableCell>
                                <TableCell>{sale.id}</TableCell>
                                <TableCell>
                                  {pharmacies.find((p) => p.id === sale.pharmacyId)?.name || "Unknown"}
                                </TableCell>
                                <TableCell>{sale.items.reduce((sum, item) => sum + item.quantity, 0)}</TableCell>
                                <TableCell className="text-right">{formatCurrency(sale.total)}</TableCell>
                              </TableRow>
                            ))
                        )}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="by-pharmacy" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Sales by Pharmacy</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Pharmacy</TableHead>
                        <TableHead>Transactions</TableHead>
                        <TableHead className="text-right">Total Sales</TableHead>
                        <TableHead className="text-right">% of Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {salesByPharmacy.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                            No sales data available for the selected period.
                          </TableCell>
                        </TableRow>
                      ) : (
                        salesByPharmacy
                          .sort((a, b) => b.total - a.total)
                          .map((pharmacy) => (
                            <TableRow key={pharmacy.id}>
                              <TableCell className="font-medium">{pharmacy.name}</TableCell>
                              <TableCell>{pharmacy.transactions}</TableCell>
                              <TableCell className="text-right">{formatCurrency(pharmacy.total)}</TableCell>
                              <TableCell className="text-right">
                                {totalSales > 0 ? ((pharmacy.total / totalSales) * 100).toFixed(1) + "%" : "0%"}
                              </TableCell>
                            </TableRow>
                          ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="by-product" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Top Selling Products</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Quantity Sold</TableHead>
                        <TableHead className="text-right">Revenue</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topProducts.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                            No sales data available for the selected period.
                          </TableCell>
                        </TableRow>
                      ) : (
                        topProducts.map((product, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{product.name}</TableCell>
                            <TableCell>{product.quantity}</TableCell>
                            <TableCell className="text-right">{formatCurrency(product.revenue)}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
