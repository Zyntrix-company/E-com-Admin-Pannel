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
import { X, Check } from "lucide-react"

interface Product {
    id: string
    name: string
    category: string
    images?: string[]
    sellingPrice?: number
}

interface Catalogue {
    id: string
    name: string
    description: string
    category: string
    mrp: number
    sellingPrice: number
    images: string[]
    products: any[]
    isAvailable: boolean
}

interface CatalogueDialogProps {
    open: boolean
    onOpenChangeAction: (open: boolean) => void
    catalogue?: Catalogue | null
    onSuccessAction: () => void
}

export function CatalogueDialog({ open, onOpenChangeAction, catalogue, onSuccessAction }: CatalogueDialogProps) {
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        category: "",
        mrp: 0,
        sellingPrice: 0,
        products: [] as string[],
    })
    const [images, setImages] = useState<string[]>([])
    const [allProducts, setAllProducts] = useState<Product[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [isProductsLoading, setIsProductsLoading] = useState(false)
    const [productSearch, setProductSearch] = useState("")
    const { toast } = useToast()

    // Fetch all products for selection
    const fetchProducts = async () => {
        setIsProductsLoading(true)
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
        } finally {
            setIsProductsLoading(false)
        }
    }

    useEffect(() => {
        if (open) {
            fetchProducts()
        }
    }, [open])

    useEffect(() => {
        if (catalogue) {
            setFormData({
                name: catalogue.name,
                description: catalogue.description,
                category: catalogue.category,
                mrp: catalogue.mrp,
                sellingPrice: catalogue.sellingPrice,
                products: catalogue.products.map(p => typeof p === 'string' ? p : (p._id || p.id)),
            })
            setImages(catalogue.images || [])
        } else {
            setFormData({
                name: "",
                description: "",
                category: "",
                mrp: 0,
                sellingPrice: 0,
                products: [],
            })
            setImages([])
        }
    }, [catalogue, open])

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
            setImages((prev) => [...prev, ...next].slice(0, 10))
            e.target.value = ""
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to process images",
                variant: "destructive",
            })
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const payload = { ...formData, images }
            if (catalogue) {
                await axiosInstance.put(`/admin/catalogues/${catalogue.id}`, payload)
            } else {
                await axiosInstance.post("/admin/catalogues", payload)
            }

            toast({
                title: "Success",
                description: `Catalogue ${catalogue ? "updated" : "created"} successfully`,
            })

            onOpenChangeAction(false)
            onSuccessAction()
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.response?.data?.message || "Failed to save catalogue",
                variant: "destructive",
            })
        } finally {
            setIsLoading(false)
        }
    }

    const filteredProducts = allProducts.filter(p =>
        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.category.toLowerCase().includes(productSearch.toLowerCase())
    )

    return (
        <Dialog open={open} onOpenChange={onOpenChangeAction}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{catalogue ? "Edit Catalogue" : "Create New Catalogue"}</DialogTitle>
                    <DialogDescription>
                        Group multiple products into a single collection with special pricing.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Left Column: Basic Info */}
                        <div className="space-y-4">
                            <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Basic Details</h3>

                            <div>
                                <label className="text-sm font-medium block mb-1">Catalogue Name</label>
                                <Input
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g., Summer Wellness Bundle"
                                    required
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium block mb-1">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-3 py-2 border border-border rounded-lg text-sm min-h-[100px]"
                                    placeholder="Describe your collection..."
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium block mb-1">MRP</label>
                                    <Input
                                        type="number"
                                        value={formData.mrp}
                                        onChange={(e) => setFormData({ ...formData, mrp: parseFloat(e.target.value) || 0 })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium block mb-1">Selling Price</label>
                                    <Input
                                        type="number"
                                        value={formData.sellingPrice}
                                        onChange={(e) => setFormData({ ...formData, sellingPrice: parseFloat(e.target.value) || 0 })}
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium block mb-1">Category</label>
                                <Input
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    placeholder="e.g., Bundles, Seasonal"
                                    required
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium block mb-1">Images</label>
                                <Input type="file" accept="image/*" multiple onChange={handleImagesChange} />
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {images.map((src, i) => (
                                        <div key={i} className="relative w-16 h-16 border rounded bg-muted overflow-hidden">
                                            <img src={src} className="w-full h-full object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))}
                                                className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-bl"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Product Selection */}
                        <div className="space-y-4">
                            <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground flex justify-between">
                                Include Products
                                <span className="text-primary">{formData.products.length} selected</span>
                            </h3>

                            <Input
                                placeholder="Search products to add..."
                                value={productSearch}
                                onChange={(e) => setProductSearch(e.target.value)}
                                className="bg-secondary/20"
                            />

                            <div className="border rounded-xl h-[400px] overflow-y-auto p-2 space-y-2 bg-secondary/5">
                                {isProductsLoading ? (
                                    <div className="text-center py-8 text-muted-foreground">Loading products...</div>
                                ) : filteredProducts.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">No products found</div>
                                ) : (
                                    filteredProducts.map(product => (
                                        <div
                                            key={product.id}
                                            onClick={() => toggleProduct(product.id)}
                                            className={`flex items-center gap-3 p-2 rounded-lg border transition-all cursor-pointer ${formData.products.includes(product.id)
                                                    ? "border-primary bg-primary/5 shadow-sm"
                                                    : "border-transparent hover:bg-secondary/50"
                                                }`}
                                        >
                                            <div className="w-10 h-10 rounded border overflow-hidden bg-white">
                                                {product.images?.[0] && <img src={product.images[0]} className="w-full h-full object-cover" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-sm truncate">{product.name}</p>
                                                <p className="text-xs text-muted-foreground">₹{product.sellingPrice} | {product.category}</p>
                                            </div>
                                            {formData.products.includes(product.id) && (
                                                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white shrink-0">
                                                    <Check className="w-4 h-4" />
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="border-t pt-6">
                        <Button type="button" variant="outline" onClick={() => onOpenChangeAction(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading || formData.products.length === 0} className="bg-primary hover:bg-primary/90 px-8">
                            {isLoading ? "Saving..." : catalogue ? "Update Catalogue" : "Create Catalogue"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
