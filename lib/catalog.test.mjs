import assert from 'node:assert/strict';
import test from 'node:test';
import {
 balancedHighlights, eventDate, eventEstimate, inquiryDraft, isDemonstration,
 participantCount, pickupProducts, practicalFacts, priceValue, prioritizeEventOffers, productCategory, productCopy,
 productSeller, suitableForEvent,
} from './catalog.ts';

// Fixtures live only in this test process; they are never seeded into the app.
const seller = { email: 'seller@example.test', name: 'Vendedora de teste', role: 'empreendedora' };
const food = { id: 'test-food', name: 'Produto de teste', owner: seller.name, ownerEmail: seller.email,
 category: 'Gastronomia', price: '35,00', saleUnit: 'bolo inteiro', serves: 10, eventOffer: 'cakes' };
const craft = { ...food, id: 'test-craft', category: 'Artesanato', saleUnit: 'lote',
 eventOffer: 'souvenirs', unitsPerSale: 10 };
const now = new Date('2026-11-25T12:00:00-03:00');
const fair = { id: 'test-fair', title: 'Feira de teste', date: '28 nov', place: 'Local de teste',
 startsAt: '2026-11-28T09:00:00-03:00', participantEmails: [seller.email],
 pickups: [{ productId: food.id, sellerEmail: seller.email, confirmed: true }] };

test('copy uses stable IDs and narrow legacy matching, preserving source prices/reviews', () => {
 const reviews = [{ rating: 5, authorEmail: 'test', authorName: 'Teste', comment: '' }];
 const demo = { ...food, id: 'demo-bolsa', name: 'Bolsa de palha trançada', owner: 'Maria Firmina', price: '97,25', reviews, category: undefined };
 assert.equal(productCopy(demo).button, 'Quero essa bolsa');
 assert.equal(productCategory(demo), 'Artesanato');
 assert.equal(productCopy({ ...demo, id: 'new-id' }), undefined);
 assert.ok(productCopy({ ...demo, id: 'legacy-0' }));
 balancedHighlights([demo]);
 assert.equal(demo.price, '97,25');
 assert.equal(demo.reviews, reviews);
 assert.equal(isDemonstration(demo), true);
});

test('highlights interleave two per category, with no duplicate or artificial fourth item', () => {
 assert.deepEqual(balancedHighlights([craft, { ...craft, id: 'craft-2' }, food, { ...food, id: 'food-2' }]).map(p => p.id),
  ['test-craft', 'test-food', 'craft-2', 'food-2']);
 assert.equal(balancedHighlights([craft, food, { ...craft, id: 'craft-2' }]).length, 3);
 assert.equal(balancedHighlights([{ ...food, id: 'demo-doce' }]).length, 0);
 assert.deepEqual(balancedHighlights([]), []);
});

test('date and participants reject missing, past, fractional, impossible and malformed values', () => {
 assert.equal(eventDate('28/11/2026', now), '2026-11-28');
 assert.equal(eventDate('25/11/2026', now), '2026-11-25');
 for (const date of ['', '24/11/2026', '31/11/2026', '29/02/2027', '2026-11-28']) assert.equal(eventDate(date, now), undefined);
 assert.equal(participantCount('30'), 30);
 for (const count of ['', '0', '-1', '2.5', '1e2', 'abc']) assert.equal(participantCount(count), undefined);
});

test('event offers require confirmed group/lot information, and never promote demos', () => {
 assert.equal(suitableForEvent(food), true);
 assert.equal(suitableForEvent(craft), true);
 assert.equal(suitableForEvent({ ...craft, unitsPerSale: undefined }), false);
 assert.equal(suitableForEvent({ ...food, eventOffer: undefined }), false);
 assert.equal(suitableForEvent({ ...food, id: 'demo-bolo' }), false);
 assert.equal(suitableForEvent({ ...food, demonstration: true }), false);
 assert.equal(suitableForEvent({ ...food, ownerEmail: 'empreendedora@firmina.app' }), false);
 assert.equal(prioritizeEventOffers([food, { ...food, id: 'regional', name: 'Bolo de milho' }])[0].id, 'regional');
 assert.deepEqual(practicalFacts({ id: 'empty', name: '', owner: '', price: '' }), []);
});

test('totals use seller units, yield, minimums, multiples and capacity, not participant count as unit count', () => {
 assert.deepEqual(eventEstimate(food, 30), { quantity: 3, total: 105 });
 assert.deepEqual(eventEstimate({ ...food, minimumOrder: 4, orderMultiple: 2 }, 30), { quantity: 4, total: 140 });
 assert.deepEqual(eventEstimate(craft, 31), { quantity: 4, total: 140 });
 assert.deepEqual(eventEstimate({ ...food, saleUnit: 'pessoa', price: '12,50' }, 3), { quantity: 3, total: 37.5 });
 for (const changes of [{ saleUnit: undefined }, { serves: undefined }, { priceOnRequest: true }, { capacity: 2 }, { price: 'a partir de 35' }]) {
  assert.equal(eventEstimate({ ...food, ...changes }, 30), undefined);
 }
 assert.equal(priceValue('1.234,50'), 1234.5);
 assert.equal(priceValue('1.000'), 1000);
 assert.equal(priceValue('35.50'), 35.5);
});

test('seller lookup never falls back to an unrelated or ambiguous contact', () => {
 assert.equal(productSeller(food, [seller]), seller);
 assert.equal(productSeller({ ...food, ownerEmail: 'missing@example.test' }, [seller]), undefined);
 assert.equal(productSeller({ ...food, ownerEmail: undefined }, [seller]), seller);
 assert.equal(productSeller({ ...food, ownerEmail: undefined }, [seller, { ...seller, email: 'other@example.test' }]), undefined);
 assert.equal(productSeller(food, [{ ...seller, role: 'publico' }]), undefined);
});

test('fair pickup requires a valid future date, product link, participant and matching active seller', () => {
 assert.deepEqual(pickupProducts(fair, [food, craft], [seller], now), [food]);
 for (const changes of [{ id: undefined }, { cancelled: true }, { startsAt: '22 nov • 09:00' },
  { startsAt: '2026-11-24T09:00:00-03:00' }, { startsAt: '2027-02-31T09:00:00-03:00' },
  { participantEmails: [] }, { pickups: [] },
  { pickups: [{ productId: food.id, sellerEmail: seller.email, confirmed: false }] },
  { pickups: [{ productId: craft.id, sellerEmail: 'wrong@example.test', confirmed: true }] }]) {
  assert.deepEqual(pickupProducts({ ...fair, ...changes }, [food, craft], [seller], now), []);
 }
 assert.deepEqual(pickupProducts(fair, [food], [], now), []);
 assert.deepEqual(pickupProducts(fair, [{ ...food, demonstration: true }], [seller], now), []);
});

test('editable inquiry carries product, current price, event date, participants and pickup, with no purchase confirmation', () => {
 const draft = inquiryDraft(food, seller, { intent: 'event', date: '2026-11-28', participants: 30, fair });
 for (const text of ['Oi, Vendedora!', food.name, '35,00', '28/11/2026', '30 participantes', '3 × bolo inteiro', fair.title, 'sujeito à confirmação']) assert.ok(draft.includes(text), text);
 assert.ok(inquiryDraft({ ...food, priceOnRequest: true }, seller, { intent: 'personal' }).includes('valor sob orçamento'));
 assert.ok(!inquiryDraft(food, seller, { intent: 'personal' }).includes('participantes'));
});
