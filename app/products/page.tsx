"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AdminLayout } from "@/components/admin-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { axiosInstance } from "@/lib/axios"
import { Plus, Edit2, Trash2, Eye, EyeOff, Package, AlertTriangle, XCircle } from "lucide-react"
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
  videos?: string[]
  mrp?: number
  sellingPrice?: number
  variants: Array<{ label: string; price: number; mrp: number; quantity: number }>
  isAvailable: boolean
  highlights?: string[]
  packOf?: number
  asin?: string
  sku?: string
  flavor?: string
  ingredients?: string
  usageTiming?: string
  rating?: number
  reviewCount?: number
  faqs?: Array<{ question: string; answer: string }>
  tax?: number
}

type TabType = "all" | "low-stock" | "out-of-stock"

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [detailsProduct, setDetailsProduct] = useState<Product | null>(null)
  const [detailsMediaIndex, setDetailsMediaIndex] = useState(0)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState<TabType>("all")
  const { toast } = useToast()
  const router = useRouter()

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

    const videos = Array.isArray(obj.videos)
      ? (obj.videos as string[])
      : typeof obj.video === "string"
        ? [obj.video]
        : []

    const highlights = Array.isArray(obj.highlights)
      ? (obj.highlights as string[])
      : typeof obj.highlights === "string"
        ? [obj.highlights]
        : Array.isArray(obj.productHighlights)
          ? (obj.productHighlights as string[])
          : []

    const packOfRaw = (obj.packOf ?? obj.packoff ?? obj.packOff) as unknown
    const packOf = typeof packOfRaw === "number" ? packOfRaw : typeof packOfRaw === "string" ? Number(packOfRaw) : undefined

    const ratingRaw = (obj.rating ?? obj.ratings) as unknown
    const rating = typeof ratingRaw === "number" ? ratingRaw : typeof ratingRaw === "string" ? Number(ratingRaw) : undefined

    const reviewCountRaw = (obj.reviewCount ?? obj.reviewsCount ?? obj.totalReviews) as unknown
    const reviewCount =
      typeof reviewCountRaw === "number" ? reviewCountRaw : typeof reviewCountRaw === "string" ? Number(reviewCountRaw) : undefined

    const faqs = Array.isArray(obj.faqs)
      ? (obj.faqs as Array<{ question: string; answer: string }>).filter(
        (f) => f && typeof f === "object" && typeof (f as any).question === "string" && typeof (f as any).answer === "string",
      )
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
      videos,
      mrp: typeof obj.mrp === "number" ? obj.mrp : undefined,
      sellingPrice: typeof obj.sellingPrice === "number" ? obj.sellingPrice : undefined,
      variants,
      isAvailable,
      highlights,
      packOf: typeof packOf === "number" && Number.isFinite(packOf) ? packOf : undefined,
      asin: typeof (obj.asin ?? obj.ASIN) === "string" ? String(obj.asin ?? obj.ASIN) : undefined,
      sku: typeof (obj.sku ?? obj.uniqueNumber ?? obj.uniqueId) === "string" ? String(obj.sku ?? obj.uniqueNumber ?? obj.uniqueId) : undefined,
      flavor: typeof obj.flavor === "string" ? obj.flavor : undefined,
      ingredients: typeof obj.ingredients === "string" ? obj.ingredients : undefined,
      usageTiming: typeof (obj.usageTiming ?? obj.usage_time) === "string" ? String(obj.usageTiming ?? obj.usage_time) : undefined,
      rating: typeof rating === "number" && Number.isFinite(rating) ? rating : undefined,
      reviewCount: typeof reviewCount === "number" && Number.isFinite(reviewCount) ? reviewCount : undefined,
      faqs,
      tax: typeof obj.tax === "number" ? obj.tax : 0,
    }
  }

  type DetailsMediaItem = { type: "image" | "video"; src: string }

  const detailsMedia: DetailsMediaItem[] = [
    ...(detailsProduct?.images ?? []).map((src) => ({ type: "image" as const, src })),
    ...(detailsProduct?.videos ?? []).map((src) => ({ type: "video" as const, src })),
  ]

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

  // Get low stock products (any variant with quantity < 10 but > 0)
  const lowStockProducts = filteredProducts.filter((product) =>
    product.variants.some((variant) => variant.quantity > 0 && variant.quantity < 10)
  )

  // Get out of stock products (all variants have quantity === 0)
  const outOfStockProducts = filteredProducts.filter((product) =>
    product.variants.length > 0 && product.variants.every((variant) => variant.quantity === 0)
  )

  // Get products to display based on active tab
  const displayProducts =
    activeTab === "low-stock"
      ? lowStockProducts
      : activeTab === "out-of-stock"
        ? outOfStockProducts
        : filteredProducts

  const tabs = [
    { id: "all" as TabType, label: "All Products", icon: Package, count: filteredProducts.length },
    { id: "low-stock" as TabType, label: "Low Stock", icon: AlertTriangle, count: lowStockProducts.length },
    { id: "out-of-stock" as TabType, label: "Out of Stock", icon: XCircle, count: outOfStockProducts.length },
  ]

  return (
    <AdminLayout>
      <div className="space-y-6 p-5 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Products</h1>
            <p className="text-muted-foreground mt-2">Manage your product catalog</p>
          </div>
          <Button className="bg-primary hover:bg-primary/90 gap-2 w-full sm:w-auto" onClick={() => router.push("/products/new")}>
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

        {/* Tabs Navigation */}
        <div className="border-b border-border">
          <div className="flex gap-2 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${isActive
                    ? "border-primary text-primary font-medium"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                    }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${isActive
                      ? "bg-primary/10 text-primary"
                      : "bg-secondary text-muted-foreground"
                      }`}
                  >
                    {tab.count}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Products Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              {activeTab === "all" && "All Products"}
              {activeTab === "low-stock" && "Low Stock Products"}
              {activeTab === "out-of-stock" && "Out of Stock Products"}
            </CardTitle>
            <CardDescription>
              {activeTab === "all" && `Total: ${displayProducts.length} products`}
              {activeTab === "low-stock" && `${displayProducts.length} product(s) with low inventory (less than 10 units)`}
              {activeTab === "out-of-stock" && `${displayProducts.length} product(s) not available in stock`}
            </CardDescription>
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
            ) : displayProducts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  {activeTab === "all" && "No products found"}
                  {activeTab === "low-stock" && "No low stock products"}
                  {activeTab === "out-of-stock" && "No out of stock products"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="text-left py-2.5 px-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider w-16">Photo</th>
                      <th className="text-left py-2.5 px-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                      <th className="text-left py-2.5 px-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Category</th>
                      <th className="text-left py-2.5 px-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Variants</th>
                      {activeTab !== "all" && (
                        <th className="text-left py-2.5 px-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Stock Status</th>
                      )}
                      <th className="text-left py-2.5 px-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Tax (%)</th>
                      <th className="text-center py-2.5 px-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                      <th className="text-right py-2.5 px-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayProducts.map((product) => {
                      const lowStockVariants = product.variants.filter(
                        (v) => v.quantity > 0 && v.quantity < 10
                      )
                      const outOfStockVariants = product.variants.filter(
                        (v) => v.quantity === 0
                      )

                      return (
                        <tr
                          key={product.id}
                          className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors cursor-pointer group"
                          onClick={() => {
                            setDetailsProduct(product)
                            setDetailsMediaIndex(0)
                            setDetailsDialogOpen(true)
                          }}
                        >
                          {/* Image — Shopdeck style: square with contained image */}
                          <td className="py-3 px-4">
                            <div className="w-14 h-14 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-200">
                              {product.images && product.images.length > 0 ? (
                                <img
                                  src={product.images[0]}
                                  alt={product.name}
                                  className="w-full h-full object-contain p-1"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Package className="w-5 h-5 text-slate-300" />
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Name — single line, truncated */}
                          <td className="py-3 px-4 max-w-[280px]">
                            <p className="text-sm font-medium text-slate-800 truncate leading-snug" title={product.name}>
                              {product.name}
                            </p>
                          </td>

                          {/* Category */}
                          <td className="py-3 px-4">
                            <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                              {product.category}
                            </span>
                          </td>

                          {/* Variants */}
                          <td className="py-3 px-4">
                            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-md font-medium">
                              {product.variants.length} variant(s)
                            </span>
                          </td>

                          {/* Stock status (low-stock / out-of-stock tabs) */}
                          {activeTab !== "all" && (
                            <td className="py-3 px-4">
                              <div className="flex flex-wrap gap-1">
                                {activeTab === "low-stock" && lowStockVariants.map((variant, idx) => (
                                  <div
                                    key={idx}
                                    className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs font-medium"
                                  >
                                    {variant.label}: {variant.quantity} left
                                  </div>
                                ))}
                                {activeTab === "out-of-stock" && outOfStockVariants.map((variant, idx) => (
                                  <div
                                    key={idx}
                                    className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-medium"
                                  >
                                    {variant.label}: Out
                                  </div>
                                ))}
                              </div>
                            </td>
                          )}

                          {/* Tax */}
                          <td className="py-3 px-4">
                            <span className="text-sm font-semibold text-slate-700">{product.tax || 0}%</span>
                          </td>

                          {/* Status toggle */}
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleToggleStatus(product)
                              }}
                              className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full transition-colors ${product.isAvailable
                                ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                                }`}
                              title={product.isAvailable ? "Click to disable" : "Click to enable"}
                            >
                              {product.isAvailable ? (
                                <><Eye className="w-3 h-3" /> Active</>
                              ) : (
                                <><EyeOff className="w-3 h-3" /> Inactive</>
                              )}
                            </button>
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 hover:bg-indigo-50 hover:text-indigo-600"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  router.push(`/products/edit/${product.id}`)
                                }}
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setProductToDelete(product)
                                  setDeleteDialogOpen(true)
                                }}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
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
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{detailsProduct?.name || "Product"}</DialogTitle>
            <DialogDescription>Full product details</DialogDescription>
          </DialogHeader>

          {detailsProduct && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="border border-border rounded-lg overflow-hidden bg-background">
                  {detailsMedia.length === 0 ? (
                    <div className="w-full h-72 bg-secondary/30 flex items-center justify-center text-sm text-muted-foreground">
                      No media
                    </div>
                  ) : (
                    <div className="relative">
                      {detailsMedia[detailsMediaIndex]?.type === "video" ? (
                        <video src={detailsMedia[detailsMediaIndex]?.src} controls className="w-full h-72 object-cover" />
                      ) : (
                        <img
                          src={detailsMedia[detailsMediaIndex]?.src}
                          alt={detailsProduct.name}
                          className="w-full h-72 object-cover"
                        />
                      )}

                      {detailsMedia.length > 1 && (
                        <>
                          <button
                            type="button"
                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background border border-border rounded-full h-9 w-9 flex items-center justify-center"
                            onClick={() =>
                              setDetailsMediaIndex((prev) => (prev - 1 + detailsMedia.length) % detailsMedia.length)
                            }
                            aria-label="Previous"
                          >
                            ‹
                          </button>
                          <button
                            type="button"
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background border border-border rounded-full h-9 w-9 flex items-center justify-center"
                            onClick={() => setDetailsMediaIndex((prev) => (prev + 1) % detailsMedia.length)}
                            aria-label="Next"
                          >
                            ›
                          </button>
                        </>
                      )}
                    </div>
                  )}

                  {detailsMedia.length > 1 && (
                    <div className="flex items-center justify-center gap-2 py-3">
                      {detailsMedia.map((m, i) => (
                        <button
                          key={`${m.type}-${m.src}-${i}`}
                          type="button"
                          aria-label={`Go to ${m.type} ${i + 1}`}
                          onClick={() => setDetailsMediaIndex(i)}
                          className={`h-2.5 w-2.5 rounded-full transition-colors ${i === detailsMediaIndex ? "bg-primary" : "bg-border hover:bg-muted-foreground/40"
                            }`}
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="text-xs text-muted-foreground">Category</div>
                    <div className="text-sm">{detailsProduct.category || "-"}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-muted-foreground">Status</div>
                      <div className="text-sm">{detailsProduct.isAvailable ? "Active" : "Inactive"}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Pack Of</div>
                      <div className="text-sm">{typeof detailsProduct.packOf === "number" ? detailsProduct.packOf : "-"}</div>
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
                    <div>
                      <div className="text-xs text-muted-foreground">Individual Tax</div>
                      <div className="text-sm">
                        {typeof detailsProduct.tax === "number" ? detailsProduct.tax : "0"}%
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-muted-foreground">ASIN</div>
                      <div className="text-sm break-words">{detailsProduct.asin || "-"}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">SKU / Unique ID</div>
                      <div className="text-sm break-words">{detailsProduct.sku || "-"}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Flavor</div>
                      <div className="text-sm break-words">{detailsProduct.flavor || "-"}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Usage Timing</div>
                      <div className="text-sm break-words">{detailsProduct.usageTiming || "-"}</div>
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-muted-foreground">Rating</div>
                    <div className="text-sm">
                      {typeof detailsProduct.rating === "number" ? detailsProduct.rating : "-"} / 5
                      {typeof detailsProduct.reviewCount === "number" ? ` (${detailsProduct.reviewCount} reviews)` : ""}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="text-xs text-muted-foreground">Description</div>
                <div className="text-sm whitespace-pre-wrap">{detailsProduct.description || "-"}</div>
              </div>

              <div>
                <div className="text-xs text-muted-foreground mb-2">Highlights</div>
                {Array.isArray(detailsProduct.highlights) && detailsProduct.highlights.length > 0 ? (
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-5">
                    {detailsProduct.highlights.map((h, i) => (
                      <li key={`${h}-${i}`}>{h}</li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-sm text-muted-foreground">-</div>
                )}
              </div>

              <div>
                <div className="text-xs text-muted-foreground">Ingredients</div>
                <div className="text-sm whitespace-pre-wrap">{detailsProduct.ingredients || "-"}</div>
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

              <div>
                <div className="text-xs text-muted-foreground mb-2">FAQs</div>
                {Array.isArray(detailsProduct.faqs) && detailsProduct.faqs.length > 0 ? (
                  <div className="space-y-2">
                    {detailsProduct.faqs.map((f, i) => (
                      <div key={`${f.question}-${i}`} className="border border-border rounded-md p-3">
                        <div className="text-sm font-medium">{f.question}</div>
                        <div className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{f.answer}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">-</div>
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
