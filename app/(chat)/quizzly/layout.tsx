import { ReactNode } from "react";
import Link from "next/link";
import { Gamepad2, ShoppingCart, Target, User, Users, Home, Ticket, Settings, BarChart3, Brain, Network } from "lucide-react";
import { getQuizzlyProfile } from "@/lib/quizzly/actions";
import { redirect } from "next/navigation";

export default async function QuizzlyLayout({ children }: { children: ReactNode }) {
  let profile;
  try {
    profile = await getQuizzlyProfile();
  } catch {
    redirect("/login");
  }

  const navItems = [
    { name: "Accueil", href: "/quizzly", icon: Home },
    { name: "Jouer", href: "/quizzly/play", icon: Gamepad2 },
    { name: "Parcours", href: "/quizzly/learning", icon: Network },
    { name: "Quêtes", href: "/quizzly/quests", icon: Target },
    { name: "Quizzly Pass", href: "/quizzly/pass", icon: Ticket },
    { name: "Boutique", href: "/quizzly/boutique", icon: ShoppingCart },
    { name: "Social", href: "/quizzly/social", icon: Users },
    { name: "Stats", href: "/quizzly/stats", icon: BarChart3 },
    { name: "Profil", href: "/quizzly/profile", icon: User },
    { name: "Paramètres", href: "/quizzly/settings", icon: Settings },
  ];

  return (
    <div className="flex h-full w-full bg-slate-50 text-slate-900">
      {/* Sidebar */}
      <div className="sticky top-0 hidden h-screen w-64 border-r border-slate-200 bg-white md:flex md:flex-col">
        <div className="p-6 flex items-center gap-3 border-b border-slate-100">
          <div className="rounded-xl bg-violet-100 p-2 text-violet-700">
            <Brain className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-black text-xl text-violet-700 tracking-tight">Quizzly</h1>
            <p className="text-xs text-slate-500 font-medium">Niv {profile.level} • {profile.diamonds} 💎</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-violet-50 hover:text-violet-700 transition-colors text-slate-600 font-semibold"
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </Link>
          ))}
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="relative flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl p-4 pb-28 md:p-10 md:pb-10">
          {children}
        </div>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-2 py-2 backdrop-blur md:hidden">
        <div className="grid grid-cols-4 gap-1">
          {navItems.slice(0, 8).map((item) => (
            <Link
              key={`mobile-${item.name}`}
              href={item.href}
              className="flex flex-col items-center justify-center gap-1 rounded-lg px-1 py-2 text-[11px] font-semibold text-slate-600 transition-colors hover:bg-violet-50 hover:text-violet-700"
            >
              <item.icon className="h-4 w-4" />
              <span className="truncate">{item.name}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
