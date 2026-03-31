// app/components/PwaRegister.tsx
"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .catch((error) => console.error("Erro ao registrar SW:", error));
      });
    }
  }, []);

  return null;
}