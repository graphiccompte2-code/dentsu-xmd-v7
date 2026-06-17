// ============================================================
//  DENTSUS V7 XMD — plugins/ai/tools.js
//  20 commands: gpt, ask, translate, dictionary, wikipedia,
//  wiki, calculate, calc, currency, shorturl, weather, news,
//  country, github, npm, base64, md5, sha256, color, ip
// ============================================================

const { registerPlugin } = global;
const { fetchJson, fetchText, fetchBuffer } = require('../../lib/utils');
const crypto = require('crypto');

registerPlugin('gpt', async ({ sock, msg, jid, args }) => {
  const prompt = args.join(' ');
  if (!prompt) return sock.sendMessage(jid, { text: '❌ Usage: .gpt <question>' }, { quoted: msg });
  await sock.sendMessage(jid, { text: '🤖 Réflexion en cours...' }, { quoted: msg });
  try {
    const data = await fetchJson(`https://api.siputzx.my.id/api/ai/gpt3?prompt=${encodeURIComponent(prompt)}`);
    const resp = data?.data || data?.result || data?.text || 'Pas de réponse.';
    await sock.sendMessage(jid, { text: `🤖 *GPT :*\n\n${resp}` }, { quoted: msg });
  } catch (e) {
    await sock.sendMessage(jid, { text: `❌ Erreur GPT: ${e.message}` }, { quoted: msg });
  }
});

registerPlugin('ask', async ({ sock, msg, jid, args }) => {
  const q = args.join(' ');
  if (!q) return sock.sendMessage(jid, { text: '❌ Usage: .ask <question>' }, { quoted: msg });
  await sock.sendMessage(jid, { text: '💬 Je cherche une réponse...' }, { quoted: msg });
  try {
    const data = await fetchJson(`https://api.siputzx.my.id/api/ai/gpt3?prompt=${encodeURIComponent(q)}`);
    const ans  = data?.data || data?.result || 'Pas de réponse.';
    await sock.sendMessage(jid, { text: `💡 *Réponse :*\n\n${ans}` }, { quoted: msg });
  } catch (e) {
    await sock.sendMessage(jid, { text: `❌ Erreur: ${e.message}` }, { quoted: msg });
  }
});

registerPlugin('translate', async ({ sock, msg, jid, args }) => {
  if (args.length < 2) return sock.sendMessage(jid, { text: '❌ Usage: .translate <code_langue> <texte>\nEx: .translate en Bonjour tout le monde' }, { quoted: msg });
  const [lang, ...rest] = args;
  const text = rest.join(' ');
  try {
    const url  = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=auto|${lang}`;
    const data = await fetchJson(url);
    const tr   = data?.responseData?.translatedText;
    if (!tr) throw new Error('Traduction échouée');
    await sock.sendMessage(jid, { text: `🌐 *Traduction (${lang}) :*\n\n${tr}` }, { quoted: msg });
  } catch (e) {
    await sock.sendMessage(jid, { text: `❌ Erreur: ${e.message}` }, { quoted: msg });
  }
});

registerPlugin('dictionary', async ({ sock, msg, jid, args }) => {
  const word = args[0];
  if (!word) return sock.sendMessage(jid, { text: '❌ Usage: .dictionary <mot>' }, { quoted: msg });
  try {
    const data = await fetchJson(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
    const entry = data[0];
    const def   = entry?.meanings?.[0]?.definitions?.[0]?.definition || 'Définition introuvable.';
    const pos   = entry?.meanings?.[0]?.partOfSpeech || '';
    const ex    = entry?.meanings?.[0]?.definitions?.[0]?.example || '';
    await sock.sendMessage(jid, {
      text: `📚 *${word}* ${pos ? `(${pos})` : ''}\n\n📖 ${def}${ex ? `\n\n💬 _"${ex}"_` : ''}`,
    }, { quoted: msg });
  } catch {
    await sock.sendMessage(jid, { text: '❌ Mot introuvable. (Dictionnaire en anglais uniquement)' }, { quoted: msg });
  }
});

registerPlugin('wikipedia', async ({ sock, msg, jid, args }) => {
  const query = args.join(' ');
  if (!query) return sock.sendMessage(jid, { text: '❌ Usage: .wikipedia <sujet>' }, { quoted: msg });
  try {
    const url  = `https://fr.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`;
    const data = await fetchJson(url);
    if (!data?.extract) throw new Error('Article introuvable');
    await sock.sendMessage(jid, {
      text: `📖 *${data.title}*\n\n${data.extract.slice(0, 1000)}...\n\n🔗 ${data.content_urls?.desktop?.page || ''}`,
    }, { quoted: msg });
  } catch {
    await sock.sendMessage(jid, { text: '❌ Article introuvable sur Wikipedia.' }, { quoted: msg });
  }
});

registerPlugin('wiki', async ({ sock, msg, jid, args }) => {
  const query = args.join(' ');
  if (!query) return sock.sendMessage(jid, { text: '❌ Usage: .wiki <sujet>' }, { quoted: msg });
  try {
    const url  = `https://fr.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`;
    const data = await fetchJson(url);
    if (!data?.extract) throw new Error('Introuvable');
    await sock.sendMessage(jid, { text: `📖 *${data.title}*\n\n${data.extract.slice(0, 800)}` }, { quoted: msg });
  } catch {
    await sock.sendMessage(jid, { text: '❌ Introuvable.' }, { quoted: msg });
  }
});

registerPlugin('calculate', async ({ sock, msg, jid, args }) => {
  const expr = args.join(' ').replace(/[^0-9+\-*/().^%\s]/g, '');
  if (!expr) return sock.sendMessage(jid, { text: '❌ Usage: .calculate <expression>\nEx: .calculate 15 * 3 + 2' }, { quoted: msg });
  try {
    const result = Function('"use strict"; return (' + expr + ')')();
    await sock.sendMessage(jid, { text: `🧮 *Calcul :*\n${expr} = *${result}*` }, { quoted: msg });
  } catch {
    await sock.sendMessage(jid, { text: '❌ Expression invalide.' }, { quoted: msg });
  }
});

registerPlugin('calc', async ({ sock, msg, jid, args }) => {
  const expr = args.join(' ').replace(/[^0-9+\-*/().^%\s]/g, '');
  if (!expr) return sock.sendMessage(jid, { text: '❌ Usage: .calc <expression>' }, { quoted: msg });
  try {
    const result = Function('"use strict"; return (' + expr + ')')();
    await sock.sendMessage(jid, { text: `🧮 ${expr} = *${result}*` }, { quoted: msg });
  } catch {
    await sock.sendMessage(jid, { text: '❌ Expression invalide.' }, { quoted: msg });
  }
});

registerPlugin('currency', async ({ sock, msg, jid, args }) => {
  if (args.length < 3) return sock.sendMessage(jid, { text: '❌ Usage: .currency <montant> <FROM> <TO>\nEx: .currency 100 USD EUR' }, { quoted: msg });
  const [amount, from, to] = args;
  try {
    const data = await fetchJson(`https://api.exchangerate-api.com/v4/latest/${from.toUpperCase()}`);
    const rate  = data?.rates?.[to.toUpperCase()];
    if (!rate) throw new Error('Devise introuvable');
    const result = (parseFloat(amount) * rate).toFixed(2);
    await sock.sendMessage(jid, { text: `💱 *Conversion :*\n${amount} ${from.toUpperCase()} = *${result} ${to.toUpperCase()}*` }, { quoted: msg });
  } catch (e) {
    await sock.sendMessage(jid, { text: `❌ Erreur: ${e.message}` }, { quoted: msg });
  }
});

registerPlugin('shorturl', async ({ sock, msg, jid, args }) => {
  const url = args[0];
  if (!url) return sock.sendMessage(jid, { text: '❌ Usage: .shorturl <URL>' }, { quoted: msg });
  try {
    const data = await fetchJson(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`);
    await sock.sendMessage(jid, { text: `🔗 *URL raccourcie :*\n${data}` }, { quoted: msg });
  } catch {
    await sock.sendMessage(jid, { text: '❌ Impossible de raccourcir l\'URL.' }, { quoted: msg });
  }
});

registerPlugin('weather', async ({ sock, msg, jid, args }) => {
  const city = args.join(' ') || 'Brazzaville';
  try {
    const text = await fetchText(`https://wttr.in/${encodeURIComponent(city)}?format=3`);
    await sock.sendMessage(jid, { text: `🌤 *Météo :*\n${text}` }, { quoted: msg });
  } catch {
    await sock.sendMessage(jid, { text: '❌ Météo introuvable.' }, { quoted: msg });
  }
});

registerPlugin('news', async ({ sock, msg, jid, args }) => {
  const topic = args.join(' ') || 'africa';
  try {
    const url  = `https://gnews.io/api/v4/search?q=${encodeURIComponent(topic)}&lang=fr&max=5&apikey=free`;
    const data = await fetchJson(url);
    const articles = data?.articles || [];
    if (!articles.length) return sock.sendMessage(jid, { text: '❌ Aucun article trouvé.' }, { quoted: msg });
    const text = `📰 *Actualités : ${topic}*\n\n` +
      articles.slice(0, 5).map((a, i) => `${i + 1}. *${a.title}*\n🔗 ${a.url}`).join('\n\n');
    await sock.sendMessage(jid, { text }, { quoted: msg });
  } catch (e) {
    await sock.sendMessage(jid, { text: `❌ Service actualités indisponible.` }, { quoted: msg });
  }
});

registerPlugin('country', async ({ sock, msg, jid, args }) => {
  const name = args.join(' ');
  if (!name) return sock.sendMessage(jid, { text: '❌ Usage: .country <pays>' }, { quoted: msg });
  try {
    const data = await fetchJson(`https://restcountries.com/v3.1/name/${encodeURIComponent(name)}`);
    const c    = data[0];
    await sock.sendMessage(jid, {
      text: `🌍 *${c.name.common}* (${c.name.official})\n\n` +
        `🏛 *Capitale :* ${c.capital?.[0] || 'N/A'}\n` +
        `👥 *Population :* ${c.population?.toLocaleString('fr-FR')}\n` +
        `🌐 *Région :* ${c.region} / ${c.subregion}\n` +
        `💰 *Monnaie :* ${Object.values(c.currencies || {})[0]?.name || 'N/A'}\n` +
        `🗣 *Langue :* ${Object.values(c.languages || {})[0] || 'N/A'}\n` +
        `📞 *Indicatif :* +${c.idd?.root}${c.idd?.suffixes?.[0] || ''}`,
    }, { quoted: msg });
  } catch {
    await sock.sendMessage(jid, { text: '❌ Pays introuvable.' }, { quoted: msg });
  }
});

registerPlugin('github', async ({ sock, msg, jid, args }) => {
  const user = args[0];
  if (!user) return sock.sendMessage(jid, { text: '❌ Usage: .github <username>' }, { quoted: msg });
  try {
    const data = await fetchJson(`https://api.github.com/users/${user}`);
    await sock.sendMessage(jid, {
      text: `🐙 *GitHub : ${data.login}*\n\n` +
        `👤 *Nom :* ${data.name || 'N/A'}\n` +
        `📝 *Bio :* ${data.bio || 'Aucune'}\n` +
        `📦 *Repos publics :* ${data.public_repos}\n` +
        `👥 *Followers :* ${data.followers}\n` +
        `🌐 *Lien :* ${data.html_url}`,
    }, { quoted: msg });
  } catch {
    await sock.sendMessage(jid, { text: '❌ Utilisateur GitHub introuvable.' }, { quoted: msg });
  }
});

registerPlugin('npm', async ({ sock, msg, jid, args }) => {
  const pkg = args[0];
  if (!pkg) return sock.sendMessage(jid, { text: '❌ Usage: .npm <package>' }, { quoted: msg });
  try {
    const data = await fetchJson(`https://registry.npmjs.org/${pkg}`);
    const latest = data['dist-tags']?.latest;
    const info   = data.versions?.[latest];
    await sock.sendMessage(jid, {
      text: `📦 *npm: ${data.name}*\n\n` +
        `📝 *Description :* ${data.description || 'N/A'}\n` +
        `🔖 *Version :* ${latest}\n` +
        `👤 *Auteur :* ${data.author?.name || 'N/A'}\n` +
        `📜 *Licence :* ${info?.license || 'N/A'}\n` +
        `🔗 https://npmjs.com/package/${pkg}`,
    }, { quoted: msg });
  } catch {
    await sock.sendMessage(jid, { text: '❌ Package npm introuvable.' }, { quoted: msg });
  }
});

registerPlugin('base64', async ({ sock, msg, jid, args }) => {
  const [mode, ...rest] = args;
  const text = rest.join(' ');
  if (!mode || !text) return sock.sendMessage(jid, { text: '❌ Usage: .base64 encode <texte> | .base64 decode <texte>' }, { quoted: msg });
  if (mode === 'encode') {
    await sock.sendMessage(jid, { text: `🔒 *Base64 (encodé) :*\n${Buffer.from(text).toString('base64')}` }, { quoted: msg });
  } else if (mode === 'decode') {
    try {
      await sock.sendMessage(jid, { text: `🔓 *Base64 (décodé) :*\n${Buffer.from(text, 'base64').toString('utf8')}` }, { quoted: msg });
    } catch {
      await sock.sendMessage(jid, { text: '❌ Chaîne base64 invalide.' }, { quoted: msg });
    }
  } else {
    await sock.sendMessage(jid, { text: '❌ Mode invalide. Utilise encode ou decode.' }, { quoted: msg });
  }
});

registerPlugin('md5', async ({ sock, msg, jid, args }) => {
  const text = args.join(' ');
  if (!text) return sock.sendMessage(jid, { text: '❌ Usage: .md5 <texte>' }, { quoted: msg });
  const hash = crypto.createHash('md5').update(text).digest('hex');
  await sock.sendMessage(jid, { text: `🔐 *MD5 :*\n\`${hash}\`` }, { quoted: msg });
});

registerPlugin('sha256', async ({ sock, msg, jid, args }) => {
  const text = args.join(' ');
  if (!text) return sock.sendMessage(jid, { text: '❌ Usage: .sha256 <texte>' }, { quoted: msg });
  const hash = crypto.createHash('sha256').update(text).digest('hex');
  await sock.sendMessage(jid, { text: `🔐 *SHA-256 :*\n\`${hash}\`` }, { quoted: msg });
});

registerPlugin('color', async ({ sock, msg, jid, args }) => {
  const hex = args[0]?.replace('#', '') || Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, '0');
  try {
    const buf = await fetchBuffer(`https://singlecolorimage.com/get/${hex}/200x200`);
    const r   = parseInt(hex.substring(0, 2), 16);
    const g   = parseInt(hex.substring(2, 4), 16);
    const b   = parseInt(hex.substring(4, 6), 16);
    await sock.sendMessage(jid, {
      image: buf,
      caption: `🎨 *Couleur #${hex.toUpperCase()}*\n🔴 R: ${r}  🟢 G: ${g}  🔵 B: ${b}`,
    }, { quoted: msg });
  } catch {
    await sock.sendMessage(jid, { text: `🎨 Couleur: #${hex.toUpperCase()}` }, { quoted: msg });
  }
});
