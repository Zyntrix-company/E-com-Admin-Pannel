"use client"

import { useEffect, useState } from "react"
import { AdminLayout } from "@/components/admin-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { axiosInstance } from "@/lib/axios"
import { Loader2, Percent, Save, Truck } from "lucide-react"

export default function SettingsPage() {
    const [taxPercentage, setTaxPercentage] = useState<number>(0)
    const [shippingProvider, setShippingProvider] = useState<string>("")
    const [isLoading, setIsLoading] = useState(true)
    const [isSavingTax, setIsSavingTax] = useState(false)
    const [isSavingShipping, setIsSavingShipping] = useState(false)
    const { toast } = useToast()

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const [taxRes, shippingRes] = await Promise.all([
                    axiosInstance.get("/admin/tax-settings"),
                    axiosInstance.get("/admin/shipping-settings")
                ])

                if (taxRes.data.success) {
                    setTaxPercentage(taxRes.data.settings.value || 0)
                }
                if (shippingRes.data.success) {
                    setShippingProvider(shippingRes.data.settings.value || "delhivery")
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
                toast({
                    title: "Success",
                    description: "Global tax percentage updated successfully",
                })
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to update tax settings",
                variant: "destructive",
            })
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
                toast({
                    title: "Success",
                    description: `Shipping provider switched to ${provider}`,
                })
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to update shipping settings",
                variant: "destructive",
            })
        } finally {
            setIsSavingShipping(false)
        }
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
            <div className="space-y-8 max-w-4xl">
                <div>
                    <h1 className="text-3xl font-bold">Settings</h1>
                    <p className="text-muted-foreground mt-2">Manage global application configurations</p>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    {/* GST Settings */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Percent className="w-5 h-5 text-primary" />
                                <CardTitle>GST Configuration</CardTitle>
                            </div>
                            <CardDescription>Set the global GST percentage applied on the overall bill</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="max-w-xs">
                                <label className="text-sm font-medium mb-2 block">GST (%)</label>
                                <div className="flex gap-4">
                                    <Input
                                        type="number"
                                        min={0}
                                        max={100}
                                        step="0.01"
                                        value={taxPercentage}
                                        onChange={(e) => setTaxPercentage(parseFloat(e.target.value) || 0)}
                                        placeholder="0.00"
                                    />
                                    <Button
                                        onClick={handleUpdateTax}
                                        disabled={isSavingTax}
                                        className="shrink-0"
                                    >
                                        {isSavingTax ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                                        Save
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="bg-secondary/10 text-xs text-muted-foreground px-6 py-3 border-t">
                            This GST will be applied to the total amount after individual product taxes are added.
                        </CardFooter>
                    </Card>

                    {/* Shipping Settings */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Truck className="w-5 h-5 text-primary" />
                                <CardTitle>Shipping Provider</CardTitle>
                            </div>
                            <CardDescription>Select the active delivery partner for order processing</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-4">
                                {["delhivery", "shiprocket"].map((provider) => (
                                    <Button
                                        key={provider}
                                        variant={shippingProvider === provider ? "default" : "outline"}
                                        className="capitalize h-20 w-40 text-lg font-semibold"
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
            </div>
        </AdminLayout>
    )
}
