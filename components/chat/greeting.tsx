import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useSubscriptionPlan } from "@/hooks/use-subscription-plan";
import { greetingPrompts } from "@/lib/constants";
import { PlanUpgradeCTA } from "./plan-upgrade-cta";

export const Greeting = () => {
  const [greetingText, setGreetingText] = useState<string>(greetingPrompts[0]);
  const [timePrefix, setTimePrefix] = useState<string>("");
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

      {isHydrated && (
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 flex w-full justify-center"
          initial={{ opacity: 0, y: 10 }}
          transition={{ delay: 0.65, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          <PlanUpgradeCTA currentPlan={plan} />
        </motion.div>
      )}
    </div>
  );
};
