"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { axiosInstance } from "@/lib/axios"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Plus, X } from "lucide-react"

interface Product {
  id: string
  name: string
  description?: string
  category: string
  mrp?: number
  sellingPrice?: number
  tax?: number
  images?: string[]
  variants: Array<{ label: string; price: number; mrp: number; quantity: number }>
  isAvailable: boolean
}

interface ProductDialogProps {
  open: boolean
  onOpenChangeAction: (open: boolean) => void
  product?: Product | null
  onSuccessAction: () => void
}

export function ProductDialog({ open, onOpenChangeAction, product, onSuccessAction }: ProductDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    mrp: 0,
    sellingPrice: 0,
    tax: 0,
    variants: [{ label: "", price: 0, mrp: 0, quantity: 0 }],
  })
  const [images, setImages] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        description: product.description || "",
        category: product.category,
        mrp: typeof product.mrp === "number" ? product.mrp : 0,
        sellingPrice: typeof product.sellingPrice === "number" ? product.sellingPrice : 0,
        tax: typeof product.tax === "number" ? product.tax : 0,
        variants: product.variants,
      })
      setImages(Array.isArray(product.images) ? product.images : [])
    } else {
      setFormData({
        name: "",
        description: "",
        category: "",
        mrp: 0,
        sellingPrice: 0,
        tax: 0,
        variants: [{ label: "", price: 0, mrp: 0, quantity: 0 }],
      })
      setImages([])
    }
  }, [product, open])

  const readFileAsDataUrl = (file: File) => {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.onerror = () => reject(new Error("Failed to read file"))
      reader.readAsDataURL(file)
    })
  }

  const handleImagesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    try {
      const next = await Promise.all(Array.from(files).map(readFileAsDataUrl))
      setImages((prev) => {
        const combined = [...prev, ...next]
        if (combined.length > 10) {
          toast({
            title: "Warning",
            description: "Only the first 10 images will be saved",
          })
          return combined.slice(0, 10)
        }
        return combined
      })
      e.target.value = ""
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process images",
        variant: "destructive",
      })
    }
  }

  const handleAddVariant = () => {
    setFormData({
      ...formData,
      variants: [...formData.variants, { label: "", price: 0, mrp: 0, quantity: 0 }],
    })
  }

  const handleRemoveVariant = (index: number) => {
    setFormData({
      ...formData,
      variants: formData.variants.filter((_, i) => i !== index),
    })
  }

  const handleVariantChange = (index: number, field: keyof (typeof formData.variants)[0], value: string | number) => {
    const newVariants = [...formData.variants]
    newVariants[index] = { ...newVariants[index], [field]: value }
    setFormData({ ...formData, variants: newVariants })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (product) {
        await axiosInstance.put(`/admin/products/${product.id}`, {
          ...formData,
          images,
          isAvailable: product.isAvailable,
        })
      } else {
        await axiosInstance.post("/admin/products", {
          ...formData,
          images,
          isAvailable: true,
        })
      }

      toast({
        title: "Success",
        description: `Product ${product ? "updated" : "created"} successfully`,
      })

      onOpenChangeAction(false)
      onSuccessAction()
    } catch (error) {
      const message =
        typeof error === "object" && error && "response" in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined

      toast({
        title: "Error",
        description: message || (error instanceof Error ? error.message : "Failed to save product"),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChangeAction}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product ? "Edit Product" : "Add New Product"}</DialogTitle>
          <DialogDescription>
            {product ? "Update product details and variants" : "Create a new product with variants"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="font-semibold">Product Information</h3>

            <div>
              <label className="text-sm font-medium block mb-2">Name</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Product name"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium block mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Product description"
                className="w-full px-3 py-2 border border-border rounded-md text-sm resize-none"
                rows={3}
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium block mb-2">Category</label>
              <Input
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="e.g., Herbal, Oils, Powders"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium block mb-2">MRP</label>
                <Input
                  type="number"
                  min={0}
                  value={formData.mrp}
                  onChange={(e) => setFormData({ ...formData, mrp: Number.parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-2">Selling Price</label>
                <Input
                  type="number"
                  min={0}
                  value={formData.sellingPrice}
                  onChange={(e) => setFormData({ ...formData, sellingPrice: Number.parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-2">Individual Tax (%)</label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  step="0.01"
                  value={formData.tax}
                  onChange={(e) => setFormData({ ...formData, tax: Number.parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium block mb-2">Images</label>
              <Input type="file" accept="image/*" multiple onChange={handleImagesChange} />

              {images.length > 0 && (
                <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {images.map((src, index) => (
                    <div key={`${src}-${index}`} className="relative border border-border rounded-md overflow-hidden">
                      <img src={src} alt={`Product image ${index + 1}`} className="w-full h-28 object-cover" />
                      <button
                        type="button"
                        onClick={() => setImages((prev) => prev.filter((_, i) => i !== index))}
                        className="absolute top-1 right-1 p-1 rounded bg-background/80 hover:bg-background"
                        aria-label="Remove image"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Variants */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Variants</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddVariant}
                className="gap-2 bg-transparent"
              >
                <Plus className="w-4 h-4" />
                Add Variant
              </Button>
            </div>

            <div className="space-y-3">
              {formData.variants.map((variant, index) => (
                <div key={index} className="p-4 border border-border rounded-lg space-y-3 bg-secondary/5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <label className="text-xs font-medium block mb-1">Label</label>
                        <Input
                          value={variant.label}
                          onChange={(e) => handleVariantChange(index, "label", e.target.value)}
                          placeholder="e.g., Size-M"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium block mb-1">Price</label>
                        <Input
                          type="number"
                          value={variant.price}
                          onChange={(e) => handleVariantChange(index, "price", Number.parseFloat(e.target.value))}
                          placeholder="0"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium block mb-1">MRP</label>
                        <Input
                          type="number"
                          value={variant.mrp}
                          onChange={(e) => handleVariantChange(index, "mrp", Number.parseFloat(e.target.value))}
                          placeholder="0"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium block mb-1">Quantity</label>
                        <Input
                          type="number"
                          value={variant.quantity}
                          onChange={(e) => handleVariantChange(index, "quantity", Number.parseInt(e.target.value))}
                          placeholder="0"
                          required
                        />
                      </div>
                    </div>
                    {formData.variants.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveVariant(index)}
                        className="mt-6 p-2 hover:bg-red-100/50 rounded text-destructive transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChangeAction(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={isLoading}>
              {isLoading ? "Saving..." : product ? "Update Product" : "Create Product"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
