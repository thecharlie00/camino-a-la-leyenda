import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { Play, Pause, RotateCcw, FastForward, Camera, Eye, Video } from 'lucide-react';
import { Language } from '../types';
import { getTranslation } from '../translations';

interface Pitch3DProps {
  lang: Language;
}

const KIT_PATTERNS = [
  ['pinstripe', 'kit_pinstripe'], ['hoops', 'kit_hoops'], ['sash', 'kit_sash'], ['retro', 'kit_retro'], ['diamond', 'kit_diamond'],
  ['split', 'kit_split'], ['chevron', 'kit_chevron'], ['checker', 'kit_checker'], ['pixel', 'kit_pixel'], ['lightning', 'kit_lightning'],
  ['gradient', 'kit_gradient'], ['star', 'kit_star'], ['triangles', 'kit_triangles'],
] as const;
const KIT_PALETTES = [
  ['Cobalto', '#1957d2', '#f6f4ec', '#10264b'], ['Coral', '#ef604d', '#fff3e6', '#282328'], ['Esmeralda', '#078453', '#f4f0dc', '#123d31'],
  ['Violeta', '#7042bb', '#f7e8c4', '#30234b'], ['Ámbar', '#d99800', '#18232c', '#22252a'], ['Carbón', '#20252b', '#f4f1e8', '#111418'],
  ['Turquesa', '#03a6a6', '#f2f5ee', '#12434d'], ['Cereza', '#ae1931', '#fff5e9', '#351d28'], ['Marino', '#152a50', '#e8c35a', '#111a2c'],
  ['Lima', '#82b315', '#101c22', '#203229'], ['Rosa', '#e14682', '#fff2ea', '#3a2130'], ['Naranja', '#f07623', '#17212a', '#303038'],
  ['Hielo', '#c7e8f3', '#103d5a', '#14334a'], ['Arena', '#c4a26b', '#2f2520', '#312820'], ['Magenta', '#b425a0', '#fff3ed', '#34213e'],
  ['Azul eléctrico', '#126bff', '#f4f4ef', '#171b26'], ['Escarlata', '#df2e36', '#111923', '#20222b'], ['Oliva', '#5c7040', '#f1e8d4', '#252b24'],
  ['Plata', '#989fa9', '#152330', '#242832'], ['Dorado', '#d0a439', '#20191a', '#2b2421'],
] as const;
const COACH_PALETTES = [
  {name: 'Grafito', top: '#26333d', trim: '#e8c35a', trousers: '#192027'}, {name: 'Marino', top: '#12294b', trim: '#f1f2e8', trousers: '#172130'},
  {name: 'Esmeralda', top: '#08734c', trim: '#e6d9a4', trousers: '#202c2a'}, {name: 'Borgoña', top: '#77283b', trim: '#f3eadd', trousers: '#27232a'},
  {name: 'Azul cielo', top: '#298db4', trim: '#f3f0dc', trousers: '#183245'}, {name: 'Arena', top: '#bca36a', trim: '#35291f', trousers: '#302820'},
  {name: 'Violeta', top: '#6743a0', trim: '#f5e8c6', trousers: '#282338'}, {name: 'Rojo', top: '#c9363a', trim: '#202832', trousers: '#20232a'},
  {name: 'Lima', top: '#8aa82b', trim: '#15252a', trousers: '#252e28'}, {name: 'Negro y oro', top: '#171a1c', trim: '#d5a83a', trousers: '#111417'},
] as const;
const BOOT_MODELS = [['stud', 'gear_boot_studs'], ['speed', 'gear_boot_speed'], ['classic', 'gear_boot_classic'], ['gold', 'gear_boot_gold']] as const;
const SLEEVE_MODELS = [['short', 'gear_sleeve_short'], ['long', 'gear_sleeve_long'], ['thermal', 'gear_sleeve_thermal']] as const;
const BAND_MODELS = [['none', 'gear_band_none'], ['head', 'gear_band_head'], ['captain', 'gear_band_captain'], ['wrist', 'gear_band_wrist']] as const;
const GLOVE_MODELS = [['classic', 'gear_glove_classic'], ['neon', 'gear_glove_neon'], ['padded', 'gear_glove_padded']] as const;
const COACH_ACCESSORIES = [['none', 'gear_coach_none'], ['cap', 'gear_coach_cap'], ['headset', 'gear_coach_headset'], ['whistle', 'gear_coach_whistle'], ['clipboard', 'gear_coach_clipboard']] as const;

export const Pitch3DSimulator: React.FC<Pitch3DProps> = ({ lang }) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [speed, setSpeed] = useState<number>(1);
  const [minute, setMinute] = useState<number>(1);
  const [score, setScore] = useState<[number, number]>([0, 0]);
  const [commentary, setCommentary] = useState<string>('');
  const [cameraMode, setCameraMode] = useState<'broadcast' | 'tactical' | 'goal'>('broadcast');
  const [kitStyle, setKitStyle] = useState<string>('pinstripe');
  const [kitPaletteIndex, setKitPaletteIndex] = useState<number>(0);
  const [bootModel, setBootModel] = useState<string>('stud');
  const [sleeveModel, setSleeveModel] = useState<string>('short');
  const [bandModel, setBandModel] = useState<string>('none');
  const [gloveModel, setGloveModel] = useState<string>('classic');
  const [coachWear, setCoachWear] = useState<'tracksuit' | 'blazer' | 'polo' | 'raincoat'>('tracksuit');
  const [coachAccessory, setCoachAccessory] = useState<string>('none');
  const [coachPaletteIndex, setCoachPaletteIndex] = useState<number>(0);

  const t = useCallback((k: string, p?: Record<string, string | number>) => getTranslation(lang, k, p), [lang]);

  // Simulation state
  const simRef = useRef({
    clock: 0,
    minute: 1,
    goals: [0, 0] as [number, number],
    own: 0,
    holder: 9,
    nextAt: 0,
    pause: 0,
    shot: null as null | { s: number; goal: boolean; who: string },
    ball: { x: 0, z: 0, y: 0.35, fx: 0, fz: 0, tx: 0, tz: 0, t: 1, d: 1, h: 0, to: null as any },
    teams: [[], []] as Array<Array<{
      x: number;
      z: number;
      rot: number;
      hx: number;
      hz: number;
      sp: number;
      n: number;
      ph: number;
      legPhase: number;
    }>>,
  });

  const NAMES = [
    ['Ribas', 'Lozano', 'Teo', 'Barro', 'Quique', 'Moya', 'Iker', 'Saúl', 'Pino', 'Nando', 'Cuesta'],
    ['Ferro', 'Abel', 'Garrido', 'Nuño', 'Ruiz', 'Calvo', 'Duarte', 'Mateo', 'Rivas', 'Ortega', 'Vidal'],
  ];

  // Pitch coordinates centered at (0, 0), length 105 (-52.5 to 52.5), width 68 (-34 to 34)
  const FORMATIONS = [
    [-48, 0],   // GK
    [-30, -22], [-32, -8], [-32, 8], [-30, 22], // DEF
    [-12, -14], [-15, 0], [-12, 14],            // MID
    [5, -20],   [12, 0],  [5, 20],              // FWD
  ];

  const resetMatch = useCallback(() => {
    const sim = simRef.current;
    sim.clock = 0;
    sim.minute = 1;
    sim.goals = [0, 0];
    sim.own = 0;
    sim.holder = 9;
    sim.nextAt = 0;
    sim.pause = 0;
    sim.shot = null;
    sim.ball = { x: 0, z: 0, y: 0.35, fx: 0, fz: 0, tx: 0, tz: 0, t: 1, d: 1, h: 0, to: null };
    sim.teams = [[], []];

    for (let s = 0; s < 2; s++) {
      for (let i = 0; i < 11; i++) {
        const x = s ? -FORMATIONS[i][0] : FORMATIONS[i][0];
        const z = s ? -FORMATIONS[i][1] : FORMATIONS[i][1];
        sim.teams[s].push({
          x,
          z,
          rot: s ? Math.PI : 0,
          hx: x,
          hz: z,
          sp: 6.5 + Math.random() * 2,
          n: i + 1,
          ph: Math.random() * 6,
          legPhase: 0,
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

  // Three.js 3D Match Engine
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = Math.round(width * 0.58);

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x081318);
    scene.fog = new THREE.FogExp2(0x081318, 0.007);

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.5, 300);
    camera.position.set(0, 24, -36);
    camera.lookAt(0, 0, 0);

    // WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    container.replaceChildren(renderer.domElement);

    // --- Lighting ---
    const ambientLight = new THREE.AmbientLight(0x88aacc, 0.65);
    scene.add(ambientLight);

    // Main stadium directional floodlight
    const floodlight = new THREE.DirectionalLight(0xffeedd, 1.4);
    floodlight.position.set(20, 45, -30);
    floodlight.castShadow = true;
    floodlight.shadow.mapSize.width = 1024;
    floodlight.shadow.mapSize.height = 1024;
    floodlight.shadow.camera.near = 10;
    floodlight.shadow.camera.far = 120;
    const d = 45;
    floodlight.shadow.camera.left = -d;
    floodlight.shadow.camera.right = d;
    floodlight.shadow.camera.top = d;
    floodlight.shadow.camera.bottom = -d;
    floodlight.shadow.bias = -0.0005;
    scene.add(floodlight);

    // Rim light from opposite stand
    const rimLight = new THREE.DirectionalLight(0x6699ff, 0.4);
    rimLight.position.set(-20, 25, 35);
    scene.add(rimLight);

    // --- Stadium & Pitch Construction ---
    // Outer grass border
    const outerPitchGeo = new THREE.PlaneGeometry(120, 80);
    const outerPitchMat = new THREE.MeshStandardMaterial({ color: 0x0f2a1b, roughness: 0.9 });
    const outerPitch = new THREE.Mesh(outerPitchGeo, outerPitchMat);
    outerPitch.rotation.x = -Math.PI / 2;
    outerPitch.receiveShadow = true;
    scene.add(outerPitch);

    // Play pitch field stripes (105m x 68m)
    const pitchGroup = new THREE.Group();
    const stripeCount = 10;
    const stripeWidth = 105 / stripeCount;
    for (let i = 0; i < stripeCount; i++) {
      const stripeGeo = new THREE.PlaneGeometry(stripeWidth, 68);
      const stripeColor = i % 2 === 0 ? 0x184d28 : 0x144021;
      const stripeMat = new THREE.MeshStandardMaterial({ color: stripeColor, roughness: 0.85 });
      const stripeMesh = new THREE.Mesh(stripeGeo, stripeMat);
      stripeMesh.rotation.x = -Math.PI / 2;
      stripeMesh.position.set(-52.5 + stripeWidth * (i + 0.5), 0.02, 0);
      stripeMesh.receiveShadow = true;
      pitchGroup.add(stripeMesh);
    }
    scene.add(pitchGroup);

    // Pitch Line Markings
    const linesGroup = new THREE.Group();
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xedf1e8 });

    function createLine(w: number, h: number, x: number, z: number) {
      const g = new THREE.PlaneGeometry(w, h);
      const m = new THREE.Mesh(g, lineMat);
      m.rotation.x = -Math.PI / 2;
      m.position.set(x, 0.04, z);
      linesGroup.add(m);
    }

    // Touchlines and Goal lines (perimeter)
    createLine(105, 0.22, 0, -34);
    createLine(105, 0.22, 0, 34);
    createLine(0.22, 68, -52.5, 0);
    createLine(0.22, 68, 52.5, 0);

    // Halfway line
    createLine(0.22, 68, 0, 0);

    // Center circle
    const centerCircleGeo = new THREE.RingGeometry(9.1, 9.32, 48);
    const centerCircle = new THREE.Mesh(centerCircleGeo, lineMat);
    centerCircle.rotation.x = -Math.PI / 2;
    centerCircle.position.set(0, 0.04, 0);
    linesGroup.add(centerCircle);

    // Penalty boxes (16.5m depth, 40.3m width)
    const penaltyBoxWidth = 40.3;
    const penaltyBoxDepth = 16.5;
    // Left penalty box
    createLine(penaltyBoxDepth, 0.22, -52.5 + penaltyBoxDepth / 2, -penaltyBoxWidth / 2);
    createLine(penaltyBoxDepth, 0.22, -52.5 + penaltyBoxDepth / 2, penaltyBoxWidth / 2);
    createLine(0.22, penaltyBoxWidth, -52.5 + penaltyBoxDepth, 0);
    // Right penalty box
    createLine(penaltyBoxDepth, 0.22, 52.5 - penaltyBoxDepth / 2, -penaltyBoxWidth / 2);
    createLine(penaltyBoxDepth, 0.22, 52.5 - penaltyBoxDepth / 2, penaltyBoxWidth / 2);
    createLine(0.22, penaltyBoxWidth, 52.5 - penaltyBoxDepth, 0);

    scene.add(linesGroup);

    // 3D Goals with white posts and nets
    function createGoal(x: number, isLeft: boolean) {
      const goalGroup = new THREE.Group();
      const postMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
      const postRadius = 0.12;
      const goalHeight = 2.44;
      const goalWidth = 7.32;
      const goalDepth = 2.2;

      // Vertical posts
      const postGeo = new THREE.CylinderGeometry(postRadius, postRadius, goalHeight);
      const post1 = new THREE.Mesh(postGeo, postMat);
      post1.position.set(0, goalHeight / 2, -goalWidth / 2);
      post1.castShadow = true;
      const post2 = new THREE.Mesh(postGeo, postMat);
      post2.position.set(0, goalHeight / 2, goalWidth / 2);
      post2.castShadow = true;
      goalGroup.add(post1, post2);

      // Crossbar
      const barGeo = new THREE.CylinderGeometry(postRadius, postRadius, goalWidth);
      const crossbar = new THREE.Mesh(barGeo, postMat);
      crossbar.rotation.x = Math.PI / 2;
      crossbar.position.set(0, goalHeight, 0);
      crossbar.castShadow = true;
      goalGroup.add(crossbar);

      // Net backing
      const netMat = new THREE.MeshBasicMaterial({
        color: 0xcccccc,
        wireframe: true,
        transparent: true,
        opacity: 0.45,
      });
      const netBox = new THREE.BoxGeometry(goalDepth, goalHeight, goalWidth);
      const netMesh = new THREE.Mesh(netBox, netMat);
      netMesh.position.set(isLeft ? -goalDepth / 2 : goalDepth / 2, goalHeight / 2, 0);
      goalGroup.add(netMesh);

      goalGroup.position.set(x, 0, 0);
      return goalGroup;
    }

    scene.add(createGoal(-52.5, true));
    scene.add(createGoal(52.5, false));

    // Stadium surrounding stands
    const stadiumGroup = new THREE.Group();
    const standMat = new THREE.MeshStandardMaterial({ color: 0x18242b, roughness: 0.9 });
    const standGeo = new THREE.BoxGeometry(130, 8, 12);
    const standNorth = new THREE.Mesh(standGeo, standMat);
    standNorth.position.set(0, 4, 46);
    const standSouth = new THREE.Mesh(standGeo, standMat);
    standSouth.position.set(0, 4, -46);
    stadiumGroup.add(standNorth, standSouth);
    scene.add(stadiumGroup);

    // --- 3D Ball ---
    const ballGeo = new THREE.SphereGeometry(0.35, 16, 16);
    const ballMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.25,
      metalness: 0.1,
    });
    const ballMesh = new THREE.Mesh(ballGeo, ballMat);
    ballMesh.castShadow = true;
    ballMesh.position.set(0, 0.35, 0);
    scene.add(ballMesh);

    // Ball fake shadow blob on ground
    const shadowGeo = new THREE.CircleGeometry(0.36, 16);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.4,
    });
    const ballShadow = new THREE.Mesh(shadowGeo, shadowMat);
    ballShadow.rotation.x = -Math.PI / 2;
    ballShadow.position.y = 0.045;
    scene.add(ballShadow);

    // --- 3D Players ---
    const selectedKit = KIT_PALETTES[kitPaletteIndex] || KIT_PALETTES[0];
    const asColor = (hex: string) => parseInt(hex.slice(1), 16);
    const teamColors = [asColor(selectedKit[1]), asColor(selectedKit[2])];
    const shortsColors = [asColor(selectedKit[3]), asColor(selectedKit[3])];
    const gkColors = [0x32cd32, 0xff007f];

    const playerMeshes: Array<Array<THREE.Group>> = [[], []];

    const jerseyTexture = (base: number, accent: number) => {
      const canvas = document.createElement('canvas');
      canvas.width = 256; canvas.height = 256;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      const color = (n: number) => `#${n.toString(16).padStart(6, '0')}`;
      ctx.fillStyle = color(base); ctx.fillRect(0, 0, 256, 256);
      ctx.fillStyle = color(accent);
      if (kitStyle === 'pinstripe') {
        for (let x = 0; x < 256; x += 48) ctx.fillRect(x, 0, 13, 256);
      } else if (kitStyle === 'hoops') {
        for (let y = 20; y < 256; y += 64) ctx.fillRect(0, y, 256, 20);
      } else if (kitStyle === 'sash') {
        ctx.beginPath(); ctx.moveTo(24, 0); ctx.lineTo(80, 0); ctx.lineTo(232, 256); ctx.lineTo(176, 256); ctx.closePath(); ctx.fill();
      } else if (kitStyle === 'retro') {
        ctx.fillRect(0, 0, 256, 18); ctx.fillRect(0, 238, 256, 18); ctx.fillRect(92, 0, 72, 30);
      } else if (kitStyle === 'diamond') {
        for (let x = 0; x < 256; x += 42) for (let y = 0; y < 256; y += 60) { ctx.beginPath(); ctx.moveTo(x + 21, y); ctx.lineTo(x + 42, y + 30); ctx.lineTo(x + 21, y + 60); ctx.lineTo(x, y + 30); ctx.closePath(); ctx.fill(); }
      } else if (kitStyle === 'split') {
        ctx.fillRect(128, 0, 128, 256);
      } else if (kitStyle === 'chevron') {
        for (let y = 16; y < 256; y += 64) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(128, y + 32); ctx.lineTo(256, y); ctx.lineTo(256, y + 22); ctx.lineTo(128, y + 54); ctx.lineTo(0, y + 22); ctx.closePath(); ctx.fill(); }
      } else if (kitStyle === 'checker' || kitStyle === 'pixel') {
        const cell = kitStyle === 'checker' ? 42 : 24;
        for (let x = 0; x < 256; x += cell * 2) for (let y = 0; y < 256; y += cell * 2) { ctx.fillRect(x, y, cell, cell); ctx.fillRect(x + cell, y + cell, cell, cell); }
      } else if (kitStyle === 'lightning') {
        ctx.beginPath(); ctx.moveTo(145, 0); ctx.lineTo(90, 115); ctx.lineTo(135, 115); ctx.lineTo(84, 256); ctx.lineTo(190, 95); ctx.lineTo(143, 95); ctx.closePath(); ctx.fill();
      } else if (kitStyle === 'gradient') {
        const gradient = ctx.createLinearGradient(0, 0, 0, 256); gradient.addColorStop(0, color(accent)); gradient.addColorStop(1, color(base)); ctx.fillStyle = gradient; ctx.fillRect(0, 0, 256, 256);
      } else if (kitStyle === 'star') {
        ctx.font = 'bold 42px sans-serif'; ctx.textAlign = 'center'; for (let x = 24; x < 256; x += 64) for (let y = 44; y < 256; y += 84) ctx.fillText('★', x, y);
      } else if (kitStyle === 'triangles') {
        for (let x = 0; x < 256; x += 52) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 52, 128); ctx.lineTo(x, 256); ctx.closePath(); ctx.fill(); }
      } else {
        ctx.fillRect(0, 0, 256, 12); ctx.fillRect(0, 244, 256, 12);
      }
      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      return texture;
    };
    const jerseyMaps = [
      jerseyTexture(teamColors[0], teamColors[1]), jerseyTexture(teamColors[1], teamColors[0]),
      jerseyTexture(gkColors[0], teamColors[1]), jerseyTexture(gkColors[1], teamColors[0]),
    ];

    // Staff wear a full, selectable 3D sideline outfit rather than a floating marker.
    const selectedCoachPalette = COACH_PALETTES[coachPaletteIndex] || COACH_PALETTES[0];
    const coachColors = {top: asColor(selectedCoachPalette.top), trim: asColor(selectedCoachPalette.trim), trousers: asColor(selectedCoachPalette.trousers)};
    for (let side = 0; side < 2; side++) {
      const coach = new THREE.Group();
      const skin = new THREE.MeshStandardMaterial({color: 0xc58f6b, roughness: 0.78});
      const jacket = new THREE.MeshStandardMaterial({color: coachColors.top, roughness: 0.72});
      const detail = new THREE.MeshStandardMaterial({color: coachColors.trim, roughness: 0.65});
      const trousers = new THREE.MeshStandardMaterial({color: coachColors.trousers, roughness: 0.8});
      const shoe = new THREE.MeshStandardMaterial({color: 0x111519, roughness: 0.62});
      const torso = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.78, 0.34), jacket);
      torso.position.y = 1.12; torso.castShadow = true; coach.add(torso);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 10), skin);
      head.position.y = 1.72; head.castShadow = true; coach.add(head);
      const legs = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.6, 0.28), trousers);
      legs.position.y = 0.42; legs.castShadow = true; coach.add(legs);
      [-1, 1].forEach((dir) => {
        const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.58, 8), jacket);
        arm.position.set(dir * 0.42, 1.08, 0); arm.rotation.z = dir * -0.12; arm.castShadow = true; coach.add(arm);
        const foot = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.1, 0.34), shoe);
        foot.position.set(dir * 0.14, 0.08, 0.06); foot.castShadow = true; coach.add(foot);
      });
      if (coachWear === 'blazer') {
        const shirt = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.63, 0.025), detail);
        shirt.position.set(0, 1.14, 0.18); coach.add(shirt);
        const tie = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.34, 0.03), new THREE.MeshStandardMaterial({color: 0xa43a3a}));
        tie.position.set(0, 1.04, 0.205); coach.add(tie);
      } else if (coachWear === 'tracksuit' || coachWear === 'raincoat') {
        const zip = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.67, 0.025), detail);
        zip.position.set(0, 1.13, 0.18); coach.add(zip);
      } else {
        const collar = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.08, 0.04), detail);
        collar.position.set(0, 1.46, 0.18); coach.add(collar);
      }
      // Accesorios 3D de entrenador: cabeza, comunicación y material de banquillo.
      if (coachAccessory === 'cap') {
        const crown = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.52), detail);
        crown.position.set(0, 1.88, 0); crown.castShadow = true; coach.add(crown);
        const brim = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.035, 0.2), detail);
        brim.position.set(0, 1.83, 0.16); coach.add(brim);
      } else if (coachAccessory === 'headset') {
        const earCupMat = new THREE.MeshStandardMaterial({color: 0x171d20, roughness: 0.45, metalness: 0.18});
        [-1, 1].forEach((dir) => {
          const cup = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.16, 0.12), earCupMat);
          cup.position.set(dir * 0.2, 1.7, 0.02); cup.castShadow = true; coach.add(cup);
        });
        const mic = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.22, 6), earCupMat);
        mic.position.set(-0.13, 1.62, 0.12); mic.rotation.z = -0.8; coach.add(mic);
      } else if (coachAccessory === 'whistle') {
        const cord = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.012, 5, 16, Math.PI), detail);
        cord.position.set(0, 1.36, 0.19); cord.rotation.z = Math.PI; coach.add(cord);
        const whistle = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.1, 0.035), new THREE.MeshStandardMaterial({color: 0xd5b24b, metalness: 0.55, roughness: 0.3}));
        whistle.position.set(0, 1.2, 0.25); coach.add(whistle);
      } else if (coachAccessory === 'clipboard') {
        const board = new THREE.Mesh(new THREE.BoxGeometry(0.31, 0.42, 0.045), new THREE.MeshStandardMaterial({color: 0xa87945, roughness: 0.78}));
        board.position.set(0.34, 1.05, 0.22); board.rotation.z = -0.12; board.castShadow = true; coach.add(board);
        const paper = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.34, 0.012), new THREE.MeshStandardMaterial({color: 0xf0ead8, roughness: 0.9}));
        paper.position.set(0.34, 1.06, 0.25); paper.rotation.z = -0.12; coach.add(paper);
        const clip = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.035, 0.018), detail);
        clip.position.set(0.34, 1.25, 0.26); coach.add(clip);
      }
      coach.position.set(side === 0 ? -9 : 9, 0, side === 0 ? -35.3 : 35.3);
      coach.rotation.y = side === 0 ? 0 : Math.PI;
      scene.add(coach);
    }

    for (let s = 0; s < 2; s++) {
      for (let i = 0; i < 11; i++) {
        const playerGroup = new THREE.Group();

        const isGk = i === 0;
        const jerseyColor = isGk ? gkColors[s] : teamColors[s];

        // Torso / Jersey
        const torsoGeo = new THREE.CylinderGeometry(0.35, 0.3, 0.85, 10);
        const pattern = jerseyMaps[s + (isGk ? 2 : 0)];
        const torsoMat = new THREE.MeshStandardMaterial({ color: pattern ? 0xffffff : jerseyColor, map: pattern || undefined, roughness: 0.6 });
        const torso = new THREE.Mesh(torsoGeo, torsoMat);
        torso.position.y = 1.15;
        torso.castShadow = true;
        playerGroup.add(torso);

        // Categoría «mangas»: cada opción construye una manga/capa 3D distinta.
        const sleeveLength = sleeveModel === 'short' ? 0.4 : 0.52;
        const sleeveColor = sleeveModel === 'thermal' ? 0x171d20 : jerseyColor;
        const sleeveMat = new THREE.MeshStandardMaterial({color: sleeveColor, roughness: 0.65});
        const armGeo = new THREE.CylinderGeometry(0.09, 0.08, sleeveLength, 8);
        const accessoryTrim = new THREE.MeshStandardMaterial({color: asColor(selectedKit[2]), roughness: 0.58});
        [-1, 1].forEach((dir) => {
          const arm = new THREE.Mesh(armGeo, sleeveMat);
          arm.position.set(dir * 0.34, sleeveModel === 'short' ? 1.13 : 1.08, 0); arm.rotation.z = dir * -0.16; arm.castShadow = true; playerGroup.add(arm);
          const hand = new THREE.Mesh(new THREE.SphereGeometry(0.085, 8, 6), new THREE.MeshStandardMaterial({color: isGk ? (s === 0 ? teamColors[1] : teamColors[0]) : 0xd4a373, roughness: 0.8}));
          hand.position.set(dir * 0.39, 0.88, 0); playerGroup.add(hand);
          if (isGk) {
            const gloveColor = gloveModel === 'neon' ? 0xb8f430 : gloveModel === 'padded' ? 0x222832 : 0xf2f0e8;
            const gloveMat = new THREE.MeshStandardMaterial({color: gloveColor, roughness: 0.48, metalness: gloveModel === 'padded' ? 0.12 : 0.02});
            const palm = new THREE.Mesh(new THREE.BoxGeometry(gloveModel === 'padded' ? 0.17 : 0.14, 0.15, 0.07), gloveMat);
            palm.position.set(dir * 0.39, 0.88, 0.035); palm.castShadow = true; playerGroup.add(palm);
            for (let finger = 0; finger < 4; finger++) {
              const digit = new THREE.Mesh(new THREE.BoxGeometry(0.027, 0.075, 0.05), gloveMat);
              digit.position.set(dir * 0.39 + (finger - 1.5) * 0.033, 0.98, 0.035); playerGroup.add(digit);
            }
            const thumb = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.085, 0.05), gloveMat);
            thumb.position.set(dir * 0.39 + dir * 0.09, 0.9, 0.035); thumb.rotation.z = dir * 0.55; playerGroup.add(thumb);
            const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.085, 0.09, 8), accessoryTrim);
            cuff.position.set(dir * 0.37, 0.96, 0); cuff.rotation.z = Math.PI / 2; playerGroup.add(cuff);
          }
          if (sleeveModel !== 'short') {
            const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.084, 0.084, 0.055, 8), accessoryTrim);
            cuff.position.set(dir * 0.39, 0.88, 0); cuff.rotation.z = Math.PI / 2; cuff.castShadow = true; playerGroup.add(cuff);
          }
          if (bandModel === 'wrist') {
            const wristBand = new THREE.Mesh(new THREE.CylinderGeometry(0.092, 0.092, 0.07, 8), accessoryTrim);
            wristBand.position.set(dir * 0.36, 0.98, 0); wristBand.rotation.z = Math.PI / 2; playerGroup.add(wristBand);
          }
          if (bandModel === 'captain' && dir === -1) {
            const captainBand = new THREE.Mesh(new THREE.CylinderGeometry(0.105, 0.105, 0.075, 8), accessoryTrim);
            captainBand.position.set(dir * 0.31, 1.29, 0); captainBand.rotation.z = Math.PI / 2; playerGroup.add(captainBand);
          }
        });

        // Shorts
        const shortsGeo = new THREE.CylinderGeometry(0.32, 0.34, 0.4, 10);
        const shortsMat = new THREE.MeshStandardMaterial({ color: shortsColors[s], roughness: 0.7 });
        const shorts = new THREE.Mesh(shortsGeo, shortsMat);
        shorts.position.y = 0.65;
        shorts.castShadow = true;
        playerGroup.add(shorts);

        // Legs (left & right)
        const legGeo = new THREE.CylinderGeometry(0.1, 0.08, 0.55, 8);
        const legMat = new THREE.MeshStandardMaterial({ color: 0xd4a373, roughness: 0.8 });
        const leftLeg = new THREE.Mesh(legGeo, legMat);
        leftLeg.position.set(-0.16, 0.3, 0);
        leftLeg.castShadow = true;
        leftLeg.name = 'leftLeg';
        const rightLeg = new THREE.Mesh(legGeo, legMat);
        rightLeg.position.set(0.16, 0.3, 0);
        rightLeg.castShadow = true;
        rightLeg.name = 'rightLeg';
        playerGroup.add(leftLeg, rightLeg);
        const sockMat = new THREE.MeshStandardMaterial({color: jerseyColor, roughness: 0.7});
        const bootBaseColor = bootModel === 'gold' ? 0xd0a439 : bootModel === 'classic' ? 0x20252b : asColor(selectedKit[3]);
        const bootMat = new THREE.MeshStandardMaterial({color: bootBaseColor, roughness: bootModel === 'classic' ? 0.72 : 0.42, metalness: bootModel === 'gold' ? 0.42 : 0.04});
        const bootTrim = new THREE.MeshStandardMaterial({color: bootModel === 'gold' ? 0xffe7a0 : asColor(selectedKit[2]), roughness: 0.42, metalness: bootModel === 'gold' ? 0.36 : 0.02});
        const soleMat = new THREE.MeshStandardMaterial({color: 0x111518, roughness: 0.82});
        [-1, 1].forEach((dir) => {
          const sock = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.08, 0.24, 8), sockMat);
          sock.position.set(dir * 0.16, 0.16, 0); playerGroup.add(sock);
          const boot = new THREE.Group();
          const sole = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.035, 0.32), soleMat);
          sole.position.set(0, 0.012, 0.04); boot.add(sole);
          const upper = new THREE.Mesh(new THREE.BoxGeometry(bootModel === 'speed' ? 0.115 : 0.135, 0.075, 0.24), bootMat);
          upper.position.set(0, 0.062, 0.035); upper.castShadow = true; boot.add(upper);
          const toe = new THREE.Mesh(new THREE.SphereGeometry(0.065, 8, 6), bootMat);
          toe.scale.set(0.95, 0.72, 1.55); toe.position.set(0, 0.05, 0.13); boot.add(toe);
          if (bootModel === 'classic' || bootModel === 'gold') {
            for (let lace = 0; lace < 3; lace++) {
              const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.012, 0.012), bootTrim);
              stripe.position.set(0, 0.103, -0.035 + lace * 0.035); boot.add(stripe);
            }
          }
          if (bootModel === 'stud') {
            [-0.09, 0, 0.09].forEach((z) => {
              const stud = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.014, 0.028, 6), soleMat);
              stud.position.set(0, -0.008, z); boot.add(stud);
            });
            [-1, 1].forEach((x) => {
              const stud = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.012, 0.025, 6), soleMat);
              stud.position.set(x * 0.052, -0.008, 0.1); boot.add(stud);
            });
          } else if (bootModel === 'speed') {
            const sideStripe = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.035, 0.15), bootTrim);
            sideStripe.position.set(0.058, 0.07, 0.02); boot.add(sideStripe);
          }
          boot.position.set(dir * 0.16, 0.025, 0.08); playerGroup.add(boot);
        });

        // Head
        const headGeo = new THREE.SphereGeometry(0.24, 12, 12);
        const headMat = new THREE.MeshStandardMaterial({ color: 0xd4a373, roughness: 0.7 });
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.y = 1.8;
        head.castShadow = true;
        playerGroup.add(head);
        if (bandModel === 'head') {
          const headband = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.025, 7, 18), accessoryTrim);
          headband.rotation.x = Math.PI / 2; headband.position.set(0, 1.84, 0); headband.castShadow = true; playerGroup.add(headband);
        }

        // Player shadow blob
        const pShadow = new THREE.Mesh(shadowGeo, shadowMat);
        pShadow.rotation.x = -Math.PI / 2;
        pShadow.position.y = 0.045;
        pShadow.scale.set(1.4, 1.4, 1.4);
        playerGroup.add(pShadow);

        scene.add(playerGroup);
        playerMeshes[s].push(playerGroup);
      }
    }

    // --- Kick, Decision, and Match Logic ---
    function kickBall(tx: number, tz: number, duration: number, height: number) {
      const sim = simRef.current;
      sim.ball.fx = sim.ball.x;
      sim.ball.fz = sim.ball.z;
      sim.ball.tx = tx;
      sim.ball.tz = tz;
      sim.ball.t = 0;
      sim.ball.d = duration;
      sim.ball.h = height;
      sim.holder = -1;
    }

    function nearest(s: number, x: number, z: number, ex?: number) {
      let b = -1;
      let bd = 1e9;
      simRef.current.teams[s].forEach((p, i) => {
        if (i === ex || i === 0) return;
        const d2 = (p.x - x) * (p.x - x) + (p.z - z) * (p.z - z);
        if (d2 < bd) {
          bd = d2;
          b = i;
        }
      });
      return b;
    }

    function decide() {
      const sim = simRef.current;
      const p = sim.teams[sim.own][sim.holder];
      if (!p) return;

      const attackingLeftToRight = sim.own === 0;
      const goalX = attackingLeftToRight ? 52.5 : -52.5;
      const distToGoal = Math.abs(goalX - p.x);
      const opponentSide = 1 - sim.own;

      // Shot opportunity if inside attacking third
      if (distToGoal < 30 && Math.random() < 0.52) {
        let gz = (Math.random() - 0.5) * 6.5;
        const isGoal = Math.random() < 0.35;
        if (!isGoal && Math.random() < 0.5) {
          gz = (Math.random() < 0.5 ? -1 : 1) * (4.2 + Math.random() * 3);
        }
        sim.shot = { s: sim.own, goal: isGoal, who: NAMES[sim.own][sim.holder] };
        kickBall(goalX, gz, 0.65, 1.8 + Math.random() * 1.2);
        setCommentary(t(isGoal ? 'shot' : 'try', { n: sim.shot.who }));
        return;
      }

      // Pass search
      let best = -1;
      let bw = -1;
      sim.teams[sim.own].forEach((q, i) => {
        if (i === sim.holder || i === 0) return;
        const forwardAdvancement = attackingLeftToRight ? q.x - p.x : p.x - q.x;
        const dist = Math.hypot(q.x - p.x, q.z - p.z);
        if (dist < 8 || dist > 42) return;

        let openSpace = 99;
        sim.teams[opponentSide].forEach((o) => {
          openSpace = Math.min(openSpace, Math.hypot(o.x - q.x, o.z - q.z));
        });

        const weight = (0.6 + Math.min(openSpace, 9) / 9) * (forwardAdvancement > 0 ? 1.5 : 0.7) * (0.6 + Math.random());
        if (weight > bw) {
          bw = weight;
          best = i;
        }
      });

      if (best < 0) {
        sim.nextAt = sim.clock + 0.5;
        return;
      }

      const receiver = sim.teams[sim.own][best];
      const dist2 = Math.hypot(receiver.x - p.x, receiver.z - p.z);
      const isIntercepted = Math.random() < 0.15;
      const targetPos = {
        x: receiver.x + (attackingLeftToRight ? 1.8 : -1.8),
        z: receiver.z,
      };

      const isHighPass = dist2 > 26;
      kickBall(targetPos.x, targetPos.z, 0.3 + dist2 / 30, isHighPass ? 3.5 : 0.2);
      sim.ball.to = isIntercepted
        ? { s: opponentSide, i: nearest(opponentSide, targetPos.x, targetPos.z) }
        : { s: sim.own, i: best };
    }

    function arrive() {
      const sim = simRef.current;
      if (sim.shot) {
        const shotData = sim.shot;
        sim.shot = null;
        if (shotData.goal && Math.abs(sim.ball.tz) < 3.8) {
          sim.goals[shotData.s]++;
          setScore([sim.goals[0], sim.goals[1]]);
          setCommentary(t('goal', { n: shotData.who, t: shotData.s ? t('team_b') : t('team_a') }));
        } else {
          setCommentary(t('out'));
        }
        sim.pause = 1.6;
        sim.own = 1 - shotData.s;
        sim.holder = 0; // goalkeeper restarts
        sim.ball.x = sim.own === 0 ? -48 : 48;
        sim.ball.z = 0;
        sim.ball.y = 0.35;
        sim.nextAt = sim.clock + 1.8;
        return;
      }

      const to = sim.ball.to || { s: sim.own, i: 9 };
      if (to.s !== sim.own && NAMES[to.s] && NAMES[to.s][to.i]) {
        setCommentary(t('rec', { n: NAMES[to.s][to.i] }));
      }
      sim.own = to.s;
      sim.holder = to.i;
      sim.nextAt = sim.clock + 0.4 + Math.random() * 0.6;
    }

    // Step physics & simulation
    function stepSimulation(dt: number) {
      const sim = simRef.current;
      sim.clock += dt;

      if (sim.clock > sim.minute * 1.3 && sim.minute < 90) {
        sim.minute++;
        setMinute(sim.minute);
      }

      if (sim.minute >= 90 && sim.clock > sim.minute * 1.3 + 4) {
        sim.minute = 1;
        sim.clock = 0;
        sim.goals = [0, 0];
        setMinute(1);
        setScore([0, 0]);
        setCommentary(t('rematch'));
      }

      if (sim.pause > 0) sim.pause -= dt;

      // Ball movement
      if (sim.holder < 0) {
        sim.ball.t += dt;
        const progress = Math.min(1, sim.ball.t / sim.ball.d);
        const ease = progress * (2 - progress);
        sim.ball.x = sim.ball.fx + (sim.ball.tx - sim.ball.fx) * ease;
        sim.ball.z = sim.ball.fz + (sim.ball.tz - sim.ball.fz) * ease;
        sim.ball.y = 0.35 + 4 * sim.ball.h * progress * (1 - progress);

        if (progress >= 1) arrive();
      } else {
        const carrier = sim.teams[sim.own][sim.holder];
        if (carrier) {
          const offsetX = sim.own === 0 ? 0.8 : -0.8;
          sim.ball.x += (carrier.x + offsetX - sim.ball.x) * Math.min(1, dt * 10);
          sim.ball.z += (carrier.z - sim.ball.z) * Math.min(1, dt * 10);
          sim.ball.y = 0.35;
        }
        if (sim.clock > sim.nextAt && sim.pause <= 0) decide();
      }

      // Player tactical positioning & leg swing animation
      for (let s = 0; s < 2; s++) {
        const isAttackingTeam = s === sim.own;
        const fieldShiftX = isAttackingTeam ? (sim.ball.x) * 0.45 : (sim.ball.x) * 0.38;

        sim.teams[s].forEach((p, i) => {
          let targetX = p.hx + (i ? fieldShiftX : 0);
          let targetZ = p.hz + (sim.ball.z) * (i ? 0.35 : 0.15);

          if (i === 0) {
            // Keepers stay in goal
            targetX = s === 0 ? Math.min(Math.max(p.hx + 3, -51), -42) : Math.max(Math.min(p.hx - 3, 51), 42);
            targetZ = Math.min(Math.max(sim.ball.z * 0.25, -3.2), 3.2);
          }

          if (!isAttackingTeam && sim.holder >= 0 && i === nearest(s, sim.ball.x, sim.ball.z)) {
            // Press ball carrier
            targetX = sim.ball.x;
            targetZ = sim.ball.z;
          }

          if (sim.holder < 0 && sim.ball.to && sim.ball.to.s === s && sim.ball.to.i === i) {
            targetX = sim.ball.tx;
            targetZ = sim.ball.tz;
          }

          targetX = Math.max(-51, Math.min(51, targetX));
          targetZ = Math.max(-33, Math.min(33, targetZ));

          const dx = targetX - p.x;
          const dz = targetZ - p.z;
          const dist = Math.hypot(dx, dz);

          if (dist > 0.15) {
            const moveSpeed = Math.min(p.sp, dist * 3.8);
            p.x += (dx / dist) * moveSpeed * dt;
            p.z += (dz / dist) * moveSpeed * dt;
            p.rot = Math.atan2(dx, dz);
            p.legPhase += moveSpeed * dt * 10;
          } else {
            p.legPhase = 0;
          }
        });
      }
    }

    // Camera update according to mode
    function updateCamera(dt: number) {
      const sim = simRef.current;
      const bx = sim.ball.x;
      const bz = sim.ball.z;

      if (cameraMode === 'broadcast') {
        const targetCamX = bx * 0.82;
        const targetCamY = 22 + Math.abs(bx) * 0.05;
        const targetCamZ = -34;
        camera.position.x += (targetCamX - camera.position.x) * Math.min(1, dt * 3.5);
        camera.position.y += (targetCamY - camera.position.y) * Math.min(1, dt * 3.5);
        camera.position.z += (targetCamZ - camera.position.z) * Math.min(1, dt * 3.5);
        camera.lookAt(bx * 0.95, 1.0, bz * 0.3);
      } else if (cameraMode === 'tactical') {
        camera.position.set(0, 58, 0);
        camera.lookAt(0, 0, 0);
      } else if (cameraMode === 'goal') {
        const behindGoalX = sim.own === 0 ? 58 : -58;
        camera.position.x += (behindGoalX - camera.position.x) * Math.min(1, dt * 4);
        camera.position.y = 8;
        camera.position.z = 0;
        camera.lookAt(bx, 1.2, bz);
      }
    }

    // Animation loop
    let animId: number;
    let lastTime = performance.now();

    function render(now: number) {
      const dt = Math.min(0.06, (now - lastTime) / 1000) * speed;
      lastTime = now;

      if (isPlaying) {
        stepSimulation(dt);
      }

      // Update 3D ball
      const sim = simRef.current;
      ballMesh.position.set(sim.ball.x, sim.ball.y, sim.ball.z);
      ballShadow.position.set(sim.ball.x, 0.045, sim.ball.z);
      const shadowScale = Math.max(0.6, 1.4 - (sim.ball.y - 0.35) * 0.2);
      ballShadow.scale.set(shadowScale, shadowScale, shadowScale);

      // Update 3D players
      for (let s = 0; s < 2; s++) {
        sim.teams[s].forEach((p, i) => {
          const mesh = playerMeshes[s][i];
          if (mesh) {
            mesh.position.set(p.x, 0, p.z);
            mesh.rotation.y = p.rot;

            // Leg swing animation
            const lLeg = mesh.getObjectByName('leftLeg');
            const rLeg = mesh.getObjectByName('rightLeg');
            if (lLeg && rLeg) {
              const swing = Math.sin(p.legPhase) * 0.45;
              lLeg.rotation.x = swing;
              rLeg.rotation.x = -swing;
            }
          }
        });
      }

      updateCamera(dt);
      renderer.render(scene, camera);
      animId = requestAnimationFrame(render);
    }

    animId = requestAnimationFrame(render);

    const handleResize = () => {
      if (!container) return;
      const nw = container.clientWidth;
      const nh = Math.round(nw * 0.58);
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, [isPlaying, speed, cameraMode, kitStyle, kitPaletteIndex, bootModel, sleeveModel, bandModel, gloveModel, coachWear, coachAccessory, coachPaletteIndex, t]);

  return (
    <div style={{ maxWidth: '960px', margin: '20px auto', padding: '0 16px', width: '100%' }}>
      {/* Title */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <p className="eyebrow" style={{ color: 'var(--led)' }}>⚽ SIMULADOR DE PARTIDO EN TIEMPO REAL</p>
        <h2 style={{ fontSize: '28px', color: 'var(--chalk)', textTransform: 'uppercase', marginTop: '2px' }}>
          Simulación de Partido en 3D
        </h2>
        <p style={{ color: 'var(--mist)', fontSize: '14px', marginTop: '4px' }}>
          Motor gráfico 3D de 22 futbolistas en tiempo real con física parabólica de balón, cámaras televisivas dinámicas y gradas de estadio
        </p>
      </div>

      {/* Main 3D Match Viewer */}
      <figure className="match-figure" style={{ overflow: 'hidden', position: 'relative' }}>
        {/* Scoreboard */}
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
            <span className="team-dot" style={{ backgroundColor: '#4da8ff' }} />
          </div>
        </div>

        {/* 3D Canvas Mount Point */}
        <div
          ref={mountRef}
          style={{
            width: '100%',
            height: 'auto',
            minHeight: '380px',
            backgroundColor: '#081318',
            position: 'relative',
          }}
        />

        {/* 260 equipaciones de jugador/a y 40 conjuntos de entrenador/a */}
        <div style={{position: 'absolute', top: '56px', left: '12px', zIndex: 10, display: 'flex', gap: '6px', flexWrap: 'wrap', maxWidth: '86%'}}>
          <label style={{display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 7px', borderRadius: '8px', color: 'var(--chalk)', background: 'rgba(17,30,34,.82)', fontSize: '12px'}}>
            {t('kit_style')}<select aria-label={t('kit_style')} value={kitStyle} onChange={(e) => setKitStyle(e.target.value)} style={{maxWidth: '112px'}}>
              {KIT_PATTERNS.map(([id, key]) => <option key={id} value={id}>{t(key)}</option>)}
            </select>
          </label>
          <label style={{display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 7px', borderRadius: '8px', color: 'var(--chalk)', background: 'rgba(17,30,34,.82)', fontSize: '12px'}}>
            {t('kit_colorway')}<select aria-label={t('kit_colorway')} value={kitPaletteIndex} onChange={(e) => setKitPaletteIndex(Number(e.target.value))} style={{maxWidth: '112px'}}>
              {KIT_PALETTES.map(([name], i) => <option key={name} value={i}>{t('palette_n', {n: i + 1})} · {name}</option>)}
            </select>
          </label>
          <label style={{display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 7px', borderRadius: '8px', color: 'var(--chalk)', background: 'rgba(17,30,34,.82)', fontSize: '12px'}}>
            {t('gear_boot_category')}<select aria-label={t('gear_boot_category')} value={bootModel} onChange={(e) => setBootModel(e.target.value)} style={{maxWidth: '112px'}}>
              {BOOT_MODELS.map(([id, key]) => <option key={id} value={id}>{t(key)}</option>)}
            </select>
          </label>
          <label style={{display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 7px', borderRadius: '8px', color: 'var(--chalk)', background: 'rgba(17,30,34,.82)', fontSize: '12px'}}>
            {t('gear_sleeve_category')}<select aria-label={t('gear_sleeve_category')} value={sleeveModel} onChange={(e) => setSleeveModel(e.target.value)} style={{maxWidth: '112px'}}>
              {SLEEVE_MODELS.map(([id, key]) => <option key={id} value={id}>{t(key)}</option>)}
            </select>
          </label>
          <label style={{display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 7px', borderRadius: '8px', color: 'var(--chalk)', background: 'rgba(17,30,34,.82)', fontSize: '12px'}}>
            {t('gear_band_category')}<select aria-label={t('gear_band_category')} value={bandModel} onChange={(e) => setBandModel(e.target.value)} style={{maxWidth: '112px'}}>
              {BAND_MODELS.map(([id, key]) => <option key={id} value={id}>{t(key)}</option>)}
            </select>
          </label>
          <label style={{display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 7px', borderRadius: '8px', color: 'var(--chalk)', background: 'rgba(17,30,34,.82)', fontSize: '12px'}}>
            {t('gear_glove_category')}<select aria-label={t('gear_glove_category')} value={gloveModel} onChange={(e) => setGloveModel(e.target.value)} style={{maxWidth: '112px'}}>
              {GLOVE_MODELS.map(([id, key]) => <option key={id} value={id}>{t(key)}</option>)}
            </select>
          </label>
          <label style={{display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 7px', borderRadius: '8px', color: 'var(--chalk)', background: 'rgba(17,30,34,.82)', fontSize: '12px'}}>
            {t('coach_outfit')}<select aria-label={t('coach_outfit')} value={coachWear} onChange={(e) => setCoachWear(e.target.value as typeof coachWear)} style={{maxWidth: '112px'}}>
              <option value="tracksuit">{t('wear_tracksuit')}</option><option value="blazer">{t('wear_blazer')}</option><option value="polo">{t('wear_polo')}</option><option value="raincoat">{t('wear_raincoat')}</option>
            </select>
          </label>
          <label style={{display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 7px', borderRadius: '8px', color: 'var(--chalk)', background: 'rgba(17,30,34,.82)', fontSize: '12px'}}>
            {t('gear_coach_category')}<select aria-label={t('gear_coach_category')} value={coachAccessory} onChange={(e) => setCoachAccessory(e.target.value)} style={{maxWidth: '112px'}}>
              {COACH_ACCESSORIES.map(([id, key]) => <option key={id} value={id}>{t(key)}</option>)}
            </select>
          </label>
          <label style={{display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 7px', borderRadius: '8px', color: 'var(--chalk)', background: 'rgba(17,30,34,.82)', fontSize: '12px'}}>
            {t('coach_palette')}<select aria-label={t('coach_palette')} value={coachPaletteIndex} onChange={(e) => setCoachPaletteIndex(Number(e.target.value))} style={{maxWidth: '112px'}}>
              {COACH_PALETTES.map((palette, i) => <option key={palette.name} value={i}>{t('palette_n', {n: i + 1})} · {palette.name}</option>)}
            </select>
          </label>
        </div>

        {/* Camera angle badges floating over canvas */}
        <div
          style={{
            position: 'absolute',
            top: '56px',
            right: '12px',
            display: 'flex',
            gap: '6px',
            zIndex: 10,
          }}
        >
          <button
            type="button"
            className={`btn sm ${cameraMode === 'broadcast' ? 'pri' : ''}`}
            onClick={() => setCameraMode('broadcast')}
            title="Cámara Televisiva Broadcast"
            style={{ backdropFilter: 'blur(6px)', background: cameraMode === 'broadcast' ? undefined : 'rgba(17, 30, 34, 0.75)' }}
          >
            <Video size={13} />
            <span className="hide-s">TV</span>
          </button>
          <button
            type="button"
            className={`btn sm ${cameraMode === 'tactical' ? 'pri' : ''}`}
            onClick={() => setCameraMode('tactical')}
            title="Cámara Cenital Táctica"
            style={{ backdropFilter: 'blur(6px)', background: cameraMode === 'tactical' ? undefined : 'rgba(17, 30, 34, 0.75)' }}
          >
            <Eye size={13} />
            <span className="hide-s">Táctica</span>
          </button>
          <button
            type="button"
            className={`btn sm ${cameraMode === 'goal' ? 'pri' : ''}`}
            onClick={() => setCameraMode('goal')}
            title="Cámara Portería"
            style={{ backdropFilter: 'blur(6px)', background: cameraMode === 'goal' ? undefined : 'rgba(17, 30, 34, 0.75)' }}
          >
            <Camera size={13} />
            <span className="hide-s">Portería</span>
          </button>
        </div>

        {/* Commentary Bar */}
        <div className="match-commentary">
          <span className="commentary-min">{minute}'</span>
          <span style={{ fontWeight: 600 }}>{commentary}</span>
        </div>
      </figure>

      {/* Control Buttons */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '12px',
          marginTop: '16px',
          alignItems: 'center',
          flexWrap: 'wrap',
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
