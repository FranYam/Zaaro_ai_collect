import { ReactNode } from "react"
import { auth } from "@/../auth"
import { redirect } from "next/navigation"
import Sidebar from "@/components/ui/sidebar"

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await auth()
  if (!session?.user) {
    redirect("/login")
  }

  return (
    <div className="flex h-[100dvh] bg-[#F5F8FA] overflow-hidden">
      <Sidebar userName={session.user.name ?? "Utilisateur"} userRole={(session.user as { role?: string }).role ?? "USER"} />
      <main className="flex-1 overflow-auto p-4 md:p-8 pt-16 md:pt-8">
        {children}
      </main>
    </div>
  )
}
