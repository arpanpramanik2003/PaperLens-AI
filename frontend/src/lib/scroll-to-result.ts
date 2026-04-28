type ScrollOptions = {
  /**
   * Extra pixels above the target element reserved for the fixed header.
   * Defaults to 80 px (desktop) / 72 px (mobile).
   */
  offset?: number;

  /** Number of retry attempts after the initial scroll (default: 2). */
  retries?: number;

  /** Delay between each retry in ms (default: 300). */
  retryDelay?: number;
};

/**
 * Resolve header offset: the fixed navbar is h-14 (56 px) on mobile
 * and h-16 (64 px) on desktop. Adding 16 px breathing room.
 */
const resolveOffset = (explicit?: number): number => {
  if (typeof explicit === "number") return explicit;
  return window.innerWidth >= 1024 ? 80 : 72;
};

/**
 * Scroll so that `element` is visible near the top of the viewport,
 * offset below the fixed dashboard header.
 *
 * Uses `scrollIntoView` which auto-detects whichever ancestor is
 * actually scrollable (window, body, or a container). The offset
 * is applied via an inline `scrollMarginTop` style on the element.
 *
 * Works on both desktop and mobile layout.
 */
export function scrollToResult(
  element: Element | null | undefined,
  opts?: ScrollOptions
) {
  if (!element) return;

  const offset = resolveOffset(opts?.offset);
  const retries =
    typeof opts?.retries === "number" ? opts.retries : 2;
  const retryDelay =
    typeof opts?.retryDelay === "number" ? opts.retryDelay : 300;

  const doScroll = () => {
    try {
      const target = element as HTMLElement;
      if (!target.isConnected) return;

      // Apply scroll-margin-top dynamically to offset past the fixed header
      target.style.scrollMarginTop = `${offset}px`;

      target.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch {
      // Ultimate fallback
      (element as HTMLElement).scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  // Double-rAF ensures the layout is committed and painted before
  // the first measurement.
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(doScroll);
  });

  // Retry to correct for Framer-Motion layout shifts that change
  // heights **after** the initial scroll fires.
  for (let i = 1; i <= retries; i++) {
    window.setTimeout(() => {
      window.requestAnimationFrame(doScroll);
    }, i * retryDelay);
  }
}
