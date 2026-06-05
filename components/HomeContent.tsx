'use client';

import { useLocale } from '@/lib/i18n';

export default function HomeContent() {
  const { t } = useLocale();
  const h = t.home;

  return (
    <div className="max-w-2xl mx-auto px-4 pb-16">
      {/* How It Works */}
      <section className="mt-12" aria-labelledby="how-it-works">
        <h2
          id="how-it-works"
          className="text-2xl font-bold text-amber-800 mb-6"
          style={{ fontFamily: 'var(--font-playfair)' }}
        >
          {h.howItWorks}
        </h2>
        <div className="grid grid-cols-3 gap-4">
          {[
            { step: '1', icon: '📷', title: h.step1Title, desc: h.step1Desc },
            { step: '2', icon: '🔍', title: h.step2Title, desc: h.step2Desc },
            { step: '3', icon: '🍽️', title: h.step3Title, desc: h.step3Desc },
          ].map(({ step, icon, title, desc }) => (
            <div key={step} className="bg-white rounded-2xl p-4 shadow-sm text-center">
              <div className="text-3xl mb-2">{icon}</div>
              <div className="text-xs font-bold text-amber-600 mb-1">{h.step} {step}</div>
              <h3 className="font-semibold text-stone-800 mb-1 text-sm">{title}</h3>
              <p className="text-stone-500 text-xs">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why Use PantryLens */}
      <section className="mt-10" aria-labelledby="why-pantrylens">
        <h2
          id="why-pantrylens"
          className="text-2xl font-bold text-amber-800 mb-4"
          style={{ fontFamily: 'var(--font-playfair)' }}
        >
          {h.whyTitle}
        </h2>
        <ul className="space-y-3" role="list">
          {[
            { icon: '♻️', text: h.why1 },
            { icon: '⚡', text: h.why2 },
            { icon: '🆓', text: h.why3 },
            { icon: '📱', text: h.why4 },
            { icon: '🤖', text: h.why5 },
          ].map(({ icon, text }) => (
            <li key={text} className="flex items-start gap-3 bg-white rounded-xl p-3 shadow-sm">
              <span className="text-xl flex-shrink-0" aria-hidden="true">{icon}</span>
              <span className="text-stone-700 text-sm">{text}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Use Cases */}
      <section className="mt-10" aria-labelledby="use-cases">
        <h2
          id="use-cases"
          className="text-2xl font-bold text-amber-800 mb-4"
          style={{ fontFamily: 'var(--font-playfair)' }}
        >
          {h.perfectFor}
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: '🧹', title: h.use1Title, desc: h.use1Desc },
            { icon: '🍝', title: h.use2Title, desc: h.use2Desc },
            { icon: '🛒', title: h.use3Title, desc: h.use3Desc },
            { icon: '🌮', title: h.use4Title, desc: h.use4Desc },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="bg-white rounded-xl p-4 shadow-sm">
              <div className="text-2xl mb-1" aria-hidden="true">{icon}</div>
              <h3 className="font-semibold text-stone-800 text-sm mb-1">{title}</h3>
              <p className="text-stone-500 text-xs">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="mt-10" aria-labelledby="faq">
        <h2
          id="faq"
          className="text-2xl font-bold text-amber-800 mb-4"
          style={{ fontFamily: 'var(--font-playfair)' }}
        >
          {h.faqTitle}
        </h2>
        <div className="space-y-2">
          {[
            { q: h.faq1Q, a: h.faq1A },
            { q: h.faq2Q, a: h.faq2A },
            { q: h.faq3Q, a: h.faq3A },
            { q: h.faq4Q, a: h.faq4A },
            { q: h.faq5Q, a: h.faq5A },
            { q: h.faq6Q, a: h.faq6A },
          ].map(({ q, a }) => (
            <details key={q} className="bg-white rounded-xl p-4 shadow-sm group">
              <summary className="font-medium text-stone-800 cursor-pointer text-sm flex justify-between items-center list-none">
                {q}
                <span className="text-amber-500 ml-2 flex-shrink-0 group-open:rotate-180 transition-transform duration-200" aria-hidden="true">
                  ▾
                </span>
              </summary>
              <p className="text-stone-600 text-sm mt-3 leading-relaxed">{a}</p>
            </details>
          ))}
        </div>
      </section>

      <footer className="mt-12 text-center text-stone-400 text-xs pb-4 space-y-3">
        <p className="font-medium">{h.footerTagline}</p>
        <p>{h.footerSub}</p>

        {/* Hackathon badge */}
        <div>
          <a
            href="https://dev.to/challenges/google-gemma-2026-05-06"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-white border border-stone-200 rounded-full px-3 py-1.5 text-xs text-stone-600 hover:border-amber-300 hover:text-amber-700 transition-colors shadow-sm"
          >
            <span aria-hidden="true">🏆</span>
            {h.footerHackathon}
          </a>
        </div>

        {/* Buy Me a Coffee */}
        <div>
          <a
            href="https://www.buymeacoffee.com/klee1611"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#FFDD00] text-stone-900 font-semibold rounded-full px-4 py-2 text-xs hover:bg-yellow-300 transition-colors shadow-sm"
          >
            <span aria-hidden="true">☕</span>
            Buy me a coffee
          </a>
        </div>

        <p className="pt-1">{h.footerCopyright}</p>
      </footer>
    </div>
  );
}
