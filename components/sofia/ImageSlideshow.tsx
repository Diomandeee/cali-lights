"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

// Sofia's images - 7 photos
const SOFIA_IMAGES = [
  "/media/sfx/Sofia IMG/IMG_0004.JPG",
  "/media/sfx/Sofia IMG/IMG_0036.JPG",
  "/media/sfx/Sofia IMG/IMG_1980 2.jpg",
  "/media/sfx/Sofia IMG/IMG_3562.JPG",
  "/media/sfx/Sofia IMG/IMG_3563.JPG",
  "/media/sfx/Sofia IMG/IMG_3564.JPG",
  "/media/sfx/Sofia IMG/IMG_3565.JPG",
];

type ImageSlideshowProps = {
  autoPlay?: boolean;
  interval?: number;
};

export function ImageSlideshow({ autoPlay = true, interval = 4000 }: ImageSlideshowProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  useEffect(() => {
    if (!autoPlay) return;

    const timer = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % SOFIA_IMAGES.length);
    }, interval);

    return () => clearInterval(timer);
  }, [autoPlay, interval]);

  const goToSlide = (index: number) => {
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
  };

  const goToPrevious = () => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + SOFIA_IMAGES.length) % SOFIA_IMAGES.length);
  };

  const goToNext = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % SOFIA_IMAGES.length);
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
    }),
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto aspect-[4/3] rounded-3xl overflow-hidden border-4 border-white/20 shadow-2xl bg-black/20">
      <AnimatePresence initial={false} custom={direction} mode="wait">
        <motion.div
          key={currentIndex}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.2 },
          }}
          className="absolute inset-0"
        >
          <Image
            src={SOFIA_IMAGES[currentIndex]}
            alt={`Sofia ${currentIndex + 1}`}
            fill
            className="object-cover"
            priority={currentIndex === 0}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        </motion.div>
      </AnimatePresence>

      {/* Navigation Arrows */}
      <button
        onClick={goToPrevious}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-black/50 hover:bg-black/70 text-white backdrop-blur-sm transition-all hover:scale-110"
        aria-label="Previous image"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </button>

      <button
        onClick={goToNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-black/50 hover:bg-black/70 text-white backdrop-blur-sm transition-all hover:scale-110"
        aria-label="Next image"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-2">
        {SOFIA_IMAGES.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`transition-all rounded-full ${
              index === currentIndex
                ? "w-8 h-2 bg-white"
                : "w-2 h-2 bg-white/50 hover:bg-white/75"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Image Counter */}
      <div className="absolute top-4 right-4 z-10 px-3 py-1 rounded-full bg-black/50 text-white text-sm backdrop-blur-sm">
        {currentIndex + 1} / {SOFIA_IMAGES.length}
      </div>
    </div>
  );
}

