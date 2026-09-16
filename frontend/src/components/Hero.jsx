import React from 'react';
import PhoneMockup from './PhoneMockup';
import StatsRow from './StatsRow';

const Hero = ({ onStartChat }) => {
  return (
    <section className="hero-web3 page-section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16 lg:pb-24">
        <div className="hero-web3__grid">
          <div className="hero-web3__copy">
            <div className="web3-badge">
              <span className="web3-badge__dot" />
              Trusted by 25k+ people seeking calmer care
            </div>

            <h1 className="hero-web3__title">
              <span className="hero-web3__line">Feel better,</span>
              <span className="hero-web3__line hero-web3__line--accent">
                one mindful step at a time.
              </span>
            </h1>

            <p className="hero-web3__subtitle">
              Braino AI brings together emotional support, mood tracking, guided routines,
              and healthcare insights in one calming digital experience designed for daily wellbeing.
            </p>

            <div className="hero-web3__actions">
              <button type="button" onClick={onStartChat} className="btn-web3-primary">
                Start your care plan
              </button>
              <a href="#marketplace" className="btn-web3-outline">
                Explore tools
              </a>
            </div>

            <StatsRow />
          </div>

          <div className="hero-web3__phones">
            <div className="hero-web3__mini-card hero-web3__mini-card--left">
              <span className="mini-card__label">Today</span>
              <strong>87%</strong>
              <small>Mood stability</small>
            </div>
            <div className="hero-web3__mini-card hero-web3__mini-card--right">
              <span className="mini-card__label">Care score</span>
              <strong>4.9/5</strong>
              <small>Patient experience</small>
            </div>
            <PhoneMockup variant="secondary" />
            <PhoneMockup variant="primary" onStartChat={onStartChat} />
            <div className="hero-web3__orbit" aria-hidden="true" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
