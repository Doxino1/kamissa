"use client";

import { useEffect, useRef, useState } from "react";

// Garantit un temps d'affichage minimum du skeleton pour éviter un flash
// trop bref (perçu comme un bug) quand la requête revient très vite.
export function useMinimumLoading(loading: boolean, minMs = 650): boolean {
  const [shown, setShown] = useState(loading);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    function sync() {
      if (loading) {
        if (startRef.current === null) startRef.current = Date.now();
        setShown(true);
        return;
      }
      const elapsed = startRef.current ? Date.now() - startRef.current : minMs;
      const remaining = Math.max(0, minMs - elapsed);
      const timer = setTimeout(() => setShown(false), remaining);
      return () => clearTimeout(timer);
    }

    return sync();
  }, [loading, minMs]);

  return shown;
}
