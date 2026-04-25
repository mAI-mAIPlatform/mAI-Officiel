import { MessageCircle } from "lucide-react";
import Image from "next/image";
import type { AppLanguage } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type AproposSectionProps = {
  className?: string;
  interfaceLanguage: AppLanguage;
  language: AppLanguage;
  onLanguageChange: (value: string) => void;
};

const DISCORD_OAUTH_URL =
  "https://discord.com/oauth2/authorize?client_id=1494660523688591510&permissions=8&integration_type=0&scope=bot+applications.commands";
const aboutI18n = {
  en: {
    defaultLanguage: "Default interface language:",
    discordSupport: "Discord & Support",
    joinDiscord: "Join Discord server",
    language: "Language",
    beta: "Beta",
    telegramSoon: "Chat with mAI in Telegram",
    talkDiscord: "Chat with mAI in Discord",
  },
  es: {
    defaultLanguage: "Idioma de la interfaz por defecto:",
    discordSupport: "Discord y Soporte",
    joinDiscord: "Unirse al servidor Discord",
    language: "Idioma",
    beta: "Beta",
    telegramSoon: "Hablar con mAI en Telegram",
    talkDiscord: "Hablar con mAI en Discord",
  },
  de: {
    defaultLanguage: "Standardsprache der Oberfläche:",
    discordSupport: "Discord & Support",
    joinDiscord: "Discord-Server beitreten",
    language: "Sprache",
    beta: "Beta",
    telegramSoon: "Mit mAI in Telegram chatten",
    talkDiscord: "Mit mAI in Discord chatten",
  },
  it: {
    defaultLanguage: "Lingua predefinita dell'interfaccia:",
    discordSupport: "Discord e Supporto",
    joinDiscord: "Unisciti al server Discord",
    language: "Lingua",
    beta: "Beta",
    telegramSoon: "Chatta con mAI su Telegram",
    talkDiscord: "Chatta con mAI su Discord",
  },
  pt: {
    defaultLanguage: "Idioma padrão da interface:",
    discordSupport: "Discord e Suporte",
    joinDiscord: "Entrar no servidor Discord",
    language: "Idioma",
    beta: "Beta",
    telegramSoon: "Conversar com mAI no Telegram",
    talkDiscord: "Conversar com mAI no Discord",
  },
  zh: {
    defaultLanguage: "默认界面语言：",
    discordSupport: "Discord 与支持",
    joinDiscord: "加入 Discord 服务器",
    language: "语言",
    beta: "测试版",
    telegramSoon: "在 Telegram 与 mAI 聊天",
    talkDiscord: "在 Discord 与 mAI 聊天",
  },
  fr: {
    defaultLanguage: "Langue d'interface par défaut:",
    discordSupport: "Discord & Support",
    joinDiscord: "Rejoindre le serveur Discord",
    language: "Langue",
    beta: "Bêta",
    telegramSoon: "Discuter avec mAI dans Telegram",
    talkDiscord: "Discuter avec mAI dans Discord",
  },
} as const;

export function AproposSection({
  className,
  interfaceLanguage,
  language,
  onLanguageChange,
}: AproposSectionProps) {
  const t = aboutI18n[language];
  return (
    <section
      className={cn(
        "rounded-2xl border border-border/50 bg-card/70 p-5 backdrop-blur-xl",
        className
      )}
      id="apropos"
    >
      <h2 className="flex items-center gap-2 text-lg font-semibold">
        <MessageCircle className="size-5" />
        {t.discordSupport}
      </h2>
      <div className="mt-4 rounded-xl border border-border/60 bg-background/60 p-3">
        <label className="text-sm font-medium" htmlFor="language-selector">
          {t.language}
          <span className="ml-2 rounded-full border border-amber-400/40 bg-amber-400/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-500">
            {t.beta}
          </span>
        </label>
        <p className="mt-1 text-xs text-muted-foreground">
          {t.defaultLanguage} Français.
        </p>
        <select
          className="mt-2 w-full rounded-lg border border-border/60 bg-background/80 px-3 py-2 text-sm"
          id="language-selector"
          onChange={(event) => onLanguageChange(event.target.value)}
          value={interfaceLanguage}
        >
          <option value="fr">Français</option>
          <option value="en">English</option>
          <option value="es">Español</option>
          <option value="de">Deutsch</option>
          <option value="it">Italiano</option>
          <option value="pt">Português</option>
          <option value="zh">中文（普通话）</option>
        </select>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <a
          className="inline-flex items-center gap-2 rounded-xl border border-indigo-500/40 bg-indigo-500/10 px-3 py-2 text-sm font-medium text-indigo-700 transition-colors hover:bg-indigo-500/20 dark:text-indigo-300"
          href={DISCORD_OAUTH_URL}
          rel="noreferrer"
          target="_blank"
        >
          <Image
            alt="Discord"
            className="size-5"
            height={20}
            src="/icons/discord.svg"
            width={20}
          />
          {t.talkDiscord}
        </a>
        <a
          className="inline-flex items-center gap-2 rounded-xl border border-indigo-500/40 bg-indigo-500/10 px-3 py-2 text-sm font-medium text-indigo-700 transition-colors hover:bg-indigo-500/20 dark:text-indigo-300"
          href="https://discord.gg/fV7zwdGPpY"
          rel="noreferrer"
          target="_blank"
        >
          <Image
            alt="Discord"
            className="size-5"
            height={20}
            src="/icons/discord.svg"
            width={20}
          />
          {t.joinDiscord}
        </a>
        <button
          className="inline-flex cursor-not-allowed items-center gap-2 rounded-xl border border-sky-400/40 bg-slate-200/70 px-3 py-2 text-sm font-medium text-sky-400 opacity-80"
          title="Bientôt..."
          type="button"
        >
          <Image
            alt="Telegram"
            className="size-5 opacity-60"
            height={20}
            src="/icons/telegram.svg"
            width={20}
          />
          {t.telegramSoon}
        </button>
      </div>
    </section>
  );
}
