"use client"

import type React from "react"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Menu, X, LogOut, Settings } from "lucide-react"

interface AdminLayoutProps {
  children: React.ReactNode
}

const navigationItems = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/products", label: "Products", icon: "📦" },
  { href: "/promos", label: "Promo Codes", icon: "🏷️" },
  { href: "/users", label: "Users", icon: "👥" },
  { href: "/orders", label: "Orders", icon: "🧾" },
]

export function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [authChecked, setAuthChecked] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const token = localStorage.getItem("admin_token")
    if (!token) {
      router.replace("/login")
      return
    }

    setAuthChecked(true)
  }, [router])

  const handleLogout = async () => {
    localStorage.removeItem("admin_token")
    toast({
      title: "Logged out",
      description: "You have been logged out successfully",
    })
    router.push("/login")
  }

  if (!authChecked) {
    return null
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={`${sidebarOpen ? "w-64" : "w-20"} border-r border-border bg-sidebar transition-all duration-300 flex flex-col`}
      >
        <div className="p-6 border-b border-sidebar-border flex items-center justify-between">
          <div className={`flex items-center gap-2 ${!sidebarOpen && "justify-center w-full"}`}>
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <span className="text-xl font-serif text-primary">अ</span>
            </div>
            {sidebarOpen && <span className="font-semibold text-sidebar-foreground">Ayurveda</span>}
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navigationItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <Button
                variant="ghost"
                className={`w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent/50 ${!sidebarOpen && "justify-center px-0"}`}
              >
                <span className="text-lg">{item.icon}</span>
                {sidebarOpen && item.label}
              </Button>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-sidebar-border space-y-2">
          <Button
            variant="ghost"
            size="sm"
            className={`w-full justify-start gap-2 text-sidebar-foreground ${!sidebarOpen && "justify-center px-0"}`}
          >
            <Settings className="w-4 h-4" />
            {sidebarOpen && "Settings"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`w-full justify-start gap-2 text-destructive hover:bg-destructive/10 ${!sidebarOpen && "justify-center px-0"}`}
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4" />
            {sidebarOpen && "Logout"}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="border-b border-border bg-card px-8 py-4 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-4">
            <div className="text-right text-sm">
              <p className="font-medium">Admin User</p>
              <p className="text-muted-foreground">admin@example.com</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
              A
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-secondary/5 p-8">{children}</main>
      </div>
    </div>
  )
}
