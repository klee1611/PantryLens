'use client';

import { useState } from 'react';

interface Props {
  onFiles: (files: File[]) => void;
  disabled: boolean;
}

export default function ImageCapture({ onFiles, disabled }: Props) {
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

  const btnClass = [
    'flex-1 py-2.5 px-4 border border-amber-200 rounded-xl text-amber-700 font-medium',
    'text-sm hover:bg-amber-50 active:bg-amber-100 transition-colors',
    'flex items-center justify-center',
    disabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : 'cursor-pointer',
  ].join(' ');

  return (
    <div>
      {/*
       * Drop zone — also acts as a tap-to-browse-gallery trigger on mobile.
       * Using <label htmlFor> instead of a div + programmatic .click() because
       * iOS Safari silently drops .click() calls on display:none inputs.
       * A label→input association is a native trusted activation on all platforms.
       */}
      <label
        htmlFor="pl-gallery"
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled || undefined}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); if (!disabled) setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        className={[
          'border-2 border-dashed rounded-xl p-8 text-center transition-all select-none block',
          isDragging && !disabled
            ? 'border-amber-400 bg-amber-50'
            : 'border-stone-200 hover:border-amber-300 hover:bg-amber-50/50',
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
        ].join(' ')}
      >
        <div className="text-4xl mb-2">📸</div>
        <p className="text-stone-500 font-medium">Drop photos here</p>
        <p className="text-stone-400 text-sm mt-1">or use the buttons below</p>
      </label>

      <div className="flex gap-3 mt-3">
        {/* Camera — label activates the capture input natively, no JS needed */}
        <label
          htmlFor="pl-camera"
          role="button"
          aria-disabled={disabled || undefined}
          className={btnClass}
        >
          📷 Camera
        </label>

        {/* Gallery / file picker */}
        <label
          htmlFor="pl-gallery"
          role="button"
          aria-disabled={disabled || undefined}
          className={btnClass}
        >
          📁 Upload
        </label>
      </div>

      {disabled && (
        <p className="text-center text-stone-400 text-xs mt-2">Maximum 3 images added</p>
      )}

      {/*
       * Inputs are sr-only (not display:none).
       * On camera: no `multiple` — iOS ignores it when `capture` is set anyway.
       * On gallery: `multiple` allows picking several photos at once.
       */}
      <input
        id="pl-camera"
        type="file"
        accept="image/*"
        capture="environment"
        disabled={disabled}
        className="sr-only"
        onChange={handleChange}
      />
      <input
        id="pl-gallery"
        type="file"
        accept="image/*"
        multiple
        disabled={disabled}
        className="sr-only"
        onChange={handleChange}
      />
    </div>
  );
}
