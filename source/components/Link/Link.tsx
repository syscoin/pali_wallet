import React, { ReactNode, FC } from 'react';
import { Link as RouterLink } from 'react-router-dom';

interface ILink {
  children: ReactNode;
  className?: string;
  id?: string;
  onClick?: () => void;
  to: string;
}

export const Link: FC<ILink> = ({
  to,
  className = 'no-underline font-medium text-base font-poppins',
  children,
  id = 'link-btn',
  onClick,
}) => (
  <RouterLink className={className} to={to} onClick={onClick} id={id}>
    {children}
  </RouterLink>
);
