import React from 'react';
import { LucideIcon, FolderOpen, Plus } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionText?: string;
  onSecondaryAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = FolderOpen,
  title,
  description,
  actionText,
  actionLabel,
  onAction,
  secondaryActionText,
  onSecondaryAction,
}) => {
  const btnLabel = actionLabel || actionText;

  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40 backdrop-blur-sm select-none">
      <div className="w-14 h-14 rounded-2xl bg-brand-50 dark:bg-brand-950/60 border border-brand-200/60 dark:border-brand-800/60 flex items-center justify-center text-brand-600 dark:text-brand-400 mb-4 shadow-sm">
        <Icon className="w-7 h-7" />
      </div>

      <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
        {title}
      </h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1.5 leading-relaxed">
        {description}
      </p>

      {(btnLabel || secondaryActionText) && (
        <div className="flex items-center gap-3 mt-5">
          {btnLabel && onAction && (
            <button
              onClick={onAction}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md shadow-brand-600/20 transition"
            >
              <Plus className="w-4 h-4" />
              <span>{btnLabel}</span>
            </button>
          )}

          {secondaryActionText && onSecondaryAction && (
            <button
              onClick={onSecondaryAction}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition"
            >
              {secondaryActionText}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
