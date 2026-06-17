// ============================================================
//  DENTSUS V7 XMD — plugins/group/admin.js
//  22 commands
// ============================================================

const { registerPlugin } = global;
const { isGroupAdmin, isBotAdmin } = require('../../lib/utils');
const { getGroupSettings, setGroupSetting } = require('../../lib/database');

async function requireGroup(ctx) {
  if (!ctx.isGroup) { await ctx.reply('❌ Commande réservée aux groupes.'); return false; }
  return true;
}
async function requireAdmin(ctx) {
  if (!await requireGroup(ctx)) return false;
  const isAdmin = ctx.isOwner || await isGroupAdmin(ctx.sock, ctx.jid, ctx.sender);
  if (!isAdmin) { await ctx.reply('❌ Réservé aux admins du groupe.'); return false; }
  return true;
}
async function requireBotAdmin(ctx) {
  if (!await isBotAdmin(ctx.sock, ctx.jid)) {
    await ctx.reply('❌ Le bot doit être admin du groupe pour cette commande.');
    return false;
  }
  return true;
}

function getMentionedJids(msg) {
  return msg.message?.extendedTextMessage?.contextInfo?.mentionedJid ||
         msg.message?.contextInfo?.mentionedJid || [];
}

registerPlugin('kick', async (ctx) => {
  if (!await requireAdmin(ctx)) return;
  if (!await requireBotAdmin(ctx)) return;
  const targets = getMentionedJids(ctx.msg);
  if (!targets.length) return ctx.reply('❌ Mentionne quelqu\'un avec @. Ex: .kick @user');
  for (const t of targets) {
    await ctx.sock.groupParticipantsUpdate(ctx.jid, [t], 'remove').catch(() => {});
  }
  await ctx.reply(`✅ ${targets.length} membre(s) exclu(s).`);
});

registerPlugin('add', async (ctx) => {
  if (!await requireAdmin(ctx)) return;
  if (!await requireBotAdmin(ctx)) return;
  const num = ctx.args[0]?.replace(/\D/g, '');
  if (!num) return ctx.reply('❌ Usage: .add <numéro>');
  const jidToAdd = `${num}@s.whatsapp.net`;
  const res = await ctx.sock.groupParticipantsUpdate(ctx.jid, [jidToAdd], 'add').catch(e => ({ error: e }));
  if (res?.error) return ctx.reply(`❌ Impossible d'ajouter ${num}: ${res.error.message}`);
  await ctx.reply(`✅ ${num} ajouté avec succès !`);
});

registerPlugin('promote', async (ctx) => {
  if (!await requireAdmin(ctx)) return;
  if (!await requireBotAdmin(ctx)) return;
  const targets = getMentionedJids(ctx.msg);
  if (!targets.length) return ctx.reply('❌ Mentionne quelqu\'un.');
  await ctx.sock.groupParticipantsUpdate(ctx.jid, targets, 'promote');
  await ctx.reply(`✅ ${targets.length} membre(s) promu(s) admin.`);
});

registerPlugin('demote', async (ctx) => {
  if (!await requireAdmin(ctx)) return;
  if (!await requireBotAdmin(ctx)) return;
  const targets = getMentionedJids(ctx.msg);
  if (!targets.length) return ctx.reply('❌ Mentionne quelqu\'un.');
  await ctx.sock.groupParticipantsUpdate(ctx.jid, targets, 'demote');
  await ctx.reply(`✅ ${targets.length} membre(s) rétrogradé(s).`);
});

registerPlugin('mute', async (ctx) => {
  if (!await requireAdmin(ctx)) return;
  if (!await requireBotAdmin(ctx)) return;
  await ctx.sock.groupSettingUpdate(ctx.jid, 'announcement');
  await ctx.reply('🔇 Groupe mis en silencieux. Seuls les admins peuvent écrire.');
});

registerPlugin('unmute', async (ctx) => {
  if (!await requireAdmin(ctx)) return;
  if (!await requireBotAdmin(ctx)) return;
  await ctx.sock.groupSettingUpdate(ctx.jid, 'not_announcement');
  await ctx.reply('🔊 Groupe rouvert. Tout le monde peut écrire.');
});

registerPlugin('open', async (ctx) => {
  if (!await requireAdmin(ctx)) return;
  if (!await requireBotAdmin(ctx)) return;
  await ctx.sock.groupSettingUpdate(ctx.jid, 'not_announcement');
  await ctx.reply('🔓 Groupe ouvert à tous.');
});

registerPlugin('close', async (ctx) => {
  if (!await requireAdmin(ctx)) return;
  if (!await requireBotAdmin(ctx)) return;
  await ctx.sock.groupSettingUpdate(ctx.jid, 'announcement');
  await ctx.reply('🔒 Groupe fermé. Seuls les admins peuvent écrire.');
});

registerPlugin('revoke', async (ctx) => {
  if (!await requireAdmin(ctx)) return;
  if (!await requireBotAdmin(ctx)) return;
  const code = await ctx.sock.groupInviteCode(ctx.jid);
  await ctx.sock.revokeGroupInviteLink(ctx.jid);
  const newCode = await ctx.sock.groupInviteCode(ctx.jid);
  await ctx.reply(`🔄 Lien réinitialisé !\n\nNouveau lien:\nhttps://chat.whatsapp.com/${newCode}`);
});

registerPlugin('setname', async (ctx) => {
  if (!await requireAdmin(ctx)) return;
  if (!await requireBotAdmin(ctx)) return;
  const name = ctx.args.join(' ');
  if (!name) return ctx.reply('❌ Usage: .setname <nouveau nom>');
  await ctx.sock.groupUpdateSubject(ctx.jid, name);
  await ctx.reply(`✅ Nom du groupe changé en: *${name}*`);
});

registerPlugin('setdesc', async (ctx) => {
  if (!await requireAdmin(ctx)) return;
  if (!await requireBotAdmin(ctx)) return;
  const desc = ctx.args.join(' ');
  if (!desc) return ctx.reply('❌ Usage: .setdesc <description>');
  await ctx.sock.groupUpdateDescription(ctx.jid, desc);
  await ctx.reply(`✅ Description du groupe mise à jour.`);
});

registerPlugin('invite', async (ctx) => {
  if (!await requireGroup(ctx)) return;
  try {
    const code = await ctx.sock.groupInviteCode(ctx.jid);
    await ctx.reply(`🔗 *Lien d'invitation :*\nhttps://chat.whatsapp.com/${code}`);
  } catch {
    await ctx.reply('❌ Impossible d\'obtenir le lien. Le bot doit être admin.');
  }
});

registerPlugin('listmembers', async (ctx) => {
  if (!await requireGroup(ctx)) return;
  const meta = await ctx.sock.groupMetadata(ctx.jid);
  const members = meta.participants;
  const text = `👥 *Membres du groupe (${members.length})*\n\n` +
    members.map((m, i) => `${i + 1}. @${m.id.split('@')[0]}${m.admin ? ' 👑' : ''}`).join('\n');
  await ctx.sock.sendMessage(ctx.jid, { text, mentions: members.map(m => m.id) }, { quoted: ctx.msg });
});

registerPlugin('listadmins', async (ctx) => {
  if (!await requireGroup(ctx)) return;
  const meta   = await ctx.sock.groupMetadata(ctx.jid);
  const admins = meta.participants.filter(p => p.admin);
  const text   = `👑 *Admins du groupe (${admins.length})*\n\n` +
    admins.map((a, i) => `${i + 1}. @${a.id.split('@')[0]}`).join('\n');
  await ctx.sock.sendMessage(ctx.jid, { text, mentions: admins.map(a => a.id) }, { quoted: ctx.msg });
});

registerPlugin('tagall', async (ctx) => {
  if (!await requireAdmin(ctx)) return;
  const meta    = await ctx.sock.groupMetadata(ctx.jid);
  const mention = meta.participants.map(p => p.id);
  const extra   = ctx.args.join(' ') || '';
  const text    = (extra ? `📢 *${extra}*\n\n` : '📢 *Attention tout le monde !*\n\n') +
    mention.map(j => `@${j.split('@')[0]}`).join(' ');
  await ctx.sock.sendMessage(ctx.jid, { text, mentions: mention }, { quoted: ctx.msg });
});

registerPlugin('hidetag', async (ctx) => {
  if (!await requireAdmin(ctx)) return;
  const meta    = await ctx.sock.groupMetadata(ctx.jid);
  const mention = meta.participants.map(p => p.id);
  const text    = ctx.args.join(' ') || '👁️ Message invisible.';
  await ctx.sock.sendMessage(ctx.jid, { text, mentions: mention }, { quoted: ctx.msg });
});

registerPlugin('groupinfo', async (ctx) => {
  if (!await requireGroup(ctx)) return;
  const meta = await ctx.sock.groupMetadata(ctx.jid);
  const admins = meta.participants.filter(p => p.admin).length;
  await ctx.reply(
    `ℹ️ *INFOS DU GROUPE*\n\n` +
    `📛 *Nom :* ${meta.subject}\n` +
    `🆔 *JID :* ${ctx.jid}\n` +
    `👥 *Membres :* ${meta.participants.length}\n` +
    `👑 *Admins :* ${admins}\n` +
    `📅 *Créé le :* ${new Date(meta.creation * 1000).toLocaleDateString('fr-FR')}\n` +
    `📝 *Description :* ${meta.desc || 'Aucune'}`
  );
});

registerPlugin('antilink', async (ctx) => {
  if (!await requireAdmin(ctx)) return;
  if (!await requireGroup(ctx)) return;
  const gs  = getGroupSettings(ctx.jid);
  const val = gs.antilink ? 0 : 1;
  setGroupSetting(ctx.jid, 'antilink', val);
  await ctx.reply(`🔗 Anti-lien : ${val ? '✅ Activé' : '❌ Désactivé'}`);
});

registerPlugin('antispam', async (ctx) => {
  if (!await requireAdmin(ctx)) return;
  if (!await requireGroup(ctx)) return;
  const gs  = getGroupSettings(ctx.jid);
  const val = gs.antispam ? 0 : 1;
  setGroupSetting(ctx.jid, 'antispam', val);
  await ctx.reply(`🚫 Anti-spam : ${val ? '✅ Activé' : '❌ Désactivé'}`);
});

registerPlugin('welcome', async (ctx) => {
  if (!await requireAdmin(ctx)) return;
  if (!await requireGroup(ctx)) return;
  const gs  = getGroupSettings(ctx.jid);
  const val = gs.welcome ? 0 : 1;
  setGroupSetting(ctx.jid, 'welcome', val);
  await ctx.reply(`👋 Message de bienvenue : ${val ? '✅ Activé' : '❌ Désactivé'}`);
});

registerPlugin('setwelcome', async (ctx) => {
  if (!await requireAdmin(ctx)) return;
  if (!await requireGroup(ctx)) return;
  const msg = ctx.args.join(' ');
  if (!msg) return ctx.reply('❌ Usage: .setwelcome <message>\nUtilise {name} pour le prénom.');
  setGroupSetting(ctx.jid, 'welcome', 1);
  setGroupSetting(ctx.jid, 'welcome_msg', msg);
  await ctx.reply(`✅ Message de bienvenue défini:\n${msg}`);
});

registerPlugin('goodbye', async (ctx) => {
  if (!await requireAdmin(ctx)) return;
  if (!await requireGroup(ctx)) return;
  const gs  = getGroupSettings(ctx.jid);
  const val = gs.goodbye ? 0 : 1;
  setGroupSetting(ctx.jid, 'goodbye', val);
  await ctx.reply(`👋 Message d'au revoir : ${val ? '✅ Activé' : '❌ Désactivé'}`);
});
