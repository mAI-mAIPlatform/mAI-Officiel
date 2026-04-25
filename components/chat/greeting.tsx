import { motion } from "framer-motion";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useLanguage } from "@/hooks/use-language";
import { useSubscriptionPlan } from "@/hooks/use-subscription-plan";
import { PlanUpgradeCTA } from "./plan-upgrade-cta";

export const Greeting = () => {
  const { language } = useLanguage();
  const greetingPromptsByLanguage = {
    en: [
      "how can I help you today?",
      "what do you want to build with mAI?",
      "where should we start today?",
      "what idea do you want to explore now?",
    ],
    es: [
      "¿cómo puedo ayudarte hoy?",
      "¿qué quieres construir con mAI?",
      "¿por dónde empezamos hoy?",
      "¿qué idea quieres explorar ahora?",
    ],
    de: [
      "wie kann ich Ihnen heute helfen?",
      "was möchten Sie mit mAI bauen?",
      "wo sollen wir heute anfangen?",
      "welche Idee möchten Sie jetzt erkunden?",
    ],
    it: [
      "come posso aiutarti oggi?",
      "cosa vuoi costruire con mAI?",
      "da dove iniziamo oggi?",
      "quale idea vuoi esplorare ora?",
    ],
    pt: [
      "como posso ajudar você hoje?",
      "o que você quer construir com mAI?",
      "por onde começamos hoje?",
      "qual ideia você quer explorar agora?",
    ],
    zh: [
      "今天我可以如何帮助你？",
      "你想用 mAI 构建什么？",
      "我们今天从哪里开始？",
      "你现在想探索什么想法？",
    ],
    fr: [
      "comment puis-je vous aider aujourd'hui ?",
      "que voulez-vous construire avec mAI ?",
      "par quoi commençons-nous aujourd'hui ?",
      "quelle idée voulez-vous explorer maintenant ?",
    ],
  } as const;
  const [greetingText, setGreetingText] = useState<string>(
    greetingPromptsByLanguage.fr[0]
  );
  const [timePrefix, setTimePrefix] = useState<string>("");
  const { isHydrated, plan } = useSubscriptionPlan();

  useEffect(() => {
    const hour = new Date().getHours();
    if (language === "en") {
      setTimePrefix(hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening");
    } else if (language === "es") {
      setTimePrefix(hour < 12 ? "Buenos días" : hour < 18 ? "Buenas tardes" : "Buenas noches");
    } else if (language === "de") {
      setTimePrefix(hour < 12 ? "Guten Morgen" : hour < 18 ? "Guten Tag" : "Guten Abend");
    } else if (language === "it") {
      setTimePrefix(hour < 12 ? "Buongiorno" : hour < 18 ? "Buon pomeriggio" : "Buonasera");
    } else if (language === "pt") {
      setTimePrefix(hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite");
    } else if (language === "zh") {
      setTimePrefix(hour < 12 ? "早上好" : hour < 18 ? "下午好" : "晚上好");
    } else if (hour < 12) {
      setTimePrefix("Bonjour");
    } else if (hour < 18) {
      setTimePrefix("Bon après-midi");
    } else {
      setTimePrefix("Bonsoir");
    }

    const prompts = greetingPromptsByLanguage[language];
    const randomIndex = Math.floor(Math.random() * prompts.length);
    setGreetingText(prompts[randomIndex] ?? prompts[0]);
  }, [language]);

  return (
    <div
      className="pointer-events-auto flex flex-col items-center px-4"
      key="overview"
    >
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="mb-4"
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.1, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <Image
          alt="Logo mAI"
          className="size-14 object-contain"
          height={56}
          src="/images/logo.png"
          width={56}
        />
      </motion.div>
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="text-center font-semibold text-2xl tracking-tight text-foreground md:text-3xl"
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.2, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        {timePrefix ? `${timePrefix}. ` : ""}
        {greetingText}
      </motion.div>
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="mt-3 text-center text-muted-foreground/80 text-sm"
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.35, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        {language === "en"
          ? "With mAI, take things to the next level!"
          : language === "es"
            ? "¡Con mAI, pasa al siguiente nivel!"
            : language === "de"
              ? "Mit mAI auf das nächste Level!"
              : language === "it"
                ? "Con mAI, passa al livello successivo!"
                : language === "pt"
                  ? "Com a mAI, vá para o próximo nível!"
                  : language === "zh"
                    ? "用 mAI，迈向更高水平！"
            : "Avec mAI, passez à la vitesse supérieure !"}
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
