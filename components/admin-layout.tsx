"use client"

import type React from "react"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import {
  Menu, X, LogOut, Settings, Search, Bell,
  LayoutDashboard, Package, Tag, Users, ShoppingBag,
  Cog, BookOpen, BarChart3, FileCheck, Star
} from "lucide-react"

interface AdminLayoutProps {
  children: React.ReactNode
}

const navigationItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/products", label: "Products", icon: Package },
  { href: "/promos", label: "Promo Codes", icon: Tag },
  { href: "/users", label: "Users", icon: Users },
  { href: "/orders", label: "Orders", icon: ShoppingBag },
  { href: "/orders/process", label: "Process Orders", icon: Cog },
  { href: "/reviews", label: "Reviews", icon: Star },
  { href: "/catalogues", label: "Catalogues", icon: BookOpen },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/orders/audit", label: "Audit", icon: FileCheck },
]

export function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const { toast } = useToast()

  const isSidebarExpanded = isMobile ? sidebarOpen : isHovered

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

    const media = window.matchMedia("(max-width: 1024px)")
    const update = () => {
      setIsMobile(media.matches)
      setSidebarOpen(false)
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
    <div className="flex min-h-screen bg-slate-50">
      {/* Mobile Overlay */}
      {isMobile && sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close sidebar"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`${isMobile
          ? `fixed left-0 top-0 bottom-0 z-50 w-64 bg-white border-r border-slate-200 transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`
          : `fixed left-0 top-0 bottom-0 z-40 ${isSidebarExpanded ? "w-64" : "w-20"} bg-white border-r border-slate-200 transition-all duration-300 ease-in-out shadow-sm`
          } flex flex-col overflow-hidden`}
        onMouseEnter={() => !isMobile && setIsHovered(true)}
        onMouseLeave={() => !isMobile && setIsHovered(false)}
      >
        {/* Logo */}
        <div className="h-16 px-6 flex items-center border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-3 min-w-0">

            {isSidebarExpanded && (
              <span className="font-bold text-lg text-slate-800 truncate transition-opacity duration-300">
                Tayyiba Naturals
              </span>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto overflow-x-hidden scrollbar-none">
          {navigationItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant="ghost"
                  className={`w-full ${isSidebarExpanded ? "justify-start" : "justify-center"
                    } gap-3 h-11 rounded-lg transition-all ${isActive
                      ? "bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  onClick={() => {
                    if (isMobile) setSidebarOpen(false)
                  }}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  {isSidebarExpanded && (
                    <span className="font-medium text-sm truncate">{item.label}</span>
                  )}
                </Button>
              </Link>
            )
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="p-3 border-t border-slate-200 space-y-1 shrink-0">
          <Link href="/settings">
            <Button
              variant="ghost"
              className={`w-full ${isSidebarExpanded ? "justify-start" : "justify-center"
                } gap-3 h-11 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900`}
            >
              <Settings className="w-5 h-5 shrink-0" />
              {isSidebarExpanded && <span className="font-medium text-sm">Settings</span>}
            </Button>
          </Link>
          <Button
            variant="ghost"
            className={`w-full ${isSidebarExpanded ? "justify-start" : "justify-center"
              } gap-3 h-11 rounded-lg text-rose-600 hover:bg-rose-50 hover:text-rose-700`}
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {isSidebarExpanded && <span className="font-medium text-sm">Logout</span>}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${!isMobile ? "pl-20" : ""}`}>
        {/* Top Header */}
        <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4 flex-1">
            {isMobile && (
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                aria-label="Toggle menu"
              >
                <Menu className="w-5 h-5 text-slate-600" />
              </button>
            )}

            {/* Search Bar */}
            <div className="relative max-w-md w-full hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                type="search"
                placeholder="Search..."
                className="pl-10 h-10 bg-slate-50 border-slate-200 focus:bg-white focus:border-indigo-300 focus:ring-indigo-200 rounded-lg"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Notifications */}
            <button className="relative p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <Bell className="w-5 h-5 text-slate-600" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-500 rounded-full"></span>
            </button>

            {/* Profile */}
            <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
              <div className="text-right hidden sm:block">
                <p className="font-semibold text-sm text-slate-800">Admin User</p>
                <p className="text-xs text-slate-500">admin@example.com</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                A
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-slate-50">
          {children}
        </main>
      </div>
    </div>
  )
}
