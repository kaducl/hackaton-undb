import AsyncStorage from '@react-native-async-storage/async-storage';
import { randomUUID } from 'expo-crypto';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, type AlertButton, Image, type ImageSourcePropType, KeyboardAvoidingView, Linking, Modal, Platform, ScrollView, Text, TextInput, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SellerRegistrationDetails, SellerRegistrationForm } from '../components/SellerRegistrationForm';
import type { SellerRegistration } from '../lib/sellerRegistration';
import { productImageSource } from '../lib/productImages';
import { restoreDemoAccess } from '../lib/demoAccess';
import { ProductRating, ProductReviews, type Rating } from '../components/ProductReviews';
import { SaoLuisMap, SemmuMap } from '../components/SemmuMap';
import { ConversationList, DirectConversation, RegistrationForm, type RegistrationValues } from '../components/CommunityForms';
import {
 adminAccount, conversationKey, createPasswordVerifier, deleteLocalAccount, demoPassword, demoUsers,
 initialCommunity, legacyAdminEmail, partnershipActions, partnershipLabels, validDocument, verifyPassword,
 type Community, type PartnershipStatus, type User,
} from '../lib/localCommunity';

import {
 balancedHighlights, categories, displayDate, eventDate, eventEstimate, eventOfferCopy, inquiryDraft,
 isDemonstration, money, occasionHeadings, participantCount, pickupProducts, positiveInteger,
 practicalFacts, prioritizeEventOffers, productCategory, productCopy, productSeller, suitableForEvent,
 type Category, type FairEvent as Event, type Product, type PurchaseContext, type PurchaseIntent,
} from '../lib/catalog';

const C={plum:'#3D1A4F',purple:'#80297D',ink:'#212B36',yellow:'#FFE02C',cream:'#FFF9E8',white:'#FFFFFF',muted:'#76717B',line:'#EEE8EF',green:'#31765A'};
type StoredProduct = Omit<Product, 'id'> & { id?: string };
function ownsProduct(user: User, product: Product) {
 return user.role === 'empreendedora' && (product.ownerEmail
  ? product.ownerEmail === user.email
  : product.owner === user.name);
}

function profileImage(user: User): ImageSourcePropType | undefined {
 if (user.role === 'admin') return require('../docs/logo SEMMU.jpg');
 if (user.email === 'iema@firmina.app') return require('../docs/logo IEMA.jpeg');
 if (user.email === 'compradora@firmina.app') return require('../docs/foto mulher compradora.jpg');
 if (user.email === 'empreendedora@firmina.app') return require('../docs/mulhere empreendedora.png');
 return undefined;
}

const initialProducts: Product[] = [
 { id: 'demo-bolsa', name: 'Bolsa de palha trançada', price: '85,00', owner: 'Maria Firmina' },
 { id: 'demo-bolo', name: 'Bolo de macaxeira', price: '35,00', owner: 'Rita Costa' },
 { id: 'demo-colares', name: 'Colares de sementes', price: '48,00', owner: 'Lúcia Santos' },
 { id: 'demo-doce', name: 'Doce de buriti', price: '22,00', owner: 'Rita Costa' },
];
function showAlert(title: string, message?: string, buttons?: AlertButton[]) {
 if (Platform.OS !== 'web') {
  Alert.alert(title, message, buttons);
  return;
 }

 const text = message ? title + '\n\n' + message : title;
 if (buttons) {
  if (window.confirm(text)) buttons[buttons.length - 1]?.onPress?.();
  return;
 }
 window.alert(text);
}

const semmuContact = 'https://www.saoluis.ma.gov.br/portal/secretarias/57/secretaria-municipal-da-mulher---semmu/';
const retiredDemoEmails = ['rita@firmina.app', 'lucia@firmina.app', 'iema@dev.br'];

function demoAccountType(account: User) {
 if (account.role === 'admin') return 'Conta do SEMMU';
 if (account.role === 'empreendedora') return 'Conta de empreendedora';
 return account.company ? 'Conta da empresa' : 'Conta da compradora';
}

const webFrame = { width: '100%', alignSelf: 'center' } as const;
const webLogin = Platform.OS === 'web' ? { ...webFrame, maxWidth: 480 } : undefined;
const webDashboard = Platform.OS === 'web' ? { ...webFrame, maxWidth: 1040 } : undefined;
const webSheet = Platform.OS === 'web' ? { ...webFrame, maxWidth: 520 } : undefined;

function BackLink({ label = 'Voltar', onPress }: { label?: string; onPress: () => void }) {
 return (
  <TouchableOpacity accessibilityRole="button" accessibilityLabel={label} onPress={onPress}
   style={{ alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center', marginBottom: 8 }}>
   <Text style={{ color: C.purple, fontWeight: '700' }}>← {label}</Text>
  </TouchableOpacity>
 );
}

function WelcomeScreen({ onStart }: { onStart: () => void }) {
 const { width } = useWindowDimensions();
 const contentWidth = Math.min(width, 470);
 const photoCornerRadius = contentWidth * (62 / 470);

 return (
  <SafeAreaView style={{ flex: 1, backgroundColor: C.white }}>
   <ScrollView contentContainerStyle={{ flexGrow: 1, alignItems: 'center' }}>
    <View style={{ width: contentWidth, maxWidth: '100%', flexGrow: 1 }}>
     <Image
      source={require('../docs/boas-vindas.png')}
      style={{
       width: '100%',
       height: contentWidth * (918 / 470),
       borderTopLeftRadius: photoCornerRadius,
       borderTopRightRadius: photoCornerRadius,
      }}
      resizeMode="stretch"
      accessibilityLabel="Firmina. Compre de quem faz. Fortaleça quem transforma. Descubra o artesanato e os sabores das empreendedoras de São Luís. Sua compra gera autonomia. Empresas podem abrir espaço em eventos e tornar-se parceiras."
      accessible
     />
     <View style={{ paddingHorizontal: '6.4%', paddingBottom: 24 }}>
      <TouchableOpacity
       accessibilityRole="button"
       accessibilityLabel="Vamos começar"
       onPress={onStart}
       style={{ backgroundColor: C.purple, borderRadius: 20, minHeight: 60, alignItems: 'center', justifyContent: 'center', padding: 14 }}
      >
       <Text style={{ color: C.white, fontWeight: '800', fontSize: 20, textAlign: 'center' }}>Vamos Começar  →</Text>
      </TouchableOpacity>
     </View>
     <View style={{ flexGrow: 1, justifyContent: 'center', backgroundColor: C.cream, paddingHorizontal: 24, paddingVertical: 36, alignItems: 'center' }}>
      <Text style={{ color: C.plum, fontSize: 24, fontWeight: '900' }}>Firmina</Text>
      <Text style={{ color: C.ink, fontSize: 15, marginTop: 8, textAlign: 'center' }}>Uma iniciativa da SEMMU · São Luís</Text>
     </View>
    </View>
   </ScrollView>
  </SafeAreaView>
 );
}

export default function Home(){
 const [hasStarted, setHasStarted] = useState(false);
 const [mapGestureActive, setMapGestureActive] = useState(false);
 const [pageHistory, setPageHistory] = useState<string[]>(['Início']);
 const page = pageHistory[pageHistory.length - 1];
 const navigateTo = (nextPage: string) => {
  setPageHistory(history => history[history.length - 1] === nextPage ? history : [...history, nextPage]);
 };
 const goBack = () => {
  if (pageHistory.length > 1) {
   setPageHistory(history => history.slice(0, -1));
   return;
  }
  setHasStarted(false);
 };
 const [ready,setReady]=useState(false),[user,setUser]=useState<User|null>(null),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[products,setProducts]=useState(initialProducts),[events,setEvents]=useState<Event[]>([{title:'Feira Mulheres que Fazem',date:'22 nov • 09:00',place:'Praça Maria Aragão'},{title:'Oficina de precificação',date:'26 nov • 14:00',place:'CRAMSV — Centro'}]),[modal,setModal]=useState(''),[form,setForm]=useState(''),[price,setPrice]=useState(''),[photo,setPhoto]=useState<string|undefined>(),[toast,setToast]=useState('');
 const [community, setCommunity] = useState<Community>(initialCommunity);
 const [intent, setIntent] = useState<PurchaseIntent>('personal');
 const [category, setCategory] = useState<Category | 'Todas'>('Todas');
 const [eventDateInput, setEventDateInput] = useState('');
 const [participantsInput, setParticipantsInput] = useState('');
 const [pickupEventId, setPickupEventId] = useState<string | null>(null);
 const [selectedContext, setSelectedContext] = useState<PurchaseContext>({ intent: 'personal' });
 const [drafts, setDrafts] = useState<Record<string, string>>({});
 const [newProductCategory, setNewProductCategory] = useState<Category | undefined>();
 const accounts = [...demoUsers.filter(account => !community.deletedDemoEmails.includes(account.email)), ...community.accounts];
 const pickupEvent = events.find(event => event.id === pickupEventId);
 const participants = participantCount(participantsInput);
 const date = eventDate(eventDateInput);
 const purchaseContext: PurchaseContext = pickupEvent?.id && pickupEvent.startsAt
  ? { intent: 'personal', fair: { id: pickupEvent.id, title: pickupEvent.title, startsAt: pickupEvent.startsAt, place: pickupEvent.place } }
  : { intent, ...(intent === 'event' ? { date, participants } : {}) };
 const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
 const selectedProduct = products.find(product => product.id === selectedProductId);
 const [editingSeller, setEditingSeller] = useState<SellerRegistration | null>(null);
 const [expandedSellerCode, setExpandedSellerCode] = useState<string | null>(null);
 const [authBusy, setAuthBusy] = useState(false);
 const authChanging = useRef(false);
 const persistence = useRef(Promise.resolve());
 const demoAccounts = demoUsers.filter(account => !community.deletedDemoEmails.includes(account.email));
 const removedDemoAccounts = demoUsers.filter(account => community.deletedDemoEmails.includes(account.email));

 useEffect(() => {
  AsyncStorage.getItem('firmina-state').then(raw => {
   if (!raw) return;
   const saved = JSON.parse(raw);
   let storedCommunity: Community = { ...initialCommunity, ...saved.community };
   const retiredStoredEmails = storedCommunity.accounts
    .filter(account => retiredDemoEmails.includes(account.email.trim().toLowerCase()))
    .map(account => account.email);
   for (const retiredEmail of [...retiredDemoEmails, ...retiredStoredEmails]) {
    storedCommunity = deleteLocalAccount(storedCommunity, retiredEmail);
   }
   setCommunity(storedCommunity);
   const storedUser: User | null = saved.user ?? null;
   const savedUser = storedUser && retiredDemoEmails.includes(storedUser.email.trim().toLowerCase()) ? null : storedUser;
   if (savedUser) {
    const normalizedEmail = savedUser.email.trim().toLowerCase();
    const profile = savedUser.role === 'admin' ? adminAccount :
     demoUsers.find(account => account.email === normalizedEmail) ?? { ...savedUser, email: normalizedEmail };
    if (!storedCommunity.deletedDemoEmails.includes(profile.email)) {
     setUser(profile);
     if (profile.role === 'admin') setPageHistory(['Painel']);
    }
   }
   const storedProducts: StoredProduct[] = saved.products ?? initialProducts;
   setProducts(storedProducts.map((product, index) => ({
    ...product,
    id: product.id ?? 'legacy-' + index,
    owner: product.ownerEmail === 'empreendedora@firmina.app' || (!product.ownerEmail && product.owner === 'Ana Nascimento')
     ? 'Maria Firmina' : product.owner,
   })));
   setEvents(saved.events ?? []);
  }).catch(() => {}).finally(() => setReady(true));
 }, []);

 useEffect(() => {
  if (!ready) return;
  const snapshot = JSON.stringify({ user, products, events, community });
  persistence.current = persistence.current.catch(() => {}).then(() => AsyncStorage.setItem('firmina-state', snapshot));
  void persistence.current.catch(() => {});
 }, [ready, user, products, events, community]);

 const say = (message: string) => {
  setToast(message);
  setTimeout(() => setToast(''), 2200);
 };

 const enter = (profile: User) => {
  const { email, name, role, company, documentLastFour } = profile;
  setUser({ email, name, role, company, documentLastFour });
  setPageHistory([profile.role === 'admin' ? 'Painel' : 'Início']);
  setEmail('');
  setPassword('');
  setModal('');
 };

 const changeAccount = async (action: () => Promise<void>) => {
  if (authChanging.current) return;
  authChanging.current = true;
  setAuthBusy(true);
  try {
   await action();
  } catch {
   showAlert('Não foi possível concluir', 'Tente novamente neste dispositivo.');
  } finally {
   authChanging.current = false;
   setAuthBusy(false);
  }
 };

 const restoreDemoAccount = (accountEmail: string) => changeAccount(async () => {
  const nextCommunity = restoreDemoAccess(community, accountEmail, demoUsers);
  if (nextCommunity === community) return;
  await persistence.current.catch(() => {});
  await AsyncStorage.setItem('firmina-state', JSON.stringify({ user, products, events, community: nextCommunity }));
  setCommunity(nextCommunity);
  say('Acesso de demonstração restaurado.');
 });

 const login = (inputEmail = email, inputPassword = password) => changeAccount(async () => {
  const normalizedEmail = inputEmail.trim().toLowerCase();
  const accountEmail = normalizedEmail === legacyAdminEmail ? adminAccount.email : normalizedEmail;
  const demo = demoAccounts.find(account => account.email === accountEmail);
  if (demo && inputPassword === demoPassword) {
   enter(demo);
   return;
  }

  if (retiredDemoEmails.includes(accountEmail)) {
   showAlert('Conta desativada', 'Este acesso de demonstração foi retirado.');
   return;
  }
  const account = community.accounts.find(account => account.email === accountEmail);
  if (account && await verifyPassword(inputPassword, account.passwordVerifier)) {
   enter(account);
   return;
  }
  showAlert('Acesso não encontrado', 'Confira o e-mail e a senha.');
 });

 const logout = () => {
  setUser(null);
  setDrafts({});
  setIntent('personal');
  setCategory('Todas');
  setParticipantsInput('');
  setEventDateInput('');
  setPickupEventId(null);
  setSelectedProductId(null);
  setPageHistory(['Início']);
  setEmail('');
  setPassword('');
  setForm('');
  setModal('');
 };
 const openProduct = (product: Product) => {
  if (!user) return;
  setSelectedProductId(product.id);
  setSelectedContext(purchaseContext);
  setModal('Detalhes do produto');
 };

 const confirmProductDeletion = (product: Product) => {
  if (!user || !ownsProduct(user, product)) return;
  showAlert('Excluir produto', 'O produto será removido do catálogo.', [
   { text: 'Cancelar', style: 'cancel' },
   {
    text: 'Excluir', style: 'destructive', onPress: () => {
     setProducts(current => current.filter(item => item.id !== product.id));
     setSelectedProductId(null);
     setModal('');
     say('Produto excluído.');
    },
   },
  ]);
 };

 const addProduct = () => {
  if (!form.trim() || !price.trim() || !newProductCategory) {
   showAlert('Preencha nome, preço e categoria'); return;
  }
  setProducts([{ id: randomUUID(), name: form.trim(), price: price.trim(), owner: user?.name || 'Minha loja',
   ownerEmail: user?.email, image: photo, category: newProductCategory,
   demonstration: demoUsers.some(account => account.email === user?.email) }, ...products]);
  setForm(''); setPrice(''); setPhoto(undefined); setNewProductCategory(undefined); setModal(''); say('Produto publicado!');
 };
 const saveProductReview = (productId: string, rating: Rating, comment: string) => {
  if (!user) return;
  const review = { authorEmail: user.email, authorName: user.name, rating, comment };
  setProducts(current => current.map(product => product.id === productId
   ? { ...product, reviews: [review, ...(product.reviews ?? []).filter(item => item.authorEmail !== user.email)] }
   : product));
 };

 const choosePhoto=async()=>{const r=await ImagePicker.launchImageLibraryAsync({mediaTypes:['images'],quality:.75});if(!r.canceled)setPhoto(r.assets[0].uri)};
 const [eventPlace, setEventPlace] = useState('');
 const addEvent=()=>{if(!form.trim()){showAlert('Informe o título do evento');return}setEvents(currentEvents => [{title:form.trim(),date:'Data a definir',place:eventPlace.trim() || 'São Luís'}, ...currentEvents]);setForm('');setModal('');navigateTo('Eventos');say('Evento cadastrado.')};
 const open=(title:string, place = '')=>{setForm('');setEventPlace(place);setModal(title)};
 const register = ({ company, name: inputName, email: inputEmail, password, document }: RegistrationValues) => changeAccount(async () => {
  const name = inputName.trim();
  const registeredEmail = inputEmail.trim().toLowerCase();
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registeredEmail) || !password) {
   showAlert('Complete seus dados', 'Informe o nome, um e-mail válido e uma senha.');
   return;
  }
  const verified = validDocument(document, company);
  if (!verified) {
   showAlert(company ? 'CNPJ inválido' : 'CPF inválido', 'Confira o documento informado.');
   return;
  }
  if (registeredEmail === legacyAdminEmail || [...demoUsers, ...community.accounts].some(account => account.email === registeredEmail)) {
   showAlert('E-mail já cadastrado');
   return;
  }

  const profile: User = { name, email: registeredEmail, role: 'publico', company, documentLastFour: verified.slice(-4) };
  const passwordVerifier = await createPasswordVerifier(password);
  const nextCommunity = { ...community, accounts: [...community.accounts, { ...profile, passwordVerifier }] };
  await persistence.current.catch(() => {});
  await AsyncStorage.setItem('firmina-state', JSON.stringify({ user: profile, products, events, community: nextCommunity }));
  setCommunity(nextCommunity);
  enter(profile);
 });

 const openSellerRegistration = (registration: SellerRegistration | null = null) => {
  if (user?.role !== 'admin') return;
  setEditingSeller(registration);
  open('Validar vendedora');
 };

 const saveSellerRegistration = (registration: SellerRegistration) => changeAccount(async () => {
  if (user?.role !== 'admin') return;
  const existing = community.sellerRegistrations.some(record => record.code === registration.code);
  if ((existing && !editingSeller) || (editingSeller && editingSeller.code !== registration.code)) {
   showAlert('Código já cadastrado', 'Abra o cadastro existente para atualizar os dados.');
   return;
  }

  const sellerRegistrations = existing
   ? community.sellerRegistrations.map(record => record.code === registration.code ? registration : record)
   : [registration, ...community.sellerRegistrations];
  const nextCommunity = { ...community, sellerRegistrations };
  await persistence.current.catch(() => {});
  await AsyncStorage.setItem('firmina-state', JSON.stringify({ user, products, events, community: nextCommunity }));
  setCommunity(nextCommunity);
  setExpandedSellerCode(registration.code);
  setModal('');
  navigateTo('Vendedoras');
  say(existing ? 'Cadastro atualizado.' : 'Cadastro validado e salvo.');
 });

 const deleteAccount = () => changeAccount(async () => {
  if (!user) return;
  const nextCommunity = deleteLocalAccount(community, user.email);
  const nextProducts = products.filter(product => !ownsProduct(user, product)).map(product =>
   product.reviews ? { ...product, reviews: product.reviews.filter(review => review.authorEmail !== user.email) } : product);
  await persistence.current.catch(() => {});
  await AsyncStorage.setItem('firmina-state', JSON.stringify({
   user: null, products: nextProducts, events, community: nextCommunity,
  }));
  setCommunity(nextCommunity);
  setProducts(nextProducts);
  logout();
  say('Conta excluída deste dispositivo.');
 });

 const submitPartnership = () => {
  if (!user?.company || !form.trim()) {
   showAlert('Descreva sua proposta de parceria');
   return;
  }
  const request = {
   id: randomUUID(), email: user.email, companyName: user.name, proposal: form.trim(), status: 'pendente' as const,
  };
  setCommunity(current => {
   const alreadyOpen = current.partnerships.some(item =>
    item.email === user.email && ['pendente', 'aprovada', 'em execução'].includes(item.status));
   return alreadyOpen ? current : { ...current, partnerships: [request, ...current.partnerships] };
  });
  setModal('');
  say('Proposta registrada neste dispositivo.');
 };

 const deletePartnership = (id: string) => {
  if (!user?.company) return;
  const companyEmail = user.email;
  showAlert('Excluir chamado', 'O chamado será removido deste dispositivo.', [
   { text: 'Cancelar', style: 'cancel' },
   { text: 'Excluir chamado', style: 'destructive', onPress: () => {
    setCommunity(current => ({
     ...current,
     partnerships: current.partnerships.filter(request => request.id !== id || request.email !== companyEmail),
    }));
    say('Chamado excluído.');
   } },
  ]);
 };

 const updatePartnership = (id: string, status: PartnershipStatus) => {
  if (user?.role !== 'admin') return;
  setCommunity(current => ({
   ...current,
   partnerships: current.partnerships.map(item =>
    item.id === id && partnershipActions[item.status].some(action => action.status === status)
     ? { ...item, status }
     : item),
  }));
 };

 if (!hasStarted) return <WelcomeScreen onStart={() => setHasStarted(true)} />;
 if(!ready)return <SafeAreaView style={{flex:1,backgroundColor:C.cream}}/>;
 if(!user)return <SafeAreaView style={{flex:1,backgroundColor:C.cream}}><KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':undefined} style={{flex:1}}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[{flexGrow:1,justifyContent:'center',padding:26},webLogin]}><BackLink label="Voltar para a página inicial" onPress={goBack}/><View style={{alignItems:'center',marginBottom:30}}><View style={styles.mark}><Text style={{fontSize:31,color:C.white}}>✿</Text></View><Text style={styles.logo}>Firmina</Text><Text style={styles.tag}>FEITO POR MULHERES. FEITO EM SÃO LUÍS.</Text></View><Text style={styles.h1}>Entre na sua conta</Text>{toast !== '' && <Text accessibilityLiveRegion="polite" style={styles.sub}>{toast}</Text>}<Text style={styles.sub}>Acesse a comunidade de empreendedoras de São Luís.</Text><TextInput placeholder="E-mail" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} style={styles.input}/><TextInput placeholder="Senha" secureTextEntry value={password} onChangeText={setPassword} style={styles.input}/><Button title={authBusy ? 'Entrando…' : 'Entrar'} disabled={authBusy} onPress={()=>login()}/><TouchableOpacity onPress={()=>open('Criar conta')} style={{padding:14,alignItems:'center'}}><Text style={{color:C.purple,fontWeight:'700'}}>Criar conta</Text></TouchableOpacity><TouchableOpacity onPress={()=>showAlert('Recuperar senha','Para esta demonstração, use uma das contas abaixo.')} style={{alignItems:'center',padding:6}}><Text style={{color:C.muted}}>Esqueci minha senha</Text></TouchableOpacity><View style={styles.demo}><Text style={styles.section}>CONTAS DE DEMONSTRAÇÃO</Text>{demoAccounts.map(a=><TouchableOpacity key={a.email} accessibilityRole="button" accessibilityLabel={'Entrar como ' + a.name + ' — ' + demoAccountType(a)} disabled={authBusy} onPress={()=>login(a.email,demoPassword)} style={[styles.demoRow,{flexDirection:'row',alignItems:'center',gap:12}]}>{profileImage(a) ? <Image source={profileImage(a)} accessibilityLabel={'Foto de perfil de '+a.name} style={{width:42,height:42,borderRadius:21}} /> : <View style={styles.avatar}><Text style={{color:C.plum,fontWeight:'800'}}>{a.name.charAt(0)}</Text></View>}<View style={{flex:1}}><View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:8}}><Text style={{color:C.ink,fontWeight:'600',flexShrink:1}}>{a.name}</Text><Text style={{color:C.purple,fontSize:10,fontWeight:'700',textAlign:'right'}}>{demoAccountType(a)}</Text></View><Text style={{color:C.muted,fontSize:12}}>{a.email === 'iema@firmina.app' ? 'IEMA@firmina.app' : a.email} • toque para entrar</Text></View></TouchableOpacity>)}{removedDemoAccounts.length > 0 && <View style={{ marginTop: 12 }}>
 <Text style={styles.sub}>Contas de demonstração removidas deste dispositivo. Restaurar o acesso não recupera dados excluídos.</Text>
 {removedDemoAccounts.map(account => <Button key={account.email}
  title={'Restaurar ' + demoAccountType(account).toLowerCase()} secondary disabled={authBusy}
  onPress={() => restoreDemoAccount(account.email)} />)}
</View>}<Text style={{fontSize:12,color:C.muted,marginTop:4}}>Senha: {demoPassword}</Text></View></ScrollView></KeyboardAvoidingView>{modal === 'Criar conta' && <Modal visible transparent animationType="slide"
  onRequestClose={() => { if (!authBusy) setModal(''); }}>
  <View style={styles.scrim}><View style={[styles.sheet, webSheet, { maxHeight: '92%' }]}>
   <RegistrationForm busy={authBusy} onRegister={register} onCancel={() => setModal('')} />
  </View></View>
 </Modal>}</SafeAreaView>;
 const admin=user.role==='admin',seller=user.role==='empreendedora';
 const nav=admin?['Painel','Vendedoras','Eventos','Chamados','Mapa']:seller?['Início','Produtos','Eventos','Chat','Perfil']:['Início','Catálogo','Eventos','Parcerias','Chat','Perfil'];
 const activePartnerships = community.partnerships.filter(request => request.status === 'em execução' || request.status === 'concluída');
 const ownRequests = community.partnerships.filter(request => request.email === user.email);
 const ownRequest = ownRequests[0];
 const hasOpenRequest = ownRequests.some(request => ['pendente', 'aprovada', 'em execução'].includes(request.status));
 const openPartnership = () => navigateTo('Parceria com a SEMMU');
 const openSemmuContact = () => {
  void Linking.openURL(semmuContact).catch(() => showAlert('Não foi possível abrir o contato da SEMMU'));
 };
 const partners = new Map([
  ['Grupo Mateus', 'Apoio a feiras e pontos de exposição.'],
  ['Sebrae Maranhão', 'Formação e fortalecimento de negócios locais.'],
  ['Shopping da Ilha', 'Espaço para produtos feitos no Maranhão.'],
 ]);
 activePartnerships.forEach(request => { if (!partners.has(request.companyName)) partners.set(request.companyName, request.proposal); });
 const roleLabel = admin ? 'Equipe SEMMU' : seller ? 'Empreendedora' :
  user.company ? (ownRequest?.status === 'em execução' ? 'Empresa parceira' : 'Empresa') : 'Conta da comunidade';
 const contacts = [...demoAccounts, ...community.accounts]
  .filter(contact => contact.email !== user.email && contact.role === (seller ? 'publico' : 'empreendedora'))
  .map(contact => ({
   user: contact, lastMessage: community.conversations[conversationKey(user.email, contact.email)]?.at(-1)?.text,
  }));
 const thread = page.startsWith('Chat:') ? contacts.find(contact => contact.user.email === page.slice(5))?.user : undefined;
 const threadKey = thread && conversationKey(user.email, thread.email);
 const openConversation = (contactEmail: string) => navigateTo('Chat:' + contactEmail);
 const contactProductOwner = (product: Product) => {
  const owner = productSeller(product, accounts);
  if (!owner || isDemonstration(product) || owner.email === user.email) return;
  if (selectedContext.intent === 'event' && (!selectedContext.date || !selectedContext.participants ||
   !eventDate(displayDate(selectedContext.date)))) {
   showAlert('Confira os dados do evento', 'Informe uma data válida e o número de participantes na vitrine.');
   return;
  }
  if (selectedContext.fair) {
   const fair = events.find(event => event.id === selectedContext.fair?.id);
   if (!fair || !pickupProducts(fair, products, accounts).some(item => item.id === product.id)) {
    showAlert('Retirada indisponível', 'O vínculo de retirada nesta feira não está mais confirmado.'); return;
   }
  }
  const key = conversationKey(user.email, owner.email);
  const draft = inquiryDraft(product, owner, selectedContext);
  setDrafts(current => ({ ...current, [key]: current[key] && current[key] !== draft ? current[key] + '\n\n' + draft : draft }));
  setModal('');
  openConversation(owner.email);
 };
 const openPickup = (event: Event) => {
  if (!pickupProducts(event, products, accounts).length) return;
  setPickupEventId(event.id!);
  setCategory('Todas');
  navigateTo('Catálogo');
 };
 const canPickup = (event: Event) => pickupProducts(event, products, accounts).length > 0;
 const availableProducts = pickupEvent ? pickupProducts(pickupEvent, products, accounts) :
  intent === 'event' ? prioritizeEventOffers(products.filter(product => suitableForEvent(product) && productSeller(product, accounts))) : products;
 const filteredProducts = availableProducts.filter(product => category === 'Todas' || productCategory(product) === category);
 const storefrontProducts = page === 'Início' && category === 'Todas' ? balancedHighlights(filteredProducts) :
  page === 'Início' ? filteredProducts.slice(0, 4) : filteredProducts;
 const storefrontHeading = category === 'Todas' ? (intent === 'event' ? 'Alimentação e lembranças para seu evento' : 'Peças, presentes e sabores para você') : occasionHeadings[intent][category];
 const selectedSeller = selectedProduct && productSeller(selectedProduct, accounts);
 const selectedCopy = selectedProduct && productCopy(selectedProduct);
 const selectedEstimate = selectedProduct && selectedContext.intent === 'event' ? eventEstimate(selectedProduct, selectedContext.participants) : undefined;
 const eventDataMissing = selectedContext.intent === 'event' && (!selectedContext.date || !selectedContext.participants);
 const activePage = thread ? 'Chat' : page;
 const selectedProductPhoto = selectedProduct ? productImageSource(selectedProduct) : undefined;
 const heading=thread?.name ?? (admin && page === 'Painel' ? 'Painel administrativo' : page==='Início' ? 'Olá, '+user.name.split(' ')[0]+' 👋' : page);
 return <SafeAreaView style={[{flex:1,backgroundColor:C.cream},webDashboard,page === 'Mapa de São Luís' && Platform.OS === 'web' && {maxWidth:1440}]}><View style={styles.top}><View><Text style={styles.brandSmall}>✿ Firmina</Text><Text style={styles.role}>{roleLabel.toUpperCase()}</Text></View><TouchableOpacity style={styles.avatar} onPress={()=>navigateTo('Perfil')} accessibilityLabel="Abrir perfil">{profileImage(user) ? <Image source={profileImage(user)} accessibilityLabel={'Foto de perfil de '+user.name} style={{width:40,height:40,borderRadius:20}} /> : <Text style={{color:C.plum,fontWeight:'800'}}>{user.name.charAt(0)}</Text>}</TouchableOpacity></View><ScrollView keyboardShouldPersistTaps="handled" scrollEnabled={Platform.OS === 'web' || page !== 'Mapa de São Luís' || !mapGestureActive} contentContainerStyle={{padding:20,paddingBottom:120}}><BackLink onPress={goBack}/><Text style={styles.h1}>{heading}</Text>
 {['Início', 'Catálogo'].includes(page) && <>
  {pickupEvent ? <Card>
   <Text style={styles.h2}>Retirada na {pickupEvent.title}</Text>
   <Text style={styles.sub}>{pickupEvent.date} · {pickupEvent.place}</Text>
   <Button title="Ver todo o catálogo" secondary onPress={() => setPickupEventId(null)} />
   <CategoryFilter value={category} onChange={setCategory} />
  </Card> : <PurchaseControls intent={intent} onIntent={setIntent} category={category} onCategory={setCategory}
   dateInput={eventDateInput} onDate={setEventDateInput} participantsInput={participantsInput} onParticipants={setParticipantsInput} />}
  {page === 'Início' && user.company && <Card>
   <Text style={styles.h2}>Parceria com a SEMMU</Text><Button title="Quero fazer parte" onPress={openPartnership} />
  </Card>}
  {seller && <Button title="＋ Cadastrar produto" onPress={() => open('Novo produto')} />}
  <Text style={[styles.h2, { marginTop: 20 }]}>{pickupEvent ? 'Produtos com retirada confirmada' : storefrontHeading}</Text>
  {storefrontProducts.some(isDemonstration) && <Text style={styles.sub}>Os produtos identificados como demonstração não estão disponíveis para encomenda.</Text>}
  <ProductList data={storefrontProducts} onSelect={openProduct} intent={pickupEvent ? 'personal' : intent} />
  {!storefrontProducts.length && <Text style={styles.sub}>{intent === 'event' && !pickupEvent
   ? 'Ainda não há ofertas confirmadas para grupos nesta seleção. Quantidades e capacidade precisam ser informadas pelas empreendedoras.'
   : 'Nenhum produto disponível nesta seleção.'}</Text>}
  {page === 'Início' && <><Text style={styles.section}>PRÓXIMOS EVENTOS</Text>
   <EventList events={events.slice(0, 2)} canPickup={canPickup} onPickup={openPickup} />
   <Button title="Ver eventos" secondary onPress={() => navigateTo('Eventos')} /></>}
 </>}
 {page === 'Produtos' && <><Text style={styles.sub}>Seus produtos publicados</Text>
  {seller && <Button title="＋ Cadastrar produto" onPress={() => open('Novo produto')} />}
  <ProductList data={products.filter(product => ownsProduct(user, product))} onSelect={openProduct} />
 </>}
 {page==='Eventos'&&<><Text style={styles.sub}>Oficinas e encontros que aproximam negócios e comunidade.</Text>{admin&&<Button title="＋ Cadastrar evento" onPress={()=>open('Novo evento')}/ >}<EventList events={events} canPickup={canPickup} onPickup={openPickup} admin={admin} onCancel={(idx:number)=>{setEvents(events.map((e,i)=>i===idx?{...e,cancelled:true}:e));say('Cancelamento avisado às contas.')}}/></>}
 {page === 'Parcerias' && <>
  {user.company && <Button title="Quero fazer parte" onPress={openPartnership} />}
  {Array.from(partners, ([name, description]) => <Card key={name}><Text style={styles.h2}>{name}</Text><Text style={styles.sub}>{description}</Text></Card>)}
 </>}
 {user.company && page === 'Parceria com a SEMMU' && <>
  <Card>
   <Text style={styles.h2}>Contato oficial</Text>
   <Text style={styles.sub}>gabinete@semmu.saoluis.ma.gov.br · (98) 99183-8954</Text>
   <Button title="Ver canais de contato da SEMMU" secondary onPress={openSemmuContact} />
  </Card>
  <Button title="Abrir chamado" disabled={hasOpenRequest} onPress={() => open('Abrir chamado')} />
  {ownRequests.map(request => <Card key={request.id}>
   <Text style={styles.h2}>{partnershipLabels[request.status]}</Text>
   <Text style={styles.sub}>{request.proposal}</Text>
   <Button title="Excluir chamado" danger onPress={() => deletePartnership(request.id)} />
  </Card>)}
 </>}
 {!admin && page === 'Chat' && <ConversationList contacts={contacts} onOpen={openConversation} />}
 {!admin && thread && threadKey && <DirectConversation key={threadKey} contactName={thread.name} ownEmail={user.email}
  messages={community.conversations[threadKey] ?? []}
  draft={drafts[threadKey] ?? ''} onDraftChange={draft => setDrafts(current => ({ ...current, [threadKey]: draft }))}
  onMessage={text => setCommunity(current => ({
   ...current,
   conversations: {
    ...current.conversations,
    [threadKey]: [...(current.conversations[threadKey] ?? []), { sender: user.email, text }],
   },
  }))} />}
 {page==='Perfil'&&<><Card><Text style={styles.h2}>{user.name}</Text><Text style={styles.sub}>{user.email}</Text><Text style={styles.sub}>{roleLabel}</Text>{user.documentLastFour && <Text style={styles.sub}>{user.company ? 'CNPJ' : 'CPF'} ••••{user.documentLastFour}</Text>}</Card>{seller&&<Card><Text style={styles.h2}>Sobre meu trabalho</Text><TextInput placeholder="Qualificações, história e especialidades" multiline style={[styles.input,{height:90}]}/><Button title="Salvar perfil" onPress={()=>say('Perfil atualizado')}/></Card>}<Button title="Sair da conta" secondary onPress={logout}/><Button title="Excluir conta" danger onPress={() => open('Excluir conta')}/></>}
 {admin && page === 'Painel' && <>
  <View style={styles.stats}>
   <Stat n="24" label="Empreendedoras"/><Stat n="38" label="Produtos"/><Stat n="3" label="Eventos ativos"/>
  </View>
  <Button title="＋ Cadastrar vendedora" onPress={() => openSellerRegistration()} />
  <Button title="Acessar mapa da SEMMU" onPress={() => navigateTo('Mapa')} />
  <Button title="Conferir chamados" secondary onPress={() => navigateTo('Chamados')} />
  <Card>
   <Text style={styles.h2}>Atividade recente</Text>
   <Text style={styles.sub}>{community.partnerships.filter(request => request.status === 'pendente').length} chamados aguardando análise</Text>
   <Text style={styles.sub}>Próximo evento: Feira Mulheres que Fazem</Text>
  </Card>
  <Button title="Ver catálogo" secondary onPress={() => navigateTo('Catálogo')} />
  <Text style={styles.section}>EM DESTAQUE</Text>
  <ProductList data={balancedHighlights(products)} onSelect={openProduct} />
  <Text style={styles.section}>PRÓXIMOS EVENTOS</Text>
  <EventList events={events.slice(0, 2)} />
 </>}
 {admin && page === 'Vendedoras' && <>
  <Button title="＋ Validar e cadastrar" onPress={() => openSellerRegistration()} />
  {community.sellerRegistrations.map(registration => {
   const expanded = expandedSellerCode === registration.code;
   return <Card key={registration.code}>
    <Text style={styles.h2}>{registration.name}</Text>
    <Text style={styles.sub}>Cadastro validado</Text>
    {expanded && <>
     <SellerRegistrationDetails registration={registration} />
     <Button title="Editar cadastro" secondary onPress={() => openSellerRegistration(registration)} />
    </>}
    <Button title={expanded ? 'Ocultar dados' : 'Consultar cadastro'} secondary
     onPress={() => setExpandedSellerCode(expanded ? null : registration.code)} />
   </Card>;
  })}
  {['Maria Firmina • Centro','Rita Costa • Anjo da Guarda','Lúcia Santos • Cohab'].map(name =>
   <Card key={name}><Text style={styles.h2}>{name}</Text><Text style={styles.sub}>Cadastro validado • Em atividade</Text></Card>)}
 </>}
 {admin && page === 'Chamados' && <>
  {community.partnerships.length === 0 && <Text style={styles.sub}>Nenhuma proposta recebida.</Text>}
  {community.partnerships.map(request => <Card key={request.id}>
   <Text style={styles.h2}>{request.companyName}</Text>
   <Text style={styles.sub}>{request.proposal}</Text>
   <Text style={styles.sub}>{partnershipLabels[request.status]}</Text>
   {partnershipActions[request.status].map(action => <Button key={action.status} title={action.label} secondary
    onPress={() => updatePartnership(request.id, action.status)} />)}
  </Card>)}
 </>}
 {admin && page === 'Mapa' && <SemmuMap onPlanEvent={place => open('Novo evento', place)} onViewMap={() => navigateTo('Mapa de São Luís')} />}
 {admin && page === 'Mapa de São Luís' && <SaoLuisMap onGestureChange={setMapGestureActive} />}
 {toast!==''&&<View style={styles.toast}><Text style={{color:C.white,fontWeight:'700'}}>{toast}</Text></View>}</ScrollView><View style={styles.nav}>{nav.map(n=><TouchableOpacity key={n} onPress={()=>navigateTo(n)} style={styles.navItem}><Text style={{fontSize:19,color:activePage===n?C.purple:C.muted}}>{({Início:'⌂',Catálogo:'▦',Produtos:'▧',Eventos:'◷',Parcerias:'♡',Chat:'◌',Perfil:'◎',Painel:'▤',Vendedoras:'♙',Chamados:'✉',Mapa:'⌖'} as any)[n]}</Text><Text style={{fontSize:10,color:activePage===n?C.purple:C.muted,fontWeight:activePage===n?'800':'500'}}>{n}</Text></TouchableOpacity>)}</View>
 <Modal visible={!!modal} transparent animationType="slide" onRequestClose={()=>{if(!authBusy)setModal('')}}><View style={styles.scrim}><View style={[styles.sheet,webSheet,(modal === 'Validar vendedora' || modal === 'Detalhes do produto') && { maxHeight: '94%' }]}><Text style={styles.h2}>{modal === 'Validar vendedora' && editingSeller ? 'Editar cadastro da vendedora' : modal}</Text>{modal === 'Abrir chamado' && user.company ? <>
 <TextInput accessibilityLabel="Proposta de parceria" placeholder="Descreva a atividade, o local e como sua empresa pode colaborar"
  value={form} onChangeText={setForm} maxLength={700} multiline style={[styles.input, { minHeight: 110, textAlignVertical: 'top' }]} />
 <Button title="Enviar proposta" onPress={submitPartnership} />
</> : modal === 'Excluir conta' ? <>
 <Text style={styles.sub}>Esta ação remove sua conta, suas conversas, seus chamados e seus produtos cadastrados neste dispositivo.</Text>
 <Button title={authBusy ? 'Excluindo…' : 'Confirmar exclusão'} danger disabled={authBusy} onPress={deleteAccount} />
</> : modal === 'Detalhes do produto' && selectedProduct ? <ScrollView keyboardShouldPersistTaps="handled">
 {selectedProductPhoto && <Image source={selectedProductPhoto} accessibilityLabel={'Foto de ' + selectedProduct.name}
  resizeMode="contain" style={[styles.productImage, { height: 200, marginBottom: 12 }]} />}
 <Text style={styles.h2}>{selectedProduct.name}</Text>
 <Text style={styles.sub}>Vendido por {selectedProduct.owner}</Text>
 {selectedCopy && <><Text style={styles.h2}>{selectedCopy.headline}</Text><Text style={styles.sub}>{selectedCopy.description}</Text></>}
 <Text style={styles.h2}>{selectedProduct.priceOnRequest ? 'Valor sob orçamento' : 'R$ ' + selectedProduct.price}{selectedProduct.saleUnit && !selectedProduct.priceOnRequest ? ' / ' + selectedProduct.saleUnit : ''}</Text>
 <ProductFacts product={selectedProduct} />
 {selectedContext.intent === 'event' && <>
  <Text style={styles.sub}>Evento: {selectedContext.date ? displayDate(selectedContext.date) : 'data não informada'} · {selectedContext.participants ?? 'número de'} participantes</Text>
  {selectedEstimate ? <Text style={styles.sub}>Estimativa: {selectedEstimate.quantity} × {selectedProduct.saleUnit} · {money(selectedEstimate.total)}. Produção e entrega sujeitas à confirmação.</Text> :
   <Text style={styles.sub}>Consulte quantidade, composição e valor para seu grupo.</Text>}
 </>}
 {selectedContext.fair && <Text style={styles.sub}>Retirada: {selectedContext.fair.title} · {displayDate(selectedContext.fair.startsAt)} · {selectedContext.fair.place}</Text>}
 {ownsProduct(user, selectedProduct) &&
  <Button title="Excluir produto" danger onPress={() => confirmProductDeletion(selectedProduct)} />}
 {isDemonstration(selectedProduct) ? <Text style={styles.sub}>Produto de demonstração. Não disponível para encomenda.</Text> :
  user.role === 'publico' && (selectedSeller ? eventDataMissing ? <Button title="Informar dados do evento"
   onPress={() => { setModal(''); navigateTo('Catálogo'); }} /> :
   <><Text style={styles.sub}>Revise e envie sua consulta no chat. A disponibilidade será confirmada pela empreendedora.</Text>
    <Button title={selectedContext.fair ? 'Combinar retirada no chat' : 'Consultar no chat'} onPress={() => contactProductOwner(selectedProduct)} /></> :
   <Text style={styles.sub}>O contato desta empreendedora ainda não está disponível no chat.</Text>)}
 <ProductReviews key={selectedProduct.id} reviews={selectedProduct.reviews ?? []} authorEmail={user.email}
  onSave={(rating, comment) => saveProductReview(selectedProduct.id, rating, comment)} />
</ScrollView> : modal==='Novo produto'?<><Text style={styles.sub}>Categoria do produto</Text><CategoryFilter value={newProductCategory} onChange={setNewProductCategory} required /><TextInput placeholder="Nome do produto" value={form} onChangeText={setForm} style={styles.input}/><TextInput placeholder="Preço (R$)" value={price} onChangeText={setPrice} keyboardType="decimal-pad" style={styles.input}/><TouchableOpacity onPress={choosePhoto} style={styles.photo}><Text style={{color:C.purple,fontWeight:'700'}}>{photo?'Foto selecionada':'＋ Adicionar foto'}</Text></TouchableOpacity><Button title="Publicar produto" onPress={addProduct}/></>:modal==='Novo evento'?<><TextInput placeholder="Nome do evento ou oficina" value={form} onChangeText={setForm} style={styles.input}/><TextInput accessibilityLabel="Local do evento" placeholder="Local do evento" value={eventPlace} onChangeText={setEventPlace} style={styles.input}/><Button title="Cadastrar evento" onPress={addEvent}/></>:modal === 'Validar vendedora' && admin ?
 <SellerRegistrationForm initial={editingSeller} busy={authBusy} onSave={saveSellerRegistration} />
 : null}<TouchableOpacity disabled={authBusy} onPress={()=>setModal('')} style={{padding:16,alignItems:'center'}}><Text style={{color:C.purple}}>{modal === 'Detalhes do produto' ? 'Fechar' : 'Cancelar'}</Text></TouchableOpacity></View></View></Modal></SafeAreaView>
}
function Button({ title, onPress, secondary = false, danger = false, disabled = false }: {
 title: string; onPress: () => void; secondary?: boolean; danger?: boolean; disabled?: boolean;
}) {
 return (
  <TouchableOpacity accessibilityRole="button" onPress={onPress} disabled={disabled}
   style={[styles.button, secondary && { backgroundColor: C.white, borderWidth: 1, borderColor: C.line },
    danger && { backgroundColor: '#FBE9EA', borderWidth: 1, borderColor: '#E7AFB4' }, disabled && { opacity: 0.5 }]}>
   <Text style={[styles.buttonText, secondary && { color: C.plum }, danger && { color: '#A32235' }]}>{title}</Text>
  </TouchableOpacity>
 );
}
function Card({children}:any){return <View style={styles.card}>{children}</View>}
function Stat({n,label}:any){return <View style={styles.stat}><Text style={{fontSize:22,fontWeight:'900',color:C.purple}}>{n}</Text><Text style={{fontSize:11,color:C.muted}}>{label}</Text></View>}
function CategoryFilter(props: {
 required: true; value?: Category; onChange: (category: Category) => void;
} | {
 required?: false; value: Category | 'Todas'; onChange: (category: Category | 'Todas') => void;
}) {
 const options = props.required ? categories : ['Todas' as const, ...categories];
 return <View style={{ flexDirection: 'row', gap: 8, marginVertical: 8 }}>
  {options.map(option => <TouchableOpacity key={option} accessibilityRole="button" accessibilityState={{ selected: props.value === option }}
   onPress={() => { if (option !== 'Todas') props.onChange(option); else if (!props.required) props.onChange(option); }}
   style={[styles.choice, props.value === option && styles.choiceSelected]}>
   <Text style={styles.choiceText}>{option}</Text>
  </TouchableOpacity>)}
 </View>;
}
function PurchaseControls({ intent, onIntent, category, onCategory, dateInput, onDate, participantsInput, onParticipants }: {
 intent: PurchaseIntent; onIntent: (intent: PurchaseIntent) => void;
 category: Category | 'Todas'; onCategory: (category: Category | 'Todas') => void;
 dateInput: string; onDate: (date: string) => void; participantsInput: string; onParticipants: (value: string) => void;
}) {
 const participants = participantCount(participantsInput);
 return <View>
  <View style={{ flexDirection: 'row', gap: 8, marginVertical: 12 }}>
   {(['personal', 'event'] as const).map(option => <TouchableOpacity key={option} accessibilityRole="button"
    accessibilityState={{ selected: intent === option }} onPress={() => onIntent(option)}
    style={[styles.choice, intent === option && styles.choiceSelected]}>
    <Text style={styles.choiceText}>{option === 'personal' ? 'Comprar para mim' : 'Comprar para um evento'}</Text>
   </TouchableOpacity>)}
  </View>
  {intent === 'event' && <View>
   <Text style={styles.sub}>Conte sobre seu evento para consultar alimentação e lembranças.</Text>
   <Text style={styles.fieldLabel}>Data do evento (DD/MM/AAAA)</Text>
   <TextInput accessibilityLabel="Data do evento (DD/MM/AAAA)" placeholder="DD/MM/AAAA" value={dateInput}
    onChangeText={onDate} maxLength={10} style={styles.input} />
   {dateInput !== '' && !eventDate(dateInput) && <Text style={styles.fieldHelp}>Informe uma data válida, de hoje em diante, no formato DD/MM/AAAA.</Text>}
   <Text style={styles.fieldLabel}>Número de participantes</Text>
   <TextInput accessibilityLabel="Número de participantes" placeholder="Quantas pessoas?" value={participantsInput}
    onChangeText={onParticipants} keyboardType="number-pad" maxLength={9} style={styles.input} />
   {participantsInput !== '' && !participants && <Text style={styles.fieldHelp}>Informe um número inteiro maior que zero.</Text>}
   {participants && <View style={{ flexDirection: 'row', gap: 8, marginVertical: 8 }}>
    <TouchableOpacity accessibilityRole="button" onPress={() => onCategory('Gastronomia')} style={styles.choice}>
     <Text style={styles.choiceText}>Montar o café para {participants} {participants === 1 ? 'pessoa' : 'pessoas'}</Text>
    </TouchableOpacity>
    <TouchableOpacity accessibilityRole="button" onPress={() => onCategory('Artesanato')} style={styles.choice}>
     <Text style={styles.choiceText}>Escolher lembranças para {participants} {participants === 1 ? 'convidado' : 'convidados'}</Text>
    </TouchableOpacity>
   </View>}
  </View>}
  <CategoryFilter value={category} onChange={onCategory} />
 </View>;
}
function ProductFacts({ product }: { product: Product }) {
 const details = [
  ...practicalFacts(product),
  product.dimensions && 'Medidas: ' + product.dimensions,
  product.length && 'Comprimento: ' + product.length,
  product.models?.length && 'Modelos: ' + product.models.join(', '),
  product.flavors?.length && 'Sabores: ' + product.flavors.join(', '),
  product.composition && 'Composição: ' + product.composition,
  positiveInteger(product.unitsPerSale) && product.saleUnit && product.unitsPerSale + ' unidades por ' + product.saleUnit,
  positiveInteger(product.minimumOrder) && product.saleUnit && 'Pedido mínimo: ' + product.minimumOrder + ' × ' + product.saleUnit,
  positiveInteger(product.orderMultiple) && product.saleUnit && 'Pedidos em múltiplos de ' + product.orderMultiple + ' × ' + product.saleUnit,
  product.deliveryTerms,
 ].filter((text): text is string => typeof text === 'string' && text.length > 0);
 return <>
  {details.map((text, index) => <Text key={index} style={styles.sub}>{text}</Text>)}
  {product.photos?.map((photo, index) => <View key={index}>
   <Image source={{ uri: photo.uri }} accessibilityLabel={photo.caption} resizeMode="contain"
    style={[styles.productImage, { height: 220 }]} />
   <Text style={styles.sub}>{photo.caption}</Text>
  </View>)}
 </>;
}
function ProductList({ data, onSelect, intent = 'personal' }: {
 data: Product[]; onSelect: (product: Product) => void; intent?: PurchaseIntent;
}) {
 return <View style={styles.grid}>{data.map(product => {
  const photo = productImageSource(product);
  const copy = productCopy(product);
  const practical = practicalFacts(product)[0];
  const headline = intent === 'event' && product.eventOffer ? eventOfferCopy[product.eventOffer] : copy?.headline;
  return <View key={product.id} style={styles.product}>
   <TouchableOpacity accessibilityRole="button" accessibilityLabel={product.name}
    onPress={() => onSelect(product)} style={{ flex: 1 }}>
    {photo ? <Image source={photo} accessibilityLabel={'Foto de ' + product.name}
     resizeMode={copy?.id === 'demo-bolsa' ? 'contain' : 'cover'} style={styles.productImage} /> :
     <View style={[styles.productImage, { backgroundColor: '#F1E6F2', alignItems: 'center', justifyContent: 'center' }]}>
      <Text style={{ color: C.plum, textAlign: 'center' }}>Foto não disponível</Text>
     </View>}
    <Text style={{ fontWeight: '700', color: C.ink, marginTop: 8 }}>{product.name}</Text>
    {headline && <Text style={{ color: C.plum, lineHeight: 20, marginVertical: 6 }}>{headline}</Text>}
    <Text style={{ color: '#61586A', fontSize: 12 }}>{product.owner}</Text>
    <Text style={{ fontWeight: '900', color: C.purple, marginTop: 4 }}>
     {product.priceOnRequest ? 'Valor sob orçamento' : 'R$ ' + product.price}
     {!product.priceOnRequest && product.saleUnit ? ' / ' + product.saleUnit : ''}
    </Text>
    {practical && <Text style={styles.fieldHelp}>{practical}</Text>}
    {!!product.reviews?.length && <ProductRating reviews={product.reviews} />}
    {isDemonstration(product) && <Text style={styles.fieldHelp}>Demonstração</Text>}
   </TouchableOpacity>
   <TouchableOpacity accessibilityRole="button" onPress={() => onSelect(product)}
    style={[styles.button, { minHeight: 64, justifyContent: 'center', paddingHorizontal: 8, marginBottom: 0 }]}>
    <Text style={[styles.buttonText, { textAlign: 'center', fontSize: 14 }]}>{copy?.button ?? (intent === 'event' ? 'Consultar oferta' : 'Ver detalhes')}</Text>
   </TouchableOpacity>
  </View>;
 })}</View>;
}
function EventList({ events, admin, onCancel, canPickup, onPickup }: {
 events: Event[]; admin?: boolean; onCancel?: (index: number) => void;
 canPickup?: (event: Event) => boolean; onPickup?: (event: Event) => void;
}) {
 return <>{events.map((event, index) => <Card key={event.id ?? index}>
  <View style={{ flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
   <Text style={{ fontSize: 12, color: event.cancelled ? '#AA3838' : C.purple, fontWeight: '800' }}>{event.cancelled ? 'CANCELADO' : 'EVENTO / OFICINA'}</Text>
   <Text style={{ color: C.muted, fontSize: 12 }}>{event.date}</Text>
  </View>
  <Text style={styles.h2}>{event.title}</Text><Text style={styles.sub}>⌖ {event.place}</Text>
  {!admin && onPickup && canPickup?.(event) && <Button title="Ver o que posso retirar na feira" secondary onPress={() => onPickup(event)} />}
  {admin && !event.cancelled && onCancel && <Button title="Cancelar evento" secondary
   onPress={() => showAlert('Cancelar evento', 'As contas cadastradas serão avisadas.', [{ text: 'Voltar' }, { text: 'Confirmar', onPress: () => onCancel(index) }])} />}
 </Card>)}</>;
}
const styles:any={
 choice:{flex:1,minHeight:52,justifyContent:'center',alignItems:'center',padding:10,borderRadius:12,backgroundColor:C.white,borderWidth:1,borderColor:'#DED0E0'},
 choiceSelected:{backgroundColor:'#F1E6F2',borderColor:C.purple},
 choiceText:{color:C.plum,fontWeight:'700',textAlign:'center',lineHeight:20},
 fieldLabel:{color:C.ink,fontWeight:'700',marginTop:8},
 fieldHelp:{color:'#61586A',fontSize:12,lineHeight:18,marginTop:5},
mark:{width:64,height:64,borderRadius:22,backgroundColor:C.purple,alignItems:'center',justifyContent:'center'},logo:{fontSize:40,fontWeight:'900',color:C.plum,letterSpacing:-2},tag:{fontSize:9,color:C.purple,fontWeight:'800',letterSpacing:1},h1:{fontSize:27,color:C.ink,fontWeight:'900',marginBottom:6},h2:{fontSize:18,color:C.ink,fontWeight:'800',marginBottom:6},sub:{color:C.muted,lineHeight:20,marginBottom:13},input:{backgroundColor:C.white,borderColor:C.line,borderWidth:1,borderRadius:13,padding:15,marginVertical:6,color:C.ink},button:{backgroundColor:C.purple,padding:15,borderRadius:14,alignItems:'center',marginVertical:8},buttonText:{color:C.white,fontWeight:'800',fontSize:15},demo:{backgroundColor:C.white,borderRadius:16,padding:16,marginTop:22},demoRow:{paddingVertical:9,borderBottomWidth:1,borderColor:C.line},section:{fontSize:12,fontWeight:'900',color:C.plum,letterSpacing:1,marginTop:20,marginBottom:10},top:{paddingHorizontal:20,paddingVertical:12,flexDirection:'row',alignItems:'center',justifyContent:'space-between',backgroundColor:C.cream},brandSmall:{fontWeight:'900',fontSize:20,color:C.plum},role:{fontSize:9,color:C.purple,letterSpacing:1,fontWeight:'800'},avatar:{width:40,height:40,borderRadius:20,backgroundColor:C.yellow,alignItems:'center',justifyContent:'center'},grid:{flexDirection:'row',flexWrap:'wrap',justifyContent:'space-between'},product:{width:'48%',backgroundColor:C.white,borderRadius:16,padding:10,marginBottom:12},productImage:{width:'100%',height:140,borderRadius:12},card:{backgroundColor:C.white,borderRadius:16,padding:16,marginVertical:7,borderWidth:1,borderColor:C.line},stats:{flexDirection:'row',gap:8,marginVertical:10},stat:{flex:1,backgroundColor:C.white,borderRadius:14,padding:12,alignItems:'center'},nav:{position:'absolute',bottom:0,left:0,right:0,backgroundColor:C.white,flexDirection:'row',justifyContent:'space-around',paddingTop:10,paddingBottom:12,borderTopWidth:1,borderColor:C.line},navItem:{alignItems:'center',gap:3,flex:1},scrim:{flex:1,backgroundColor:'#0008',justifyContent:'flex-end'},sheet:{backgroundColor:C.cream,borderTopLeftRadius:24,borderTopRightRadius:24,padding:22,paddingBottom:34},photo:{padding:14,borderWidth:1,borderColor:C.purple,borderStyle:'dashed',borderRadius:12,alignItems:'center',marginVertical:8},toast:{position:'absolute',bottom:16,alignSelf:'center',backgroundColor:C.ink,padding:13,borderRadius:12},mapRow:{flexDirection:'row',justifyContent:'space-between',paddingVertical:12,borderTopWidth:1,borderColor:C.line}};
