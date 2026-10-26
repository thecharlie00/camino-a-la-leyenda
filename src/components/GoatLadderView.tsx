import React, { useState, useEffect } from 'react';
import { Trophy, Award, Star, History, UserCheck, Shield } from 'lucide-react';
import { Language, GoatCareerEntry, SaveSlotMeta } from '../types';
import { getTranslation } from '../translations';

interface GoatLadderViewProps {
  lang: Language;
}

export const GoatLadderView: React.FC<GoatLadderViewProps> = ({ lang }) => {
  const [board, setBoard] = useState<'careers' | 'achievements'>('careers');
  const [mode, setMode] = useState<'player' | 'manager'>('player');
  const [timeframe, setTimeframe] = useState<'all-time' | '30d' | '7d'>('all-time');
  const [metric, setMetric] = useState<string>('appearances');
  const [localSlots, setLocalSlots] = useState<SaveSlotMeta[]>([]);
  const [customEntries, setCustomEntries] = useState<GoatCareerEntry[]>([]);
  const [notification, setNotification] = useState<string>('');

  const t = (k: string, p?: Record<string, string | number>) => getTranslation(lang, k, p);

  const playerMetrics = [
    'appearances', 'goals', 'assists', 'trophies', 'awards',
    'clean_sheets', 'international_caps', 'international_goals', 'seasons'
  ];

  const managerMetrics = [
    'wins', 'draws', 'losses', 'trophies', 'unbeaten_seasons',
    'promotions', 'win_percentage', 'seasons'
  ];

  const defaultLegends: GoatCareerEntry[] = [
    {
      id: 'legend-1',
      name: 'Lionel Messirve',
      mode: 'player',
      score: 9940,
      club: 'Barcino FC',
      nationality: 'ARG',
      seasons: 21,
      appearances: 885,
      goals: 710,
      assists: 345,
      trophies: 38,
      awards: 8,
      clean_sheets: 0,
      international_caps: 180,
      international_goals: 106,
      history: [
        { season: '2023-2024', club: 'Barcino FC', competition: 'Primera División', appearances: 36, goals: 32, assists: 14, trophies: ['Liga', 'Copa'] },
        { season: '2022-2023', club: 'Barcino FC', competition: 'Primera División', appearances: 38, goals: 35, assists: 18, trophies: ['Champions'] },
      ]
    },
    {
      id: 'legend-2',
      name: 'Cristiano Ronaldoza',
      mode: 'player',
      score: 9890,
      club: 'Madrid Realista',
      nationality: 'POR',
      seasons: 22,
      appearances: 915,
      goals: 765,
      assists: 220,
      trophies: 34,
      awards: 5,
      clean_sheets: 0,
      international_caps: 205,
      international_goals: 128,
      history: [
        { season: '2023-2024', club: 'Madrid Realista', competition: 'Liga', appearances: 38, goals: 40, assists: 9, trophies: ['Copa de Europa'] },
      ]
    },
    {
      id: 'legend-3',
      name: 'Zinedine Zidanez',
      mode: 'manager',
      score: 9550,
      club: 'Madrid Realista',
      nationality: 'FRA',
      seasons: 12,
      appearances: 480,
      wins: 320,
      draws: 85,
      losses: 75,
      trophies: 16,
      unbeaten_seasons: 2,
      promotions: 0,
      win_percentage: 67,
      history: [
        { season: '2023-2024', club: 'Madrid Realista', competition: 'Liga Continental', wins: 28, draws: 6, losses: 4, trophies: ['Champions League'] },
      ]
    },
    {
      id: 'legend-4',
      name: 'Pep Guardiolón',
      mode: 'manager',
      score: 9780,
      club: 'Manchester Sky Blue',
      nationality: 'ESP',
      seasons: 16,
      appearances: 640,
      wins: 470,
      draws: 90,
      losses: 80,
      trophies: 26,
      unbeaten_seasons: 3,
      promotions: 1,
      win_percentage: 73,
      history: [
        { season: '2023-2024', club: 'Manchester Sky Blue', competition: 'Premier', wins: 30, draws: 5, losses: 3, trophies: ['Premier League', 'Mundial de Clubes'] },
      ]
    },
  ];

  // Load saved careers from browser storage
  useEffect(() => {
    try {
      const raw = localStorage.getItem('camino.slots');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setLocalSlots(parsed);
        }
      }
      const rawCustom = localStorage.getItem('camino.goat_custom');
      if (rawCustom) {
        setCustomEntries(JSON.parse(rawCustom));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handlePublishLocal = (slot: SaveSlotMeta) => {
    const isM = slot.mode === 'mgr' || slot.mode === 'club';
    const entry: GoatCareerEntry = {
      id: 'custom-' + slot.id + '-' + Date.now(),
      name: slot.n,
      mode: isM ? 'manager' : 'player',
      score: slot.lv * 100,
      club: slot.cn || 'Club',
      seasons: Math.max(1, slot.yr - 2026 + 1),
      appearances: Math.floor(slot.lv * 4.2),
      goals: isM ? undefined : Math.floor(slot.lv * 1.8),
      assists: isM ? undefined : Math.floor(slot.lv * 0.9),
      wins: isM ? Math.floor(slot.lv * 2.8) : undefined,
      draws: isM ? Math.floor(slot.lv * 0.8) : undefined,
      losses: isM ? Math.floor(slot.lv * 0.6) : undefined,
      trophies: Math.max(1, Math.floor(slot.lv / 20)),
      win_percentage: isM ? 62 : undefined,
      history: [
        {
          season: `${slot.yr}-${slot.yr + 1}`,
          club: slot.cn || 'Club',
          competition: 'Liga Oficial',
          appearances: 34,
          goals: isM ? undefined : 16,
          wins: isM ? 22 : undefined,
        }
      ]
    };

    const next = [entry, ...customEntries];
    setCustomEntries(next);
    try {
      localStorage.setItem('camino.goat_custom', JSON.stringify(next));
    } catch (e) {}

    setNotification(`¡${slot.n} publicado exitosamente en el Salón GOAT!`);
    setTimeout(() => setNotification(''), 4000);
  };

  const allEntries = [...customEntries, ...defaultLegends].filter((e) => e.mode === mode);

  // Sort by the chosen metric
  const sortedEntries = [...allEntries].sort((a, b) => {
    const va = (a as any)[metric] ?? a.score ?? 0;
    const vb = (b as any)[metric] ?? b.score ?? 0;
    return vb - va;
  });

  return (
    <div style={{ maxWidth: '960px', margin: '20px auto', padding: '0 16px', width: '100%' }}>
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <p className="eyebrow" style={{ color: 'var(--led)' }}>🏆 {t('goat_title')}</p>
        <h1 style={{ fontSize: '36px', color: 'var(--chalk)', textTransform: 'uppercase', marginTop: '4px' }}>
          {t('goat_title')}
        </h1>
        <p style={{ color: 'var(--mist)', fontSize: '15px', maxWidth: '600px', margin: '8px auto 0' }}>
          {t('goat_subtitle')}
        </p>
      </div>

      {notification && (
        <div className="toast" role="status">
          {notification}
        </div>
      )}

      {/* Local careers publisher */}
      {localSlots.length > 0 && (
        <div className="card" style={{ marginBottom: '20px', borderColor: 'var(--led)' }}>
          <div className="head">
            <h3 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UserCheck size={18} color="var(--led)" />
              {t('publish_local_title')}
            </h3>
            <span className="tag real">{localSlots.length} Guardadas</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '10px', marginTop: '8px' }}>
            {localSlots.map((slot) => (
              <div
                key={slot.id}
                style={{
                  background: 'var(--tunnel)',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid var(--line)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ fontWeight: 800, fontSize: '15px' }}>{slot.n}</div>
                  <div style={{ fontSize: '12px', color: 'var(--mist)' }}>
                    {slot.cn || 'Club'} · {slot.pos} · {slot.lv} OVR
                  </div>
                </div>
                <button
                  type="button"
                  className="btn sm pri"
                  onClick={() => handlePublishLocal(slot)}
                >
                  <Trophy size={14} />
                  <span>{t('publish_btn')}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters Bar */}
      <div
        className="card"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            type="button"
            className={`btn sm ${board === 'careers' ? 'pri' : ''}`}
            onClick={() => setBoard('careers')}
          >
            {t('goat_careers')}
          </button>
          <button
            type="button"
            className={`btn sm ${board === 'achievements' ? 'pri' : ''}`}
            onClick={() => setBoard('achievements')}
          >
            {t('goat_achievements')}
          </button>
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            type="button"
            className={`btn sm ${mode === 'player' ? 'pri' : ''}`}
            onClick={() => {
              setMode('player');
              setMetric('appearances');
            }}
          >
            {t('goat_player')}
          </button>
          <button
            type="button"
            className={`btn sm ${mode === 'manager' ? 'pri' : ''}`}
            onClick={() => {
              setMode('manager');
              setMetric('wins');
            }}
          >
            {t('goat_manager')}
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: 'var(--mist)' }}>{t('goat_metric')}:</span>
          <select
            className="lang-select"
            value={metric}
            onChange={(e) => setMetric(e.target.value)}
          >
            {(mode === 'player' ? playerMetrics : managerMetrics).map((m) => (
              <option key={m} value={m}>
                {t(m)}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            type="button"
            className={`btn sm ${timeframe === 'all-time' ? 'pri' : ''}`}
            onClick={() => setTimeframe('all-time')}
          >
            {t('goat_all_time')}
          </button>
          <button
            type="button"
            className={`btn sm ${timeframe === '30d' ? 'pri' : ''}`}
            onClick={() => setTimeframe('30d')}
          >
            {t('goat_30d')}
          </button>
          <button
            type="button"
            className={`btn sm ${timeframe === '7d' ? 'pri' : ''}`}
            onClick={() => setTimeframe('7d')}
          >
            {t('goat_7d')}
          </button>
        </div>
      </div>

      {/* Leaderboard Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {sortedEntries.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '30px', color: 'var(--mist)' }}>
            {t('no_entries')}
          </div>
        ) : (
          sortedEntries.map((entry, index) => (
            <div
              key={entry.id}
              className="card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                borderLeft: index < 3 ? `4px solid ${index === 0 ? 'var(--gold)' : index === 1 ? 'var(--silver)' : 'var(--bronze)'}` : undefined,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '8px',
                      background: index === 0 ? 'var(--gold)' : index === 1 ? 'var(--silver)' : index === 2 ? 'var(--bronze)' : 'var(--tunnel)',
                      color: index < 3 ? '#1a1408' : 'var(--chalk)',
                      display: 'grid',
                      placeItems: 'center',
                      fontWeight: 900,
                      fontFamily: 'var(--f-disp)',
                      fontSize: '20px',
                    }}
                  >
                    #{index + 1}
                  </div>

                  <div>
                    <h3 style={{ fontSize: '22px' }}>{entry.name}</h3>
                    <div style={{ fontSize: '13px', color: 'var(--mist)', display: 'flex', gap: '8px' }}>
                      <span>{entry.club}</span>
                      {entry.nationality && <span>· {entry.nationality}</span>}
                      <span>· {entry.seasons} {t('seasons')}</span>
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div className="eyebrow" style={{ color: 'var(--led)' }}>GOAT SCORE</div>
                  <div style={{ fontFamily: 'var(--f-led)', fontSize: '22px', fontWeight: 900, color: 'var(--chalk)' }}>
                    {entry.score.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
                  gap: '8px',
                  background: 'var(--tunnel)',
                  padding: '10px 14px',
                  borderRadius: '8px',
                }}
              >
                {entry.appearances != null && (
                  <div>
                    <div className="eyebrow">{t('appearances')}</div>
                    <div className="num" style={{ fontWeight: 800, fontSize: '16px' }}>{entry.appearances}</div>
                  </div>
                )}
                {entry.goals != null && (
                  <div>
                    <div className="eyebrow">{t('goals')}</div>
                    <div className="num" style={{ fontWeight: 800, fontSize: '16px', color: 'var(--grass)' }}>{entry.goals}</div>
                  </div>
                )}
                {entry.assists != null && (
                  <div>
                    <div className="eyebrow">{t('assists')}</div>
                    <div className="num" style={{ fontWeight: 800, fontSize: '16px', color: 'var(--sky)' }}>{entry.assists}</div>
                  </div>
                )}
                {entry.wins != null && (
                  <div>
                    <div className="eyebrow">{t('wins')}</div>
                    <div className="num" style={{ fontWeight: 800, fontSize: '16px', color: 'var(--grass)' }}>{entry.wins}</div>
                  </div>
                )}
                {entry.trophies != null && (
                  <div>
                    <div className="eyebrow">{t('trophies')}</div>
                    <div className="num" style={{ fontWeight: 800, fontSize: '16px', color: 'var(--gold)' }}>🏆 {entry.trophies}</div>
                  </div>
                )}
                {entry.awards != null && (
                  <div>
                    <div className="eyebrow">{t('awards')}</div>
                    <div className="num" style={{ fontWeight: 800, fontSize: '16px', color: 'var(--led)' }}>⭐ {entry.awards}</div>
                  </div>
                )}
                {entry.win_percentage != null && (
                  <div>
                    <div className="eyebrow">{t('win_percentage')}</div>
                    <div className="num" style={{ fontWeight: 800, fontSize: '16px' }}>{entry.win_percentage}%</div>
                  </div>
                )}
              </div>

              {/* Season history */}
              {entry.history && entry.history.length > 0 && (
                <details style={{ fontSize: '13px', color: 'var(--mist)', marginTop: '4px' }}>
                  <summary style={{ cursor: 'pointer', fontWeight: 700, color: 'var(--chalk)' }}>
                    {t('history')} ({entry.history.length})
                  </summary>
                  <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {entry.history.map((h, i) => (
                      <div
                        key={i}
                        style={{
                          background: 'var(--stand)',
                          padding: '6px 10px',
                          borderRadius: '6px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <div>
                          <strong>{h.season}</strong> · {h.club} ({h.competition})
                        </div>
                        <div style={{ color: 'var(--chalk)' }}>
                          {h.goals != null && `${h.goals} goles `}
                          {h.appearances != null && `(${h.appearances} p.) `}
                          {h.trophies && h.trophies.map((tr, ti) => (
                            <span key={ti} className="tag real" style={{ marginLeft: '4px' }}>🏆 {tr}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
