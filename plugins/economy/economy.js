// ============================================================
//  DENTSUS V7 XMD — plugins/economy/economy.js
//  12 commands: balance/bal, daily, work, rob, pay,
//               leaderboard/lb, deposit/dep, withdraw, shop
// ============================================================

const { registerPlugin } = global;
const db = require('../../lib/database');
const { formatNumber, pickRandom } = require('../../lib/utils');

const WORK_PHRASES = [
  'Tu as livré des colis', 'Tu as codé toute la nuit', 'Tu as vendu des produits au marché',
  'Tu as gardé des enfants', 'Tu as réparé des téléphones', 'Tu as lavé des voitures',
  'Tu as donné des cours particuliers', 'Tu as fait du jardinage',
];

const DAILY_AMOUNT  = 500;
const WORK_MIN      = 100;
const WORK_MAX      = 800;
const WORK_COOLDOWN = 3600;    // 1h in seconds
const DAILY_COOLDOWN = 86400; // 24h in seconds

function canDoDaily(user) {
  if (!user.last_daily) return true;
  const last = new Date(user.last_daily).getTime();
  return Date.now() - last >= DAILY_COOLDOWN * 1000;
}

function canWork(user) {
  if (!user.last_work) return true;
  const last = new Date(user.last_work).getTime();
  return Date.now() - last >= WORK_COOLDOWN * 1000;
}

function msToTime(ms) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}m`;
  return `${m}m ${s % 60}s`;
}

registerPlugin('balance', async ({ sender, pushName, reply }) => {
  const user = db.getUser(sender);
  await reply(
    `💰 *SOLDE DE ${pushName.toUpperCase()}*\n\n` +
    `👜 *Portefeuille :* ${formatNumber(user.balance)} 🪙\n` +
    `🏦 *Banque :* ${formatNumber(user.bank)} 🪙\n` +
    `💎 *Total :* ${formatNumber(user.balance + user.bank)} 🪙\n` +
    `⭐ *Niveau :* ${user.level} | XP: ${user.xp}`
  );
});

registerPlugin('bal', async ({ sender, pushName, reply }) => {
  const user = db.getUser(sender);
  await reply(`💰 *${pushName} :* ${formatNumber(user.balance)} 🪙 (banque: ${formatNumber(user.bank)} 🪙)`);
});

registerPlugin('daily', async ({ sender, pushName, reply }) => {
  const user = db.getUser(sender);
  if (!canDoDaily(user)) {
    const last    = new Date(user.last_daily).getTime();
    const nextIn  = DAILY_COOLDOWN * 1000 - (Date.now() - last);
    return reply(`⏳ Tu as déjà réclamé ta récompense quotidienne.\nReviens dans : *${msToTime(nextIn)}*`);
  }
  db.updateBalance(sender, DAILY_AMOUNT);
  db.setLastDaily(sender);
  await reply(`🎁 *Récompense quotidienne !*\n\n+${formatNumber(DAILY_AMOUNT)} 🪙 ajoutés !\nNouveau solde: ${formatNumber(db.getUser(sender).balance)} 🪙`);
});

registerPlugin('work', async ({ sender, pushName, reply }) => {
  const user = db.getUser(sender);
  if (!canWork(user)) {
    const last   = new Date(user.last_work).getTime();
    const nextIn = WORK_COOLDOWN * 1000 - (Date.now() - last);
    return reply(`⏳ Tu es fatigué(e). Reviens dans : *${msToTime(nextIn)}*`);
  }
  const earned = Math.floor(Math.random() * (WORK_MAX - WORK_MIN + 1)) + WORK_MIN;
  const phrase = pickRandom(WORK_PHRASES);
  db.updateBalance(sender, earned);
  db.setLastWork(sender);
  await reply(`💼 *Au travail !*\n\n${phrase} et tu as gagné *${formatNumber(earned)} 🪙*\nNouveau solde: ${formatNumber(db.getUser(sender).balance)} 🪙`);
});

registerPlugin('rob', async ({ sock, msg, jid, sender, args, reply }) => {
  const targets = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
  const target  = targets[0];
  if (!target) return reply('❌ Mentionne quelqu\'un à voler ! Ex: .rob @user');
  if (target === sender) return reply('❌ Tu ne peux pas te voler toi-même !');

  const robber = db.getUser(sender);
  const victim = db.getUser(target);

  if (victim.balance < 50) return reply('❌ Cette personne est trop pauvre, laisse-la tranquille !');
  if (robber.balance < 100) return reply('❌ Tu as besoin d\'au moins 100 🪙 pour tenter un vol.');

  const success = Math.random() < 0.5;
  if (success) {
    const stolen = Math.floor(victim.balance * 0.2);
    db.updateBalance(target, -stolen);
    db.updateBalance(sender, stolen);
    await reply(`🦹 *Vol réussi !*\nTu as volé *${formatNumber(stolen)} 🪙* à @${target.split('@')[0]} !`);
  } else {
    const fine = Math.floor(robber.balance * 0.1);
    db.updateBalance(sender, -fine);
    await reply(`👮 *Pris sur le fait !*\nTu as payé une amende de *${formatNumber(fine)} 🪙*`);
  }
});

registerPlugin('pay', async ({ sock, msg, jid, sender, args, reply }) => {
  const targets = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
  const target  = targets[0];
  const amount  = parseInt(args[args.length - 1]);
  if (!target || !amount || amount <= 0) return reply('❌ Usage: .pay @user <montant>');
  if (target === sender) return reply('❌ Tu ne peux pas te payer toi-même.');

  const user = db.getUser(sender);
  if (user.balance < amount) return reply(`❌ Solde insuffisant. Tu as ${formatNumber(user.balance)} 🪙`);

  db.updateBalance(sender, -amount);
  db.updateBalance(target, amount);
  await sock.sendMessage(jid, {
    text: `💸 *Paiement effectué !*\n@${sender.split('@')[0]} a envoyé *${formatNumber(amount)} 🪙* à @${target.split('@')[0]}`,
    mentions: [sender, target],
  }, { quoted: msg });
});

registerPlugin('leaderboard', async ({ sock, msg, jid, reply }) => {
  const top = db.getLeaderboard(10);
  if (!top.length) return reply('📊 Aucun joueur pour le moment.');
  const medals = ['🥇', '🥈', '🥉'];
  const text   = `🏆 *TOP 10 DES PLUS RICHES*\n\n` +
    top.map((u, i) => `${medals[i] || `${i + 1}.`} @${u.jid.split('@')[0]} — ${formatNumber(u.total)} 🪙`).join('\n');
  await sock.sendMessage(jid, { text, mentions: top.map(u => u.jid) }, { quoted: msg });
});

registerPlugin('lb', async ({ sock, msg, jid }) => {
  const top  = db.getLeaderboard(5);
  const text = `🏆 *Top 5 :*\n` + top.map((u, i) => `${i + 1}. @${u.jid.split('@')[0]} — ${formatNumber(u.total)} 🪙`).join('\n');
  await sock.sendMessage(jid, { text, mentions: top.map(u => u.jid) }, { quoted: msg });
});

registerPlugin('deposit', async ({ sender, args, reply }) => {
  const amount = args[0] === 'all' ? db.getUser(sender).balance : parseInt(args[0]);
  if (!amount || amount <= 0) return reply('❌ Usage: .deposit <montant> ou .deposit all');
  const user = db.getUser(sender);
  if (user.balance < amount) return reply(`❌ Solde insuffisant: ${formatNumber(user.balance)} 🪙`);
  db.updateBalance(sender, -amount);
  db.updateBank(sender, amount);
  await reply(`🏦 *Dépôt effectué !*\n+${formatNumber(amount)} 🪙 déposés à la banque.\nBanque: ${formatNumber(db.getUser(sender).bank)} 🪙`);
});

registerPlugin('dep', async ({ sender, args, reply }) => {
  const amount = args[0] === 'all' ? db.getUser(sender).balance : parseInt(args[0]);
  if (!amount || amount <= 0) return reply('❌ Usage: .dep <montant>');
  const user = db.getUser(sender);
  if (user.balance < amount) return reply(`❌ Solde insuffisant.`);
  db.updateBalance(sender, -amount);
  db.updateBank(sender, amount);
  await reply(`🏦 Déposé ${formatNumber(amount)} 🪙 à la banque.`);
});

registerPlugin('withdraw', async ({ sender, args, reply }) => {
  const amount = args[0] === 'all' ? db.getUser(sender).bank : parseInt(args[0]);
  if (!amount || amount <= 0) return reply('❌ Usage: .withdraw <montant> ou .withdraw all');
  const user = db.getUser(sender);
  if (user.bank < amount) return reply(`❌ Solde bancaire insuffisant: ${formatNumber(user.bank)} 🪙`);
  db.updateBank(sender, -amount);
  db.updateBalance(sender, amount);
  await reply(`💵 *Retrait effectué !*\n${formatNumber(amount)} 🪙 retirés de la banque.\nPortefeuille: ${formatNumber(db.getUser(sender).balance)} 🪙`);
});

registerPlugin('shop', async ({ reply }) => {
  await reply(
    `🛒 *BOUTIQUE*\n\n` +
    `Bientôt disponible ! 🔜\n\n` +
    `En attendant, gagne des pièces avec:\n` +
    `• \`.daily\` — +500 🪙/jour\n` +
    `• \`.work\` — +100~800 🪙/heure`
  );
});
