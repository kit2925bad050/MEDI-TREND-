import React from 'react';
import { Camera, User } from 'lucide-react';
import { getPatientInitials } from '../utils/avatar';

interface PatientAvatarProps {
  name: string;
  avatarUrl?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showStatus?: boolean;
  isActive?: boolean;
  onClick?: () => void;
  editable?: boolean;
}

export const PatientAvatar: React.FC<PatientAvatarProps> = ({
  name,
  avatarUrl,
  size = 'lg',
  showStatus = true,
  isActive = true,
  onClick,
  editable = true,
}) => {
  const initials = getPatientInitials(name);
  const isStockPhoto = avatarUrl && (avatarUrl.includes('unsplash') || avatarUrl.includes('placeholder') || avatarUrl.includes('stock'));
  const effectiveAvatarUrl = isStockPhoto ? undefined : avatarUrl;

  // Size mapping
  const sizeStyles = {
    sm: {
      container: 'w-9 h-9 text-xs',
      indicator: 'w-2.5 h-2.5 -bottom-0.5 -right-0.5 border',
      camera: 'w-3 h-3',
    },
    md: {
      container: 'w-12 h-12 text-sm',
      indicator: 'w-3 h-3 bottom-0 right-0 border-2',
      camera: 'w-4 h-4',
    },
    lg: {
      container: 'w-16 h-16 text-base',
      indicator: 'w-3.5 h-3.5 bottom-0 right-0 border-2',
      camera: 'w-5 h-5',
    },
    xl: {
      container: 'w-24 h-24 text-xl',
      indicator: 'w-4 h-4 bottom-1 right-1 border-2',
      camera: 'w-6 h-6',
    },
  }[size];

  return (
    <div
      onClick={editable ? onClick : undefined}
      className={`relative inline-block select-none ${
        editable ? 'cursor-pointer group' : ''
      }`}
      title={editable ? `Click to change photo for ${name}` : name}
    >
      {/* Avatar Circular Container */}
      <div
        className={`${sizeStyles.container} rounded-full flex items-center justify-center overflow-hidden transition-all duration-300 ring-2 ring-brand-500/20 dark:ring-cyan-500/30 shadow-md ${
          effectiveAvatarUrl
            ? 'bg-slate-100 dark:bg-slate-800'
            : 'bg-gradient-to-tr from-brand-600 via-brand-500 to-cyan-400 text-white font-bold tracking-wider'
        } ${editable ? 'group-hover:ring-brand-500 group-hover:shadow-lg' : ''}`}
      >
        {effectiveAvatarUrl ? (
          <img
            src={effectiveAvatarUrl}
            alt={name}
            className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
            onError={(e) => {
              // Fallback to initials if image fails to load
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <span className="drop-shadow-sm font-sans font-bold">
            {initials}
          </span>
        )}

        {/* Hover Camera Overlay if editable */}
        {editable && (
          <div className="absolute inset-0 rounded-full bg-slate-900/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center text-white">
            <Camera className={sizeStyles.camera} />
            {size === 'xl' && (
              <span className="text-[10px] font-medium mt-1">Change</span>
            )}
          </div>
        )}
      </div>

      {/* Separate Online/Active Indicator (does not cover face) */}
      {showStatus && (
        <span
          className={`absolute ${sizeStyles.indicator} rounded-full border-white dark:border-slate-900 ${
            isActive ? 'bg-emerald-500 shadow-sm' : 'bg-slate-400'
          }`}
        />
      )}
    </div>
  );
};
