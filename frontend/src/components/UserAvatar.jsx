import React, { useState, useEffect } from 'react';

export default function UserAvatar({ 
  name = '', 
  avatar = '', 
  src = '', 
  size = 'md', 
  className = '' 
}) {
  const [imageError, setImageError] = useState(false);
  const imageSrc = src || avatar;

  const getInitials = (str) => {
    if (!str) return 'U';
    const parts = str.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return str.slice(0, 2).toUpperCase();
  };

  const sizeClasses = {
    xs: 'w-6 h-6 text-[9px]',
    sm: 'w-8 h-8 text-[11px]',
    md: 'w-10 h-10 text-xs',
    lg: 'w-12 h-12 text-sm',
    xl: 'w-16 h-16 text-base',
    '2xl': 'w-24 h-24 text-2xl',
  };

  const selectedSize = sizeClasses[size] || sizeClasses.md;
  const initials = getInitials(name);

  useEffect(() => {
    setImageError(false);
  }, [imageSrc]);

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 rounded-2xl overflow-hidden font-bold select-none tracking-wider shadow-sm transition-transform duration-200 ${
        !imageSrc || imageError 
          ? 'bg-gradient-to-br from-[#39333B] via-[#2F2832] to-[#211B23] text-[#DFC090] border border-[#524456]' 
          : 'bg-slate-100 border border-slate-200'
      } ${selectedSize} ${className}`}
      title={name}
    >
      {imageSrc && !imageError ? (
        <img
          src={imageSrc}
          alt={name}
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
        />
      ) : (
        <span className="drop-shadow-xs">{initials}</span>
      )}
    </div>
  );
}
