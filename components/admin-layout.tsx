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
  { href: "/orders/process", label: "Process Orders", icon: "⚙️" },
  { href: "/catalogues", label: "Catalogues", icon: "📚" },
  { href: "/reports", label: "Reports", icon: "📈" },
  { href: "/orders/audit", label: "Audit", icon: "⚖️" },
]

export function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
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

  useEffect(() => {
    if (typeof window === "undefined") return

    const media = window.matchMedia("(max-width: 1024px)") // Professional dashboards often use 1024px for mobile/tablet breakpoint
    const update = () => {
      setIsMobile(media.matches)
      if (media.matches) {
        setSidebarOpen(false)
      }
    }

    update()

    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", update)
      return () => media.removeEventListener("change", update)
    }

    media.addListener(update)
    return () => media.removeListener(update)
  }, [])

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
    <div className="flex min-h-screen bg-background font-sans">
      {isMobile && sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 bg-black/40 z-30 transition-opacity"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close sidebar"
        />
      )}
      {/* Sidebar */}
      <aside
        onMouseEnter={() => !isMobile && setSidebarOpen(true)}
        onMouseLeave={() => !isMobile && setSidebarOpen(false)}
        className={`${isMobile
          ? `fixed left-0 top-0 bottom-0 z-40 w-64 border-r border-border bg-sidebar transition-transform duration-300 flex flex-col ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`
          : `${sidebarOpen ? "w-64" : "w-22"} border-r border-border bg-sidebar shadow-sm transition-all duration-300 ease-in-out flex flex-col z-40`
          }`}
      >
        <div className="p-6 border-b border-sidebar-border flex items-center justify-between overflow-hidden">
          <div className={`flex items-center gap-3 ${!sidebarOpen && !isMobile && "justify-center w-full"}`}>
            <div className="w-10 h-10 shrink-0 rounded-xl bg-primary flex items-center justify-center shadow-lg">
              <span className="text-xl font-serif text-white">अ</span>
            </div>
            {(sidebarOpen || (isMobile && sidebarOpen)) && (
              <span className="font-bold text-xl tracking-tight text-foreground truncate whitespace-nowrap">
                Ayurveda
              </span>
            )}
          </div>
        </div>

        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
          {navigationItems.map((item) => (
            <Link key={item.href} href={item.href} className="block">
              <Button
                variant="ghost"
                className={`w-full justify-start gap-4 text-foreground/80 rounded-xl transition-all duration-200 hover:bg-secondary hover:text-primary group ${!sidebarOpen && !isMobile ? "justify-center px-0 h-14" : "px-4 h-12"
                  }`}
                onClick={() => {
                  if (isMobile) setSidebarOpen(false)
                }}
              >
                <span className="text-2xl group-hover:scale-110 transition-transform duration-200">{item.icon}</span>
                {(sidebarOpen || (isMobile && sidebarOpen)) && (
                  <span className="font-semibold text-sm tracking-tight whitespace-nowrap">{item.label}</span>
                )}
              </Button>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-sidebar-border space-y-2">
          <Link href="/settings" className="block w-full">
            <Button
              variant="ghost"
              size="sm"
              className={`w-full justify-start gap-3 text-foreground/70 rounded-lg hover:bg-secondary hover:text-primary ${!sidebarOpen && !isMobile ? "justify-center px-0" : "px-3"
                }`}
            >
              <Settings className="w-5 h-5 shrink-0" />
              {(sidebarOpen || (isMobile && sidebarOpen)) && <span className="font-medium text-sm">Settings</span>}
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            className={`w-full justify-start gap-3 text-destructive/80 rounded-lg hover:bg-destructive/10 hover:text-destructive ${!sidebarOpen && !isMobile ? "justify-center px-0" : "px-3"
              }`}
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {(sidebarOpen || (isMobile && sidebarOpen)) && <span className="font-medium text-sm">Logout</span>}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-background">
        {/* Top Header */}
        <header className="sticky top-0 z-20 border-b border-border bg-white px-6 py-4 flex items-center justify-between shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
          <div className="flex items-center gap-4">
            {isMobile && (
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-secondary rounded-xl transition-colors"
                aria-label="Toggle menu"
              >
                <Menu className="w-6 h-6 text-foreground" />
              </button>
            )}
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest hidden sm:block">Admin Dashboard</h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="font-bold text-sm text-foreground">Admin User</p>
              <p className="text-xs text-muted-foreground">admin@example.com</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-primary font-bold border border-border shadow-sm">
              A
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-secondary/5 p-6 md:p-8">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
