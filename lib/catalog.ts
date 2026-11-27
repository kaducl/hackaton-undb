import type { ImageSourcePropType } from 'react-native';
import type { ProductReview } from '../components/ProductReviews';
import type { User } from './localCommunity';

export const categories = ['Artesanato', 'Gastronomia'] as const;
export type Category = typeof categories[number];
export type PurchaseIntent = 'personal' | 'event';
export type EventOffer = 'cakes' | 'trays' | 'kits' | 'lunches' | 'souvenirs';

// Optional commercial facts must come from the seller, never from example copy.
export type Product = {
 id: string; name: string; price: string; owner: string; ownerEmail?: string;
 image?: string | ImageSourcePropType; reviews?: ProductReview[]; category?: Category;
 demonstration?: boolean;
 saleUnit?: 'fatia' | 'unidade' | 'bolo inteiro' | 'peça' | 'conjunto' | 'bandeja' | 'kit' | 'travessa' | 'pessoa' | 'lote';
 priceOnRequest?: boolean;
 pickupPlace?: string; serves?: number; slices?: number; availableOn?: string;
 orderDeadline?: string; deliveryTerms?: string; dimensions?: string; length?: string;
 models?: string[]; flavors?: string[]; composition?: string;
 photos?: { uri: string; caption: string }[];
 eventOffer?: EventOffer; unitsPerSale?: number; minimumOrder?: number; orderMultiple?: number;
 capacity?: number;
};
export type FairEvent = {
 id?: string; title: string; date: string; place: string; cancelled?: boolean;
 startsAt?: string; participantEmails?: string[];
 pickups?: { productId: string; sellerEmail: string; confirmed: boolean }[];
};
export type PurchaseContext = {
 intent: PurchaseIntent; date?: string; participants?: number;
 fair?: { id: string; title: string; startsAt: string; place: string };
};

const featuredCopy = [
 { id: 'demo-bolsa', name: 'Bolsa de palha trançada', owner: 'Maria Firmina', category: 'Artesanato',
  headline: 'Vista o básico. Deixe a bolsa fazer o resto.',
  description: 'O trançado de Maria Firmina dá textura até à combinação de jeans e camiseta.', button: 'Quero essa bolsa' },
 { id: 'demo-bolo', name: 'Bolo de macaxeira', owner: 'Rita Costa', category: 'Gastronomia',
  headline: 'Passe o café. A melhor parte da mesa é o bolo da Rita.',
  description: 'Casquinha dourada, uma fatia generosa e aquela vontade de cortar só mais um pedaço.', button: 'Encomendar meu bolo' },
 { id: 'demo-colares', name: 'Colares de sementes', owner: 'Lúcia Santos', category: 'Artesanato',
  headline: 'Camiseta branca. Colar de sementes. Look pronto.',
  description: 'Escolha o desenho de Lúcia Santos que você vai querer usar primeiro.', button: 'Escolher meu colar' },
] as const;

export function productCopy(product: Product) {
 return featuredCopy.find(item => item.id === product.id ||
  (product.id.startsWith('legacy-') && item.name === product.name && item.owner === product.owner));
}
export function isDemonstration(product: Product) {
 return product.demonstration === true || product.ownerEmail === 'empreendedora@firmina.app' || product.id.startsWith('demo-') ||
  (product.id.startsWith('legacy-') && Boolean(productCopy(product) ||
   (product.name === 'Doce de buriti' && product.owner === 'Rita Costa')));
}
export function productCategory(product: Product): Category | undefined {
 return product.category ?? productCopy(product)?.category ??
  (product.id === 'demo-doce' || (isDemonstration(product) && product.name === 'Doce de buriti') ? 'Gastronomia' : undefined);
}
export function productSeller(product: Product, accounts: readonly User[]) {
 const sellers = accounts.filter(account => account.role === 'empreendedora');
 if (product.ownerEmail) return sellers.find(account => account.email === product.ownerEmail);
 const matches = sellers.filter(account => account.name === product.owner);
 return matches.length === 1 ? matches[0] : undefined;
}
export function balancedHighlights(products: Product[]) {
 const eligible = products.filter(product => !isDemonstration(product) || Boolean(productCopy(product)));
 const grouped = categories.map(category => eligible.filter(product => productCategory(product) === category)
  .sort((a, b) => Number(isDemonstration(a)) - Number(isDemonstration(b))).slice(0, 2));
 return [grouped[0][0], grouped[1][0], grouped[0][1], grouped[1][1]].filter((product): product is Product => Boolean(product));
}

export const occasionHeadings = {
 personal: { Artesanato: 'Escolha a peça que vai com você.', Gastronomia: 'O que vai acompanhar o café de hoje?' },
 event: { Artesanato: 'O que seus convidados vão levar para casa?', Gastronomia: 'Quantas pessoas vêm para a reunião?' },
};
export const eventOfferCopy: Record<EventOffer, string> = {
 cakes: 'Quantas pessoas vêm para o café? Escolha o bolo pelo número de fatias.',
 trays: 'Monte a bandeja da reunião.',
 kits: 'Um kit por participante. Escolha quantos vão à reunião.',
 lunches: 'Receba seus convidados com um almoço maranhense.',
 souvenirs: 'Lembranças para seus convidados.',
};
export function suitableForEvent(product: Product) {
 if (isDemonstration(product)) return false;
 if (productCategory(product) === 'Artesanato') return product.eventOffer === 'souvenirs' &&
  product.saleUnit === 'lote' && positiveInteger(product.unitsPerSale);
 return productCategory(product) === 'Gastronomia' && Boolean(product.eventOffer && product.eventOffer !== 'souvenirs');
}
export function prioritizeEventOffers(products: Product[]) {
 const order: EventOffer[] = ['cakes', 'trays', 'kits', 'lunches', 'souvenirs'];
 const regionalCake = (product: Product) => product.eventOffer === 'cakes' && /macaxeira|tapioca|milho/i.test(product.name);
 return [...products].sort((a, b) => order.indexOf(a.eventOffer!) - order.indexOf(b.eventOffer!) ||
  Number(regionalCake(b)) - Number(regionalCake(a)));
}
export function positiveInteger(value: unknown): value is number {
 return typeof value === 'number' && Number.isSafeInteger(value) && value > 0;
}
export function participantCount(value: string) {
 const count = /^\d+$/.test(value.trim()) ? Number(value) : NaN;
 return positiveInteger(count) ? count : undefined;
}
export function eventDate(value: string, now = new Date()) {
 const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim());
 if (!match) return undefined;
 const [, day, month, year] = match;
 const date = new Date(Number(year), Number(month) - 1, Number(day));
 const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
 if (date.getFullYear() !== Number(year) || date.getMonth() !== Number(month) - 1 ||
  date.getDate() !== Number(day) || date < today) return undefined;
 return year + '-' + month + '-' + day;
}
export function displayDate(date: string) {
 return date.slice(0, 10).split('-').reverse().join('/');
}
export function priceValue(price: string) {
 const value = price.trim();
 if (!/^(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d{1,2})?$/.test(value) && !/^\d+\.\d{1,2}$/.test(value)) return undefined;
 const normalized = value.includes(',') || /^\d{1,3}(?:\.\d{3})+$/.test(value) ? value.replace(/\./g, '').replace(',', '.') : value;
 const amount = Number(normalized);
 return Number.isFinite(amount) && amount >= 0 ? amount : undefined;
}
export function money(value: number) {
 return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
// Participants are not sale units. Convert only when the seller defines the yield/unit.
export function eventEstimate(product: Product, participants?: number) {
 if (!positiveInteger(participants) || !product.saleUnit || product.priceOnRequest || isDemonstration(product)) return undefined;
 const price = priceValue(product.price);
 const perSale = productCategory(product) === 'Artesanato' ? product.unitsPerSale :
  product.saleUnit === 'pessoa' || product.saleUnit === 'kit' ? 1 : product.serves;
 if (price === undefined || !positiveInteger(perSale)) return undefined;
 const minimum = product.minimumOrder ?? 1;
 const multiple = product.orderMultiple ?? 1;
 if (!positiveInteger(minimum) || !positiveInteger(multiple)) return undefined;
 const quantity = Math.ceil(Math.max(Math.ceil(participants / perSale), minimum) / multiple) * multiple;
 if (!Number.isSafeInteger(quantity) || (product.capacity !== undefined && (!positiveInteger(product.capacity) || quantity > product.capacity))) return undefined;
 const totalCents = Math.round(price * 100) * quantity;
 return Number.isSafeInteger(totalCents) ? { quantity, total: totalCents / 100 } : undefined;
}
export function practicalFacts(product: Product) {
 return [
  product.pickupPlace && 'Retirada: ' + product.pickupPlace,
  positiveInteger(product.serves) && 'Serve ' + product.serves + (product.serves === 1 ? ' pessoa' : ' pessoas'),
  positiveInteger(product.slices) && 'Rende ' + product.slices + (product.slices === 1 ? ' fatia' : ' fatias'),
  product.availableOn && 'Disponibilidade informada: ' + product.availableOn,
  product.orderDeadline,
 ].filter((fact): fact is string => typeof fact === 'string' && fact.length > 0);
}
export function pickupProducts(event: FairEvent, products: Product[], accounts: readonly User[], now = new Date()) {
 // A display date without year/time zone is not a confirmed future date.
 if (!event.id || event.cancelled || !event.startsAt || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?(?:Z|[+-]\d{2}:\d{2})$/.test(event.startsAt) ||
  eventDate(displayDate(event.startsAt), new Date(0)) !== event.startsAt.slice(0, 10) || !Number.isFinite(Date.parse(event.startsAt)) || Date.parse(event.startsAt) <= now.getTime()) return [];
 return products.filter(product => !isDemonstration(product) && event.pickups?.some(link => link.confirmed &&
  link.productId === product.id && link.sellerEmail === productSeller(product, accounts)?.email &&
  event.participantEmails?.includes(link.sellerEmail)));
}
export function inquiryDraft(product: Product, seller: User, context: PurchaseContext) {
 const price = product.priceOnRequest ? ' (valor sob orçamento)' : ' por R$ ' + product.price + (product.saleUnit ? ' por ' + product.saleUnit : ' (unidade de venda a confirmar)');
 let draft = 'Oi, ' + seller.name.split(' ')[0] + '! Tenho interesse em ' + product.name + price + '.';
 if (context.intent === 'event') {
  if (context.date) draft += ' Para ' + displayDate(context.date) + '.';
  if (context.participants) draft += ' Serão ' + context.participants + (context.participants === 1 ? ' participante.' : ' participantes.');
  const estimate = eventEstimate(product, context.participants);
  if (estimate) draft += ' Quantidade estimada: ' + estimate.quantity + ' × ' + product.saleUnit + '; total ' + money(estimate.total) + ', sujeito à confirmação.';
 }
 if (context.fair) draft += ' Quero combinar a retirada na ' + context.fair.title + ', em ' + displayDate(context.fair.startsAt) + ', ' + context.fair.place + '.';
 return draft + ' Pode confirmar a disponibilidade e as condições?';
}
