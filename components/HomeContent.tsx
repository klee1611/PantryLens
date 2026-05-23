export default function HomeContent() {
  return (
    <div className="max-w-2xl mx-auto px-4 pb-16">
      {/* How It Works */}
      <section className="mt-12" aria-labelledby="how-it-works">
        <h2
          id="how-it-works"
          className="text-2xl font-bold text-amber-800 mb-6"
          style={{ fontFamily: 'var(--font-playfair)' }}
        >
          How PantryLens Works
        </h2>
        <div className="grid grid-cols-3 gap-4">
          {[
            { step: '1', icon: '📷', title: 'Snap a Photo', desc: 'Take up to 3 photos of your fridge, freezer, or pantry.' },
            { step: '2', icon: '🔍', title: 'AI Scans It', desc: 'Our AI identifies every visible ingredient in your photos.' },
            { step: '3', icon: '🍽️', title: 'Get a Recipe', desc: 'Receive a complete recipe using only what you have.' },
          ].map(({ step, icon, title, desc }) => (
            <div key={step} className="bg-white rounded-2xl p-4 shadow-sm text-center">
              <div className="text-3xl mb-2">{icon}</div>
              <div className="text-xs font-bold text-amber-600 mb-1">STEP {step}</div>
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
          Why Use PantryLens?
        </h2>
        <ul className="space-y-3" role="list">
          {[
            { icon: '♻️', text: 'Reduce food waste — cook what you have before it expires' },
            { icon: '⚡', text: 'Instant results — recipe streams to you in seconds, token by token' },
            { icon: '🆓', text: 'Completely free — no account, no subscription, no hidden limits' },
            { icon: '📱', text: 'Works on any device — installable as a PWA on iOS and Android' },
            { icon: '🤖', text: "Powered by Gemma 4 — Google's latest vision AI model" },
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
          Perfect For...
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: '🧹', title: 'Fridge Clean-Out', desc: "Before grocery shopping or a trip, cook what's left" },
            { icon: '🍝', title: 'Using Leftovers', desc: 'Turn random leftovers into something delicious' },
            { icon: '🛒', title: 'Pantry Cooking', desc: 'Discover recipes from canned goods and dry staples' },
            { icon: '🌮', title: 'Quick Weeknights', desc: 'No recipe ideas? Just snap and cook.' },
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
          Frequently Asked Questions
        </h2>
        <div className="space-y-2">
          {[
            {
              q: 'What ingredients can PantryLens recognize?',
              a: 'PantryLens can identify most common fruits, vegetables, proteins, dairy products, condiments, and pantry staples visible in your photo. Clear, well-lit photos give the best results.',
            },
            {
              q: 'How many photos can I upload at once?',
              a: 'You can upload up to 3 photos per request — for example, one of your fridge, one of your freezer, and one of your pantry shelves.',
            },
            {
              q: 'Does PantryLens work on mobile?',
              a: 'Yes. PantryLens is a Progressive Web App (PWA). Use it in any mobile browser or install it to your home screen for a native app experience on both iOS and Android.',
            },
            {
              q: 'Is PantryLens free to use?',
              a: 'Yes — PantryLens is completely free with no account, subscription, or hidden fees required.',
            },
            {
              q: 'Can I use PantryLens with unusual or limited ingredients?',
              a: 'Absolutely. PantryLens is designed to work creatively with whatever you have — even sparse or unusual combinations. It will always suggest the most practical recipe possible.',
            },
            {
              q: 'Does PantryLens store my photos?',
              a: 'No. Photos are compressed locally on your device and sent directly to the AI for analysis. Neither your photos nor the generated recipes are stored by PantryLens.',
            },
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

      <footer className="mt-12 text-center text-stone-400 text-xs pb-4 space-y-1">
        <p className="font-medium">PantryLens — AI Recipe Generator from Fridge Photos</p>
        <p>Free to use · No account required · Works on any device</p>
      </footer>
    </div>
  );
}
