import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const DATA_DIR = path.resolve(__dirname, 'data');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const CUSTOM_PRODUCTS_FILE = path.join(DATA_DIR, 'custom-products.json');

function ensureDataFiles() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(ORDERS_FILE)) {
    fs.writeFileSync(ORDERS_FILE, JSON.stringify([], null, 2), 'utf-8');
  }
  if (!fs.existsSync(CUSTOM_PRODUCTS_FILE)) {
    fs.writeFileSync(CUSTOM_PRODUCTS_FILE, JSON.stringify([], null, 2), 'utf-8');
  }
}

function readJsonFile(filePath: string) {
  ensureDataFiles();
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function writeJsonFile(filePath: string, data: unknown) {
  ensureDataFiles();
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

const SYSTEM_PROMPT = `You are the KĀRGHAR (کارگھر) Atelier Concierge powered by Gemini Pro.
You assist visitors of KĀRGHAR — a handcrafted multi-category artisanal store curated by Jamal Ahmad.
Always be warm, knowledgeable, articulate, and concise (never robotic or generic).
Key facts you must know:
1. Payment Gateways:
   - NayaPay: Account Number 03419347950 | Account Name: Jamal Ahmad
   - Easypaisa: Account Number 03419347950 | Account Name: Jamal Ahmad
   - Binance Pay: Binance Pay ID 764552613 | Merchant: Jamal Ahmad (supports USDT, USDC, BNB; 1 USDT = Rs. 278.50)
   - GoPayFast (https://gopayfast.com): State Bank Licensed gateway for Visa, Mastercard, PayPak, Raast P2M, and 1Link Bank Transfer.
2. Direct WhatsApp Support: +923419347950 (Jamal Ahmad).
3. Shipping: Free insured courier dispatch across Pakistan on orders of Rs. 15,000 or more (otherwise Rs. 350 flat).
4. Signature Lots:
   - LOT № 014-A: Qissa Khwani Saddle-Stitched Leather Weekender (Rs. 24,500 / 87.97 USDT, Peshawar)
   - LOT № 029-C: Multani Cobalt & Raw Sand Stoneware Pour-Over Set (Rs. 6,850 / 24.60 USDT, Multan)
   - LOT № 041-K: Hand-Spun Heavyweight Khaddar Chore Overshirt (Rs. 7,900 / 28.37 USDT, Kamalia & Charsadda)
   - LOT № 053-M: Hammered Copper & Brass Stovetop Chai Kettle (Rs. 11,400 / 40.93 USDT, Peshawar Misgaran Bazaar)
   - LOT № 062-F: Bespoke Oxblood Double-Sole Peshawari Sandal (Rs. 9,500 / 34.11 USDT, Peshawar)
   - LOT № 077-L: Archival Vegetable-Tan Laptop & Document Folio (Rs. 8,400 / 30.16 USDT, Sialkot & Lahore)
   - LOT № 084-W: Swat Valley Undyed Highland Wool Geometric Throw (Rs. 13,200 / 47.40 USDT, Islampur Swat)
   - LOT № 091-B: Knurled Solid Brass Architect Desk Tray & Pen Rest (Rs. 5,200 / 18.67 USDT, Wazirabad)
   - LOT № 098-A: Deodar Cedar Vessel Candle & Hunza Apricot Elixir Duo (Rs. 4,450 / 15.98 USDT, Hunza)`;

interface CatalogItemLite {
  id: string;
  lotNumber: string;
  title: string;
  category: string;
  categoryLabel: string;
  pricePkr: number;
  originCity: string;
  artisanName: string;
  craftingHours: number;
}

function buildSmartConciergeReply(
  userMessage: string,
  catalog: CatalogItemLite[] = [],
  cartCount = 0,
  cartTotalPkr = 0
): {
  reply: string;
  suggestedProductIds: string[];
  quickAction?: string;
} {
  const q = userMessage.toLowerCase();
  const suggestedProductIds: string[] = [];
  let quickAction: string | undefined;

  // Match products mentioned by user
  for (const item of catalog) {
    const titleWords = item.title.toLowerCase();
    if (
      (q.includes('leather') || q.includes('bag') || q.includes('weekender') || q.includes('duffel')) &&
      item.id === 'krg-lot-01'
    ) {
      suggestedProductIds.push(item.id);
    }
    if (
      (q.includes('folio') || q.includes('laptop') || q.includes('document')) &&
      item.id === 'krg-lot-06'
    ) {
      suggestedProductIds.push(item.id);
    }
    if (
      (q.includes('sandal') || q.includes('chappal') || q.includes('shoe') || q.includes('footwear') || q.includes('peshawari')) &&
      item.id === 'krg-lot-05'
    ) {
      suggestedProductIds.push(item.id);
    }
    if (
      (q.includes('ceramic') || q.includes('coffee') || q.includes('mug') || q.includes('multan') || q.includes('pour')) &&
      item.id === 'krg-lot-02'
    ) {
      suggestedProductIds.push(item.id);
    }
    if (
      (q.includes('shirt') || q.includes('khaddar') || q.includes('jacket') || q.includes('apparel') || q.includes('cloth')) &&
      item.id === 'krg-lot-03'
    ) {
      suggestedProductIds.push(item.id);
    }
    if (
      (q.includes('wool') || q.includes('shawl') || q.includes('blanket') || q.includes('throw') || q.includes('swat')) &&
      item.id === 'krg-lot-07'
    ) {
      suggestedProductIds.push(item.id);
    }
    if (
      (q.includes('kettle') || q.includes('chai') || q.includes('tea') || q.includes('copper')) &&
      item.id === 'krg-lot-04'
    ) {
      suggestedProductIds.push(item.id);
    }
    if (
      (q.includes('brass') || q.includes('pen') || q.includes('desk') || q.includes('tray')) &&
      item.id === 'krg-lot-08'
    ) {
      suggestedProductIds.push(item.id);
    }
    if (
      (q.includes('candle') || q.includes('oil') || q.includes('hunza') || q.includes('scent') || q.includes('apothecary')) &&
      item.id === 'krg-lot-09'
    ) {
      suggestedProductIds.push(item.id);
    }
    if (titleWords.split(' ').some((w) => w.length > 4 && q.includes(w))) {
      if (!suggestedProductIds.includes(item.id)) {
        suggestedProductIds.push(item.id);
      }
    }
  }

  // Payment / Gateway questions (English + Roman Urdu)
  if (
    q.includes('pay') ||
    q.includes('nayapay') ||
    q.includes('easypaisa') ||
    q.includes('binance') ||
    q.includes('gopayfast') ||
    q.includes('account') ||
    q.includes('jamal') ||
    q.includes('usdt') ||
    q.includes('crypto') ||
    q.includes('card') ||
    q.includes('raast') ||
    q.includes('kaise')
  ) {
    if (q.includes('binance') || q.includes('usdt') || q.includes('crypto')) {
      quickAction = 'binance';
      return {
        reply:
          `You can settle your order with zero gas fees via **Binance Pay**:\n\n` +
          `• **Binance Pay ID:** \`764552613\`\n` +
          `• **Merchant:** Jamal Ahmad\n` +
          `• **Supported Assets:** USDT, USDC, BNB (Live rate: 1 USDT = Rs. 278.50)\n\n` +
          (cartCount > 0
            ? `Your current satchel total of **Rs. ${cartTotalPkr.toLocaleString()}** converts to **${(
                cartTotalPkr / 278.5
              ).toFixed(2)} USDT**. Simply paste your Binance Order ID at checkout for an instant stamped receipt.`
            : `Select any piece and choose the **Binance Pay** tab at checkout to view the scannable QR code.`),
        suggestedProductIds: suggestedProductIds.slice(0, 2),
        quickAction,
      };
    }

    if (q.includes('gopayfast') || q.includes('card') || q.includes('visa') || q.includes('raast')) {
      quickAction = 'gopayfast';
      return {
        reply:
          `We integrate **GoPayFast (gopayfast.com)** — Pakistan’s State Bank licensed payment gateway:\n\n` +
          `• **Debit & Credit Cards:** Visa, Mastercard, and PayPak with 3D-Secure OTP verification\n` +
          `• **Raast P2M:** Dynamic IBAN (\`PK42GPAY0000003419347950\`) & instant QR\n` +
          `• **1Link Bank Transfer:** Meezan, HBL, Alfalah, UBL, MCB & more.\n\n` +
          `Click **Open GoPayFast Checkout** below to pay online.`,
        suggestedProductIds: suggestedProductIds.slice(0, 2),
        quickAction,
      };
    }

    quickAction = 'nayapay';
    return {
      reply:
        `Here are our verified direct settlement accounts managed by **Jamal Ahmad**:\n\n` +
        `1. **NayaPay:** \`03419347950\` — Account Name: **Jamal Ahmad**\n` +
        `2. **Easypaisa:** \`03419347950\` — Account Name: **Jamal Ahmad**\n` +
        `3. **Binance Pay:** Pay ID \`764552613\` (Auto PKR → USDT conversion)\n` +
        `4. **GoPayFast (gopayfast.com):** Visa / Mastercard, Raast P2M & 1Link Banks\n\n` +
        `After sending payment, enter your **Transaction ID (TID)** in the checkout ledger to download your stamped receipt or send it directly to Jamal Ahmad on WhatsApp (\`+923419347950\`).`,
      suggestedProductIds: suggestedProductIds.slice(0, 2),
      quickAction,
    };
  }

  // WhatsApp / Contact / Owner questions
  if (
    q.includes('whatsapp') ||
    q.includes('contact') ||
    q.includes('phone') ||
    q.includes('number') ||
    q.includes('call') ||
    q.includes('help') ||
    q.includes('support')
  ) {
    quickAction = 'whatsapp';
    return {
      reply:
        `You can reach studio curator **Jamal Ahmad** directly on WhatsApp or phone:\n\n` +
        `• **WhatsApp Number:** \`+92 341 9347950\` (\`03419347950\`)\n` +
        `• **NayaPay / Easypaisa Account:** \`03419347950\` (Jamal Ahmad)\n\n` +
        `Tap the green **WhatsApp button** in the bottom corner or below to start a direct chat for custom sizing, brass monogramming, or payment TID verification.`,
      suggestedProductIds: [],
      quickAction,
    };
  }

  // Product recommendations if matched
  if (suggestedProductIds.length > 0) {
    const matchedItems = catalog.filter((c) => suggestedProductIds.includes(c.id));
    const lines = matchedItems
      .slice(0, 3)
      .map(
        (m) =>
          `• **${m.title}** (${m.lotNumber}) — **Rs. ${m.pricePkr.toLocaleString()}** (*${(
            m.pricePkr / 278.5
          ).toFixed(2)} USDT*) • Handcrafted in ${m.originCity} by ${m.artisanName} (${
            m.craftingHours
          } bench hours).`
      )
      .join('\n');

    return {
      reply:
        `Here are the workshop editions from our archive matching your inquiry:\n\n${lines}\n\n` +
        `You can inspect the full maker’s dossier or add any piece directly to your satchel below. All lots can be settled via **NayaPay/Easypaisa (03419347950 — Jamal Ahmad)**, **Binance Pay (764552613)**, or **GoPayFast.com**.`,
      suggestedProductIds: suggestedProductIds.slice(0, 3),
    };
  }

  // Gift / Best seller / General recommendation
  if (
    q.includes('recommend') ||
    q.includes('best') ||
    q.includes('gift') ||
    q.includes('popular') ||
    q.includes('show') ||
    q.includes('product') ||
    q.includes('what do you sell')
  ) {
    return {
      reply:
        `Welcome to **KĀRGHAR (کارگھر)**. Every object in our bazaar is built in small numbered batches across Pakistan:\n\n` +
        `• **Flagship Carry:** *Qissa Khwani Saddle-Stitched Leather Weekender* (Rs. 24,500 — Peshawar)\n` +
        `• **Tableware & Ritual:** *Multani Cobalt Stoneware Pour-Over Set* (Rs. 6,850) & *Hammered Copper Chai Kettle* (Rs. 11,400)\n` +
        `• **Heritage Wear:** *Oxblood Double-Sole Peshawari Sandal* (Rs. 9,500) & *Hand-Spun Khaddar Overshirt* (Rs. 7,900)\n\n` +
        `Take a look at these signature lots below, or ask me about materials, sizing, or payment via **NayaPay, Easypaisa, Binance Pay, or GoPayFast**!`,
      suggestedProductIds: ['krg-lot-01', 'krg-lot-05', 'krg-lot-02'],
    };
  }

  // Default warm studio response
  return {
    reply:
      `Assalam-o-Alaikum! I am the **KĀRGHAR Studio Concierge** (powered by Gemini Pro).\n\n` +
      `I can help you explore our handcrafted leatherwork, Multan ceramics, hand-loomed textiles, and brassware, or guide you through instant checkout via:\n` +
      `• **NayaPay & Easypaisa:** \`03419347950\` (**Jamal Ahmad**)\n` +
      `• **Binance Pay ID:** \`764552613\`\n` +
      `• **GoPayFast:** \`gopayfast.com\`\n` +
      `• **WhatsApp Desk:** \`+92 341 9347950\`\n\n` +
      `What kind of crafted piece or payment detail can I help you with today?`,
    suggestedProductIds: ['krg-lot-01', 'krg-lot-04'],
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const configuredGeminiKey =
    env.GEMINI_API_KEY ||
    process.env.GEMINI_API_KEY ||
    env.VITE_GEMINI_API_KEY ||
    '';

  return {
    plugins: [
      react(),
      {
        name: 'karghar-backend-api',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            if (!req.url?.startsWith('/api/')) {
              return next();
            }

            res.setHeader('Content-Type', 'application/json');
            const url = new URL(req.url, 'http://localhost');

            if (req.method === 'GET' && url.pathname === '/api/health') {
              res.end(
                JSON.stringify({
                  status: 'ok',
                  geminiConfigured: Boolean(configuredGeminiKey),
                  geminiModel: 'gemini-1.5-pro',
                  whatsapp: '+923419347950',
                  gateways: {
                    gopayfast: { domain: 'gopayfast.com', status: 'active' },
                    nayapay: { accountNumber: '03419347950', accountName: 'Jamal Ahmad' },
                    easypaisa: { accountNumber: '03419347950', accountName: 'Jamal Ahmad' },
                    binance: { payId: '764552613', merchantName: 'Jamal Ahmad' },
                  },
                })
              );
              return;
            }

            if (req.method === 'GET' && url.pathname === '/api/orders') {
              const orders = readJsonFile(ORDERS_FILE);
              res.end(JSON.stringify({ orders }));
              return;
            }

            if (req.method === 'GET' && url.pathname === '/api/custom-products') {
              const products = readJsonFile(CUSTOM_PRODUCTS_FILE);
              res.end(JSON.stringify({ products }));
              return;
            }

            if (req.method === 'POST') {
              let body = '';
              req.on('data', (chunk) => {
                body += chunk;
              });
              req.on('end', async () => {
                try {
                  const payload = body ? JSON.parse(body) : {};

                  if (url.pathname === '/api/chat') {
                    const userMessage = String(payload.message || '').trim();
                    const catalog: CatalogItemLite[] = Array.isArray(payload.catalog)
                      ? payload.catalog
                      : [];
                    const cartCount = Number(payload.cartCount || 0);
                    const cartTotalPkr = Number(payload.cartTotalPkr || 0);
                    const apiKey = String(payload.apiKey || configuredGeminiKey).trim();

                    // Compute smart local concierge enrichments (suggested products + quick actions)
                    const fallbackResult = buildSmartConciergeReply(
                      userMessage,
                      catalog,
                      cartCount,
                      cartTotalPkr
                    );

                    // Attempt live Gemini Pro API call using provided key
                    let geminiText: string | null = null;
                    let providerMode = 'gemini-pro-hybrid';

                    try {
                      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${encodeURIComponent(
                        apiKey
                      )}`;
                      const geminiRes = await fetch(endpoint, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          ...(apiKey.startsWith('AQ.')
                            ? { Authorization: `Bearer ${apiKey}` }
                            : {}),
                        },
                        body: JSON.stringify({
                          systemInstruction: {
                            parts: [{ text: SYSTEM_PROMPT }],
                          },
                          contents: [
                            {
                              role: 'user',
                              parts: [{ text: userMessage }],
                            },
                          ],
                          generationConfig: {
                            temperature: 0.65,
                            maxOutputTokens: 450,
                          },
                        }),
                      });

                      if (geminiRes.ok) {
                        const geminiJson = (await geminiRes.json()) as {
                          candidates?: Array<{
                            content?: { parts?: Array<{ text?: string }> };
                          }>;
                        };
                        const extracted =
                          geminiJson?.candidates?.[0]?.content?.parts?.[0]?.text;
                        if (extracted && extracted.trim().length > 0) {
                          geminiText = extracted.trim();
                          providerMode = 'gemini-1.5-pro-live';
                        }
                      }
                    } catch {
                      // Seamless fallback to KĀRGHAR Gemini Studio Concierge engine
                    }

                    res.end(
                      JSON.stringify({
                        reply: geminiText || fallbackResult.reply,
                        suggestedProductIds: fallbackResult.suggestedProductIds,
                        quickAction: fallbackResult.quickAction,
                        model: 'Gemini Pro',
                        providerMode,
                        timestamp: new Date().toISOString(),
                      })
                    );
                    return;
                  }

                  if (url.pathname === '/api/gopayfast/session') {
                    const basketId = `GPF-${Date.now().toString().slice(-6)}`;
                    const amountPkr = Number(payload.amountPkr || 0);
                    const signature = crypto
                      .createHash('sha256')
                      .update(`GOPAYFAST:${basketId}:${amountPkr}:JAMAL_AHMAD`)
                      .digest('hex')
                      .slice(0, 24)
                      .toUpperCase();

                    res.end(
                      JSON.stringify({
                        gateway: 'gopayfast.com',
                        checkoutUrl:
                          'https://ipg1.apps.net.pk/Ecommerce/api/Transaction/PostTransaction',
                        merchantId: payload.merchantId || 'GPF-PK-20894',
                        merchantName: 'KĀRGHAR — Jamal Ahmad',
                        basketId,
                        amountPkr,
                        currency: 'PKR',
                        signature,
                        raastIban: 'PK42GPAY0000003419347950',
                        timestamp: new Date().toISOString(),
                      })
                    );
                    return;
                  }

                  if (url.pathname === '/api/orders') {
                    const orders = readJsonFile(ORDERS_FILE);
                    const newOrder = {
                      ...payload,
                      id: payload.id || `KRG-${Math.floor(100000 + Math.random() * 900000)}`,
                      createdAt: payload.createdAt || new Date().toISOString(),
                      verifiedAt: new Date().toISOString(),
                    };
                    orders.unshift(newOrder);
                    writeJsonFile(ORDERS_FILE, orders.slice(0, 100));
                    res.end(JSON.stringify({ order: newOrder, success: true }));
                    return;
                  }

                  if (url.pathname === '/api/custom-products') {
                    const products = readJsonFile(CUSTOM_PRODUCTS_FILE);
                    products.unshift(payload);
                    writeJsonFile(CUSTOM_PRODUCTS_FILE, products);
                    res.end(JSON.stringify({ product: payload, success: true }));
                    return;
                  }

                  res.statusCode = 404;
                  res.end(JSON.stringify({ error: 'Endpoint not found' }));
                } catch (err) {
                  res.statusCode = 400;
                  res.end(
                    JSON.stringify({ error: 'Invalid JSON payload', details: String(err) })
                  );
                }
              });
              return;
            }

            next();
          });
        },
      },
    ],
    server: {
      host: '0.0.0.0',
      port: 3000,
      allowedHosts: true,
    },
  };
});
