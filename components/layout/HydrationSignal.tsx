"use client";

import { useEffect } from "react";

/** Tells public/js/site.js that React has hydrated, so its DOM changes (sliders, menus) are not undone by React. */
export function HydrationSignal() {
  useEffect(() => {
    (window as unknown as { __vseHydrated?: boolean }).__vseHydrated = true;
    window.dispatchEvent(new Event("vse:hydrated"));
  }, []);
  return null;
}
