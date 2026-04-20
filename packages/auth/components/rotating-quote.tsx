"use client";

import { useEffect, useState } from "react";

const quotes = [
  "Behind every great fundraiser is an even greater cup of coffee.",
  "Life's too short for bad coffee and boring fundraisers.",
  "First we drink the coffee, then we change the world — one bag at a time.",
  "Decaf? No thanks, I have fundraisers to run.",
  "Good ideas start with brainstorming. Great ideas start with coffee.",
  "Coffee doesn't ask silly questions. Coffee understands.",
  "A yawn is a silent scream for coffee.",
  "Espresso yourself — and fund what matters.",
  "But first, coffee. Then we'll talk fundraising goals.",
  "Powered by passion, fueled by really good beans.",
];

export function RotatingQuote() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) {
      return;
    }

    const interval = setInterval(() => {
      setVisible(false);
      const fadeOut = setTimeout(() => {
        setIndex((prev) => (prev + 1) % quotes.length);
        setVisible(true);
      }, 600);
      return () => clearTimeout(fadeOut);
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  return (
    <blockquote>
      <p
        className="text-lg leading-relaxed"
        style={{
          opacity: visible ? 1 : 0,
          transition: "opacity 600ms ease-in-out",
        }}
      >
        &ldquo;{quotes[index]}&rdquo;
      </p>
    </blockquote>
  );
}
