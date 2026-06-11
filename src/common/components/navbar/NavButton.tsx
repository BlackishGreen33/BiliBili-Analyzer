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
    <button
      type="button"
      title={title}
      onClick={() => customFunc()}
      style={{ color }}
      className="hover:bg-muted relative rounded-full p-3 text-xl"
    >
      {dotColor && (
        <span
          style={{ background: dotColor }}
          className="absolute top-2 right-2 inline-flex h-2 w-2 rounded-full"
        />
      )}
      {icon}
    </button>
  )
);

export default NavButton;
