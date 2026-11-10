import React, { useState, useEffect } from 'react';
import { ActiveView, Language } from './types';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { GameContainer } from './components/GameContainer';
import { Pitch3DSimulator } from './components/Pitch3DSimulator';
import { PitchDemo } from './components/PitchDemo';
import { GuideView } from './components/GuideView';
import { AdminAnalyticsView } from './components/AdminAnalyticsView';
import { logAnalyticsEvent } from './analytics/tracker';

export const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ActiveView>(() => {
    if (typeof window !== 'undefined' && window.location.hash === '#admin') {
      return 'admin';
    }
    return 'game';
  });
  const [pitchDimension, setPitchDimension] = useState<'3d' | '2d'>('3d');
  const [lang, setLang] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('camino.lang');
      if (saved && /^(es|en|de|it|fr)$/.test(saved)) {
        return saved as Language;
      }
      const nav = (navigator.languages && navigator.languages[0]) || navigator.language || '';
      const code = nav.slice(0, 2).toLowerCase();
      if (/^(es|en|de|it|fr)$/.test(code)) {
        return code as Language;
      }
    } catch (e) {}
    return 'es';
  });

  // Listen to hash changes for direct access to #admin
  useEffect(() => {
    const handleHash = () => {
      if (window.location.hash === '#admin') {
        setActiveView('admin');
      }
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // Track pageviews
  useEffect(() => {
    logAnalyticsEvent('pageview', `Navegación a vista: ${activeView}`, activeView);
  }, [activeView]);

  const handleLanguageChange = (newLang: Language) => {
    setLang(newLang);
    logAnalyticsEvent('lang_change', `Cambio de idioma a: ${newLang.toUpperCase()}`);
    try {
      localStorage.setItem('camino.lang', newLang);
      localStorage.setItem('camino.weblang', newLang);
      if (window.setLang) {
        window.setLang(newLang);
      }
      if (window.UIX && typeof window.UIX.render === 'function') {
        window.UIX.render(true);
      }
    } catch (e) {}
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <div className="app-shell">
      <Header
        activeView={activeView}
        setActiveView={setActiveView}
        lang={lang}
        onLanguageChange={handleLanguageChange}
        onToggleFullscreen={handleToggleFullscreen}
      />

      <main className="main-content">
        {/* Game is preserved in DOM so ongoing match or decisions are never lost */}
        <div style={{ display: activeView === 'game' ? 'flex' : 'none', flex: 1, flexDirection: 'column' }}>
          <GameContainer lang={lang} onLanguageChange={handleLanguageChange} />
        </div>

        {activeView === 'pitch' && (
          <div>
            {/* View Dimension Switcher */}
            <div style={{ display: 'flex', justifyContent: 'center', margin: '14px auto 0', gap: '8px' }}>
              <button
                type="button"
                className={`btn sm ${pitchDimension === '3d' ? 'pri' : ''}`}
                onClick={() => {
                  setPitchDimension('3d');
                  logAnalyticsEvent('match_sim', 'Simulador 3D activado');
                }}
              >
                🎮 Vista 3D (Estadio & Físicas)
              </button>
              <button
                type="button"
                className={`btn sm ${pitchDimension === '2d' ? 'pri' : ''}`}
                onClick={() => {
                  setPitchDimension('2d');
                  logAnalyticsEvent('match_sim', 'Simulador 2D táctico activado');
                }}
              >
                📋 Vista 2D (Táctica Clásica)
              </button>
            </div>

            {pitchDimension === '3d' ? (
              <Pitch3DSimulator lang={lang} />
            ) : (
              <PitchDemo lang={lang} />
            )}
          </div>
        )}

        {activeView === 'guide' && <GuideView lang={lang} />}
        {activeView === 'admin' && (
          <AdminAnalyticsView onBackToGame={() => setActiveView('game')} />
        )}
      </main>

      <Footer lang={lang} setActiveView={setActiveView} />
    </div>
  );
};
