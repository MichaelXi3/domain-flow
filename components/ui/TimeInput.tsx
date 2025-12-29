'use client';

import React, { useState, useRef, useEffect } from 'react';

interface TimeInputProps {
  value: string; // "HH:MM" format
  onChange: (value: string) => void;
  label?: string;
}

export const TimeInput: React.FC<TimeInputProps> = ({ value, onChange, label }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hours, minutes] = value.split(':').map(Number);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const handleTimeChange = (newHours: number, newMinutes: number) => {
    const timeStr = `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`;
    onChange(timeStr);
    setIsOpen(false);
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
        <span className="font-medium flex-1">{value}</span>
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
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </button>

      {isOpen && (
        <div
          className="absolute z-50 mt-2 rounded-xl shadow-2xl overflow-hidden"
          style={{
            backgroundColor: 'var(--card)',
            border: '1px solid var(--border)',
            width: '200px',
          }}
        >
          <div className="flex">
            {/* Hours */}
            <div className="flex-1 max-h-48 overflow-y-auto">
              {Array.from({ length: 24 }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleTimeChange(i, minutes)}
                  className="w-full px-3 py-2 text-sm text-center transition-colors"
                  style={{
                    backgroundColor: hours === i ? 'var(--primary)' : 'transparent',
                    color: hours === i ? 'white' : 'var(--foreground)',
                  }}
                  onMouseEnter={(e) => {
                    if (hours !== i) {
                      e.currentTarget.style.backgroundColor = 'var(--hover)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (hours !== i) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  {String(i).padStart(2, '0')}
                </button>
              ))}
            </div>

            {/* Separator */}
            <div className="w-px" style={{ backgroundColor: 'var(--border)' }} />

            {/* Minutes */}
            <div className="flex-1 max-h-48 overflow-y-auto">
              {Array.from({ length: 60 / 5 }, (_, i) => i * 5).map((min) => (
                <button
                  key={min}
                  type="button"
                  onClick={() => handleTimeChange(hours, min)}
                  className="w-full px-3 py-2 text-sm text-center transition-colors"
                  style={{
                    backgroundColor: minutes === min ? 'var(--primary)' : 'transparent',
                    color: minutes === min ? 'white' : 'var(--foreground)',
                  }}
                  onMouseEnter={(e) => {
                    if (minutes !== min) {
                      e.currentTarget.style.backgroundColor = 'var(--hover)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (minutes !== min) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  {String(min).padStart(2, '0')}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
