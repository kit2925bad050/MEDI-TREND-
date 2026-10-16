import React from 'react';
import { ArrowUp, ArrowDown, Equal, AlertTriangle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface SummaryStatCardsProps {
  improved: number;
  stable: number;
  monitoring: number;
  worsened: number;
}

export const SummaryStatCards: React.FC<SummaryStatCardsProps> = ({
  improved = 12,
  stable = 6,
  monitoring = 3,
  worsened = 1,
}) => {
  const { dict } = useLanguage();

  const cards = [
    {
      label: dict.stat_improved,
      count: improved,
      icon: ArrowUp,
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/40',
      borderColor: 'border-emerald-200/80 dark:border-emerald-800/60',
      iconBg: 'bg-emerald-500 text-white',
      textColor: 'text-emerald-700 dark:text-emerald-300',
      sparkColor: '#10b981',
      sparkPath: 'M0,18 Q15,14 30,16 T60,8 T90,2',
    },
    {
      label: dict.stat_stable,
      count: stable,
      icon: Equal,
      bgColor: 'bg-blue-50 dark:bg-blue-950/40',
      borderColor: 'border-blue-200/80 dark:border-blue-800/60',
      iconBg: 'bg-blue-500 text-white',
      textColor: 'text-blue-700 dark:text-blue-300',
      sparkColor: '#3b82f6',
      sparkPath: 'M0,10 Q20,8 45,12 T90,10',
    },
    {
      label: dict.stat_monitoring,
      count: monitoring,
      icon: AlertTriangle,
      bgColor: 'bg-amber-50 dark:bg-amber-950/40',
      borderColor: 'border-amber-200/80 dark:border-amber-800/60',
      iconBg: 'bg-amber-500 text-white',
      textColor: 'text-amber-700 dark:text-amber-300',
      sparkColor: '#f59e0b',
      sparkPath: 'M0,12 Q25,18 50,8 T90,14',
    },
    {
      label: dict.stat_worsened,
      count: worsened,
      icon: ArrowDown,
      bgColor: 'bg-red-50 dark:bg-red-950/40',
      borderColor: 'border-red-200/80 dark:border-red-800/60',
      iconBg: 'bg-red-500 text-white',
      textColor: 'text-red-700 dark:text-red-300',
      sparkColor: '#ef4444',
      sparkPath: 'M0,4 Q25,8 55,14 T90,18',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className={`p-4 rounded-2xl border ${card.borderColor} ${card.bgColor} shadow-sm flex items-center justify-between transition-all hover:shadow-md select-none`}
          >
            <div className="flex items-center gap-3.5">
              <div className={`w-10 h-10 rounded-xl ${card.iconBg} flex items-center justify-center shadow-sm`}>
                <Icon className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <div className="text-2xl font-black text-slate-900 dark:text-white leading-none">
                  {card.count}
                </div>
                <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-1">
                  {card.label}
                </div>
              </div>
            </div>

            {/* Sparkline */}
            <div className="w-16 h-8 hidden sm:block opacity-80">
              <svg className="w-full h-full" viewBox="0 0 90 20">
                <path
                  d={card.sparkPath}
                  fill="none"
                  stroke={card.sparkColor}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
        );
      })}
    </div>
  );
};
