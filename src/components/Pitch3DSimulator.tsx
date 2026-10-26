import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { Play, Pause, RotateCcw, FastForward, Camera, Eye, Video } from 'lucide-react';
import { Language } from '../types';
import { getTranslation } from '../translations';

interface Pitch3DProps {
  lang: Language;
}

export const Pitch3DSimulator: React.FC<Pitch3DProps> = ({ lang }) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [speed, setSpeed] = useState<number>(1);
  const [minute, setMinute] = useState<number>(1);
  const [score, setScore] = useState<[number, number]>([0, 0]);
  const [commentary, setCommentary] = useState<string>('');
  const [cameraMode, setCameraMode] = useState<'broadcast' | 'tactical' | 'goal'>('broadcast');

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
    const teamColors = [0xffb21e, 0x4da8ff];
    const shortsColors = [0x111e28, 0xedf1e8];
    const gkColors = [0x32cd32, 0xff007f];

    const playerMeshes: Array<Array<THREE.Group>> = [[], []];

    for (let s = 0; s < 2; s++) {
      for (let i = 0; i < 11; i++) {
        const playerGroup = new THREE.Group();

        const isGk = i === 0;
        const jerseyColor = isGk ? gkColors[s] : teamColors[s];

        // Torso / Jersey
        const torsoGeo = new THREE.CylinderGeometry(0.35, 0.3, 0.85, 10);
        const torsoMat = new THREE.MeshStandardMaterial({ color: jerseyColor, roughness: 0.6 });
        const torso = new THREE.Mesh(torsoGeo, torsoMat);
        torso.position.y = 1.15;
        torso.castShadow = true;
        playerGroup.add(torso);

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

        // Head
        const headGeo = new THREE.SphereGeometry(0.24, 12, 12);
        const headMat = new THREE.MeshStandardMaterial({ color: 0xd4a373, roughness: 0.7 });
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.y = 1.8;
        head.castShadow = true;
        playerGroup.add(head);

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
  }, [isPlaying, speed, cameraMode, t]);

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
