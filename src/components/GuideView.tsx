import React from 'react';
import { User, Briefcase, ShieldCheck, Flame, Compass, Heart, Award } from 'lucide-react';
import { Language } from '../types';
import { getTranslation } from '../translations';

interface GuideViewProps {
  lang: Language;
}

export const GuideView: React.FC<GuideViewProps> = ({ lang }) => {
  const t = (k: string) => getTranslation(lang, k);

  return (
    <div style={{ maxWidth: '900px', margin: '20px auto', padding: '0 16px', width: '100%' }}>
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <p className="eyebrow" style={{ color: 'var(--led)' }}>📖 {t('guide_title')}</p>
        <h1 style={{ fontSize: '36px', color: 'var(--chalk)', textTransform: 'uppercase', marginTop: '4px' }}>
          {t('guide_title')}
        </h1>
        <p style={{ color: 'var(--mist)', fontSize: '15px', maxWidth: '640px', margin: '8px auto 0' }}>
          {t('guide_subtitle')}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        {/* Jugador Mode */}
        <div className="card">
          <div className="head">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--led)' }}>
              <User size={20} />
              Carrera de Jugador/a
            </h3>
            <span className="tag rand">Individual</span>
          </div>
          <p style={{ fontSize: '14px', color: 'var(--mist)', lineHeight: '1.5' }}>
            Empiezas como una joven promesa en categorías inferiores. Cada partido cuenta: tus goles, asistencias,
            calificaciones y decisiones fuera del campo determinan tu ascenso hacia los gigantes del fútbol mundial.
          </p>
          <ul style={{ paddingLeft: '20px', fontSize: '13px', color: 'var(--chalk)', margin: '12px 0', lineHeight: '1.6' }}>
            <li><strong>Cromos y Niveles:</strong> Bronce (&lt;65), Plata (65-74), Oro (75-84) y Élite (85+).</li>
            <li><strong>Energía y Forma:</strong> Administra el cansancio para evitar lesiones inoportunas.</li>
            <li><strong>Selección Nacional:</strong> Destaca en tu club para ser convocado al Mundial y torneos continentales.</li>
            <li><strong>Vida Personal:</strong> Invierte tus primas en casas, mascotas, coches o fundaciones benéficas.</li>
          </ul>
        </div>

        {/* Manager Mode */}
        <div className="card">
          <div className="head">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--sky)' }}>
              <Briefcase size={20} />
              Carrera de Míster (DT)
            </h3>
            <span className="tag hot">Táctico</span>
          </div>
          <p style={{ fontSize: '14px', color: 'var(--mist)', lineHeight: '1.5' }}>
            Toma las riendas del vestuario como director técnico. Decide alineaciones, ajusta tácticas antes y durante
            el partido, maneja las tensiones con la directiva y gestiona las arcas del club.
          </p>
          <ul style={{ paddingLeft: '20px', fontSize: '13px', color: 'var(--chalk)', margin: '12px 0', lineHeight: '1.6' }}>
            <li><strong>Pizarra Táctica:</strong> 4-3-3 de posesión, 4-4-2 de contragolpe, 3-5-2 o muro defensivo.</li>
            <li><strong>Mercado de Fichajes:</strong> Ojea promesas, negocia traspasos y salarios ajustados al presupuesto.</li>
            <li><strong>Ruedas de Prensa:</strong> Responde a los medios cuidando la moral del vestuario y el apoyo de los hinchas.</li>
            <li><strong>Crisis y Desafíos:</strong> Salva al club del descenso o llévalo a la gloria europea.</li>
          </ul>
        </div>

        {/* Crea tu Club Mode */}
        <div className="card">
          <div className="head">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--grass)' }}>
              <ShieldCheck size={20} />
              Crea tu Club
            </h3>
            <span className="tag ok">Personalizado</span>
          </div>
          <p style={{ fontSize: '14px', color: 'var(--mist)', lineHeight: '1.5' }}>
            Funda tu propia institución deportiva desde cero. Diseña el escudo con formas y patrones únicos, elige
            los colores representativos, nombra el estadio e inscribe al equipo en el escalafón inicial de la liga elegida.
          </p>
          <ul style={{ paddingLeft: '20px', fontSize: '13px', color: 'var(--chalk)', margin: '12px 0', lineHeight: '1.6' }}>
            <li><strong>Diseño de Identidad:</strong> Escudo generativo vectorial y colores de camiseta.</li>
            <li><strong>Cantera y Fichajes:</strong> Desarrolla talento joven para mantener la sostenibilidad financiera.</li>
            <li><strong>Ascensos y Trofeos:</strong> Escala categorías hasta levantar la Champions League o Copa Libertadores.</li>
          </ul>
        </div>

        {/* Campo 2D & Penaltis */}
        <div className="card">
          <div className="head">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--gold)' }}>
              <Compass size={20} />
              Motor de Partido 2D & Penaltis
            </h3>
            <span className="tag real">Física 2D</span>
          </div>
          <p style={{ fontSize: '14px', color: 'var(--mist)', lineHeight: '1.5' }}>
            El simulador utiliza un modelo dinámico de 22 jugadores con cálculo de espacio, líneas de pase, desmarques
            al hueco y tiros parabólicos tridimensionales hacia la portería.
          </p>
          <ul style={{ paddingLeft: '20px', fontSize: '13px', color: 'var(--chalk)', margin: '12px 0', lineHeight: '1.6' }}>
            <li><strong>Tandas de Penaltis:</strong> Apunta a la escuadra y ajusta la potencia para batir al portero.</li>
            <li><strong>Intervención en Directo:</strong> En partidos clave, toma el control en ocasiones manifiestas de gol.</li>
            <li><strong>87 Ligas Parodiadas:</strong> Competiciones de España, Inglaterra, Italia, Alemania, Francia, Brasil, Argentina y más.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
