type ScrollOptions = {
  /**
   * Extra pixels above the target element.
   * If omitted, auto-calculated based on viewport:
   *  - Desktop (≥ 1024 px): 24 px (sticky header is outside `<main>`)
   *  - Mobile: 72 px (fixed header overlaps `<main>`)
   */
  offset?: number;

  /** Number of retry attempts after the initial scroll (default: 2). */
  retries?: number;

  /** Delay between each retry in ms (default: 300). */
  retryDelay?: number;
};

/**
 * Get the dashboard's primary scroll container marked with
 * `data-scroll-container` in DashboardLayout.
 */
const getDashboardContainer = (): HTMLElement | null =>
  document.querySelector<HTMLElement>("[data-scroll-container]");

/**
 * Compute a sensible, header-aware offset when the caller doesn't
 * supply one explicitly.
 *
 * The fixed header overlaps `<main>` on every breakpoint:
 *  - Desktop (lg ≥ 1024 px): h-16 (64 px) + 12 px breathing = 76 px
 *  - Mobile: h-14 (56 px) + 12 px breathing = 68 px
 */
const resolveOffset = (explicit?: number): number => {
  if (typeof explicit === "number") return explicit;
  return window.innerWidth >= 1024 ? 76 : 68;
};

/**
 * Scroll the dashboard main container so that `element` is visible
 * near the top of the viewport with a comfortable offset.
 *
 * Handles AnimatePresence / Framer Motion layout shifts via an
 * automatic retry mechanism: after the initial scroll, the function
 * retries `retries` times at `retryDelay` intervals to compensate
 * for content that paints after the first attempt.
 *
 * Works on both desktop (sticky header, `<main>` scroll) and mobile
 * (fixed header, `<main>` scroll).
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

      // Bail out if the element was removed from the DOM (e.g. unmount)
      if (!target.isConnected) return;

      // 1. Prefer the explicitly-marked dashboard scroll container
      const container = getDashboardContainer();

      if (container) {
        const containerRect = container.getBoundingClientRect();
        const targetRect = target.getBoundingClientRect();
        const scrollTop =
          container.scrollTop +
          (targetRect.top - containerRect.top) -
          offset;

        container.scrollTo({
          top: Math.max(scrollTop, 0),
          behavior: "smooth",
        });
        return;
      }

      // 2. Fallback: use window scroll (non-dashboard contexts)
      const rect = target.getBoundingClientRect();
      const absoluteTop = rect.top + window.scrollY;
      window.scrollTo({
        top: Math.max(absoluteTop - offset, 0),
        behavior: "smooth",
      });
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

  // Retry to correct for AnimatePresence / Framer-Motion layout
  // shifts that change heights **after** the initial scroll fires.
  for (let i = 1; i <= retries; i++) {
    window.setTimeout(() => {
      window.requestAnimationFrame(doScroll);
    }, i * retryDelay);
  }
}
