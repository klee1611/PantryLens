'use client';

import { useState } from 'react';
import { useLocale } from '@/lib/i18n';

interface Props {
  onFiles: (files: File[]) => void;
  disabled: boolean;
}

export default function ImageCapture({ onFiles, disabled }: Props) {
  const { t } = useLocale();
  const [isDragging, setIsDragging] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length) onFiles(files);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    const files = Array.from(e.dataTransfer.files);
    if (files.length) onFiles(files);
  };

  /*
   * Why this pattern instead of useRef + programmatic .click():
   *   - iOS Safari blocks .click() on hidden/sr-only inputs (untrusted event)
   *   - label→input with htmlFor creates two ARIA "button" nodes (the label
   *     AND the input itself), breaking strict-mode accessibility queries
   *
   * Solution: each label wraps its own transparent full-overlay input.
   *   - The input covers the entire label area (absolute inset-0, full w/h)
   *   - opacity-0 makes it invisible; the label text shows through
   *   - Tapping anywhere on the label taps the input directly — trusted event
   *   - aria-hidden + tabIndex=-1 removes the input from the ARIA tree so
   *     only the label's role="button" is visible to assistive tech
   */
  const fileInput = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input
      type="file"
      accept="image/*"
      disabled={disabled}
      onChange={handleChange}
      aria-hidden="true"
      tabIndex={-1}
      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
      {...props}
    />
  );

  return (
    <div>
      {/* Drop zone — tap to browse on mobile, drag-and-drop on desktop */}
      <label
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled || undefined}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); if (!disabled) setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        className={[
          'relative block border-2 border-dashed rounded-xl p-8',
          'text-center transition-all select-none overflow-hidden',
          isDragging && !disabled
            ? 'border-amber-400 bg-amber-50'
            : 'border-stone-200 hover:border-amber-300 hover:bg-amber-50/50',
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
        ].join(' ')}
      >
        {fileInput({ multiple: true })}
        <div className="text-4xl mb-2">📸</div>
        <p className="text-stone-500 font-medium">{t.capture.dropHere}</p>
        <p className="text-stone-400 text-sm mt-1">{t.capture.orButtons}</p>
      </label>

      <div className="flex gap-3 mt-3">
        <label
          role="button"
          aria-disabled={disabled || undefined}
          className={[
            'relative flex-1 py-2.5 px-4 border border-amber-200 rounded-xl overflow-hidden',
            'text-amber-700 font-medium text-sm transition-colors',
            'flex items-center justify-center',
            disabled
              ? 'opacity-40 cursor-not-allowed'
              : 'hover:bg-amber-50 active:bg-amber-100 cursor-pointer',
          ].join(' ')}
        >
          {/* capture="environment" opens rear camera directly on iOS/Android */}
          {fileInput({ capture: 'environment' })}
          {t.capture.camera}
        </label>

        <label
          role="button"
          aria-disabled={disabled || undefined}
          className={[
            'relative flex-1 py-2.5 px-4 border border-amber-200 rounded-xl overflow-hidden',
            'text-amber-700 font-medium text-sm transition-colors',
            'flex items-center justify-center',
            disabled
              ? 'opacity-40 cursor-not-allowed'
              : 'hover:bg-amber-50 active:bg-amber-100 cursor-pointer',
          ].join(' ')}
        >
          {fileInput({ multiple: true })}
          {t.capture.upload}
        </label>
      </div>

      {disabled && (
        <p className="text-center text-stone-400 text-xs mt-2">{t.capture.maxReached}</p>
      )}
    </div>
  );
}
