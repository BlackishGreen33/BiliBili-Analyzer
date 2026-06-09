'use client';

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
    return (
      <button
        type="button"
        style={{ backgroundColor: bgColor, color, borderRadius }}
        className={`text-${size} w-${width} p-3 hover:bg-${bgHoverColor} hover:drop-shadow-xl`}
      >
        {icon} {text}
      </button>
    );
  }
);

export default Button;
