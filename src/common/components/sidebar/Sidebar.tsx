'use client';

import { motion } from 'framer-motion';
import React from 'react';

import { useLayoutStore } from '@/common/hooks/useLayoutStore';
import { fadeUp } from '@/common/styles/motion';

import Logo from './Logo';
import Navigation from './Navigation';

const Sidebar: React.FC = React.memo(() => {
  const { activeMenu } = useLayoutStore();

  if (!activeMenu) return null;

  return (
    <motion.aside
      initial="hidden"
      animate="show"
      variants={{
        hidden: { opacity: 0, x: -8 },
        show: {
          opacity: 1,
          x: 0,
          transition: { duration: 0.32, ease: [0.16, 1, 0.3, 1] },
        },
      }}
      className="ml-3 flex h-screen flex-col overflow-y-auto pb-10 md:overflow-hidden md:hover:overflow-auto"
    >
      <motion.div variants={fadeUp} initial="hidden" animate="show">
        <Logo />
      </motion.div>
      <Navigation />
    </motion.aside>
  );
});

export default Sidebar;
