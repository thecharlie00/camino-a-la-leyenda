import React from 'react';
import { Gamepad2, Shield, Trophy, BookOpen, Maximize2, Lock } from 'lucide-react';
import { ActiveView, Language } from '../types';
import { getTranslation, LANG_NAMES } from '../translations';

interface HeaderProps {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  lang: Language;
  onLanguageChange: (lang: Language) => void;
  onToggleFullscreen: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeView,
  setActiveView,
  lang,
  onLanguageChange,
  onToggleFullscreen,
}) => {
  const t = (k: string) => getTranslation(lang, k);

  return (
    <header className="app-header">
      <div className="header-inner">
        <a
          href="#game"
          onClick={(e) => {
            e.preventDefault();
            setActiveView('game');
          }}
          className="brand-link"
        >
          <img
            src="/img/icon-72.png"
            width={34}
            height={34}
            alt="Camino a la Leyenda"
            className="rounded-lg shadow"
          />
          <div>
            <div className="brand-title">{t('app_title')}</div>
          </div>
          <span className="brand-badge">v5.2</span>
        </a>

        <nav className="nav-tabs" aria-label="Navegación principal">
          <button
            type="button"
            className={`nav-tab ${activeView === 'game' ? 'active' : ''}`}
            onClick={() => setActiveView('game')}
            title={t('tab_game')}
          >
            <Gamepad2 size={16} />
            <span>{t('tab_game')}</span>
          </button>

          <button
            type="button"
            className={`nav-tab ${activeView === 'pitch' ? 'active' : ''}`}
            onClick={() => setActiveView('pitch')}
            title={t('tab_pitch')}
          >
            <Shield size={16} />
            <span>{t('tab_pitch')}</span>
          </button>

          <button
            type="button"
            className={`nav-tab ${activeView === 'goat' ? 'active' : ''}`}
            onClick={() => setActiveView('goat')}
            title={t('tab_goat')}
          >
            <Trophy size={16} />
            <span>{t('tab_goat')}</span>
          </button>

          <button
            type="button"
            className={`nav-tab ${activeView === 'guide' ? 'active' : ''}`}
            onClick={() => setActiveView('guide')}
            title={t('tab_guide')}
          >
            <BookOpen size={16} />
            <span>{t('tab_guide')}</span>
          </button>
        </nav>

        <div className="header-actions">
          <select
            className="lang-select"
            value={lang}
            onChange={(e) => onLanguageChange(e.target.value as Language)}
            aria-label="Seleccionar idioma"
          >
            {(Object.keys(LANG_NAMES) as Language[]).map((l) => (
              <option key={l} value={l}>
                {LANG_NAMES[l]} ({l.toUpperCase()})
              </option>
            ))}
          </select>

          <button
            type="button"
            className="btn sm"
            onClick={onToggleFullscreen}
            title={t('fullscreen')}
          >
            <Maximize2 size={15} />
            <span className="hide-s">{t('fullscreen')}</span>
          </button>

          <button
            type="button"
            className={`btn sm ${activeView === 'admin' ? 'pri' : ''}`}
            onClick={() => setActiveView(activeView === 'admin' ? 'game' : 'admin')}
            title="Panel de Tráfico Privado (Solo Propietario)"
            style={{ padding: '6px 8px' }}
          >
            <Lock size={14} />
          </button>
        </div>
      </div>
    </header>
  );
};
