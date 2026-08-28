import React from 'react';
import { motion } from 'motion/react';
import { useApp } from '../context/AppContext';

export const HoneycombBackground: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const { settings, isAdminOpen, setIsAdminOpen, currentScreen } = useApp();

  const getScreenLabel = () => {
    switch (currentScreen) {
      case 'home':
        return 'Muka Depan';
      case 'health-boxes':
        return `3 Gambar Kesihatan Diri (${settings.boxes.length} Kotak)`;
      default:
        return settings.appName;
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#FFFBEB] font-sans flex flex-col overflow-x-hidden relative text-[#78350F] selection:bg-[#F59E0B] selection:text-white">
      {/* Geometric Hexagon Grid Pattern Overlay */}
      {settings.showHoneycombGrid && (
        <div
          className="absolute inset-0 opacity-15 pointer-events-none z-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l25.98 15v30L30 60 4.02 45V15z' fill-rule='evenodd' stroke='%23F59E0B' stroke-width='2' fill='none'/%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px',
          }}
        />
      )}

      {/* Floating Geometric Decorative Hexagons */}
      {settings.showFloatingHexagons && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          {[
            { top: '6%', left: '3%', size: 64, delay: 0 },
            { top: '18%', right: '4%', size: 80, delay: 1.2 },
            { top: '68%', left: '5%', size: 90, delay: 2.1 },
            { top: '80%', right: '6%', size: 72, delay: 0.7 },
          ].map((item, index) => (
            <motion.div
              key={index}
              animate={{
                y: [0, -10, 0],
                rotate: [0, 6, 0],
              }}
              transition={{
                duration: 6 + index,
                repeat: Infinity,
                delay: item.delay,
                ease: 'easeInOut',
              }}
              className="absolute opacity-20"
              style={{
                top: item.top,
                left: item.left,
                right: item.right,
                width: item.size,
                height: item.size,
              }}
            >
              <svg
                viewBox="0 0 100 115.47"
                className="w-full h-full text-[#F59E0B] fill-[#FEF3C7] stroke-[#F59E0B] stroke-[3]"
              >
                <polygon points="50 0, 100 28.87, 100 86.6, 50 115.47, 0 86.6, 0 28.87" />
              </svg>
            </motion.div>
          ))}
        </div>
      )}

      {/* Main App Content Viewport */}
      <div className="relative z-10 flex-1 flex flex-col">{children}</div>
    </div>
  );
};

