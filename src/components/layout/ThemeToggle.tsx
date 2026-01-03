import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';

export const ThemeToggle = forwardRef<HTMLButtonElement>((props, ref) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="relative overflow-hidden"
      {...props}
    >
      <motion.div
        key={theme}
        initial={{ rotate: -90, opacity: 0 }}
        animate={{ rotate: 0, opacity: 1 }}
        exit={{ rotate: 90, opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        {theme === 'light' ? (
          <Sun className="w-5 h-5 text-foreground" />
        ) : (
          <Moon className="w-5 h-5 text-foreground" />
        )}
      </motion.div>
    </Button>
  );
});

ThemeToggle.displayName = 'ThemeToggle';
