"use client"

import { useEffect, useState } from "react"
import { AdminLayout } from "@/components/admin-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { axiosInstance } from "@/lib/axios"
import { Plus, Edit2, Trash2, Eye, EyeOff } from "lucide-react"
import { ProductDialog } from "@/components/product-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

interface Product {
  id: string
  name: string
  category: string
  description?: string
  images?: string[]
  mrp?: number
  sellingPrice?: number
  variants: Array<{ label: string; price: number; mrp: number; quantity: number }>
  isAvailable: boolean
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [detailsProduct, setDetailsProduct] = useState<Product | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const { toast } = useToast()

  const normalizeProduct = (raw: unknown): Product => {
    const obj = raw as Record<string, unknown>
    const id = String((obj.id ?? obj._id ?? obj.productId) ?? "")

    const images = Array.isArray(obj.images)
      ? (obj.images as string[])
      : typeof obj.image === "string"
        ? [obj.image]
        : []

    const variants = Array.isArray(obj.variants)
      ? (obj.variants as Array<{ label: string; price: number; mrp: number; quantity: number }>)
      : []

    const isAvailable =
      typeof obj.isAvailable === "boolean"
        ? (obj.isAvailable as boolean)
        : typeof obj.isActive === "boolean"
          ? (obj.isActive as boolean)
          : true

    return {
      id,
      name: typeof obj.name === "string" ? obj.name : "",
      description: typeof obj.description === "string" ? obj.description : undefined,
      category: typeof obj.category === "string" ? obj.category : "",
      images,
      mrp: typeof obj.mrp === "number" ? obj.mrp : undefined,
      sellingPrice: typeof obj.sellingPrice === "number" ? obj.sellingPrice : undefined,
      variants,
      isAvailable,
    }
  }

  const fetchProducts = async () => {
    try {
      const response = await axiosInstance.get("/admin/products")
      const payload = response.data as unknown
      const list =
        Array.isArray(payload)
          ? payload
          : Array.isArray((payload as { products?: unknown })?.products)
            ? (payload as { products: unknown[] }).products
            : Array.isArray((payload as { data?: unknown })?.data)
              ? ((payload as { data: unknown[] }).data as unknown[])
              : Array.isArray((payload as { data?: { products?: unknown } })?.data?.products)
                ? ((payload as { data: { products: unknown[] } }).data.products as unknown[])
                : []

      setProducts((list as unknown[]).map(normalizeProduct).filter((p) => Boolean(p.id)))
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load products",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  const handleToggleStatus = async (product: Product) => {
    try {
      await axiosInstance.patch(`/admin/products/${product.id}/toggle-status`)

      const wasAvailable = product.isAvailable
      setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, isAvailable: !wasAvailable } : p)))

      toast({
        title: "Success",
        description: `Product ${wasAvailable ? "disabled" : "enabled"} successfully`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to toggle product status",
        variant: "destructive",
      })
    }
  }

  const handleDeleteProduct = async () => {
    if (!productToDelete) return

    try {
      await axiosInstance.delete(`/admin/products/${productToDelete.id}`)

      setProducts((prev) => prev.filter((p) => p.id !== productToDelete.id))
      setDeleteDialogOpen(false)
      setProductToDelete(null)

      toast({
        title: "Success",
        description: "Product deleted successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive",
      })
    }
  }

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Products</h1>
            <p className="text-muted-foreground mt-2">Manage your product catalog</p>
          </div>
          <Button
            className="bg-primary hover:bg-primary/90 gap-2"
            onClick={() => {
              setSelectedProduct(null)
              setIsDialogOpen(true)
            }}
          >
            <Plus className="w-4 h-4" />
            Add Product
          </Button>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <Input
              placeholder="Search by product name or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
          </CardContent>
        </Card>

        {/* Products Table */}
        <Card>
          <CardHeader>
            <CardTitle>Product List</CardTitle>
            <CardDescription>Total: {filteredProducts.length} products</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex gap-4 py-4 border-b last:border-b-0">
                    <Skeleton className="h-12 w-12 rounded" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No products found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-medium text-sm">Name</th>
                      <th className="text-left py-3 px-4 font-medium text-sm">Category</th>
                      <th className="text-left py-3 px-4 font-medium text-sm">Variants</th>
                      <th className="text-center py-3 px-4 font-medium text-sm">Status</th>
                      <th className="text-right py-3 px-4 font-medium text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((product) => (
                      <tr
                        key={product.id}
                        className="border-b border-border hover:bg-secondary/30 transition-colors cursor-pointer"
                        onClick={() => {
                          setDetailsProduct(product)
                          setDetailsDialogOpen(true)
                        }}
                      >
                        <td className="py-4 px-4">
                          <p className="font-medium">{product.name}</p>
                        </td>
                        <td className="py-4 px-4 text-sm text-muted-foreground">{product.category}</td>
                        <td className="py-4 px-4 text-sm">
                          <span className="text-xs bg-secondary/50 px-2 py-1 rounded">
                            {product.variants.length} variant(s)
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleToggleStatus(product)
                            }}
                            className={`inline-flex items-center justify-center w-8 h-8 rounded-full transition-colors ${
                              product.isAvailable
                                ? "bg-green-100/80 text-green-700 hover:bg-green-200/80"
                                : "bg-gray-100/80 text-gray-500 hover:bg-gray-200/80"
                            }`}
                            title={product.isAvailable ? "Click to disable" : "Click to enable"}
                          >
                            {product.isAvailable ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                          </button>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedProduct(product)
                                setIsDialogOpen(true)
                              }}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                setProductToDelete(product)
                                setDeleteDialogOpen(true)
                              }}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Product Dialog */}
      <ProductDialog
        open={isDialogOpen}
        onOpenChangeAction={setIsDialogOpen}
        product={selectedProduct}
        onSuccessAction={() => {
          setIsDialogOpen(false)
          fetchProducts()
        }}
      />

      {/* Product Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{detailsProduct?.name || "Product"}</DialogTitle>
            <DialogDescription>Full product details</DialogDescription>
          </DialogHeader>

          {detailsProduct && (
            <div className="space-y-6">
              {Array.isArray(detailsProduct.images) && detailsProduct.images.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {detailsProduct.images.map((src, index) => (
                    <div key={`${src}-${index}`} className="border border-border rounded-md overflow-hidden">
                      <img src={src} alt={`${detailsProduct.name} image ${index + 1}`} className="w-full h-36 object-cover" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">No images</div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-muted-foreground">Category</div>
                  <div className="text-sm">{detailsProduct.category || "-"}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Status</div>
                  <div className="text-sm">{detailsProduct.isAvailable ? "Active" : "Inactive"}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">MRP</div>
                  <div className="text-sm">{typeof detailsProduct.mrp === "number" ? detailsProduct.mrp : "-"}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Selling Price</div>
                  <div className="text-sm">
                    {typeof detailsProduct.sellingPrice === "number" ? detailsProduct.sellingPrice : "-"}
                  </div>
                </div>
              </div>

              <div>
                <div className="text-xs text-muted-foreground">Description</div>
                <div className="text-sm whitespace-pre-wrap">{detailsProduct.description || "-"}</div>
              </div>

              <div>
                <div className="text-xs text-muted-foreground mb-2">Variants</div>
                {detailsProduct.variants.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No variants</div>
                ) : (
                  <div className="space-y-2">
                    {detailsProduct.variants.map((v, i) => (
                      <div key={`${v.label}-${i}`} className="flex items-center justify-between border border-border rounded-md px-3 py-2">
                        <div className="text-sm font-medium">{v.label}</div>
                        <div className="text-sm text-muted-foreground">
                          Price: {v.price} | MRP: {v.mrp} | Qty: {v.quantity}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{productToDelete?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteProduct}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}
