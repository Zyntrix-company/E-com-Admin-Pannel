"use client"

import { useEffect, useState } from "react"
import { AdminLayout } from "@/components/admin-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { axiosInstance } from "@/lib/axios"
import { AlertCircle, MoreVertical, CheckCircle, XCircle, Download } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface User {
  id: string
  name: string
  email: string
  phone: string
  address?: string
  addressCount: number
  isActive: boolean
  createdAt: string
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDownloading, setIsDownloading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [toggleDialogOpen, setToggleDialogOpen] = useState(false)
  const [userToToggle, setUserToToggle] = useState<User | null>(null)
  const { toast } = useToast()

  const fetchUsers = async () => {
    try {
      const response = await axiosInstance.get("/admin/users")
      const payload = response.data as unknown
      const list =
        Array.isArray(payload)
          ? payload
          : Array.isArray((payload as { users?: unknown })?.users)
            ? (payload as { users: unknown[] }).users
            : Array.isArray((payload as { data?: unknown })?.data)
              ? ((payload as { data: unknown[] }).data as unknown[])
              : Array.isArray((payload as { data?: { users?: unknown } })?.data?.users)
                ? ((payload as { data: { users: unknown[] } }).data.users as unknown[])
                : []

      const normalized = (list as unknown[]).map((raw) => {
        if (!raw || typeof raw !== "object") return raw
        const obj = raw as Record<string, unknown>
        const normalizedId =
          (typeof obj.id === "string" && obj.id) ||
          (typeof obj._id === "string" && obj._id) ||
          (typeof obj.userId === "string" && obj.userId) ||
          ""

        return {
          ...obj,
          id: normalizedId,
        }
      })

      setUsers(normalized as User[])
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleToggleStatus = async () => {
    if (!userToToggle) return
    if (!userToToggle.id) {
      toast({
        title: "Error",
        description: "Cannot update this user because their id is missing in the API response",
        variant: "destructive",
      })
      return
    }

    try {
      await axiosInstance.patch(`/admin/users/${userToToggle.id}/toggle-status`)

      setUsers(users.map((u) => (u.id === userToToggle.id ? { ...u, isActive: !u.isActive } : u)))

      toast({
        title: "Success",
        description: `User ${userToToggle.isActive ? "disabled" : "enabled"} successfully. ${
          !userToToggle.isActive ? "They can now log in again." : "They will not be able to log in."
        }`,
      })

      setToggleDialogOpen(false)
      setUserToToggle(null)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to toggle user status",
        variant: "destructive",
      })
    }
  }

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.phone.includes(searchQuery),
  )

  const escapeCsvValue = (value: unknown) => {
    if (value === null || value === undefined) return ""
    const str = typeof value === "string" ? value : typeof value === "number" || typeof value === "boolean" ? String(value) : JSON.stringify(value)
    const escaped = str.replace(/\r\n|\r|\n/g, " ").replace(/"/g, '""')
    return `"${escaped}"`
  }

  const downloadCsv = () => {
    if (users.length === 0) return

    setIsDownloading(true)
    try {
      const rows = users as unknown as Array<Record<string, unknown>>

      const preferred = ["id", "name", "email", "phone", "address", "addressCount", "isActive", "createdAt"]
      const keys = new Set<string>()
      rows.forEach((r) => Object.keys(r || {}).forEach((k) => keys.add(k)))

      const otherKeys = Array.from(keys)
        .filter((k) => !preferred.includes(k))
        .sort((a, b) => a.localeCompare(b))

      const headers = [...preferred.filter((k) => keys.has(k)), ...otherKeys]

      const csv = [
        headers.map(escapeCsvValue).join(","),
        ...rows.map((r) => headers.map((h) => escapeCsvValue(r?.[h])).join(",")),
      ].join("\n")

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `users-${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "Success",
        description: "Users CSV downloaded successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to download CSV",
        variant: "destructive",
      })
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">User Management</h1>
            <p className="text-muted-foreground mt-2">Manage user accounts and access</p>
          </div>
          <Button
            variant="outline"
            className="gap-2 w-full sm:w-auto"
            onClick={downloadCsv}
            disabled={isLoading || isDownloading || users.length === 0}
          >
            <Download className="w-4 h-4" />
            {isDownloading ? "Preparing..." : "Download CSV"}
          </Button>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <Input
              placeholder="Search by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
          </CardContent>
        </Card>

        {/* Users Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{users.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Users</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-primary">{users.filter((u) => u.isActive).length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Disabled Users</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-red-600">{users.filter((u) => !u.isActive).length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>Users List</CardTitle>
            <CardDescription>
              Showing {filteredUsers.length} of {users.length} users
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex gap-4 py-4 border-b last:border-b-0">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-60" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No users found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-medium text-sm">Name</th>
                      <th className="text-left py-3 px-4 font-medium text-sm">Email</th>
                      <th className="text-left py-3 px-4 font-medium text-sm">Phone</th>
                      <th className="text-center py-3 px-4 font-medium text-sm">Addresses</th>
                      <th className="text-center py-3 px-4 font-medium text-sm">Status</th>
                      <th className="text-right py-3 px-4 font-medium text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="border-b border-border hover:bg-secondary/30 transition-colors">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                            <p className="font-medium">{user.name}</p>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-sm text-muted-foreground">{user.email}</td>
                        <td className="py-4 px-4 text-sm text-muted-foreground">{user.phone}</td>
                        <td className="py-4 px-4 text-center">
                          <span className="text-sm bg-secondary/50 px-2 py-1 rounded">{user.addressCount} saved</span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <div
                            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
                              user.isActive ? "bg-green-100/80 text-green-700" : "bg-red-100/80 text-red-700"
                            }`}
                          >
                            {user.isActive ? (
                              <>
                                <CheckCircle className="w-3 h-3" />
                                Active
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3 h-3" />
                                Disabled
                              </>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  setUserToToggle(user)
                                  setToggleDialogOpen(true)
                                }}
                                className="cursor-pointer"
                              >
                                {user.isActive ? "Disable User" : "Enable User"}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Toggle Status Confirmation Dialog */}
      <Dialog open={toggleDialogOpen} onOpenChange={setToggleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              {userToToggle?.isActive ? "Disable User" : "Enable User"}
            </DialogTitle>
            <DialogDescription>
              {userToToggle?.isActive ? (
                <div className="space-y-2 mt-2">
                  <p>Are you sure you want to disable "{userToToggle?.name}"?</p>
                  <p className="text-sm">
                    Once disabled, they will not be able to log in to their account. Their data will remain intact.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 mt-2">
                  <p>Are you sure you want to enable "{userToToggle?.name}"?</p>
                  <p className="text-sm">They will be able to log in to their account again.</p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setToggleDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleToggleStatus}
              className={userToToggle?.isActive ? "bg-red-600 hover:bg-red-700" : "bg-primary hover:bg-primary/90"}
            >
              {userToToggle?.isActive ? "Disable User" : "Enable User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}
