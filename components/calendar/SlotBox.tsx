'use client';

import React, { memo } from 'react';
import { TimeSlot, Tag } from '@/lib/types';
import { formatTime, getDurationMinutes } from '@/lib/utils/date';

interface SlotBoxProps {
  slot: TimeSlot;
  tags: Tag[];
  gridInterval: number;
  isSelected: boolean;
  isResizing?: boolean;
  isDragging?: boolean;
  onClick: () => void;
  onMouseDown?: (e: React.MouseEvent) => void;
  onResizeStart: (edge: 'top' | 'bottom') => void;
  dayStart?: number; // Optional: start of current day in ms
}

const SlotBoxComponent: React.FC<SlotBoxProps> = ({
  slot,
  tags,
  gridInterval,
  isSelected,
  isResizing = false,
  isDragging = false,
  onClick,
  onMouseDown,
  onResizeStart,
  dayStart,
}) => {
  const tagMap = new Map(tags.map((t) => [t.id, t]));
  const slotTags = slot.tagIds.map((id) => tagMap.get(id)).filter((t): t is Tag => t !== undefined);

  // Calculate position and height relative to current day
  const effectiveStart = dayStart ? Math.max(slot.start, dayStart) : slot.start;
  const dayEnd = dayStart ? dayStart + 24 * 60 * 60 * 1000 : Infinity;
  const effectiveEnd = dayStart ? Math.min(slot.end, dayEnd) : slot.end;

  const startDate = new Date(effectiveStart);
  const startMinutes = startDate.getHours() * 60 + startDate.getMinutes();
  const duration = getDurationMinutes(effectiveStart, effectiveEnd);

  const pixelsPerMinute = 1; // Adjust based on grid sizing
  const top = startMinutes * pixelsPerMinute;
  const height = Math.max(duration * pixelsPerMinute, 20); // Min height 20px

  const isActiveFlow = slot.id === '__active_flow__';
  // Use first tag's color
  const primaryColor = slotTags[0]?.color || '#6b7280';

  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <div
      className={`absolute left-0 right-0 rounded border-l-4 bg-opacity-90 p-1 text-xs overflow-hidden group ${
        isActiveFlow ? '' : 'cursor-pointer'
      }`}
      style={{
        top: `${top}px`,
        height: `${height}px`,
        borderLeftColor: primaryColor,
        backgroundColor: `${primaryColor}20`,
        boxShadow: isDragging
          ? '0 20px 60px rgba(0, 0, 0, 0.25), 0 10px 30px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05)'
          : isActiveFlow
            ? '0 0 0 2px var(--primary), 0 4px 20px rgba(74, 140, 199, 0.3), 0 0 40px rgba(74, 140, 199, 0.2)'
            : isSelected
              ? '0 0 0 2px var(--primary), 0 4px 12px rgba(74, 140, 199, 0.15), 0 2px 6px rgba(74, 140, 199, 0.1)'
              : isHovered
                ? '0 4px 12px rgba(0, 0, 0, 0.08), 0 2px 6px rgba(0, 0, 0, 0.06)'
                : '0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)',
        transition:
          isResizing || isActiveFlow || isDragging
            ? 'box-shadow 0.15s ease'
            : 'top 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), height 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.15s ease',
        animation: isActiveFlow ? 'pulse 2s ease-in-out infinite' : 'none',
        zIndex: isDragging ? 100 : isActiveFlow ? 10 : isSelected ? 5 : 1,
      }}
      onClick={() => !isActiveFlow && onClick()}
      onMouseDown={(e) => !isActiveFlow && onMouseDown?.(e)}
      onMouseEnter={() => !isActiveFlow && setIsHovered(true)}
      onMouseLeave={() => !isActiveFlow && setIsHovered(false)}
      role="button"
      tabIndex={0}
      aria-label={`Time slot from ${formatTime(new Date(slot.start))} with tags ${slotTags.map((t) => t.name).join(', ')}`}
      onKeyDown={(e) => {
        if (!isActiveFlow && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {/* Resize handles */}
      {!isActiveFlow && (
        <>
          <div
            className="absolute top-0 left-0 right-0 h-2 cursor-ns-resize opacity-0 group-hover:opacity-100 transition-opacity z-10 resize-handle"
            style={{ backgroundColor: 'rgba(74, 140, 199, 0.3)' }}
            onMouseDown={(e) => {
              e.stopPropagation();
              onResizeStart('top');
            }}
            onClick={(e) => e.stopPropagation()}
            role="button"
            tabIndex={-1}
            aria-label="Resize top edge"
          />
          <div
            className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize opacity-0 group-hover:opacity-100 transition-opacity z-10 resize-handle"
            style={{ backgroundColor: 'rgba(74, 140, 199, 0.3)' }}
            onMouseDown={(e) => {
              e.stopPropagation();
              onResizeStart('bottom');
            }}
            onClick={(e) => e.stopPropagation()}
            role="button"
            tabIndex={-1}
            aria-label="Resize bottom edge"
          />
        </>
      )}

      <div className="flex flex-col h-full justify-between pointer-events-none">
        <div>
          <div className="font-semibold text-gray-800">{formatTime(new Date(slot.start))}</div>
          <div className="text-gray-600 truncate">
            {slotTags.map((t) => t.name).join(', ') || 'No tags'}
          </div>
        </div>
        {slot.note && height >= 40 && (
          <div className="text-gray-500 truncate text-[10px]">{slot.note}</div>
        )}
      </div>
    </div>
  );
};

export const SlotBox = memo(SlotBoxComponent);
