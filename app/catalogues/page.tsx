"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { AdminLayout } from "@/components/admin-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { axiosInstance } from "@/lib/axios"
import {
    Plus, Edit2, Trash2, Eye, EyeOff, Package,
    Share2, Users, FileText, Link as LinkIcon,
    Search, Check, Image as ImageIcon, Film, X
} from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Catalogue {
    id: string
    _id?: string
    name: string
    category: string
    description: string
    images: string[]
    videos: string[]
    mrp: number
    sellingPrice: number
    products: any[]
    isAvailable: boolean
}

interface CatalogueGroup {
    _id: string
    name: string
    description: string
    catalogues: Catalogue[]
    isActive: boolean
}

interface MediaLink {
    _id: string
    title: string
    type: "image" | "video"
    url: string
    createdAt: string
}

export default function CataloguesPage() {
    const router = useRouter()
    const { toast } = useToast()
    const [activeTab, setActiveTab] = useState("all")

    // State for All Catalogues
    const [catalogues, setCatalogues] = useState<Catalogue[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")

    // State for Groups
    const [groups, setGroups] = useState<CatalogueGroup[]>([])
    const [isGroupsLoading, setIsGroupsLoading] = useState(false)
    const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false)
    const [groupName, setGroupName] = useState("")
    const [groupDesc, setGroupDesc] = useState("")
    const [selectedCatalogues, setSelectedCatalogues] = useState<string[]>([])

    // State for Media Links
    const [mediaLinks, setMediaLinks] = useState<MediaLink[]>([])
    const [isLinksLoading, setIsLinksLoading] = useState(false)
    const [isCreateLinkOpen, setIsCreateLinkOpen] = useState(false)
    const [linkTitle, setLinkTitle] = useState("")
    const [linkFile, setLinkFile] = useState<string | null>(null)
    const [linkType, setLinkType] = useState<"image" | "video">("image")

    const fetchAllData = async () => {
        setIsLoading(true)
        try {
            const [catRes, groupRes, linkRes] = await Promise.all([
                axiosInstance.get("/admin/catalogues"),
                axiosInstance.get("/admin/catalogue-groups"),
                axiosInstance.get("/admin/media-links")
            ])

            setCatalogues((catRes.data.catalogues || []).map((c: any) => ({ ...c, id: c._id || c.id })))
            setGroups(groupRes.data.groups || [])
            setMediaLinks(linkRes.data.links || [])
        } catch (error) {
            toast({ title: "Error", description: "Failed to load data", variant: "destructive" })
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchAllData()
    }, [])

    const handleToggleStatus = async (catalogue: Catalogue) => {
        try {
            await axiosInstance.patch(`/admin/catalogues/${catalogue.id}/toggle-status`)
            setCatalogues(prev => prev.map(c =>
                c.id === catalogue.id ? { ...c, isAvailable: !c.isAvailable } : c
            ))
            toast({ title: "Success", description: "Catalogue status updated" })
        } catch (error) {
            toast({ title: "Error", description: "Failed to update status", variant: "destructive" })
        }
    }

    const shareToWhatsApp = (catalogue: Catalogue) => {
        const text = `Check out our latest catalogue: ${catalogue.name}\n\nPrice: ₹${catalogue.sellingPrice}\n\nView here: ${window.location.origin}/catalogues/${catalogue.id}`
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
    }

    const onCreateGroup = async () => {
        if (!groupName.trim()) return
        setIsGroupsLoading(true)
        try {
            await axiosInstance.post("/admin/catalogue-groups", {
                name: groupName,
                description: groupDesc,
                catalogues: selectedCatalogues
            })
            toast({ title: "Success", description: "Group created successfully" })
            setIsCreateGroupOpen(false)
            setGroupName("")
            setGroupDesc("")
            setSelectedCatalogues([])
            fetchAllData()
        } catch (error) {
            toast({ title: "Error", description: "Failed to create group", variant: "destructive" })
        } finally {
            setIsGroupsLoading(false)
        }
    }

    const onCreateMediaLink = async () => {
        if (!linkTitle.trim() || !linkFile) return
        setIsLinksLoading(true)
        try {
            await axiosInstance.post("/admin/media-links", {
                title: linkTitle,
                type: linkType,
                url: linkFile
            })
            toast({ title: "Success", description: "Media link generated" })
            setIsCreateLinkOpen(false)
            setLinkTitle("")
            setLinkFile(null)
            fetchAllData()
        } catch (error) {
            toast({ title: "Error", description: "Failed to create link", variant: "destructive" })
        } finally {
            setIsLinksLoading(false)
        }
    }

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        const reader = new FileReader()
        reader.onload = () => {
            setLinkFile(reader.result as string)
            setLinkType(file.type.startsWith('video') ? "video" : "image")
        }
        reader.readAsDataURL(file)
    }

    const filteredCatalogues = catalogues.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.category.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <AdminLayout>
            <div className="space-y-8 p-5 max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-foreground tracking-tight">Catalogues & Media</h1>
                        <p className="text-muted-foreground text-sm font-medium">Manage collections, groups, and sharable links</p>
                    </div>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className="bg-secondary/20 p-1 rounded-2xl h-14">
                        <TabsTrigger value="all" className="rounded-xl px-6 font-black gap-2 data-[state=active]:bg-white data-[state=active]:shadow-lg h-12">
                            <Package className="w-4 h-4" /> All Catalogues
                        </TabsTrigger>
                        <TabsTrigger value="groups" className="rounded-xl px-6 font-black gap-2 data-[state=active]:bg-white data-[state=active]:shadow-lg h-12">
                            <Users className="w-4 h-4" /> Groups
                        </TabsTrigger>
                        <TabsTrigger value="new" className="rounded-xl px-6 font-black gap-2 data-[state=active]:bg-white data-[state=active]:shadow-lg h-12">
                            <Plus className="w-4 h-4" /> Create Catalogue
                        </TabsTrigger>
                        <TabsTrigger value="links" className="rounded-xl px-6 font-black gap-2 data-[state=active]:bg-white data-[state=active]:shadow-lg h-12">
                            <LinkIcon className="w-4 h-4" /> Sharable Links
                        </TabsTrigger>
                    </TabsList>

                    {/* Section 1: All Catalogues */}
                    <TabsContent value="all" className="space-y-6">
                        <Card className="border-none shadow-sm bg-white/50 backdrop-blur">
                            <CardContent className="p-4 flex gap-4">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Filter by name, category..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 bg-white border-none h-12 rounded-xl ring-1 ring-slate-200"
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {isLoading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-64 w-full rounded-2xl" />)}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredCatalogues.map((catalogue) => (
                                    <Card key={catalogue.id} className="group overflow-hidden border-none shadow-xl hover:shadow-2xl transition-all rounded-[2rem]">
                                        <div className="relative h-48 bg-muted overflow-hidden">
                                            {catalogue.images?.[0] ? (
                                                <img src={catalogue.images[0]} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-secondary/30"><Package className="w-12 h-12 opacity-10" /></div>
                                            )}
                                            <div className="absolute top-4 left-4 flex gap-2">
                                                <span className="px-3 py-1 bg-white/90 backdrop-blur rounded-full text-[10px] font-black uppercase tracking-widest text-primary shadow-sm border border-black/5">
                                                    {catalogue.category}
                                                </span>
                                            </div>
                                            <div className={`absolute top-4 right-4 w-3 h-3 rounded-full border-2 border-white shadow-sm ${catalogue.isAvailable ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                        </div>
                                        <CardContent className="p-6">
                                            <div className="flex justify-between items-start mb-4">
                                                <h3 className="font-black text-xl text-foreground truncate">{catalogue.name}</h3>
                                                <p className="text-xl font-black text-primary">₹{catalogue.sellingPrice}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button variant="outline" className="flex-1 rounded-xl h-11 font-black gap-2" onClick={() => router.push(`/catalogues/edit/${catalogue.id}`)}>
                                                    <Edit2 className="w-4 h-4" /> Edit
                                                </Button>
                                                <Button variant="outline" className="flex-1 rounded-xl h-11 font-black gap-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border-emerald-100" onClick={() => shareToWhatsApp(catalogue)}>
                                                    <Share2 className="w-4 h-4" /> Share
                                                </Button>
                                                <Button variant="outline" size="icon" className="rounded-xl h-11 w-11" onClick={() => handleToggleStatus(catalogue)}>
                                                    {catalogue.isAvailable ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    {/* Section 2: Group Catalogues */}
                    <TabsContent value="groups" className="space-y-6">
                        <div className="flex justify-end">
                            <Button className="rounded-xl px-6 h-12 font-black gap-2 shadow-lg shadow-primary/20" onClick={() => setIsCreateGroupOpen(true)}>
                                <Plus className="w-4 h-4" /> New Group
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {groups.map(group => (
                                <Card key={group._id} className="border-none shadow-xl rounded-[2rem] overflow-hidden">
                                    <CardHeader className="bg-primary/5 pb-6">
                                        <CardTitle className="text-2xl font-black text-primary">{group.name}</CardTitle>
                                        <CardDescription className="font-bold">{group.description}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        <div className="space-y-3">
                                            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4">Catalogues in this Group</p>
                                            {group.catalogues.map(cat => (
                                                <div key={cat.id} className="flex items-center gap-3 p-3 bg-secondary/20 rounded-2xl">
                                                    <div className="w-10 h-10 rounded-xl bg-white shrink-0 overflow-hidden border border-black/5">
                                                        {cat.images?.[0] && <img src={cat.images[0]} className="w-full h-full object-cover" />}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-bold text-sm truncate">{cat.name}</p>
                                                        <p className="text-[10px] font-black text-primary uppercase">₹{cat.sellingPrice}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex gap-2 mt-6 pt-6 border-t border-slate-100">
                                            <Button variant="ghost" className="flex-1 rounded-xl h-11 font-black gap-2 text-rose-500 hover:bg-rose-50" onClick={async () => {
                                                await axiosInstance.delete(`/admin/catalogue-groups/${group._id}`)
                                                fetchAllData()
                                            }}>
                                                <Trash2 className="w-4 h-4" /> Delete Group
                                            </Button>
                                            <Button variant="outline" className="flex-1 rounded-xl h-11 font-black gap-2">
                                                <Share2 className="w-4 h-4" /> Share Group
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        <Dialog open={isCreateGroupOpen} onOpenChange={setIsCreateGroupOpen}>
                            <DialogContent className="max-w-2xl rounded-[2rem]">
                                <DialogHeader>
                                    <DialogTitle className="text-2xl font-black">Create Catalogue Group</DialogTitle>
                                    <DialogDescription className="font-medium">Group multiple catalogues together for bulk sharing</DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Group Name</label>
                                        <Input value={groupName} onChange={e => setGroupName(e.target.value)} placeholder="e.g. Best Sellers Bundle" className="h-12 rounded-xl" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Description</label>
                                        <Input value={groupDesc} onChange={e => setGroupDesc(e.target.value)} placeholder="Short description..." className="h-12 rounded-xl" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Select Catalogues</label>
                                        <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto p-1">
                                            {catalogues.map(cat => (
                                                <div
                                                    key={cat.id}
                                                    onClick={() => setSelectedCatalogues(ids => ids.includes(cat.id) ? ids.filter(i => i !== cat.id) : [...ids, cat.id])}
                                                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 ${selectedCatalogues.includes(cat.id) ? 'border-primary bg-primary/5' : 'border-slate-100 hover:bg-slate-50'}`}
                                                >
                                                    <div className="w-8 h-8 rounded-lg bg-white overflow-hidden shrink-0 border border-black/5">
                                                        {cat.images?.[0] && <img src={cat.images[0]} className="w-full h-full object-cover" />}
                                                    </div>
                                                    <p className="font-bold text-xs truncate">{cat.name}</p>
                                                    {selectedCatalogues.includes(cat.id) && <Check className="w-4 h-4 text-primary ml-auto" />}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="ghost" onClick={() => setIsCreateGroupOpen(false)} disabled={isGroupsLoading}>Cancel</Button>
                                    <Button className="rounded-xl px-8 h-12 font-black shadow-lg shadow-primary/20" onClick={onCreateGroup} disabled={isGroupsLoading || !groupName}>
                                        {isGroupsLoading ? "Creating..." : "Create Group"}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </TabsContent>

                    {/* Section 3: Create Catalogue (Redirect and Inline Preview Idea) */}
                    <TabsContent value="new">
                        <Card className="border-none shadow-xl rounded-[2rem] overflow-hidden">
                            <CardContent className="p-12 text-center space-y-6">
                                <div className="w-24 h-24 bg-primary/10 rounded-[2.5rem] flex items-center justify-center mx-auto">
                                    <FileText className="w-10 h-10 text-primary" />
                                </div>
                                <div>
                                    <h2 className="text-3xl font-black tracking-tight">Design New Catalogue</h2>
                                    <p className="text-muted-foreground mt-2 max-w-md mx-auto">Click below to open our advanced catalogue designer where you can curate items, add media, and set pricing.</p>
                                </div>
                                <Button size="lg" className="rounded-2xl px-12 h-16 font-black text-lg gap-3 shadow-2xl shadow-primary/30" onClick={() => router.push("/catalogues/new")}>
                                    <Plus className="w-6 h-6" /> Open Designer
                                </Button>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Section 4: Sharable Links */}
                    <TabsContent value="links" className="space-y-6">
                        <div className="flex justify-end">
                            <Button className="rounded-xl px-6 h-12 font-black gap-2 shadow-lg shadow-primary/20" onClick={() => setIsCreateLinkOpen(true)}>
                                <LinkIcon className="w-4 h-4" /> Generate Sharable Link
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {mediaLinks.map(link => (
                                <Card key={link._id} className="group overflow-hidden border-none shadow-xl rounded-[2rem]">
                                    <div className="relative aspect-video bg-muted overflow-hidden">
                                        {link.type === 'video' ? (
                                            <video src={link.url} className="w-full h-full object-cover" />
                                        ) : (
                                            <img src={link.url} className="w-full h-full object-cover" />
                                        )}
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <Button variant="white" className="rounded-full gap-2 font-black" onClick={() => {
                                                navigator.clipboard.writeText(link.url)
                                                toast({ title: "Copied!", description: "Link copied to clipboard" })
                                            }}>
                                                <Share2 className="w-4 h-4" /> Copy Link
                                            </Button>
                                        </div>
                                    </div>
                                    <CardContent className="p-6 flex items-center justify-between">
                                        <div className="min-w-0">
                                            <h4 className="font-black text-foreground truncate">{link.title}</h4>
                                            <p className="text-[10px] font-black uppercase text-muted-foreground">{link.type} • {new Date(link.createdAt).toLocaleDateString()}</p>
                                        </div>
                                        <Button variant="ghost" size="icon" className="rounded-xl text-rose-500" onClick={async () => {
                                            await axiosInstance.delete(`/admin/media-links/${link._id}`)
                                            fetchAllData()
                                        }}>
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        <Dialog open={isCreateLinkOpen} onOpenChange={setIsCreateLinkOpen}>
                            <DialogContent className="rounded-[2rem]">
                                <DialogHeader>
                                    <DialogTitle className="text-2xl font-black">Generate Media Link</DialogTitle>
                                    <DialogDescription className="font-medium">Upload a video or photo to get a sharable URL</DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Title</label>
                                        <Input value={linkTitle} onChange={e => setLinkTitle(e.target.value)} placeholder="e.g. Campaign Video" className="h-12 rounded-xl" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Upload File</label>
                                        {!linkFile ? (
                                            <div className="relative h-40 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer" onClick={() => document.getElementById('media-link-upload')?.click()}>
                                                <input id="media-link-upload" type="file" accept="image/*,video/*" className="hidden" onChange={handleFileChange} />
                                                <Plus className="w-8 h-8 text-slate-300" />
                                                <p className="text-xs font-bold text-slate-400 mt-2">Click to upload Image or Video</p>
                                            </div>
                                        ) : (
                                            <div className="relative h-40 rounded-2xl overflow-hidden border border-slate-200">
                                                {linkType === 'video' ? <video src={linkFile} className="w-full h-full object-cover" /> : <img src={linkFile} className="w-full h-full object-cover" />}
                                                <button onClick={() => setLinkFile(null)} className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-lg"><X className="w-4 h-4" /></button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="ghost" onClick={() => setIsCreateLinkOpen(false)} disabled={isLinksLoading}>Cancel</Button>
                                    <Button className="rounded-xl px-8 h-12 font-black shadow-lg shadow-primary/20" onClick={onCreateMediaLink} disabled={isLinksLoading || !linkTitle || !linkFile}>
                                        {isLinksLoading ? "Generating..." : "Generate Link"}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </TabsContent>
                </Tabs>
            </div>
        </AdminLayout>
    )
}

