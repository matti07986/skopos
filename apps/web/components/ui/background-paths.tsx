"use client"

import { motion } from "framer-motion"
import { TextScramble } from "@/components/ui/text-scramble"

function FloatingPaths({ position }: { position: number }) {
  const paths = Array.from({ length: 36 }, (_, i) => ({
    id: i,
    d: `M-${380 - i * 5 * position} -${189 + i * 6}C-${380 - i * 5 * position} -${189 + i * 6
      } -${312 - i * 5} ${216 - i * 4} ${152 - i * 5} ${343 - i * 3}S${682 - i * 6
      } ${767 - i * 3} ${684 - i * 5} ${767 - i * 3}`,
    width: 0.5 + i * 0.03,
  }))

  return (
    <div className="absolute inset-0 pointer-events-none">
      <svg
        className="w-full h-full"
        viewBox="0 0 696 316"
        fill="none"
        preserveAspectRatio="xMidYMid slice"
      >
        <title>Background Paths</title>
        {paths.map((path) => (
          <motion.path
            key={path.id}
            d={path.d}
            stroke="#3fb950"
            strokeWidth={path.width}
            strokeOpacity={0.08 + path.id * 0.012}
            initial={{ pathLength: 0.3, opacity: 0.5 }}
            animate={{
              pathLength: 1,
              opacity: [0.3, 0.6, 0.3],
              pathOffset: [0, 1, 0],
            }}
            transition={{
              duration: 18 + (path.id % 7) * 2,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        ))}
      </svg>
    </div>
  )
}

interface BackgroundPathsProps {
  title?: string
  onGetStarted?: () => void
  children?: React.ReactNode
}

export function BackgroundPaths({
  title = "NOVA TRACE",
  onGetStarted,
  children,
}: BackgroundPathsProps) {
  const showHero = !children

  return (
    <div
      className="relative min-h-screen w-full flex items-center justify-center overflow-hidden"
      style={{ backgroundColor: "#000000" }}
    >
      <FloatingPaths position={1} />
      <FloatingPaths position={-1} />

      <div className="relative z-10 w-full flex items-center justify-center min-h-screen px-4">
        {showHero ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            {/* Title */}
            <h1 className="text-5xl sm:text-7xl font-bold mb-5 leading-none tracking-widest">
              <TextScramble
                text={title.toUpperCase()}
                style={{
                  color: "#3fb950",
                  fontFamily: "'Chau Philomene One', sans-serif",
                }}
                scrambleStyle={{ color: "rgba(63,185,80,0.3)" }}
                speed={50}
                revealSpeed={120}
                loop={true}
                holdDuration={1500}
              />
            </h1>

            {/* Subtitle */}
            <p className="text-[#7d8590] text-xs mb-10 tracking-widest">
              [ see what&apos;s breaking. fix it fast. ]
            </p>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              <button
                onClick={onGetStarted}
                className="group inline-block cursor-pointer border border-[#30363D] hover:border-[#3fb950] rounded px-8 py-3 transition-colors"
              >
                <TextScramble
                  text="GET STARTED"
                  style={{
                    color: "#e6edf3",
                    fontFamily: "'Chau Philomene One', sans-serif",
                  }}
                  scrambleStyle={{ color: "#a0aab4" }}
                  speed={80}
                  revealSpeed={220}
                />
              </button>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="w-full flex items-center justify-center"
          >
            {children}
          </motion.div>
        )}
      </div>
    </div>
  )
}