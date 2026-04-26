"use client";

import { MessageCircle } from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";
import { chatModels } from "@/lib/ai/models";
import { affordableImageModels } from "@/lib/ai/affordable-models";
import { LANGUAGE_OPTIONS, type AppLanguage } from "@/lib/i18n";
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
  ar: {
    defaultLanguage: "لغة الواجهة الافتراضية:",
    discordSupport: "Discord والدعم",
    joinDiscord: "الانضمام إلى خادم Discord",
    language: "اللغة",
    beta: "بيتا",
    telegramSoon: "الدردشة مع mAI على Telegram",
    talkDiscord: "الدردشة مع mAI على Discord",
  },
  ko: {
    defaultLanguage: "기본 인터페이스 언어:",
    discordSupport: "Discord 및 지원",
    joinDiscord: "Discord 서버 참여",
    language: "언어",
    beta: "베타",
    telegramSoon: "Telegram에서 mAI와 대화",
    talkDiscord: "Discord에서 mAI와 대화",
  },
  pl: {
    defaultLanguage: "Domyślny język interfejsu:",
    discordSupport: "Discord i wsparcie",
    joinDiscord: "Dołącz do serwera Discord",
    language: "Język",
    beta: "Beta",
    telegramSoon: "Rozmawiaj z mAI na Telegramie",
    talkDiscord: "Rozmawiaj z mAI na Discordzie",
  },
  hr: {
    defaultLanguage: "Zadani jezik sučelja:",
    discordSupport: "Discord i podrška",
    joinDiscord: "Pridruži se Discord serveru",
    language: "Jezik",
    beta: "Beta",
    telegramSoon: "Razgovaraj s mAI na Telegramu",
    talkDiscord: "Razgovaraj s mAI na Discordu",
  },
  sv: {
    defaultLanguage: "Standardgränssnittets språk:",
    discordSupport: "Discord & support",
    joinDiscord: "Gå med i Discord-servern",
    language: "Språk",
    beta: "Beta",
    telegramSoon: "Chatta med mAI på Telegram",
    talkDiscord: "Chatta med mAI på Discord",
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
  const [modelsOpen, setModelsOpen] = useState(false);
  const [modelsCategory, setModelsCategory] = useState<"all" | "text" | "image" | "music">("all");
  const musicModels = useMemo(() => ["V5_5", "V5", "V4_5PLUS", "V4_5ALL", "V4_5", "V4"], []);

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
          {LANGUAGE_OPTIONS.map((option) => (
            <option key={option.code} value={option.code}>
              {option.label}
            </option>
          ))}
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
        <button className="inline-flex items-center justify-between gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-500/20 dark:text-emerald-300" onClick={() => { setModelsCategory("text"); setModelsOpen(true); }} type="button">
          Modèles Texte <span className="rounded border border-emerald-500/40 px-2 py-0.5 text-xs">Ouvrir</span>
        </button>
        <button className="inline-flex items-center justify-between gap-2 rounded-xl border border-sky-500/40 bg-sky-500/10 px-3 py-2 text-sm font-medium text-sky-700 transition-colors hover:bg-sky-500/20 dark:text-sky-300" onClick={() => { setModelsCategory("image"); setModelsOpen(true); }} type="button">
          Modèles Images <span className="rounded border border-sky-500/40 px-2 py-0.5 text-xs">Ouvrir</span>
        </button>
        <button className="inline-flex items-center justify-between gap-2 rounded-xl border border-fuchsia-500/40 bg-fuchsia-500/10 px-3 py-2 text-sm font-medium text-fuchsia-700 transition-colors hover:bg-fuchsia-500/20 dark:text-fuchsia-300" onClick={() => { setModelsCategory("music"); setModelsOpen(true); }} type="button">
          Modèles Musiques <span className="rounded border border-fuchsia-500/40 px-2 py-0.5 text-xs">Ouvrir</span>
        </button>
      </div>

      {modelsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[85vh] w-full max-w-3xl overflow-hidden rounded-2xl border border-border/60 bg-background shadow-xl">
            <div className="flex items-center justify-between border-b border-border/50 p-4">
              <h3 className="text-base font-semibold">Modèles référencés</h3>
              <button className="rounded-lg border px-2 py-1 text-xs" onClick={() => setModelsOpen(false)} type="button">Fermer</button>
            </div>
            <div className="grid gap-4 overflow-auto p-4 md:grid-cols-3">
              {(modelsCategory === "all" || modelsCategory === "text") && <div>
                <p className="mb-2 text-xs font-bold uppercase text-muted-foreground">Texte ({chatModels.length})</p>
                <div className="space-y-1 text-xs">
                  {chatModels.map((model) => (
                    <div key={`text-${model.id}`} className="rounded border border-border/40 px-2 py-1">
                      {model.name}
                    </div>
                  ))}
                </div>
              </div>}
              {(modelsCategory === "all" || modelsCategory === "image") && <div>
                <p className="mb-2 text-xs font-bold uppercase text-muted-foreground">Images ({affordableImageModels.length})</p>
                <div className="space-y-1 text-xs">
                  {affordableImageModels.map((model) => (
                    <div key={`img-${model.id}`} className="rounded border border-border/40 px-2 py-1">
                      {model.label}
                    </div>
                  ))}
                </div>
              </div>}
              {(modelsCategory === "all" || modelsCategory === "music") && <div>
                <p className="mb-2 text-xs font-bold uppercase text-muted-foreground">Musiques ({musicModels.length})</p>
                <div className="space-y-1 text-xs">
                  {musicModels.map((model) => (
                    <div key={`music-${model}`} className="rounded border border-border/40 px-2 py-1">
                      {model.replaceAll("_", ".")}
                    </div>
                  ))}
                </div>
              </div>}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
