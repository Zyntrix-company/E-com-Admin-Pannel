"use client"

import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { axiosInstance } from "@/lib/axios"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Camera, CheckCircle, AlertCircle, Loader2, Link as LinkIcon, FileText } from "lucide-react"

interface OrderAuditDialogProps {
    order: any
    open: boolean
    onOpenChangeAction: (open: boolean) => void
    onSuccessAction: () => void
}

export function OrderAuditDialog({ order, open, onOpenChangeAction, onSuccessAction }: OrderAuditDialogProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [formData, setFormData] = useState({
        status: order.audit?.status || "pending",
        transactionId: order.audit?.transactionId || order.paymentId || "",
        shippingPartnerPaymentId: order.audit?.shippingPartnerPaymentId || "",
        accountantRemarks: order.audit?.accountantRemarks || "",
        paymentScreenshot: order.audit?.paymentScreenshot || ""
    })

    const { toast } = useToast()

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = async () => {
            setFormData(prev => ({ ...prev, paymentScreenshot: reader.result as string }))
        }
        reader.readAsDataURL(file)
    }

    const handleUpdateAudit = async () => {
        setIsLoading(true)
        try {
            await axiosInstance.patch(`/admin/orders/${order._id || order.id}/audit`, formData)
            toast({ title: "Success", description: "Audit records updated" })
            onSuccessAction()
        } catch (error) {
            toast({ title: "Error", description: "Failed to update audit data", variant: "destructive" })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChangeAction}>
            <DialogContent className="max-w-xl border-none shadow-2xl rounded-[2rem]">
                <DialogHeader>
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                        <Camera className="w-6 h-6 text-primary" />
                    </div>
                    <DialogTitle className="text-2xl font-black tracking-tight underline decoration-primary/20 underline-offset-8">
                        Order Audit: {order.orderId}
                    </DialogTitle>
                    <DialogDescription className="font-bold text-muted-foreground pt-2">
                        Verification for {order.paymentMethod.toUpperCase()} transaction of ₹{order.totalAmount}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-2">Audit Status</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {['pending', 'verified', 'discrepancy'].map((s) => (
                                        <button
                                            key={s}
                                            onClick={() => setFormData({ ...formData, status: s })}
                                            className={`px-2 py-3 rounded-xl border text-[9px] font-black uppercase tracking-wider transition-all ${formData.status === s
                                                ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
                                                : "bg-white border-secondary text-muted-foreground hover:bg-secondary/20"
                                                }`}
                                        >
                                            {s === 'discrepancy' ? 'Error' : s}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-2">Gateways/Txn ID</label>
                                <div className="relative">
                                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        value={formData.transactionId}
                                        onChange={(e) => setFormData({ ...formData, transactionId: e.target.value })}
                                        placeholder="Bank Ref / PSP ID"
                                        className="bg-secondary/20 border-none h-11 pl-10 text-sm font-bold"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-2">Shipping Partner Ref</label>
                                <div className="relative">
                                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        value={formData.shippingPartnerPaymentId}
                                        onChange={(e) => setFormData({ ...formData, shippingPartnerPaymentId: e.target.value })}
                                        placeholder="Delhivery/Shiprocket ID"
                                        className="bg-secondary/20 border-none h-11 pl-10 text-sm font-bold"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-2">Payment Evidence</label>
                                <div
                                    onClick={() => document.getElementById('audit-image-upload')?.click()}
                                    className="w-full aspect-square rounded-[2rem] border-2 border-dashed border-secondary/50 bg-secondary/5 flex flex-col items-center justify-center cursor-pointer overflow-hidden group hover:bg-secondary/10 transition-colors"
                                >
                                    {formData.paymentScreenshot ? (
                                        <img src={formData.paymentScreenshot} className="w-full h-full object-cover" />
                                    ) : (
                                        <>
                                            <Camera className="w-8 h-8 text-muted-foreground/30 mb-2 group-hover:scale-110 transition-transform" />
                                            <p className="text-[10px] font-black text-muted-foreground/50 uppercase">Upload Screenshot</p>
                                        </>
                                    )}
                                </div>
                                <input
                                    id="audit-image-upload"
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleImageUpload}
                                />
                            </div>
                        </div>
                    </div>

                    <Separator />

                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-2">Accounting Remarks</label>
                        <textarea
                            value={formData.accountantRemarks}
                            onChange={(e) => setFormData({ ...formData, accountantRemarks: e.target.value })}
                            placeholder="Discrepancy details or verification notes..."
                            className="w-full h-24 px-4 py-3 bg-secondary/20 border-none rounded-2xl text-sm font-bold resize-none focus:ring-2 focus:ring-primary/20"
                        />
                    </div>
                </div>

                <DialogFooter className="gap-3">
                    <Button variant="ghost" className="font-bold text-xs" onClick={() => onOpenChangeAction(false)}>Cancel</Button>
                    <Button className="bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 rounded-xl px-8 font-black text-xs uppercase tracking-widest" onClick={handleUpdateAudit} disabled={isLoading}>
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Save Audit Data"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
