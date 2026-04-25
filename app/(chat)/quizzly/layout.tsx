import { BookOpenCheck, Trophy, Store, Users, UserCircle2, Database } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

const items = [
  { href: "/quizzly", label: "Quiz", icon: BookOpenCheck },
  { href: "/quizzly/social", label: "Social", icon: Users },
  { href: "/quizzly/boutique", label: "Boutique", icon: Store },
  { href: "/quizzly/quests", label: "Quêtes", icon: Trophy },
  { href: "/quizzly/profile", label: "Profil", icon: UserCircle2 },
  { href: "/quizzly/data", label: "Données", icon: Database },
];

export default function QuizzlyLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex h-full w-full max-w-7xl gap-4 p-4 md:p-8">
      <aside className="liquid-glass w-64 rounded-2xl p-3">
        <h2 className="px-2 py-2 text-xl font-bold">Quizzly</h2>
        <nav className="mt-2 space-y-1">
          {items.map((item) => (
            <Link className="flex items-center gap-2 rounded-lg border border-border/60 px-3 py-2 text-sm hover:bg-muted/50" href={item.href} key={item.href}>
              <item.icon className="size-4" /> {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
