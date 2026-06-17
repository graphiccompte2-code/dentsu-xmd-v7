// ============================================================
//  DENTSUS V7 XMD — plugins/notes/notes.js
//  15 commands
// ============================================================

const { registerPlugin } = global;
const db = require('../../lib/database');
const { isGroupAdmin } = require('../../lib/utils');

registerPlugin('note', async ({ sender, args, reply }) => {
  if (args.length < 2) return reply('❌ Usage: .note <titre> <contenu>');
  const [title, ...contentParts] = args;
  const content = contentParts.join(' ');
  db.addNote(sender, title, content);
  await reply(`✅ Note *"${title}"* sauvegardée.`);
});

registerPlugin('notes', async ({ sender, reply }) => {
  const notes = db.getNotes(sender);
  if (!notes.length) return reply('📝 Tu n\'as aucune note. Crée-en une avec .note <titre> <contenu>');
  const text = `📝 *TES NOTES (${notes.length}) :*\n\n` +
    notes.map((n, i) => `${i + 1}. *[${n.id}] ${n.title}*\n   ${n.content.slice(0, 60)}${n.content.length > 60 ? '...' : ''}`).join('\n\n');
  await reply(text);
});

registerPlugin('listnotes', async ({ sender, reply }) => {
  const notes = db.getNotes(sender);
  if (!notes.length) return reply('📝 Aucune note.');
  await reply(`📝 *Notes :*\n\n` + notes.map((n, i) => `${i + 1}. [ID:${n.id}] *${n.title}*`).join('\n'));
});

registerPlugin('delnote', async ({ sender, args, reply }) => {
  const id = parseInt(args[0]);
  if (!id) return reply('❌ Usage: .delnote <id>');
  const res = db.deleteNote(sender, id);
  if (res.changes === 0) return reply('❌ Note introuvable.');
  await reply(`🗑️ Note #${id} supprimée.`);
});

registerPlugin('todo', async ({ sender, args, reply }) => {
  const task = args.join(' ');
  if (!task) return reply('❌ Usage: .todo <tâche>');
  db.addTodo(sender, task);
  await reply(`✅ Tâche ajoutée : *${task}*`);
});

registerPlugin('listtodo', async ({ sender, reply }) => {
  const todos = db.getTodos(sender);
  if (!todos.length) return reply('📋 Aucune tâche en cours. Ajoute-en avec .todo <tâche>');
  await reply(`📋 *TES TÂCHES :*\n\n` + todos.map(t => `[ ] [ID:${t.id}] ${t.task}`).join('\n'));
});

registerPlugin('deltodo', async ({ sender, args, reply }) => {
  const id = parseInt(args[0]);
  if (!id) return reply('❌ Usage: .deltodo <id>');
  db.doneTodo(sender, id);
  await reply(`✅ Tâche #${id} marquée comme terminée.`);
});

registerPlugin('reminder', async ({ reply }) => {
  await reply('⏰ *Rappels :*\nFonctionnalité bientôt disponible.\nEn attendant, utilise .todo pour noter tes tâches.');
});

const activePolls = new Map();

registerPlugin('poll', async ({ sock, msg, jid, args, reply }) => {
  if (args.length < 3) return reply('❌ Usage: .poll <Question> | <Option1> | <Option2> ...\nEx: .poll Couleur préférée? | Rouge | Bleu | Vert');
  const full  = args.join(' ');
  const parts = full.split('|').map(s => s.trim()).filter(Boolean);
  if (parts.length < 3) return reply('❌ Minimum 1 question et 2 options. Sépare avec |');
  const [question, ...options] = parts;
  const pollMsg = await sock.sendMessage(jid, {
    poll: { name: question, values: options, selectableCount: 1 },
  }, { quoted: msg });
  activePolls.set(jid, { question, options, votes: {}, msgId: pollMsg.key.id });
  await reply(`📊 Sondage créé : *${question}*`);
});

registerPlugin('vote', async ({ reply }) => {
  await reply('📊 Pour voter, utilise la commande .poll dans un groupe et réponds directement au sondage WhatsApp.');
});

registerPlugin('feedback', async ({ sock, msg, jid, sender, pushName, args }) => {
  const text = args.join(' ');
  if (!text) return sock.sendMessage(jid, { text: '❌ Usage: .feedback <message>' }, { quoted: msg });
  const config = require('../../config');
  for (const ownerNum of config.OWNER) {
    const ownerJid = `${ownerNum}@s.whatsapp.net`;
    await sock.sendMessage(ownerJid, {
      text: `💬 *Feedback de ${pushName} (+${sender.split('@')[0]}) :*\n\n${text}`,
    }).catch(() => {});
  }
  await sock.sendMessage(jid, { text: '✅ Feedback envoyé au propriétaire. Merci !' }, { quoted: msg });
});

registerPlugin('report', async ({ sock, msg, jid, sender, pushName, args }) => {
  const text = args.join(' ');
  if (!text) return sock.sendMessage(jid, { text: '❌ Usage: .report <problème>' }, { quoted: msg });
  const config = require('../../config');
  for (const ownerNum of config.OWNER) {
    const ownerJid = `${ownerNum}@s.whatsapp.net`;
    await sock.sendMessage(ownerJid, {
      text: `🚨 *Rapport de bug de ${pushName} :*\n\n${text}\n\nGroupe: ${jid}`,
    }).catch(() => {});
  }
  await sock.sendMessage(jid, { text: '✅ Rapport envoyé. Merci !' }, { quoted: msg });
});

const groupRules = new Map();

registerPlugin('rules', async ({ jid, isGroup, reply }) => {
  if (!isGroup) return reply('❌ Commande réservée aux groupes.');
  const rules = groupRules.get(jid) || db.getSetting(`rules_${jid}`);
  if (!rules) return reply('📜 Aucune règle définie. Un admin peut en créer avec .setrules');
  await reply(`📜 *RÈGLES DU GROUPE :*\n\n${rules}`);
});

registerPlugin('announce', async ({ sock, msg, jid, sender, isGroup, args, reply }) => {
  if (!isGroup) return reply('❌ Commande réservée aux groupes.');
  const isAdmin = require('../../lib/utils').isOwner(sender) || await isGroupAdmin(sock, jid, sender);
  if (!isAdmin) return reply('❌ Réservé aux admins.');
  const text = args.join(' ');
  if (!text) return reply('❌ Usage: .announce <message>');
  await sock.sendMessage(jid, { text: `📢 *ANNONCE*\n\n${text}` }, { quoted: msg });
});

registerPlugin('tagannounce', async ({ sock, msg, jid, sender, isGroup, args, reply }) => {
  if (!isGroup) return reply('❌ Commande réservée aux groupes.');
  const isAdmin = require('../../lib/utils').isOwner(sender) || await isGroupAdmin(sock, jid, sender);
  if (!isAdmin) return reply('❌ Réservé aux admins.');
  const text = args.join(' ');
  if (!text) return reply('❌ Usage: .tagannounce <message>');
  const meta    = await sock.groupMetadata(jid);
  const mention = meta.participants.map(p => p.id);
  await sock.sendMessage(jid, {
    text: `📢 *ANNONCE*\n\n${text}\n\n${mention.map(j => `@${j.split('@')[0]}`).join(' ')}`,
    mentions: mention,
  }, { quoted: msg });
});
