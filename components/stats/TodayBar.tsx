'use client';

import React from 'react';
import { DomainStat } from '@/lib/types';
import { formatDuration, getTopSubtags } from '@/lib/calc';

interface TodayBarProps {
  domainStats: DomainStat[];
}

export const TodayBar: React.FC<TodayBarProps> = ({ domainStats }) => {
  const topSubtags = getTopSubtags(domainStats, 3);
  const totalMinutes = domainStats.reduce((sum, d) => sum + d.minutes, 0);

  if (domainStats.length === 0) {
    return (
      <div className="bg-gray-50 border-b border-gray-200 p-4">
        <p className="text-sm text-gray-500">No time slots recorded yet today.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border-b border-gray-200 p-4 shadow-sm">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700">Today's Summary</h3>
          <span className="text-sm text-gray-600">
            Total: <span className="font-bold">{formatDuration(totalMinutes)}</span>
          </span>
        </div>

        {/* Domain breakdown */}
        <div className="flex gap-4 mb-3 flex-wrap">
          {domainStats.slice(0, 6).map((domain) => (
            <div
              key={domain.domain}
              className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded"
            >
              <span className="text-xs font-medium text-gray-700">{domain.domain}</span>
              <span className="text-xs text-gray-600">{formatDuration(domain.minutes)}</span>
              <span className="text-[10px] text-gray-500">({domain.percentage.toFixed(0)}%)</span>
            </div>
          ))}
        </div>

        {/* Top activities */}
        {topSubtags.length > 0 && (
          <div className="flex gap-3 text-xs text-gray-600">
            <span className="font-medium">Top activities:</span>
            {topSubtags.map((subtag, i) => (
              <span key={subtag.tagId}>
                {i + 1}. {subtag.name} ({formatDuration(subtag.minutes)})
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
