import React from 'react';

const listings = [
  {
    id: 'chat',
    tag: 'AI Care',
    tagColor: 'cyan',
    title: 'Supportive chat companion',
    price: 'Free',
    description: 'Compassionate, symptom-aware guidance that helps users understand their feelings and next steps.',
    icon: '💬',
    featured: true,
  },
  {
    id: 'mood',
    tag: 'Track',
    tagColor: 'blue',
    title: 'Mood journal',
    price: 'Free',
    description: 'Track daily patterns, emotional energy, and emotional shifts in a simple, calming format.',
    icon: '📊',
  },
  {
    id: 'emotion',
    tag: 'Scan',
    tagColor: 'pink',
    title: 'Face emotion insights',
    price: 'Free',
    description: 'Understand behavioral cues with quick confidence-based emotional recognition and gentle prompts.',
    icon: '📷',
    featured: true,
  },
  {
    id: 'wellness',
    tag: 'Routine',
    tagColor: 'purple',
    title: 'Daily wellness plans',
    price: 'Free',
    description: 'Get structured routines for calm mornings, better sleep, focus, and emotional regulation.',
    icon: '🧘',
  },
  {
    id: 'games',
    tag: 'Play',
    tagColor: 'pink',
    title: 'Mind games',
    price: 'Free',
    description: 'Short cognitive exercises and breathing tools to gently reset attention and stress.',
    icon: '🎮',
  },
  {
    id: 'resources',
    tag: 'Library',
    tagColor: 'green',
    title: 'Condition guides',
    price: '150+',
    description: 'Search resources, coping strategies, and condition-based guidance in one accessible library.',
    icon: '📚',
  },
  {
    id: 'audio',
    tag: 'Calm',
    tagColor: 'cyan',
    title: 'Healing soundscape',
    price: 'Free',
    description: 'Relaxing tones and ambient audio designed to help users slow down and feel more present.',
    icon: '🎧',
  },
];

const tagClass = {
  cyan: 'tag-cyan',
  blue: 'tag-blue',
  purple: 'tag-purple',
  pink: 'tag-pink',
  green: 'tag-green',
};

const viewMap = {
  mood: 'mood',
  emotion: 'emotion',
  wellness: 'wellness',
  games: 'games',
  resources: 'resources',
};

const Features = ({ setView, onStartChat }) => {
  const openModule = (id) => {
    if (id === 'chat') onStartChat?.();
    else if (viewMap[id]) setView?.(viewMap[id]);
  };
  return (
    <section className="page-section py-16 pb-28" id="marketplace">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="section-head">
          <span className="web3-badge">Marketplace</span>
          <h2 className="section-head__title">
            Explore the <span className="text-neon-cyan">Braino</span> ecosystem
          </h2>
          <p className="section-head__sub">
            Social wellness tools — pick what you need, all connected through one AI core.
          </p>
        </div>

        <div className="marketplace-grid">
          {listings.map((item) => (
            <article
              key={item.id}
              className={`market-card ${item.featured ? 'market-card--featured' : ''}`}
            >
              <div className="market-card__visual">
                <span className="market-card__emoji">{item.icon}</span>
                <div className="market-card__shine" />
              </div>
              <div className="market-card__body">
                <div className="market-card__meta">
                  <span className={`market-tag ${tagClass[item.tagColor]}`}>{item.tag}</span>
                  <span className="market-price">{item.price}</span>
                </div>
                <h3 className="market-card__title">{item.title}</h3>
                <p className="market-card__desc">{item.description}</p>
                <button type="button" className="market-card__cta" onClick={() => openModule(item.id)}>
                  Open module <span>→</span>
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
