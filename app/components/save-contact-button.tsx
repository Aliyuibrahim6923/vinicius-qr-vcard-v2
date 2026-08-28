"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import styles from "./save-contact-button.module.css";

export function SaveContactButton({ vcardUrl, children }: { vcardUrl: string; children: ReactNode }) {
  const [showAndroidHelp, setShowAndroidHelp] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showAndroidHelp) return;

    dialogRef.current?.focus();
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setShowAndroidHelp(false);
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [showAndroidHelp]);

  function handleClick() {
    if (/Android/i.test(navigator.userAgent)) setShowAndroidHelp(true);
  }

  return (
    <>
      <a
        className="button save-contact"
        href={vcardUrl}
        onClick={handleClick}
      >
        {children}
      </a>
      {showAndroidHelp ? (
        <div className={styles.backdrop}>
          <div
            ref={dialogRef}
            className={styles.dialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby="android-contact-title"
            aria-describedby="android-contact-steps"
            tabIndex={-1}
          >
            <span className={styles.badge}>Android contact</span>
            <h2 id="android-contact-title">Your contact file is downloading</h2>
            <ol id="android-contact-steps" className={styles.steps}>
              <li><span>1</span><p>Open <strong>Chrome Downloads</strong> from the download notification or the ⋮ menu.</p></li>
              <li><span>2</span><p>Tap the downloaded <strong>.vcf contact file</strong>.</p></li>
              <li><span>3</span><p>Choose <strong>Contacts</strong>, then tap <strong>Save</strong>.</p></li>
            </ol>
            <button className={styles.dismiss} type="button" onClick={() => setShowAndroidHelp(false)}>
              Got it
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
