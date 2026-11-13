const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ctx = {N_: (s) => s, S: {}};
vm.createContext(ctx);
for (const file of ['legacy-game/src/pets.js', 'legacy-game/src/pet-items.js']) vm.runInContext(fs.readFileSync(file, 'utf8'), ctx, {filename: file});
const species = JSON.parse(JSON.stringify(ctx.PET_DEF.map((p) => ({k: p.k, ex: p.ex}))));
for (const id of ['guinea', 'budgie', 'ferret', 'rescuecat']) assert.ok(species.some((p) => p.k === id && !p.ex), `${id} is a standard non-exotic adoption`);
assert.equal(new Set(species.map((p) => p.k)).size, species.length, 'pet ids must remain unique');
const newItems = ['visor', 'flower', 'headphones', 'rosette', 'medal_blue', 'toy_flag', 'rainhood', 'captain_band', 'pom', 'whisker_mask', 'reversible_scarf', 'captain_neckerchief', 'raincoat', 'captain_sash', 'keeper_vest', 'club_backpack', 'celebration_wings', 'club_badge', 'cleats', 'ankle_bands', 'tail_ribbon', 'tail_flag', 'mini_ball', 'foam_finger', 'training_cone', 'mini_trophy'];
assert.equal(newItems.length, 26);
for (const id of newItems) {
  assert.ok(ctx.PET_ACC2.some((a) => a.id === id), `${id} must be available in the 3D wardrobe`);
  assert.ok(ctx.petItem(id), `${id} must have a renderable item definition`);
}
assert.equal(ctx.petItem('toy_flag').model, 'pennant');
assert.equal(ctx.petItem('foam_finger').model, 'foam_finger');
assert.equal(ctx.petItem('training_cone').model, 'cone');
assert.equal(ctx.petItem('mini_trophy').model, 'cup');
const props = fs.readFileSync('legacy-game/src/pet-props.js', 'utf8');
assert.match(props, /case "foam_finger"/);
assert.match(props, /case "cone"/);
for (const id of ['guinea', 'budgie', 'ferret', 'rescuecat']) {
  assert.match(fs.readFileSync('legacy-game/src/pet-models.js', 'utf8'), new RegExp(`\\b${id}: \\{`), `${id} needs a 3D model profile`);
  if (id !== 'budgie') assert.ok(ctx.PET_FUR.includes(id), `${id} must use the compatible grooming/style care path`);
  assert.ok(ctx.PET_CARE.some((a) => !a.sp || a.sp.includes(id)), `${id} must have at least one compatible care activity`);
}
const rig = fs.readFileSync('legacy-game/src/pet-rig.js', 'utf8');
const audio = fs.readFileSync('legacy-game/src/pet-audio.js', 'utf8');
assert.match(rig, /rescuecat:\s*1/);
assert.match(rig, /ferret:\s*1/);
for (const id of ['ferret', 'rescuecat']) assert.match(audio, new RegExp(`${id}: \\[`), `${id} needs its own synthesized sound profile`);
console.log('Pet expansion tests passed: four companions and 26 wardrobe items have stable ids, 3D profiles and compatible care.');
