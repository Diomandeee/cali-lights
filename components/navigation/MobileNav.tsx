"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

type MobileNavProps = {
  items: Array<{ href: string; label: string }>;
};

export function MobileNav({ items }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden flex flex-col gap-1.5 p-2 -mr-2 touch-manipulation"
        aria-label="Toggle menu"
        aria-expanded={isOpen}
      >
        <motion.span
          className="block h-0.5 w-6 bg-white transition-all"
          animate={isOpen ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }}
        />
        <motion.span
          className="block h-0.5 w-6 bg-white transition-all"
          animate={isOpen ? { opacity: 0 } : { opacity: 1 }}
        />
        <motion.span
          className="block h-0.5 w-6 bg-white transition-all"
          animate={isOpen ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }}
        />
      </button>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm md:hidden"
            />
            
            {/* Menu Panel */}
            <motion.nav
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 z-50 h-full w-64 bg-black/95 backdrop-blur-xl border-l border-white/10 p-6 md:hidden safe-area-inset-right"
            >
              <div className="flex flex-col gap-1 mt-12">
                {items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className="block px-4 py-4 text-lg font-medium text-white/70 hover:text-white hover:bg-white/5 rounded-xl transition-all touch-manipulation"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

