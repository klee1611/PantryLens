'use client';

import { useLocale, interpolate } from '@/lib/i18n';

interface Props {
  images: string[];
  onRemove: (idx: number) => void;
}

export default function ImagePreview({ images, onRemove }: Props) {
  const { t } = useLocale();

  return (
    <div className="flex gap-3 flex-wrap">
      {images.map((b64, i) => (
        <div key={i} className="relative group">
          {/* eslint-disable-next-line @next/next/no-img-element -- data: URLs are not supported by next/image */}
          <img
            src={`data:image/jpeg;base64,${b64}`}
            alt={interpolate(t.preview.altText, { n: i + 1 })}
            className="w-20 h-20 object-cover rounded-xl border-2 border-amber-100 shadow-sm"
          />
          <button
            onClick={() => onRemove(i)}
            aria-label={interpolate(t.preview.removePhoto, { n: i + 1 })}
            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 hover:bg-red-600
                       text-white rounded-full text-xs font-bold flex items-center justify-center
                       shadow-sm transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
          >
            ×
          </button>
        </div>
      ))}
      {images.length < 3 && (
        <div className="w-20 h-20 rounded-xl border-2 border-dashed border-stone-200 flex items-center justify-center text-stone-300 text-2xl">
          +
        </div>
      )}
    </div>
  );
}
