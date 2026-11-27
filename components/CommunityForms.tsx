import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { Message, User } from '../lib/localCommunity';

export type RegistrationValues = { name: string; email: string; password: string; document: string; company: boolean };

export function RegistrationForm({ busy, onRegister, onCancel }: {
 busy: boolean;
 onRegister: (values: RegistrationValues) => void;
 onCancel: () => void;
}) {
 const [company, setCompany] = useState(false);
 const [name, setName] = useState('');
 const [email, setEmail] = useState('');
 const [password, setPassword] = useState('');
 const [document, setDocument] = useState('');

 return (
  <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.registration}>
   <Text style={styles.heading}>Criar conta</Text>
   <View style={styles.choiceRow}>
    {[false, true].map(option => (
     <Pressable key={String(option)} accessibilityRole="radio" accessibilityState={{ checked: company === option }}
      disabled={busy} onPress={() => { setCompany(option); setDocument(''); }}
      style={[styles.choice, option === company && styles.selected]}>
      <Text style={styles.actionText}>{option ? 'Empresa' : 'Pessoa'}</Text>
     </Pressable>
    ))}
   </View>
   <TextInput accessibilityLabel={company ? 'Nome da empresa' : 'Nome completo'} placeholder={company ? 'Nome da empresa' : 'Nome completo'}
    value={name} onChangeText={setName} maxLength={100} style={styles.input} />
   <TextInput accessibilityLabel={company ? 'CNPJ' : 'CPF'} placeholder={company ? 'CNPJ' : 'CPF'}
    key={String(company)} value={document} onChangeText={setDocument} maxLength={company ? 18 : 14}
    keyboardType={company ? 'default' : 'number-pad'} autoCapitalize="characters" autoCorrect={false} style={styles.input} />
   <TextInput accessibilityLabel="E-mail do cadastro" placeholder="E-mail" value={email} onChangeText={setEmail}
    autoCapitalize="none" keyboardType="email-address" autoCorrect={false} style={styles.input} />
   <TextInput accessibilityLabel="Senha do cadastro" placeholder="Senha" value={password} onChangeText={setPassword}
    maxLength={128} secureTextEntry style={styles.input} />
   <Pressable accessibilityRole="button" disabled={busy}
    onPress={() => onRegister({ company, name, email, password, document })} style={styles.primary}>
    <Text style={styles.primaryText}>{busy ? 'Cadastrando…' : 'Criar conta'}</Text>
   </Pressable>
   <Pressable accessibilityRole="button" disabled={busy} onPress={onCancel} style={styles.choice}>
    <Text style={styles.actionText}>Cancelar</Text>
   </Pressable>
  </ScrollView>
 );
}

type Contact = Pick<User, 'name' | 'email' | 'role' | 'company'>;

export function ConversationList({ contacts, onOpen }: {
 contacts: { user: Contact; lastMessage?: string }[];
 onOpen: (email: string) => void;
}) {
 return (
  <View style={styles.chatList}>
   {contacts.length === 0 && <Text style={styles.muted}>Nenhum contato disponível.</Text>}
   {contacts.map(({ user, lastMessage }) => (
    <Pressable key={user.email} accessibilityRole="button" accessibilityLabel={'Conversar com ' + user.name}
     onPress={() => onOpen(user.email)} style={styles.contact}>
     {contactAvatar(user) ? <Image source={contactAvatar(user)} accessibilityLabel={'Foto de perfil de ' + user.name} style={styles.avatar} /> :
      <View style={styles.avatar}><Text style={styles.actionText}>{user.name.charAt(0).toUpperCase()}</Text></View>}
     <View style={styles.contactLabel}>
      <Text style={styles.heading}>{user.name}</Text>
      <Text numberOfLines={1} style={styles.muted}>
       {lastMessage || (user.role === 'empreendedora' ? 'Empreendedora' : user.company ? 'Empresa' : 'Compradora')}
      </Text>
     </View>
     <Text style={styles.actionText}>›</Text>
    </Pressable>
   ))}
  </View>
 );
}

function contactAvatar(user: Contact) {
 if (user.email === 'iema@firmina.app') return require('../docs/logo IEMA.jpeg');
 if (user.email === 'compradora@firmina.app') return require('../docs/foto mulher compradora.jpg');
 if (user.email === 'empreendedora@firmina.app') return require('../docs/mulhere empreendedora.png');
 return undefined;
}

export function DirectConversation({ contactName, ownEmail, messages, onMessage, draft, onDraftChange }: {
 contactName: string;
 ownEmail: string;
 messages: Message[];
 onMessage: (text: string) => void;
 draft: string;
 onDraftChange: (draft: string) => void;
}) {
 const text = draft.trim();

 return (
  <View style={styles.chatList}>
   <View style={styles.thread}>
    {messages.length === 0 && <Text style={styles.muted}>Comece a conversa com {contactName}.</Text>}
    {messages.map((message, index) => (
     <View key={index} style={[styles.bubble, message.sender === ownEmail && styles.ownBubble]}>
      <Text style={styles.message}>{message.text}</Text>
     </View>
    ))}
   </View>
   <Text style={styles.muted}>Revise a mensagem antes de enviar. Neste protótipo, o chat salva mensagens apenas neste dispositivo; não confirma uma compra.</Text>
   <View style={styles.composer}>
    <TextInput accessibilityLabel="Escreva uma mensagem" placeholder="Escreva uma mensagem" value={draft}
     onChangeText={onDraftChange} maxLength={1000} multiline style={[styles.input, styles.messageInput]} />
    <Pressable accessibilityRole="button" accessibilityLabel="Enviar mensagem" disabled={!text}
     onPress={() => { onMessage(text); onDraftChange(''); }} style={[styles.primary, !text && styles.disabled]}>
     <Text style={styles.primaryText}>Enviar</Text>
    </Pressable>
   </View>
  </View>
 );
}

const styles = StyleSheet.create({
 heading: { color: '#212B36', fontSize: 17, fontWeight: '800' },
 registration: { gap: 9, paddingBottom: 8 },
 choiceRow: { flexDirection: 'row', gap: 8 },
 choice: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', minHeight: 44, borderRadius: 10, paddingHorizontal: 10, backgroundColor: '#FFFFFF' },
 selected: { backgroundColor: '#F1E6F2', borderColor: '#80297D', borderWidth: 1 },
 input: { minHeight: 46, borderRadius: 12, padding: 12, borderColor: '#DED0E0', borderWidth: 1, backgroundColor: '#FFFFFF', color: '#212B36' },
 primary: { minHeight: 44, justifyContent: 'center', alignItems: 'center', borderRadius: 12, backgroundColor: '#80297D', paddingHorizontal: 16 },
 primaryText: { color: '#FFFFFF', fontWeight: '800' },
 actionText: { color: '#3D1A4F', fontWeight: '800' },
 disabled: { opacity: 0.5 },
 chatList: { gap: 10, marginTop: 6 },
 contact: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FFFFFF', borderRadius: 13, padding: 13 },
 contactLabel: { flex: 1, gap: 3 },
 muted: { color: '#61586A', fontSize: 14, lineHeight: 20 },
 avatar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F1E6F2' },
 thread: { backgroundColor: '#F1E6F2', gap: 9, minHeight: 140, borderRadius: 15, padding: 14 },
 bubble: { alignSelf: 'flex-start', maxWidth: '86%', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 11 },
 ownBubble: { alignSelf: 'flex-end', backgroundColor: '#FDE997' },
 message: { color: '#212B36', fontSize: 14, lineHeight: 20 },
 composer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
 messageInput: { flex: 1, maxHeight: 112 },
});
