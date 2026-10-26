import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Pause, RotateCcw, FastForward } from 'lucide-react';
import { Language } from '../types';
import { getTranslation } from '../translations';

interface PitchDemoProps {
  lang: Language;
}

export const PitchDemo: React.FC<PitchDemoProps> = ({ lang }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [speed, setSpeed] = useState<number>(1);
  const [minute, setMinute] = useState<number>(1);
  const [score, setScore] = useState<[number, number]>([0, 0]);
  const [commentary, setCommentary] = useState<string>('');

  const t = useCallback((k: string, p?: Record<string, string | number>) => getTranslation(lang, k, p), [lang]);

  // Simulation state refs so requestAnimationFrame doesn't reset them
  const simRef = useRef({
    clock: 0,
    minute: 1,
    goals: [0, 0] as [number, number],
    own: 0,
    holder: 9,
    nextAt: 0,
    pause: 0,
    shot: null as null | { s: number; goal: boolean; who: string },
    ball: { x: 52.5, y: 34, fx: 0, fy: 0, tx: 0, ty: 0, t: 1, d: 1, h: 0, z: 0, to: null as any },
    teams: [[], []] as Array<Array<{ x: number; y: number; vx: number; vy: number; hx: number; hy: number; sp: number; n: number; ph: number }>>,
  });

  const NAMES = [
    ['Ribas', 'Lozano', 'Teo', 'Barro', 'Quique', 'Moya', 'Iker', 'Saúl', 'Pino', 'Nando', 'Cuesta'],
    ['Ferro', 'Abel', 'Garrido', 'Nuño', 'Ruiz', 'Calvo', 'Duarte', 'Mateo', 'Rivas', 'Ortega', 'Vidal'],
  ];

  const FORMATIONS = [
    [4.5, 34], [24, 10], [21, 26], [21, 42], [24, 58],
    [40, 20], [37, 34], [40, 48], [58, 12], [62, 34], [58, 56],
  ];

  const resetMatch = useCallback(() => {
    const W = 105;
    const H = 68;
    const sim = simRef.current;
    sim.clock = 0;
    sim.minute = 1;
    sim.goals = [0, 0];
    sim.own = 0;
    sim.holder = 9;
    sim.nextAt = 0;
    sim.pause = 0;
    sim.shot = null;
    sim.ball = { x: 52.5, y: 34, fx: 0, fy: 0, tx: 0, ty: 0, t: 1, d: 1, h: 0, z: 0, to: null };
    sim.teams = [[], []];

    for (let s = 0; s < 2; s++) {
      for (let i = 0; i < 11; i++) {
        const x = s ? W - FORMATIONS[i][0] : FORMATIONS[i][0];
        const y = s ? H - FORMATIONS[i][1] : FORMATIONS[i][1];
        sim.teams[s].push({
          x,
          y,
          vx: 0,
          vy: 0,
          hx: FORMATIONS[i][0],
          hy: FORMATIONS[i][1],
          sp: 6 + Math.random() * 2.2,
          n: i + 1,
          ph: Math.random() * 6,
        });
      }
    }

    setMinute(1);
    setScore([0, 0]);
    setCommentary(t('kickoff'));
  }, [t]);

  useEffect(() => {
    resetMatch();
  }, [resetMatch]);

  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = 105;
    const H = 68;
    const K = canvas.width / W;
    const COL = ['#ffb21e', '#66b9ff'];
    const INK = ['#1d1404', '#06233d'];

    function U(s: number, u: number) {
      return s ? W - u : u;
    }

    function nearest(s: number, x: number, y: number, ex?: number) {
      let b = -1;
      let bd = 1e9;
      simRef.current.teams[s].forEach((p, i) => {
        if (i === ex || i === 0) return;
        const d = (p.x - x) * (p.x - x) + (p.y - y) * (p.y - y);
        if (d < bd) {
          bd = d;
          b = i;
        }
      });
      return b;
    }

    function kick(x: number, y: number, d: number, h: number) {
      const sim = simRef.current;
      sim.ball.fx = sim.ball.x;
      sim.ball.fy = sim.ball.y;
      sim.ball.tx = x;
      sim.ball.ty = y;
      sim.ball.t = 0;
      sim.ball.d = d;
      sim.ball.h = h || 0;
      sim.holder = -1;
    }

    function decide() {
      const sim = simRef.current;
      const p = sim.teams[sim.own][sim.holder];
      if (!p) return;
      const bu = sim.own ? W - p.x : p.x;
      const d = 1 - sim.own;

      // Shot at goal
      if (bu > 76 && Math.random() < 0.5) {
        let gy = 34 + (Math.random() - 0.5) * 9;
        const isGoal = Math.random() < 0.32;
        if (!isGoal && Math.random() < 0.5) {
          gy = 34 + (Math.random() < 0.5 ? -1 : 1) * (4.2 + Math.random() * 3);
        }
        sim.shot = { s: sim.own, goal: isGoal, who: NAMES[sim.own][sim.holder] };
        kick(U(sim.own, W + 0.8), gy, 0.55, 0.6);
        setCommentary(t(isGoal ? 'shot' : 'try', { n: sim.shot.who }));
        return;
      }

      let best = -1;
      let bw = -1;
      sim.teams[sim.own].forEach((q, i) => {
        if (i === sim.holder || i === 0) return;
        const fwd = sim.own ? p.x - q.x : q.x - p.x;
        const dist = Math.hypot(q.x - p.x, q.y - p.y);
        if (dist < 7 || dist > 40) return;
        let open = 99;
        sim.teams[d].forEach((o) => {
          open = Math.min(open, Math.hypot(o.x - q.x, o.y - q.y));
        });
        const w = (0.6 + Math.min(open, 9) / 9) * (fwd > 0 ? 1.4 : 0.7) * (0.5 + Math.random());
        if (w > bw) {
          bw = w;
          best = i;
        }
      });

      if (best < 0) {
        sim.nextAt = sim.clock + 0.5;
        return;
      }

      const r = sim.teams[sim.own][best];
      const dist2 = Math.hypot(r.x - p.x, r.y - p.y);
      const steal = Math.random() < 0.16;
      const tgt = { x: r.x + (sim.own ? -2 : 2), y: r.y };
      kick(tgt.x, tgt.y, 0.25 + dist2 / 18, dist2 > 28 ? 3 : 0);
      sim.ball.to = steal ? { s: d, i: nearest(d, tgt.x, tgt.y) } : { s: sim.own, i: best };
    }

    function arrive() {
      const sim = simRef.current;
      if (sim.shot) {
        const s0 = sim.shot.s;
        const who = sim.shot.who;
        sim.shot = null;
        if (Math.abs(sim.ball.ty - 34) < 3.8 && Math.random() < 0.88) {
          sim.goals[s0]++;
          setScore([sim.goals[0], sim.goals[1]]);
          setCommentary(t('goal', { n: who, t: s0 ? t('team_b') : t('team_a') }));
        } else {
          setCommentary(t('out'));
        }
        sim.pause = 1.6;
        sim.own = 1 - s0;
        sim.holder = 0;
        sim.ball.x = U(sim.own, 5);
        sim.ball.y = 34;
        sim.nextAt = sim.clock + 1.8;
        return;
      }

      const to = sim.ball.to || { s: sim.own, i: 9 };
      if (to.s !== sim.own && NAMES[to.s] && NAMES[to.s][to.i]) {
        setCommentary(t('rec', { n: NAMES[to.s][to.i] }));
      }
      sim.own = to.s;
      sim.holder = to.i;
      sim.nextAt = sim.clock + 0.5 + Math.random() * 0.7;
    }

    function step(dt: number) {
      const sim = simRef.current;
      sim.clock += dt;

      if (sim.clock > sim.minute * 1.25 && sim.minute < 90) {
        sim.minute++;
        setMinute(sim.minute);
      }

      if (sim.minute >= 90 && sim.clock > sim.minute * 1.25 + 4) {
        sim.minute = 1;
        sim.clock = 0;
        sim.goals = [0, 0];
        setMinute(1);
        setScore([0, 0]);
        setCommentary(t('rematch'));
      }

      if (sim.pause > 0) sim.pause -= dt;

      if (sim.holder < 0) {
        sim.ball.t += dt;
        const k = Math.min(1, sim.ball.t / sim.ball.d);
        const e = k * (2 - k);
        sim.ball.x = sim.ball.fx + (sim.ball.tx - sim.ball.fx) * e;
        sim.ball.y = sim.ball.fy + (sim.ball.ty - sim.ball.fy) * e;
        sim.ball.z = 4 * sim.ball.h * k * (1 - k);
        if (k >= 1) arrive();
      } else {
        const hp = sim.teams[sim.own][sim.holder];
        if (hp) {
          sim.ball.x += (hp.x + (sim.own ? -0.8 : 0.8) - sim.ball.x) * Math.min(1, dt * 10);
          sim.ball.y += (hp.y - sim.ball.y) * Math.min(1, dt * 10);
          sim.ball.z = 0;
        }
        if (sim.clock > sim.nextAt && sim.pause <= 0) decide();
      }

      const bu0 = sim.own ? W - sim.ball.x : sim.ball.x;

      for (let s = 0; s < 2; s++) {
        const att = s === sim.own;
        const push = att ? (bu0 - 45) * 0.45 : (bu0 - 60) * 0.4;
        sim.teams[s].forEach((p, i) => {
          let u = p.hx + (i ? push : 0);
          let v = p.hy + (sim.ball.y - 34) * (i ? 0.25 : 0.12);
          if (i === 0) u = Math.min(Math.max(p.hx + (att ? 4 : 0), 2), 14);
          let tx = U(s, Math.max(2, Math.min(W - 2, u))) + Math.sin(sim.clock * 0.7 + p.ph) * 1.2;
          let ty = Math.max(2, Math.min(H - 2, v + Math.cos(sim.clock * 0.6 + p.ph) * 1.2));
          if (!att && sim.holder >= 0 && i === nearest(s, sim.ball.x, sim.ball.y)) {
            tx = sim.ball.x;
            ty = sim.ball.y;
          }
          if (sim.holder < 0 && sim.ball.to && sim.ball.to.s === s && sim.ball.to.i === i) {
            tx = sim.ball.tx;
            ty = sim.ball.ty;
          }
          const dx = tx - p.x;
          const dy = ty - p.y;
          const d2 = Math.hypot(dx, dy);
          if (d2 > 0.1) {
            const spd = Math.min(p.sp, d2 * 3.5);
            p.x += (dx / d2) * spd * dt;
            p.y += (dy / d2) * spd * dt;
          }
        });
      }
    }

    function draw() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Pitch background
      ctx.fillStyle = '#143825';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Lawn stripes
      ctx.fillStyle = 'rgba(255,255,255,0.025)';
      const stripes = 10;
      for (let i = 0; i < stripes; i += 2) {
        ctx.fillRect((i / stripes) * canvas.width, 0, (canvas.width / stripes), canvas.height);
      }

      // Pitch lines
      ctx.strokeStyle = 'rgba(237, 241, 232, 0.45)';
      ctx.lineWidth = 2 * (K / 10);

      // Outline
      ctx.strokeRect(3 * K, 3 * K, 99 * K, 62 * K);

      // Halfway line & center circle
      ctx.beginPath();
      ctx.moveTo(52.5 * K, 3 * K);
      ctx.lineTo(52.5 * K, 65 * K);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(52.5 * K, 34 * K, 9.15 * K, 0, Math.PI * 2);
      ctx.stroke();

      // Center dot
      ctx.fillStyle = 'rgba(237, 241, 232, 0.6)';
      ctx.beginPath();
      ctx.arc(52.5 * K, 34 * K, 0.8 * K, 0, Math.PI * 2);
      ctx.fill();

      // Penalty boxes
      ctx.strokeRect(3 * K, 17.5 * K, 16.5 * K, 33 * K);
      ctx.strokeRect(85.5 * K, 17.5 * K, 16.5 * K, 33 * K);

      // Goal boxes
      ctx.strokeRect(3 * K, 24.8 * K, 5.5 * K, 18.4 * K);
      ctx.strokeRect(96.5 * K, 24.8 * K, 5.5 * K, 18.4 * K);

      // Goals
      ctx.strokeRect(0.5 * K, 30.3 * K, 2.5 * K, 7.4 * K);
      ctx.strokeRect(102 * K, 30.3 * K, 2.5 * K, 7.4 * K);

      const sim = simRef.current;

      // Draw players
      for (let s = 0; s < 2; s++) {
        sim.teams[s].forEach((p) => {
          ctx.save();
          // Shadow
          ctx.fillStyle = 'rgba(0,0,0,0.3)';
          ctx.beginPath();
          ctx.ellipse(p.x * K, (p.y + 0.8) * K, 1.6 * K, 0.8 * K, 0, 0, Math.PI * 2);
          ctx.fill();

          // Jersey circle
          ctx.fillStyle = COL[s];
          ctx.beginPath();
          ctx.arc(p.x * K, p.y * K, 1.8 * K, 0, Math.PI * 2);
          ctx.fill();

          // Border
          ctx.strokeStyle = INK[s];
          ctx.lineWidth = 1.2;
          ctx.stroke();

          // Player number
          ctx.fillStyle = INK[s];
          ctx.font = `bold ${Math.round(1.5 * K)}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(p.n), p.x * K, p.y * K);
          ctx.restore();
        });
      }

      // Draw ball
      ctx.save();
      const bx = sim.ball.x * K;
      const by = (sim.ball.y - sim.ball.z) * K;
      const bShadowY = sim.ball.y * K;

      // Ball shadow
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.beginPath();
      ctx.ellipse(bx, bShadowY, 1.2 * K, 0.6 * K, 0, 0, Math.PI * 2);
      ctx.fill();

      // Ball body
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(bx, by, 1.2 * K, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#222222';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    }

    const loop = (now: number) => {
      const dt = Math.min(0.08, (now - lastTime) / 1000) * speed;
      lastTime = now;

      if (isPlaying) {
        step(dt);
      }
      draw();
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isPlaying, speed, t]);

  return (
    <div style={{ maxWidth: '900px', margin: '20px auto', padding: '0 16px', width: '100%' }}>
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '28px', color: 'var(--chalk)', textTransform: 'uppercase' }}>
          {t('pitch_title')}
        </h2>
        <p style={{ color: 'var(--mist)', fontSize: '14px', marginTop: '4px' }}>
          {t('pitch_subtitle')}
        </p>
      </div>

      <figure className="match-figure">
        <div className="match-board">
          <div className="team">
            <span className="team-dot" style={{ backgroundColor: '#ffb21e' }} />
            <span>{t('team_a')}</span>
          </div>

          <div className="score">
            {score[0]} - {score[1]}
          </div>

          <div className="team">
            <span>{t('team_b')}</span>
            <span className="team-dot" style={{ backgroundColor: '#66b9ff' }} />
          </div>
        </div>

        <canvas
          ref={canvasRef}
          width={1050}
          height={680}
          className="pitch-canvas"
          style={{ width: '100%', height: 'auto', display: 'block' }}
        />

        <div className="match-commentary">
          <span className="commentary-min">{minute}'</span>
          <span style={{ fontWeight: 600 }}>{commentary}</span>
        </div>
      </figure>

      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '12px',
          marginTop: '16px',
          alignItems: 'center',
        }}
      >
        <button
          type="button"
          className="btn"
          onClick={() => setIsPlaying(!isPlaying)}
        >
          {isPlaying ? <Pause size={16} /> : <Play size={16} />}
          <span>{isPlaying ? t('pitch_pause') : t('pitch_resume')}</span>
        </button>

        <button
          type="button"
          className="btn"
          onClick={resetMatch}
        >
          <RotateCcw size={16} />
          <span>{t('pitch_reset')}</span>
        </button>

        <button
          type="button"
          className={`btn ${speed > 1 ? 'pri' : ''}`}
          onClick={() => setSpeed(speed === 1 ? 2 : 1)}
        >
          <FastForward size={16} />
          <span>{speed}x Velocidad</span>
        </button>
      </div>
    </div>
  );
};
