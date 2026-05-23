'use client';

import { useRef, useState } from 'react';

interface Props {
  onFiles: (files: File[]) => void;
  disabled: boolean;
}

export default function ImageCapture({ onFiles, disabled }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    const files = Array.from(e.dataTransfer.files);
    if (files.length) onFiles(files);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length) onFiles(files);
    e.target.value = '';
  };

  return (
    <div>
      <div
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onClick={() => !disabled && fileInputRef.current?.click()}
        role="button"
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => e.key === 'Enter' && !disabled && fileInputRef.current?.click()}
        className={[
          'border-2 border-dashed rounded-xl p-8 text-center transition-all select-none',
          isDragging && !disabled
            ? 'border-amber-400 bg-amber-50'
            : 'border-stone-200 hover:border-amber-300 hover:bg-amber-50/50',
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
        ].join(' ')}
      >
        <div className="text-4xl mb-2">📸</div>
        <p className="text-stone-500 font-medium">Drop photos here</p>
        <p className="text-stone-400 text-sm mt-1">or use the buttons below</p>
      </div>

      <div className="flex gap-3 mt-3">
        <button
          type="button"
          onClick={() => !disabled && cameraInputRef.current?.click()}
          disabled={disabled}
          className="flex-1 py-2.5 px-4 border border-amber-200 rounded-xl text-amber-700 font-medium
                     text-sm hover:bg-amber-50 active:bg-amber-100 transition-colors
                     disabled:opacity-40 disabled:cursor-not-allowed"
        >
          📷 Camera
        </button>
        <button
          type="button"
          onClick={() => !disabled && fileInputRef.current?.click()}
          disabled={disabled}
          className="flex-1 py-2.5 px-4 border border-amber-200 rounded-xl text-amber-700 font-medium
                     text-sm hover:bg-amber-50 active:bg-amber-100 transition-colors
                     disabled:opacity-40 disabled:cursor-not-allowed"
        >
          📁 Upload
        </button>
      </div>

      {disabled && (
        <p className="text-center text-stone-400 text-xs mt-2">Maximum 3 images added</p>
      )}

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        className="hidden"
        onChange={handleChange}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
}
