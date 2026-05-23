'use client';

import { useState } from 'react';
import ImageCapture from './ImageCapture';
import ImagePreview from './ImagePreview';
import RecipeStream from './RecipeStream';
import { compressToBase64 } from '@/lib/canvasCompress';

export default function PantryLensApp() {
  const [images, setImages] = useState<string[]>([]);
  const [recipe, setRecipe] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFiles = async (files: File[]) => {
    const remaining = 3 - images.length;
    if (remaining <= 0) return;

    const toProcess = files
      .filter((f) => f.type.startsWith('image/'))
      .slice(0, remaining);

    const newImages: string[] = [];
    for (const file of toProcess) {
      try {
        newImages.push(await compressToBase64(file));
      } catch (err) {
        console.error('Compression failed:', err);
      }
    }

    if (newImages.length) setImages((prev) => [...prev, ...newImages]);
  };

  const removeImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const reset = () => {
    setImages([]);
    setRecipe('');
    setError('');
  };

  const generateRecipe = async () => {
    if (!images.length || loading) return;
    setLoading(true);
    setRecipe('');
    setError('');

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        body: JSON.stringify({ images }),
        headers: { 'Content-Type': 'application/json' },
      });

      if (res.status === 429) {
        throw new Error("You've reached the hourly limit. Please try again later.");
      }
      if (!res.ok) {
        throw new Error((await res.text()) || 'Failed to generate recipe. Please try again.');
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let output = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value, { stream: true });
        for (const line of text.split('\n')) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') break;
          try {
            const delta = JSON.parse(data).choices?.[0]?.delta?.content ?? '';
            if (delta) {
              output += delta;
              setRecipe(output);
            }
          } catch {
            // skip malformed SSE chunk
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-2xl mx-auto px-4 py-8 pb-16">
      <header className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 rounded-2xl mb-4">
          <span className="text-3xl">🍳</span>
        </div>
        <h1
          className="text-4xl font-bold text-amber-700 mb-2"
          style={{ fontFamily: 'var(--font-playfair)' }}
        >
          PantryLens
        </h1>
        <p className="text-stone-500 text-lg">Snap your fridge. Get a recipe.</p>
      </header>

      <div className="bg-white rounded-2xl shadow-md p-6 mb-4">
        <ImageCapture onFiles={handleFiles} disabled={images.length >= 3 || loading} />
        {images.length > 0 && (
          <div className="mt-4">
            <ImagePreview images={images} onRemove={removeImage} />
            {!loading && (
              <button
                onClick={reset}
                className="mt-3 text-sm text-stone-400 hover:text-red-400 transition-colors"
              >
                Clear all
              </button>
            )}
          </div>
        )}
      </div>

      <button
        onClick={generateRecipe}
        disabled={images.length === 0 || loading}
        className="w-full py-4 rounded-2xl bg-amber-600 text-white font-semibold text-lg
                   hover:bg-amber-700 active:bg-amber-800 transition-colors
                   disabled:opacity-40 disabled:cursor-not-allowed shadow-md mb-4"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Cooking up your recipe...
          </span>
        ) : (
          '✨ Generate Recipe'
        )}
      </button>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-4 text-sm">
          {error}
        </div>
      )}

      {(recipe || (loading && !error)) && (
        <RecipeStream content={recipe} loading={loading} />
      )}
    </main>
  );
}
