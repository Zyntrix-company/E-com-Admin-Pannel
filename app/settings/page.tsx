"use client"

import { useEffect, useState } from "react"
import { AdminLayout } from "@/components/admin-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { axiosInstance } from "@/lib/axios"
import { Loader2, Percent, Save, Truck, User, Mail, Phone, MapPin, Home, Plus, Trash2, CheckCircle2, FileText, Printer, ExternalLink } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"

interface Warehouse {
    id: string
    name: string
    address: string
    city: string
    state: string
    pincode: string
}

export default function SettingsPage() {
    // --- Existing Settings ---
    const [taxPercentage, setTaxPercentage] = useState<number>(0)
    const [shippingProvider, setShippingProvider] = useState<string>("")
    const [isLoading, setIsLoading] = useState(true)
    const [isSavingTax, setIsSavingTax] = useState(false)
    const [isSavingShipping, setIsSavingShipping] = useState(false)

    // --- New Settings ---
    const [ownerDetails, setOwnerDetails] = useState({
        name: "",
        email: "",
        phone: ""
    })
    const [contactDetails, setContactDetails] = useState({
        supportPhone: "",
        supportEmail: "",
        businessAddress: ""
    })
    const [warehouses, setWarehouses] = useState<Warehouse[]>([])
    const [activeWarehouseId, setActiveWarehouseId] = useState<string>("")
    const [isSavingOwner, setIsSavingOwner] = useState(false)
    const [isSavingContact, setIsSavingContact] = useState(false)
    const [isSavingWarehouses, setIsSavingWarehouses] = useState(false)

    // --- Manual Label State ---
    const [manualLabel, setManualLabel] = useState({
        customerName: "",
        phone: "",
        address: "",
        city: "",
        state: "",
        pincode: "",
        items: "",
        orderId: "MANUAL-" + Math.floor(1000 + Math.random() * 9000)
    })

    const { toast } = useToast()

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const [taxRes, shippingRes, ownerRes, contactRes, warehouseRes] = await Promise.all([
                    axiosInstance.get("/admin/tax-settings"),
                    axiosInstance.get("/admin/shipping-settings"),
                    axiosInstance.get("/admin/settings/owner_details"),
                    axiosInstance.get("/admin/settings/contact_details"),
                    axiosInstance.get("/admin/settings/warehouse_settings")
                ])

                if (taxRes.data.success) {
                    setTaxPercentage(taxRes.data.settings?.value || 0)
                }
                if (shippingRes.data.success) {
                    setShippingProvider(shippingRes.data.settings?.value || "delhivery")
                }
                if (ownerRes.data.success && ownerRes.data.settings) {
                    setOwnerDetails(ownerRes.data.settings.value || { name: "", email: "", phone: "" })
                }
                if (contactRes.data.success && contactRes.data.settings) {
                    setContactDetails(contactRes.data.settings.value || { supportPhone: "", supportEmail: "", businessAddress: "" })
                }
                if (warehouseRes.data.success && warehouseRes.data.settings) {
                    const val = warehouseRes.data.settings.value || { warehouses: [], activeWarehouseId: "" }
                    setWarehouses(val.warehouses || [])
                    setActiveWarehouseId(val.activeWarehouseId || "")
                }
            } catch (error) {
                console.error("Error fetching settings:", error)
                toast({
                    title: "Error",
                    description: "Failed to load settings",
                    variant: "destructive",
                })
            } finally {
                setIsLoading(false)
            }
        }

        fetchSettings()
    }, [toast])

    const handleUpdateTax = async () => {
        setIsSavingTax(true)
        try {
            const res = await axiosInstance.put("/admin/tax-settings", { percentage: taxPercentage })
            if (res.data.success) {
                toast({ title: "Success", description: "Global tax percentage updated successfully" })
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to update tax settings", variant: "destructive" })
        } finally {
            setIsSavingTax(false)
        }
    }

    const handleUpdateShipping = async (provider: string) => {
        setIsSavingShipping(true)
        try {
            const res = await axiosInstance.put("/admin/shipping-settings", { provider })
            if (res.data.success) {
                setShippingProvider(provider)
                toast({ title: "Success", description: `Shipping provider switched to ${provider}` })
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to update shipping settings", variant: "destructive" })
        } finally {
            setIsSavingShipping(false)
        }
    }

    const handleSaveOwner = async () => {
        setIsSavingOwner(true)
        try {
            await axiosInstance.put("/admin/settings/owner_details", { value: ownerDetails })
            toast({ title: "Success", description: "Owner details updated successfully" })
        } catch (error) {
            toast({ title: "Error", description: "Failed to update owner details", variant: "destructive" })
        } finally {
            setIsSavingOwner(false)
        }
    }

    const handleSaveContact = async () => {
        setIsSavingContact(true)
        try {
            await axiosInstance.put("/admin/settings/contact_details", { value: contactDetails })
            toast({ title: "Success", description: "Contact details updated successfully" })
        } catch (error) {
            toast({ title: "Error", description: "Failed to update contact details", variant: "destructive" })
        } finally {
            setIsSavingContact(false)
        }
    }

    const handleSaveWarehouses = async () => {
        setIsSavingWarehouses(true)
        try {
            await axiosInstance.put("/admin/settings/warehouse_settings", {
                value: {
                    warehouses,
                    activeWarehouseId
                }
            })
            toast({ title: "Success", description: "Warehouse settings updated successfully" })
        } catch (error) {
            toast({ title: "Error", description: "Failed to update warehouse settings", variant: "destructive" })
        } finally {
            setIsSavingWarehouses(false)
        }
    }

    const addWarehouse = () => {
        const newWarehouse: Warehouse = {
            id: Math.random().toString(36).substr(2, 9),
            name: "",
            address: "",
            city: "",
            state: "",
            pincode: ""
        }
        setWarehouses([...warehouses, newWarehouse])
    }

    const updateWarehouse = (id: string, field: keyof Warehouse, value: string) => {
        setWarehouses(warehouses.map(w => w.id === id ? { ...w, [field]: value } : w))
    }

    const deleteWarehouse = (id: string) => {
        setWarehouses(warehouses.filter(w => w.id !== id))
        if (activeWarehouseId === id) setActiveWarehouseId("")
    }

    const printManualLabel = () => {
        const printWindow = window.open('', '_blank')
        if (!printWindow) return

        const labelHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Manual Shipping Label</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    .label { width: 4in; height: 6in; border: 2px solid #000; padding: 20px; box-sizing: border-box; position: relative; }
                    .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
                    .section { margin-bottom: 15px; }
                    .title { font-weight: bold; font-size: 12px; margin-bottom: 5px; text-transform: uppercase; }
                    .content { font-size: 14px; line-height: 1.4; }
                    .footer { position: absolute; bottom: 20px; left: 20px; right: 20px; border-top: 1px solid #000; padding-top: 10px; text-align: center; font-size: 10px; }
                </style>
            </head>
            <body>
                <div class="label">
                    <div class="header">
                        <div style="font-size: 20px; font-weight: bold;">SHIPPING LABEL</div>
                        <div style="font-size: 14px; font-weight: bold;">Order #${manualLabel.orderId}</div>
                    </div>
                    <div class="section">
                        <div class="title">Ship To:</div>
                        <div class="content">
                            <div style="font-weight: bold; font-size: 16px;">${manualLabel.customerName}</div>
                            <div>${manualLabel.phone}</div>
                            <div>${manualLabel.address}</div>
                            <div>${manualLabel.city}, ${manualLabel.state}</div>
                            <div style="font-weight: bold;">PIN: ${manualLabel.pincode}</div>
                        </div>
                    </div>
                    <div class="section" style="margin-top: 30px;">
                        <div class="title">Items:</div>
                        <div class="content">${manualLabel.items}</div>
                    </div>
                </div>
                <script>window.onload = () => { window.print(); window.close(); }</script>
            </body>
            </html>
        `
        printWindow.document.write(labelHtml)
        printWindow.document.close()
    }

    if (isLoading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center min-h-[400px]">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            </AdminLayout>
        )
    }

    return (
        <AdminLayout>
            <div className="space-y-8 max-w-5xl">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tight">Settings</h1>
                    <p className="text-slate-500 mt-2 font-medium">Manage global application configurations and business details</p>
                </div>

                <Tabs defaultValue="general" className="space-y-6">
                    <TabsList className="bg-white p-1 rounded-xl shadow-sm border border-slate-100 h-12">
                        <TabsTrigger value="general" className="rounded-lg font-black uppercase text-[10px] px-8 tracking-widest data-[state=active]:bg-slate-100">General</TabsTrigger>
                        <TabsTrigger value="business" className="rounded-lg font-black uppercase text-[10px] px-8 tracking-widest data-[state=active]:bg-slate-100">Business Details</TabsTrigger>
                        <TabsTrigger value="warehouses" className="rounded-lg font-black uppercase text-[10px] px-8 tracking-widest data-[state=active]:bg-slate-100">Warehouses</TabsTrigger>
                        <TabsTrigger value="labels" className="rounded-lg font-black uppercase text-[10px] px-8 tracking-widest data-[state=active]:bg-slate-100">Shipping Labels</TabsTrigger>
                    </TabsList>

                    <TabsContent value="general" className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* GST Settings */}
                            <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
                                <CardHeader className="border-b border-slate-50 bg-slate-50/30">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 bg-primary/10 rounded-lg">
                                            <Percent className="w-5 h-5 text-primary" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg font-black uppercase tracking-tight">GST Configuration</CardTitle>
                                            <CardDescription className="text-xs font-bold text-slate-400">Set global GST percentage</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">GST Percentage (%)</Label>
                                            <div className="flex gap-3">
                                                <Input
                                                    type="number"
                                                    min={0}
                                                    max={100}
                                                    step="0.01"
                                                    value={taxPercentage}
                                                    onChange={(e) => setTaxPercentage(parseFloat(e.target.value) || 0)}
                                                    placeholder="0.00"
                                                    className="rounded-xl border-slate-200 font-bold"
                                                />
                                                <Button
                                                    onClick={handleUpdateTax}
                                                    disabled={isSavingTax}
                                                    className="rounded-xl bg-primary shadow-lg shadow-primary/20 font-black uppercase text-[10px] tracking-widest px-6"
                                                >
                                                    {isSavingTax ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                                                    Save
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className="bg-slate-50/50 text-[10px] font-bold text-slate-400 px-6 py-4 border-t border-slate-100">
                                    This GST will be applied to the total amount after individual product taxes are added.
                                </CardFooter>
                            </Card>

                            {/* Shipping Settings */}
                            <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
                                <CardHeader className="border-b border-slate-50 bg-slate-50/30">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 bg-blue-500/10 rounded-lg">
                                            <Truck className="w-5 h-5 text-blue-500" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg font-black uppercase tracking-tight">Shipping Provider</CardTitle>
                                            <CardDescription className="text-xs font-bold text-slate-400">Active delivery partner</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    <div className="grid grid-cols-2 gap-3">
                                        {["delhivery", "shiprocket"].map((provider) => (
                                            <Button
                                                key={provider}
                                                variant={shippingProvider === provider ? "default" : "outline"}
                                                className={`rounded-2xl font-black uppercase text-[10px] tracking-widest h-14 border-2 transition-all ${shippingProvider === provider ? 'bg-primary border-primary shadow-lg shadow-primary/20' : 'border-slate-100 text-slate-400 hover:border-primary hover:text-primary'}`}
                                                onClick={() => handleUpdateShipping(provider)}
                                                disabled={isSavingShipping}
                                            >
                                                {isSavingShipping && shippingProvider !== provider ? (
                                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                                ) : null}
                                                {provider}
                                            </Button>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="business" className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Owner Details */}
                            <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
                                <CardHeader className="border-b border-slate-50 bg-slate-50/30">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 bg-orange-500/10 rounded-lg">
                                            <User className="w-5 h-5 text-orange-500" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg font-black uppercase tracking-tight">Owner Details</CardTitle>
                                            <CardDescription className="text-xs font-bold text-slate-400">Primary contact person</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-6 space-y-4">
                                    <div className="grid grid-cols-1 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Full Name</Label>
                                            <div className="relative">
                                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                <Input
                                                    value={ownerDetails.name}
                                                    onChange={(e) => setOwnerDetails({ ...ownerDetails, name: e.target.value })}
                                                    className="pl-12 rounded-xl border-slate-200 font-bold"
                                                    placeholder="e.g. John Doe"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Email Address</Label>
                                            <div className="relative">
                                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                <Input
                                                    type="email"
                                                    value={ownerDetails.email}
                                                    onChange={(e) => setOwnerDetails({ ...ownerDetails, email: e.target.value })}
                                                    className="pl-12 rounded-xl border-slate-200 font-bold"
                                                    placeholder="owner@example.com"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Phone Number</Label>
                                            <div className="relative">
                                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                <Input
                                                    value={ownerDetails.phone}
                                                    onChange={(e) => setOwnerDetails({ ...ownerDetails, phone: e.target.value })}
                                                    className="pl-12 rounded-xl border-slate-200 font-bold"
                                                    placeholder="+91 XXXXX XXXXX"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <Button
                                        onClick={handleSaveOwner}
                                        disabled={isSavingOwner}
                                        className="w-full rounded-xl bg-orange-500 hover:bg-orange-600 shadow-lg shadow-orange-500/20 font-black uppercase text-[10px] tracking-widest mt-4"
                                    >
                                        {isSavingOwner ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                                        Save Owner Details
                                    </Button>
                                </CardContent>
                            </Card>

                            {/* Contact Details */}
                            <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
                                <CardHeader className="border-b border-slate-50 bg-slate-50/30">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 bg-purple-500/10 rounded-lg">
                                            <Phone className="w-5 h-5 text-purple-500" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg font-black uppercase tracking-tight">Contact Details</CardTitle>
                                            <CardDescription className="text-xs font-bold text-slate-400">Support and office contact</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-6 space-y-4">
                                    <div className="grid grid-cols-1 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Support Email</Label>
                                            <div className="relative">
                                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                <Input
                                                    type="email"
                                                    value={contactDetails.supportEmail}
                                                    onChange={(e) => setContactDetails({ ...contactDetails, supportEmail: e.target.value })}
                                                    className="pl-12 rounded-xl border-slate-200 font-bold"
                                                    placeholder="support@example.com"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Support Phone</Label>
                                            <div className="relative">
                                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                <Input
                                                    value={contactDetails.supportPhone}
                                                    onChange={(e) => setContactDetails({ ...contactDetails, supportPhone: e.target.value })}
                                                    className="pl-12 rounded-xl border-slate-200 font-bold"
                                                    placeholder="+91 XXXXX XXXXX"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Business Address</Label>
                                            <div className="relative">
                                                <MapPin className="absolute left-4 top-4 w-4 h-4 text-slate-400" />
                                                <textarea
                                                    value={contactDetails.businessAddress}
                                                    onChange={(e) => setContactDetails({ ...contactDetails, businessAddress: e.target.value })}
                                                    className="w-full pl-12 pt-3 h-24 rounded-xl border-slate-200 font-bold text-sm bg-transparent border focus:ring-1 focus:ring-primary outline-none resize-none"
                                                    placeholder="Enter full office address..."
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <Button
                                        onClick={handleSaveContact}
                                        disabled={isSavingContact}
                                        className="w-full rounded-xl bg-purple-500 hover:bg-purple-600 shadow-lg shadow-purple-500/20 font-black uppercase text-[10px] tracking-widest mt-4"
                                    >
                                        {isSavingContact ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                                        Save Contact Details
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="warehouses" className="space-y-6">
                        <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
                            <CardHeader className="border-b border-slate-50 bg-slate-50/30">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 bg-green-500/10 rounded-lg">
                                            <Home className="w-5 h-5 text-green-500" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg font-black uppercase tracking-tight">Warehouse Management</CardTitle>
                                            <CardDescription className="text-xs font-bold text-slate-400">Add and manage pickup locations</CardDescription>
                                        </div>
                                    </div>
                                    <Button
                                        onClick={addWarehouse}
                                        className="rounded-xl bg-green-600 hover:bg-green-700 font-black uppercase text-[10px] tracking-widest"
                                    >
                                        <Plus className="w-4 h-4 mr-2" />
                                        Add Warehouse
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-6">
                                {warehouses.length === 0 ? (
                                    <div className="text-center py-12 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                                        <Home className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                                        <p className="text-xs font-black uppercase tracking-widest text-slate-400">No warehouses added yet</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-6">
                                        {warehouses.map((warehouse) => (
                                            <div key={warehouse.id} className={`p-6 rounded-3xl border-2 transition-all relative ${activeWarehouseId === warehouse.id ? 'border-primary bg-primary/5' : 'border-slate-50 hover:border-slate-200'}`}>
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="flex items-center gap-3">
                                                        <button
                                                            onClick={() => setActiveWarehouseId(warehouse.id)}
                                                            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${activeWarehouseId === warehouse.id ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                                                        >
                                                            {activeWarehouseId === warehouse.id ? (
                                                                <CheckCircle2 className="w-4 h-4" />
                                                            ) : (
                                                                <div className="w-4 h-4 rounded-full border-2 border-slate-300" />
                                                            )}
                                                            <span className="text-[10px] font-black uppercase tracking-widest">{activeWarehouseId === warehouse.id ? 'Active Pickup' : 'Select as Pickup'}</span>
                                                        </button>
                                                        <span className="text-xs font-black text-slate-500 uppercase">Warehouse #{warehouse.id}</span>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => deleteWarehouse(warehouse.id)}
                                                        className="text-red-400 hover:text-red-500 hover:bg-red-50"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                    <div className="space-y-1">
                                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Location Name</Label>
                                                        <Input
                                                            value={warehouse.name}
                                                            onChange={(e) => updateWarehouse(warehouse.id, "name", e.target.value)}
                                                            placeholder="Main Warehouse / Delhi Depot"
                                                            className="rounded-xl border-slate-100 font-bold"
                                                        />
                                                    </div>
                                                    <div className="space-y-1 lg:col-span-2">
                                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Street Address</Label>
                                                        <Input
                                                            value={warehouse.address}
                                                            onChange={(e) => updateWarehouse(warehouse.id, "address", e.target.value)}
                                                            placeholder="Full address details"
                                                            className="rounded-xl border-slate-100 font-bold"
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">City</Label>
                                                        <Input
                                                            value={warehouse.city}
                                                            onChange={(e) => updateWarehouse(warehouse.id, "city", e.target.value)}
                                                            placeholder="City"
                                                            className="rounded-xl border-slate-100 font-bold"
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">State</Label>
                                                        <Input
                                                            value={warehouse.state}
                                                            onChange={(e) => updateWarehouse(warehouse.id, "state", e.target.value)}
                                                            placeholder="State"
                                                            className="rounded-xl border-slate-100 font-bold"
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pincode</Label>
                                                        <Input
                                                            value={warehouse.pincode}
                                                            onChange={(e) => updateWarehouse(warehouse.id, "pincode", e.target.value)}
                                                            placeholder="6 Digit PIN"
                                                            maxLength={6}
                                                            className="rounded-xl border-slate-100 font-bold"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                            <CardFooter className="bg-slate-50/50 p-6 border-t border-slate-100">
                                <div className="flex justify-between items-center w-full">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        The pincode of the active warehouse will be used for Shiprocket & Delhivery serviceability.
                                    </p>
                                    <Button
                                        onClick={handleSaveWarehouses}
                                        disabled={isSavingWarehouses}
                                        className="rounded-xl bg-primary shadow-lg shadow-primary/20 font-black uppercase text-[10px] tracking-widest px-8 h-12"
                                    >
                                        {isSavingWarehouses ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                                        Save All Changes
                                    </Button>
                                </div>
                            </CardFooter>
                        </Card>
                    </TabsContent>

                    <TabsContent value="labels" className="space-y-6">
                        <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
                            <CardHeader className="border-b border-slate-50 bg-slate-50/30">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-blue-600/10 rounded-lg">
                                        <Printer className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg font-black uppercase tracking-tight">Manual Label Generator</CardTitle>
                                        <CardDescription className="text-xs font-bold text-slate-400">Generate shipping labels for custom shipments</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Customer Name</Label>
                                        <Input
                                            value={manualLabel.customerName}
                                            onChange={(e) => setManualLabel({ ...manualLabel, customerName: e.target.value })}
                                            placeholder="Recipient Full Name"
                                            className="rounded-xl font-bold"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Phone Number</Label>
                                        <Input
                                            value={manualLabel.phone}
                                            onChange={(e) => setManualLabel({ ...manualLabel, phone: e.target.value })}
                                            placeholder="+91 XXXXX XXXXX"
                                            className="rounded-xl font-bold"
                                        />
                                    </div>
                                    <div className="md:col-span-2 space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Full Address</Label>
                                        <Input
                                            value={manualLabel.address}
                                            onChange={(e) => setManualLabel({ ...manualLabel, address: e.target.value })}
                                            placeholder="House No, Street, Landmark"
                                            className="rounded-xl font-bold"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">City</Label>
                                        <Input
                                            value={manualLabel.city}
                                            onChange={(e) => setManualLabel({ ...manualLabel, city: e.target.value })}
                                            className="rounded-xl font-bold"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">State</Label>
                                        <Input
                                            value={manualLabel.state}
                                            onChange={(e) => setManualLabel({ ...manualLabel, state: e.target.value })}
                                            className="rounded-xl font-bold"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pincode</Label>
                                        <Input
                                            value={manualLabel.pincode}
                                            onChange={(e) => setManualLabel({ ...manualLabel, pincode: e.target.value })}
                                            maxLength={6}
                                            className="rounded-xl font-bold"
                                        />
                                    </div>
                                    <div className="md:col-span-2 space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Items Description</Label>
                                        <textarea
                                            value={manualLabel.items}
                                            onChange={(e) => setManualLabel({ ...manualLabel, items: e.target.value })}
                                            className="w-full p-4 h-20 rounded-xl border border-slate-200 font-bold text-sm bg-transparent outline-none focus:ring-1 focus:ring-primary"
                                            placeholder="e.g. 1x Wellness Kit, 2x Herbal Tea"
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <Button
                                        onClick={printManualLabel}
                                        className="flex-1 rounded-xl bg-blue-600 hover:bg-blue-700 font-black uppercase text-[10px] tracking-widest h-12 shadow-lg shadow-blue-600/20"
                                    >
                                        <Printer className="w-4 h-4 mr-2" />
                                        Generate & Print Label
                                    </Button>
                                    <Link href="/orders/process" className="flex-1">
                                        <Button
                                            variant="outline"
                                            className="w-full rounded-xl border-slate-200 font-black uppercase text-[10px] tracking-widest h-12"
                                        >
                                            <ExternalLink className="w-4 h-4 mr-2" />
                                            Order Specific Labels
                                        </Button>
                                    </Link>
                                </div>
                            </CardContent>
                            <CardFooter className="bg-slate-50/50 p-6 border-t border-slate-100 flex flex-col items-start gap-2">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">PRO TIP</p>
                                <p className="text-[10px] font-bold text-slate-500">
                                    For regular orders, use the <Link href="/orders/process" className="text-primary hover:underline">Process Orders</Link> section to generate labels automatically with order data.
                                </p>
                            </CardFooter>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </AdminLayout>
    )
}
