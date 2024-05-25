'use client';

import useStore, { initialState } from '@/common/hooks/useStore';
import React from 'react';

interface ButtonProps {
  icon?: React.ReactNode;
  bgColor?: string;
  color?: string;
  bgHoverColor?: string;
  size?: string;
  text?: string;
  borderRadius?: string;
  width?: string;
}

const Button: React.FC<ButtonProps> = React.memo(
  ({ icon, bgColor, color, bgHoverColor, size, text, borderRadius, width }) => {
    const { setIsClicked } = useStore();

    return (
      <button
        type="button"
        onClick={() => setIsClicked(initialState)}
        style={{ backgroundColor: bgColor, color, borderRadius }}
        className={` text-${size} p-3 w-${width} hover:drop-shadow-xl hover:bg-${bgHoverColor}`}
      >
        {icon} {text}
      </button>
    );
  }
);

export default Button;
