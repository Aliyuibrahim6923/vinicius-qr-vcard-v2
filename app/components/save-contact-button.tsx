"use client";

import { useCallback, type ReactNode } from "react";

/**
 * On Android Chrome, navigator.share() with a .vcf File opens the native
 * share sheet which includes "Contacts" — letting the user save directly.
 * On iOS and desktop, we fall back to the regular vCard download link.
 */
export function SaveContactButton({ vcardUrl, children }: { vcardUrl: string; children: ReactNode }) {
  const handleClick = useCallback(async (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Only intercept on Android with Web Share API support
    const ua = navigator.userAgent;
    if (!/android/i.test(ua) || !navigator.share || !navigator.canShare) return;

    e.preventDefault();

    try {
      const res = await fetch(vcardUrl);
      if (!res.ok) throw new Error("fetch failed");
      const blob = await res.blob();
      const file = new File([blob], "contact.vcf", { type: "text/vcard" });

      if (!navigator.canShare({ files: [file] })) {
        // Device doesn't support sharing files — fall back to download
        window.location.href = vcardUrl;
        return;
      }

      await navigator.share({ files: [file] });
    } catch (err: unknown) {
      // AbortError = user dismissed the share sheet, that's fine
      if (err instanceof DOMException && err.name === "AbortError") return;
      // Any other error — fall back to download
      window.location.href = vcardUrl;
    }
  }, [vcardUrl]);

  return (
    <a className="button save-contact" href={vcardUrl} onClick={handleClick}>
      {children}
    </a>
  );
}
