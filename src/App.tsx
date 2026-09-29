import React, { useState, useEffect, useMemo } from 'react';
import {
  ShoppingBag,
  Search,
  Copy,
  Check,
  ArrowUpRight,
  Sparkles,
  FileText,
  Plus,
  LayoutGrid,
  Table2,
  MapPin,
  Clock,
  ShieldCheck,
  ExternalLink,
  Hammer,
  Eye,
} from 'lucide-react';
import {
  CartItem,
  CategoryId,
  OrderRecord,
  PaymentGatewayId,
  Product,
} from './types/store';
import {
  CATEGORIES,
  formatPkr,
  formatUsdt,
  INITIAL_PRODUCTS,
  pkrToUsdt,
  USDT_RATE_PKR,
} from './data/catalog';
import {
  ArtisanWaxSeal,
  DynamicPaymentQR,
  GatewayEmblem,
  HandDrawnUnderline,
} from './components/PaymentGraphics';
import { CheckoutModal } from './components/CheckoutModal';
import { OrderReceiptModal } from './components/OrderReceiptModal';
import { ProductDetailModal } from './components/ProductDetailModal';
import { CartDrawer } from './components/CartDrawer';
import { OrdersDrawer } from './components/OrdersDrawer';
import { AddCustomProductModal } from './components/AddCustomProductModal';
import {
  ConciergeAndWhatsApp,
  WHATSAPP_NUMBER_DISPLAY,
  WHATSAPP_NUMBER_RAW,
  WhatsAppIconSvg,
} from './components/ConciergeAndWhatsApp';

export function App() {
  // Catalog state (initial + custom added products)
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('krg_custom_products');
      const parsed: Product[] = saved ? JSON.parse(saved) : [];
      return [...parsed, ...INITIAL_PRODUCTS];
    } catch {
      return INITIAL_PRODUCTS;
    }
  });

  // Cart state
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('krg_cart');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [
      {
        product: INITIAL_PRODUCTS[0],
        quantity: 1,
        selectedOption: INITIAL_PRODUCTS[0].variants?.options[0] || 'Cognac Pull-Up',
      },
    ];
  });

  // Orders history state
  const [orders, setOrders] = useState<OrderRecord[]>(() => {
    try {
      const saved = localStorage.getItem('krg_orders');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Filter & view state
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'editorial' | 'ledger'>('editorial');
  const [currencyMode, setCurrencyMode] = useState<'PKR' | 'USDT'>('PKR');

  // Modals & Drawers state
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutGateway, setCheckoutGateway] = useState<PaymentGatewayId>('nayapay');
  const [activeReceipt, setActiveReceipt] = useState<OrderRecord | null>(null);
  const [inspectedProduct, setInspectedProduct] = useState<Product | null>(null);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);

  // Quick copy state & active QR preview on payment desk
  const [copiedBadge, setCopiedBadge] = useState<string | null>(null);
  const [activeQrGateway, setActiveQrGateway] = useState<PaymentGatewayId>('nayapay');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Per-card variant selection state
  const [cardVariants, setCardVariants] = useState<Record<string, string>>({});

  // Sync with backend orders & custom products on mount
  useEffect(() => {
    fetch('/api/orders')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data?.orders) && data.orders.length > 0) {
          setOrders(data.orders);
        }
      })
      .catch(() => {});

    fetch('/api/custom-products')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data?.products) && data.products.length > 0) {
          setProducts((prev) => {
            const existingIds = new Set(prev.map((p) => p.id));
            const newOnes = data.products.filter((p: Product) => !existingIds.has(p.id));
            return [...newOnes, ...prev];
          });
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('krg_cart', JSON.stringify(cart));
    } catch {
      // ignore
    }
  }, [cart]);

  useEffect(() => {
    try {
      localStorage.setItem('krg_orders', JSON.stringify(orders));
    } catch {
      // ignore
    }
  }, [orders]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2600);
  };

  const copyText = (text: string, key: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedBadge(key);
    showToast(`Copied ${label}: ${text}`);
    setTimeout(() => setCopiedBadge(null), 2000);
  };

  const handleAddToCart = (product: Product, option?: string, quantity = 1) => {
    const chosenOption =
      option ||
      cardVariants[product.id] ||
      product.variants?.options[0] ||
      'Standard Edition';

    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (item) => item.product.id === product.id && item.selectedOption === chosenOption
      );
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantity,
        };
        return updated;
      }
      return [...prev, { product, quantity, selectedOption: chosenOption }];
    });

    showToast(`Added "${product.title}" (${chosenOption}) to Satchel`);
  };

  const handleInstantBuy = (
    product: Product,
    option?: string,
    quantity = 1,
    gateway: PaymentGatewayId = 'nayapay'
  ) => {
    handleAddToCart(product, option, quantity);
    setInspectedProduct(null);
    setCheckoutGateway(gateway);
    setIsCheckoutOpen(true);
  };

  const handleUpdateCartQty = (productId: string, option: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.product.id === productId && item.selectedOption === option
            ? { ...item, quantity: item.quantity + delta }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const handleRemoveCartItem = (productId: string, option: string) => {
    setCart((prev) =>
      prev.filter(
        (item) => !(item.product.id === productId && item.selectedOption === option)
      )
    );
  };

  const handleOpenCheckout = (gateway: PaymentGatewayId = 'nayapay') => {
    setIsCartOpen(false);
    setCheckoutGateway(gateway);
    setIsCheckoutOpen(true);
  };

  const handleOrderSuccess = (newOrder: OrderRecord) => {
    setOrders((prev) => [newOrder, ...prev]);
    setCart([]);
    setIsCheckoutOpen(false);
    setActiveReceipt(newOrder);
    showToast(`Order ${newOrder.id} recorded! Official receipt generated.`);
  };

  const handleAddCustomProduct = (newProd: Product) => {
    setProducts((prev) => {
      const updated = [newProd, ...prev];
      const customOnly = updated.filter((p) => p.id.startsWith('krg-custom-'));
      try {
        localStorage.setItem('krg_custom_products', JSON.stringify(customOnly));
      } catch {
        // ignore
      }
      return updated;
    });
    showToast(`Published custom lot "${newProd.title}" to storefront!`);
  };

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCat = selectedCategory === 'all' || p.category === selectedCategory;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.subtitle.toLowerCase().includes(q) ||
        p.originCity.toLowerCase().includes(q) ||
        p.categoryLabel.toLowerCase().includes(q) ||
        p.lotNumber.toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  const totalCartItems = cart.reduce((sum, i) => sum + i.quantity, 0);
  const totalCartPkr = cart.reduce(
    (sum, i) => sum + i.product.pricePkr * i.quantity,
    0
  );

  const formatDisplayPrice = (pricePkr: number) => {
    if (currencyMode === 'USDT') {
      return `${pkrToUsdt(pricePkr).toFixed(2)} USDT`;
    }
    return formatPkr(pricePkr);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F4EFE6] text-[#1C1916] paper-grain">
      {/* Floating Notification Toast */}
      {toastMessage && (
        <div className="fixed top-20 right-5 z-50 max-w-sm px-4 py-3 bg-[#1C1916] text-[#FAF7F2] border-2 border-[#B84A27] shadow-[6px_6px_0px_#B84A27] font-mono text-xs flex items-center gap-2.5">
          <Sparkles className="w-4 h-4 text-[#F0B90B] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP LEDGER RIBBON: Direct Payment Credentials & Live Currency Toggle */}
      <div className="bg-[#1C1916] text-[#F4EFE6] border-b border-[#1C1916] px-3 sm:px-6 py-2 text-[11px] font-mono">
        <div className="max-w-[1400px] mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="inline-flex items-center gap-1.5 text-[#F0B90B] font-semibold">
              <span className="w-2 h-2 rounded-full bg-[#2E9F4E] animate-pulse" />
              DIRECT WORKSHOP DISPATCH
            </span>

            <button
              type="button"
              onClick={() =>
                copyText('03419347950', 'top-np', 'NayaPay / Easypaisa (Jamal Ahmad)')
              }
              className="hover:text-[#F0B90B] transition-colors inline-flex items-center gap-1"
              title="Click to copy NayaPay & Easypaisa account number"
            >
              <span className="text-[#D5CBB8]">NayaPay & Easypaisa:</span>{' '}
              <strong className="underline">03419347950</strong> (Jamal Ahmad)
              <Copy className="w-3 h-3 inline ml-0.5 opacity-75" />
            </button>

            <span className="hidden md:inline text-[#575047]">|</span>

            <button
              type="button"
              onClick={() => copyText('764552613', 'top-bn', 'Binance Pay ID')}
              className="hover:text-[#F0B90B] transition-colors inline-flex items-center gap-1"
              title="Click to copy Binance Pay ID"
            >
              <span className="text-[#D5CBB8]">Binance Pay ID:</span>{' '}
              <strong className="underline text-[#F0B90B]">764552613</strong>
              <Copy className="w-3 h-3 inline ml-0.5 opacity-75" />
            </button>

            <span className="hidden lg:inline text-[#575047]">|</span>

            <a
              href="#payment-desk"
              className="hidden lg:inline-flex items-center gap-1 text-[#7CC6EA] hover:underline"
            >
              Gateway: <strong>gopayfast.com</strong>
            </a>
          </div>

          {/* Currency Display Toggle (PKR <-> USDT) */}
          <div className="flex items-center gap-3 ml-auto">
            <span className="hidden sm:inline text-[#D5CBB8]">
              1 USDT = Rs. {USDT_RATE_PKR}
            </span>
            <div className="inline-flex border border-[#575047] bg-[#2C2723] p-0.5">
              <button
                type="button"
                onClick={() => setCurrencyMode('PKR')}
                className={`px-2 py-0.5 text-[10px] font-bold transition-colors ${
                  currencyMode === 'PKR'
                    ? 'bg-[#B84A27] text-white'
                    : 'text-[#D5CBB8] hover:text-white'
                }`}
              >
                PKR (₨)
              </button>
              <button
                type="button"
                onClick={() => setCurrencyMode('USDT')}
                className={`px-2 py-0.5 text-[10px] font-bold transition-colors ${
                  currencyMode === 'USDT'
                    ? 'bg-[#F0B90B] text-[#1C1916]'
                    : 'text-[#D5CBB8] hover:text-white'
                }`}
              >
                USDT ($)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* EDITORIAL MASTHEAD HEADER */}
      <header className="sticky top-0 z-30 bg-[#F4EFE6]/95 backdrop-blur-sm border-b-2 border-[#1C1916]">
        <div className="max-w-[1400px] mx-auto grid grid-cols-12 items-center">
          {/* Left Metadata Cell */}
          <div className="hidden lg:flex lg:col-span-3 flex-col justify-center px-6 py-4 border-r border-[#D5CBB8] font-mono text-[11px]">
            <span className="text-[#B84A27] font-bold uppercase tracking-widest">
              ARCHIVE ISSUE № 09 // 2026
            </span>
            <span className="text-[#575047] mt-0.5">
              PESHAWAR • MULTAN • SWAT • LAHORE
            </span>
          </div>

          {/* Center Brand Identity */}
          <div className="col-span-6 lg:col-span-5 px-4 sm:px-6 py-3.5 lg:border-r border-[#D5CBB8] flex items-center justify-between">
            <a href="#top" className="group block">
              <div className="flex items-baseline gap-2.5">
                <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#1C1916] group-hover:text-[#B84A27] transition-colors">
                  KĀRGHAR
                </h1>
                <span className="font-serif text-lg sm:text-xl text-[#B84A27]">
                  کارگھر
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono uppercase tracking-widest border border-[#1C1916] bg-[#FAF7F2]">
                  Atelier & Bazaar
                </span>
              </div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-[#575047] mt-0.5">
                Unhurried Hand-Built Goods • Verified Merchant: Jamal Ahmad
              </p>
            </a>
          </div>

          {/* Right Controls & Satchel */}
          <div className="col-span-6 lg:col-span-4 px-4 sm:px-6 py-3 flex items-center justify-end gap-2 sm:gap-2.5">
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER_RAW}?text=${encodeURIComponent(
                'Assalam-o-Alaikum Jamal Ahmad (+923419347950)! I am visiting your KĀRGHAR Storefront.'
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-2 border border-[#1C1916] bg-[#25D366] hover:bg-[#1E7E34] text-[#1C1916] hover:text-white font-mono text-[11px] font-bold uppercase tracking-wider transition-colors"
              title={`Chat on WhatsApp: ${WHATSAPP_NUMBER_DISPLAY}`}
            >
              <WhatsAppIconSvg className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">{WHATSAPP_NUMBER_DISPLAY}</span>
            </a>

            <button
              type="button"
              onClick={() => setIsAddProductOpen(true)}
              className="hidden sm:inline-flex items-center gap-1 px-2.5 py-2 border border-[#1C1916] bg-[#FAF7F2] hover:bg-[#1C1916] hover:text-[#FAF7F2] font-mono text-[11px] uppercase tracking-wider transition-colors"
              title="Add your own custom product to the catalog"
            >
              <Plus className="w-3.5 h-3.5 text-[#B84A27]" />
              <span>Add Lot</span>
            </button>

            <button
              type="button"
              onClick={() => setIsOrdersOpen(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-2 border border-[#1C1916] bg-[#FAF7F2] hover:bg-[#EAE2D3] font-mono text-[11px] uppercase tracking-wider transition-colors"
              title="View saved order receipts and Transaction IDs"
            >
              <FileText className="w-3.5 h-3.5 text-[#B84A27]" />
              <span className="hidden md:inline">Receipts</span>
              <span className="px-1.5 py-0.2 bg-[#EAE2D3] text-[#1C1916] font-bold">
                {orders.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#1C1916] hover:bg-[#B84A27] text-[#FAF7F2] font-mono text-xs uppercase tracking-wider border border-[#1C1916] shadow-[3px_3px_0px_#B84A27] transition-all"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-[#F0B90B]" />
              <span>Satchel ({totalCartItems})</span>
              {totalCartPkr > 0 && (
                <span className="hidden xl:inline text-[#F0B90B] font-bold">
                  • {formatDisplayPrice(totalCartPkr)}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* MAIN ARCHITECTURAL GRID CONTAINER */}
      <main id="top" className="max-w-[1400px] w-full mx-auto flex-1 border-x border-[#D5CBB8]">
        {/* SECTION 1: ASYMMETRIC EDITORIAL HERO */}
        <section className="grid grid-cols-1 lg:grid-cols-12 border-b-2 border-[#1C1916]">
          {/* Left 7 Columns: Editorial Typography & Provenance Ledger */}
          <div className="lg:col-span-7 p-6 sm:p-10 lg:p-12 border-b lg:border-b-0 lg:border-r border-[#D5CBB8] flex flex-col justify-between relative">
            <div className="space-y-6">
              <div className="inline-flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-1 bg-[#B84A27] text-[#FAF7F2] font-mono text-[11px] uppercase tracking-widest">
                  No Assembly Lines • Small Batch Lots
                </span>
                <span className="px-2.5 py-1 border border-[#1C1916] bg-[#FAF7F2] font-mono text-[11px] uppercase tracking-widest">
                  94% Natural & Raw Materials
                </span>
              </div>

              <div className="space-y-2">
                <h2 className="font-serif text-4xl sm:text-5xl xl:text-[56px] text-[#1C1916] leading-[1.06] tracking-tight">
                  Objects shaped by{' '}
                  <span className="italic font-normal text-[#B84A27] relative inline-block">
                    calloused hands,
                    <HandDrawnUnderline className="w-full text-[#B84A27] mt-0.5" />
                  </span>{' '}
                  numbered like archival editions.
                </h2>
              </div>

              <p className="font-sans text-base sm:text-lg text-[#575047] max-w-2xl leading-relaxed">
                From two-needle saddle-stitched buffalo leather in{' '}
                <strong className="text-[#1C1916]">Peshawar’s Qissa Khwani</strong> to
                reduction-fired cobalt stoneware in <strong className="text-[#1C1916]">Multan</strong>{' '}
                and pit-loomed highland wool in <strong className="text-[#1C1916]">Swat</strong>.
                Every piece carries its maker’s stamp, bench hours, and direct settlement via{' '}
                <strong className="text-[#1C1916]">GoPayFast</strong>,{' '}
                <strong className="text-[#1C1916]">NayaPay</strong>,{' '}
                <strong className="text-[#1C1916]">Easypaisa</strong>, or{' '}
                <strong className="text-[#1C1916]">Binance Pay</strong>.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-wrap items-center gap-3.5 pt-2">
                <a
                  href="#catalog-ledger"
                  className="px-6 py-3.5 bg-[#1C1916] hover:bg-[#B84A27] text-[#FAF7F2] font-mono text-xs uppercase tracking-widest border-2 border-[#1C1916] shadow-[4px_4px_0px_#B84A27] transition-all inline-flex items-center gap-2"
                >
                  <span>Explore Numbered Lots</span>
                  <ArrowUpRight className="w-4 h-4" />
                </a>

                <button
                  type="button"
                  onClick={() => handleOpenCheckout('nayapay')}
                  className="px-5 py-3.5 bg-[#FAF7F2] hover:bg-[#EAE2D3] text-[#1C1916] font-mono text-xs uppercase tracking-widest border-2 border-[#1C1916] shadow-[4px_4px_0px_#1C1916] transition-all"
                >
                  Open Payment Terminal
                </button>

                <a
                  href="#payment-desk"
                  className="px-4 py-3 font-mono text-xs uppercase tracking-wider underline text-[#B84A27] hover:text-[#1C1916]"
                >
                  Verify Payment Accounts ↓
                </a>
              </div>
            </div>

            {/* Bottom Architectural Provenance Strip */}
            <div className="mt-10 pt-6 border-t border-[#D5CBB8] grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-xs">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-[#8A8175] block">
                  01 / NAYAPAY
                </span>
                <strong className="text-[#1C1916] block mt-0.5">03419347950</strong>
                <span className="text-[11px] text-[#B84A27]">Jamal Ahmad</span>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-widest text-[#8A8175] block">
                  02 / EASYPAISA
                </span>
                <strong className="text-[#1C1916] block mt-0.5">03419347950</strong>
                <span className="text-[11px] text-[#1E7E34]">Jamal Ahmad</span>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-widest text-[#8A8175] block">
                  03 / BINANCE PAY
                </span>
                <strong className="text-[#1C1916] block mt-0.5">ID: 764552613</strong>
                <span className="text-[11px] text-[#947134]">USDT / USDC / BNB</span>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-widest text-[#8A8175] block">
                  04 / GOPAYFAST
                </span>
                <strong className="text-[#0B4F6C] block mt-0.5">gopayfast.com</strong>
                <span className="text-[11px] text-[#575047]">Cards & Raast P2M</span>
              </div>
            </div>
          </div>

          {/* Right 5 Columns: Framed Darkroom Workshop Print & Wax Seal */}
          <div className="lg:col-span-5 p-6 sm:p-8 bg-[#EAE2D3]/60 flex flex-col justify-between relative">
            <div className="relative">
              {/* Photo Mount Frame */}
              <div className="p-3 bg-[#FAF7F2] border-2 border-[#1C1916] shadow-[6px_6px_0px_#1C1916]">
                <div className="relative aspect-[4/3] overflow-hidden border border-[#1C1916]">
                  <img
                    src="/images/hero-workshop.jpg"
                    alt="Kārghar Artisan Workbench in Morning Light"
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute top-3 left-3 px-2.5 py-1 bg-[#1C1916]/90 text-[#FAF7F2] font-mono text-[10px] uppercase tracking-widest">
                    FIG 01. SADDLERY BENCH — PESHAWAR
                  </div>
                </div>
                <div className="pt-3 flex items-center justify-between font-mono text-[11px] text-[#575047]">
                  <span>ARCHIVE NEGATIVE #KRG-2026-A</span>
                  <span className="text-[#B84A27] font-bold">NATURAL VEGETABLE TAN</span>
                </div>
              </div>

              {/* Overlapping Rotating Wax Seal Stamp */}
              <div className="hidden sm:block absolute -bottom-6 -left-5 rotate-[-8deg] drop-shadow-md">
                <ArtisanWaxSeal className="w-28 h-28" />
              </div>
            </div>

            {/* Featured Flagship Quick-Card */}
            <div className="mt-8 sm:pl-24">
              <div className="p-3.5 bg-[#FAF7F2] border border-[#1C1916] flex items-center justify-between gap-3">
                <div>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-[#B84A27] block">
                    Featured Bench Lot • {INITIAL_PRODUCTS[0].lotNumber}
                  </span>
                  <h3 className="font-serif text-sm font-bold text-[#1C1916]">
                    {INITIAL_PRODUCTS[0].title}
                  </h3>
                  <span className="font-mono text-xs text-[#575047]">
                    {formatDisplayPrice(INITIAL_PRODUCTS[0].pricePkr)} • 28 Bench Hours
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setInspectedProduct(INITIAL_PRODUCTS[0])}
                  className="px-3 py-2 bg-[#1C1916] hover:bg-[#B84A27] text-[#FAF7F2] font-mono text-[11px] uppercase shrink-0 transition-colors"
                >
                  Inspect
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: CATALOGUE FILTER BAR & VIEW SWITCHER */}
        <section id="catalog-ledger" className="border-b-2 border-[#1C1916] bg-[#FAF7F2]">
          <div className="p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#D5CBB8]">
            <div>
              <span className="font-mono text-[11px] uppercase tracking-widest text-[#B84A27] block">
                Curated Multi-Category Storefront
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl text-[#1C1916]">
                Numbered Workshop Editions & Craft Lots
              </h2>
            </div>

            {/* Search + View Toggle */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 text-[#8A8175] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search lot, city, leather, brass..."
                  className="w-full pl-9 pr-3 py-2 bg-[#F4EFE6] border border-[#1C1916] font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#B84A27]"
                />
              </div>

              <div className="inline-flex border border-[#1C1916] bg-[#F4EFE6]">
                <button
                  type="button"
                  onClick={() => setViewMode('editorial')}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 font-mono text-xs uppercase ${
                    viewMode === 'editorial'
                      ? 'bg-[#1C1916] text-[#FAF7F2]'
                      : 'text-[#1C1916] hover:bg-[#EAE2D3]'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Editorial Grid</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('ledger')}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 font-mono text-xs uppercase ${
                    viewMode === 'ledger'
                      ? 'bg-[#1C1916] text-[#FAF7F2]'
                      : 'text-[#1C1916] hover:bg-[#EAE2D3]'
                  }`}
                >
                  <Table2 className="w-3.5 h-3.5" />
                  <span>Index Ledger</span>
                </button>
              </div>
            </div>
          </div>

          {/* Category Strip */}
          <div className="flex overflow-x-auto divide-x divide-[#D5CBB8] bg-[#F4EFE6]">
            {CATEGORIES.map((cat) => {
              const active = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 sm:px-5 py-3 text-left shrink-0 transition-colors ${
                    active
                      ? 'bg-[#1C1916] text-[#FAF7F2]'
                      : 'hover:bg-[#EAE2D3] text-[#1C1916]'
                  }`}
                >
                  <span
                    className={`font-mono text-[10px] uppercase tracking-widest block ${
                      active ? 'text-[#F0B90B]' : 'text-[#8A8175]'
                    }`}
                  >
                    {cat.countNote}
                  </span>
                  <span className="font-serif text-sm font-semibold whitespace-nowrap">
                    {cat.label}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* SECTION 3: PRODUCT SHOWCASE (EDITORIAL ASYMMETRIC GRID OR ARCHIVAL LEDGER TABLE) */}
        <section className="border-b-2 border-[#1C1916]">
          {filteredProducts.length === 0 ? (
            <div className="p-16 text-center space-y-3">
              <p className="font-serif text-2xl text-[#1C1916]">
                No workshop lots match “{searchQuery}”.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('all');
                  setSearchQuery('');
                }}
                className="px-4 py-2 bg-[#1C1916] text-[#FAF7F2] font-mono text-xs uppercase"
              >
                Reset Archive Filter
              </button>
            </div>
          ) : viewMode === 'editorial' ? (
            /* ASYMMETRIC EDITORIAL BOUTIQUE GRID */
            <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 border-b border-[#D5CBB8]">
              {filteredProducts.map((product, index) => {
                // Create a human-curated asymmetric rhythm: flagship/featured items span 6 cols on desktop, others span 4 cols
                const isWide =
                  index === 0 || index === 3 || index === 4;
                const colClass = isWide
                  ? 'md:col-span-6'
                  : 'md:col-span-4';

                const activeOpt =
                  cardVariants[product.id] ||
                  product.variants?.options[0] ||
                  'Standard Edition';

                return (
                  <article
                    key={product.id}
                    className={`${colClass} group p-5 sm:p-6 bg-[#FAF7F2] hover:bg-[#F4EFE6] border-b border-r border-[#D5CBB8] flex flex-col justify-between transition-colors relative`}
                  >
                    <div>
                      {/* Top Lot Stamp & City Header */}
                      <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-[#D5CBB8] font-mono text-[11px]">
                        <span className="font-bold text-[#B84A27] tracking-wider">
                          {product.lotNumber}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[#575047]">
                          <MapPin className="w-3 h-3 text-[#B84A27]" />
                          {product.originCity}
                        </span>
                      </div>

                      {/* Image Container */}
                      <div
                        onClick={() => setInspectedProduct(product)}
                        className={`relative overflow-hidden border border-[#1C1916] bg-[#EAE2D3] cursor-pointer mb-4 ${
                          isWide ? 'aspect-[16/10]' : 'aspect-[4/3]'
                        }`}
                      >
                        <img
                          src={product.image}
                          alt={product.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />

                        {product.badge && (
                          <span className="absolute top-3 left-3 px-2.5 py-0.5 bg-[#1C1916] text-[#FAF7F2] font-mono text-[10px] uppercase tracking-widest border border-[#FAF7F2]/30">
                            {product.badge}
                          </span>
                        )}

                        <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
                          <span className="px-2 py-0.5 bg-[#FAF7F2]/95 border border-[#1C1916] font-mono text-[10px] text-[#1C1916] inline-flex items-center gap-1">
                            <Clock className="w-3 h-3 text-[#B84A27]" />
                            {product.craftingHours} hrs craft time
                          </span>
                          {product.urduTitle && (
                            <span className="px-2.5 py-0.5 bg-[#1C1916]/90 text-[#FAF7F2] font-serif text-xs">
                              {product.urduTitle}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Category & Title */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-[#8A8175]">
                          <span>{product.categoryLabel}</span>
                          <span>By {product.artisanName}</span>
                        </div>

                        <h3
                          onClick={() => setInspectedProduct(product)}
                          className="font-serif text-xl sm:text-2xl text-[#1C1916] group-hover:text-[#B84A27] cursor-pointer leading-snug transition-colors"
                        >
                          {product.title}
                        </h3>

                        <p className="text-xs text-[#575047] line-clamp-2 leading-relaxed">
                          {product.subtitle} — {product.description}
                        </p>
                      </div>

                      {/* Variant Selector Pill Strip */}
                      {product.variants && (
                        <div className="mt-3.5 pt-3 border-t border-dashed border-[#D5CBB8]">
                          <span className="font-mono text-[10px] uppercase tracking-wider text-[#575047] block mb-1.5">
                            {product.variants.label}:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {product.variants.options.map((opt) => (
                              <button
                                key={opt}
                                type="button"
                                onClick={() =>
                                  setCardVariants({ ...cardVariants, [product.id]: opt })
                                }
                                className={`px-2 py-0.5 font-mono text-[10px] border transition-colors ${
                                  activeOpt === opt
                                    ? 'bg-[#1C1916] text-[#FAF7F2] border-[#1C1916]'
                                    : 'bg-white text-[#575047] border-[#D5CBB8] hover:border-[#1C1916]'
                                }`}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Bottom Price & Action Footer */}
                    <div className="mt-5 pt-3.5 border-t border-[#1C1916] space-y-2.5">
                      <div className="flex items-baseline justify-between">
                        <div>
                          <span className="font-mono text-lg sm:text-xl font-bold text-[#1C1916]">
                            {formatDisplayPrice(product.pricePkr)}
                          </span>
                          {product.originalPricePkr && currencyMode === 'PKR' && (
                            <span className="ml-2 font-mono text-xs line-through text-[#8A8175]">
                              {formatPkr(product.originalPricePkr)}
                            </span>
                          )}
                        </div>
                        <span className="font-mono text-[11px] text-[#B84A27] font-medium">
                          {currencyMode === 'PKR'
                            ? `≈ ${formatUsdt(product.pricePkr)}`
                            : formatPkr(product.pricePkr)}
                        </span>
                      </div>

                      <div className="grid grid-cols-12 gap-2">
                        <button
                          type="button"
                          onClick={() => setInspectedProduct(product)}
                          className="col-span-4 py-2 px-2 border border-[#1C1916] bg-white hover:bg-[#EAE2D3] font-mono text-[11px] uppercase tracking-wider flex items-center justify-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" /> Dossier
                        </button>

                        <button
                          type="button"
                          onClick={() => handleAddToCart(product, activeOpt, 1)}
                          className="col-span-8 py-2 px-3 bg-[#1C1916] hover:bg-[#B84A27] text-[#FAF7F2] font-mono text-[11px] uppercase tracking-widest border border-[#1C1916] transition-colors flex items-center justify-center gap-1.5"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>+ Add to Satchel</span>
                        </button>
                      </div>

                      {/* Quick 1-Click Gateway Buy Row */}
                      <div className="pt-1 flex items-center justify-between gap-1 text-[10px] font-mono text-[#575047]">
                        <span>Quick Buy:</span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              handleInstantBuy(product, activeOpt, 1, 'nayapay')
                            }
                            className="px-1.5 py-0.5 bg-[#FDF0E6] hover:bg-[#E85D04] hover:text-white border border-[#E85D04]/60 text-[#1C1916]"
                          >
                            NayaPay
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleInstantBuy(product, activeOpt, 1, 'easypaisa')
                            }
                            className="px-1.5 py-0.5 bg-[#E8F6EC] hover:bg-[#1E7E34] hover:text-white border border-[#1E7E34]/60 text-[#1C1916]"
                          >
                            Easypaisa
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleInstantBuy(product, activeOpt, 1, 'binance')
                            }
                            className="px-1.5 py-0.5 bg-[#FBF5E4] hover:bg-[#181A20] hover:text-[#F0B90B] border border-[#C69214]/60 text-[#1C1916]"
                          >
                            Binance
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleInstantBuy(product, activeOpt, 1, 'gopayfast')
                            }
                            className="px-1.5 py-0.5 bg-[#E7F2F7] hover:bg-[#0B4F6C] hover:text-white border border-[#0B4F6C]/60 text-[#1C1916]"
                          >
                            GoPayFast
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            /* ARCHIVAL LEDGER TABLE VIEW */
            <div className="overflow-x-auto bg-[#FAF7F2]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#1C1916] text-[#FAF7F2] font-mono text-[11px] uppercase tracking-wider">
                    <th className="py-3 px-4">Lot №</th>
                    <th className="py-3 px-4">Crafted Piece</th>
                    <th className="py-3 px-4">Origin & Master</th>
                    <th className="py-3 px-4">Materials</th>
                    <th className="py-3 px-4">Bench Time</th>
                    <th className="py-3 px-4 text-right">PKR / USDT</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D5CBB8] text-xs">
                  {filteredProducts.map((product) => (
                    <tr
                      key={product.id}
                      className="hover:bg-[#EAE2D3]/60 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-[#B84A27] whitespace-nowrap">
                        {product.lotNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={product.image}
                            alt={product.title}
                            className="w-12 h-12 object-cover border border-[#1C1916]"
                          />
                          <div>
                            <div
                              onClick={() => setInspectedProduct(product)}
                              className="font-serif font-bold text-sm text-[#1C1916] hover:text-[#B84A27] cursor-pointer"
                            >
                              {product.title}
                            </div>
                            <span className="font-mono text-[10px] text-[#575047]">
                              {product.categoryLabel}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs">
                        <strong className="block text-[#1C1916]">
                          {product.originCity}
                        </strong>
                        <span className="text-[11px] text-[#575047]">
                          {product.artisanName}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-[#575047] max-w-xs">
                        {product.materials.slice(0, 2).join(' • ')}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs whitespace-nowrap">
                        {product.craftingHours} Hours
                      </td>
                      <td className="py-3.5 px-4 font-mono text-right whitespace-nowrap">
                        <strong className="block text-sm text-[#1C1916]">
                          {formatPkr(product.pricePkr)}
                        </strong>
                        <span className="text-[11px] text-[#B84A27]">
                          {formatUsdt(product.pricePkr)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setInspectedProduct(product)}
                            className="px-2.5 py-1.5 border border-[#1C1916] bg-white font-mono text-[11px]"
                          >
                            Specs
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAddToCart(product)}
                            className="px-3 py-1.5 bg-[#1C1916] hover:bg-[#B84A27] text-white font-mono text-[11px] uppercase"
                          >
                            + Satchel
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* SECTION 4: INTERACTIVE VERIFIED PAYMENT GATEWAYS DESK */}
        <section id="payment-desk" className="border-b-2 border-[#1C1916] bg-[#EAE2D3]/60 p-6 sm:p-10">
          <div className="max-w-4xl mb-8">
            <span className="px-2.5 py-1 bg-[#1C1916] text-[#F0B90B] font-mono text-[11px] uppercase tracking-widest inline-block mb-2">
              Official Settlement Desk • 4 Integrated Payment Gateways
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl text-[#1C1916]">
              Direct Merchant Settlement — No Middleman Holds
            </h2>
            <p className="text-sm text-[#575047] mt-1.5 leading-relaxed">
              Every order can be settled through Pakistan’s licensed{' '}
              <strong className="text-[#1C1916]">GoPayFast (gopayfast.com)</strong> gateway, direct
              mobile wallet transfer via <strong className="text-[#1C1916]">NayaPay</strong> or{' '}
              <strong className="text-[#1C1916]">Easypaisa</strong> to{' '}
              <strong className="text-[#1C1916]">Jamal Ahmad (03419347950)</strong>, or global
              crypto checkout via <strong className="text-[#1C1916]">Binance Pay (ID: 764552613)</strong>.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* 4 Gateway Cards (8 Cols) */}
            <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* CARD 1: NAYAPAY */}
              <div
                onClick={() => setActiveQrGateway('nayapay')}
                className={`p-5 bg-[#FAF7F2] border-2 transition-all cursor-pointer flex flex-col justify-between ${
                  activeQrGateway === 'nayapay'
                    ? 'border-[#1C1916] shadow-[6px_6px_0px_#E85D04]'
                    : 'border-[#D5CBB8] hover:border-[#1C1916]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#D5CBB8]">
                    <GatewayEmblem gateway="nayapay" />
                    <span className="px-2 py-0.5 bg-[#FDF0E6] text-[#E85D04] border border-[#E85D04] font-mono text-[10px] font-bold uppercase">
                      Instant Raast / Wallet
                    </span>
                  </div>

                  <div className="space-y-2 font-mono">
                    <div>
                      <span className="text-[10px] uppercase text-[#575047] block">
                        Account Number
                      </span>
                      <div className="flex items-center justify-between">
                        <strong className="text-xl text-[#1C1916]">03419347950</strong>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyText('03419347950', 'desk-np', 'NayaPay Number');
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#1C1916] hover:bg-[#E85D04] text-white text-[11px]"
                        >
                          {copiedBadge === 'desk-np' ? (
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
                    </div>

                    <div className="pt-1">
                      <span className="text-[10px] uppercase text-[#575047] block">
                        Verified Account Name
                      </span>
                      <strong className="text-sm font-serif text-[#1C1916] flex items-center gap-1">
                        Jamal Ahmad <ShieldCheck className="w-4 h-4 text-[#E85D04]" />
                      </strong>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenCheckout('nayapay');
                  }}
                  className="mt-4 w-full py-2 bg-[#FDF0E6] hover:bg-[#E85D04] hover:text-white text-[#1C1916] border border-[#1C1916] font-mono text-xs uppercase tracking-wider font-bold transition-colors"
                >
                  Checkout with NayaPay →
                </button>
              </div>

              {/* CARD 2: EASYPAISA */}
              <div
                onClick={() => setActiveQrGateway('easypaisa')}
                className={`p-5 bg-[#FAF7F2] border-2 transition-all cursor-pointer flex flex-col justify-between ${
                  activeQrGateway === 'easypaisa'
                    ? 'border-[#1C1916] shadow-[6px_6px_0px_#1E7E34]'
                    : 'border-[#D5CBB8] hover:border-[#1C1916]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#D5CBB8]">
                    <GatewayEmblem gateway="easypaisa" />
                    <span className="px-2 py-0.5 bg-[#E8F6EC] text-[#1E7E34] border border-[#1E7E34] font-mono text-[10px] font-bold uppercase">
                      App & *786#
                    </span>
                  </div>

                  <div className="space-y-2 font-mono">
                    <div>
                      <span className="text-[10px] uppercase text-[#575047] block">
                        Account Number
                      </span>
                      <div className="flex items-center justify-between">
                        <strong className="text-xl text-[#1C1916]">03419347950</strong>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyText('03419347950', 'desk-ep', 'Easypaisa Number');
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#1C1916] hover:bg-[#1E7E34] text-white text-[11px]"
                        >
                          {copiedBadge === 'desk-ep' ? (
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
                    </div>

                    <div className="pt-1">
                      <span className="text-[10px] uppercase text-[#575047] block">
                        Verified Account Name
                      </span>
                      <strong className="text-sm font-serif text-[#1C1916] flex items-center gap-1">
                        Jamal Ahmad <ShieldCheck className="w-4 h-4 text-[#1E7E34]" />
                      </strong>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenCheckout('easypaisa');
                  }}
                  className="mt-4 w-full py-2 bg-[#E8F6EC] hover:bg-[#1E7E34] hover:text-white text-[#1C1916] border border-[#1C1916] font-mono text-xs uppercase tracking-wider font-bold transition-colors"
                >
                  Checkout with Easypaisa →
                </button>
              </div>

              {/* CARD 3: BINANCE PAY */}
              <div
                onClick={() => setActiveQrGateway('binance')}
                className={`p-5 bg-[#FAF7F2] border-2 transition-all cursor-pointer flex flex-col justify-between ${
                  activeQrGateway === 'binance'
                    ? 'border-[#1C1916] shadow-[6px_6px_0px_#C69214]'
                    : 'border-[#D5CBB8] hover:border-[#1C1916]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#D5CBB8]">
                    <GatewayEmblem gateway="binance" />
                    <span className="px-2 py-0.5 bg-[#181A20] text-[#F0B90B] font-mono text-[10px] font-bold uppercase">
                      USDT / USDC / BNB
                    </span>
                  </div>

                  <div className="space-y-2 font-mono">
                    <div>
                      <span className="text-[10px] uppercase text-[#575047] block">
                        Official Binance Pay ID
                      </span>
                      <div className="flex items-center justify-between">
                        <strong className="text-xl text-[#1C1916]">764552613</strong>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyText('764552613', 'desk-bn', 'Binance Pay ID');
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#181A20] hover:bg-[#B84A27] text-[#F0B90B] hover:text-white text-[11px]"
                        >
                          {copiedBadge === 'desk-bn' ? (
                            <>
                              <Check className="w-3 h-3" /> Copied
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" /> Copy ID
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="pt-1">
                      <span className="text-[10px] uppercase text-[#575047] block">
                        Merchant Account & Conversion
                      </span>
                      <strong className="text-xs text-[#1C1916] block">
                        Jamal Ahmad • Auto PKR → USDT
                      </strong>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenCheckout('binance');
                  }}
                  className="mt-4 w-full py-2 bg-[#FBF5E4] hover:bg-[#181A20] hover:text-[#F0B90B] text-[#1C1916] border border-[#1C1916] font-mono text-xs uppercase tracking-wider font-bold transition-colors"
                >
                  Checkout with Binance Pay →
                </button>
              </div>

              {/* CARD 4: GOPAYFAST (gopayfast.com) */}
              <div
                onClick={() => setActiveQrGateway('gopayfast')}
                className={`p-5 bg-[#FAF7F2] border-2 transition-all cursor-pointer flex flex-col justify-between ${
                  activeQrGateway === 'gopayfast'
                    ? 'border-[#1C1916] shadow-[6px_6px_0px_#0B4F6C]'
                    : 'border-[#D5CBB8] hover:border-[#1C1916]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#D5CBB8]">
                    <GatewayEmblem gateway="gopayfast" />
                    <a
                      href="https://gopayfast.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#E7F2F7] text-[#0B4F6C] border border-[#0B4F6C] font-mono text-[10px] font-bold"
                    >
                      gopayfast.com <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>

                  <div className="space-y-2 font-mono">
                    <div>
                      <span className="text-[10px] uppercase text-[#575047] block">
                        Supported Channels
                      </span>
                      <strong className="text-sm text-[#1C1916] block">
                        Visa • Mastercard • PayPak • Raast P2M
                      </strong>
                    </div>

                    <div className="pt-1">
                      <span className="text-[10px] uppercase text-[#575047] block">
                        Gateway Status
                      </span>
                      <strong className="text-xs text-[#0B4F6C] flex items-center gap-1">
                        SBP Licensed IPG • 3D-Secure Enabled
                      </strong>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenCheckout('gopayfast');
                  }}
                  className="mt-4 w-full py-2 bg-[#E7F2F7] hover:bg-[#0B4F6C] hover:text-white text-[#1C1916] border border-[#1C1916] font-mono text-xs uppercase tracking-wider font-bold transition-colors"
                >
                  Pay via GoPayFast.com →
                </button>
              </div>
            </div>

            {/* Right 4 Columns: Interactive Live QR & Terminal Inspector */}
            <div className="lg:col-span-4 p-6 bg-[#FAF7F2] border-2 border-[#1C1916] shadow-[6px_6px_0px_#1C1916] flex flex-col items-center justify-between text-center">
              <div className="w-full pb-3 border-b border-[#D5CBB8] flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-[#575047]">
                <span>LIVE QR TERMINAL</span>
                <span className="text-[#B84A27] font-bold">{activeQrGateway.toUpperCase()}</span>
              </div>

              <div className="py-5 flex flex-col items-center">
                {activeQrGateway === 'nayapay' && (
                  <>
                    <DynamicPaymentQR
                      payload="NAYAPAY:03419347950:JAMAL_AHMAD"
                      accentColor="#E85D04"
                      centerBadgeText="NP"
                      size={168}
                    />
                    <div className="mt-4 font-mono">
                      <span className="text-[10px] uppercase text-[#575047] block">
                        NayaPay Account
                      </span>
                      <strong className="text-lg text-[#1C1916] block">03419347950</strong>
                      <span className="text-xs font-serif font-bold text-[#E85D04]">
                        Jamal Ahmad
                      </span>
                    </div>
                  </>
                )}

                {activeQrGateway === 'easypaisa' && (
                  <>
                    <DynamicPaymentQR
                      payload="EASYPAISA:03419347950:JAMAL_AHMAD"
                      accentColor="#1E7E34"
                      centerBadgeText="EP"
                      size={168}
                    />
                    <div className="mt-4 font-mono">
                      <span className="text-[10px] uppercase text-[#575047] block">
                        Easypaisa Mobile Account
                      </span>
                      <strong className="text-lg text-[#1C1916] block">03419347950</strong>
                      <span className="text-xs font-serif font-bold text-[#1E7E34]">
                        Jamal Ahmad
                      </span>
                    </div>
                  </>
                )}

                {activeQrGateway === 'binance' && (
                  <>
                    <DynamicPaymentQR
                      payload="BINANCE_PAY:764552613:JAMAL_AHMAD"
                      accentColor="#181A20"
                      centerBadgeText="BNB"
                      size={168}
                    />
                    <div className="mt-4 font-mono">
                      <span className="text-[10px] uppercase text-[#575047] block">
                        Binance Pay ID
                      </span>
                      <strong className="text-lg text-[#1C1916] block">764552613</strong>
                      <span className="text-xs text-[#947134] font-bold">
                        Instant USDT / USDC / BNB
                      </span>
                    </div>
                  </>
                )}

                {activeQrGateway === 'gopayfast' && (
                  <>
                    <DynamicPaymentQR
                      payload="https://gopayfast.com?merchant=GPF-PK-20894&account=03419347950"
                      accentColor="#0B4F6C"
                      centerBadgeText="GPF"
                      size={168}
                    />
                    <div className="mt-4 font-mono">
                      <span className="text-[10px] uppercase text-[#575047] block">
                        GoPayFast Raast & Card Gateway
                      </span>
                      <strong className="text-base text-[#0B4F6C] block">gopayfast.com</strong>
                      <span className="text-xs text-[#1C1916]">
                        Merchant: Jamal Ahmad
                      </span>
                    </div>
                  </>
                )}
              </div>

              <div className="w-full pt-3 border-t border-[#D5CBB8] flex justify-center gap-1.5 font-mono text-[10px]">
                {(['nayapay', 'easypaisa', 'binance', 'gopayfast'] as const).map((gw) => (
                  <button
                    key={gw}
                    type="button"
                    onClick={() => setActiveQrGateway(gw)}
                    className={`px-2 py-1 uppercase border ${
                      activeQrGateway === gw
                        ? 'bg-[#1C1916] text-white border-[#1C1916]'
                        : 'bg-white text-[#1C1916] border-[#D5CBB8]'
                    }`}
                  >
                    {gw}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 5: ARTISAN MANIFESTO & WORKSHOP PROVENANCE */}
        <section className="grid grid-cols-1 lg:grid-cols-12 bg-[#FAF7F2]">
          <div className="lg:col-span-5 p-6 sm:p-10 border-b lg:border-b-0 lg:border-r border-[#D5CBB8] flex flex-col justify-between">
            <div className="space-y-4">
              <span className="font-mono text-[11px] uppercase tracking-widest text-[#B84A27] flex items-center gap-1.5">
                <Hammer className="w-3.5 h-3.5" /> Why We Reject Mass Production
              </span>
              <h3 className="font-serif text-2xl sm:text-3xl text-[#1C1916] leading-snug">
                “A machine repeats a pattern ten thousand times without feeling the grain. A craftsperson adjusts the chisel when the walnut knots.”
              </h3>
              <p className="text-xs sm:text-sm text-[#575047] leading-relaxed">
                Every lot in our ledger is commissioned directly from family-run karkhanas across
                Khyber Pakhtunkhwa, Punjab, and Gilgit-Baltistan. Your payment goes straight to our
                studio desk managed by <strong className="text-[#1C1916]">Jamal Ahmad</strong> with
                instant receipt generation.
              </p>
            </div>

            <div className="pt-6 mt-6 border-t border-[#D5CBB8] flex items-center justify-between font-mono text-xs">
              <span>STUDIO CURATOR: JAMAL AHMAD</span>
              <span className="text-[#B84A27] font-bold">DIRECT WHATSAPP: 03419347950</span>
            </div>
          </div>

          <div className="lg:col-span-7 p-6 sm:p-10 grid grid-cols-1 sm:grid-cols-3 gap-5 bg-[#F4EFE6]">
            <div className="p-4 bg-[#FAF7F2] border border-[#1C1916] space-y-2">
              <span className="font-mono text-xs font-bold text-[#B84A27]">01 // HIDE & LOOM</span>
              <h4 className="font-serif text-lg text-[#1C1916]">Full-Grain & Hand-Spun</h4>
              <p className="text-xs text-[#575047] leading-relaxed">
                We never use corrected-grain plastic-coated leather or synthetic polyester blends.
                Only drum-dyed buffalo hide, highland wool, and pit-loomed cotton khaddar.
              </p>
            </div>

            <div className="p-4 bg-[#FAF7F2] border border-[#1C1916] space-y-2">
              <span className="font-mono text-xs font-bold text-[#B84A27]">02 // TRANSPARENT PAY</span>
              <h4 className="font-serif text-lg text-[#1C1916]">4 Direct Gateways</h4>
              <p className="text-xs text-[#575047] leading-relaxed">
                Pay seamlessly in PKR via <strong>GoPayFast.com</strong>,{' '}
                <strong>NayaPay (03419347950)</strong>, or{' '}
                <strong>Easypaisa (03419347950)</strong>, or in USDT via{' '}
                <strong>Binance Pay (764552613)</strong>.
              </p>
            </div>

            <div className="p-4 bg-[#FAF7F2] border border-[#1C1916] space-y-2">
              <span className="font-mono text-xs font-bold text-[#B84A27]">03 // STAMPED VOUCHER</span>
              <h4 className="font-serif text-lg text-[#1C1916]">Instant TID Receipt</h4>
              <p className="text-xs text-[#575047] leading-relaxed">
                Every order generates a printable archival voucher recording your Transaction ID
                (TID) with one-click WhatsApp dispatch confirmation.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* ARCHITECTURAL FOOTER */}
      <footer className="bg-[#1C1916] text-[#F4EFE6] border-t-2 border-[#1C1916] mt-auto">
        <div className="max-w-[1400px] mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-5 space-y-3">
            <div className="flex items-baseline gap-2.5">
              <span className="font-serif text-2xl font-bold text-[#FAF7F2]">KĀRGHAR</span>
              <span className="font-serif text-lg text-[#F0B90B]">کارگھر</span>
            </div>
            <p className="text-xs text-[#D5CBB8] max-w-sm leading-relaxed">
              Handcrafted multi-category commerce studio celebrating enduring Pakistani craft—saddlery,
              stoneware, hand-loomed textiles, forged brass, and botanical apothecary.
            </p>
            <div className="pt-2 font-mono text-[11px] text-[#8A8175]">
              © 2026 KĀRGHAR ATELIER • CURATED BY JAMAL AHMAD
            </div>
          </div>

          <div className="md:col-span-4 space-y-2 font-mono text-xs">
            <span className="text-[10px] uppercase tracking-widest text-[#F0B90B] block">
              Verified Payment Accounts
            </span>
            <div className="p-3 bg-[#2C2723] border border-[#575047] space-y-1.5">
              <div>
                <span className="text-[#D5CBB8]">NayaPay:</span>{' '}
                <strong className="text-white">03419347950</strong> (Jamal Ahmad)
              </div>
              <div>
                <span className="text-[#D5CBB8]">Easypaisa:</span>{' '}
                <strong className="text-white">03419347950</strong> (Jamal Ahmad)
              </div>
              <div>
                <span className="text-[#D5CBB8]">Binance Pay ID:</span>{' '}
                <strong className="text-[#F0B90B]">764552613</strong>
              </div>
              <div>
                <span className="text-[#D5CBB8]">Card & Raast IPG:</span>{' '}
                <a
                  href="https://gopayfast.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#7CC6EA] underline"
                >
                  gopayfast.com
                </a>
              </div>
            </div>
          </div>

          <div className="md:col-span-3 space-y-2 font-mono text-xs">
            <span className="text-[10px] uppercase tracking-widest text-[#F0B90B] block">
              Quick Actions
            </span>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => handleOpenCheckout('nayapay')}
                className="text-left px-3 py-2 bg-[#B84A27] hover:bg-[#93381B] text-white uppercase tracking-wider"
              >
                Open Payment Terminal →
              </button>
              <button
                type="button"
                onClick={() => setIsOrdersOpen(true)}
                className="text-left px-3 py-2 bg-[#2C2723] hover:bg-[#575047] text-white uppercase tracking-wider"
              >
                View Saved Receipts ({orders.length})
              </button>
              <button
                type="button"
                onClick={() => setIsAddProductOpen(true)}
                className="text-left px-3 py-2 border border-[#575047] hover:border-white text-[#D5CBB8] uppercase tracking-wider"
              >
                + Add Custom Product
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* MODALS & DRAWERS */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cart}
        onUpdateQty={handleUpdateCartQty}
        onRemove={handleRemoveCartItem}
        onCheckout={handleOpenCheckout}
      />

      <OrdersDrawer
        isOpen={isOrdersOpen}
        onClose={() => setIsOrdersOpen(false)}
        orders={orders}
        onSelectOrder={(ord) => {
          setIsOrdersOpen(false);
          setActiveReceipt(ord);
        }}
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        items={
          cart.length > 0
            ? cart
            : [
                {
                  product: INITIAL_PRODUCTS[0],
                  quantity: 1,
                  selectedOption: INITIAL_PRODUCTS[0].variants?.options[0] || 'Standard',
                },
              ]
        }
        onOrderSuccess={handleOrderSuccess}
        initialGateway={checkoutGateway}
      />

      <OrderReceiptModal
        order={activeReceipt}
        onClose={() => setActiveReceipt(null)}
      />

      <ProductDetailModal
        product={inspectedProduct}
        onClose={() => setInspectedProduct(null)}
        onAddToCart={handleAddToCart}
        onInstantBuy={handleInstantBuy}
      />

      <AddCustomProductModal
        isOpen={isAddProductOpen}
        onClose={() => setIsAddProductOpen(false)}
        onAddProduct={handleAddCustomProduct}
      />

      <ConciergeAndWhatsApp
        products={products}
        cart={cart}
        onAddToCart={(product) => handleAddToCart(product)}
        onInspectProduct={(product) => setInspectedProduct(product)}
        onOpenCheckout={(gateway) => handleOpenCheckout(gateway)}
      />
    </div>
  );
}

export default App;
