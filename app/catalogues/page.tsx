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
import { Plus, Edit2, Trash2, Eye, EyeOff, Package } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"

interface Catalogue {
    id: string
    name: string
    category: string
    description: string
    images: string[]
    mrp: number
    sellingPrice: number
    products: any[]
    isAvailable: boolean
}

export default function CataloguesPage() {
    const router = useRouter()
    const [catalogues, setCatalogues] = useState<Catalogue[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [catalogueToDelete, setCatalogueToDelete] = useState<Catalogue | null>(null)
    const [searchQuery, setSearchQuery] = useState("")
    const { toast } = useToast()

    const fetchCatalogues = async () => {
        try {
            const response = await axiosInstance.get("/admin/catalogues")
            const list = Array.isArray(response.data) ? response.data : response.data.catalogues || []
            setCatalogues(list.map((c: any) => ({
                id: c._id || c.id,
                ...c
            })))
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to load catalogues",
                variant: "destructive",
            })
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchCatalogues()
    }, [])

    const handleToggleStatus = async (catalogue: Catalogue) => {
        try {
            await axiosInstance.patch(`/admin/catalogues/${catalogue.id}/toggle-status`)
            setCatalogues(prev => prev.map(c =>
                c.id === catalogue.id ? { ...c, isAvailable: !c.isAvailable } : c
            ))
            toast({
                title: "Success",
                description: `Catalogue status updated`,
            })
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to update status",
                variant: "destructive",
            })
        }
    }

    const handleDelete = async () => {
        if (!catalogueToDelete) return
        try {
            await axiosInstance.delete(`/admin/catalogues/${catalogueToDelete.id}`)
            setCatalogues(prev => prev.filter(c => c.id !== catalogueToDelete.id))
            setDeleteDialogOpen(false)
            toast({
                title: "Success",
                description: "Catalogue deleted successfully",
            })
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to delete catalogue",
                variant: "destructive",
            })
        }
    }

    const filteredCatalogues = catalogues.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.category.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <AdminLayout>
            <div className="space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-foreground tracking-tight">Product Catalogues</h1>
                        <p className="text-muted-foreground text-sm font-medium">Manage product bundles and curated collections</p>
                    </div>
                    <Button
                        className="bg-primary hover:bg-primary/90 gap-2 shadow-lg shadow-primary/20"
                        onClick={() => router.push("/catalogues/new")}
                    >
                        <Plus className="w-4 h-4" />
                        Create Catalogue
                    </Button>
                </div>

                {/* Filters */}
                <Card className="border border-border shadow-sm">
                    <CardContent className="p-4">
                        <Input
                            placeholder="Search catalogues by name or category..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="max-w-md bg-secondary/10 border-none h-11"
                        />
                    </CardContent>
                </Card>

                {/* Results Grid */}
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, i) => (
                            <Skeleton key={i} className="h-[350px] w-full rounded-2xl" />
                        ))}
                    </div>
                ) : filteredCatalogues.length === 0 ? (
                    <div className="text-center py-20 bg-secondary/5 rounded-3xl border border-dashed border-border">
                        <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-20" />
                        <p className="text-lg font-bold text-muted-foreground">No catalogues found</p>
                        <p className="text-sm text-muted-foreground mt-1">Start by creating your first product bundle</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredCatalogues.map((catalogue) => (
                            <Card key={catalogue.id} className="group overflow-hidden border border-border shadow-sm hover:shadow-xl transition-all duration-300 rounded-2xl">
                                <div className="relative h-48 bg-muted overflow-hidden">
                                    {catalogue.images?.[0] ? (
                                        <img src={catalogue.images[0]} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-secondary/30">
                                            <Package className="w-12 h-12 text-muted-foreground opacity-20" />
                                        </div>
                                    )}
                                    <div className="absolute top-4 left-4">
                                        <span className="px-3 py-1 bg-white/90 backdrop-blur rounded-full text-[10px] font-black uppercase tracking-widest text-primary border border-primary/10">
                                            {catalogue.category}
                                        </span>
                                    </div>
                                    <div className={`absolute top-4 right-4 w-3 h-3 rounded-full border-2 border-white shadow-sm ${catalogue.isAvailable ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                </div>

                                <CardContent className="p-5">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-black text-xl text-foreground truncate flex-1 mr-2">{catalogue.name}</h3>
                                        <div className="text-right shrink-0">
                                            <p className="text-[10px] font-bold text-muted-foreground line-through">₹{catalogue.mrp}</p>
                                            <p className="text-lg font-black text-primary">₹{catalogue.sellingPrice}</p>
                                        </div>
                                    </div>

                                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4 min-h-[40px] font-medium leading-relaxed">
                                        {catalogue.description}
                                    </p>

                                    <div className="flex items-center gap-2 mb-6">
                                        <div className="flex -space-x-2">
                                            {catalogue.products.slice(0, 4).map((p: any, i: number) => (
                                                <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-secondary flex items-center justify-center overflow-hidden shadow-sm">
                                                    {p.images?.[0] ? <img src={p.images[0]} className="w-full h-full object-cover" /> : <Package className="w-3 h-3" />}
                                                </div>
                                            ))}
                                        </div>
                                        {catalogue.products.length > 4 && (
                                            <span className="text-[10px] font-bold text-muted-foreground">+{catalogue.products.length - 4} More</span>
                                        )}
                                        <span className="text-[10px] font-black text-muted-foreground ml-auto uppercase tracking-widest">
                                            {catalogue.products.length} PRODUCTS
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2 pt-4 border-t border-border/50">
                                        <Button
                                            variant="secondary"
                                            className="flex-1 rounded-xl font-bold text-xs gap-2"
                                            onClick={() => router.push(`/catalogues/edit/${catalogue.id}`)}
                                        >
                                            <Edit2 className="w-3 h-3" />
                                            Configure
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className={`rounded-xl transition-colors ${catalogue.isAvailable ? 'text-emerald-600 bg-emerald-50' : 'text-muted-foreground bg-secondary'}`}
                                            onClick={() => handleToggleStatus(catalogue)}
                                        >
                                            {catalogue.isAvailable ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="rounded-xl text-rose-500 hover:bg-rose-50"
                                            onClick={() => {
                                                setCatalogueToDelete(catalogue)
                                                setDeleteDialogOpen(true)
                                            }}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Delete Catalogue</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to delete "{catalogueToDelete?.name}"?
                                This will only delete the catalogue, not the products inside it.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                            <Button variant="destructive" onClick={handleDelete}>Delete Permanently</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AdminLayout>
    )
}
