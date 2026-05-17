"use client";

import { useEffect } from "react";

export function HideFooter() {
  useEffect(() => {
    const footer = document.querySelector("footer");
    if (footer) (footer as HTMLElement).style.display = "none";
    return () => {
      if (footer) (footer as HTMLElement).style.display = "";
    };
  }, []);
  return null;
}
