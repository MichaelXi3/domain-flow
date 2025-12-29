'use client';

import React, { useState, useRef, useEffect } from 'react';

interface DateInputProps {
  value: string; // "YYYY-MM-DD" format
  onChange: (value: string) => void;
  label?: string;
}

export const DateInput: React.FC<DateInputProps> = ({ value, onChange, label }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const date = new Date(value);
  const year = date.getFullYear();
  const month = date.getMonth();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleDateChange = (newDate: Date) => {
    const dateStr = newDate.toISOString().split('T')[0];
    onChange(dateStr);
    setIsOpen(false);
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const formatDisplayDate = () => {
    return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2.5 text-sm rounded-lg transition-all text-left flex items-center justify-between gap-3"
        style={{
          border: '1px solid var(--border)',
          backgroundColor: 'var(--card)',
          color: 'var(--foreground)',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--primary)')}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
      >
        <span className="font-medium flex-1">{formatDisplayDate()}</span>
        <svg
          className="w-4 h-4 flex-shrink-0"
          style={{ color: 'var(--muted-foreground)' }}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </button>

      {isOpen && (
        <div
          className="absolute z-50 mt-2 p-4 rounded-xl shadow-2xl"
          style={{
            backgroundColor: 'var(--card)',
            border: '1px solid var(--border)',
            width: '280px',
          }}
        >
          {/* Month/Year header */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={() => {
                const newDate = new Date(year, month - 1, 1);
                onChange(newDate.toISOString().split('T')[0]);
              }}
              className="p-1.5 rounded-lg transition-colors"
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <svg
                className="w-4 h-4"
                style={{ color: 'var(--foreground)' }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>

            <span className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>
              {year}年{month + 1}月
            </span>

            <button
              type="button"
              onClick={() => {
                const newDate = new Date(year, month + 1, 1);
                onChange(newDate.toISOString().split('T')[0]);
              }}
              className="p-1.5 rounded-lg transition-colors"
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <svg
                className="w-4 h-4"
                style={{ color: 'var(--foreground)' }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['日', '一', '二', '三', '四', '五', '六'].map((day) => (
              <div
                key={day}
                className="text-center text-xs font-medium py-1"
                style={{ color: 'var(--muted-foreground)' }}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells for days before month starts */}
            {Array.from({ length: getFirstDayOfMonth(year, month) }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}

            {/* Days of the month */}
            {Array.from({ length: getDaysInMonth(year, month) }, (_, i) => i + 1).map((day) => {
              const dayDate = new Date(year, month, day);
              const isSelected =
                date.getDate() === day && date.getMonth() === month && date.getFullYear() === year;
              const isToday = new Date().toDateString() === dayDate.toDateString();

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleDateChange(dayDate)}
                  className="aspect-square rounded-lg text-sm transition-all flex items-center justify-center"
                  style={{
                    backgroundColor: isSelected
                      ? 'var(--primary)'
                      : isToday
                        ? 'var(--hover)'
                        : 'transparent',
                    color: isSelected ? 'white' : 'var(--foreground)',
                    fontWeight: isToday || isSelected ? 600 : 400,
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = 'var(--hover)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = isToday
                        ? 'var(--hover)'
                        : 'transparent';
                    }
                  }}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Quick actions */}
          <div
            className="mt-4 pt-3 flex justify-between items-center"
            style={{ borderTop: '1px solid var(--border)' }}
          >
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
              }}
              className="text-xs px-3 py-1.5 rounded-md transition-colors"
              style={{ color: 'var(--muted-foreground)' }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => handleDateChange(new Date())}
              className="text-xs px-3 py-1.5 rounded-md transition-colors font-medium"
              style={{ backgroundColor: 'var(--hover)', color: 'var(--primary)' }}
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
