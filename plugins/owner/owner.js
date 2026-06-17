// ============================================================
//  DENTSUS V7 XMD — plugins/owner/owner.js
//  18 commands — réservés au(x) propriétaire(s)
// ============================================================

const { registerPlugin } = global;

function ownerOnly(ctx, fn) {
  if (!ctx.isOwner) return ctx.reply('❌ Commande réservée au propriétaire.');
  return fn(ctx);
}

registerPlugin('broadcast', (ctx) => ownerOnly(ctx, async ({ sock, args, reply }) => {
  const text = args.join(' ');
  if (!text) return reply('❌ Usage: .broadcast <message>');
  const chats = await sock.groupFetchAllParticipating().catch(() => ({}));
  let count   = 0;
  for (const jid of Object.keys(chats)) {
    try { await sock.sendMessage(jid, { text: `📢 *ANNONCE :*\n\n${text}` }); count++; } catch {}
    await new Promise(r => setTimeout(r, 500));
  }
  await reply(`✅ Message envoyé à ${count} groupe(s).`);
}));

registerPlugin('bc', (ctx) => ownerOnly(ctx, async ({ sock, args, reply }) => {
  const text = args.join(' ');
  if (!text) return reply('❌ Usage: .bc <message>');
  const chats = await sock.groupFetchAllParticipating().catch(() => ({}));
  let count = 0;
  for (const jid of Object.keys(chats)) {
    try { await sock.sendMessage(jid, { text }); count++; } catch {}
    await new Promise(r => setTimeout(r, 500));
  }
  await reply(`✅ Envoyé à ${count} groupe(s).`);
}));

registerPlugin('block', (ctx) => ownerOnly(ctx, async ({ sock, msg, jid, args }) => {
  const targets = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
  const num     = args[0]?.replace(/\D/g, '');
  const toBlock = targets[0] || (num ? `${num}@s.whatsapp.net` : null);
  if (!toBlock) return ctx.reply('❌ Mentionne ou donne un numéro.');
  await sock.updateBlockStatus(toBlock, 'block');
  await ctx.reply(`🚫 ${toBlock.split('@')[0]} bloqué.`);
}));

registerPlugin('unblock', (ctx) => ownerOnly(ctx, async ({ sock, msg, jid, args }) => {
  const targets = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
  const num     = args[0]?.replace(/\D/g, '');
  const toUnblock = targets[0] || (num ? `${num}@s.whatsapp.net` : null);
  if (!toUnblock) return ctx.reply('❌ Mentionne ou donne un numéro.');
  await sock.updateBlockStatus(toUnblock, 'unblock');
  await ctx.reply(`✅ ${toUnblock.split('@')[0]} débloqué.`);
}));

registerPlugin('ban', (ctx) => ownerOnly(ctx, async ({ msg, args, reply }) => {
  const targets = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
  const target  = targets[0];
  if (!target) return reply('❌ Mentionne quelqu\'un.');
  const { banUser } = require('../../lib/database');
  const reason = args.slice(1).join(' ') || 'No reason';
  banUser(target, reason);
  await reply(`🔨 ${target.split('@')[0]} banni du bot. Raison: ${reason}`);
}));

registerPlugin('unban', (ctx) => ownerOnly(ctx, async ({ msg, args, reply }) => {
  const targets = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
  const target  = targets[0] || (args[0]?.replace(/\D/g, '') ? `${args[0].replace(/\D/g, '')}@s.whatsapp.net` : null);
  if (!target) return reply('❌ Mentionne quelqu\'un.');
  const { unbanUser } = require('../../lib/database');
  unbanUser(target);
  await reply(`✅ ${target.split('@')[0]} débanni du bot.`);
}));

registerPlugin('listblock', (ctx) => ownerOnly(ctx, async ({ sock, reply }) => {
  try {
    const blocked = await sock.fetchBlocklist();
    if (!blocked.length) return reply('📋 Aucun contact bloqué.');
    await reply(`🚫 *Contacts bloqués (${blocked.length}) :*\n\n${blocked.map(j => `• ${j.split('@')[0]}`).join('\n')}`);
  } catch (e) {
    await reply(`❌ Erreur: ${e.message}`);
  }
}));

registerPlugin('eval', (ctx) => ownerOnly(ctx, async ({ args, sock, msg, jid, reply }) => {
  const code = args.join(' ');
  if (!code) return reply('❌ Usage: .eval <code JS>');
  try {
    let result = await eval(`(async () => { ${code} })()`);
    if (typeof result === 'object') result = JSON.stringify(result, null, 2);
    await reply(`✅ *Résultat :*\n\`\`\`\n${String(result).slice(0, 2000)}\n\`\`\``);
  } catch (e) {
    await reply(`❌ Erreur:\n${e.message}`);
  }
}));

registerPlugin('exec', (ctx) => ownerOnly(ctx, async ({ args, reply }) => {
  const { exec } = require('child_process');
  const command  = args.join(' ');
  if (!command) return reply('❌ Usage: .exec <commande shell>');
  exec(command, { timeout: 15000 }, (err, stdout, stderr) => {
    const out = stdout || stderr || err?.message || 'Pas de sortie';
    reply(`💻 *Shell :*\n\`\`\`\n${out.slice(0, 2000)}\n\`\`\``).catch(() => {});
  });
}));

registerPlugin('restart', (ctx) => ownerOnly(ctx, async ({ reply }) => {
  await reply('🔄 Redémarrage en cours...');
  setTimeout(() => process.exit(0), 1000);
}));

registerPlugin('shutdown', (ctx) => ownerOnly(ctx, async ({ reply }) => {
  await reply('🛑 Arrêt du bot...');
  setTimeout(() => process.exit(1), 1000);
}));

registerPlugin('setprefix', (ctx) => ownerOnly(ctx, async ({ args, reply }) => {
  const newPrefix = args[0];
  if (!newPrefix) return reply('❌ Usage: .setprefix <préfixe>');
  global.config.PREFIX = newPrefix;
  await reply(`✅ Préfixe changé en: *${newPrefix}*\n⚠️ Redémarre le bot pour rendre le changement permanent.`);
}));

registerPlugin('addowner', (ctx) => ownerOnly(ctx, async ({ args, reply }) => {
  const num = args[0]?.replace(/\D/g, '');
  if (!num) return reply('❌ Usage: .addowner <numéro>');
  if (!global.config.OWNER.includes(num)) global.config.OWNER.push(num);
  await reply(`✅ ${num} ajouté comme propriétaire (session uniquement).`);
}));

registerPlugin('removeowner', (ctx) => ownerOnly(ctx, async ({ args, reply }) => {
  const num = args[0]?.replace(/\D/g, '');
  if (!num) return reply('❌ Usage: .removeowner <numéro>');
  global.config.OWNER = global.config.OWNER.filter(n => n !== num);
  await reply(`✅ ${num} retiré des propriétaires.`);
}));

registerPlugin('cleardb', (ctx) => ownerOnly(ctx, async ({ reply }) => {
  const { db } = require('../../lib/database');
  db.prepare('DELETE FROM economy').run();
  db.prepare('DELETE FROM notes').run();
  db.prepare('DELETE FROM todos').run();
  await reply('🗑️ Base de données vidée (économie, notes, todos).');
}));

registerPlugin('update', (ctx) => ownerOnly(ctx, async ({ reply }) => {
  const { exec } = require('child_process');
  await reply('⬆️ Mise à jour en cours...');
  exec('git pull', { timeout: 30000 }, async (err, stdout) => {
    if (err) return reply(`❌ Erreur: ${err.message}`);
    await reply(`✅ *Mise à jour :*\n${stdout || 'Déjà à jour.'}`);
  });
}));

registerPlugin('log', (ctx) => ownerOnly(ctx, async ({ reply }) => {
  await reply(
    `📊 *STATS DU BOT*\n\n` +
    `📦 *Plugins :* ${global.plugins.size}\n` +
    `🌐 *Sessions actives :* ${global.sessions.size}\n` +
    `💾 *Mémoire :* ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1)} MB\n` +
    `⏱ *Uptime :* ${Math.floor(process.uptime() / 60)}m ${Math.floor(process.uptime() % 60)}s\n` +
    `🟢 *Node.js :* ${process.version}`
  );
}));

registerPlugin('setbotname', (ctx) => ownerOnly(ctx, async ({ args, reply }) => {
  const name = args.join(' ');
  if (!name) return reply('❌ Usage: .setbotname <nom>');
  global.config.BOT_NAME = name;
  await reply(`✅ Nom du bot changé en: *${name}*`);
}));
