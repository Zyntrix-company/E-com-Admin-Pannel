"use client"

import type React from "react"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { AdminLayout } from "@/components/admin-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { axiosInstance } from "@/lib/axios"
import { Plus, X } from "lucide-react"

type Variant = {
  label: string;
  price: number;
  mrp: number;
  quantity: number;
}

type Combo = {
  label: string;
  price: number;
  mrp: number;
  quantity: number;
  description?: string;
  issueName?: string;
  comboProductId?: string;
  images?: string[];
  videos?: string[];
}

type Faq = { question: string; answer: string }

type FormState = {
  name: string
  description: string
  category: string
  mrp: number
  sellingPrice: number
  variants: Variant[]
  combos: Combo[]
  highlights: string[]
  packOf: number
  asin: string
  sku: string
  flavor: string
  ingredients: string
  usageTiming: string
  rating: number
  reviewCount: number
  faqs: Faq[]
  tax: number
}

export default function NewProductPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [formData, setFormData] = useState<FormState>({
    name: "",
    description: "",
    category: "",
    mrp: 0,
    sellingPrice: 0,
    variants: [{ label: "", price: 0, mrp: 0, quantity: 0 }],
    combos: [],
    highlights: [""],
    packOf: 1,
    asin: "",
    sku: "",
    flavor: "",
    ingredients: "",
    usageTiming: "",
    rating: 0,
    reviewCount: 0,
    faqs: [{ question: "", answer: "" }],
    tax: 0,
  })

  const [images, setImages] = useState<string[]>([])
  const [videos, setVideos] = useState<string[]>([])
  const [activeMediaIndex, setActiveMediaIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [availableProducts, setAvailableProducts] = useState<any[]>([])

  useEffect(() => {
    const fetchAvailableProducts = async () => {
      try {
        const response = await axiosInstance.get("/admin/products")
        const list = Array.isArray(response.data) ? response.data : response.data?.products || response.data?.data || []
        setAvailableProducts(list)
      } catch (error) {
        console.error("Failed to fetch products:", error)
      }
    }
    fetchAvailableProducts()
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return
    window.scrollTo(0, 0)
  }, [])

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

  const handleVideoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    try {
      const next = await Promise.all(Array.from(files).map(readFileAsDataUrl))
      setVideos((prev) => [...prev, ...next])
      e.target.value = ""
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process video",
        variant: "destructive",
      })
    }
  }

  const handleAddVariant = () => {
    setFormData((prev) => ({
      ...prev,
      variants: [...prev.variants, { label: "", price: 0, mrp: 0, quantity: 0 }],
    }))
  }

  const handleRemoveVariant = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index),
    }))
  }

  const handleVariantChange = (index: number, field: keyof Variant, value: any) => {
    setFormData((prev) => {
      const nextVariants = [...prev.variants]
      nextVariants[index] = { ...nextVariants[index], [field]: value } as Variant
      return { ...prev, variants: nextVariants }
    })
  }

  const handleAddCombo = () => {
    setFormData((prev) => ({
      ...prev,
      combos: [...prev.combos, { label: "", price: 0, mrp: 0, quantity: 0, description: "" }],
    }))
  }

  const handleRemoveCombo = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      combos: prev.combos.filter((_, i) => i !== index),
    }))
  }

  const handleComboChange = (index: number, field: keyof Combo, value: any) => {
    setFormData((prev) => {
      const nextCombos = [...prev.combos]
      nextCombos[index] = { ...nextCombos[index], [field]: value } as Combo
      return { ...prev, combos: nextCombos }
    })
  }

  const handleComboImagesChange = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    try {
      const next = await Promise.all(Array.from(files).map(readFileAsDataUrl))
      const currentImages = formData.combos[index].images || []
      handleComboChange(index, "images", [...currentImages, ...next])
      e.target.value = ""
    } catch (error) {
      toast({ title: "Error", description: "Failed to process combo images", variant: "destructive" })
    }
  }

  const handleComboVideosChange = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    try {
      const next = await Promise.all(Array.from(files).map(readFileAsDataUrl))
      const currentVideos = formData.combos[index].videos || []
      handleComboChange(index, "videos", [...currentVideos, ...next])
      e.target.value = ""
    } catch (error) {
      toast({ title: "Error", description: "Failed to process combo videos", variant: "destructive" })
    }
  }


  const handleAddHighlight = () => {
    setFormData((prev) => ({ ...prev, highlights: [...prev.highlights, ""] }))
  }

  const handleRemoveHighlight = (index: number) => {
    setFormData((prev) => ({ ...prev, highlights: prev.highlights.filter((_, i) => i !== index) }))
  }

  const handleHighlightChange = (index: number, value: string) => {
    setFormData((prev) => {
      const next = [...prev.highlights]
      next[index] = value
      return { ...prev, highlights: next }
    })
  }

  const handleAddFaq = () => {
    setFormData((prev) => ({ ...prev, faqs: [...prev.faqs, { question: "", answer: "" }] }))
  }

  const handleRemoveFaq = (index: number) => {
    setFormData((prev) => ({ ...prev, faqs: prev.faqs.filter((_, i) => i !== index) }))
  }

  const handleFaqChange = (index: number, field: keyof Faq, value: string) => {
    setFormData((prev) => {
      const next = [...prev.faqs]
      next[index] = { ...next[index], [field]: value }
      return { ...prev, faqs: next }
    })
  }

  const preview = useMemo(() => {
    const cleanHighlights = formData.highlights.map((h) => h.trim()).filter(Boolean)
    const cleanFaqs = formData.faqs
      .map((f) => ({ question: f.question.trim(), answer: f.answer.trim() }))
      .filter((f) => f.question || f.answer)

    const media = [
      ...images.map((src) => ({ type: "image" as const, src })),
      ...videos.map((src) => ({ type: "video" as const, src })),
    ]

    return {
      title: formData.name,
      category: formData.category,
      price: formData.sellingPrice,
      mrp: formData.mrp,
      description: formData.description,
      highlights: cleanHighlights,
      faqs: cleanFaqs,
      images,
      videos,
      media,
      rating: formData.rating,
      reviewCount: formData.reviewCount,
      packOf: formData.packOf,
      asin: formData.asin,
      sku: formData.sku,
      flavor: formData.flavor,
      ingredients: formData.ingredients,
      usageTiming: formData.usageTiming,
      variants: formData.variants,
      combos: formData.combos,
      tax: formData.tax,
    }
  }, [formData, images, videos])

  useEffect(() => {
    setActiveMediaIndex((prev) => {
      const max = Math.max(0, preview.media.length - 1)
      return Math.min(prev, max)
    })
  }, [preview.media.length])

  const submitWithFallback = async (payload: Record<string, unknown>) => {
    try {
      await axiosInstance.post("/admin/products", payload)
      return { ok: true as const, usedFallback: false as const }
    } catch (error) {
      const minimal = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        mrp: formData.mrp,
        sellingPrice: formData.sellingPrice,
        variants: formData.variants,
        combos: formData.combos,
        tax: formData.tax,
        images,
        isAvailable: true,
      }

      try {
        await axiosInstance.post("/admin/products", minimal)
        return { ok: true as const, usedFallback: true as const }
      } catch (secondError) {
        throw secondError
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast({ title: "Error", description: "Product title is required", variant: "destructive" })
      return
    }

    if (formData.name.length > 200) {
      toast({ title: "Error", description: "Product title must be within 200 characters", variant: "destructive" })
      return
    }

    if (!formData.category.trim()) {
      toast({ title: "Error", description: "Category is required", variant: "destructive" })
      return
    }

    if (!formData.description.trim()) {
      toast({ title: "Error", description: "Description is required", variant: "destructive" })
      return
    }

    if (formData.variants.length === 0) {
      toast({ title: "Error", description: "At least 1 variant is required", variant: "destructive" })
      return
    }

    const payload = {
      name: formData.name,
      description: formData.description,
      category: formData.category,
      mrp: formData.mrp,
      sellingPrice: formData.sellingPrice,
      variants: formData.variants,
      combos: formData.combos,
      images,
      isAvailable: true,
      highlights: formData.highlights.map((h) => h.trim()).filter(Boolean),
      packOf: formData.packOf,
      asin: formData.asin.trim() || undefined,
      sku: formData.sku.trim() || undefined,
      flavor: formData.flavor.trim() || undefined,
      ingredients: formData.ingredients.trim() || undefined,
      usageTiming: formData.usageTiming.trim() || undefined,
      rating: formData.rating || undefined,
      reviewCount: formData.reviewCount || undefined,
      faqs: formData.faqs
        .map((f) => ({ question: f.question.trim(), answer: f.answer.trim() }))
        .filter((f) => f.question || f.answer),
      videos: videos.length > 0 ? videos : undefined,
      video: videos[0] || undefined,
      tax: formData.tax,
    }

    setIsLoading(true)
    try {
      const result = await submitWithFallback(payload)

      toast({
        title: "Success",
        description: result.usedFallback
          ? "Product created (some extra fields may not be supported by the API yet)"
          : "Product created successfully",
      })

      router.push("/products")
    } catch (error) {
      const message =
        typeof error === "object" && error && "response" in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined

      toast({
        title: "Error",
        description: message || (error instanceof Error ? error.message : "Failed to create product"),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Add Product</h1>
            <p className="text-muted-foreground mt-2">Create a new product and preview it in real time</p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" className="w-full sm:w-auto" onClick={() => router.push("/products")}>
              Back
            </Button>
            <Button className="w-full sm:w-auto bg-primary hover:bg-primary/90" form="new-product-form" type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Product"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="lg:sticky lg:top-6 h-fit">
            <CardHeader>
              <CardTitle>Product Details</CardTitle>
              <CardDescription>Fill all required fields (left) and see the preview (right)</CardDescription>
            </CardHeader>
            <CardContent>
              <form id="new-product-form" onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium block mb-2">Product Title (max 200 chars)</label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                      placeholder="Enter product title"
                      maxLength={200}
                      required
                    />
                    <div className="text-xs text-muted-foreground mt-1">{formData.name.length}/200</div>
                  </div>

                  <div>
                    <label className="text-sm font-medium block mb-2">Category</label>
                    <Input
                      value={formData.category}
                      onChange={(e) => setFormData((p) => ({ ...p, category: e.target.value }))}
                      placeholder="e.g., Herbal, Oils, Powders"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium block mb-2">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                      placeholder="Product description"
                      className="w-full px-3 py-2 border border-border rounded-md text-sm resize-none"
                      rows={6}
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
                        onChange={(e) => setFormData((p) => ({ ...p, mrp: Number.parseFloat(e.target.value) || 0 }))}
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
                        onChange={(e) =>
                          setFormData((p) => ({ ...p, sellingPrice: Number.parseFloat(e.target.value) || 0 }))
                        }
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
                        onChange={(e) => setFormData((p) => ({ ...p, tax: Number.parseFloat(e.target.value) || 0 }))}
                        placeholder="0"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium block mb-2">ASIN Number</label>
                      <Input
                        value={formData.asin}
                        onChange={(e) => setFormData((p) => ({ ...p, asin: e.target.value }))}
                        placeholder="ASIN"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium block mb-2">Unique Number (SKU)</label>
                      <Input
                        value={formData.sku}
                        onChange={(e) => setFormData((p) => ({ ...p, sku: e.target.value }))}
                        placeholder="SKU / Unique ID"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium block mb-2">Flavor</label>
                      <Input
                        value={formData.flavor}
                        onChange={(e) => setFormData((p) => ({ ...p, flavor: e.target.value }))}
                        placeholder="Flavor"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium block mb-2">Usage Timing</label>
                      <Input
                        value={formData.usageTiming}
                        onChange={(e) => setFormData((p) => ({ ...p, usageTiming: e.target.value }))}
                        placeholder="e.g., Morning / Night"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium block mb-2">Ingredients</label>
                    <textarea
                      value={formData.ingredients}
                      onChange={(e) => setFormData((p) => ({ ...p, ingredients: e.target.value }))}
                      placeholder="Ingredients"
                      className="w-full px-3 py-2 border border-border rounded-md text-sm resize-none"
                      rows={4}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium block mb-2">Rating</label>
                      <Input
                        type="number"
                        min={0}
                        max={5}
                        step={0.1}
                        value={formData.rating}
                        onChange={(e) => setFormData((p) => ({ ...p, rating: Number.parseFloat(e.target.value) || 0 }))}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium block mb-2">Review Count</label>
                      <Input
                        type="number"
                        min={0}
                        value={formData.reviewCount}
                        onChange={(e) => setFormData((p) => ({ ...p, reviewCount: Number.parseInt(e.target.value) || 0 }))}
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium block mb-2">Pack Of</label>
                      <Input
                        type="number"
                        min={1}
                        value={formData.packOf}
                        onChange={(e) => setFormData((p) => ({ ...p, packOf: Number.parseInt(e.target.value) || 1 }))}
                        placeholder="1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium block mb-2">Images</label>
                      <Input type="file" accept="image/*" multiple onChange={handleImagesChange} />
                    </div>
                  </div>

                  {images.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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

                  <div>
                    <label className="text-sm font-medium block mb-2">Video Upload (optional)</label>
                    <Input type="file" accept="video/*" multiple onChange={handleVideoChange} />
                    {videos.length > 0 && (
                      <div className="mt-3 space-y-3">
                        {videos.map((src, index) => (
                          <div key={`${src}-${index}`} className="relative border border-border rounded-md overflow-hidden">
                            <video src={src} controls className="w-full h-44 object-cover" />
                            <button
                              type="button"
                              onClick={() => setVideos((prev) => prev.filter((_, i) => i !== index))}
                              className="absolute top-2 right-2 p-2 rounded bg-background/80 hover:bg-background"
                              aria-label="Remove video"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Product Highlights</CardTitle>
                    <CardDescription>Add bullet points shown on product page</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {formData.highlights.map((h, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          value={h}
                          onChange={(e) => handleHighlightChange(index, e.target.value)}
                          placeholder={`Highlight ${index + 1}`}
                        />
                        {formData.highlights.length > 1 && (
                          <Button type="button" variant="outline" onClick={() => handleRemoveHighlight(index)}>
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button type="button" variant="outline" className="gap-2" onClick={handleAddHighlight}>
                      <Plus className="w-4 h-4" />
                      Add Highlight
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Product Variants</CardTitle>
                    <CardDescription>Simple pricing/quantity options (e.g. 1kg, 2L)</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {formData.variants.map((variant, index) => (
                      <div key={index} className="p-4 border border-border rounded-lg space-y-3 bg-secondary/5">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div>
                              <label className="text-xs font-medium block mb-1">Label</label>
                              <Input
                                value={variant.label}
                                onChange={(e) => handleVariantChange(index, "label", e.target.value)}
                                placeholder="e.g., 1kg"
                                required
                              />
                            </div>
                            <div>
                              <label className="text-xs font-medium block mb-1">Price</label>
                              <Input
                                type="number"
                                value={variant.price}
                                onChange={(e) => handleVariantChange(index, "price", Number.parseFloat(e.target.value) || 0)}
                                placeholder="0"
                                required
                              />
                            </div>
                            <div>
                              <label className="text-xs font-medium block mb-1">MRP</label>
                              <Input
                                type="number"
                                value={variant.mrp}
                                onChange={(e) => handleVariantChange(index, "mrp", Number.parseFloat(e.target.value) || 0)}
                                placeholder="0"
                                required
                              />
                            </div>
                            <div>
                              <label className="text-xs font-medium block mb-1">Quantity</label>
                              <Input
                                type="number"
                                value={variant.quantity}
                                onChange={(e) => handleVariantChange(index, "quantity", Number.parseInt(e.target.value) || 0)}
                                placeholder="0"
                                required
                              />
                            </div>
                          </div>
                          {formData.variants.length > 1 && (
                            <Button type="button" variant="outline" size="icon" onClick={() => handleRemoveVariant(index)}>
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                    <Button type="button" variant="outline" className="gap-2" onClick={handleAddVariant}>
                      <Plus className="w-4 h-4" />
                      Add Variant
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base text-secondary">Health Goal Combos</CardTitle>
                    <CardDescription>Curated treatment plans for specific issues</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {formData.combos.map((combo, index) => (
                      <div key={index} className="p-5 border border-secondary/20 rounded-xl space-y-4 bg-secondary/5">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-4">
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                              <div>
                                <label className="text-xs font-bold text-secondary uppercase">Label</label>
                                <Input value={combo.label} onChange={(e) => handleComboChange(index, "label", e.target.value)} placeholder="e.g., Gut Health Plan" required />
                              </div>
                              <div>
                                <label className="text-xs font-bold text-secondary uppercase">Price</label>
                                <Input type="number" value={combo.price} onChange={(e) => handleComboChange(index, "price", Number.parseFloat(e.target.value) || 0)} placeholder="0" required />
                              </div>
                              <div>
                                <label className="text-xs font-bold text-secondary uppercase">MRP</label>
                                <Input type="number" value={combo.mrp} onChange={(e) => handleComboChange(index, "mrp", Number.parseFloat(e.target.value) || 0)} placeholder="0" />
                              </div>
                              <div>
                                <label className="text-xs font-bold text-secondary uppercase">Stock</label>
                                <Input type="number" value={combo.quantity} onChange={(e) => handleComboChange(index, "quantity", Number.parseInt(e.target.value) || 0)} placeholder="0" required />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="text-xs font-bold text-secondary uppercase">Health Issue</label>
                                <Input value={combo.issueName || ""} onChange={(e) => handleComboChange(index, "issueName", e.target.value)} placeholder="e.g., Kidney issues" />
                              </div>
                              <div>
                                <label className="text-xs font-bold text-secondary uppercase">Link Product</label>
                                <select
                                  value={combo.comboProductId || ""}
                                  onChange={(e) => handleComboChange(index, "comboProductId", e.target.value)}
                                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                >
                                  <option value="">Select Product...</option>
                                  {availableProducts.map((p: any) => (
                                    <option key={p._id || p.id} value={p._id || p.id}>{p.name}</option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            <div>
                              <label className="text-xs font-bold text-secondary uppercase">Description</label>
                              <textarea
                                value={combo.description || ""}
                                onChange={(e) => handleComboChange(index, "description", e.target.value)}
                                className="w-full p-3 rounded-md border text-sm"
                                rows={2}
                                placeholder="Describe the combo benefits..."
                              />
                            </div>

                            <div className="space-y-3">
                              <label className="text-xs font-bold text-secondary uppercase">Combo Media</label>
                              <div className="grid grid-cols-2 gap-4">
                                <Input type="file" accept="image/*" multiple onChange={(e) => handleComboImagesChange(index, e)} />
                                <Input type="file" accept="video/*" multiple onChange={(e) => handleComboVideosChange(index, e)} />
                              </div>
                              <div className="flex gap-2 overflow-x-auto py-2">
                                {combo.images?.map((img, i) => (
                                  <div key={i} className="relative w-16 h-16 border rounded bg-white p-1">
                                    <img src={img} className="w-full h-full object-contain" />
                                    <button onClick={() => handleComboChange(index, "images", combo.images?.filter((_, idx) => idx !== i))} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5"><X className="w-3 h-3" /></button>
                                  </div>
                                ))}
                                {combo.videos?.map((vid, i) => (
                                  <div key={i} className="relative w-16 h-16 border rounded bg-black flex items-center justify-center">
                                    <div className="text-[8px] text-white">VIDEO</div>
                                    <button onClick={() => handleComboChange(index, "videos", combo.videos?.filter((_, idx) => idx !== i))} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5"><X className="w-3 h-3" /></button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                          <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveCombo(index)} className="text-red-500">
                            <X className="w-5 h-5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    <Button type="button" variant="outline" className="gap-2 border-secondary text-secondary hover:bg-secondary/5" onClick={handleAddCombo}>
                      <Plus className="w-4 h-4" />
                      Add Health Combo
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">FAQs</CardTitle>
                    <CardDescription>Add different FAQs for this product</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {formData.faqs.map((faq, index) => (
                      <div key={index} className="p-4 border border-border rounded-lg space-y-3 bg-secondary/5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 space-y-3">
                            <div>
                              <label className="text-xs font-medium block mb-1">Question</label>
                              <Input
                                value={faq.question}
                                onChange={(e) => handleFaqChange(index, "question", e.target.value)}
                                placeholder="FAQ question"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-medium block mb-1">Answer</label>
                              <textarea
                                value={faq.answer}
                                onChange={(e) => handleFaqChange(index, "answer", e.target.value)}
                                placeholder="FAQ answer"
                                className="w-full px-3 py-2 border border-border rounded-md text-sm resize-none"
                                rows={3}
                              />
                            </div>
                          </div>
                          {formData.faqs.length > 1 && (
                            <Button type="button" variant="outline" onClick={() => handleRemoveFaq(index)}>
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}

                    <Button type="button" variant="outline" className="gap-2" onClick={handleAddFaq}>
                      <Plus className="w-4 h-4" />
                      Add FAQ
                    </Button>
                  </CardContent>
                </Card>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Live Preview</CardTitle>
              <CardDescription>How your product will appear to customers</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Enhanced Media Display with Large Image/Video and Thumbnails */}
              <div className="border border-border rounded-lg overflow-hidden bg-background">
                {preview.media.length === 0 ? (
                  <div className="w-full h-96 bg-secondary/30 flex items-center justify-center text-sm text-muted-foreground">
                    No media
                  </div>
                ) : (
                  <div className="relative">
                    {preview.media[activeMediaIndex]?.type === "video" ? (
                      <video src={preview.media[activeMediaIndex]?.src} controls className="w-full h-96 object-contain bg-black" />
                    ) : (
                      <img
                        src={preview.media[activeMediaIndex]?.src}
                        alt={preview.title || "Product"}
                        className="w-full h-96 object-contain bg-secondary/10"
                      />
                    )}
                  </div>
                )}

                {/* Thumbnail Trail Below Main Image */}
                {preview.media.length > 1 && (
                  <div className="flex items-center gap-2 p-3 overflow-x-auto bg-secondary/10">
                    {preview.media.map((m, i) => (
                      <button
                        key={`${m.type}-${m.src}-${i}`}
                        type="button"
                        onClick={() => setActiveMediaIndex(i)}
                        className={`flex-shrink-0 w-20 h-20 border-2 rounded-md overflow-hidden transition-all ${i === activeMediaIndex ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/50"
                          }`}
                      >
                        {m.type === "video" ? (
                          <video src={m.src} className="w-full h-full object-cover" />
                        ) : (
                          <img src={m.src} alt={`Thumbnail ${i + 1}`} className="w-full h-full object-cover" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">{preview.category || "Category"}</div>
                <div className="text-xl font-semibold break-words">{preview.title || "Product title"}</div>
                <div className="flex items-baseline gap-2">
                  <div className="text-2xl font-bold text-primary">₹{Number(preview.price || 0).toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground line-through">₹{Number(preview.mrp || 0).toLocaleString()}</div>
                </div>
                <div className="text-sm text-muted-foreground">
                  Rating: {preview.rating || 0} / 5 ({preview.reviewCount || 0} reviews)
                </div>
                <div className="text-sm text-muted-foreground">Pack of: {preview.packOf || 1}</div>
                <div className="text-xs text-muted-foreground">
                  Images: {preview.images.length} | Videos: {preview.videos.length}
                </div>
                {(preview.asin || preview.sku) && (
                  <div className="text-xs text-muted-foreground">
                    {preview.asin ? `ASIN: ${preview.asin}` : ""}
                    {preview.asin && preview.sku ? " | " : ""}
                    {preview.sku ? `SKU: ${preview.sku}` : ""}
                  </div>
                )}
                {(preview.flavor || preview.usageTiming) && (
                  <div className="text-xs text-muted-foreground">
                    {preview.flavor ? `Flavor: ${preview.flavor}` : ""}
                    {preview.flavor && preview.usageTiming ? " | " : ""}
                    {preview.usageTiming ? `Usage: ${preview.usageTiming}` : ""}
                  </div>
                )}
              </div>

              <div>
                <div className="text-sm font-medium mb-2">Description</div>
                <div className="text-sm text-muted-foreground whitespace-pre-wrap">{preview.description || "-"}</div>
              </div>

              <div>
                <div className="text-sm font-medium mb-2">Highlights</div>
                {preview.highlights.length === 0 ? (
                  <div className="text-sm text-muted-foreground">-</div>
                ) : (
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-5">
                    {preview.highlights.map((h, i) => (
                      <li key={`${h}-${i}`}>{h}</li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <div className="text-sm font-medium mb-2">Ingredients</div>
                <div className="text-sm text-muted-foreground whitespace-pre-wrap">{preview.ingredients || "-"}</div>
              </div>

              <div>
                <div className="text-sm font-medium mb-2">Variants</div>
                {preview.variants.length === 0 ? (
                  <div className="text-sm text-muted-foreground">-</div>
                ) : (
                  <div className="space-y-2">
                    {preview.variants.map((v, i) => (
                      <div key={`${v.label}-${i}`} className="border border-border rounded-md p-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-sm font-medium">{v.label || `Variant ${i + 1}`}</div>
                          <div className="text-sm text-muted-foreground">
                            Qty: {Number(v.quantity || 0).toLocaleString()}
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          Price: ₹{Number(v.price || 0).toLocaleString()} | MRP: ₹{Number(v.mrp || 0).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <div className="text-sm font-medium mb-2">FAQs</div>
                {preview.faqs.length === 0 ? (
                  <div className="text-sm text-muted-foreground">-</div>
                ) : (
                  <div className="space-y-3">
                    {preview.faqs.map((f, i) => (
                      <div key={`${f.question}-${i}`} className="border border-border rounded-md p-3">
                        <div className="text-sm font-medium">{f.question || "Question"}</div>
                        <div className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{f.answer || "Answer"}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout >
  )
}
