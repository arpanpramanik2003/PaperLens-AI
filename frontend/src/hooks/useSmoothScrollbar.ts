import { useEffect, useRef } from "react";

type Options = {
  damping?: number;
};

export default function useSmoothScrollbar(containerRef: React.RefObject<HTMLElement | null>, options?: Options) {
  const scrollbarRef = useRef<any | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    if (isTouch) return; // let native scrolling handle touch devices

    const container = containerRef.current;
    if (!container) return;

    let mounted = true;

    (async () => {
      try {
        const mod = await import("smooth-scrollbar");
        const Scrollbar = (mod && (mod.default ?? mod)) as any;
        if (!mounted || !Scrollbar) return;

        const instance = Scrollbar.init(container as HTMLElement, {
          damping: options?.damping ?? 0.08,
          thumbMinSize: 20,
        });

        scrollbarRef.current = instance;
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn("smooth-scrollbar not available", err);
      }
    })();

    return () => {
      mounted = false;
      try {
        if (scrollbarRef.current && typeof scrollbarRef.current.destroy === "function") {
          scrollbarRef.current.destroy();
        }
      } catch (e) {}
      scrollbarRef.current = null;
    };
  }, [containerRef, options?.damping]);

  return scrollbarRef.current;
}
