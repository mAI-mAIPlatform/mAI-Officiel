import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useSubscriptionPlan } from "@/hooks/use-subscription-plan";
import { greetingPrompts } from "@/lib/constants";
import { PlanUpgradeCTA } from "./plan-upgrade-cta";

const SHORTCUTS_STORAGE_KEY = "mai.home.shortcuts.v1";

type HomeShortcut = {
  hidden?: boolean;
  href: string;
  id: string;
  label: string;
};

const defaultShortcuts: HomeShortcut[] = [
  { id: "studio", label: "Studio d'images", href: "/studio" },
  { id: "news", label: "Actualités", href: "/news" },
  { id: "coder", label: "Coder", href: "/coder" },
  { id: "library", label: "Bibliothèque", href: "/library" },
  { id: "settings", label: "Réglages", href: "/settings" },
];

export const Greeting = () => {
  const [greetingText, setGreetingText] = useState<string>(greetingPrompts[0]);
  const [timePrefix, setTimePrefix] = useState<string>("");
  const [shortcuts, setShortcuts] = useState<HomeShortcut[]>(defaultShortcuts);
  const { isHydrated, plan } = useSubscriptionPlan();

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setTimePrefix("Bonjour");
    } else if (hour < 18) {
      setTimePrefix("Bon après-midi");
    } else {
      setTimePrefix("Bonsoir");
    }

    const randomIndex = Math.floor(Math.random() * greetingPrompts.length);
    setGreetingText(greetingPrompts[randomIndex] ?? greetingPrompts[0]);
  }, []);

  useEffect(() => {
    try {
      const rawShortcuts = window.localStorage.getItem(SHORTCUTS_STORAGE_KEY);
      if (!rawShortcuts) {
        return;
      }
      const parsed = JSON.parse(rawShortcuts) as HomeShortcut[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        setShortcuts(parsed.slice(0, 5));
      }
    } catch {
      setShortcuts(defaultShortcuts);
    }
  }, []);

  const toggleShortcutVisibility = (shortcutId: string) => {
    setShortcuts((previous) => {
      const next = previous.map((shortcut) =>
        shortcut.id === shortcutId
          ? { ...shortcut, hidden: !shortcut.hidden }
          : shortcut
      );
      window.localStorage.setItem(SHORTCUTS_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  return (
    <div
      className="pointer-events-auto flex flex-col items-center px-4"
      key="overview"
    >
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="mb-3 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-[11px] font-medium text-blue-600 dark:text-blue-300"
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.2, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        Bêta
      </motion.div>
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="text-center font-semibold text-2xl tracking-tight text-foreground md:text-3xl"
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.35, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        {timePrefix ? `${timePrefix}. ` : ""}
        {greetingText}
      </motion.div>
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="mt-3 text-center text-muted-foreground/80 text-sm"
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.5, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        Posez une question, créez du code, ou développez une idée.
      </motion.div>

      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="mt-5 grid w-full max-w-3xl grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5"
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.58, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        {shortcuts.map((shortcut) =>
          shortcut.hidden ? (
            <button
              className="liquid-glass rounded-xl border border-dashed border-border/50 px-3 py-2 text-[11px] text-muted-foreground"
              key={shortcut.id}
              onClick={() => toggleShortcutVisibility(shortcut.id)}
              type="button"
            >
              Afficher {shortcut.label}
            </button>
          ) : (
            <div
              className="liquid-glass rounded-xl border border-border/45 p-2"
              key={shortcut.id}
            >
              <Link
                className="block rounded-lg px-2 py-1 text-[12px] font-medium text-foreground transition-colors hover:bg-background/40"
                href={shortcut.href}
              >
                {shortcut.label}
              </Link>
              <button
                className="mt-1 text-[10px] text-muted-foreground hover:text-foreground"
                onClick={() => toggleShortcutVisibility(shortcut.id)}
                type="button"
              >
                Masquer
              </button>
            </div>
          )
        )}
      </motion.div>

      {isHydrated && (
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 flex w-full justify-center"
          initial={{ opacity: 0, y: 10 }}
          transition={{ delay: 0.65, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          <PlanUpgradeCTA compact currentPlan={plan} />
        </motion.div>
      )}
    </div>
  );
};
