import { ReactNode } from "react"
import { auth } from "@/../auth"
import { redirect } from "next/navigation"
import AdminSidebar from "@/components/ui/admin-sidebar"

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await auth()

  if (!session?.user) redirect("/login")
  if ((session.user as { role?: string }).role !== "ADMIN") redirect("/dashboard")

  return (
    <div className="flex h-screen bg-[#F5F8FA]">
      <AdminSidebar userName={session.user.name ?? "Admin"} />
      <main className="flex-1 overflow-auto p-8">
        {children}
      </main>
    </div>
  )
}
