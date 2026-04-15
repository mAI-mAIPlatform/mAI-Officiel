"use client";

import { LockKeyhole, ShieldCheck } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  defaultSecuritySettings,
  hashPinCode,
  parseSecuritySettings,
  SECURITY_LOCKED_FLAG_KEY,
  SECURITY_SETTINGS_STORAGE_KEY,
} from "@/lib/security-settings";

export function SessionGuard() {
  const { status } = useSession();
  const [isLocked, setIsLocked] = useState(false);
  const [pinValue, setPinValue] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const settingsRef = useRef(defaultSecuritySettings);
  const lastActivityAtRef = useRef<number>(0);

  useEffect(() => {
    lastActivityAtRef.current = Date.now();

    const loadSettings = () => {
      settingsRef.current = parseSecuritySettings(
        window.localStorage.getItem(SECURITY_SETTINGS_STORAGE_KEY)
      );
    };

    const syncLockState = () => {
      loadSettings();
      if (
        settingsRef.current.securityCheckOnLoad &&
        settingsRef.current.enablePinLock &&
        settingsRef.current.lockOnReturn &&
        settingsRef.current.pinCodeHash
      ) {
        setIsLocked(
          window.localStorage.getItem(SECURITY_LOCKED_FLAG_KEY) === "1"
        );
      } else {
        setIsLocked(false);
      }
    };

    syncLockState();
    window.addEventListener("storage", syncLockState);
    window.addEventListener("focus", syncLockState);
    window.addEventListener("mai:security-settings-updated", syncLockState as EventListener);

    const markLockedOnLeave = () => {
      if (
        settingsRef.current.securityCheckOnLoad &&
        settingsRef.current.enablePinLock &&
        settingsRef.current.lockOnReturn &&
        settingsRef.current.pinCodeHash
      ) {
        window.localStorage.setItem(SECURITY_LOCKED_FLAG_KEY, "1");
      }
    };

    window.addEventListener("pagehide", markLockedOnLeave);
    window.addEventListener("beforeunload", markLockedOnLeave);

    return () => {
      window.removeEventListener("storage", syncLockState);
      window.removeEventListener("focus", syncLockState);
      window.removeEventListener("mai:security-settings-updated", syncLockState as EventListener);
      window.removeEventListener("pagehide", markLockedOnLeave);
      window.removeEventListener("beforeunload", markLockedOnLeave);
    };
  }, []);

  useEffect(() => {
    if (status !== "authenticated") {
      return;
    }

    const registerActivity = () => {
      lastActivityAtRef.current = Date.now();
    };

    const intervalId = window.setInterval(() => {
      const settings = settingsRef.current;
      if (settings.autoLogoutMinutes <= 0) {
        return;
      }

      const elapsed = Date.now() - lastActivityAtRef.current;
      const maxIdleMs = settings.autoLogoutMinutes * 60_000;
      if (elapsed < maxIdleMs) {
        return;
      }

      void signOut({ redirect: false }).finally(() => {
        window.location.href = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/login`;
      });
    }, 30_000);

    ["pointerdown", "keydown", "touchstart", "mousemove"].forEach((event) =>
      window.addEventListener(event, registerActivity, { passive: true })
    );

    return () => {
      window.clearInterval(intervalId);
      ["pointerdown", "keydown", "touchstart", "mousemove"].forEach((event) =>
        window.removeEventListener(event, registerActivity)
      );
    };
  }, [status]);

  const canRenderLock = useMemo(
    () => status === "authenticated" && isLocked,
    [isLocked, status]
  );

  if (!canRenderLock) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-4 backdrop-blur-2xl">
      <div className="liquid-glass w-full max-w-sm rounded-3xl border border-white/20 bg-card/85 p-5 shadow-[var(--shadow-float)]">
        <p className="mb-2 flex items-center gap-2 text-sm font-semibold">
          <LockKeyhole className="size-4 text-cyan-300" />
          Session verrouillée
        </p>
        <p className="text-xs text-muted-foreground">
          Entrez votre code PIN pour reprendre votre session mAI.
        </p>
        <input
          className="mt-4 h-11 w-full rounded-xl border border-border/60 bg-background/70 px-3 text-sm tracking-[0.35em]"
          inputMode="numeric"
          maxLength={8}
          onChange={(event) => {
            setPinValue(event.target.value.replace(/\D+/g, "").slice(0, 8));
            setErrorMessage(null);
          }}
          placeholder="••••"
          type="password"
          value={pinValue}
        />
        {errorMessage ? (
          <p className="mt-2 text-xs text-rose-400">{errorMessage}</p>
        ) : null}

        <button
          className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-xl border border-cyan-400/40 bg-cyan-500/15 text-sm font-medium text-cyan-100"
          onClick={() => {
            if (hashPinCode(pinValue) !== settingsRef.current.pinCodeHash) {
              setErrorMessage("PIN incorrect.");
              return;
            }

            window.localStorage.removeItem(SECURITY_LOCKED_FLAG_KEY);
            setPinValue("");
            setIsLocked(false);
          }}
          type="button"
        >
          <ShieldCheck className="mr-2 size-4" />
          Déverrouiller
        </button>
      </div>
    </div>
  );
}
