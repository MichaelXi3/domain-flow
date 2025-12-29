'use client';

import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { DomainStat } from '@/lib/types';
import { formatDuration } from '@/lib/calc';
import { dbHelpers } from '@/lib/db';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface DomainSummaryProps {
  domainStats: DomainStat[];
  title?: string;
}

export const DomainSummary: React.FC<DomainSummaryProps> = ({
  domainStats,
  title = 'Time Distribution',
}) => {
  const allDomains = useLiveQuery(() => dbHelpers.getAllDomains(), []);

  // Create domain color map
  const domainColorMap = React.useMemo(() => {
    if (!allDomains) return {} as Record<string, string>;
    return allDomains.reduce(
      (acc, domain) => {
        acc[domain.name] = domain.color;
        return acc;
      },
      {} as Record<string, string>
    );
  }, [allDomains]);

  const chartData = domainStats.map((stat) => ({
    name: stat.domain,
    value: stat.minutes,
    percentage: stat.percentage,
  }));

  const totalMinutes = domainStats.reduce((sum, d) => sum + d.minutes, 0);

  if (domainStats.length === 0) {
    return (
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-4">{title}</h3>
        <p className="text-xs text-gray-400">No time data yet.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 pr-4">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        <span className="text-xs text-gray-500">
          <span className="font-medium text-gray-900">{formatDuration(totalMinutes)}</span>
        </span>
      </div>

      {/* Pie chart */}
      <div className="mb-6">
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={false}
              outerRadius={70}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={domainColorMap[entry.name] || '#4A8CC7'} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => formatDuration(value)}
              contentStyle={{
                background: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '12px',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Breakdown list */}
      <div className="space-y-3">
        {domainStats.map((stat, index) => {
          const domainColor = domainColorMap[stat.domain] || '#4A8CC7';
          return (
            <div key={stat.domain}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-sm shadow-sm"
                    style={{ backgroundColor: domainColor }}
                  />
                  <span className="text-xs font-medium text-gray-700">{stat.domain}</span>
                </div>
                <span className="text-xs text-gray-500">{formatDuration(stat.minutes)}</span>
              </div>

              {/* Top subtags for this domain */}
              {stat.subtags.slice(0, 2).map((subtag) => (
                <div key={subtag.tagId} className="text-[11px] text-gray-500 ml-4 mb-0.5">
                  {subtag.name}: {formatDuration(subtag.minutes)}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
};
