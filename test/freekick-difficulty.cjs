const assert = require('node:assert/strict');
const fs = require('node:fs');
const {JSDOM} = require('jsdom');

for (const source of ['src/minigame.js', 'legacy-game/src/minigame.js']) {
  const dom = new JSDOM('<!doctype html><html><body></body></html>', {
    runScripts: 'outside-only',
    pretendToBeVisual: true,
  });
  dom.window.eval(fs.readFileSync(source, 'utf8'));
  const game = dom.window.Minigame.freekick({skill: 75, gk: 65, dist: 22}, () => {});
  const doc = dom.window.document;
  const svg = doc.querySelector('.mg-fk svg');
  const goal = svg.getAttribute('data-goal').split(',').map(Number);
  const [gx0, gy0, gx1, gy1] = goal;
  const width = gx1 - gx0;
  const height = gy1 - gy0;
  const zone = doc.querySelector('.mg-zone');

  // The broader power band should be clearly visible, not just accepted by the scoring logic.
  assert.equal(zone.style.left, '34%', `${source} should widen the power sweet spot`);
  assert.equal(zone.style.width, '42%', `${source} should widen the power sweet spot`);

  // Mock SVG screen coordinates, then draw a high curve that finishes just outside a post.
  // That small miss should be forgiven and produce a useful shot chance instead of "wide".
  svg.getScreenCTM = () => ({inverse() { return this; }});
  svg.createSVGPoint = () => ({
    x: 0,
    y: 0,
    matrixTransform() { return {x: this.x, y: this.y}; },
  });
  svg.setPointerCapture = () => {};
  function pointer(type, x, y) {
    const event = new dom.window.Event(type, {bubbles: true, cancelable: true});
    for (const [key, value] of Object.entries({clientX: x, clientY: y, pointerId: 1})) {
      Object.defineProperty(event, key, {value});
    }
    svg.dispatchEvent(event);
  }
  const nearPost = {x: gx0 - width * 0.05, y: gy0 + height * 0.35};
  pointer('pointerdown', 180, 378);
  pointer('pointermove', 150, 115);
  pointer('pointermove', nearPost.x, nearPost.y);
  pointer('pointerup', nearPost.x, nearPost.y);

  assert.equal(doc.querySelector('.mg-hint').textContent, 'Puedes volver a dibujar o elegir la potencia',
    `${source} should accept a near-post trajectory`);
  const chance = parseInt(doc.querySelector('.mg-prob b').textContent, 10);
  assert.ok(chance > 2, `${source} should show a real chance for a near-post shot, got ${chance}%`);

  game.close();
  dom.window.close();
}

console.log('Free-kick aim forgives near-post shots and widens the power sweet spot in both game builds.');
