import React from 'react';
import { motion } from 'motion/react';

interface BeeMascotProps {
  size?: number;
  className?: string;
  expression?: 'happy' | 'excited' | 'thinking' | 'proud';
  speechBubble?: string;
  animate?: boolean;
}

export const BeeMascot: React.FC<BeeMascotProps> = ({
  size = 100,
  className = '',
  expression = 'happy',
  speechBubble,
  animate = true,
}) => {
  return (
    <div className={`relative inline-flex flex-col items-center select-none ${className}`}>
      {speechBubble && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="mb-2 bg-amber-50 border-2 border-amber-300 text-amber-950 font-bold px-3 py-1.5 rounded-2xl text-xs md:text-sm shadow-md relative z-10 max-w-[200px] text-center"
        >
          {speechBubble}
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-x-8 border-x-transparent border-t-8 border-t-amber-300"></div>
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-0 h-0 border-x-6 border-x-transparent border-t-6 border-t-amber-50"></div>
        </motion.div>
      )}

      <motion.div
        animate={
          animate
            ? {
                y: [0, -8, 0, 8, 0],
                rotate: [0, 2, 0, -2, 0],
              }
            : {}
        }
        transition={{
          repeat: Infinity,
          duration: 3,
          ease: 'easeInOut',
        }}
        className="relative"
        style={{ width: size, height: size * 0.9 }}
      >
        <svg
          viewBox="0 0 120 100"
          className="w-full h-full drop-shadow-lg"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Wings */}
          <motion.g
            animate={animate ? { scaleY: [1, 0.4, 1, 0.4, 1] } : {}}
            transition={{ repeat: Infinity, duration: 0.35, ease: 'linear' }}
          >
            {/* Left Wing */}
            <path
              d="M42 35 C30 10, 10 20, 25 45 C35 55, 45 45, 42 35 Z"
              fill="#E0F2FE"
              stroke="#38BDF8"
              strokeWidth="2.5"
              fillOpacity="0.85"
            />
            {/* Right Wing */}
            <path
              d="M78 35 C90 10, 110 20, 95 45 C85 55, 75 45, 78 35 Z"
              fill="#E0F2FE"
              stroke="#38BDF8"
              strokeWidth="2.5"
              fillOpacity="0.85"
            />
          </motion.g>

          {/* Stinger */}
          <path d="M60 88 L55 78 L65 78 Z" fill="#1E293B" />

          {/* Bee Body */}
          <ellipse cx="60" cy="58" rx="34" ry="26" fill="#FBBF24" stroke="#D97706" strokeWidth="3" />

          {/* Stripes */}
          <path
            d="M40 42 C48 38, 72 38, 80 42 C78 52, 78 64, 80 74 C72 78, 48 78, 40 74 C42 64, 42 52, 40 42 Z"
            fill="#1E293B"
            clipPath="url(#bodyClip)"
          />
          <clipPath id="bodyClip">
            <ellipse cx="60" cy="58" rx="33" ry="25" />
          </clipPath>

          {/* Second Black Stripe */}
          <path
            d="M48 36 C54 35, 66 35, 72 36 L72 80 C66 81, 54 81, 48 80 Z"
            fill="#1E293B"
            clipPath="url(#bodyClip)"
          />

          {/* Rosy Cheeks */}
          <ellipse cx="44" cy="62" rx="4" ry="3" fill="#F43F5E" opacity="0.6" />
          <ellipse cx="76" cy="62" rx="4" ry="3" fill="#F43F5E" opacity="0.6" />

          {/* Eyes */}
          {expression === 'proud' ? (
            <>
              <path d="M46 54 Q50 50 54 54" stroke="#0F172A" strokeWidth="3" strokeLinecap="round" fill="none" />
              <path d="M66 54 Q70 50 74 54" stroke="#0F172A" strokeWidth="3" strokeLinecap="round" fill="none" />
            </>
          ) : (
            <>
              <circle cx="50" cy="52" r="4.5" fill="#0F172A" />
              <circle cx="51.5" cy="50.5" r="1.5" fill="#FFFFFF" />
              <circle cx="70" cy="52" r="4.5" fill="#0F172A" />
              <circle cx="71.5" cy="50.5" r="1.5" fill="#FFFFFF" />
            </>
          )}

          {/* Smile */}
          {expression === 'excited' ? (
            <path
              d="M52 64 Q60 74 68 64 Z"
              fill="#BE123C"
              stroke="#0F172A"
              strokeWidth="2"
            />
          ) : (
            <path
              d="M54 62 Q60 69 66 62"
              stroke="#0F172A"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />
          )}

          {/* Antennae */}
          <path
            d="M50 36 Q42 22 36 24"
            stroke="#1E293B"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />
          <circle cx="35" cy="24" r="3.5" fill="#F59E0B" stroke="#1E293B" strokeWidth="2" />

          <path
            d="M70 36 Q78 22 84 24"
            stroke="#1E293B"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />
          <circle cx="85" cy="24" r="3.5" fill="#F59E0B" stroke="#1E293B" strokeWidth="2" />
        </svg>
      </motion.div>
    </div>
  );
};
