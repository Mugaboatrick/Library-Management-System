import React from 'react';
import { publicUrl } from '../../services/api';

const UserAvatar = ({ user, size = 'md', className = '' }) => {
  const initials = `${user?.first_name?.[0] || ''}${user?.last_name?.[0] || ''}`.toUpperCase() || '👤';
  const imgSrc = publicUrl(user?.profile_image);

  const sizes = {
    sm: 'w-9 h-9 text-sm',
    md: 'w-12 h-12 text-lg',
    lg: 'w-20 h-20 text-3xl'
  };

  if (imgSrc) {
    return (
      <img
        src={imgSrc}
        alt={`${user?.first_name || ''} ${user?.last_name || ''}`}
        className={`${sizes[size] || sizes.md} rounded-full object-cover ring-2 ring-white/60 shadow ${className}`}
      />
    );
  }

  return (
    <span className={`${sizes[size] || sizes.md} rounded-full bg-gradient-to-br from-primary-600 to-blue-500 text-white flex items-center justify-center font-bold ${className}`}>
      {initials}
    </span>
  );
};

export default UserAvatar;