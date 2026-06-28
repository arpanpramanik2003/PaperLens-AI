import { useEffect, useRef } from "react";

type Options = {
  damping?: number;
};

type SmoothScrollbarInstance = {
  scrollTo: (x: number, y: number, duration?: number) => void;
  destroy: () => void;
};

type SmoothScrollbarModule = {
  init: (container: HTMLElement, options: { damping: number; thumbMinSize: number }) => SmoothScrollbarInstance;
};

export default function useSmoothScrollbar(containerRef: React.RefObject<HTMLElement | null>, options?: Options) {
  const scrollbarRef = useRef<SmoothScrollbarInstance | null>(null);

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
        const Scrollbar = ((mod as { default?: SmoothScrollbarModule }).default ?? (mod as unknown as SmoothScrollbarModule));
        if (!mounted || typeof Scrollbar.init !== "function") return;

        const instance = Scrollbar.init(container as HTMLElement, {
          damping: options?.damping ?? 0.08,
          thumbMinSize: 20,
        });

        scrollbarRef.current = instance;
      } catch (err) {
        console.warn("smooth-scrollbar not available", err);
      }
    })();

    return () => {
      mounted = false;
      try {
        if (scrollbarRef.current && typeof scrollbarRef.current.destroy === "function") {
          scrollbarRef.current.destroy();
        }
      } catch (error) {
        void error;
      }
      scrollbarRef.current = null;
    };
  }, [containerRef, options?.damping]);

  return scrollbarRef;
}
