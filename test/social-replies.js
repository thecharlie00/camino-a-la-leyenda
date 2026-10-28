import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const source = readFileSync('legacy-game/src/engine-extra.js', 'utf8');
const start = source.indexOf('var SOC_CUSTOM_OPTIONS = [');
const end = source.indexOf('/* fichajes:', start);
assert.ok(start >= 0 && end > start, 'Social composer implementation is missing');

const context = {
  N_: (text) => text,
  SOCIAL_T: {},
  S: { yr: 2026, bi: 2, mode: 'p', p: {}, soc: { posts: [], prof: { name: 'Player' } } },
  socInit() { return context.S.soc; },
  applyFx() {},
  mgrFx() {},
  socPostRaw(options) {
    const post = { id: context.S.soc.posts.length + 1, tk: options.tk, tp: options.tp };
    context.S.soc.posts.unshift(post);
    return post;
  },
};
runInNewContext(source.slice(start, end), context);

const publish = context.socCustomSend('grateful', '');
assert.equal(publish.ok, true, 'A new custom post should send');
assert.equal(context.S.soc.customPeriod, '2026|2');

const replyMeta = { id: 99, target: 'Supporter', text: 'Great match!' };
const reply = context.socCustomSend('team', replyMeta);
assert.equal(reply.ok, true, 'A reply should remain available after a custom post in the same block');
assert.equal(reply.reply, true);
assert.deepEqual(JSON.parse(JSON.stringify(context.S.soc.posts[0].replyTo)), {
  id: 99,
  target: 'Supporter',
  text: 'Great match!',
});
assert.equal(context.S.soc.replyPeriod, '2026|2');

const secondReplyThisBlock = context.socCustomSend('calm', { target: 'Another fan' });
assert.equal(secondReplyThisBlock.limit, true, 'Only one custom reply is allowed per block');
const secondPostThisBlock = context.socCustomSend('bold', '');
assert.equal(secondPostThisBlock.limit, true, 'Only one custom post is allowed per block');

context.S.bi++;
assert.equal(context.socCustomSend('calm', { target: 'Another fan' }).ok, true, 'Reply cooldown should reset next block');
console.log('Social reply tests passed: replies have an independent per-block limit.');
