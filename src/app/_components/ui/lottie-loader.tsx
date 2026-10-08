"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { Lottie } from "lottie-react"

const loaderAnimation = {
  v: "5.7.4",
  fr: 30,
  ip: 0,
  op: 60,
  w: 100,
  h: 100,
  nm: "BARBER-M loader",
  ddd: 0,
  assets: [],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: "Pulse ring",
      sr: 1,
      ks: {
        o: { a: 1, k: [{ t: 0, s: [45] }, { t: 30, s: [100] }, { t: 60, s: [45] }] },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [50, 50, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 0, k: [100, 100, 100] },
      },
      ao: 0,
      shapes: [
        {
          ty: "gr",
          it: [
            { ty: "el", p: { a: 0, k: [0, 0] }, s: { a: 0, k: [54, 54] }, d: 1, nm: "Ellipse" },
            { ty: "st", c: { a: 0, k: [0.53, 0.24, 0.95, 1] }, o: { a: 0, k: 100 }, w: { a: 0, k: 7 }, lc: 2, lj: 2, nm: "Stroke" },
            { ty: "tr", p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 }, sk: { a: 0, k: 0 }, sa: { a: 0, k: 0 } },
          ],
          nm: "Ring",
        },
      ],
    },
  ],
}

export default function LottieLoader({ size = 28 }: { size?: number }) {
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches)
  }, [])

  if (reducedMotion) {
    return <Loader2 aria-hidden="true" className="animate-spin text-primary" style={{ width: size, height: size }} />
  }

  return <Lottie src={loaderAnimation} loop autoplay aria-label="Carregando" style={{ width: size, height: size }} />
}
