import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";

type NotificationSettings = {
  projectUpdates: boolean;
  responseReady: boolean;
  soundsEnabled: boolean;
  vibrationsEnabled: boolean;
  studioRenders: boolean;
  waveRenders: boolean;
};

type NotificationsSectionProps = {
  className?: string;
  isPwaInstalled: boolean;
  notificationPermission: NotificationPermission | "unsupported";
  onRequestDevicePermission: () => void;
  onToggle: (key: keyof NotificationSettings, value: boolean) => void;
  settings: NotificationSettings;
};

const notificationItems = [
  {
    description: "Être alerté quand une réponse IA est prête.",
    key: "responseReady" as const,
    label: "Réponses",
  },
  {
    description: "Être notifié des mises à jour de la plateforme.",
    key: "projectUpdates" as const,
    label: "Plateforme",
  },
  {
    description: "Alerte quand une génération Studio est prête.",
    key: "studioRenders" as const,
    label: "Studio",
  },
  {
    description: "Alerte quand une musique Wave est terminée.",
    key: "waveRenders" as const,
    label: "Wave",
  },
];

export function NotificationsSection({
  className,
  isPwaInstalled,
  notificationPermission,
  onRequestDevicePermission,
  onToggle,
  settings,
}: NotificationsSectionProps) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-border/50 bg-card/70 p-5 backdrop-blur-xl",
        className
      )}
      id="notifications"
    >
      <h2 className="flex items-center gap-2 text-lg font-semibold">
        <Bell className="size-4 text-primary" />
        Notifications
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Choisissez les alertes que vous souhaitez recevoir dans l&apos;app.
      </p>

      {isPwaInstalled && notificationPermission !== "granted" && (
        <div className="mt-4 rounded-xl border border-primary/30 bg-primary/10 p-3">
          <p className="text-sm font-medium">Notifications appareil</p>
          <p className="mt-1 text-xs text-muted-foreground">
            mAI est installé en PWA. Activez les notifications système pour
            recevoir les réponses IA sur l&apos;appareil.
          </p>
          <button
            className="mt-3 rounded-lg border border-primary/40 bg-background/70 px-3 py-1.5 text-xs font-medium transition hover:bg-background"
            onClick={onRequestDevicePermission}
            type="button"
          >
            Autoriser les notifications
          </button>
        </div>
      )}

      <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
        {notificationItems.map((notificationItem) => (
          <button
            className={cn(
              "rounded-xl border p-3 text-left text-sm transition-colors",
              settings[notificationItem.key]
                ? "border-primary/40 bg-primary/10"
                : "border-border/50 bg-background/50"
            )}
            key={notificationItem.key}
            onClick={() =>
              onToggle(notificationItem.key, !settings[notificationItem.key])
            }
            type="button"
          >
            <p className="font-medium">{notificationItem.label}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {notificationItem.description}
            </p>
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-2 md:grid-cols-2">
        <button
          className={cn(
            "rounded-xl border p-3 text-left text-sm transition-colors",
            settings.vibrationsEnabled
              ? "border-primary/40 bg-primary/10"
              : "border-border/50 bg-background/50"
          )}
          onClick={() =>
            onToggle("vibrationsEnabled", !settings.vibrationsEnabled)
          }
          type="button"
        >
          <p className="font-medium">Vibrations</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Retour haptique mobile pour confirmations et réponses IA.
          </p>
        </button>
        <button
          className={cn(
            "rounded-xl border p-3 text-left text-sm transition-colors",
            settings.soundsEnabled
              ? "border-primary/40 bg-primary/10"
              : "border-border/50 bg-background/50"
          )}
          onClick={() => onToggle("soundsEnabled", !settings.soundsEnabled)}
          type="button"
        >
          <p className="font-medium">Effets sonores</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Sons UI subtils (désactivés par défaut).
          </p>
        </button>
      </div>
    </section>
  );
}
