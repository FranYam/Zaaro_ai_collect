"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { LayoutDashboard, Mic, History, LogOut, ChevronLeft, ChevronRight, Menu, X } from "lucide-react"
import { useState, useEffect } from "react"

const navItems = [
  { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/record", label: "Nouvelle contribution", icon: Mic },
  { href: "/history", label: "Historique", icon: History },
]

interface SidebarProps {
  userName: string
  userRole: string
}

export default function Sidebar({ userName, userRole }: SidebarProps) {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isOpenMobile, setIsOpenMobile] = useState(false)

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsOpenMobile(false)
  }, [pathname])

  return (
    <>
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[#F5F8FA] border-b border-slate-200 flex items-center px-4 z-30">
        <button 
          onClick={() => setIsOpenMobile(true)} 
          className="p-2 bg-white border border-slate-200 rounded-md shadow-sm text-slate-800"
          title="Ouvrir le menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <span className="ml-4 font-bold text-slate-800">Zaaro AI Collect</span>
      </div>

      {isOpenMobile && (
        <div 
          className="md:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm transition-opacity"
          onClick={() => setIsOpenMobile(false)}
        />
      )}

      <aside className={`bg-[#1A1A2E] flex flex-col py-6 h-screen border-r border-slate-800 shadow-2xl fixed md:relative z-50 transition-all duration-300 ease-in-out ${isOpenMobile ? "translate-x-0" : "-translate-x-full md:translate-x-0"} ${isCollapsed ? "md:w-20" : "md:w-64"} w-64`}>
      <div className={`flex items-center ${isCollapsed ? "justify-center" : "justify-between px-4"} mb-8`}>
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-lg">
            <Mic className="text-white w-5 h-5" />
          </div>
          {!isCollapsed && <span className="text-white font-semibold text-sm whitespace-nowrap">Zaaro AI Collect</span>}
        </div>
        <button
          onClick={() => setIsCollapsed((value) => !value)}
          className="hidden md:block ml-2 p-2 rounded-md text-slate-400 hover:text-white hover:bg-white/5 transition-all"
          title={isCollapsed ? "Déplier la barre" : "Replier la barre"}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
        <button
          onClick={() => setIsOpenMobile(false)}
          className="md:hidden ml-2 p-2 rounded-md text-slate-400 hover:text-white hover:bg-white/5 transition-all"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 w-full flex flex-col gap-2 px-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`group relative w-full h-14 flex items-center transition-all ${isCollapsed ? "justify-center" : "justify-start px-3 gap-3"} ${
                isActive
                  ? "bg-brand-green text-white"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon className="w-6 h-6 shrink-0" />
              {!isCollapsed && <span className="text-sm font-medium">{label}</span>}

              {isCollapsed && (
                <div className="hidden md:block absolute left-[calc(100%+10px)] top-1/2 -translate-y-1/2 px-3 py-2 bg-slate-800 text-white text-xs font-bold rounded-md opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl">
                  {label}
                  <div className="absolute left-[-4px] top-1/2 -translate-y-1/2 w-2 h-2 bg-slate-800 rotate-45"></div>
                </div>
              )}
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto w-full flex flex-col items-stretch gap-3 px-2">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className={`group relative w-full h-14 flex items-center text-slate-400 hover:text-white hover:bg-red-500/20 transition-all ${isCollapsed ? "justify-center" : "justify-start px-3 gap-3"}`}
        >
          <LogOut className="w-6 h-6 shrink-0" />
          {!isCollapsed && <span className="text-sm font-medium">Se déconnecter</span>}
          {isCollapsed && (
            <div className="hidden md:block absolute left-[calc(100%+10px)] top-1/2 -translate-y-1/2 px-3 py-2 bg-red-600 text-white text-xs font-bold rounded-md opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl">
              Se déconnecter
              <div className="absolute left-[-4px] top-1/2 -translate-y-1/2 w-2 h-2 bg-red-600 rotate-45"></div>
            </div>
          )}
        </button>

        <Link
          href="/profile"
          className={`group relative w-full h-14 flex items-center text-white transition-all ${isCollapsed ? "justify-center" : "justify-start px-3 gap-3"}`}
        >
          <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold text-sm border-2 border-slate-600 shadow-md hover:border-brand-green hover:bg-slate-600 transition-all shrink-0">
            {userName ? userName.charAt(0).toUpperCase() : "U"}
          </div>
          {!isCollapsed && <span className="text-sm font-medium">Profil</span>}
          {isCollapsed && (
            <div className="hidden md:block absolute left-[calc(100%+10px)] top-1/2 -translate-y-1/2 px-3 py-2 bg-slate-800 text-white text-xs font-bold rounded-md opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl">
              Profil
              <div className="absolute left-[-4px] top-1/2 -translate-y-1/2 w-2 h-2 bg-slate-800 rotate-45"></div>
            </div>
          )}
        </Link>
      </div>
    </aside>
    </>
  )
}
