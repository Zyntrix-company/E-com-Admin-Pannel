"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { axiosInstance } from "@/lib/axios"
import { AdminLayout } from "@/components/admin-layout"
import { Badge } from "@/components/ui/badge"

type DiscountType = "percentage" | "flat"

interface PromoCode {
  _id: string
  code: string
  description: string
  discountType: DiscountType
  discountValue: number
  minimumOrderValue: number
  maximumDiscount?: number
  usageLimit?: number
  usedCount: number
  validFrom: string
  validUntil: string
  isActive: boolean
  createdAt: string
}

export default function PromosPage() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [isFetchingPromos, setIsFetchingPromos] = useState(true)
  const [promos, setPromos] = useState<PromoCode[]>([])
  const [formData, setFormData] = useState({
    code: "",
    description: "",
    discountType: "percentage" as DiscountType,
    discountValue: 0,
    minimumOrderValue: 0,
    maximumDiscount: "",
    usageLimit: "",
    validFrom: "",
    validUntil: "",
  })

  const fetchPromos = async () => {
    try {
      setIsFetchingPromos(true)
      const response = await axiosInstance.get("/admin/promos")
      setPromos(response.data.promos || [])
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch promo codes",
        variant: "destructive",
      })
    } finally {
      setIsFetchingPromos(false)
    }
  }

  useEffect(() => {
    fetchPromos()
  }, [])

  const handleSubmit = async () => {
    setIsLoading(true)

    try {
      const payload: Record<string, unknown> = {
        code: formData.code.trim(),
        description: formData.description.trim(),
        discountType: formData.discountType,
        discountValue: formData.discountValue,
        minimumOrderValue: formData.minimumOrderValue,
        validFrom: formData.validFrom,
        validUntil: formData.validUntil,
        maximumDiscount:
          formData.maximumDiscount.trim().length > 0 ? Number.parseFloat(formData.maximumDiscount) : undefined,
        usageLimit: formData.usageLimit.trim().length > 0 ? Number.parseInt(formData.usageLimit) : undefined,
      }

      Object.keys(payload).forEach((key) => {
        if (payload[key] === undefined || payload[key] === "") {
          delete payload[key]
        }
      })

      await axiosInstance.post("/admin/promos", payload)

      toast({
        title: "Success",
        description: "Promo code created successfully",
      })

      setFormData({
        code: "",
        description: "",
        discountType: "percentage",
        discountValue: 0,
        minimumOrderValue: 0,
        maximumDiscount: "",
        usageLimit: "",
        validFrom: "",
        validUntil: "",
      })

      fetchPromos()
    } catch (error) {
      const message =
        typeof error === "object" && error && "response" in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined

      toast({
        title: "Error",
        description: message || (error instanceof Error ? error.message : "Failed to create promo"),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const isPromoActive = (promo: PromoCode) => {
    const now = new Date()
    const validFrom = new Date(promo.validFrom)
    const validUntil = new Date(promo.validUntil)
    return promo.isActive && now >= validFrom && now <= validUntil
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Promo Codes</h1>
          <p className="text-muted-foreground mt-2">Create and manage promo codes</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Create Promo Code</CardTitle>
            <CardDescription>Configure discount type, value and validity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium block mb-2">Code</label>
                  <Input
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="SAVE20"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium block mb-2">Discount Type</label>
                  <select
                    value={formData.discountType}
                    onChange={(e) => setFormData({ ...formData, discountType: e.target.value as DiscountType })}
                    className="w-full h-10 px-3 border border-border rounded-md text-sm bg-background"
                    required
                  >
                    <option value="percentage">Percentage</option>
                    <option value="flat">Flat</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium block mb-2">Discount Value</label>
                  <Input
                    type="number"
                    min={0}
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: Number.parseFloat(e.target.value) || 0 })}
                    placeholder="20"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium block mb-2">Minimum Order Value</label>
                  <Input
                    type="number"
                    min={0}
                    value={formData.minimumOrderValue}
                    onChange={(e) =>
                      setFormData({ ...formData, minimumOrderValue: Number.parseFloat(e.target.value) || 0 })
                    }
                    placeholder="500"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium block mb-2">Maximum Discount (Optional)</label>
                  <Input
                    type="number"
                    min={0}
                    value={formData.maximumDiscount}
                    onChange={(e) => setFormData({ ...formData, maximumDiscount: e.target.value })}
                    placeholder="200"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium block mb-2">Usage Limit (Optional)</label>
                  <Input
                    type="number"
                    min={0}
                    value={formData.usageLimit}
                    onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                    placeholder="100"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium block mb-2">Valid From</label>
                  <Input
                    type="date"
                    value={formData.validFrom}
                    onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium block mb-2">Valid Until</label>
                  <Input
                    type="date"
                    value={formData.validUntil}
                    onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium block mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="20% off on orders above 500"
                  className="w-full px-3 py-2 border border-border rounded-md text-sm resize-none bg-background"
                  rows={3}
                  required
                />
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSubmit} className="bg-primary hover:bg-primary/90" disabled={isLoading}>
                  {isLoading ? "Creating..." : "Create Promo Code"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active & Ongoing Promo Codes</CardTitle>
            <CardDescription>View all available promo codes</CardDescription>
          </CardHeader>
          <CardContent>
            {isFetchingPromos ? (
              <div className="text-center py-8 text-muted-foreground">Loading promo codes...</div>
            ) : promos.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No promo codes found</div>
            ) : (
              <div className="space-y-4">
                {promos.map((promo) => (
                  <div
                    key={promo._id}
                    className="border border-border rounded-lg p-4 hover:bg-accent/5 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">{promo.code}</h3>
                          {isPromoActive(promo) ? (
                            <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20">Active</Badge>
                          ) : (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{promo.description}</p>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div>
                            <span className="text-muted-foreground">Discount:</span>
                            <p className="font-medium">
                              {promo.discountType === "percentage"
                                ? `${promo.discountValue}%`
                                : `₹${promo.discountValue}`}
                            </p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Min. Order:</span>
                            <p className="font-medium">₹{promo.minimumOrderValue}</p>
                          </div>
                          {promo.maximumDiscount && (
                            <div>
                              <span className="text-muted-foreground">Max. Discount:</span>
                              <p className="font-medium">₹{promo.maximumDiscount}</p>
                            </div>
                          )}
                          <div>
                            <span className="text-muted-foreground">Usage:</span>
                            <p className="font-medium">
                              {promo.usedCount}
                              {promo.usageLimit ? ` / ${promo.usageLimit}` : ""}
                            </p>
                          </div>
                        </div>

                        <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Valid: {formatDate(promo.validFrom)} - {formatDate(promo.validUntil)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}