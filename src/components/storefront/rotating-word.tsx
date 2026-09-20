"use client";

import { useEffect, useState } from "react";

const words = ["stitch", "suit", "confidence", "ease", "form", "look"];

export function RotatingWord() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const id = window.setInterval(() => {
      setVisible(false);
      window.setTimeout(() => {
        setIndex((value) => (value + 1) % words.length);
        setVisible(true);
      }, 280);
    }, 2600);

    return () => window.clearInterval(id);
  }, []);

  return (
    <span className="relative inline-grid align-baseline">
      <span className="invisible col-start-1 row-start-1 whitespace-nowrap" aria-hidden>
        confidence
      </span>
      <span
        className="col-start-1 row-start-1 whitespace-nowrap transition-all duration-300"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(0.35em)",
        }}
      >
        {words[index]}
      </span>
    </span>
  );
}
