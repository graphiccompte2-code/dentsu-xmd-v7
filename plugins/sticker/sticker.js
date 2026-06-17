// ============================================================
//  DENTSUS V7 XMD — plugins/sticker/sticker.js
//  12 commands: sticker, s, toimg, attp, ttp, blur, grayscale,
//               invert, rotate, circle, resize, meme
// ============================================================

const { registerPlugin } = global;
const { downloadMedia, getQuoted, sendSticker, sendImage, fetchBuffer, reply: utilReply } = require('../../lib/utils');

async function makeSticker(buffer, packname, author) {
  const { StickerTypes } = require('wa-sticker-formatter');
  const sticker = new (require('wa-sticker-formatter').Sticker)(buffer, {
    pack: packname || 'DENTSU XMD',
    author: author || 'Natsu Tech',
    type: StickerTypes.FULL,
    quality: 70,
  });
  return sticker.toBuffer();
}

async function getMediaBuffer(msg) {
  const quoted = getQuoted(msg);
  if (quoted) {
    const fakeMsg = { message: quoted, key: msg.key };
    return downloadMedia(fakeMsg);
  }
  return downloadMedia(msg);
}

registerPlugin('sticker', async ({ sock, msg, jid, args }) => {
  const buf = await getMediaBuffer(msg);
  if (!buf) return sock.sendMessage(jid, { text: '❌ Envoie ou cite une image/vidéo avec .sticker' }, { quoted: msg });
  const config = require('../../config');
  const stkBuf = await makeSticker(buf, config.PACK_NAME, config.AUTHOR);
  await sock.sendMessage(jid, { sticker: stkBuf }, { quoted: msg });
});

registerPlugin('s', async ({ sock, msg, jid }) => {
  const buf = await getMediaBuffer(msg);
  if (!buf) return sock.sendMessage(jid, { text: '❌ Envoie ou cite une image avec .s' }, { quoted: msg });
  const config = require('../../config');
  const stkBuf = await makeSticker(buf, config.PACK_NAME, config.AUTHOR);
  await sock.sendMessage(jid, { sticker: stkBuf }, { quoted: msg });
});

registerPlugin('toimg', async ({ sock, msg, jid }) => {
  const buf = await getMediaBuffer(msg);
  if (!buf) return sock.sendMessage(jid, { text: '❌ Cite un sticker avec .toimg' }, { quoted: msg });
  await sock.sendMessage(jid, { image: buf, caption: '🖼️ Sticker → Image' }, { quoted: msg });
});

registerPlugin('attp', async ({ sock, msg, jid, args }) => {
  const text = args.join(' ');
  if (!text) return sock.sendMessage(jid, { text: '❌ Usage: .attp <texte>' }, { quoted: msg });
  const url = `https://api.siputzx.my.id/api/sticker/attp?text=${encodeURIComponent(text)}`;
  try {
    const buf = await fetchBuffer(url);
    await sock.sendMessage(jid, { sticker: buf }, { quoted: msg });
  } catch {
    await sock.sendMessage(jid, { text: '❌ Impossible de créer le sticker animé.' }, { quoted: msg });
  }
});

registerPlugin('ttp', async ({ sock, msg, jid, args }) => {
  const text = args.join(' ');
  if (!text) return sock.sendMessage(jid, { text: '❌ Usage: .ttp <texte>' }, { quoted: msg });
  const url = `https://api.siputzx.my.id/api/sticker/ttp?text=${encodeURIComponent(text)}`;
  try {
    const buf = await fetchBuffer(url);
    await sock.sendMessage(jid, { sticker: buf }, { quoted: msg });
  } catch {
    await sock.sendMessage(jid, { text: '❌ Impossible de créer le sticker.' }, { quoted: msg });
  }
});

async function processImage(msg, transformFn, caption) {
  const Jimp = require('jimp');
  const buf  = await getMediaBuffer(msg);
  if (!buf) return null;
  const image = await Jimp.read(buf);
  transformFn(image);
  return image.getBufferAsync(Jimp.MIME_JPEG);
}

registerPlugin('blur', async ({ sock, msg, jid, args }) => {
  const level = parseInt(args[0]) || 5;
  try {
    const out = await processImage(msg, img => img.blur(level), `🌫 Flou (${level})`);
    if (!out) return sock.sendMessage(jid, { text: '❌ Envoie ou cite une image.' }, { quoted: msg });
    await sock.sendMessage(jid, { image: out, caption: `🌫 Flou appliqué (${level})` }, { quoted: msg });
  } catch (e) {
    await sock.sendMessage(jid, { text: '❌ Erreur: ' + e.message }, { quoted: msg });
  }
});

registerPlugin('grayscale', async ({ sock, msg, jid }) => {
  try {
    const out = await processImage(msg, img => img.greyscale(), '⬛ Niveaux de gris');
    if (!out) return sock.sendMessage(jid, { text: '❌ Envoie ou cite une image.' }, { quoted: msg });
    await sock.sendMessage(jid, { image: out, caption: '⬛ Niveaux de gris' }, { quoted: msg });
  } catch (e) {
    await sock.sendMessage(jid, { text: '❌ Erreur: ' + e.message }, { quoted: msg });
  }
});

registerPlugin('invert', async ({ sock, msg, jid }) => {
  try {
    const out = await processImage(msg, img => img.invert(), '🔄 Inversé');
    if (!out) return sock.sendMessage(jid, { text: '❌ Envoie ou cite une image.' }, { quoted: msg });
    await sock.sendMessage(jid, { image: out, caption: '🔄 Couleurs inversées' }, { quoted: msg });
  } catch (e) {
    await sock.sendMessage(jid, { text: '❌ Erreur: ' + e.message }, { quoted: msg });
  }
});

registerPlugin('rotate', async ({ sock, msg, jid, args }) => {
  const deg = parseInt(args[0]) || 90;
  try {
    const out = await processImage(msg, img => img.rotate(deg), `🔄 Rotation ${deg}°`);
    if (!out) return sock.sendMessage(jid, { text: '❌ Envoie ou cite une image.' }, { quoted: msg });
    await sock.sendMessage(jid, { image: out, caption: `🔄 Rotation: ${deg}°` }, { quoted: msg });
  } catch (e) {
    await sock.sendMessage(jid, { text: '❌ Erreur: ' + e.message }, { quoted: msg });
  }
});

registerPlugin('circle', async ({ sock, msg, jid }) => {
  try {
    const Jimp = require('jimp');
    const buf  = await getMediaBuffer(msg);
    if (!buf) return sock.sendMessage(jid, { text: '❌ Envoie ou cite une image.' }, { quoted: msg });
    const image = await Jimp.read(buf);
    const size  = Math.min(image.getWidth(), image.getHeight());
    image.resize(size, size).circle();
    const out = await image.getBufferAsync(Jimp.MIME_PNG);
    await sock.sendMessage(jid, { image: out, caption: '⭕ Image en cercle' }, { quoted: msg });
  } catch (e) {
    await sock.sendMessage(jid, { text: '❌ Erreur: ' + e.message }, { quoted: msg });
  }
});

registerPlugin('resize', async ({ sock, msg, jid, args }) => {
  const w = parseInt(args[0]) || 512;
  const h = parseInt(args[1]) || 512;
  try {
    const out = await processImage(msg, img => img.resize(w, h), `📐 Redimensionné ${w}x${h}`);
    if (!out) return sock.sendMessage(jid, { text: '❌ Envoie ou cite une image.' }, { quoted: msg });
    await sock.sendMessage(jid, { image: out, caption: `📐 Redimensionné: ${w}×${h}` }, { quoted: msg });
  } catch (e) {
    await sock.sendMessage(jid, { text: '❌ Erreur: ' + e.message }, { quoted: msg });
  }
});

registerPlugin('meme', async ({ sock, msg, jid, args }) => {
  if (args.length < 2) return sock.sendMessage(jid, { text: '❌ Usage: .meme <texte haut>|<texte bas>' }, { quoted: msg });
  const [topText, bottomText] = args.join(' ').split('|');
  const url = `https://api.memegen.link/images/doge/${encodeURIComponent(topText || '_')}/${encodeURIComponent(bottomText || '_')}.jpg`;
  try {
    const buf = await fetchBuffer(url);
    await sock.sendMessage(jid, { image: buf, caption: '😂 Meme généré !' }, { quoted: msg });
  } catch {
    await sock.sendMessage(jid, { text: '❌ Impossible de générer le meme.' }, { quoted: msg });
  }
});
