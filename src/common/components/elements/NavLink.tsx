import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';

const activeLink =
  'flex items-center gap-5 pl-4 pt-3 pb-2.5 rounded-lg text-white text-md m-2';
const normalLink =
  'flex items-center gap-5 pl-4 pt-3 pb-2.5 rounded-lg text-md text-gray-700 dark:text-gray-200 dark:hover:text-black hover:bg-light-gray m-2';

interface NavLinkProps {
  href: string;
  exact?: boolean;
  children: React.ReactNode;
  currentColor: string;
  className?: string;
  style?: React.CSSProperties;
  onClick?: (event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => void;
}

const NavLink: React.FC<NavLinkProps> = React.memo(
  ({ href, exact = false, children, currentColor, ...props }) => {
    const pathname = usePathname();
    const isActive = exact ? pathname === href : pathname.startsWith(href);

    const newProps = {
      ...props,
      className: isActive ? `${activeLink} active` : normalLink,
      style: { backgroundColor: isActive ? currentColor : '' },
    };

    return (
      <Link href={href} {...newProps}>
        {children}
      </Link>
    );
  }
);

export default NavLink;
