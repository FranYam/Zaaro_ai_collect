"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { BarChart3, ShieldCheck, Languages, BookOpen, Users, LogOut, Settings, ChevronLeft, ChevronRight, Mic } from "lucide-react"
import { useState } from "react"

const adminNav = [
  { href: "/admin", label: "Vue d'ensemble", icon: BarChart3, exact: true },
  { href: "/admin/validation", label: "Validation", icon: ShieldCheck },
  { href: "/admin/languages", label: "Langues", icon: Languages },
  { href: "/admin/phrases", label: "Phrases", icon: BookOpen },
  { href: "/admin/users", label: "Utilisateurs", icon: Users },
]

export default function AdminSidebar({ userName }: { userName: string }) {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + "/")

  return (
    <aside className={`bg-[#1A1A2E] flex flex-col py-6 h-screen border-r border-slate-800 shadow-2xl relative z-50 transition-all duration-300 ${isCollapsed ? "w-20" : "w-64"}`}>
      <div className={`flex items-center ${isCollapsed ? "justify-center" : "justify-between px-4"} mb-8`}>
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-10 h-10 bg-brand-yellow rounded-full flex items-center justify-center shadow-lg">
            <Mic className="text-[#1A1A2E] w-5 h-5" />
          </div>
          {!isCollapsed && <span className="text-white font-semibold text-sm whitespace-nowrap">Zaaro AI Collect</span>}
        </div>
        <button
          onClick={() => setIsCollapsed((value) => !value)}
          className="ml-2 p-2 rounded-md text-slate-400 hover:text-white hover:bg-white/5 transition-all"
          title={isCollapsed ? "Déplier la barre" : "Replier la barre"}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      <nav className="flex-1 w-full flex flex-col gap-2 px-2">
        {adminNav.map(({ href, label, icon: Icon, exact }) => {
          const active = isActive(href, exact)
          return (
            <Link
              key={href}
              href={href}
              className={`group relative w-full h-14 flex items-center transition-all ${isCollapsed ? "justify-center" : "justify-start px-3 gap-3"} ${
                active
                  ? "bg-brand-yellow text-brand-green-dark"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon className="w-6 h-6 shrink-0" />
              {!isCollapsed && <span className="text-sm font-medium">{label}</span>}

              <div className="absolute left-[calc(100%+10px)] top-1/2 -translate-y-1/2 px-3 py-2 bg-slate-800 text-white text-xs font-bold rounded-md opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl">
                {label}
                <div className="absolute left-[-4px] top-1/2 -translate-y-1/2 w-2 h-2 bg-slate-800 rotate-45"></div>
              </div>
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
          <div className="absolute left-[calc(100%+10px)] top-1/2 -translate-y-1/2 px-3 py-2 bg-red-600 text-white text-xs font-bold rounded-md opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl">
            Se déconnecter
            <div className="absolute left-[-4px] top-1/2 -translate-y-1/2 w-2 h-2 bg-red-600 rotate-45"></div>
          </div>
        </button>

        <div className={`flex items-center ${isCollapsed ? "justify-center" : "justify-start px-3 gap-3"}`}>
          <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold text-sm border-2 border-brand-yellow shadow-md shrink-0">
            {userName ? userName.charAt(0).toUpperCase() : "A"}
          </div>
          {!isCollapsed && <span className="text-sm font-medium text-white">{userName || "Admin"}</span>}
        </div>
      </div>
    </aside>
  )
}
