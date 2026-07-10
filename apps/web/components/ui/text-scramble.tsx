"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { cn } from "@/lib/utils"

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%!?<>[]{}|_-+="

interface TextScrambleProps {
  text: string
  className?: string
  style?: React.CSSProperties
  scrambleStyle?: React.CSSProperties
  speed?: number
  revealSpeed?: number
  loop?: boolean
  holdDuration?: number
}

export function TextScramble({
  text,
  className,
  style,
  scrambleStyle,
  speed = 40,
  revealSpeed = 55,
  loop = false,
  holdDuration = 1500,
}: TextScrambleProps) {
  const [mounted, setMounted] = useState(false)
  const [chars, setChars] = useState<Array<{ char: string; resolved: boolean }>>(() =>
    text.split("").map((c) => ({ char: c, resolved: true }))
  )

  const rafRef = useRef<number>(0)
  const resolvedRef = useRef(0)
  const lastScrambleRef = useRef(0)
  const lastRevealRef = useRef(0)
  const phaseRef = useRef<"scrambling" | "holding">("scrambling")
  const holdStartRef = useRef(0)

  const startScramble = useCallback(() => {
    resolvedRef.current = 0
    phaseRef.current = "scrambling"
    lastScrambleRef.current = 0
    lastRevealRef.current = 0
    setChars(
      text.split("").map(() => ({
        char: CHARS[Math.floor(Math.random() * CHARS.length)],
        resolved: false,
      }))
    )
  }, [text])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    startScramble()

    const tick = (t: number) => {
      if (phaseRef.current === "holding") {
        if (t - holdStartRef.current >= holdDuration) {
          startScramble()
        }
        rafRef.current = requestAnimationFrame(tick)
        return
      }

      if (t - lastScrambleRef.current >= speed) {
        setChars((prev) =>
          prev.map((c) =>
            c.resolved
              ? c
              : { char: CHARS[Math.floor(Math.random() * CHARS.length)], resolved: false }
          )
        )
        lastScrambleRef.current = t
      }

      if (t - lastRevealRef.current >= revealSpeed && resolvedRef.current < text.length) {
        const i = resolvedRef.current
        setChars((prev) =>
          prev.map((c, idx) => (idx === i ? { char: text[idx], resolved: true } : c))
        )
        resolvedRef.current++
        lastRevealRef.current = t
      }

      if (resolvedRef.current < text.length) {
        rafRef.current = requestAnimationFrame(tick)
      } else if (loop) {
        phaseRef.current = "holding"
        holdStartRef.current = t
        rafRef.current = requestAnimationFrame(tick)
      }
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [mounted, text, speed, revealSpeed, loop, holdDuration, startScramble])

  return (
    <span className={cn("tracking-widest", className)} style={style}>
      {chars.map((c, i) => (
        <span key={i} style={c.resolved ? undefined : scrambleStyle}>
          {c.char === " " ? "\u00A0" : c.char}
        </span>
      ))}
    </span>
  )
}