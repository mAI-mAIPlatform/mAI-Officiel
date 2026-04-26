import { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { Gamepad2, ShoppingCart, Target, User, Users, Home, Ticket } from "lucide-react";
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
    { name: "Quêtes", href: "/quizzly/quests", icon: Target },
    { name: "Quizzly Pass", href: "/quizzly/pass", icon: Ticket },
    { name: "Boutique", href: "/quizzly/boutique", icon: ShoppingCart },
    { name: "Social", href: "/quizzly/social", icon: Users },
    { name: "Profil", href: "/quizzly/profile", icon: User },
  ];

  return (
    <div className="flex h-full w-full bg-slate-50 text-slate-900">
      {/* Sidebar */}
      <div className="w-64 border-r border-slate-200 bg-white flex flex-col">
        <div className="p-6 flex items-center gap-3 border-b border-slate-100">
          <Image src="/logo.png" alt="Quizzly" width={40} height={40} className="rounded-xl" />
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
      <div className="flex-1 overflow-y-auto relative">
        <div className="max-w-5xl mx-auto p-6 md:p-10">
          {children}
        </div>
      </div>
    </div>
  );
}
