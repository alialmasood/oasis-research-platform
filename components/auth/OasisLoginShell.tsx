"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "oasis-intro-seen-v2";

/**
 * Actual timeline (ms) from sequence start:
 * 0–450      campus hold (image only)
 * 450        logo zoom begins (850ms → settles ~1300)
 * 750        ring draw begins (~2100ms → complete ~2850)
 * 1350       «واحة الباحث»
 * 1600       Oasis Research Platform
 * 2850–3350  hold (~500ms) complete scene
 * 3350       split begins (1400ms → ~4750); ring fades 280ms
 * 3650       form content reveal (700ms)
 * 4750       ready / stable
 *
 * Entry behavior:
 * - `/` and `/login` play the full intro on first visit in the session
 * - Later visits in the same session jump to the final split layout
 * - `?intro=1` forces a full replay (dev / QA)
 */

type Phase = "waiting" | "intro" | "splitting" | "ready";

interface OasisLoginShellProps {
  children: ReactNode;
}

function readIntroSeen(): boolean {
  try {
    return sessionStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function markIntroSeen() {
  try {
    sessionStorage.setItem(STORAGE_KEY, "1");
  } catch {
    /* ignore */
  }
}

function shouldForceIntro(): boolean {
  try {
    return new URLSearchParams(window.location.search).get("intro") === "1";
  } catch {
    return false;
  }
}

function runAnim(
  el: Element | null,
  keyframes: Keyframe[],
  options: KeyframeAnimationOptions
): Animation | null {
  if (!el || typeof el.animate !== "function") return null;
  try {
    const anim = el.animate(keyframes, { ...options, fill: "forwards" });
    try {
      anim.playbackRate = 1;
    } catch {
      /* ignore */
    }
    return anim;
  } catch {
    return null;
  }
}

export function OasisLoginShell({ children }: OasisLoginShellProps) {
  const [phase, setPhase] = useState<Phase>("waiting");
  const [imageReady, setImageReady] = useState(false);
  const [decision, setDecision] = useState<"pending" | "play" | "skip">("pending");
  const [forceMotion, setForceMotion] = useState(false);
  const [instant, setInstant] = useState(false);

  const [logoOn, setLogoOn] = useState(false);
  const [ringOn, setRingOn] = useState(false);
  const [titleOn, setTitleOn] = useState(false);
  const [englishOn, setEnglishOn] = useState(false);
  const [formContentOn, setFormContentOn] = useState(false);

  const imagePanelRef = useRef<HTMLElement | null>(null);
  const logoWrapRef = useRef<HTMLDivElement | null>(null);
  const ringSvgRef = useRef<SVGSVGElement | null>(null);
  const ringProgressRef = useRef<SVGCircleElement | null>(null);
  const animsRef = useRef<Animation[]>([]);

  const cancelAnims = () => {
    animsRef.current.forEach((a) => {
      try {
        a.cancel();
      } catch {
        /* ignore */
      }
    });
    animsRef.current = [];
  };

  useEffect(() => {
    const id = window.setTimeout(() => {
      const force = shouldForceIntro();
      const seen = readIntroSeen();

      // Primary entry `/` and `/login`: play cinematic intro on first session visit.
      // Ignore OS prefers-reduced-motion so Windows users still see the brand intro.
      // `?intro=1` forces replay anytime.
      if (force || !seen) {
        setForceMotion(true);
        setDecision("play");
        return;
      }

      setDecision("skip");
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => setImageReady(true), 2500);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    if (!imageReady || decision === "pending") return;

    let cancelled = false;
    const timers: number[] = [];

    const schedule = (fn: () => void, ms: number) => {
      const id = window.setTimeout(() => {
        if (!cancelled) fn();
      }, ms);
      timers.push(id);
    };

    if (decision === "skip") {
      const skipId = window.setTimeout(() => {
        if (cancelled) return;
        setInstant(true);
        setPhase("ready");
        setLogoOn(true);
        setTitleOn(true);
        setEnglishOn(true);
        setFormContentOn(true);
        setRingOn(false);
        schedule(() => setInstant(false), 80);
      }, 0);
      timers.push(skipId);

      return () => {
        cancelled = true;
        timers.forEach((t) => window.clearTimeout(t));
      };
    }

    const bootId = window.setTimeout(() => {
      if (cancelled) return;

      cancelAnims();
      setPhase("intro");
      setLogoOn(false);
      setRingOn(false);
      setTitleOn(false);
      setEnglishOn(false);
      setFormContentOn(false);

      const panel = imagePanelRef.current;
      if (panel) {
        panel.style.left = "0";
        panel.style.height = "";
      }

      // 450ms — Logo Zoom (850ms): 0.28 → 1.08 → 1
      schedule(() => {
        setLogoOn(true);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (cancelled) return;
            const logo = logoWrapRef.current;
            if (!logo) return;
            logo.style.visibility = "visible";
            const a = runAnim(
              logo,
              [
                { opacity: 0, transform: "scale(0.28)" },
                { opacity: 1, transform: "scale(1.08)", offset: 0.68 },
                { opacity: 1, transform: "scale(1)" },
              ],
              { duration: 850, easing: "cubic-bezier(0.22, 1, 0.36, 1)" }
            );
            if (a) animsRef.current.push(a);
          });
        });
      }, 450);

      // 750ms — Ring draw (~2100ms → complete ~2850)
      schedule(() => {
        setRingOn(true);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (cancelled) return;
            const circle = ringProgressRef.current;
            if (!circle) return;
            circle.style.strokeDasharray = "1";
            circle.style.strokeDashoffset = "1";
            const a = runAnim(
              circle,
              [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }],
              { duration: 2100, easing: "cubic-bezier(0.4, 0, 0.2, 1)" }
            );
            if (a) animsRef.current.push(a);
          });
        });
      }, 750);

      // Brand reveal — separate from logo
      schedule(() => setTitleOn(true), 1350);
      schedule(() => setEnglishOn(true), 1600);

      // 3350 — Split (1400ms) after ~500ms hold; ring fades in first ~280ms
      schedule(() => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (cancelled) return;
            setPhase("splitting");

            const ringSvg = ringSvgRef.current;
            if (ringSvg) {
              const fade = runAnim(
                ringSvg,
                [{ opacity: 1 }, { opacity: 0 }],
                { duration: 280, easing: "ease" }
              );
              if (fade) animsRef.current.push(fade);
            }

            const el = imagePanelRef.current;
            if (!el) return;

            const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
            if (isDesktop) {
              el.style.height = "";
              const a = runAnim(
                el,
                [{ left: "0%" }, { left: "52%" }],
                { duration: 1400, easing: "cubic-bezier(0.65, 0, 0.35, 1)" }
              );
              if (a) {
                animsRef.current.push(a);
                a.onfinish = () => {
                  el.style.left = "52%";
                };
              } else {
                el.style.left = "52%";
              }
            } else {
              const a = runAnim(
                el,
                [{ height: "100%" }, { height: "32vh" }],
                { duration: 1400, easing: "cubic-bezier(0.65, 0, 0.35, 1)" }
              );
              if (a) {
                animsRef.current.push(a);
                a.onfinish = () => {
                  el.style.height = "32vh";
                };
              } else {
                el.style.height = "32vh";
              }
            }
          });
        });
      }, 3350);

      // 3650 — form content (~300ms after split start)
      schedule(() => setFormContentOn(true), 3650);

      schedule(() => {
        setPhase("ready");
        setRingOn(false);
        markIntroSeen();
      }, 4750);
    }, 0);
    timers.push(bootId);

    return () => {
      cancelled = true;
      timers.forEach((t) => window.clearTimeout(t));
      cancelAnims();
    };
  }, [imageReady, decision]);

  const isSplit = phase === "splitting" || phase === "ready";
  const showRing = ringOn && phase === "intro";
  const ringFading = ringOn && phase === "splitting";

  return (
    <div
      className={cn(
        "oasis-login-root relative h-[100dvh] w-[100vw] overflow-hidden bg-[#0B1F4A]",
        isSplit && "oasis-login-split",
        forceMotion && "oasis-force-motion",
        instant && "oasis-instant"
      )}
      dir="ltr"
    >
      <section
        className={cn(
          "oasis-form-panel absolute inset-0 z-[1] flex flex-col bg-[#F8FAFC]",
          isSplit ? "oasis-form-panel-split" : "oasis-form-panel-covered"
        )}
        dir="rtl"
        aria-hidden={!isSplit}
      >
        <div
          className={cn(
            "oasis-form-content flex-1 flex items-center justify-center px-6 sm:px-10 lg:px-12 py-8 overflow-y-auto",
            formContentOn ? "oasis-form-content-visible" : "oasis-form-content-hidden"
          )}
        >
          <div className="w-full max-w-[440px] mx-auto">{children}</div>
        </div>
        <p
          className={cn(
            "shrink-0 pb-4 text-center text-[11px] text-slate-400 transition-opacity duration-700",
            formContentOn ? "opacity-100" : "opacity-0"
          )}
        >
          © {new Date().getFullYear()} جامعة البصرة
        </p>
      </section>

      <section
        ref={imagePanelRef}
        className={cn(
          "oasis-image-panel absolute z-10 overflow-hidden",
          !isSplit && "oasis-image-panel-full",
          isSplit && !forceMotion && "oasis-image-panel-split",
          isSplit && forceMotion && "oasis-image-panel-split-js"
        )}
      >
        <Image
          src="/residency.webp"
          alt="جامعة البصرة"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[center_35%]"
          onLoad={() => setImageReady(true)}
        />
        <div
          className={cn(
            "absolute inset-0 oasis-campus-overlay",
            isSplit && "oasis-campus-overlay-split"
          )}
        />

        <div className="oasis-brand-stage absolute inset-0 z-20 flex flex-col items-center justify-center px-4">
          <div
            className={cn(
              "oasis-brand-group relative flex flex-col items-center",
              isSplit && "oasis-brand-group-split"
            )}
          >
            <div
              ref={logoWrapRef}
              className={cn(
                "oasis-logo-wrap relative flex items-center justify-center",
                !logoOn && "oasis-logo-hidden",
                logoOn && !forceMotion && "oasis-logo-visible",
                logoOn && forceMotion && "oasis-logo-js",
                isSplit && "oasis-logo-split-size"
              )}
            >
              <svg
                ref={ringSvgRef}
                className={cn(
                  "absolute oasis-ring-svg pointer-events-none -rotate-90",
                  showRing && "oasis-ring-animate",
                  ringFading && "oasis-ring-fade",
                  !showRing && !ringFading && "opacity-0"
                )}
                viewBox="0 0 160 160"
                aria-hidden="true"
              >
                <circle
                  ref={ringProgressRef}
                  className="oasis-ring-progress"
                  cx="80"
                  cy="80"
                  r="72"
                  fill="none"
                  stroke="rgba(255,255,255,0.98)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  pathLength={1}
                />
              </svg>

              <div className="oasis-logo-disk relative z-10 flex items-center justify-center rounded-full bg-white/95 shadow-[0_12px_40px_rgba(0,0,0,0.32)]">
                <Image
                  src="/uob-logo.png"
                  alt="شعار جامعة البصرة"
                  width={160}
                  height={160}
                  className="object-contain h-full w-full"
                  priority
                />
              </div>
            </div>

            <div className="oasis-brand-copy flex flex-col items-center text-center">
              <p
                className={cn(
                  "oasis-title font-extrabold",
                  titleOn ? "oasis-title-visible" : "oasis-title-hidden"
                )}
              >
                واحة الباحث
              </p>
              <p
                className={cn(
                  "oasis-english font-inter",
                  englishOn ? "oasis-english-visible" : "oasis-english-hidden"
                )}
              >
                Oasis Research Platform
              </p>
              {isSplit && (
                <>
                  <span
                    className={cn(
                      "oasis-brand-rule",
                      formContentOn ? "oasis-rule-visible" : "oasis-rule-hidden"
                    )}
                    aria-hidden="true"
                  />
                  <p
                    className={cn(
                      "oasis-brand-tagline",
                      formContentOn ? "oasis-tagline-visible" : "oasis-tagline-hidden"
                    )}
                  >
                    المنصة البحثية لجامعة البصرة
                  </p>
                </>
              )}
            </div>
          </div>

          {isSplit && (
            <p className="oasis-brand-en absolute bottom-5 left-0 right-0 text-center font-inter text-[10px] tracking-[0.2em] uppercase text-white/40">
              University of Basrah
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
