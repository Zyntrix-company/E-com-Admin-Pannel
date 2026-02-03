"use client"

import type React from "react"
import { useEffect, useMemo, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { AdminLayout } from "@/components/admin-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { axiosInstance } from "@/lib/axios"
import { Plus, X, Search, Check, Package, Image as ImageIcon, Film, Loader2, ArrowLeft, ArrowRight } from "lucide-react"

interface MediaItem {
    type: 'image' | 'video'
    url: string
}

interface Product {
    id: string
    name: string
    category: string
    images?: string[]
    sellingPrice?: number
}

export default function EditCataloguePage() {
    const router = useRouter()
    const params = useParams()
    const catalogueId = params?.id as string
    const { toast } = useToast()

    const [formData, setFormData] = useState({
        name: "",
        description: "",
        category: "",
        mrp: 0,
        sellingPrice: 0,
        products: [] as string[],
    })

    const [media, setMedia] = useState<MediaItem[]>([])
    const [activeMediaIndex, setActiveMediaIndex] = useState(0)
    const [isLoading, setIsLoading] = useState(false)
    const [isInitialLoading, setIsInitialLoading] = useState(true)
    const [allProducts, setAllProducts] = useState<Product[]>([])
    const [productSearch, setProductSearch] = useState("")

    useEffect(() => {
        if (catalogueId) {
            Promise.all([fetchCatalogue(), fetchProducts()]).finally(() => setIsInitialLoading(false))
        }
    }, [catalogueId])

    const fetchCatalogue = async () => {
        try {
            const response = await axiosInstance.get(`/admin/catalogues/${catalogueId}`)
            const c = response.data.catalogue
            setFormData({
                name: c.name,
                description: c.description,
                category: c.category,
                mrp: c.mrp,
                sellingPrice: c.sellingPrice,
                products: c.products.map((p: any) => typeof p === 'string' ? p : (p._id || p.id)),
            })
            if (c.media && Array.isArray(c.media) && c.media.length > 0) {
                setMedia(c.media)
            } else {
                setMedia([
                    ...(c.images || []).map((url: string) => ({ type: 'image' as const, url })),
                    ...(c.videos || []).map((url: string) => ({ type: 'video' as const, url }))
                ])
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to load catalogue", variant: "destructive" })
            router.push("/catalogues")
        }
    }

    const fetchProducts = async () => {
        try {
            const response = await axiosInstance.get("/admin/products")
            const list = Array.isArray(response.data) ? response.data : response.data.products || []
            setAllProducts(list.map((p: any) => ({
                id: p._id || p.id,
                name: p.name,
                category: p.category,
                images: p.images,
                sellingPrice: p.sellingPrice
            })))
        } catch (error) {
            console.error("Failed to fetch products:", error)
        }
    }

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
            const newMedia = next.map(url => ({ type: 'image' as const, url }))
            setMedia((prev) => [...prev, ...newMedia])
            e.target.value = ""
        } catch (error) {
            toast({ title: "Error", description: "Failed to process images", variant: "destructive" })
        }
    }

    const handleVideoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files || files.length === 0) return
        try {
            const next = await Promise.all(Array.from(files).map(readFileAsDataUrl))
            const newMedia = next.map(url => ({ type: 'video' as const, url }))
            setMedia((prev) => [...prev, ...newMedia])
            e.target.value = ""
        } catch (error) {
            toast({ title: "Error", description: "Failed to process video", variant: "destructive" })
        }
    }

    const moveMedia = (index: number, direction: 'left' | 'right') => {
        if (direction === 'left' && index === 0) return
        if (direction === 'right' && index === media.length - 1) return

        const newMedia = [...media]
        const targetIndex = direction === 'left' ? index - 1 : index + 1
            ;[newMedia[index], newMedia[targetIndex]] = [newMedia[targetIndex], newMedia[index]]
        setMedia(newMedia)
    }

    const removeMedia = (index: number) => {
        setMedia(prev => prev.filter((_, i) => i !== index))
        if (activeMediaIndex >= index && activeMediaIndex > 0) {
            setActiveMediaIndex(prev => prev - 1)
        }
    }

    const toggleProduct = (productId: string) => {
        setFormData(prev => ({
            ...prev,
            products: prev.products.includes(productId)
                ? prev.products.filter(id => id !== productId)
                : [...prev.products, productId]
        }))
    }

    const preview = useMemo(() => {
        const selectedProductDetails = allProducts.filter(p => formData.products.includes(p.id))

        return {
            title: formData.name,
            category: formData.category,
            price: formData.sellingPrice,
            mrp: formData.mrp,
            description: formData.description,
            media,
            products: selectedProductDetails
        }
    }, [formData, media, allProducts])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.name.trim()) return toast({ title: "Error", description: "Catalogue name is required", variant: "destructive" })
        if (formData.products.length === 0) return toast({ title: "Error", description: "Select at least one product", variant: "destructive" })

        setIsLoading(true)
        try {
            await axiosInstance.put(`/admin/catalogues/${catalogueId}`, { ...formData, media })
            toast({ title: "Success", description: "Catalogue updated successfully" })
            router.push("/catalogues")
        } catch (error: any) {
            toast({ title: "Error", description: error.response?.data?.message || "Failed to update catalogue", variant: "destructive" })
        } finally {
            setIsLoading(false)
        }
    }

    const filteredProducts = allProducts.filter(p =>
        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.category.toLowerCase().includes(productSearch.toLowerCase())
    )

    if (isInitialLoading) {
        return (
            <AdminLayout>
                <div className="space-y-6">
                    <Skeleton className="h-12 w-64 rounded-xl" />
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Skeleton className="h-96 rounded-2xl" />
                        <Skeleton className="h-96 rounded-2xl" />
                    </div>
                </div>
            </AdminLayout>
        )
    }

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight">Modify Catalogue</h1>
                        <p className="text-muted-foreground mt-2">Adjust your curated collection details and preview live</p>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <Button variant="outline" onClick={() => router.push("/catalogues")}>Cancel</Button>
                        <Button className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20" onClick={handleSubmit} disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Updating...
                                </>
                            ) : "Update Catalogue"}
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left Column: Editor */}
                    <div className="space-y-6">
                        <Card className="border border-border shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-lg">Catalogue Details</CardTitle>
                                <CardDescription>Primary information about the collection</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <label className="text-sm font-bold mb-1.5 block">Catalogue Title</label>
                                    <Input
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g., Seasonal Immunity Boosters"
                                        className="h-11"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-bold mb-1.5 block">Category</label>
                                    <Input
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        placeholder="Bundles, Wellness, etc."
                                        className="h-11"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-bold mb-1.5 block">Description</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full h-32 px-3 py-2 border border-border rounded-xl text-sm resize-none focus:ring-2 focus:ring-primary/20 transition-all"
                                        placeholder="Describe the value of this collection..."
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-bold mb-1.5 block">MRP Price</label>
                                        <Input
                                            type="number"
                                            value={formData.mrp}
                                            onChange={(e) => setFormData({ ...formData, mrp: parseFloat(e.target.value) || 0 })}
                                            className="h-11"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-bold mb-1.5 block">Selling Price</label>
                                        <Input
                                            type="number"
                                            value={formData.sellingPrice}
                                            onChange={(e) => setFormData({ ...formData, sellingPrice: parseFloat(e.target.value) || 0 })}
                                            className="h-11 border-primary/20 bg-primary/5"
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border border-border shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-lg">Included Products</CardTitle>
                                <CardDescription>{formData.products.length} items currently selected</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search your library..."
                                        className="pl-10 h-11 bg-secondary/20 border-none"
                                        value={productSearch}
                                        onChange={(e) => setProductSearch(e.target.value)}
                                    />
                                </div>
                                <div className="grid grid-cols-1 gap-2 max-h-[400px] overflow-y-auto pr-1">
                                    {allProducts.length === 0 ? (
                                        <p className="text-center py-8 text-sm text-muted-foreground">Loading products...</p>
                                    ) : (
                                        filteredProducts.map(product => (
                                            <div
                                                key={product.id}
                                                onClick={() => toggleProduct(product.id)}
                                                className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${formData.products.includes(product.id)
                                                    ? "border-primary bg-primary/5 shadow-sm"
                                                    : "border-transparent hover:bg-secondary/50"
                                                    }`}
                                            >
                                                <div className="w-12 h-12 rounded-lg border overflow-hidden shrink-0 bg-white">
                                                    {product.images?.[0] && <img src={product.images[0]} className="w-full h-full object-cover" />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-sm truncate">{product.name}</p>
                                                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">₹{product.sellingPrice}</p>
                                                </div>
                                                {formData.products.includes(product.id) && (
                                                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white shrink-0">
                                                        <Check className="w-3.5 h-3.5" />
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border border-border shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-lg">Media Gallery</CardTitle>
                                <CardDescription>Visuals representing this collection</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-2">
                                            <ImageIcon className="w-3 h-3" /> Images
                                        </label>
                                        <Button variant="secondary" className="w-full h-24 border-2 border-dashed border-border bg-transparent hover:bg-secondary/50" onClick={() => document.getElementById('image-upload')?.click()}>
                                            <Plus className="w-5 h-5 opacity-40" />
                                        </Button>
                                        <input id="image-upload" type="file" multiple accept="image/*" className="hidden" onChange={handleImagesChange} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-2">
                                            <Film className="w-3 h-3" /> Videos
                                        </label>
                                        <Button variant="secondary" className="w-full h-24 border-2 border-dashed border-border bg-transparent hover:bg-secondary/50" onClick={() => document.getElementById('video-upload')?.click()}>
                                            <Plus className="w-5 h-5 opacity-40" />
                                        </Button>
                                        <input id="video-upload" type="file" multiple accept="video/*" className="hidden" onChange={handleVideoChange} />
                                    </div>
                                </div>

                                {preview.media.length > 0 && (
                                    <div className="grid grid-cols-4 gap-2">
                                        {preview.media.map((m, i) => (
                                            <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-border group bg-secondary/10">
                                                {m.type === 'video' ? (
                                                    <video src={m.url} className="w-full h-full object-cover" />
                                                ) : (
                                                    <img src={m.url} className="w-full h-full object-cover" />
                                                )}

                                                {/* Reorder and Remove Controls */}
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-1">
                                                    <div className="flex justify-between">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); moveMedia(i, 'left'); }}
                                                            disabled={i === 0}
                                                            className="p-1 text-white hover:text-primary disabled:opacity-30"
                                                        >
                                                            <ArrowLeft className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); removeMedia(i); }}
                                                            className="p-1 bg-red-500 text-white rounded-md hover:bg-red-600"
                                                        >
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); moveMedia(i, 'right'); }}
                                                            disabled={i === preview.media.length - 1}
                                                            className="p-1 text-white hover:text-primary disabled:opacity-30"
                                                        >
                                                            <ArrowRight className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                    <div className="text-[10px] text-white font-mono text-center bg-black/50 rounded py-0.5">
                                                        {i + 1}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: Dynamic Preview */}
                    <div className="lg:sticky lg:top-6 h-fit space-y-6">
                        <Card className="border-none shadow-2xl bg-[#FDFDFD] overflow-hidden rounded-[32px]">
                            <div className="relative aspect-[4/3] bg-muted overflow-hidden">
                                {preview.media.length > 0 ? (
                                    <>
                                        {preview.media[activeMediaIndex].type === 'video' ? (
                                            <video src={preview.media[activeMediaIndex].url} controls className="w-full h-full object-cover" />
                                        ) : (
                                            <img src={preview.media[activeMediaIndex].url} className="w-full h-full object-cover" />
                                        )}
                                    </>
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                                        <Package className="w-12 h-12 opacity-10 mb-2" />
                                        <p className="text-xs font-bold uppercase tracking-widest">Preview Display</p>
                                    </div>
                                )}
                                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5 px-4 overflow-x-auto">
                                    {preview.media.map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setActiveMediaIndex(i)}
                                            className={`h-1.5 rounded-full transition-all ${i === activeMediaIndex ? 'w-8 bg-white shadow-lg' : 'w-1.5 bg-white/40'}`}
                                        />
                                    ))}
                                </div>
                            </div>

                            <CardContent className="p-8">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary bg-primary/5 px-2 py-0.5 rounded">
                                            {preview.category || "Collection"}
                                        </span>
                                        <h2 className="text-3xl font-black text-foreground tracking-tight leading-none">
                                            {preview.title || "Untitled Catalogue"}
                                        </h2>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-bold text-muted-foreground line-through">₹{preview.mrp || 0}</p>
                                        <p className="text-3xl font-black text-primary">₹{preview.price || 0}</p>
                                    </div>
                                </div>

                                <div className="space-y-4 mb-8">
                                    <h4 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">The Highlights</h4>
                                    <p className="text-sm font-bold text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                        {preview.description || "Provide a description to see it here..."}
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground flex justify-between">
                                        Bundle Contents
                                        <span className="text-foreground">{preview.products.length} Items</span>
                                    </h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        {preview.products.map(p => (
                                            <div key={p.id} className="p-3 bg-secondary/30 rounded-2xl border border-secondary flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl overflow-hidden bg-white shrink-0">
                                                    {p.images?.[0] && <img src={p.images[0]} className="w-full h-full object-cover" />}
                                                </div>
                                                <p className="text-[11px] font-black uppercase tracking-tight text-foreground truncate">{p.name}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="p-6 bg-secondary/10 border border-secondary/20 rounded-[32px] border-dashed text-center">
                            <p className="text-xs font-bold text-muted-foreground">Reviewing existing draft. Changes apply instantly to your live catalogue upon save.</p>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    )
}
