import React, { useState } from 'react';
import { ParameterComparison } from '../types';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { TrendingUp, Maximize2, ShieldCheck, Activity } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ParameterTrendGraphProps {
  parameters: ParameterComparison[];
  selectedParam: ParameterComparison;
  onSelectParamName: (name: string) => void;
}

export const ParameterTrendGraph: React.FC<ParameterTrendGraphProps> = ({
  parameters,
  selectedParam,
  onSelectParamName,
}) => {
  const [timeFilter, setTimeFilter] = useState<'3M' | '6M' | '1Y' | 'All'>('All');

  // Multi-point trend data
  const history = selectedParam.trendHistory || [];
  let labels = history.map((h) => `${h.reportDate}\n(${h.reportId})`);
  let values = history.map((h) => h.value);

  // Fallback to before/after if trendHistory is empty but before/after exist
  if (values.length === 0 && (selectedParam.beforeValue !== undefined || selectedParam.afterValue !== undefined)) {
    labels = [selectedParam.baselineDate || 'Baseline', selectedParam.followUpDate || 'Latest'];
    values = [selectedParam.beforeValue ?? 0, selectedParam.afterValue ?? 0];
  }

  // Parse reference range bounds for shaded safe zone
  let refMax = 1.0;
  let refMin = 0.0;
  if (selectedParam.name === 'hs-CRP') {
    refMax = 1.0;
  } else if (selectedParam.name === 'Homocysteine') {
    refMax = 15.0;
  } else if (selectedParam.name === 'HDL Cholesterol') {
    refMin = 40.0;
    refMax = 70.0;
  } else if (selectedParam.name === 'LDL Cholesterol') {
    refMax = 100.0;
  } else if (selectedParam.name === 'Triglycerides') {
    refMax = 150.0;
  } else if (selectedParam.name === 'HbA1c') {
    refMax = 5.7;
    refMin = 4.0;
  } else if (selectedParam.name === 'Vitamin D') {
    refMin = 30.0;
    refMax = 100.0;
  } else if (selectedParam.name === 'eGFR') {
    refMin = 90.0;
    refMax = 120.0;
  }

  const computedMax = values.length > 0 ? Math.max(...values, refMax) * 1.25 : refMax * 1.25;

  const chartData = {
    labels: labels.length > 0 ? labels : ['No Reports'],
    datasets: [
      {
        label: `Patient Value (${selectedParam.unit})`,
        data: values.length > 0 ? values : [0],
        borderColor: '#0284c7',
        backgroundColor: 'rgba(2, 132, 199, 0.1)',
        borderWidth: 3,
        pointBackgroundColor: '#0284c7',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2.5,
        pointRadius: 6,
        pointHoverRadius: 8,
        tension: 0.35,
        fill: true,
      },
      {
        label: `Upper Safe Ref Limit (${refMax} ${selectedParam.unit})`,
        data: Array(labels.length || 1).fill(refMax),
        borderColor: 'rgba(16, 185, 129, 0.5)',
        borderDash: [6, 6],
        borderWidth: 1.8,
        pointRadius: 0,
        fill: false,
      }
    ],
  };

  const chartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        align: 'end' as const,
        labels: {
          boxWidth: 12,
          usePointStyle: true,
          font: { size: 10, weight: '600' },
          color: '#64748b',
        },
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.92)',
        titleFont: { size: 12, weight: 'bold' },
        bodyFont: { size: 12 },
        padding: 10,
        cornerRadius: 10,
        callbacks: {
          label: function (context: any) {
            return ` ${context.dataset.label}: ${context.parsed.y} ${selectedParam.unit}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 10 }, color: '#94a3b8' },
      },
      y: {
        grid: { color: 'rgba(226, 232, 240, 0.6)' },
        ticks: { font: { size: 10 }, color: '#94a3b8' },
        suggestedMax: computedMax,
      },
    },
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-5 select-none transition-colors duration-200 flex flex-col justify-between">
      {/* Top Controls */}
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-brand-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Parameter Trend Graph
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {/* Parameter Selector */}
            <select
              value={selectedParam.name}
              onChange={(e) => onSelectParamName(e.target.value)}
              className="text-xs font-bold bg-brand-50 dark:bg-slate-800 text-brand-700 dark:text-brand-300 py-1.5 px-3 rounded-xl border border-brand-200 dark:border-slate-700 focus:outline-none cursor-pointer"
            >
              {parameters.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Filters & Reference Indicator */}
        <div className="flex items-center justify-between text-xs py-2 px-1">
          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
            Unit: {selectedParam.unit} • Ref: {selectedParam.referenceRange}
          </span>

          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-[10px] font-bold">
            {(['3M', '6M', '1Y', 'All'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setTimeFilter(filter)}
                className={`px-2 py-0.5 rounded-md transition ${
                  timeFilter === filter
                    ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Chart Canvas Box */}
        <div className="h-44 w-full mt-1">
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>

      {/* Compare Before vs After Box */}
      <div className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700 flex items-center justify-between">
        <div>
          <div className="text-[10px] uppercase font-semibold text-slate-400">
            Baseline ({selectedParam.baselineDate || '25 Apr'})
          </div>
          <div className="text-sm font-black text-slate-800 dark:text-white font-mono">
            {selectedParam.beforeValue} {selectedParam.unit}
          </div>
        </div>

        <div className="text-center">
          <div className="text-[10px] uppercase font-semibold text-slate-400">
            Overall Delta
          </div>
          <div className={`text-xs font-black font-mono ${
            (selectedParam.percentChange || 0) < 0 ? 'text-emerald-600' : 'text-brand-600'
          }`}>
            {selectedParam.absoluteChange} ({selectedParam.percentChange}%)
          </div>
        </div>

        <div className="text-right">
          <div className="text-[10px] uppercase font-semibold text-slate-400">
            Latest ({selectedParam.followUpDate || '30 Jul'})
          </div>
          <div className="text-sm font-black text-brand-600 dark:text-brand-400 font-mono">
            {selectedParam.afterValue} {selectedParam.unit}
          </div>
        </div>
      </div>
    </div>
  );
};
