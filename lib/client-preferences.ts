const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export function setClientPreferenceCookie(name: string, value: string): void {
  if (typeof document === "undefined") {
    return;
  }

  const safeName = name.replace(/[^a-zA-Z0-9_.-]/g, "");
  const safeValue = encodeURIComponent(value.slice(0, 512));
  document.cookie = `${safeName}=${safeValue}; path=/; max-age=${ONE_YEAR_SECONDS}; samesite=lax`;
}
