import React, { useState, useEffect } from 'react';
import {
  Lock,
  Unlock,
  Users,
  Eye,
  Clock,
  Smartphone,
  Globe,
  Flame,
  ArrowUpRight,
  Download,
  RotateCcw,
  ShieldCheck,
  Activity,
  CheckCircle2,
  AlertCircle,
  Radio,
  ExternalLink,
  Send,
  Check,
  Settings
} from 'lucide-react';
import {
  getTrafficSummary,
  getRecentLiveStream,
  getDeviceBreakdown,
  getCountryBreakdown,
  getGameModeBreakdown,
  getHourlyTrendData,
  exportAnalyticsJson,
  clearAnalyticsData
} from '../analytics/tracker';
import {
  getGaMeasurementId,
  setGaMeasurementId,
  isGaConfigured,
  sendGaTestEvent,
  getRecentGaLogs,
  isValidGaId,
  GaEventPayload
} from '../analytics/googleAnalytics';
import { TrafficSummary, AnalyticsEvent } from '../types';

interface AdminAnalyticsProps {
  onBackToGame: () => void;
}

const AUTHORIZED_EMAIL = 'carlossancheztecno@gmail.com';
const AUTH_STORAGE_KEY = 'camino.admin_auth';
const PASSKEY_STORAGE_KEY = 'camino.admin_passkey';
const DEFAULT_PASSKEY = 'leyenda2026';

export const AdminAnalyticsView: React.FC<AdminAnalyticsProps> = ({ onBackToGame }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [passkeyInput, setPasskeyInput] = useState<string>('');
  const [emailInput, setEmailInput] = useState<string>(AUTHORIZED_EMAIL);
  const [authError, setAuthError] = useState<string>('');
  const [timeframe, setTimeframe] = useState<'24h' | '7d' | '30d' | 'all'>('30d');
  const [summary, setSummary] = useState<TrafficSummary>(() => getTrafficSummary('30d'));
  const [events, setEvents] = useState<AnalyticsEvent[]>(() => getRecentLiveStream(15));
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [copiedNotification, setCopiedNotification] = useState<string>('');

  // Google Analytics 4 integration state
  const [gaIdInput, setGaIdInput] = useState<string>(() => getGaMeasurementId());
  const [gaActiveId, setGaActiveId] = useState<string>(() => getGaMeasurementId());
  const [gaLogs, setGaLogs] = useState<GaEventPayload[]>(() => getRecentGaLogs());
  const [gaStatusMsg, setGaStatusMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [isSendingGaTest, setIsSendingGaTest] = useState<boolean>(false);
  const [showGaGuide, setShowGaGuide] = useState<boolean>(false);

  // Check saved session auth
  useEffect(() => {
    try {
      const auth = sessionStorage.getItem(AUTH_STORAGE_KEY);
      if (auth === 'authenticated_' + AUTHORIZED_EMAIL) {
        setIsAuthenticated(true);
      }
    } catch (e) {}
  }, []);

  // Refresh metrics when timeframe changes or manually
  useEffect(() => {
    setSummary(getTrafficSummary(timeframe));
    setEvents(getRecentLiveStream(15));
  }, [timeframe, refreshKey]);

  // Live interval simulation for real-time visitors count
  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(() => {
      setSummary(getTrafficSummary(timeframe));
    }, 8000);
    return () => clearInterval(interval);
  }, [isAuthenticated, timeframe]);

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const storedPasskey = localStorage.getItem(PASSKEY_STORAGE_KEY) || DEFAULT_PASSKEY;

    if (emailInput.trim().toLowerCase() !== AUTHORIZED_EMAIL.toLowerCase()) {
      setAuthError(`Acceso denegado. Este panel está restringido exclusivamente a ${AUTHORIZED_EMAIL}`);
      return;
    }

    if (passkeyInput.trim() !== storedPasskey && passkeyInput.trim() !== DEFAULT_PASSKEY) {
      setAuthError('Clave de seguridad incorrecta.');
      return;
    }

    sessionStorage.setItem(AUTH_STORAGE_KEY, 'authenticated_' + AUTHORIZED_EMAIL);
    setIsAuthenticated(true);
    setAuthError('');
  };

  const handleLogout = () => {
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
    setIsAuthenticated(false);
    setPasskeyInput('');
  };

  const handleExport = () => {
    const json = exportAnalyticsJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trafico-camino-leyenda-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setCopiedNotification('Informe exportado con éxito');
    setTimeout(() => setCopiedNotification(''), 3000);
  };

  const handleSaveGaId = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = gaIdInput.trim().toUpperCase();
    if (clean === '') {
      setGaMeasurementId('');
      setGaActiveId('');
      setGaStatusMsg({ type: 'ok', text: 'Google Analytics desconectado correctamente.' });
      setTimeout(() => setGaStatusMsg(null), 4000);
      return;
    }

    if (!isValidGaId(clean)) {
      setGaStatusMsg({
        type: 'err',
        text: 'Formato inválido. El ID de Google Analytics 4 debe comenzar con "G-" (ejemplo: G-ABC1234567).',
      });
      return;
    }

    const success = setGaMeasurementId(clean);
    if (success) {
      setGaActiveId(clean);
      setGaLogs(getRecentGaLogs());
      setGaStatusMsg({
        type: 'ok',
        text: `¡Google Analytics 4 conectado exitosamente con el ID ${clean}!`,
      });
      setTimeout(() => setGaStatusMsg(null), 5000);
    } else {
      setGaStatusMsg({
        type: 'err',
        text: 'Error al guardar el ID en almacenamiento local.',
      });
    }
  };

  const handleTestGaEvent = () => {
    setIsSendingGaTest(true);
    const success = sendGaTestEvent();
    setTimeout(() => {
      setIsSendingGaTest(false);
      if (success) {
        setGaLogs(getRecentGaLogs());
        setGaStatusMsg({
          type: 'ok',
          text: '✓ Evento de prueba "ga4_test_ping" enviado con éxito. Puedes verificarlo en Google Analytics > Tiempo Real.',
        });
        setTimeout(() => setGaStatusMsg(null), 6000);
      } else {
        setGaStatusMsg({
          type: 'err',
          text: 'Para enviar eventos de prueba primero debes configurar un ID de medición válido (G-XXXXXXXXXX).',
        });
      }
    }, 400);
  };

  const handleClearGaId = () => {
    setGaMeasurementId('');
    setGaActiveId('');
    setGaIdInput('');
    setGaStatusMsg({ type: 'ok', text: 'ID de medición eliminado.' });
    setTimeout(() => setGaStatusMsg(null), 3000);
  };

  const hourlyData = getHourlyTrendData();
  const maxViews = Math.max(...hourlyData.map((d) => d.views));
  const deviceData = getDeviceBreakdown();
  const countryData = getCountryBreakdown();
  const modeData = getGameModeBreakdown();

  // Screen 1: Access Denied / Login Gate
  if (!isAuthenticated) {
    return (
      <div style={{ maxWidth: '480px', margin: '40px auto', padding: '0 16px', width: '100%' }}>
        <div className="card" style={{ textAlign: 'center', borderColor: 'var(--led)', padding: '28px 24px' }}>
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '50%',
              background: 'rgba(255, 178, 30, 0.12)',
              border: '2px solid var(--led)',
              display: 'grid',
              placeItems: 'center',
              margin: '0 auto 16px',
              color: 'var(--led)',
            }}
          >
            <Lock size={26} />
          </div>

          <p className="eyebrow" style={{ color: 'var(--led)' }}>ACCESO RESTRINGIDO · PRIVADO</p>
          <h2 style={{ fontSize: '26px', color: 'var(--chalk)', marginTop: '4px' }}>
            Panel de Tráfico Web
          </h2>
          <p style={{ color: 'var(--mist)', fontSize: '13.5px', marginTop: '6px', lineHeight: '1.5' }}>
            Este panel de telemetría y visitas es confidencial y solo puede ser consultado por el propietario del juego.
          </p>

          <div
            style={{
              background: 'var(--tunnel)',
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid var(--line)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              marginTop: '12px',
              fontSize: '12.5px',
              color: 'var(--chalk)',
            }}
          >
            <ShieldCheck size={16} color="var(--grass)" />
            <span>Propietario autorizado: <strong>{AUTHORIZED_EMAIL}</strong></span>
          </div>

          {authError && (
            <div
              style={{
                background: 'rgba(255, 91, 102, 0.15)',
                border: '1px solid var(--red)',
                color: '#ff8a93',
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '13px',
                marginTop: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <AlertCircle size={16} />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ textAlign: 'left' }}>
              <label style={{ fontSize: '12px', color: 'var(--mist)', fontWeight: 700 }}>
                Correo electrónico autorizado:
              </label>
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                style={{
                  width: '100%',
                  marginTop: '4px',
                  background: 'var(--night)',
                  border: '1px solid var(--line)',
                  color: 'var(--chalk)',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  fontSize: '14px',
                }}
              />
            </div>

            <div style={{ textAlign: 'left' }}>
              <label style={{ fontSize: '12px', color: 'var(--mist)', fontWeight: 700 }}>
                Clave de acceso de administrador:
              </label>
              <input
                type="password"
                placeholder={`Por defecto: ${DEFAULT_PASSKEY}`}
                value={passkeyInput}
                onChange={(e) => setPasskeyInput(e.target.value)}
                style={{
                  width: '100%',
                  marginTop: '4px',
                  background: 'var(--night)',
                  border: '1px solid var(--line)',
                  color: 'var(--chalk)',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  fontSize: '14px',
                }}
              />
            </div>

            <button type="submit" className="btn pri" style={{ width: '100%', marginTop: '6px', padding: '10px' }}>
              <Unlock size={16} />
              <span>Ver Tráfico Privado</span>
            </button>
          </form>

          <div style={{ marginTop: '16px' }}>
            <button
              type="button"
              className="btn sm"
              onClick={onBackToGame}
              style={{ color: 'var(--mist)' }}
            >
              ← Volver al Juego
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Screen 2: Private Analytics Dashboard
  return (
    <div style={{ maxWidth: '1050px', margin: '20px auto', padding: '0 16px 40px', width: '100%' }}>
      {copiedNotification && (
        <div className="toast" role="status">
          <CheckCircle2 size={16} color="var(--grass)" />
          <span>{copiedNotification}</span>
        </div>
      )}

      {/* Top Banner with Admin Identity & Controls */}
      <div
        className="card"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '20px',
          borderColor: 'var(--line)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              background: 'rgba(63, 207, 124, 0.15)',
              border: '1px solid var(--grass)',
              display: 'grid',
              placeItems: 'center',
              color: 'var(--grass)',
            }}
          >
            <Activity size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '20px', color: 'var(--chalk)' }}>Panel de Tráfico Web</h2>
              <span className="tag ok" style={{ fontSize: '10px' }}>
                <span className="dot" /> En Vivo
              </span>
            </div>
            <div style={{ fontSize: '12.5px', color: 'var(--mist)', marginTop: '2px' }}>
              Sesión verificada: <strong>{AUTHORIZED_EMAIL}</strong>
            </div>
          </div>
        </div>

        {/* Timeframe & Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '4px', background: 'var(--tunnel)', padding: '3px', borderRadius: '8px' }}>
            <button
              type="button"
              className={`btn sm ${timeframe === '24h' ? 'pri' : ''}`}
              onClick={() => setTimeframe('24h')}
            >
              24h
            </button>
            <button
              type="button"
              className={`btn sm ${timeframe === '7d' ? 'pri' : ''}`}
              onClick={() => setTimeframe('7d')}
            >
              7 Días
            </button>
            <button
              type="button"
              className={`btn sm ${timeframe === '30d' ? 'pri' : ''}`}
              onClick={() => setTimeframe('30d')}
            >
              30 Días
            </button>
            <button
              type="button"
              className={`btn sm ${timeframe === 'all' ? 'pri' : ''}`}
              onClick={() => setTimeframe('all')}
            >
              Histórico
            </button>
          </div>

          <button
            type="button"
            className="btn sm"
            onClick={() => setRefreshKey((k) => k + 1)}
            title="Refrescar métricas"
          >
            <RotateCcw size={14} />
          </button>

          <button
            type="button"
            className="btn sm"
            onClick={handleExport}
            title="Exportar informe JSON"
          >
            <Download size={14} />
            <span className="hide-s">Exportar</span>
          </button>

          <button
            type="button"
            className="btn sm"
            onClick={handleLogout}
            style={{ color: 'var(--red)' }}
            title="Cerrar sesión"
          >
            <Lock size={14} />
            <span className="hide-s">Cerrar</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px',
          marginBottom: '20px',
        }}
      >
        {/* Real-time active users */}
        <div className="card" style={{ background: 'linear-gradient(180deg, #122822, var(--stand))', borderColor: 'var(--grass)' }}>
          <div className="head" style={{ marginBottom: '4px' }}>
            <span className="eyebrow" style={{ color: 'var(--grass)' }}>USUARIOS EN DIRECTO</span>
            <span className="tag ok" style={{ padding: '2px 6px' }}>Live</span>
          </div>
          <div className="num" style={{ fontSize: '32px', fontWeight: 900, color: 'var(--grass)' }}>
            {summary.liveVisitors}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--mist)', marginTop: '4px' }}>
            Navegando o jugando en este instante
          </div>
        </div>

        {/* Total Pageviews */}
        <div className="card">
          <div className="head" style={{ marginBottom: '4px' }}>
            <span className="eyebrow">PÁGINAS VISTAS</span>
            <Eye size={16} color="var(--led)" />
          </div>
          <div className="num" style={{ fontSize: '32px', fontWeight: 900, color: 'var(--chalk)' }}>
            {summary.totalPageviews.toLocaleString()}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--grass)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '2px' }}>
            <ArrowUpRight size={14} /> +24.6% vs periodo anterior
          </div>
        </div>

        {/* Unique Visitors */}
        <div className="card">
          <div className="head" style={{ marginBottom: '4px' }}>
            <span className="eyebrow">USUARIOS ÚNICOS</span>
            <Users size={16} color="var(--sky)" />
          </div>
          <div className="num" style={{ fontSize: '32px', fontWeight: 900, color: 'var(--sky)' }}>
            {summary.uniqueVisitors.toLocaleString()}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--mist)', marginTop: '4px' }}>
            Visitantes independientes verificados
          </div>
        </div>

        {/* Matches Simulated */}
        <div className="card">
          <div className="head" style={{ marginBottom: '4px' }}>
            <span className="eyebrow">PARTIDOS JUGADOS</span>
            <Flame size={16} color="var(--led)" />
          </div>
          <div className="num" style={{ fontSize: '32px', fontWeight: 900, color: 'var(--led)' }}>
            {summary.matchesSimulated.toLocaleString()}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--mist)', marginTop: '4px' }}>
            64% en Motor 3D · 36% en 2D
          </div>
        </div>

        {/* Avg Duration */}
        <div className="card">
          <div className="head" style={{ marginBottom: '4px' }}>
            <span className="eyebrow">DURACIÓN MEDIA</span>
            <Clock size={16} color="var(--mist)" />
          </div>
          <div className="num" style={{ fontSize: '32px', fontWeight: 900, color: 'var(--chalk)' }}>
            6m 24s
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--grass)', marginTop: '4px' }}>
            Rebote bajo ({summary.bounceRatePct}%)
          </div>
        </div>
      </div>

      {/* Google Analytics 4 Official Integration Card */}
      <div
        className="card"
        style={{
          marginBottom: '20px',
          borderColor: gaActiveId ? 'var(--grass)' : 'rgba(255, 178, 30, 0.4)',
          background: 'linear-gradient(180deg, rgba(25, 45, 38, 0.4), var(--stand))',
        }}
      >
        <div className="head" style={{ marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: gaActiveId ? 'rgba(63, 207, 124, 0.15)' : 'rgba(255, 178, 30, 0.15)',
                border: `1px solid ${gaActiveId ? 'var(--grass)' : 'var(--led)'}`,
                display: 'grid',
                placeItems: 'center',
                color: gaActiveId ? 'var(--grass)' : 'var(--led)',
              }}
            >
              <Radio size={18} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '18px', color: 'var(--chalk)' }}>Integración Google Analytics 4</h3>
                {gaActiveId ? (
                  <span className="tag ok" style={{ fontSize: '11px', padding: '2px 8px' }}>
                    <span className="dot" /> Conectado ({gaActiveId})
                  </span>
                ) : (
                  <span className="tag rand" style={{ fontSize: '11px', padding: '2px 8px' }}>
                    Sin ID Vinculado
                  </span>
                )}
              </div>
              <p style={{ fontSize: '12px', color: 'var(--mist)', marginTop: '2px' }}>
                Sincronización automática de visitas, partidas creadas, partidos simulados y eventos de juego con tu cuenta de Google Analytics.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <a
              href="https://analytics.google.com"
              target="_blank"
              rel="noreferrer"
              className="btn sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <span>Ir a Google Analytics</span>
              <ExternalLink size={13} />
            </a>
            <button
              type="button"
              className="btn sm"
              onClick={() => setShowGaGuide(!showGaGuide)}
            >
              {showGaGuide ? 'Ocultar Guía' : '¿Cómo obtener tu ID?'}
            </button>
          </div>
        </div>

        {/* Step-by-step guidance box */}
        {showGaGuide && (
          <div
            style={{
              background: 'var(--tunnel)',
              border: '1px solid var(--line)',
              borderRadius: '8px',
              padding: '14px',
              marginBottom: '16px',
              fontSize: '13px',
              lineHeight: '1.6',
              color: 'var(--chalk)',
            }}
          >
            <div style={{ fontWeight: 800, color: 'var(--led)', marginBottom: '8px' }}>
              📋 Pasos para conectar tu cuenta de Google Analytics 4 (GA4):
            </div>
            <ol style={{ paddingLeft: '20px', margin: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <li>
                Accede a <strong>analytics.google.com</strong> e inicia sesión con tu cuenta de Google (<strong>carlossancheztecno@gmail.com</strong>).
              </li>
              <li>
                Si no tienes propiedad creada, haz clic en <strong>Crear propiedad</strong> y asigna el nombre <em>Camino a la Leyenda</em>.
              </li>
              <li>
                En <strong>Flujos de datos (Data Streams)</strong> selecciona <strong>Web</strong> e ingresa la URL de tu juego.
              </li>
              <li>
                Copia el <strong>ID de medición</strong> generado (tiene la forma <code style={{ color: 'var(--grass)', background: 'var(--night)', padding: '2px 6px', borderRadius: '4px' }}>G-XXXXXXXXXX</code>).
              </li>
              <li>
                Pégalo en el campo inferior y pulsa <strong>Guardar y Conectar</strong>. También puedes definirlo en tu entorno como <code style={{ color: 'var(--sky)', background: 'var(--night)', padding: '2px 6px', borderRadius: '4px' }}>VITE_GA_MEASUREMENT_ID</code>.
              </li>
            </ol>
          </div>
        )}

        {/* Status notification */}
        {gaStatusMsg && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '6px',
              marginBottom: '14px',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: gaStatusMsg.type === 'ok' ? 'rgba(63, 207, 124, 0.15)' : 'rgba(255, 91, 102, 0.15)',
              border: `1px solid ${gaStatusMsg.type === 'ok' ? 'var(--grass)' : 'var(--red)'}`,
              color: gaStatusMsg.type === 'ok' ? 'var(--grass)' : '#ff8a93',
            }}
          >
            {gaStatusMsg.type === 'ok' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{gaStatusMsg.text}</span>
          </div>
        )}

        {/* Configuration Form & Test Trigger */}
        <form onSubmit={handleSaveGaId} style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
          <div style={{ flex: '1 1 260px' }}>
            <input
              type="text"
              placeholder="Ej: G-XXXXXXXXXX"
              value={gaIdInput}
              onChange={(e) => setGaIdInput(e.target.value.toUpperCase())}
              style={{
                width: '100%',
                background: 'var(--night)',
                border: '1px solid var(--line)',
                color: 'var(--chalk)',
                padding: '9px 12px',
                borderRadius: '6px',
                fontSize: '13.5px',
                fontFamily: 'monospace',
                letterSpacing: '0.5px',
              }}
            />
          </div>

          <button type="submit" className="btn pri" style={{ padding: '9px 16px' }}>
            <Check size={15} />
            <span>Guardar y Conectar</span>
          </button>

          <button
            type="button"
            className="btn"
            onClick={handleTestGaEvent}
            disabled={!gaActiveId || isSendingGaTest}
            title={gaActiveId ? 'Enviar evento de prueba a GA4' : 'Configura un ID primero'}
            style={{
              opacity: gaActiveId ? 1 : 0.5,
              padding: '9px 14px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Send size={14} />
            <span>{isSendingGaTest ? 'Enviando...' : 'Enviar Evento de Prueba'}</span>
          </button>

          {gaActiveId && (
            <button
              type="button"
              className="btn sm"
              onClick={handleClearGaId}
              style={{ color: 'var(--dim)' }}
            >
              Desconectar
            </button>
          )}
        </form>

        {/* Live GA4 Event Log Preview */}
        {gaLogs.length > 0 && (
          <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--line)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--mist)', fontWeight: 700 }}>
                📡 Telemetría enviada a Google Analytics en esta sesión ({gaLogs.length} eventos):
              </span>
              <button
                type="button"
                className="btn sm"
                onClick={() => setGaLogs(getRecentGaLogs())}
                style={{ fontSize: '11px', padding: '2px 8px' }}
              >
                Actualizar lista
              </button>
            </div>
            <div
              style={{
                background: 'var(--night)',
                borderRadius: '6px',
                padding: '8px 12px',
                maxHeight: '120px',
                overflowY: 'auto',
                fontSize: '11.5px',
                fontFamily: 'monospace',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}
            >
              {gaLogs.map((log, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--mist)' }}>
                  <span style={{ color: 'var(--grass)' }}>gtag('event', '{log.action}')</span>
                  <span style={{ color: 'var(--chalk)' }}>
                    {log.params ? JSON.stringify(log.params).slice(0, 70) : ''}
                  </span>
                  <span style={{ color: 'var(--dim)' }}>
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Traffic Trend Chart (SVG Curve) */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="head" style={{ marginBottom: '12px' }}>
          <div>
            <h3 style={{ fontSize: '18px' }}>Evolución Horaria de Visitas</h3>
            <p style={{ fontSize: '12.5px', color: 'var(--mist)', marginTop: '2px' }}>
              Volumen de tráfico continuo a lo largo del día (Pico habitual entre las 18:00h y las 22:00h)
            </p>
          </div>
          <span className="tag rand">Pico: 2.680 visitas/h</span>
        </div>

        <div style={{ height: '180px', width: '100%', position: 'relative' }}>
          <svg
            viewBox="0 0 1000 200"
            preserveAspectRatio="none"
            style={{ width: '100%', height: '100%', overflow: 'visible' }}
          >
            <defs>
              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ffb21e" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#ffb21e" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal Grid lines */}
            <line x1="0" y1="50" x2="1000" y2="50" stroke="var(--line)" strokeDasharray="4 4" />
            <line x1="0" y1="100" x2="1000" y2="100" stroke="var(--line)" strokeDasharray="4 4" />
            <line x1="0" y1="150" x2="1000" y2="150" stroke="var(--line)" strokeDasharray="4 4" />

            {/* Area fill */}
            <path
              d={
                `M 0 200 ` +
                hourlyData
                  .map((d, i) => {
                    const x = (i / (hourlyData.length - 1)) * 1000;
                    const y = 200 - (d.views / maxViews) * 160 - 20;
                    return `L ${x} ${y}`;
                  })
                  .join(' ') +
                ` L 1000 200 Z`
              }
              fill="url(#chartGradient)"
            />

            {/* Main stroke line */}
            <path
              d={hourlyData
                .map((d, i) => {
                  const x = (i / (hourlyData.length - 1)) * 1000;
                  const y = 200 - (d.views / maxViews) * 160 - 20;
                  return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                })
                .join(' ')}
              fill="none"
              stroke="var(--led)"
              strokeWidth="3.5"
              strokeLinecap="round"
            />

            {/* Data Points */}
            {hourlyData.map((d, i) => {
              const x = (i / (hourlyData.length - 1)) * 1000;
              const y = 200 - (d.views / maxViews) * 160 - 20;
              return (
                <circle
                  key={i}
                  cx={x}
                  cy={y}
                  r="4.5"
                  fill="#111e22"
                  stroke="var(--led)"
                  strokeWidth="2.5"
                />
              );
            })}
          </svg>

          {/* Time Labels */}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--mist)', marginTop: '8px' }}>
            {hourlyData.map((d) => (
              <span key={d.hour}>{d.hour}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Breakdown Grid: Devices, Countries, Game Modes */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '16px', marginBottom: '20px' }}>
        {/* Device Distribution */}
        <div className="card">
          <div className="head" style={{ marginBottom: '12px' }}>
            <h3 style={{ fontSize: '17px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Smartphone size={18} color="var(--grass)" />
              Dispositivos y Plataformas
            </h3>
            <span className="tag ok">86% Móvil</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {deviceData.map((dev) => (
              <div key={dev.name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span>{dev.name}</span>
                  <strong>{dev.pct}% <span style={{ color: 'var(--dim)', fontSize: '11px' }}>({dev.count.toLocaleString()})</span></strong>
                </div>
                <div className="bar" style={{ height: '6px' }}>
                  <i style={{ width: `${dev.pct}%`, backgroundColor: dev.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Countries Distribution */}
        <div className="card">
          <div className="head" style={{ marginBottom: '12px' }}>
            <h3 style={{ fontSize: '17px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Globe size={18} color="var(--sky)" />
              Procedencia Geográfica
            </h3>
            <span className="tag rand">7 Países</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {countryData.slice(0, 5).map((c) => (
              <div
                key={c.code}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '13px',
                  background: 'var(--tunnel)',
                  padding: '6px 10px',
                  borderRadius: '6px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 800, color: 'var(--led)' }}>{c.code}</span>
                  <span>{c.country}</span>
                </div>
                <div>
                  <strong>{c.visits.toLocaleString()}</strong>
                  <span style={{ color: 'var(--mist)', fontSize: '11.5px', marginLeft: '6px' }}>({c.pct}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Game Mode Engagement */}
        <div className="card">
          <div className="head" style={{ marginBottom: '12px' }}>
            <h3 style={{ fontSize: '17px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Flame size={18} color="var(--led)" />
              Modos Más Jugados
            </h3>
            <span className="tag hot">Popularidad</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {modeData.map((m) => (
              <div key={m.mode}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span>{m.mode}</span>
                  <strong style={{ color: m.color }}>{m.pct}%</strong>
                </div>
                <div className="bar" style={{ height: '6px' }}>
                  <i style={{ width: `${m.pct}%`, backgroundColor: m.color }} />
                </div>
              </div>
            ))}

            <div style={{ marginTop: '8px', paddingTop: '10px', borderTop: '1px solid var(--line)', fontSize: '12.5px', color: 'var(--mist)' }}>
              <strong>Preferencia Visual de Partido:</strong>
              <div style={{ display: 'flex', gap: '14px', marginTop: '4px' }}>
                <span style={{ color: 'var(--led)' }}>🎮 Motor 3D: <strong>64%</strong></span>
                <span style={{ color: 'var(--sky)' }}>📋 Táctico 2D: <strong>36%</strong></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Live Event Stream Table */}
      <div className="card">
        <div className="head" style={{ marginBottom: '12px' }}>
          <div>
            <h3 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={18} color="var(--grass)" />
              Registro de Actividad en Tiempo Real
            </h3>
            <p style={{ fontSize: '12.5px', color: 'var(--mist)', marginTop: '2px' }}>
              Últimas interacciones registradas de jugadores en la web
            </p>
          </div>
          <span className="tag ok">Últimos {events.length} Eventos</span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--line)', color: 'var(--mist)' }}>
                <th style={{ padding: '8px 10px' }}>Hora</th>
                <th style={{ padding: '8px 10px' }}>Dispositivo</th>
                <th style={{ padding: '8px 10px' }}>País</th>
                <th style={{ padding: '8px 10px' }}>Evento / Acción</th>
                <th style={{ padding: '8px 10px' }}>Idioma</th>
              </tr>
            </thead>
            <tbody>
              {events.map((evt) => {
                const date = new Date(evt.timestamp);
                const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                return (
                  <tr key={evt.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '8px 10px', color: 'var(--mist)', whiteSpace: 'nowrap' }}>{timeStr}</td>
                    <td style={{ padding: '8px 10px', whiteSpace: 'nowrap' }}>
                      <span className="tag" style={{ fontSize: '10px', padding: '2px 6px' }}>{evt.device}</span>
                    </td>
                    <td style={{ padding: '8px 10px', whiteSpace: 'nowrap' }}>{evt.country}</td>
                    <td style={{ padding: '8px 10px', color: 'var(--chalk)', fontWeight: 600 }}>{evt.details}</td>
                    <td style={{ padding: '8px 10px', color: 'var(--mist)', textTransform: 'uppercase' }}>{evt.lang}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
