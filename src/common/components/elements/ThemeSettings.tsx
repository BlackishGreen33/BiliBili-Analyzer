'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useTheme } from 'next-themes';
import React from 'react';
import { BsCheck } from 'react-icons/bs';
import { FaXmark } from 'react-icons/fa6';

import { Button } from '@/common/components/ui/button';
import { useThemeStore } from '@/common/hooks/useThemeStore';
import { EASE_OUT_EXPO, fadeUp } from '@/common/styles/motion';

const ACCENT_COLORS = [
  { name: '粉色 (B 站)', color: '#FB7299' },
  { name: '青色', color: '#03C9D7' },
  { name: '蓝紫', color: '#7352FF' },
  { name: '橙红', color: '#FF5C8E' },
  { name: '深蓝', color: '#1E4DB7' },
  { name: '橘黄', color: '#FB9678' },
];

const ThemeSettings: React.FC = React.memo(() => {
  const { setCurrentColor, currentColor, themeSettings, setThemeSettings } =
    useThemeStore();
  const { setTheme, theme } = useTheme();

  return (
    <AnimatePresence>
      {themeSettings && (
        <motion.div
          key="theme-settings-backdrop"
          role="dialog"
          aria-label="主题设置"
          aria-modal="true"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={() => setThemeSettings(false)}
          className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm"
        >
          <motion.aside
            key="theme-settings-panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.32, ease: EASE_OUT_EXPO }}
            onClick={(e) => e.stopPropagation()}
            className="bg-popover text-popover-foreground h-full w-96 max-w-full overflow-y-auto p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <p className="text-lg font-semibold">设定</p>
              <Button
                variant="ghost"
                size="icon"
                aria-label="关闭"
                onClick={() => setThemeSettings(false)}
                className="cursor-pointer"
              >
                <FaXmark />
              </Button>
            </div>

            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="show"
              className="mt-6 border-t pt-6"
            >
              <p className="text-base font-semibold">主题模式</p>
              <div className="mt-4 space-y-2">
                {(['light', 'dark'] as const).map((mode) => (
                  <motion.label
                    key={mode}
                    whileHover={{ x: 2 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.18, ease: EASE_OUT_EXPO }}
                    className="hover:bg-muted/60 flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors"
                  >
                    <input
                      type="radio"
                      name="theme"
                      value={mode}
                      checked={theme === mode}
                      onChange={() => setTheme(mode)}
                      className="h-4 w-4 cursor-pointer"
                    />
                    {mode === 'light' ? '浅色模式' : '深色模式'}
                  </motion.label>
                ))}
              </div>
            </motion.div>

            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="show"
              transition={{ delay: 0.06 }}
              className="mt-6 border-t pt-6"
            >
              <p className="text-base font-semibold">主题颜色</p>
              <div className="mt-4 flex flex-wrap gap-3">
                {ACCENT_COLORS.map((item) => {
                  const isActive =
                    item.color.toLowerCase() === currentColor.toLowerCase();
                  return (
                    <motion.button
                      key={item.color}
                      type="button"
                      title={item.name}
                      aria-label={item.name}
                      aria-pressed={isActive}
                      onClick={() => setCurrentColor(item.color)}
                      whileHover={{ scale: 1.12 }}
                      whileTap={{ scale: 0.92 }}
                      transition={{ duration: 0.18, ease: EASE_OUT_EXPO }}
                      style={{ backgroundColor: item.color }}
                      className="ring-offset-popover focus:ring-ring relative h-10 w-10 cursor-pointer rounded-full ring-offset-2 transition focus:ring-2 focus:outline-none"
                    >
                      {isActive && (
                        <BsCheck className="absolute top-1/2 left-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 text-white" />
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

export default ThemeSettings;
