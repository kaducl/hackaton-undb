import assert from 'node:assert/strict';
import test from 'node:test';
import { restoreDemoAccess } from './demoAccess.ts';

const buyer = { email: 'compradora@firmina.app', name: 'Mariana Lima', role: 'publico' };
const company = { email: 'iema@firmina.app', name: 'IEMA', role: 'publico', company: true };
const demos = [buyer, company];

function community() {
 return {
  accounts: [{ email: 'pessoa@example.test', name: 'Pessoa', role: 'publico' }],
  deletedDemoEmails: [buyer.email, company.email, 'rita@firmina.app'],
  conversations: { existing: [{ sender: 'pessoa@example.test', text: 'Mensagem preservada' }] },
  partnerships: [{ id: 'existing-request', status: 'pendente' }],
  sellerRegistrations: [{ code: 'existing-seller' }],
 };
}

test('restores only the requested demo access and preserves all other community data', () => {
 const before = community();
 const restored = restoreDemoAccess(before, buyer.email, demos);
 assert.deepEqual(restored.deletedDemoEmails, [company.email, 'rita@firmina.app']);
 assert.deepEqual(before.deletedDemoEmails, [buyer.email, company.email, 'rita@firmina.app']);
 for (const field of ['accounts', 'conversations', 'partnerships', 'sellerRegistrations']) {
  assert.strictEqual(restored[field], before[field]);
 }
 assert.deepEqual(demos.filter(account => !restored.deletedDemoEmails.includes(account.email)), [buyer]);
});

test('restored access remains available after persistence and another restoration is a no-op', () => {
 const persisted = JSON.parse(JSON.stringify(restoreDemoAccess(community(), buyer.email, demos)));
 assert.ok(!persisted.deletedDemoEmails.includes(buyer.email));
 assert.strictEqual(restoreDemoAccess(persisted, buyer.email, demos), persisted);
});

test('does not restore retired demos or arbitrary personal accounts', () => {
 const state = community();
 for (const email of ['rita@firmina.app', 'pessoa@example.test', 'unknown@example.test', '']) {
  assert.strictEqual(restoreDemoAccess(state, email, demos), state);
 }
});

test('restoring demo access does not recreate messages or other deleted data', () => {
 const state = { ...community(), accounts: [], conversations: {}, partnerships: [], sellerRegistrations: [] };
 const restored = restoreDemoAccess(state, buyer.email, demos);
 assert.deepEqual(restored.accounts, []);
 assert.deepEqual(restored.conversations, {});
 assert.deepEqual(restored.partnerships, []);
 assert.deepEqual(restored.sellerRegistrations, []);
});
