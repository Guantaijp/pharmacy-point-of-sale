"use client"

import { useState } from "react"
import { Package, Plus, Upload, Download, Trash2, FileText, AlertCircle, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useProducts } from "@/lib/use-products"
import { formatCurrency } from "@/lib/utils"

export function ProductManagement() {
  const { products, categories, addProduct, addProducts, updateProduct, deleteProduct } = useProducts()
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [showBulkImport, setShowBulkImport] = useState(false)
  const [editingProduct, setEditingProduct] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [bulkImportText, setBulkImportText] = useState("")
  const [importResult, setImportResult] = useState<{ success: number; failed: number } | null>(null)
  const [showImportSuccess, setShowImportSuccess] = useState(false)

  const [newProduct, setNewProduct] = useState({
    id: "",
    name: "",
    description: "",
    price: 0,
    category: "",
    stock: 0,
    requiresPrescription: false,
  })

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const resetNewProduct = () => {
    setNewProduct({
      id: "",
      name: "",
      description: "",
      price: 0,
      category: "",
      stock: 0,
      requiresPrescription: false,
    })
  }

  const handleAddProduct = () => {
    // Generate a unique ID if not provided
    const productToAdd = {
      ...newProduct,
      id: newProduct.id || `med-${Date.now().toString(36)}`,
      price: Number(newProduct.price),
      stock: Number(newProduct.stock),
    }

    addProduct(productToAdd)
    resetNewProduct()
    setShowAddProduct(false)
  }

  const handleEditProduct = (product: any) => {
    setEditingProduct({
      ...product,
      price: Number(product.price),
      stock: Number(product.stock),
    })
    setShowAddProduct(true)
  }

  const handleUpdateProduct = () => {
    if (editingProduct) {
      updateProduct(editingProduct)
      setEditingProduct(null)
      setShowAddProduct(false)
    }
  }

  const handleDeleteProduct = (id: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
      deleteProduct(id)
    }
  }

  const handleBulkImport = () => {
    try {
      // Parse CSV or JSON data
      let importedProducts = []
      let successCount = 0
      let failedCount = 0

      // Try to parse as JSON first
      try {
        const jsonData = JSON.parse(bulkImportText)
        if (Array.isArray(jsonData)) {
          importedProducts = jsonData
        } else {
          importedProducts = [jsonData]
        }
      } catch (e) {
        // If not JSON, try CSV format
        const lines = bulkImportText.split("\n")
        const headers = lines[0].split(",").map((h) => h.trim())

        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue

          const values = lines[i].split(",").map((v) => v.trim())
          const product: any = {}

          headers.forEach((header, index) => {
            if (header === "price" || header === "stock") {
              product[header] = Number(values[index])
            } else if (header === "requiresPrescription") {
              product[header] = values[index].toLowerCase() === "true"
            } else {
              product[header] = values[index]
            }
          })

          // Generate ID if not provided
          if (!product.id) {
            product.id = `med-${Date.now().toString(36)}-${i}`
          }

          importedProducts.push(product)
        }
      }

      // Validate and add products
      importedProducts.forEach((product) => {
        if (product.name && product.price !== undefined) {
          addProduct({
            id: product.id || `med-${Date.now().toString(36)}`,
            name: product.name,
            description: product.description || "",
            price: Number(product.price),
            category: product.category || "other",
            stock: Number(product.stock || 0),
            requiresPrescription: Boolean(product.requiresPrescription),
          })
          successCount++
        } else {
          failedCount++
        }
      })

      setImportResult({ success: successCount, failed: failedCount })
      setBulkImportText("")
      setShowBulkImport(false)
      setShowImportSuccess(true)
    } catch (error) {
      console.error("Import error:", error)
      setImportResult({ success: 0, failed: 1 })
      setShowImportSuccess(true)
    }
  }

  const handleExportProducts = () => {
    // Create CSV
    const headers = "id,name,description,price,category,stock,requiresPrescription"
    const rows = products.map(
      (p) =>
        `${p.id},${p.name.replace(/,/g, ";")},${p.description.replace(/,/g, ";")},${p.price},${p.category},${p.stock},${p.requiresPrescription}`,
    )
    const csv = [headers, ...rows].join("\n")

    // Create download link
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "pharmacy_products.csv"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getExampleImportData = () => {
    return `id,name,description,price,category,stock,requiresPrescription
med-101,Aspirin 100mg,Pain reliever,5.99,pain relief,30,false
med-102,Amoxicillin 250mg,Antibiotic,12.99,antibiotics,20,true`
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <CardTitle className="text-xl flex items-center">
                <Package className="mr-2 h-5 w-5 text-emerald-600" />
                Product Management
              </CardTitle>
              <CardDescription>Add, edit, and manage your pharmacy products</CardDescription>
            </div>
            <div className="flex space-x-2 mt-4 md:mt-0">
              <Button
                variant="outline"
                onClick={() => handleExportProducts()}
                className="text-emerald-700 border-emerald-200 hover:bg-emerald-50"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowBulkImport(true)}
                className="text-emerald-700 border-emerald-200 hover:bg-emerald-50"
              >
                <Upload className="h-4 w-4 mr-2" />
                Bulk Import
              </Button>
              <Button
                onClick={() => {
                  resetNewProduct()
                  setEditingProduct(null)
                  setShowAddProduct(true)
                }}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 relative">
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
          </div>

          <ScrollArea className="h-[calc(100vh-250px)]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Prescription</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No products found. Add some products to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-[200px]">{product.description}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {product.category}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatCurrency(product.price)}</TableCell>
                      <TableCell>
                        <span className={product.stock <= 5 ? "text-red-500 font-medium" : ""}>{product.stock}</span>
                      </TableCell>
                      <TableCell>
                        {product.requiresPrescription ? (
                          <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">
                            Required
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-emerald-100 text-emerald-800 border-emerald-200">
                            OTC
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditProduct(product)}
                            className="h-8 w-8 p-0"
                          >
                            <span className="sr-only">Edit</span>
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="h-4 w-4"
                            >
                              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                              <path d="m15 5 4 4" />
                            </svg>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteProduct(product.id)}
                            className="h-8 w-8 p-0 text-red-500"
                          >
                            <span className="sr-only">Delete</span>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Add/Edit Product Dialog */}
      <Dialog open={showAddProduct} onOpenChange={setShowAddProduct}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
            <DialogDescription>
              {editingProduct
                ? "Update the product details below."
                : "Fill in the details to add a new product to your inventory."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={editingProduct ? editingProduct.name : newProduct.name}
                onChange={(e) =>
                  editingProduct
                    ? setEditingProduct({ ...editingProduct, name: e.target.value })
                    : setNewProduct({ ...newProduct, name: e.target.value })
                }
                className="col-span-3"
                placeholder="Product name"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea
                id="description"
                value={editingProduct ? editingProduct.description : newProduct.description}
                onChange={(e) =>
                  editingProduct
                    ? setEditingProduct({ ...editingProduct, description: e.target.value })
                    : setNewProduct({ ...newProduct, description: e.target.value })
                }
                className="col-span-3"
                placeholder="Product description"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="price" className="text-right">
                Price
              </Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={editingProduct ? editingProduct.price : newProduct.price}
                onChange={(e) =>
                  editingProduct
                    ? setEditingProduct({ ...editingProduct, price: Number.parseFloat(e.target.value) })
                    : setNewProduct({ ...newProduct, price: Number.parseFloat(e.target.value) })
                }
                className="col-span-3"
                placeholder="0.00"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">
                Category
              </Label>
              <div className="col-span-3">
                <Select
                  value={editingProduct ? editingProduct.category : newProduct.category}
                  onValueChange={(value) =>
                    editingProduct
                      ? setEditingProduct({ ...editingProduct, category: value })
                      : setNewProduct({ ...newProduct, category: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="stock" className="text-right">
                Stock
              </Label>
              <Input
                id="stock"
                type="number"
                min="0"
                value={editingProduct ? editingProduct.stock : newProduct.stock}
                onChange={(e) =>
                  editingProduct
                    ? setEditingProduct({ ...editingProduct, stock: Number.parseInt(e.target.value) })
                    : setNewProduct({ ...newProduct, stock: Number.parseInt(e.target.value) })
                }
                className="col-span-3"
                placeholder="0"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="prescription" className="text-right">
                Requires Prescription
              </Label>
              <div className="flex items-center space-x-2 col-span-3">
                <Switch
                  id="prescription"
                  checked={editingProduct ? editingProduct.requiresPrescription : newProduct.requiresPrescription}
                  onCheckedChange={(checked) =>
                    editingProduct
                      ? setEditingProduct({ ...editingProduct, requiresPrescription: checked })
                      : setNewProduct({ ...newProduct, requiresPrescription: checked })
                  }
                />
                <Label htmlFor="prescription">
                  {(editingProduct ? editingProduct.requiresPrescription : newProduct.requiresPrescription)
                    ? "Yes"
                    : "No"}
                </Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddProduct(false)}>
              Cancel
            </Button>
            <Button
              onClick={editingProduct ? handleUpdateProduct : handleAddProduct}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {editingProduct ? "Update" : "Add"} Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Import Dialog */}
      <Dialog open={showBulkImport} onOpenChange={setShowBulkImport}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Bulk Import Products</DialogTitle>
            <DialogDescription>
              Paste your CSV or JSON data below to import multiple products at once.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Tabs defaultValue="csv" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="csv">CSV Format</TabsTrigger>
                <TabsTrigger value="json">JSON Format</TabsTrigger>
              </TabsList>
              <TabsContent value="csv" className="space-y-4">
                <Alert>
                  <FileText className="h-4 w-4" />
                  <AlertTitle>CSV Format</AlertTitle>
                  <AlertDescription>Use comma-separated values with headers in the first row.</AlertDescription>
                </Alert>
                <div className="bg-muted p-2 rounded-md text-xs font-mono overflow-x-auto">
                  {getExampleImportData()}
                </div>
              </TabsContent>
              <TabsContent value="json" className="space-y-4">
                <Alert>
                  <FileText className="h-4 w-4" />
                  <AlertTitle>JSON Format</AlertTitle>
                  <AlertDescription>Use an array of product objects in JSON format.</AlertDescription>
                </Alert>
                <div className="bg-muted p-2 rounded-md text-xs font-mono overflow-x-auto">
                  {`[
  {
    "id": "med-101",
    "name": "Aspirin 100mg",
    "description": "Pain reliever",
    "price": 5.99,
    "category": "pain relief",
    "stock": 30,
    "requiresPrescription": false
  },
  {
    "id": "med-102",
    "name": "Amoxicillin 250mg",
    "description": "Antibiotic",
    "price": 12.99,
    "category": "antibiotics",
    "stock": 20,
    "requiresPrescription": true
  }
]`}
                </div>
              </TabsContent>
            </Tabs>
            <Textarea
              placeholder="Paste your CSV or JSON data here..."
              className="min-h-[200px]"
              value={bulkImportText}
              onChange={(e) => setBulkImportText(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkImport(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleBulkImport}
              className="bg-emerald-600 hover:bg-emerald-700"
              disabled={!bulkImportText.trim()}
            >
              Import Products
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Result Dialog */}
      <Dialog open={showImportSuccess} onOpenChange={setShowImportSuccess}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Import Results</DialogTitle>
          </DialogHeader>
          {importResult && (
            <div className="py-4">
              {importResult.success > 0 ? (
                <Alert className="bg-emerald-50 border-emerald-200">
                  <Check className="h-4 w-4 text-emerald-600" />
                  <AlertTitle className="text-emerald-700">Success</AlertTitle>
                  <AlertDescription>
                    Successfully imported {importResult.success} product{importResult.success !== 1 ? "s" : ""}.
                  </AlertDescription>
                </Alert>
              ) : null}

              {importResult.failed > 0 ? (
                <Alert className="bg-red-50 border-red-200 mt-4">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertTitle className="text-red-700">Failed</AlertTitle>
                  <AlertDescription>
                    Failed to import {importResult.failed} product{importResult.failed !== 1 ? "s" : ""}. Please check
                    your data format and try again.
                  </AlertDescription>
                </Alert>
              ) : null}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setShowImportSuccess(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
