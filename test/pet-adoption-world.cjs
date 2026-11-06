const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function runAdoption(worldAvailable) {
  const calls = [];
  const uiState = {};
  let pet = null;
  const UIX = {
    add() {},
    actions: {},
    sheets: {},
    h: value => String(value),
    ui: () => uiState,
    edgeFlash: () => calls.push('flash'),
    toast: () => calls.push('toast'),
    closeSheet: () => calls.push('close-sheet'),
    persist: () => calls.push('persist'),
    render: () => calls.push('render'),
    open: key => calls.push('fallback:' + key),
  };
  const context = {
    UIX,
    PET_DEF: [],
    N_: value => value,
    tr: value => value,
    document: {
      addEventListener() {},
      getElementById: () => ({value: 'Pipo'}),
    },
    petAdopt: () => { pet = {nm: 'Pipo'}; return {ok: true}; },
    petOf: () => pet,
    PetWorld: {open: () => { calls.push('open-3d'); return worldAvailable; }},
  };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync('legacy-game/src/ui-pets.js', 'utf8'), context, {filename: 'ui-pets.js'});
  UIX.actions.petadopt();
  return {calls, uiState};
}

const supported = runAdoption(true);
assert.deepEqual(supported.calls, ['flash', 'toast', 'close-sheet', 'persist', 'render', 'open-3d']);
assert.equal(supported.calls.includes('fallback:lpet'), false, 'do not reopen the old pet care sheet when 3D is available');

const unsupported = runAdoption(false);
assert.equal(unsupported.calls.at(-1), 'fallback:lpet', 'keep a usable fallback when 3D cannot start');

console.log('Successful pet adoption opens the 3D world instead of the legacy care menu.');
