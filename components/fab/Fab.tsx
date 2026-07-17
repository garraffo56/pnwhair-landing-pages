"use client";

// RootLogic FAB for the Next.js LP fleet. Drop <Fab client="rhrli" /> once into
// the app's root layout (below the DniSwap mount). It fetches the client's config
// from control at runtime and mounts the shadow-DOM widget on document.body, so
// control edits go live within seconds with no redeploy. Renders nothing itself.
import { useEffect } from "react";
import { mountFab } from "./fab-widget";

export default function Fab({
  client,
  controlOrigin,
}: {
  client: string;
  controlOrigin?: string;
}) {
  useEffect(() => {
    let cleanup: (() => void) | undefined;
    let cancelled = false;
    mountFab({ client, controlOrigin }).then((fn) => {
      if (cancelled) fn();
      else cleanup = fn;
    });
    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [client, controlOrigin]);

  return null;
}
