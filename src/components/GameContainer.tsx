import React, { useEffect, useState, useRef, useCallback } from 'react';
import { RotateCcw, Download, Upload, PlusCircle, Trophy } from 'lucide-react';
import { Language, SaveSlotMeta } from '../types';
import { getTranslation } from '../translations';

interface GameContainerProps {
  lang: Language;
  onLanguageChange: (lang: Language) => void;
}

declare global {
  interface Window {
    __camBoot?: () => void;
    UIX?: any;
    setLang?: (l: string) => void;
    S?: any;
    W?: any;
    UI?: any;
    Store?: any;
  }
}

export const GameContainer: React.FC<GameContainerProps> = ({ lang }) => {
  const [activeSlot, setActiveSlot] = useState<SaveSlotMeta | null>(null);
  const [engineReady, setEngineReady] = useState<boolean>(false);
  const appContainerRef = useRef<HTMLDivElement | null>(null);

  const t = (k: string) => getTranslation(lang, k);

  // Sync active save info from localStorage
  const refreshActiveSave = useCallback(() => {
    try {
      const activeRaw = localStorage.getItem('camino.active');
      if (activeRaw) {
        const s = JSON.parse(activeRaw);
        if (s) {
          const isMgr = s.mode === 'mgr' && !!s.m;
          const p = s.p;
          const m = s.m;
          const club = isMgr ? m.club : p ? p.club : -1;
          const name = isMgr ? `${m.fn ? m.fn + ' ' : ''}${m.ln}` : `${p.fn} ${p.ln}`;
          const lv = isMgr ? Math.round(m.rep) : Math.round(p.ovr);
          const pos = isMgr ? 'DT' : p.pos;

          setActiveSlot({
            id: s.uid,
            mode: isMgr ? (s.kind === 'club' ? 'club' : p ? 'pm' : 'mgr') : 'p',
            n: name,
            club,
            cn: s.custom && s.custom.id === club ? s.custom.n : 'Club',
            yr: s.yr,
            ts: s.ts || Date.now(),
            lv,
            pos,
          });
          return;
        }
      }
      setActiveSlot(null);
    } catch (e) {
      console.error('Error reading active save:', e);
    }
  }, []);

  // Initialize and boot game engine
  useEffect(() => {
    // Sync current lang with game engine storage
    try {
      localStorage.setItem('camino.lang', lang);
      localStorage.setItem('camino.weblang', lang);
    } catch (e) {}

    const bootGame = () => {
      if (typeof window.__camBoot === 'function') {
        try {
          if (typeof window.setLang === 'function') {
            window.setLang(lang);
          }
          window.__camBoot();
          setEngineReady(true);
          refreshActiveSave();
        } catch (err) {
          console.error('Error booting game engine:', err);
        }
      }
    };

    if (window.__camBoot) {
      bootGame();
    } else {
      // Check if script already exists
      const existingScript = document.getElementById('camino-engine-script');
      if (!existingScript) {
        const script = document.createElement('script');
        script.id = 'camino-engine-script';
        script.src = '/camino-engine.js';
        script.async = false;
        script.onload = () => {
          setTimeout(bootGame, 50);
        };
        script.onerror = (e) => {
          console.error('Failed to load /camino-engine.js', e);
        };
        document.body.appendChild(script);
      } else {
        setTimeout(bootGame, 100);
      }
    }

    const interval = setInterval(refreshActiveSave, 2500);
    return () => clearInterval(interval);
  }, [lang, refreshActiveSave]);

  const handleRestartView = () => {
    if (window.UIX && typeof window.UIX.render === 'function') {
      window.UIX.render(true);
    } else if (window.__camBoot) {
      window.__camBoot();
    }
    refreshActiveSave();
  };

  const handleNewGame = () => {
    if (window.UIX && typeof window.UIX.choose === 'function') {
      try {
        if (window.UI) {
          window.UI.view = 'home';
          window.UI.tab = 'carrera';
        }
        window.UIX.render(true);
      } catch (e) {}
    } else if (window.__camBoot) {
      window.__camBoot();
    }
  };

  const handleExportSaves = () => {
    try {
      const data: Record<string, string | null> = {
        slots: localStorage.getItem('camino.slots'),
        active: localStorage.getItem('camino.active'),
        activeId: localStorage.getItem('camino.activeId'),
        lang: localStorage.getItem('camino.lang'),
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `camino-a-la-leyenda-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('Error exportando datos: ' + e);
    }
  };

  const handleImportSaves = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (re) => {
        try {
          const parsed = JSON.parse(re.target?.result as string);
          if (parsed.slots) localStorage.setItem('camino.slots', parsed.slots);
          if (parsed.active) localStorage.setItem('camino.active', parsed.active);
          if (parsed.activeId) localStorage.setItem('camino.activeId', parsed.activeId);
          alert('¡Partidas importadas correctamente!');
          handleRestartView();
        } catch (err) {
          alert('Archivo de copia de seguridad inválido.');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <div className="game-viewport">
      {/* Quick Game Toolbar */}
      <div className="game-toolbar">
        <div className="game-save-info">
          {activeSlot ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className={`game-save-badge tier-${activeSlot.lv >= 85 ? 'e' : activeSlot.lv >= 75 ? 'g' : activeSlot.lv >= 65 ? 's' : 'b'}`}>
                {activeSlot.pos} {activeSlot.lv}
              </span>
              <strong>{activeSlot.n}</strong>
              <span style={{ color: 'var(--mist)' }}>
                · {activeSlot.cn} ({activeSlot.yr})
              </span>
            </div>
          ) : (
            <span style={{ color: 'var(--mist)', fontSize: '13px' }}>
              {t('no_active_save')}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <button
            type="button"
            className="btn sm"
            onClick={handleNewGame}
            title={t('new_game')}
          >
            <PlusCircle size={14} />
            <span>{t('new_game')}</span>
          </button>

          <button
            type="button"
            className="btn sm"
            onClick={handleRestartView}
            title={t('reload_game')}
          >
            <RotateCcw size={14} />
            <span>{t('reload_game')}</span>
          </button>

          <button
            type="button"
            className="btn sm"
            onClick={handleExportSaves}
            title={t('export_save')}
          >
            <Download size={14} />
          </button>

          <button
            type="button"
            className="btn sm"
            onClick={handleImportSaves}
            title={t('import_save')}
          >
            <Upload size={14} />
          </button>
        </div>
      </div>

      {/* Mounting Point for Game Engine */}
      <div className="game-mount-point" ref={appContainerRef}>
        <div id="app" />
      </div>
    </div>
  );
};
