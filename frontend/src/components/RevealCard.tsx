import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

export function RevealCard({
  children,
  className,
  index,
}: {
  children: ReactNode;
  className: string;
  index: number;
}) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.article
      className={className}
      initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
      transition={{
        delay: shouldReduceMotion ? 0 : index * 0.08,
        duration: shouldReduceMotion ? 0 : 0.32,
        ease: [0.22, 1, 0.36, 1],
      }}
      viewport={{ amount: 0.2, once: true }}
      whileHover={
        shouldReduceMotion
          ? undefined
          : {
              boxShadow: "0 8px 18px rgba(11, 49, 66, 0.08)",
              transition: { delay: 0, duration: 0.15 },
              y: -2,
            }
      }
      whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
    >
      {children}
    </motion.article>
  );
}
