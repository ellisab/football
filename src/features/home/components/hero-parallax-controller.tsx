"use client";

import { useEffect } from "react";

const clamp = (value: number) => Math.min(1, Math.max(0, value));

const easeScroll = (value: number) => value * value * (3 - 2 * value);

const lerp = (from: number, to: number, progress: number) =>
  from + (to - from) * progress;

function writeParallaxVars(target: HTMLElement, progress: number) {
  const eased = easeScroll(progress);

  target.style.setProperty("--atlas-progress", progress.toFixed(4));
  target.style.setProperty("--atlas-image-x", `${lerp(0, -5.8, eased).toFixed(3)}vw`);
  target.style.setProperty("--atlas-image-y", `${lerp(0, -6.4, eased).toFixed(3)}svh`);
  target.style.setProperty("--atlas-image-scale", lerp(1.055, 1.16, eased).toFixed(4));
  target.style.setProperty("--atlas-focus-x", `${lerp(72, 60, eased).toFixed(2)}%`);
  target.style.setProperty("--atlas-focus-y", `${lerp(38, 74, eased).toFixed(2)}%`);
  target.style.setProperty("--atlas-grid-x", `${lerp(0, 3.2, eased).toFixed(3)}vw`);
  target.style.setProperty("--atlas-grid-y", `${lerp(0, -4.8, eased).toFixed(3)}svh`);
}

export function HeroParallaxController({ targetId }: { targetId: string }) {
  useEffect(() => {
    const target = document.getElementById(targetId);

    if (!target) {
      return;
    }

    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let animationFrame = 0;

    const update = () => {
      animationFrame = 0;

      if (reducedMotionQuery.matches) {
        writeParallaxVars(target, 0);
        return;
      }

      const rect = target.getBoundingClientRect();
      const scrollDistance = Math.max(1, rect.height - window.innerHeight);
      const progress = clamp(-rect.top / scrollDistance);

      writeParallaxVars(target, progress);
    };

    const requestUpdate = () => {
      if (animationFrame !== 0) {
        return;
      }

      animationFrame = window.requestAnimationFrame(update);
    };

    update();

    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
    reducedMotionQuery.addEventListener("change", requestUpdate);

    return () => {
      if (animationFrame !== 0) {
        window.cancelAnimationFrame(animationFrame);
      }

      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
      reducedMotionQuery.removeEventListener("change", requestUpdate);
    };
  }, [targetId]);

  return null;
}
