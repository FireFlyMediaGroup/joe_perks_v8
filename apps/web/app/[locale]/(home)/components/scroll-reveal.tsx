"use client";

import { useEffect } from "react";

export function ScrollReveal() {
  useEffect(() => {
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReduced) {
      for (const el of document.querySelectorAll(".reveal")) {
        el.classList.add("visible");
      }
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.12 }
    );

    for (const el of document.querySelectorAll(".reveal")) {
      observer.observe(el);
    }

    return () => observer.disconnect();
  }, []);

  return null;
}
