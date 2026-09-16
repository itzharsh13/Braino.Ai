import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, TrendingUp, Calendar, Sparkles } from 'lucide-react';
import MoodEmoji from './MoodEmoji';
import config, { getAuthHeaders } from '../config';

const LOCAL_KEY = 'brainoai_unsynced_moods';

const moodOptions = [
  { value: 'very_sad', label: '😢', name: 'Very Sad', color: '#3b82f6' },
  { value: 'sad', label: '☹️', name: 'Sad', color: '#6366f1' },
  { value: 'neutral', label: '😐', name: 'Neutral', color: '#94a3b8' },
  { value: 'happy', label: '🙂', name: 'Happy', color: '#22d3ee' },
  { value: 'very_happy', label: '😄', name: 'Very Happy', color: '#facc15' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 120, damping: 14 } },
};

const MoodTracker = () => {
  const [selectedMood, setSelectedMood] = useState(null);
  const [intensity, setIntensity] = useState(5);
  const [notes, setNotes] = useState('');
  const [moods, setMoods] = useState([]);
  const [stats, setStats] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [range, setRange] = useState('today');
  const [offlineQueue, setOfflineQueue] = useState([]);
  const [syncStatus, setSyncStatus] = useState('idle');

  const selectedMeta = moodOptions.find((m) => m.value === selectedMood);

  useEffect(() => {
    loadOfflineQueue();
    refreshAll();
    const interval = setInterval(() => {
      refreshAll();
      trySync();
    }, 10000);
    return () => clearInterval(interval);
  }, [range]);

  const loadOfflineQueue = () => {
    try {
      const raw = localStorage.getItem(LOCAL_KEY);
      if (raw) setOfflineQueue(JSON.parse(raw));
    } catch {
      setOfflineQueue([]);
    }
  };

  const saveOfflineQueue = (queue) => {
    try {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(queue));
      setOfflineQueue(queue);
    } catch (e) {
      console.warn('Failed to save offline queue', e);
    }
  };

  const refreshAll = async () => {
    await fetchMoodHistory();
    await fetchStats();
  };

  const fetchMoodHistory = async () => {
    try {
      const url =
        range === 'today'
          ? `${config.API_URL}/mood/today`
          : `${config.API_URL}/mood/history`;
      const response = await fetch(url, { headers: getAuthHeaders() });
      if (response.ok) setMoods(await response.json());
    } catch (error) {
      console.error('Error fetching mood history:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`${config.API_URL}/mood/stats`, { headers: getAuthHeaders() });
      if (response.ok) setStats(await response.json());
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const trySync = async () => {
    if (!offlineQueue?.length) return;
    setSyncStatus('syncing');
    const failed = [];
    for (const item of offlineQueue) {
      try {
        const res = await fetch(`${config.API_URL}/mood/log`, {
          method: 'POST',
          headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify(item),
        });
        if (!res.ok) failed.push(item);
      } catch {
        failed.push(item);
      }
    }
    saveOfflineQueue(failed);
    setSyncStatus(failed.length === 0 ? 'synced' : 'idle');
    if (failed.length === 0) refreshAll();
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!selectedMood) return;

    const payload = { mood: selectedMood, intensity, notes: notes || null };
    try {
      const response = await fetch(`${config.API_URL}/mood/log`, {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        setSubmitted(true);
        setSelectedMood(null);
        setIntensity(5);
        setNotes('');
        fetchMoodHistory();
        fetchStats();
        setTimeout(() => setSubmitted(false), 3200);
      } else {
        saveOfflineQueue([...offlineQueue, payload]);
        setSubmitted(true);
        setTimeout(() => setSubmitted(false), 3200);
      }
    } catch {
      saveOfflineQueue([...offlineQueue, payload]);
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 3200);
    }
  };

  const handleDeleteMood = async (id) => {
    if (!confirm('Delete this mood entry?')) return;
    try {
      await fetch(`${config.API_URL}/mood/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
      fetchMoodHistory();
      fetchStats();
    } catch (error) {
      console.error('Error deleting mood:', error);
    }
  };

  const distribution = (() => {
    const counts = {};
    moodOptions.forEach((m) => (counts[m.value] = 0));
    (moods || []).forEach((e) => {
      counts[e.mood] = (counts[e.mood] || 0) + 1;
    });
    return counts;
  })();

  const total = Object.values(distribution).reduce((a, b) => a + b, 0) || 1;

  return (
    <div className="page-section mood-tracker pt-24 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <motion.div
          className="mood-tracker-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div>
            <div className="flex items-center gap-3 mb-1">
              <motion.div
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <Heart className="w-8 h-8 text-[var(--neon-cyan)]" />
              </motion.div>
              <h1 className="text-3xl font-bold text-gradient-accent">Mood Tracker</h1>
            </div>
            <p className="text-sm text-[var(--text-muted)]">
              Pick a mood — each emoji moves the way you feel. Log, track, sync offline.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`mood-sync-pill mood-sync-pill--${syncStatus}`}>
              Sync: {syncStatus}
            </span>
            <span className="mood-sync-pill">Queued: {offlineQueue?.length || 0}</span>
          </div>
        </motion.div>

        <motion.div
          className="mood-range-tabs mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          {['today', '7days'].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={`mood-tab ${range === r ? 'mood-tab--active' : ''}`}
            >
              {r === 'today' ? 'Today' : 'All history'}
            </button>
          ))}
          <button type="button" onClick={trySync} className="mood-tab mood-tab--sync">
            Sync now
          </button>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          <motion.div variants={itemVariants} className="lg:col-span-2 mood-panel">
            <h2 className="text-xl font-semibold mb-2">How are you feeling?</h2>
            <p className="text-sm text-[var(--text-muted)] mb-6">
              Tap an emoji — watch it come alive
            </p>

            <AnimatePresence mode="wait">
              {selectedMeta && (
                <motion.div
                  key={selectedMeta.value}
                  className="mood-hero-preview"
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -10 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 18 }}
                  style={{ '--preview-color': selectedMeta.color }}
                >
                  <MoodEmoji
                    moodValue={selectedMeta.value}
                    emoji={selectedMeta.label}
                    size="lg"
                    selected
                  />
                  <div>
                    <p className="mood-hero-preview__name">{selectedMeta.name}</p>
                    <p className="mood-hero-preview__hint">
                      {selectedMeta.value.includes('sad')
                        ? 'Gentle movements — we hear you'
                        : selectedMeta.value.includes('happy')
                          ? 'Energy rising — keep shining'
                          : 'Steady and balanced'}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mood-picker-grid">
              {moodOptions.map((mood, i) => (
                <motion.div
                  key={mood.value}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.05 * i, type: 'spring', stiffness: 260, damping: 16 }}
                >
                  <MoodEmoji
                    moodValue={mood.value}
                    emoji={mood.label}
                    selected={selectedMood === mood.value}
                    onClick={() => setSelectedMood(mood.value)}
                  />
                  <p className="mood-picker-label">{mood.name}</p>
                </motion.div>
              ))}
            </div>

            <div className="mt-8">
              <label className="block text-sm font-medium mb-2">
                Intensity:{' '}
                <motion.span
                  key={intensity}
                  className="font-bold text-[var(--neon-cyan)]"
                  initial={{ scale: 1.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                >
                  {intensity}/10
                </motion.span>
              </label>
              <div className="mood-intensity-track">
                <motion.div
                  className="mood-intensity-fill"
                  animate={{
                    width: `${intensity * 10}%`,
                    background: selectedMeta
                      ? `linear-gradient(90deg, ${selectedMeta.color}, var(--neon-cyan))`
                      : 'linear-gradient(90deg, var(--neon-blue), var(--neon-cyan))',
                  }}
                  transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                />
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={intensity}
                onChange={(e) => setIntensity(Number(e.target.value))}
                className="mood-range-input w-full mt-2"
              />
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium mb-1">Notes (optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="mood-notes-input w-full"
                placeholder="What triggered this mood?"
              />
            </div>

            <div className="flex gap-3 mt-6">
              <motion.button
                type="button"
                onClick={handleSubmit}
                className="btn-web3-primary"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                disabled={!selectedMood}
              >
                Log mood
              </motion.button>
              <button
                type="button"
                onClick={() => {
                  setSelectedMood(null);
                  setNotes('');
                  setIntensity(5);
                }}
                className="btn-web3-outline"
              >
                Reset
              </button>
            </div>

            <AnimatePresence>
              {submitted && (
                <motion.div
                  className="mood-success"
                  initial={{ opacity: 0, y: 12, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <motion.span
                    animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.6 }}
                  >
                    ✓
                  </motion.span>
                  Mood saved{offlineQueue.length ? ' (queued offline)' : ''}!
                  <Sparkles className="w-4 h-4 text-[var(--neon-cyan)]" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          <motion.div variants={itemVariants} className="mood-panel space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-[var(--neon-cyan)]" />
                <h3 className="text-lg font-bold">Statistics</h3>
              </div>
              {stats ? (
                <div className="grid grid-cols-1 gap-3">
                  {[
                    { label: 'Total entries', value: stats.total_entries },
                    { label: 'Avg intensity', value: stats.average_intensity },
                    {
                      label: 'Most common',
                      value: stats.most_common_mood?.replace(/_/g, ' ') || 'N/A',
                    },
                  ].map((s, i) => (
                    <motion.div
                      key={s.label}
                      className="mood-stat-box"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * i }}
                      whileHover={{ scale: 1.02, borderColor: 'var(--border-glow)' }}
                    >
                      <p className="text-xs text-[var(--text-muted)]">{s.label}</p>
                      <p className="text-xl font-bold text-[var(--neon-cyan)]">{s.value}</p>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[var(--text-muted)]">No stats yet</p>
              )}
            </div>

            <div>
              <p className="text-sm mb-3 font-medium">Mood distribution</p>
              <div className="space-y-3">
                {moodOptions.map((m) => {
                  const count = distribution[m.value] || 0;
                  const pct = Math.round((count / total) * 100);
                  return (
                    <div key={m.value} className="mood-bar-row">
                      <motion.span
                        className="mood-bar-emoji"
                        animate={
                          count > 0
                            ? m.value.includes('happy')
                              ? { y: [0, -4, 0] }
                              : m.value.includes('sad')
                                ? { y: [0, 3, 0] }
                                : { scale: [1, 1.05, 1] }
                            : {}
                        }
                        transition={{ duration: 2, repeat: count > 0 ? Infinity : 0 }}
                      >
                        {m.label}
                      </motion.span>
                      <div className="mood-bar-track">
                        <motion.div
                          className="mood-bar-fill"
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ type: 'spring', stiffness: 80, damping: 18, delay: 0.1 }}
                          style={{ background: m.color }}
                        />
                      </div>
                      <span className="mood-bar-count">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-[var(--neon-purple)]" />
                <h4 className="text-sm font-semibold">Entries</h4>
              </div>
              <div className="max-h-64 overflow-y-auto space-y-2 mood-entries-list">
                <AnimatePresence mode="popLayout">
                  {moods.length > 0 ? (
                    moods.map((m, i) => {
                      const opt = moodOptions.find((o) => o.value === m.mood);
                      return (
                        <motion.div
                          key={m.id}
                          layout
                          initial={{ opacity: 0, x: -16 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 16, height: 0 }}
                          transition={{ delay: i * 0.04 }}
                          className="mood-entry-card"
                          whileHover={{ x: 4, borderColor: 'var(--border-glow)' }}
                        >
                          <motion.span
                            className="text-2xl"
                            animate={
                              m.mood?.includes('happy')
                                ? { y: [0, -3, 0], rotate: [0, 5, 0] }
                                : m.mood?.includes('sad')
                                  ? { y: [0, 2, 0] }
                                  : {}
                            }
                            transition={{ duration: 2.5, repeat: Infinity }}
                          >
                            {opt?.label}
                          </motion.span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm capitalize">{m.mood?.replace(/_/g, ' ')}</p>
                            <p className="text-xs text-[var(--text-muted)]">
                              {new Date(m.timestamp).toLocaleString()}
                            </p>
                            {m.notes && (
                              <p className="mt-1 text-xs text-[var(--text-muted)] truncate">
                                {m.notes}
                              </p>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-semibold text-[var(--neon-cyan)]">
                              {m.intensity}/10
                            </p>
                            <button
                              type="button"
                              onClick={() => handleDeleteMood(m.id)}
                              className="text-xs text-red-400 hover:text-red-300"
                            >
                              Delete
                            </button>
                          </div>
                        </motion.div>
                      );
                    })
                  ) : (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-sm text-[var(--text-muted)] py-4 text-center"
                    >
                      No entries for this range
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default MoodTracker;
