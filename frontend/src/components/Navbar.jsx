import React, { useState } from 'react';

const navItems = [
  { id: 'home', label: 'Overview' },
  { id: 'wellness', label: 'Wellness' },
  { id: 'mood', label: 'Mood' },
  { id: 'emotion', label: 'Face scan' },
  { id: 'games', label: 'Games' },
  { id: 'resources', label: 'Resources' },
];

const Navbar = ({ onStartChat, onSignIn, isAuthenticated, setView, activeView, user, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);

  const go = (id) => {
    if (!isAuthenticated && id !== 'home') {
      onSignIn?.();
      setIsOpen(false);
      return;
    }
    setView(id);
    window.location.hash = id === 'home' ? '' : `#${id}`;
    setIsOpen(false);
  };

  return (
    <header className="nav-web3">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="nav-web3__inner">
          <button type="button" onClick={() => go('home')} className="nav-web3__brand">
            <img src="/logo.svg" alt="" className="nav-web3__logo" />
            <span className="nav-web3__name">
              Braino<span className="text-neon-cyan">AI</span>
            </span>
          </button>

          <nav className="nav-web3__links hidden lg:flex">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => go(item.id)}
                className={`nav-web3__link ${activeView === item.id ? 'nav-web3__link--active' : ''}`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="nav-web3__actions hidden md:flex items-center gap-3">
            {user && (
              <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-2 text-sm font-medium text-slate-700 shadow-sm">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
                  {user.name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
                <span>{user.name?.split(' ')[0] || 'User'}</span>
              </div>
            )}
            {!isAuthenticated && onSignIn && (
              <button type="button" onClick={onSignIn} className="btn-web3-outline btn-web3-primary--sm">
                Sign in
              </button>
            )}
            <button type="button" onClick={onStartChat} className="btn-web3-primary btn-web3-primary--sm">
              {isAuthenticated ? 'Launch app' : 'Start care plan'}
            </button>
            {onLogout && (
              <button type="button" onClick={onLogout} className="btn-web3-outline btn-web3-primary--sm">
                Logout
              </button>
            )}
          </div>

          <button
            type="button"
            className="nav-web3__menu lg:hidden"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Menu"
          >
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
              {isOpen ? (
                <path d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="nav-web3__mobile lg:hidden">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => go(item.id)}
              className={`nav-web3__link w-full text-left ${activeView === item.id ? 'nav-web3__link--active' : ''}`}
            >
              {item.label}
            </button>
          ))}
          {!isAuthenticated && onSignIn && (
            <button type="button" onClick={() => { onSignIn(); setIsOpen(false); }} className="btn-web3-outline w-full mt-2">
              Sign in
            </button>
          )}
          <button type="button" onClick={() => { onStartChat(); setIsOpen(false); }} className="btn-web3-primary w-full mt-2">
            {isAuthenticated ? 'Launch app' : 'Start care plan'}
          </button>
          {onLogout && (
            <button type="button" onClick={() => { onLogout(); setIsOpen(false); }} className="btn-web3-outline w-full mt-2">
              Logout
            </button>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;
