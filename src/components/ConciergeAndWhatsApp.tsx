import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  X,
  Copy,
  Check,
  ShoppingBag,
  ArrowUpRight,
  KeyRound,
  RotateCcw,
  ChevronUp,
} from 'lucide-react';
import { CartItem, PaymentGatewayId, Product } from '../types/store';
import { formatPkr, formatUsdt } from '../data/catalog';

export const WHATSAPP_NUMBER_RAW = '923419347950';
export const WHATSAPP_NUMBER_DISPLAY = '+923419347950';
export const DEFAULT_GEMINI_KEY =
  (import.meta as unknown as { env?: Record<string, string> }).env
    ?.VITE_GEMINI_API_KEY || '';

interface ChatMessage {
  id: string;
  role: 'assistant' | 'user';
  text: string;
  timestamp: string;
  suggestedProductIds?: string[];
  quickAction?: string;
}

interface ConciergeAndWhatsAppProps {
  products: Product[];
  cart: CartItem[];
  onAddToCart: (product: Product) => void;
  onInspectProduct: (product: Product) => void;
  onOpenCheckout: (gateway: PaymentGatewayId) => void;
}

export const WhatsAppIconSvg: React.FC<{ className?: string }> = ({
  className = 'w-6 h-6',
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path d="M12.031 2C6.508 2 2.023 6.485 2.023 12.007c0 1.766.461 3.49 1.337 5.012L2 22l5.122-1.343a9.97 9.97 0 0 0 4.907 1.292h.004c5.522 0 10.007-4.485 10.007-10.007 0-2.674-1.041-5.188-2.931-7.079A9.946 9.946 0 0 0 12.031 2zm5.862 14.337c-.246.693-1.434 1.326-1.994 1.409-.513.076-1.163.108-1.879-.119-.435-.138-.993-.324-1.706-.632-2.999-1.295-4.958-4.316-5.107-4.516-.149-.199-1.221-1.624-1.221-3.098 0-1.474.772-2.199 1.046-2.498.274-.299.598-.374.797-.374.199 0 .399.002.573.01.184.009.43-.07.673.514.249.598.847 2.067.921 2.216.075.15.125.324.025.523-.099.2-.15.324-.299.498-.149.175-.314.391-.448.524-.15.149-.306.311-.131.61.174.299.774 1.277 1.662 2.069 1.142 1.018 2.105 1.334 2.404 1.483.299.15.473.125.648-.075.174-.199.747-.872.946-1.171.199-.299.399-.249.673-.149.274.099 1.744.822 2.043.972.299.15.498.224.573.349.075.124.075.722-.171 1.414z" />
  </svg>
);

export const ConciergeAndWhatsApp: React.FC<ConciergeAndWhatsAppProps> = ({
  products,
  cart,
  onAddToCart,
  onInspectProduct,
  onOpenCheckout,
}) => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isWaCardOpen, setIsWaCardOpen] = useState(false);
  const [showApiConfig, setShowApiConfig] = useState(false);
  const [geminiApiKey, setGeminiApiKey] = useState(DEFAULT_GEMINI_KEY);
  const [copiedWa, setCopiedWa] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      role: 'assistant',
      text:
        `Assalam-o-Alaikum! Welcome to **KĀRGHAR (کارگھر)**.\n\n` +
        `I am your **Gemini Pro Atelier Concierge**. Ask me about any handcrafted piece, material specs, or instant checkout via:\n` +
        `• **NayaPay & Easypaisa:** \`03419347950\` (**Jamal Ahmad**)\n` +
        `• **Binance Pay ID:** \`764552613\`\n` +
        `• **GoPayFast:** \`gopayfast.com\`\n` +
        `• **WhatsApp:** \`+923419347950\``,
      timestamp: 'Just now',
      suggestedProductIds: ['krg-lot-01', 'krg-lot-02'],
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isChatOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isChatOpen]);

  const totalCartPkr = cart.reduce(
    (sum, i) => sum + i.product.pricePkr * i.quantity,
    0
  );
  const totalCartCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  const buildWhatsAppLink = (customMessage?: string) => {
    const defaultMsg =
      cart.length > 0
        ? `Assalam-o-Alaikum Jamal Ahmad (+923419347950)! I am browsing KĀRGHAR and have ${totalCartCount} item(s) in my satchel (${formatPkr(
            totalCartPkr
          )}). I would like to inquire / confirm my order.`
        : `Assalam-o-Alaikum Jamal Ahmad (+923419347950)! I am visiting your KĀRGHAR Handcrafted Storefront and would like to inquire about your collection.`;
    return `https://wa.me/${WHATSAPP_NUMBER_RAW}?text=${encodeURIComponent(
      customMessage || defaultMsg
    )}`;
  };

  const handleSendMessage = async (promptText?: string) => {
    const textToSend = (promptText ?? input).trim();
    if (!textToSend || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!promptText) setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          apiKey: geminiApiKey,
          cartCount: totalCartCount,
          cartTotalPkr,
          catalog: products.map((p) => ({
            id: p.id,
            lotNumber: p.lotNumber,
            title: p.title,
            category: p.category,
            categoryLabel: p.categoryLabel,
            pricePkr: p.pricePkr,
            originCity: p.originCity,
            artisanName: p.artisanName,
            craftingHours: p.craftingHours,
          })),
        }),
      });

      const data = await response.json();
      const assistantMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        text:
          data?.reply ||
          'I can help you with any KĀRGHAR lot or payment to Jamal Ahmad (03419347950 / Binance Pay ID 764552613 / gopayfast.com).',
        timestamp: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
        suggestedProductIds: data?.suggestedProductIds || [],
        quickAction: data?.quickAction,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-err-${Date.now()}`,
          role: 'assistant',
          text:
            `Here are our verified studio credentials:\n` +
            `• **NayaPay / Easypaisa:** \`03419347950\` (**Jamal Ahmad**)\n` +
            `• **Binance Pay ID:** \`764552613\`\n` +
            `• **GoPayFast:** \`gopayfast.com\`\n` +
            `• **WhatsApp:** \`+923419347950\``,
          timestamp: 'Now',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Simple formatted text renderer for bold & inline code
  const renderFormattedText = (raw: string) => {
    return raw.split('\n').map((line, lineIdx) => {
      const segments = line.split(/(\*\*.*?\*\*|`.*?`)/g);
      return (
        <p key={lineIdx} className={line.trim() === '' ? 'h-2' : 'leading-relaxed'}>
          {segments.map((seg, i) => {
            if (seg.startsWith('**') && seg.endsWith('**')) {
              return (
                <strong key={i} className="font-bold text-[#1C1916]">
                  {seg.slice(2, -2)}
                </strong>
              );
            }
            if (seg.startsWith('`') && seg.endsWith('`')) {
              return (
                <code
                  key={i}
                  className="px-1.5 py-0.5 bg-[#EAE2D3] border border-[#1C1916]/30 font-mono text-[11px] font-bold text-[#B84A27]"
                >
                  {seg.slice(1, -1)}
                </code>
              );
            }
            return <span key={i}>{seg}</span>;
          })}
        </p>
      );
    });
  };

  return (
    <>
      {/* FLOATING WHATSAPP BUTTON ICON (Bottom-Left) — +923419347950 */}
      <div className="fixed bottom-5 left-5 z-40 flex flex-col items-start gap-2.5">
        {isWaCardOpen && (
          <div className="w-80 bg-[#FAF7F2] border-2 border-[#1C1916] shadow-[8px_8px_0px_#1C1916] p-4 paper-grain">
            <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-[#D5CBB8]">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-[#25D366] text-white flex items-center justify-center border border-[#1C1916]">
                  <WhatsAppIconSvg className="w-4 h-4" />
                </span>
                <div>
                  <h4 className="font-serif text-sm font-bold text-[#1C1916] leading-none">
                    Jamal Ahmad — WhatsApp Desk
                  </h4>
                  <span className="font-mono text-[10px] text-[#1E7E34] font-semibold">
                    {WHATSAPP_NUMBER_DISPLAY} • Online
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsWaCardOpen(false)}
                className="p-1 text-[#575047] hover:text-[#1C1916]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-2.5 bg-[#E8F6EC] border border-[#1E7E34] mb-3 flex items-center justify-between font-mono text-xs">
              <div>
                <span className="text-[10px] uppercase text-[#575047] block">
                  Official WhatsApp Number
                </span>
                <strong className="text-[#1C1916] text-sm">{WHATSAPP_NUMBER_DISPLAY}</strong>
              </div>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(WHATSAPP_NUMBER_DISPLAY);
                  setCopiedWa(true);
                  setTimeout(() => setCopiedWa(false), 2000);
                }}
                className="px-2.5 py-1 bg-[#1C1916] text-white text-[10px] inline-flex items-center gap-1"
              >
                {copiedWa ? (
                  <>
                    <Check className="w-3 h-3" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" /> Copy
                  </>
                )}
              </button>
            </div>

            <div className="space-y-1.5 mb-3 font-mono text-[11px]">
              <span className="text-[10px] uppercase tracking-wider text-[#575047] block">
                Quick WhatsApp Dispatch Topics:
              </span>
              <a
                href={buildWhatsAppLink(
                  'Assalam-o-Alaikum Jamal Ahmad! I want to share my NayaPay / Easypaisa (03419347950) payment receipt and confirm my order.'
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-2 bg-white hover:bg-[#EAE2D3] border border-[#D5CBB8] text-[#1C1916] transition-colors"
              >
                → Verify NayaPay / Easypaisa TID (03419347950)
              </a>
              <a
                href={buildWhatsAppLink(
                  'Assalam-o-Alaikum Jamal Ahmad! I paid via Binance Pay (ID: 764552613) / GoPayFast and want to confirm dispatch.'
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-2 bg-white hover:bg-[#EAE2D3] border border-[#D5CBB8] text-[#1C1916] transition-colors"
              >
                → Confirm Binance Pay (764552613) / GoPayFast
              </a>
            </div>

            <a
              href={buildWhatsAppLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-4 bg-[#1E7E34] hover:bg-[#145A24] text-white font-mono text-xs font-bold uppercase tracking-wider border border-[#1C1916] flex items-center justify-center gap-2 transition-colors"
            >
              <WhatsAppIconSvg className="w-4 h-4" />
              <span>Open WhatsApp ({WHATSAPP_NUMBER_DISPLAY})</span>
            </a>
          </div>
        )}

        {/* Primary Floating WhatsApp Pill + Icon */}
        <div className="inline-flex items-center bg-[#FAF7F2] border-2 border-[#1C1916] shadow-[5px_5px_0px_#1C1916]">
          <a
            href={buildWhatsAppLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 px-3.5 py-2.5 bg-[#25D366] hover:bg-[#1E7E34] text-[#1C1916] hover:text-white transition-colors"
            title={`Chat on WhatsApp: ${WHATSAPP_NUMBER_DISPLAY}`}
          >
            <WhatsAppIconSvg className="w-5 h-5" />
            <div className="text-left leading-none">
              <span className="font-mono text-[10px] uppercase tracking-widest block font-bold">
                WhatsApp Direct
              </span>
              <span className="font-mono text-xs font-bold">
                {WHATSAPP_NUMBER_DISPLAY}
              </span>
            </div>
          </a>
          <button
            type="button"
            onClick={() => setIsWaCardOpen((v) => !v)}
            className="px-2.5 py-2.5 bg-[#FAF7F2] hover:bg-[#EAE2D3] text-[#1C1916] border-l border-[#1C1916] font-mono text-xs"
            title="Toggle WhatsApp quick options"
          >
            <ChevronUp
              className={`w-4 h-4 transition-transform ${
                isWaCardOpen ? 'rotate-180' : ''
              }`}
            />
          </button>
        </div>
      </div>

      {/* FLOATING GEMINI PRO ATELIER CHATBOT (Bottom-Right) */}
      <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end">
        {isChatOpen && (
          <div className="mb-3 w-[350px] sm:w-[410px] max-h-[80vh] bg-[#F4EFE6] border-2 border-[#1C1916] shadow-[10px_10px_0px_#1C1916] flex flex-col overflow-hidden paper-grain">
            {/* Chatbot Header */}
            <div className="px-4 py-3 bg-[#1C1916] text-[#FAF7F2] flex items-center justify-between border-b border-[#1C1916]">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 bg-[#B84A27] text-white flex items-center justify-center font-mono text-xs font-bold border border-[#FAF7F2]/40">
                  <Sparkles className="w-4 h-4 text-[#F0B90B]" />
                </span>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-serif text-sm font-bold leading-none">
                      KĀRGHAR Concierge
                    </h3>
                    <span className="px-1.5 py-0.5 bg-[#284634] text-[#F0B90B] font-mono text-[9px] uppercase">
                      Gemini Pro
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-[#D5CBB8] block mt-0.5">
                    API:{' '}
                    {geminiApiKey
                      ? `${geminiApiKey.slice(0, 10)}•••${geminiApiKey.slice(-4)}`
                      : 'Gemini Pro Server Active'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowApiConfig((v) => !v)}
                  className="p-1.5 bg-[#2C2723] hover:bg-[#B84A27] text-[#D5CBB8] hover:text-white transition-colors"
                  title="Inspect Gemini Pro API Key Configuration"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setMessages((prev) => [prev[0]])
                  }
                  className="p-1.5 bg-[#2C2723] hover:bg-[#B84A27] text-[#D5CBB8] hover:text-white transition-colors"
                  title="Reset conversation"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsChatOpen(false)}
                  className="p-1.5 bg-[#2C2723] hover:bg-[#B84A27] text-white transition-colors"
                  title="Minimize Concierge"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Collapsible Gemini Pro API Key Drawer */}
            {showApiConfig && (
              <div className="p-3 bg-[#EAE2D3] border-b border-[#1C1916] font-mono text-[11px] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="uppercase text-[10px] font-bold text-[#B84A27]">
                    Gemini Pro API Configuration
                  </span>
                  <span className="text-[10px] text-[#1E7E34] font-bold">● ACTIVE</span>
                </div>
                <input
                  type="text"
                  value={geminiApiKey}
                  onChange={(e) => setGeminiApiKey(e.target.value)}
                  className="w-full px-2.5 py-1 bg-[#FAF7F2] border border-[#1C1916] font-mono text-[11px]"
                />
                <div className="flex items-center justify-between text-[10px] text-[#575047]">
                  <span>Model: gemini-1.5-pro</span>
                  <button
                    type="button"
                    onClick={() => setShowApiConfig(false)}
                    className="underline text-[#1C1916] font-bold"
                  >
                    Save & Hide
                  </button>
                </div>
              </div>
            )}

            {/* Chat Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 max-h-[370px]">
              {messages.map((msg) => {
                const isUser = msg.role === 'user';
                const suggestedProducts = (msg.suggestedProductIds || [])
                  .map((id) => products.find((p) => p.id === id))
                  .filter((p): p is Product => Boolean(p));

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${
                      isUser ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div
                      className={`max-w-[90%] p-3 border text-xs space-y-1.5 ${
                        isUser
                          ? 'bg-[#1C1916] text-[#FAF7F2] border-[#1C1916]'
                          : 'bg-[#FAF7F2] text-[#1C1916] border-[#1C1916] shadow-[3px_3px_0px_#D5CBB8]'
                      }`}
                    >
                      {isUser ? (
                        <p className="leading-relaxed">{msg.text}</p>
                      ) : (
                        <div className="space-y-1">{renderFormattedText(msg.text)}</div>
                      )}

                      {/* Suggested Product Cards Inside Chat */}
                      {suggestedProducts.length > 0 && (
                        <div className="pt-2 mt-2 border-t border-[#D5CBB8] space-y-2">
                          {suggestedProducts.map((prod) => (
                            <div
                              key={prod.id}
                              className="p-2 bg-[#F4EFE6] border border-[#1C1916] flex items-center gap-2.5"
                            >
                              <img
                                src={prod.image}
                                alt={prod.title}
                                className="w-11 h-11 object-cover border border-[#1C1916] shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <span className="font-mono text-[9px] text-[#B84A27] block">
                                  {prod.lotNumber} • {formatPkr(prod.pricePkr)} (
                                  {formatUsdt(prod.pricePkr)})
                                </span>
                                <h5 className="font-serif text-xs font-bold text-[#1C1916] truncate">
                                  {prod.title}
                                </h5>
                                <div className="flex items-center gap-1.5 mt-1">
                                  <button
                                    type="button"
                                    onClick={() => onInspectProduct(prod)}
                                    className="px-1.5 py-0.5 bg-white border border-[#1C1916] font-mono text-[9px] uppercase"
                                  >
                                    Specs
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => onAddToCart(prod)}
                                    className="px-2 py-0.5 bg-[#1C1916] hover:bg-[#B84A27] text-white font-mono text-[9px] uppercase inline-flex items-center gap-1"
                                  >
                                    <ShoppingBag className="w-2.5 h-2.5" /> + Satchel
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Quick Action Button Inside Chat */}
                      {msg.quickAction && (
                        <div className="pt-2">
                          {msg.quickAction === 'whatsapp' ? (
                            <a
                              href={buildWhatsAppLink()}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full py-1.5 px-3 bg-[#1E7E34] text-white font-mono text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5"
                            >
                              <WhatsAppIconSvg className="w-3.5 h-3.5" />
                              Chat on WhatsApp ({WHATSAPP_NUMBER_DISPLAY})
                            </a>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setIsChatOpen(false);
                                onOpenCheckout(msg.quickAction as PaymentGatewayId);
                              }}
                              className="w-full py-1.5 px-3 bg-[#B84A27] hover:bg-[#1C1916] text-white font-mono text-[10px] uppercase tracking-wider flex items-center justify-center gap-1"
                            >
                              <span>
                                Open {msg.quickAction.toUpperCase()} Payment Terminal
                              </span>
                              <ArrowUpRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    <span className="font-mono text-[9px] text-[#8A8175] mt-1 px-1">
                      {msg.role === 'assistant' ? 'GEMINI PRO CONCIERGE' : 'YOU'} •{' '}
                      {msg.timestamp}
                    </span>
                  </div>
                );
              })}

              {isLoading && (
                <div className="p-3 bg-[#FAF7F2] border border-[#1C1916] font-mono text-xs text-[#575047] inline-flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-[#B84A27] animate-spin" />
                  <span>Gemini Pro Concierge is consulting the archive...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Suggestion Chips */}
            <div className="px-3 py-2 bg-[#EAE2D3] border-t border-[#D5CBB8] flex gap-1.5 overflow-x-auto no-scrollbar">
              {[
                'Payment Accounts (Jamal Ahmad)',
                'Binance Pay ID 764552613',
                'GoPayFast.com Cards',
                'Leather Weekender Specs',
                'WhatsApp +923419347950',
              ].map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => handleSendMessage(chip)}
                  className="px-2 py-1 bg-[#FAF7F2] hover:bg-[#1C1916] hover:text-white border border-[#1C1916] font-mono text-[10px] whitespace-nowrap transition-colors"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="p-2.5 bg-[#FAF7F2] border-t border-[#1C1916] flex items-center gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about lots, NayaPay, Binance, WhatsApp..."
                className="flex-1 px-3 py-2 bg-[#F4EFE6] border border-[#1C1916] font-sans text-xs focus:outline-none focus:ring-1 focus:ring-[#B84A27]"
              />
              <button
                type="submit"
                disabled={isLoading}
                className="p-2 bg-[#B84A27] hover:bg-[#1C1916] text-white border border-[#1C1916] transition-colors"
                title="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* Primary Floating Gemini Pro Trigger Button */}
        <button
          type="button"
          onClick={() => setIsChatOpen((v) => !v)}
          className="inline-flex items-center gap-2.5 px-4 py-3 bg-[#1C1916] hover:bg-[#B84A27] text-[#FAF7F2] border-2 border-[#1C1916] shadow-[5px_5px_0px_#B84A27] transition-all"
        >
          <Sparkles className="w-4 h-4 text-[#F0B90B]" />
          <div className="text-left leading-none">
            <span className="font-mono text-[9px] uppercase tracking-widest text-[#F0B90B] block">
              Gemini Pro AI
            </span>
            <span className="font-serif text-xs sm:text-sm font-bold">
              {isChatOpen ? 'Close Concierge' : 'Atelier Concierge Chat'}
            </span>
          </div>
        </button>
      </div>
    </>
  );
};
