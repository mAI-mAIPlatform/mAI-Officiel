`components/chat/app-sidebar.tsx` and `components/chat/message.tsx` are both client components, which means it is safe to use `useAppLogo()` hook in `BrandStarLogoIcon` and in `message.tsx`. Wait, `icons.tsx` doesn't have `"use client"`. So if I add a hook inside `BrandStarLogoIcon` in `icons.tsx`, it will become a client hook. Does `icons.tsx` need to be a client module entirely? Let's check where `icons.tsx` is imported. It is imported in many places, maybe server components. Better not to put `useAppLogo()` inside `icons.tsx`. Instead, I can pass `logoUrl` as a prop or handle the hook in the consuming components, but `icons.tsx` is used in many places.

Actually, wait. If I add `"use client"` to `hooks/use-app-logo.ts` and use it in a component exported from `icons.tsx`, any server component importing from `icons.tsx` will fail if it's imported in a server tree... No, `icons.tsx` just exports components. React Server Components can't use hooks.

Let's check where `BrandStarLogoIcon` is used: ONLY in `app-sidebar.tsx` (which is a client component).
Where else is `/images/logo.png` used?
- `components/chat/message.tsx` (client component).
- `lib/notifications.ts` (client side function, can read `localStorage.getItem("mai.app.logo.v1")`).

And what about the favicon?
We can create a small component `AppLogoUpdater` inside `app/layout.tsx` (which is a Server Component, so we import `AppLogoUpdater` which is a Client Component).

```tsx
// components/app-logo-updater.tsx
"use client";
import { useEffect } from "react";
import { useAppLogo } from "@/hooks/use-app-logo";

export function AppLogoUpdater() {
  const { appLogo } = useAppLogo();

  useEffect(() => {
    if (typeof window !== "undefined") {
      document.querySelectorAll("link[rel='icon'], link[rel='shortcut icon'], link[rel='apple-touch-icon']").forEach(el => {
        el.setAttribute("href", appLogo);
      });
    }
  }, [appLogo]);

  return null;
}
```
Then add `<AppLogoUpdater />` inside the `<ThemeProvider>` in `app/layout.tsx`.

Wait, the prompt says "Dans les paramètres de Compte, mettre le choix du favicon et logo entre les logos ci-joints". This means "In Account settings, add the choice of the favicon and logo between the attached logos".
So yes, my plan covers both the favicon and the logo shown in the app.

Let's refine `BrandStarLogoIcon`:
If I just use the hook in `app-sidebar.tsx` and pass it to `<BrandStarLogoIcon logo={appLogo} />`? Let's do that!
Wait, or change `BrandStarLogoIcon` to accept `src?: string` and default to `/images/logo.png`.

Wait, what about `app/layout.tsx`'s initial icon metadata?
```ts
export const metadata: Metadata = {
  icons: {
    icon: "/images/logo.png",
    shortcut: "/images/logo.png",
    apple: "/images/logo.png",
  },
};
```
This is fine. It sets the default. The client-side updater will change it when the app loads.

Let's see where `/images/logo.png` is used in `lib/notifications.ts`:
```ts
export function createNotification(title: string, options?: NotificationOptions) {
  // ...
  const icon = typeof window !== "undefined"
    ? (window.localStorage.getItem("mai.app.logo.v1")?.replace(/"/g, "") || "/images/logo.png")
    : "/images/logo.png";
  // ...
}
```

Wait, `usehooks-ts` `useLocalStorage` serializes strings with JSON.stringify, so `"mai.app.logo.v1"` will contain `"/images/logo.png"` (with quotes). `replace(/"/g, "")` is safe.

Let's check the logos list to make sure they match the copied files exactly.
Files copied:
`ai-star-black.png`
`demo-thumbnail.png` (not a logo)
`logo-bleu-blanc.png`
`logo-bleu-noir.png`
`logo-bleudégradé-blanc.png`
`logo-bleudégradé-noir.png`
`logo-noir-blanc.png`
`logo-noir.png`
`logo-red-blanc.png`
`logo-red-noir.png`
`logo-reddégradé-blanc.png`
`logo-reddégradé-noir.png`
`logo-vert-blanc.png`
`logo-vert-noir.png`
`logo-violet-blanc.png`
`logo-violet-noir.png`
`logo.png`

There are 16 logo choices:
```ts
export const availableLogos = [
  "logo.png",
  "logo-noir.png",
  "logo-noir-blanc.png",
  "logo-vert-blanc.png",
  "logo-vert-noir.png",
  "logo-violet-blanc.png",
  "logo-violet-noir.png",
  "logo-red-blanc.png",
  "logo-red-noir.png",
  "logo-reddégradé-blanc.png",
  "logo-reddégradé-noir.png",
  "ai-star-black.png",
];

export const maxPlanLogos = [
  "logo-bleu-blanc.png",
  "logo-bleu-noir.png",
  "logo-bleudégradé-blanc.png",
  "logo-bleudégradé-noir.png",
];
```

I will add these to `hooks/use-app-logo.ts`.

Let's request plan review!
