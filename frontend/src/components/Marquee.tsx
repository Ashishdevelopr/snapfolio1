import { motion } from "framer-motion";
import React from "react";
import { Button } from "./ui/button";

interface MarqueeProps {
  items: string[];
  speed?: number;
  direction?: "left" | "right";
  onItemClick: (item: string) => void;
  className?: string;
}

export const Marquee: React.FC<MarqueeProps> = ({
  items,
  speed = 50,
  direction = "left",
  onItemClick,
  className = "",
}) => {
  const marqueeVariants = {
    animate: {
      x: direction === "left" ? ["0%", "-100%"] : ["-100%", "0%"],
      transition: {
        x: {
          repeat: Infinity,
          repeatType: "loop",
          duration: speed,
          ease: "linear",
        },
      },
    },
  };

  return (
    <div className={`relative w-full overflow-x-hidden whitespace-nowrap ${className}`}>
      {/* Left blur gradient */}
      <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none"></div>
      
      {/* Right blur gradient */}
      <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none"></div>
      
      <motion.div
        className="inline-block"
        variants={marqueeVariants}
        animate="animate"
      >
        {items.map((text, index) => (
          <Button
          key={`item-${index}`}
          variant="outline"
          className="rounded-full mx-2 my-1"
          
          onClick={() => onItemClick(text)}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#3a3a3a')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = '')}
        >
          {text}
        </Button>
        ))}
      </motion.div>
      <motion.div
        className="inline-block"
        variants={marqueeVariants}
        animate="animate"
      >
        {items.map((text, index) => (
          <Button
            key={`duplicate-${index}`}
            variant="outline"
            className="rounded-full mx-2 my-1"
            onClick={() => onItemClick(text)}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#3a3a3a')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = '')}
          >
            {text}
          </Button>
        ))}
      </motion.div>
    </div>
  );
}; 