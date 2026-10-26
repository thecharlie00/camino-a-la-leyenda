import React from 'react';
import { Lock } from 'lucide-react';
import { Language, ActiveView } from '../types';
import { getTranslation } from '../translations';

interface FooterProps {
  lang: Language;
  setActiveView: (view: ActiveView) => void;
}

export const Footer: React.FC<FooterProps> = ({ lang, setActiveView }) => {
  const t = (k: string) => getTranslation(lang, k);

  return (
    <footer className="app-footer">
      <div className="footer-inner">
        <div>
          <strong>Camino a la Leyenda</strong> · {t('tagline')}
          <div style={{ marginTop: '4px', fontSize: '11.5px', color: 'var(--dim)' }}>
            {t('footer_text')}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setActiveView('game')}
            style={{ color: 'var(--chalk)', textDecoration: 'underline', cursor: 'pointer' }}
          >
            {t('tab_game')}
          </button>
          <button
            type="button"
            onClick={() => setActiveView('pitch')}
            style={{ color: 'var(--chalk)', textDecoration: 'underline', cursor: 'pointer' }}
          >
            {t('tab_pitch')}
          </button>
          <button
            type="button"
            onClick={() => setActiveView('goat')}
            style={{ color: 'var(--chalk)', textDecoration: 'underline', cursor: 'pointer' }}
          >
            {t('tab_goat')}
          </button>
          <button
            type="button"
            onClick={() => setActiveView('guide')}
            style={{ color: 'var(--chalk)', textDecoration: 'underline', cursor: 'pointer' }}
          >
            {t('tab_guide')}
          </button>
          <button
            type="button"
            onClick={() => setActiveView('admin')}
            style={{
              color: 'var(--dim)',
              textDecoration: 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '11px',
              borderLeft: '1px solid var(--line)',
              paddingLeft: '10px',
            }}
            title="Panel de tráfico privado (Solo propietario)"
          >
            <Lock size={12} />
            <span>Tráfico Web (Admin)</span>
          </button>
        </div>
      </div>
    </footer>
  );
};
