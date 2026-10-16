import React, { useState } from 'react';
import { ParameterComparison, PatientProfile } from '../types';
import { TrendingUp, Activity, Filter, Calendar, Layers, ShieldCheck, ArrowRight } from 'lucide-react';
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
import { EmptyState } from '../components/common/EmptyState';
import { useLanguage } from '../context/LanguageContext';

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

interface TrendsPageProps {
  patient: PatientProfile | null;
  parameters: ParameterComparison[];
  selectedParam: ParameterComparison | null;
  onSelectParamName: (name: string) => void;
}

export const TrendsPage: React.FC<TrendsPageProps> = ({
  patient,
  parameters,
  selectedParam,
  onSelectParamName,
}) => {
  const { dict } = useLanguage();
  const [timeRange, setTimeRange] = useState<'3M' | '6M' | '1Y' | 'All'>('All');

  if (!patient) {
    return (
      <div className="p-6">
        <EmptyState
          icon={TrendingUp}
          title="No Patient Profile Selected"
          description="Select a patient to visualize their longitudinal parameter trends across time."
        />
      </div>
    );
  }

  if (parameters.length === 0 || !selectedParam) {
    return (
      <div className="p-6">
        <EmptyState
          icon={TrendingUp}
          title="No Longitudinal Trend Data Available"
          description={`Patient ${patient.name} does not have analyzed laboratory parameter history yet. Upload at least 2 reports and run an analysis to plot trend curves.`}
        />
      </div>
    );
  }

  const history = selectedParam.trendHistory || [];
  const labels = history.map((h) => `${h.reportDate}\n(${h.reportId})`);
  const values = history.map((h) => h.value);

  // Dynamic clinical reference limit calculation
  let refMax = 1.0;
  if (selectedParam.name === 'hs-CRP') refMax = 1.0;
  else if (selectedParam.name === 'Homocysteine') refMax = 15.0;
  else if (selectedParam.name === 'HDL Cholesterol') refMax = 60.0;
  else if (selectedParam.name === 'LDL Cholesterol') refMax = 100.0;
  else if (selectedParam.name === 'Triglycerides') refMax = 150.0;
  else if (selectedParam.name === 'HbA1c') refMax = 5.7;
  else if (selectedParam.name === 'Vitamin D') refMax = 100.0;
  else if (selectedParam.name === 'eGFR') refMax = 120.0;

  const chartData = {
    labels: labels.length > 0 ? labels : ['Point 1', 'Point 2'],
    datasets: [
      {
        label: `${dict.trends_observed_values} (${selectedParam.unit})`,
        data: values,
        borderColor: '#0284c7',
        backgroundColor: 'rgba(2, 132, 199, 0.12)',
        borderWidth: 3.5,
        pointBackgroundColor: '#0284c7',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2.5,
        pointRadius: 6,
        pointHoverRadius: 9,
        tension: 0.32,
        fill: true,
      },
      {
        label: `${dict.trends_normal_range} (${refMax} ${selectedParam.unit})`,
        data: Array(labels.length || 2).fill(refMax),
        borderColor: 'rgba(16, 185, 129, 0.65)',
        borderDash: [6, 6],
        borderWidth: 2,
        pointRadius: 0,
        fill: false,
      },
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
          boxWidth: 14,
          usePointStyle: true,
          font: { size: 11, weight: '600' },
          color: '#64748b',
        },
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        titleFont: { size: 12, weight: 'bold' },
        bodyFont: { size: 12 },
        padding: 12,
        cornerRadius: 12,
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
        ticks: { font: { size: 11 }, color: '#94a3b8' },
      },
      y: {
        grid: { color: 'rgba(226, 232, 240, 0.6)' },
        ticks: { font: { size: 11 }, color: '#94a3b8' },
      },
    },
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span>{dict.trends_page_title}</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
              {parameters.length} Parameters
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {dict.trends_page_subtitle}
          </p>
        </div>

        {/* Parameter Selector Dropdown */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={selectedParam.name}
            onChange={(e) => onSelectParamName(e.target.value)}
            className="w-full sm:w-64 text-xs font-bold bg-brand-50 dark:bg-slate-800 text-brand-700 dark:text-brand-300 py-2 px-3.5 rounded-xl border border-brand-200 dark:border-slate-700 focus:outline-none cursor-pointer"
          >
            {parameters.map((p) => (
              <option key={p.name} value={p.name}>
                {p.name} ({p.unit})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Chart Canvas */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="text-base font-bold text-slate-900 dark:text-white">
              {selectedParam.name} - {dict.trends_chart_title}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Unit: <b>{selectedParam.unit}</b> • {dict.table_ref_range}: <b>{selectedParam.referenceRange}</b> • {dict.status}: <b>{selectedParam.trajectory}</b>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
            {(['3M', '6M', '1Y', 'All'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTimeRange(t)}
                className={`px-3 py-1 rounded-lg transition ${
                  timeRange === t
                    ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Chart Viewport */}
        <div className="h-80 w-full pt-2">
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>

      {/* Parameter Cards Quick Grid */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
          {dict.trends_select_param}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {parameters.map((p) => {
            const isSelected = selectedParam.name === p.name;
            return (
              <div
                key={p.name}
                onClick={() => onSelectParamName(p.name)}
                className={`p-3 rounded-xl border transition-all cursor-pointer select-none text-center ${
                  isSelected
                    ? 'bg-brand-50 dark:bg-brand-950/60 border-brand-400 text-brand-700 dark:text-brand-300 ring-2 ring-brand-500/20 shadow-sm'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="text-xs font-bold truncate">{p.name}</div>
                <div className="text-[11px] font-mono font-semibold text-brand-600 dark:text-brand-400 mt-0.5">
                  {p.afterValue} {p.unit}
                </div>
                <div className={`text-[10px] font-bold mt-1 ${
                  p.trajectory === 'Improved' ? 'text-emerald-600' : p.trajectory === 'Worsened' ? 'text-red-500' : 'text-slate-500'
                }`}>
                  {p.trajectory}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
