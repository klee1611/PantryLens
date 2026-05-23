'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Props {
  content: string;
  loading: boolean;
}

export default function RecipeStream({ content, loading }: Props) {
  return (
    <div className="bg-white rounded-2xl shadow-md p-6">
      {loading && !content && (
        <div className="flex items-center gap-3 text-stone-400 py-4">
          <div className="flex gap-1">
            <span className="w-2 h-2 bg-amber-400 rounded-full animate-bounce [animation-delay:0ms]" />
            <span className="w-2 h-2 bg-amber-400 rounded-full animate-bounce [animation-delay:150ms]" />
            <span className="w-2 h-2 bg-amber-400 rounded-full animate-bounce [animation-delay:300ms]" />
          </div>
          <span className="text-sm">Analyzing your ingredients...</span>
        </div>
      )}

      {content && (
        <div>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h2: ({ children }) => (
                <h2
                  className="text-2xl font-bold text-amber-800 mb-3 mt-2"
                  style={{ fontFamily: 'var(--font-playfair)' }}
                >
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-lg font-semibold text-amber-700 mb-2 mt-5">{children}</h3>
              ),
              p: ({ children }) => (
                <p className="text-stone-700 mb-3 leading-relaxed">{children}</p>
              ),
              ul: ({ children }) => (
                <ul className="list-disc list-inside space-y-1 text-stone-700 mb-3 pl-2">
                  {children}
                </ul>
              ),
              ol: ({ children }) => (
                <ol className="list-decimal list-inside space-y-2 text-stone-700 mb-3 pl-2">
                  {children}
                </ol>
              ),
              li: ({ children }) => <li className="text-stone-700">{children}</li>,
              strong: ({ children }) => (
                <strong className="font-semibold text-stone-800">{children}</strong>
              ),
              hr: () => <hr className="border-amber-100 my-4" />,
            }}
          >
            {content}
          </ReactMarkdown>
          {loading && (
            <span
              className="inline-block w-0.5 h-4 bg-amber-600 ml-0.5 align-middle"
              style={{ animation: 'blink 1s step-end infinite' }}
            />
          )}
        </div>
      )}
    </div>
  );
}
