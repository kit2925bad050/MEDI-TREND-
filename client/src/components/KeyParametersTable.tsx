import React, { useState } from 'react';
import { ParameterComparison } from '../types';
import {
  ArrowDown,
  ArrowUp,
  Equal,
  Search,
  Download,
  Filter,
  Eye,
  CheckSquare,
  Square,
  Sparkles,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface KeyParametersTableProps {
  parameters: ParameterComparison[];
  baselineReportName: string;
  followUpReportName: string;
  baselineDate: string;
  followUpDate: string;
  onSelectParameterForChart: (param: ParameterComparison) => void;
  selectedParamName: string;
}

export const KeyParametersTable: React.FC<KeyParametersTableProps> = ({
  parameters,
  baselineReportName = 'Report 1',
  followUpReportName = 'Report 2',
  baselineDate = '25 Apr 2026',
  followUpDate = '29 Apr 2026',
  onSelectParameterForChart,
  selectedParamName,
}) => {
  const { dict } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const categories = ['All Categories', 'Cardiac & Inflammation', 'Lipid Profile', 'Glycemic Control', 'Renal Function', 'Vitamins'];

  const filteredParams = parameters.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.unit.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const totalPages = Math.ceil(filteredParams.length / itemsPerPage) || 1;
  const paginatedParams = filteredParams.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getStatusLabel = (trajectory: string) => {
    switch (trajectory) {
      case 'Improved':
        return dict.status_improved;
      case 'Stable':
        return dict.status_stable;
      case 'Needs Monitoring':
        return dict.status_monitoring;
      case 'Worsened':
        return dict.status_worsened;
      default:
        return trajectory;
    }
  };

  const handleDownloadCSV = () => {
    const headers = [dict.table_col_param, 'Unit', `${baselineReportName} (${baselineDate})`, `${followUpReportName} (${followUpDate})`, 'Absolute Change', 'Percentage Change', dict.status, 'Reference Range'];
    const rows = parameters.map((p) => [
      `"${p.name}"`,
      `"${p.unit}"`,
      p.beforeValue ?? 'N/A',
      p.afterValue ?? 'N/A',
      p.absoluteChange ?? 'N/A',
      p.percentChange !== null ? `${p.percentChange}%` : 'N/A',
      getStatusLabel(p.trajectory),
      `"${p.referenceRange}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `MEDI_TREND_Comparison_${baselineDate}_to_${followUpDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-5 select-none transition-colors duration-200">
      {/* Title & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>{dict.table_title}</span>
            <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
              ({baselineReportName} to {followUpReportName})
            </span>
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {dict.table_subtitle} {baselineReportName} ({baselineDate}) and {followUpReportName} ({followUpDate})
          </p>
        </div>

        {/* Search & Category Filter */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-48">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder={dict.table_search_placeholder}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-500 dark:text-slate-200"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 py-1.5 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none cursor-pointer"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto mt-2">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 font-semibold">
              <th className="py-2.5 px-3 w-8">#</th>
              <th className="py-2.5 px-3">{dict.table_col_param}</th>
              <th className="py-2.5 px-3 text-right">
                {baselineReportName}
                <div className="text-[10px] font-normal text-slate-400">{baselineDate}</div>
              </th>
              <th className="py-2.5 px-3 text-right">
                {followUpReportName}
                <div className="text-[10px] font-normal text-slate-400">{followUpDate}</div>
              </th>
              <th className="py-2.5 px-3 text-center">{dict.table_col_change}</th>
              <th className="py-2.5 px-3 text-center">{dict.table_col_status}</th>
              <th className="py-2.5 px-3 text-center">{dict.table_col_trend}</th>
              <th className="py-2.5 px-3 text-center">{dict.table_col_action}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
            {paginatedParams.map((param, index) => {
              const isSelected = selectedParamName === param.name;
              const isImproved = param.trajectory === 'Improved';
              const isStable = param.trajectory === 'Stable';
              const isWorsened = param.trajectory === 'Worsened';
              const isMonitoring = param.trajectory === 'Needs Monitoring';

              return (
                <tr
                  key={param.name}
                  onClick={() => onSelectParameterForChart(param)}
                  className={`cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-brand-50/60 dark:bg-brand-950/40 font-semibold'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <td className="py-3 px-3">
                    <div
                      className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                        isSelected
                          ? 'border-brand-500 bg-brand-500 text-white'
                          : 'border-slate-300 dark:border-slate-600'
                      }`}
                    >
                      {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                    </div>
                  </td>

                  {/* Parameter Name & Unit */}
                  <td className="py-3 px-3">
                    <div className="font-bold text-slate-900 dark:text-white">
                      {param.name}{' '}
                      <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">
                        ({param.unit})
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {dict.table_ref_range}: {param.referenceRange}
                    </div>
                  </td>

                  {/* Baseline Value */}
                  <td className="py-3 px-3 text-right font-mono font-semibold">
                    {param.beforeValue !== null ? param.beforeValue : '—'}
                  </td>

                  {/* Follow-up Value */}
                  <td className="py-3 px-3 text-right font-mono font-bold text-brand-600 dark:text-brand-400">
                    {param.afterValue !== null ? param.afterValue : '—'}
                  </td>

                  {/* Change % */}
                  <td className="py-3 px-3 text-center font-mono">
                    {param.percentChange !== null ? (
                      <span
                        className={`inline-flex items-center gap-1 font-bold ${
                          param.percentChange < 0
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : param.percentChange > 0
                            ? 'text-brand-600 dark:text-brand-400'
                            : 'text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {param.percentChange < 0 && <ArrowDown className="w-3.5 h-3.5" />}
                        {param.percentChange > 0 && <ArrowUp className="w-3.5 h-3.5" />}
                        {param.percentChange === 0 && <Equal className="w-3 h-3" />}
                        {Math.abs(param.percentChange)}%
                      </span>
                    ) : (
                      <span className="text-slate-400">N/A</span>
                    )}
                  </td>

                  {/* Status Badge */}
                  <td className="py-3 px-3 text-center">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                        isImproved
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          : isStable
                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                          : isMonitoring
                          ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                          : 'bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 border border-red-200 dark:border-red-800'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isImproved
                            ? 'bg-emerald-500'
                            : isStable
                            ? 'bg-blue-500'
                            : isMonitoring
                            ? 'bg-amber-500'
                            : 'bg-red-500'
                        }`}
                      />
                      {getStatusLabel(param.trajectory)}
                    </span>
                  </td>

                  {/* Sparkline mini trend */}
                  <td className="py-3 px-3 text-center">
                    <div className="w-14 h-5 mx-auto">
                      <svg className="w-full h-full" viewBox="0 0 60 20">
                        <path
                          d={
                            isImproved
                              ? 'M0,18 Q15,4 30,8 T60,2'
                              : isStable
                              ? 'M0,10 L20,10 L40,11 L60,10'
                              : 'M0,4 L20,8 L40,14 L60,18'
                          }
                          fill="none"
                          stroke={
                            isImproved ? '#10b981' : isStable ? '#3b82f6' : '#f59e0b'
                          }
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </svg>
                    </div>
                  </td>

                  {/* Action */}
                  <td className="py-3 px-3 text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectParameterForChart(param);
                      }}
                      className="text-brand-600 hover:text-brand-700 font-bold hover:underline"
                    >
                      {dict.trend}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer: Pagination & CSV Download */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 mt-3 border-t border-slate-100 dark:border-slate-800">
        <div className="text-xs text-slate-500 dark:text-slate-400">
          {dict.table_showing_count} {paginatedParams.length} of {filteredParams.length} parameters
        </div>

        {/* Pagination Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-xs text-slate-600 dark:text-slate-300 disabled:opacity-40"
          >
            &lt;
          </button>
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              className={`w-7 h-7 rounded-lg text-xs font-semibold ${
                currentPage === i + 1
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
              }`}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-xs text-slate-600 dark:text-slate-300 disabled:opacity-40"
          >
            &gt;
          </button>
        </div>

        {/* Download CSV Button */}
        <button
          onClick={handleDownloadCSV}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
        >
          <Download className="w-3.5 h-3.5" />
          <span>{dict.table_download_csv}</span>
        </button>
      </div>
    </div>
  );
};
