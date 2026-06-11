import { motion } from 'framer-motion';
import React from 'react';

interface NavButtonProps {
  title: string;
  customFunc: () => void;
  icon: React.ReactNode;
  color: string;
  dotColor?: string;
}

const NavButton: React.FC<NavButtonProps> = React.memo(
  ({ title, customFunc, icon, color, dotColor }) => (
    <motion.button
      type="button"
      title={title}
      onClick={() => customFunc()}
      style={{ color }}
      whileHover={{ scale: 1.08, rotate: -4 }}
      whileTap={{ scale: 0.92 }}
      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
      className="hover:bg-muted/80 relative rounded-full p-3 text-xl transition-colors"
    >
      {dotColor && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          style={{ background: dotColor }}
          className="absolute top-2 right-2 inline-flex h-2 w-2 rounded-full"
        />
      )}
      {icon}
    </motion.button>
  )
);

export default NavButton;
