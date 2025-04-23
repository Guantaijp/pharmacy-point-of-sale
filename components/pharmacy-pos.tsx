"use client"

import { useState } from "react"
import { Search, ShoppingCart, Plus, Minus, Printer, X, Database } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { ProductManagement } from "@/components/product-management"
import { useProducts } from "@/lib/use-products"
import { useSales } from "@/lib/use-sales"
import { usePharmacies } from "@/lib/use-pharmacies"
import { formatCurrency } from "@/lib/utils"
import type { Product, CartItem } from "@/lib/types"

export function PharmacyPOS() {
  const { products, categories } = useProducts()
  const { addSale } = useSales()
  const { activePharmacy } = usePharmacies()

  const [searchTerm, setSearchTerm] = useState("")
  const [activeCategory, setActiveCategory] = useState("all")
  const [cart, setCart] = useState<CartItem[]>([])
  const [showReceipt, setShowReceipt] = useState(false)
  const [showProductManagement, setShowProductManagement] = useState(false)
  const [activeTab, setActiveTab] = useState<"pos" | "products">("pos")
  const [receiptData, setReceiptData] = useState<{
    items: CartItem[]
    subtotal: number
    tax: number
    total: number
    date: Date
    transactionId: string
    pharmacyId: string
    pharmacyName: string
  } | null>(null)

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = activeCategory === "all" || product.category === activeCategory
    return matchesSearch && matchesCategory
  })

  const addToCart = (product: Product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.product.id === product.id)
      if (existingItem) {
        return prevCart.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item,
        )
      } else {
        return [...prevCart, { product, quantity: 1 }]
      }
    })
  }

  const removeFromCart = (productId: string) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.product.id === productId)
      if (existingItem && existingItem.quantity > 1) {
        return prevCart.map((item) => (item.product.id === productId ? { ...item, quantity: item.quantity - 1 } : item))
      } else {
        return prevCart.filter((item) => item.product.id !== productId)
      }
    })
  }

  const deleteFromCart = (productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.product.id !== productId))
  }

  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
  }

  const calculateTax = (subtotal: number) => {
    return subtotal * 0.07 // 7% tax rate
  }

  const calculateTotal = (subtotal: number, tax: number) => {
    return subtotal + tax
  }

  const handleCheckout = () => {
    if (cart.length === 0 || !activePharmacy) return

    const subtotal = calculateSubtotal()
    const tax = calculateTax(subtotal)
    const total = calculateTotal(subtotal, tax)
    const date = new Date()
    const transactionId = `RX-${Math.floor(100000 + Math.random() * 900000)}`

    // Create receipt data
    const receipt = {
      items: [...cart],
      subtotal,
      tax,
      total,
      date,
      transactionId,
      pharmacyId: activePharmacy.id,
      pharmacyName: activePharmacy.name,
    }

    setReceiptData(receipt)

    // Add to sales history
    addSale({
      id: transactionId,
      pharmacyId: activePharmacy.id,
      items: cart.map((item) => ({
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        unitPrice: item.product.price,
        total: item.product.price * item.quantity,
      })),
      subtotal,
      tax,
      total,
      date,
      paymentMethod: "cash", // Default payment method
    })

    setShowReceipt(true)
    setCart([])
  }

  const printReceipt = () => {
    window.print()
  }

  if (!activePharmacy) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Select a Pharmacy</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground mb-4">Please select a pharmacy location to continue.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-emerald-700">{activePharmacy.name}</h2>
          <p className="text-sm text-muted-foreground">{activePharmacy.address}</p>
        </div>
        <div className="flex space-x-4 mt-4 md:mt-0">
          <Button
            variant={activeTab === "pos" ? "default" : "outline"}
            className={activeTab === "pos" ? "bg-emerald-600 hover:bg-emerald-700" : ""}
            onClick={() => setActiveTab("pos")}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            POS
          </Button>
          <Button
            variant={activeTab === "products" ? "default" : "outline"}
            className={activeTab === "products" ? "bg-emerald-600 hover:bg-emerald-700" : ""}
            onClick={() => setActiveTab("products")}
          >
            <Database className="h-4 w-4 mr-2" />
            Products
          </Button>
        </div>
      </div>

      {activeTab === "pos" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center mb-4">
                  <div className="relative w-full md:w-96">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search products..."
                      className="pl-8"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <Tabs defaultValue="all" className="w-full">
                  <TabsList className="w-full overflow-auto">
                    {["all", ...categories].map((category) => (
                      <TabsTrigger
                        key={category}
                        value={category}
                        onClick={() => setActiveCategory(category)}
                        className="capitalize"
                      >
                        {category}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[calc(100vh-300px)]">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {filteredProducts.map((product) => (
                      <Card key={product.id} className="overflow-hidden">
                        <CardHeader className="p-4 pb-2">
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-sm font-medium">{product.name}</CardTitle>
                            {product.requiresPrescription && (
                              <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">
                                Rx
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{product.description}</p>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                          <div className="flex justify-between items-center">
                            <p className="font-semibold">{formatCurrency(product.price)}</p>
                            <p className="text-xs text-muted-foreground">Stock: {product.stock}</p>
                          </div>
                        </CardContent>
                        <CardFooter className="p-2 bg-muted/50">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50"
                            onClick={() => addToCart(product)}
                            disabled={product.stock <= 0}
                          >
                            <Plus className="h-4 w-4 mr-1" /> Add to Cart
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="h-full flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg font-semibold flex items-center">
                    <ShoppingCart className="h-5 w-5 mr-2 text-emerald-600" />
                    Cart
                  </CardTitle>
                  <Badge variant="secondary">{cart.length} items</Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-grow overflow-auto">
                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40 text-center">
                    <ShoppingCart className="h-12 w-12 text-muted-foreground mb-2 opacity-20" />
                    <p className="text-muted-foreground">Your cart is empty</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[calc(100vh-450px)]">
                    <div className="space-y-3">
                      {cart.map((item) => (
                        <div key={item.product.id} className="flex items-center justify-between p-2 border rounded-md">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{item.product.name}</p>
                            <p className="text-sm text-muted-foreground">{formatCurrency(item.product.price)} each</p>
                          </div>
                          <div className="flex items-center space-x-2 ml-4">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => removeFromCart(item.product.id)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center">{item.quantity}</span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => addToCart(item.product)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-red-500"
                              onClick={() => deleteFromCart(item.product.id)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
              <CardFooter className="flex-col border-t pt-4">
                <div className="w-full space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatCurrency(calculateSubtotal())}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax (7%)</span>
                    <span>{formatCurrency(calculateTax(calculateSubtotal()))}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>Total</span>
                    <span>
                      {formatCurrency(calculateTotal(calculateSubtotal(), calculateTax(calculateSubtotal())))}
                    </span>
                  </div>
                </div>
                <Button
                  className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700"
                  onClick={handleCheckout}
                  disabled={cart.length === 0}
                >
                  Complete Sale
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      ) : (
        <ProductManagement />
      )}

      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Receipt</DialogTitle>
          </DialogHeader>
          {receiptData && (
            <div className="space-y-4 print:text-black">
              <div className="text-center">
                <h2 className="font-bold text-lg">{receiptData.pharmacyName}</h2>
                <p className="text-sm text-muted-foreground">{activePharmacy?.address}</p>
                <p className="text-sm text-muted-foreground">Tel: {activePharmacy?.phone}</p>
              </div>

              <div className="text-sm">
                <div className="flex justify-between">
                  <span>Transaction ID:</span>
                  <span>{receiptData.transactionId}</span>
                </div>
                <div className="flex justify-between">
                  <span>Date:</span>
                  <span>{receiptData.date.toLocaleString()}</span>
                </div>
              </div>

              <div className="border-t border-b py-2">
                <div className="grid grid-cols-12 font-semibold text-sm mb-2">
                  <div className="col-span-6">Item</div>
                  <div className="col-span-2 text-right">Price</div>
                  <div className="col-span-2 text-right">Qty</div>
                  <div className="col-span-2 text-right">Total</div>
                </div>
                {receiptData.items.map((item) => (
                  <div key={item.product.id} className="grid grid-cols-12 text-sm py-1">
                    <div className="col-span-6 truncate">{item.product.name}</div>
                    <div className="col-span-2 text-right">{formatCurrency(item.product.price)}</div>
                    <div className="col-span-2 text-right">{item.quantity}</div>
                    <div className="col-span-2 text-right">{formatCurrency(item.product.price * item.quantity)}</div>
                  </div>
                ))}
              </div>

              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(receiptData.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax (7%):</span>
                  <span>{formatCurrency(receiptData.tax)}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Total:</span>
                  <span>{formatCurrency(receiptData.total)}</span>
                </div>
              </div>

              <div className="text-center text-sm text-muted-foreground pt-4">
                <p>Thank you for your purchase!</p>
                <p>Please keep this receipt for your records.</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReceipt(false)}>
              Close
            </Button>
            <Button onClick={printReceipt} className="bg-emerald-600 hover:bg-emerald-700">
              <Printer className="h-4 w-4 mr-2" /> Print Receipt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
