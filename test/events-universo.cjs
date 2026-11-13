const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const player = [], manager = [];
const ctx = {
  S: {tw: 5, custom: {id: 10}, m: {club: 10, flags: {uvManagerTool: 'fullTrial', uvClubGirlsActivity: 'consult', uvSetPiecePlan: 'attack', uvClubAccessPlan: 'consult'}, sq: [{id: 3, age: 19, st: {apps: 1}, loanOut: false}]}}, 
  i18nFields() {}, EV(e) { player.push(e); }, MEV(e) { manager.push(e); },
  tr(t, p = {}) { return String(t).replace(/\{(\w+)\}/g, (_, k) => p[k] == null ? `{${k}}` : p[k]); },
  plName(p) { return `Player ${p.id}`; },
};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync('legacy-game/src/events-universo.js', 'utf8'), ctx, {filename: 'events-universo.js'});
assert.equal(player.length, 36);
assert.equal(manager.length, 72);
assert.equal(new Set(player.concat(manager).map((x) => x.id)).size, 108, 'new decisions use unique stable ids');
const X = {inSeason: true, p: {fit: 48, inj: 2, age: 20, flags: {uvStudyPlan: 'remote', uvRehabPath: 'plan'}}, teamGames: 5};
const playerFxKeys = new Set(['ovr', 'pot', 'form', 'mor', 'fit', 'prof', 'fame', 'coach', 'fans', 'money', 'fol', 'inj', 'susp', 'buff', 'att', 'flag', 'gmul', 'injMul', 'sal', 'yrs', 'pos', 'agent', 'coachSet']);
const managerFxKeys = new Set(['board', 'fans', 'rep', 'chem', 'sqMor', 'sfit', 'bud', 'buff', 'pmor', 'pinj', 'psus', 'prole', 'povr', 'plist', 'preq', 'pts', 'youth', 'flag', 'wcap']);
for (const ev of player) {
  assert.equal(ev.when(X), true, `${ev.id} should be eligible for its matching context`);
  assert.equal(ev.opts(X).length, 3, `${ev.id} should have three meaningful options`);
  assert.ok(ev.opts(X).every((o) => o.ok && o.ok.fx), `${ev.id} should affect career state`);
  for (const option of ev.opts(X)) for (const key of Object.keys(option.ok.fx)) assert.ok(playerFxKeys.has(key), `${ev.id} uses supported player effect ${key}`);
}
const study = player.find((ev) => ev.id === 'uv_player_study_balance');
const studyFollowup = player.find((ev) => ev.id === 'uv_player_study_followup');
assert.equal(study.opts(X)[0].ok.fx.flag.uvStudyPlan, 'remote');
assert.equal(studyFollowup.when(X), true, 'a chosen study plan unlocks its follow-up');
assert.equal(studyFollowup.opts(X)[0].ok.fx.flag.uvStudyPlan, false, 'the follow-up closes the story arc');
assert.equal(studyFollowup.when({...X, p: {...X.p, flags: {uvStudyPlan: false}}}), false, 'a resolved study arc cannot repeat');
const savedArcFlags = JSON.parse(JSON.stringify({player: X.p.flags, manager: ctx.S.m.flags}));
assert.equal(savedArcFlags.player.uvStudyPlan, 'remote');
assert.equal(savedArcFlags.manager.uvManagerTool, 'fullTrial');
assert.deepEqual(player.map((ev) => ev.when({...X, gender: 'f'})), player.map((ev) => ev.when({...X, gender: 'm'})), 'decision eligibility is equivalent in women’s and men’s careers');
assert.equal(player.find((ev) => ev.id === 'uv_player_rehab_rhythm').when({...X, p: {...X.p, inj: 0}}), false, 'rehab-specific story requires an injury recovery context');
const rehabFollowup = player.find((ev) => ev.id === 'uv_player_rehab_checkin');
assert.equal(rehabFollowup.when(X), true, 'a recovery plan unlocks a check-in');
assert.equal(rehabFollowup.opts(X)[0].ok.fx.flag.uvRehabPath, false);
assert.equal(rehabFollowup.when({...X, p: {...X.p, flags: {...X.p.flags, uvRehabPath: false}}}), false, 'a resolved recovery check-in cannot repeat');
assert.equal(player.find((ev) => ev.id === 'uv_player_study_balance').when({...X, p: {...X.p, age: 25}}), false, 'study story is age-gated');
assert.ok(player.every((ev) => !ev.when({...X, inSeason: false})), 'player stories only run during the season');
const Y = {inSeason: true, last: {n: 4}, pl: ctx.S.m.sq[0]};
const rotation = manager.find((x) => x.id === 'uv_mgr_load');
const youth = manager.find((x) => x.id === 'uv_mgr_promise');
assert.equal(rotation.when(Y), true);
assert.equal(youth.when(Y), true);
assert.equal(youth.target(Y), 3);
assert.deepEqual(manager.map((ev) => ev.when({...Y, gender: 'f'})), manager.map((ev) => ev.when({...Y, gender: 'm'})), 'manager and created-club story eligibility is gender-neutral');
for (const ev of manager) {
  assert.equal(ev.opts(Y).length, 3);
  for (const option of ev.opts(Y)) {
    assert.ok(option.ok && option.ok.fx, `${ev.id} should affect manager state`);
    for (const key of Object.keys(option.ok.fx)) assert.ok(managerFxKeys.has(key), `${ev.id} uses supported manager effect ${key}`);
  }
}
const regularManagerStories = manager.filter((ev) => !ev.id.startsWith('uv_club_'));
assert.ok(regularManagerStories.every((ev) => !ev.when({...Y, inSeason: false})), 'manager stories require an active season');
const toolReview = manager.find((ev) => ev.id === 'uv_mgr_tools_review');
const toolTrial = manager.find((ev) => ev.id === 'uv_mgr_staff_tools');
assert.equal(toolReview.when(Y), true, 'a staff-tool trial unlocks a review');
assert.equal(toolTrial.opts(Y)[0].ok.fx.flag.uvManagerTool, 'fullTrial');
assert.equal(toolReview.opts(Y)[0].ok.fx.flag.uvManagerTool, false, 'the manager follow-up closes its arc');
ctx.S.m.flags.uvManagerTool = false;
assert.equal(toolReview.when(Y), false, 'a resolved tool trial cannot repeat');
const setPieceDecision = manager.find((ev) => ev.id === 'uv_mgr_set_piece_detail');
const setPieceReview = manager.find((ev) => ev.id === 'uv_mgr_set_piece_review');
assert.equal(setPieceDecision.opts(Y)[0].ok.fx.flag.uvSetPiecePlan, 'attack');
assert.equal(setPieceReview.when(Y), true, 'a set-piece adjustment unlocks a review');
assert.equal(setPieceReview.opts(Y)[0].ok.fx.flag.uvSetPiecePlan, false);
ctx.S.m.flags.uvSetPiecePlan = false;
assert.equal(setPieceReview.when(Y), false, 'a resolved set-piece review cannot repeat');
assert.ok(player.length >= 30, 'at least 30 player stories are available in either gender');
assert.ok(manager.filter((x) => !x.id.startsWith('uv_club_')).length >= 30, 'at least 30 manager stories are available in either gender');
assert.ok(manager.filter((x) => x.id.startsWith('uv_club_')).length >= 30, 'at least 30 created-club stories are available');
const custom = manager.filter((x) => x.id.startsWith('uv_club_'));
assert.equal(custom.length, 36);
assert.ok(custom.every((ev) => ev.when(Y)), 'club-founder decisions are available to a created club');
const girlsDecision = custom.find((ev) => ev.id === 'uv_club_girls_open_session');
const girlsReview = custom.find((ev) => ev.id === 'uv_club_girls_review');
assert.equal(girlsDecision.opts(Y)[2].ok.fx.flag.uvClubGirlsActivity, 'consult');
assert.match(girlsReview.text(), /consulta local/);
assert.equal(girlsReview.opts(Y)[0].ok.fx.flag.uvClubGirlsActivity, false, 'the community follow-up closes the arc');
const accessDecision = custom.find((ev) => ev.id === 'uv_club_access');
const accessReview = custom.find((ev) => ev.id === 'uv_club_access_followup');
assert.equal(accessDecision.opts(Y)[1].ok.fx.flag.uvClubAccessPlan, 'consult');
assert.match(accessReview.text(), /no se ha cambiado ninguna instalación/);
assert.equal(accessReview.opts(Y)[0].ok.fx.flag.uvClubAccessPlan, false);
ctx.S.m.flags.uvClubAccessPlan = false;
assert.equal(accessReview.when(Y), false, 'a resolved access review cannot repeat');
ctx.S.m.flags.uvClubGirlsActivity = false;
assert.equal(girlsReview.when(Y), false, 'a resolved community arc cannot repeat');
ctx.S.m.flags.uvClubGirlsActivity = 'consult';
ctx.S.custom = null;
assert.ok(custom.every((ev) => !ev.when(Y)), 'created-club stories do not leak into an ordinary manager career');
console.log('Universe decision tests passed: three-mode coverage, one hundred and eight stable ids, gender-neutral contextual gates, supported effects, six persisted follow-up arcs and created-club isolation.');
