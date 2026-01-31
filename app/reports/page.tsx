"use client"

import { useState, useEffect } from "react"
import { AdminLayout } from "@/components/admin-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { axiosInstance } from "@/lib/axios"
import { FileDown, Search, Filter, FileText, Download, Table } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function ReportsPage() {
    const [month, setMonth] = useState(new Date().getMonth() + 1 + "")
    const [year, setYear] = useState(new Date().getFullYear() + "")
    const [selectedState, setSelectedState] = useState("all")
    const [isLoading, setIsLoading] = useState(false)
    const [reportData, setReportData] = useState<any[]>([])
    const [searchOrderId, setSearchOrderId] = useState("")
    const { toast } = useToast()

    const indianStates = [
        { code: "AN", name: "Andaman and Nicobar Islands" },
        { code: "AP", name: "Andhra Pradesh" },
        { code: "AR", name: "Arunachal Pradesh" },
        { code: "AS", name: "Assam" },
        { code: "BR", name: "Bihar" },
        { code: "CH", name: "Chandigarh" },
        { code: "CT", name: "Chhattisgarh" },
        { code: "DN", name: "Dadra and Nagar Haveli" },
        { code: "DD", name: "Daman and Diu" },
        { code: "DL", name: "Delhi" },
        { code: "GA", name: "Goa" },
        { code: "GJ", name: "Gujarat" },
        { code: "HR", name: "Haryana" },
        { code: "HP", name: "Himachal Pradesh" },
        { code: "JK", name: "Jammu and Kashmir" },
        { code: "JH", name: "Jharkhand" },
        { code: "KA", name: "Karnataka" },
        { code: "KL", name: "Kerala" },
        { code: "LA", name: "Ladakh" },
        { code: "LD", name: "Lakshadweep" },
        { code: "MP", name: "Madhya Pradesh" },
        { code: "MH", name: "Maharashtra" },
        { code: "MN", name: "Manipur" },
        { code: "ML", name: "Meghalaya" },
        { code: "MZ", name: "Mizoram" },
        { code: "NL", name: "Nagaland" },
        { code: "OR", name: "Odisha" },
        { code: "PY", name: "Puducherry" },
        { code: "PB", name: "Punjab" },
        { code: "RJ", name: "Rajasthan" },
        { code: "SK", name: "Sikkim" },
        { code: "TN", name: "Tamil Nadu" },
        { code: "TG", name: "Telangana" },
        { code: "TR", name: "Tripura" },
        { code: "UP", name: "Uttar Pradesh" },
        { code: "UT", name: "Uttarakhand" },
        { code: "WB", name: "West Bengal" },
    ]

    const fetchGSTReport = async () => {
        setIsLoading(true)
        try {
            const response = await axiosInstance.get(`/admin/reports/gst?month=${month}&year=${year}&state=${selectedState}`)
            setReportData(response.data.data)
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to fetch GST report",
                variant: "destructive",
            })
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchGSTReport()
    }, [month, year, selectedState])

    const handleDownloadCSV = async () => {
        try {
            const response = await axiosInstance.get(`/admin/reports/gst/download?month=${month}&year=${year}&state=${selectedState}`, {
                responseType: 'blob'
            })
            const url = window.URL.createObjectURL(new Blob([response.data]))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', `gst-report-${month}-${year}${selectedState !== 'all' ? `-${selectedState}` : ''}.csv`)
            document.body.appendChild(link)
            link.click()
            link.remove()
        } catch (error) {
            toast({
                title: "Download Failed",
                description: "Could not generate CSV report",
                variant: "destructive",
            })
        }
    }

    const handleDownloadInvoice = async (orderId: string) => {
        if (!orderId) return
        try {
            // We need to find the internal MongoDB ID if the user enters the friendly Order ID
            // For now, let's assume searches are by friendly ID and find the order first
            const ordersRes = await axiosInstance.get('/admin/orders')
            const allOrders = ordersRes.data.orders || []
            const order = allOrders.find((o: any) => o.orderId === orderId || o._id === orderId)

            if (!order) {
                toast({ title: "Not Found", description: "Order not found", variant: "destructive" })
                return
            }

            const response = await axiosInstance.get(`/admin/orders/${order._id || order.id}/invoice`, {
                responseType: 'blob'
            })
            const url = window.URL.createObjectURL(new Blob([response.data]))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', `invoice-${order.orderId}.pdf`)
            document.body.appendChild(link)
            link.click()
            link.remove()
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to download invoice",
                variant: "destructive",
            })
        }
    }

    const months = [
        { value: "1", label: "January" },
        { value: "2", label: "February" },
        { value: "3", label: "March" },
        { value: "4", label: "April" },
        { value: "5", label: "May" },
        { value: "6", label: "June" },
        { value: "7", label: "July" },
        { value: "8", label: "August" },
        { value: "9", label: "September" },
        { value: "10", label: "October" },
        { value: "11", label: "November" },
        { value: "12", label: "December" },
    ]

    const years = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - i).toString())

    return (
        <AdminLayout>
            <div className="space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-foreground tracking-tight">Financial Reports</h1>
                        <p className="text-muted-foreground text-sm font-medium italic">Generate and export GST reports and invoices</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* GST Report Section */}
                    <Card className="lg:col-span-2 border-none shadow-xl bg-white rounded-[2rem] overflow-hidden">
                        <CardHeader className="bg-primary/5 pb-8">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-2xl font-black text-primary">GST Report</CardTitle>
                                    <CardDescription className="font-bold text-primary/60">Monthly order-wise taxation details</CardDescription>
                                </div>
                                <Button
                                    onClick={handleDownloadCSV}
                                    className="bg-primary hover:bg-primary/90 gap-2 shadow-lg shadow-primary/20"
                                    disabled={reportData.length === 0}
                                >
                                    <FileDown className="w-4 h-4" />
                                    Export CSV
                                </Button>
                            </div>

                            <div className="flex flex-wrap gap-4 mt-6">
                                <div className="w-48">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-primary/50 mb-1.5 block">Select Month</label>
                                    <Select value={month} onValueChange={setMonth}>
                                        <SelectTrigger className="bg-white border-primary/10 rounded-xl font-bold">
                                            <SelectValue placeholder="Month" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {months.map(m => (
                                                <SelectItem key={m.value} value={m.value} className="font-bold">{m.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="w-32">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-primary/50 mb-1.5 block">Select Year</label>
                                    <Select value={year} onValueChange={setYear}>
                                        <SelectTrigger className="bg-white border-primary/10 rounded-xl font-bold">
                                            <SelectValue placeholder="Year" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {years.map(y => (
                                                <SelectItem key={y} value={y} className="font-bold">{y}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="w-48">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-primary/50 mb-1.5 block">Select State</label>
                                    <Select value={selectedState} onValueChange={setSelectedState}>
                                        <SelectTrigger className="bg-white border-primary/10 rounded-xl font-bold">
                                            <SelectValue placeholder="All States" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all" className="font-bold">All States</SelectItem>
                                            {indianStates.map(state => (
                                                <SelectItem key={state.code} value={state.name} className="font-bold">{state.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-secondary/30">
                                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Order ID</th>
                                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">State</th>
                                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Taxable Value</th>
                                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Tax</th>
                                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {isLoading ? (
                                            [...Array(5)].map((_, i) => (
                                                <tr key={i} className="animate-pulse">
                                                    <td colSpan={5} className="px-6 py-4"><div className="h-4 bg-muted rounded w-full" /></td>
                                                </tr>
                                            ))
                                        ) : reportData.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-20 text-center">
                                                    <Table className="w-12 h-12 mx-auto mb-2 opacity-10" />
                                                    <p className="text-sm font-bold text-muted-foreground">No data for this period</p>
                                                </td>
                                            </tr>
                                        ) : (
                                            reportData.map((row, i) => (
                                                <tr key={i} className="hover:bg-secondary/10 transition-colors">
                                                    <td className="px-6 py-4 text-xs font-black text-foreground">{row.order_id}</td>
                                                    <td className="px-6 py-4 text-xs font-bold text-muted-foreground">{row.customer_delivery_state_code}</td>
                                                    <td className="px-6 py-4 text-xs font-bold text-foreground">₹{row.base_value}</td>
                                                    <td className="px-6 py-4 text-xs font-bold text-primary">₹{row.tax_amount}</td>
                                                    <td className="px-6 py-4 text-xs font-black text-foreground">₹{row.invoiceamount}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quick Invoice Download */}
                    <div className="space-y-6">
                        <Card className="border-none shadow-xl bg-[#2D2D2D] text-white rounded-[2rem]">
                            <CardHeader>
                                <CardTitle className="text-xl font-black flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-emerald-400" />
                                    Invoice Download
                                </CardTitle>
                                <CardDescription className="text-white/60 font-medium">Quickly download order invoices as PDF</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Enter Order ID</label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                                        <Input
                                            placeholder="e.g. ORD-12345"
                                            className="bg-white/10 border-white/10 text-white pl-10 h-12 rounded-xl focus:ring-emerald-500/50"
                                            value={searchOrderId}
                                            onChange={(e) => setSearchOrderId(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <Button
                                    onClick={() => handleDownloadInvoice(searchOrderId)}
                                    className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-black gap-2 transition-transform active:scale-95 shadow-lg shadow-emerald-500/20"
                                >
                                    <Download className="w-4 h-4" />
                                    Generate Invoice
                                </Button>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-xl bg-primary text-white rounded-[2rem]">
                            <CardContent className="p-8">
                                <h4 className="text-xs font-black uppercase tracking-widest text-white/40 mb-2">Month Summary</h4>
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-3xl font-black">₹{reportData.reduce((acc, r) => acc + parseFloat(r.invoiceamount), 0).toLocaleString()}</p>
                                        <p className="text-xs font-bold text-white/60 uppercase tracking-wider">Total Gross Revenue</p>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-black text-emerald-400">₹{reportData.reduce((acc, r) => acc + parseFloat(r.tax_amount), 0).toLocaleString()}</p>
                                        <p className="text-xs font-bold text-white/60 uppercase tracking-wider">Total tax liability</p>
                                    </div>
                                    <div className="pt-4 border-t border-white/10 flex justify-between">
                                        <div>
                                            <p className="text-lg font-black">{reportData.length}</p>
                                            <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Orders</p>
                                        </div>
                                        <div>
                                            <p className="text-lg font-black">{new Set(reportData.map(r => r.customer_delivery_state_code)).size}</p>
                                            <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider">States</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AdminLayout>
    )
}
