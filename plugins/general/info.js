// ============================================================
//  DENTSUS V7 XMD — plugins/general/info.js
//  Commands: id, jid, time, date, runtime, version, speed,
//            serverinfo, myinfo, qr
// ============================================================

const { registerPlugin } = global;
const { msToHuman, fetchBuffer } = require('../../lib/utils');
const os = require('os');

registerPlugin('id', async ({ sock, msg, jid, sender, isGroup, reply }) => {
  await reply(
    `🆔 *INFORMATIONS*\n\n` +
    `👤 *Votre JID :* \`${sender}\`\n` +
    `📱 *Numéro :* ${sender.split('@')[0]}\n` +
    (isGroup ? `👥 *Groupe :* \`${jid}\`` : '')
  );
});

registerPlugin('jid', async ({ jid, isGroup, reply }) => {
  await reply(isGroup ? `👥 *JID Groupe :*\n\`${jid}\`` : `📱 *Votre JID :*\n\`${jid}\``);
});

registerPlugin('groupid', async ({ jid, isGroup, reply }) => {
  if (!isGroup) return reply('❌ Cette commande fonctionne uniquement dans un groupe.');
  await reply(`👥 *Group JID :*\n\`${jid}\``);
});

registerPlugin('time', async ({ reply }) => {
  const now = new Date();
  const options = { timeZone: 'Africa/Brazzaville', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
  await reply(`🕐 *Heure (Congo) :* ${now.toLocaleTimeString('fr-FR', options)}`);
});

registerPlugin('date', async ({ reply }) => {
  const now = new Date();
  const options = { timeZone: 'Africa/Brazzaville', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  await reply(`📅 *Date (Congo) :* ${now.toLocaleDateString('fr-FR', options)}`);
});

registerPlugin('runtime', async ({ reply }) => {
  const uptime = msToHuman(Date.now() - global.botStartTime);
  await reply(`⏱ *Uptime :* ${uptime}`);
});

registerPlugin('version', async ({ reply }) => {
  const config = require('../../config');
  await reply(`🔖 *${config.BOT_NAME}* — v${config.VERSION}`);
});

registerPlugin('speed', async ({ sock, msg, jid, reply }) => {
  const t1 = Date.now();
  await sock.sendMessage(jid, { text: '⚡ Test...' }, { quoted: msg });
  const ms = Date.now() - t1;
  await reply(`⚡ *Vitesse de réponse :* ${ms}ms\n${ms < 500 ? '🟢 Excellent' : ms < 1000 ? '🟡 Normal' : '🔴 Lent'}`);
});

registerPlugin('serverinfo', async ({ reply }) => {
  const totalMem = (os.totalmem() / 1024 / 1024).toFixed(0);
  const freeMem  = (os.freemem()  / 1024 / 1024).toFixed(0);
  const usedMem  = (totalMem - freeMem).toFixed(0);
  const cpu      = os.cpus()[0]?.model || 'Unknown';
  const platform = os.platform();
  const arch     = os.arch();
  const uptime   = msToHuman(os.uptime() * 1000);

  await reply(
    `🖥 *SERVER INFO*\n\n` +
    `💻 *OS :* ${platform} (${arch})\n` +
    `🔧 *CPU :* ${cpu}\n` +
    `💾 *RAM :* ${usedMem}MB / ${totalMem}MB\n` +
    `⏱ *Uptime serveur :* ${uptime}\n` +
    `🟢 *Node.js :* ${process.version}`
  );
});

registerPlugin('myinfo', async ({ sock, msg, jid, sender, pushName, reply }) => {
  let pp = null;
  try { pp = await sock.profilePictureUrl(sender, 'image'); } catch {}
  const text = `👤 *TON PROFIL*\n\n` +
    `📛 *Nom :* ${pushName}\n` +
    `📱 *Numéro :* +${sender.split('@')[0]}\n` +
    `🆔 *JID :* \`${sender}\``;
  if (pp) {
    const buf = await fetchBuffer(pp).catch(() => null);
    if (buf) return sock.sendMessage(jid, { image: buf, caption: text }, { quoted: msg });
  }
  await reply(text);
});

registerPlugin('qr', async ({ sock, msg, jid, args, reply }) => {
  const text = args.join(' ');
  if (!text) return reply(`❌ Usage: .qr <texte>`);
  const url = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(text)}`;
  const buf = await fetchBuffer(url);
  await sock.sendMessage(jid, { image: buf, caption: `🔲 *QR Code pour :* ${text}` }, { quoted: msg });
});

registerPlugin('qrcode', async ({ sock, msg, jid, args, reply }) => {
  const text = args.join(' ');
  if (!text) return reply(`❌ Usage: .qrcode <texte>`);
  const url = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(text)}`;
  const buf = await fetchBuffer(url);
  await sock.sendMessage(jid, { image: buf, caption: `🔲 *QR Code :* ${text}` }, { quoted: msg });
});
