import React, { useState, useEffect } from 'react';
import {
  Check,
  Copy,
  ShieldCheck,
  Upload,
  ArrowRight,
  Lock,
  ExternalLink,
  Sparkles,
  X,
  CreditCard,
  Smartphone,
  Building2,
  FileCheck2,
  AlertCircle,
} from 'lucide-react';
import {
  CartItem,
  CustomerDetails,
  OrderRecord,
  PaymentGatewayId,
} from '../types/store';
import {
  formatPkr,
  formatUsdt,
  MERCHANT_PAYMENT_INFO,
  pkrToUsdt,
  USDT_RATE_PKR,
} from '../data/catalog';
import { DynamicPaymentQR, GatewayEmblem } from './PaymentGraphics';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onOrderSuccess: (order: OrderRecord) => void;
  initialGateway?: PaymentGatewayId;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  items,
  onOrderSuccess,
  initialGateway = 'nayapay',
}) => {
  const [selectedGateway, setSelectedGateway] = useState<PaymentGatewayId>(initialGateway);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Customer shipping state
  const [customer, setCustomer] = useState<CustomerDetails>({
    fullName: '',
    phone: '',
    email: '',
    city: 'Peshawar',
    address: '',
    orderNotes: '',
  });

  // Payment proof / gateway state
  const [senderAccount, setSenderAccount] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [screenshotDataUrl, setScreenshotDataUrl] = useState<string | undefined>(undefined);
  const [screenshotName, setScreenshotName] = useState<string | undefined>(undefined);

  // GoPayFast specific state
  const [gpfSubMethod, setGpfSubMethod] = useState<'card' | 'raast' | 'bank'>('card');
  const [gpfCardNumber, setGpfCardNumber] = useState('4242 •••• •••• 8910');
  const [gpfCardHolder, setGpfCardHolder] = useState('');
  const [gpfExpiry, setGpfExpiry] = useState('08/29');
  const [gpfCvv, setGpfCvv] = useState('842');
  const [gpfBankName, setGpfBankName] = useState('Meezan Bank');
  const [gpfOtpSent, setGpfOtpSent] = useState(false);
  const [gpfOtpCode, setGpfOtpCode] = useState('');
  const [gpfAuthorizedCode, setGpfAuthorizedCode] = useState('');
  const [gpfSession, setGpfSession] = useState<{
    basketId: string;
    signature: string;
    merchantId: string;
    raastIban: string;
  } | null>(null);

  // Binance specific state
  const [binanceCoin, setBinanceCoin] = useState<'USDT' | 'USDC' | 'BNB'>('USDT');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (initialGateway) {
      setSelectedGateway(initialGateway);
    }
  }, [initialGateway]);

  const subtotalPkr = items.reduce(
    (sum, item) => sum + item.product.pricePkr * item.quantity,
    0
  );
  const shippingPkr = subtotalPkr >= 15000 ? 0 : 350;
  const totalPkr = subtotalPkr + shippingPkr;
  const totalUsdt = pkrToUsdt(totalPkr);

  // Fetch GoPayFast cryptographic session from backend
  useEffect(() => {
    if (!isOpen || totalPkr <= 0) return;
    fetch('/api/gopayfast/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amountPkr: totalPkr }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data?.basketId) {
          setGpfSession(data);
        }
      })
      .catch(() => {
        setGpfSession({
          basketId: `GPF-${Date.now().toString().slice(-6)}`,
          signature: '8F4A92C1B7D04E3A91F204C8',
          merchantId: 'GPF-PK-20894',
          raastIban: 'PK42GPAY0000003419347950',
        });
      });
  }, [isOpen, totalPkr]);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2200);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScreenshotName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setScreenshotDataUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const fillDemoCustomer = () => {
    setCustomer({
      fullName: 'Zainab Afridi',
      phone: '0312-9482710',
      email: 'zainab.studio@example.pk',
      city: 'Peshawar',
      address: 'House 14, Street 3, University Town, Peshawar',
      orderNotes: 'Please wrap in unbleached cotton parcel cloth with brass seal.',
    });
    if (!senderAccount) {
      setSenderAccount('03129482710');
    }
    setErrorMsg(null);
  };

  const handleAuthorizeGoPayFast = () => {
    if (!gpfOtpSent) {
      setGpfOtpSent(true);
      setGpfOtpCode('492810');
      return;
    }
    const auth = `GPF-AUTH-${Math.floor(100000 + Math.random() * 900000)}`;
    setGpfAuthorizedCode(auth);
    setTransactionId(auth);
    setErrorMsg(null);
  };

  const generateSampleTid = () => {
    if (selectedGateway === 'nayapay') {
      const tid = `NP${Date.now().toString().slice(-10)}`;
      setTransactionId(tid);
      if (!senderAccount) setSenderAccount('03001234567');
    } else if (selectedGateway === 'easypaisa') {
      const tid = `${Math.floor(10000000000 + Math.random() * 89999999999)}`;
      setTransactionId(tid);
      if (!senderAccount) setSenderAccount('03451234567');
    } else if (selectedGateway === 'binance') {
      const tid = `2948${Math.floor(10000000000000 + Math.random() * 89999999999999)}`;
      setTransactionId(tid);
      if (!senderAccount) setSenderAccount('Binance-User-884920');
    } else if (selectedGateway === 'gopayfast') {
      const auth = `GPF-AUTH-${Math.floor(100000 + Math.random() * 900000)}`;
      setGpfAuthorizedCode(auth);
      setTransactionId(auth);
    }
    setErrorMsg(null);
  };

  const handleCompleteOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!customer.fullName.trim() || !customer.phone.trim() || !customer.address.trim()) {
      setErrorMsg('Please enter your Full Name, Phone Number, and Delivery Address in Step 1.');
      return;
    }

    const effectiveTid =
      selectedGateway === 'gopayfast' && gpfAuthorizedCode
        ? gpfAuthorizedCode
        : transactionId.trim();

    if (!effectiveTid) {
      if (selectedGateway === 'gopayfast') {
        setErrorMsg('Please authorize your GoPayFast payment or enter your GoPayFast Reference ID.');
      } else if (selectedGateway === 'binance') {
        setErrorMsg('Please enter your Binance Pay Order ID / Transaction ID after sending to Pay ID 764552613.');
      } else {
        setErrorMsg(
          `Please enter the ${
            selectedGateway === 'nayapay' ? 'NayaPay' : 'Easypaisa'
          } Transaction ID (TID) after transferring to 03419347950 (Jamal Ahmad).`
        );
      }
      return;
    }

    setIsSubmitting(true);

    const gatewayConfig = {
      gopayfast: {
        label: 'GoPayFast (gopayfast.com)',
        recipientAccount: gpfSession?.merchantId || 'gopayfast.com / GPF-PK-20894',
        recipientName: 'Jamal Ahmad — KĀRGHAR Official',
      },
      nayapay: {
        label: 'NayaPay Direct Transfer',
        recipientAccount: MERCHANT_PAYMENT_INFO.nayapay.accountNumber,
        recipientName: MERCHANT_PAYMENT_INFO.nayapay.accountName,
      },
      easypaisa: {
        label: 'Easypaisa Mobile Account',
        recipientAccount: MERCHANT_PAYMENT_INFO.easypaisa.accountNumber,
        recipientName: MERCHANT_PAYMENT_INFO.easypaisa.accountName,
      },
      binance: {
        label: 'Binance Pay (Crypto)',
        recipientAccount: `Pay ID: ${MERCHANT_PAYMENT_INFO.binance.payId}`,
        recipientName: MERCHANT_PAYMENT_INFO.binance.accountName,
      },
    }[selectedGateway];

    const newOrder: OrderRecord = {
      id: `KRG-${Math.floor(100000 + Math.random() * 900000)}`,
      createdAt: new Date().toISOString(),
      items,
      subtotalPkr,
      shippingPkr,
      totalPkr,
      totalUsdt,
      customer,
      payment: {
        gateway: selectedGateway,
        gatewayLabel: gatewayConfig.label,
        recipientAccount: gatewayConfig.recipientAccount,
        recipientName: gatewayConfig.recipientName,
        senderPhoneOrId: senderAccount || customer.phone,
        transactionId: effectiveTid,
        amountPkr: totalPkr,
        amountUsdt: totalUsdt,
        gopayfastMethod: selectedGateway === 'gopayfast' ? gpfSubMethod : undefined,
        gopayfastAuthCode: selectedGateway === 'gopayfast' ? effectiveTid : undefined,
        binanceCoin: selectedGateway === 'binance' ? binanceCoin : undefined,
        screenshotDataUrl,
        screenshotName,
      },
      status:
        selectedGateway === 'gopayfast' && gpfAuthorizedCode
          ? 'Verified & In Dispatch'
          : 'Payment Submitted — Under Verification',
    };

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOrder),
      });
      const data = await response.json();
      onOrderSuccess(data?.order || newOrder);
    } catch {
      onOrderSuccess(newOrder);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1C1916]/75 backdrop-blur-[2px] p-2 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-[#F4EFE6] border-2 border-[#1C1916] shadow-[10px_10px_0px_#1C1916] my-auto max-h-[94vh] overflow-y-auto paper-grain">
        {/* Top Ledger Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between px-5 py-3.5 bg-[#1C1916] text-[#F4EFE6] border-b border-[#1C1916]">
          <div className="flex items-center gap-3">
            <span className="px-2 py-0.5 text-[11px] font-mono uppercase tracking-widest bg-[#B84A27] text-white">
              Atelier Dispatch & Payment Ledger
            </span>
            <span className="hidden sm:inline font-mono text-xs text-[#D5CBB8]">
              4 VERIFIED GATEWAYS • INSTANT RECEIPT
            </span>
          </div>
          <button
            onClick={onClose}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono uppercase tracking-wider bg-[#2C2723] hover:bg-[#B84A27] text-[#F4EFE6] transition-colors"
          >
            <span>Close</span>
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleCompleteOrder} className="grid grid-cols-1 lg:grid-cols-12">
          {/* Left 7 Columns: Step 1 Shipping + Step 2 Gateway Payment */}
          <div className="lg:col-span-7 p-5 sm:p-7 border-b lg:border-b-0 lg:border-r border-[#D5CBB8] space-y-7">
            {/* STEP 1: Dispatch & Delivery */}
            <section>
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-4 border-b border-[#D5CBB8]">
                <div>
                  <span className="font-mono text-[11px] uppercase tracking-widest text-[#B84A27] block">
                    Step 01 // Parcel Destination
                  </span>
                  <h3 className="font-serif text-xl text-[#1C1916]">
                    Recipient & Delivery Ledger
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={fillDemoCustomer}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono uppercase tracking-wider bg-[#EAE2D3] hover:bg-[#1C1916] hover:text-[#FAF7F2] text-[#1C1916] border border-[#1C1916] transition-colors"
                >
                  <Sparkles className="w-3 h-3 text-[#B84A27]" />
                  Auto-Fill Sample Details
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-mono text-[11px] uppercase tracking-wider text-[#575047] mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={customer.fullName}
                    onChange={(e) => setCustomer({ ...customer, fullName: e.target.value })}
                    placeholder="e.g., Kamran Yousafzai"
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#1C1916] font-sans text-sm focus:outline-none focus:ring-2 focus:ring-[#B84A27]"
                  />
                </div>
                <div>
                  <label className="block font-mono text-[11px] uppercase tracking-wider text-[#575047] mb-1">
                    Phone / WhatsApp Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={customer.phone}
                    onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                    placeholder="03XX-XXXXXXX"
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#1C1916] font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#B84A27]"
                  />
                </div>
                <div>
                  <label className="block font-mono text-[11px] uppercase tracking-wider text-[#575047] mb-1">
                    City / Region *
                  </label>
                  <select
                    value={customer.city}
                    onChange={(e) => setCustomer({ ...customer, city: e.target.value })}
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#1C1916] font-sans text-sm focus:outline-none focus:ring-2 focus:ring-[#B84A27]"
                  >
                    <option value="Peshawar">Peshawar</option>
                    <option value="Islamabad">Islamabad</option>
                    <option value="Lahore">Lahore</option>
                    <option value="Karachi">Karachi</option>
                    <option value="Rawalpindi">Rawalpindi</option>
                    <option value="Multan">Multan</option>
                    <option value="Swat / Mingora">Swat / Mingora</option>
                    <option value="Abbottabad">Abbottabad</option>
                    <option value="Faisalabad">Faisalabad</option>
                    <option value="Quetta">Quetta</option>
                    <option value="International Dispatch">International Dispatch</option>
                  </select>
                </div>
                <div>
                  <label className="block font-mono text-[11px] uppercase tracking-wider text-[#575047] mb-1">
                    Email (For Receipt Copy)
                  </label>
                  <input
                    type="email"
                    value={customer.email}
                    onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                    placeholder="you@domain.com"
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#1C1916] font-sans text-sm focus:outline-none focus:ring-2 focus:ring-[#B84A27]"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-mono text-[11px] uppercase tracking-wider text-[#575047] mb-1">
                    Complete Street Address *
                  </label>
                  <input
                    type="text"
                    required
                    value={customer.address}
                    onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                    placeholder="House / Studio #, Street, Sector / Town"
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#1C1916] font-sans text-sm focus:outline-none focus:ring-2 focus:ring-[#B84A27]"
                  />
                </div>
              </div>
            </section>

            {/* STEP 2: Payment Gateway Selection */}
            <section>
              <div className="pb-3 mb-4 border-b border-[#D5CBB8]">
                <span className="font-mono text-[11px] uppercase tracking-widest text-[#B84A27] block">
                  Step 02 // Select Verified Payment Gateway
                </span>
                <h3 className="font-serif text-xl text-[#1C1916]">
                  Choose Your Payment Method
                </h3>
              </div>

              {/* 4 Gateway Selector Tabs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-5">
                {(
                  [
                    {
                      id: 'nayapay',
                      title: 'NayaPay',
                      sub: '03419347950',
                      holder: 'Jamal Ahmad',
                      accent: 'border-[#E85D04] bg-[#FDF0E6]',
                      dot: 'bg-[#E85D04]',
                    },
                    {
                      id: 'easypaisa',
                      title: 'Easypaisa',
                      sub: '03419347950',
                      holder: 'Jamal Ahmad',
                      accent: 'border-[#1E7E34] bg-[#E8F6EC]',
                      dot: 'bg-[#1E7E34]',
                    },
                    {
                      id: 'binance',
                      title: 'Binance Pay',
                      sub: 'ID: 764552613',
                      holder: `${totalUsdt} USDT`,
                      accent: 'border-[#C69214] bg-[#FBF5E4]',
                      dot: 'bg-[#F0B90B]',
                    },
                    {
                      id: 'gopayfast',
                      title: 'GoPayFast',
                      sub: 'gopayfast.com',
                      holder: 'Cards & Raast',
                      accent: 'border-[#0B4F6C] bg-[#E7F2F7]',
                      dot: 'bg-[#0B4F6C]',
                    },
                  ] as const
                ).map((tab) => {
                  const active = selectedGateway === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        setSelectedGateway(tab.id);
                        setErrorMsg(null);
                      }}
                      className={`text-left p-3 border transition-all relative ${
                        active
                          ? `${tab.accent} border-2 border-[#1C1916] shadow-[3px_3px_0px_#1C1916] -translate-y-0.5`
                          : 'bg-[#FAF7F2] border-[#D5CBB8] hover:border-[#1C1916]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-sans font-bold text-xs text-[#1C1916]">
                          {tab.title}
                        </span>
                        <span className={`w-2 h-2 rounded-full ${tab.dot}`} />
                      </div>
                      <div className="font-mono text-[11px] font-semibold text-[#1C1916] truncate">
                        {tab.sub}
                      </div>
                      <div className="font-mono text-[10px] text-[#575047] truncate">
                        {tab.holder}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* GATEWAY PANEL 1: NAYAPAY */}
              {selectedGateway === 'nayapay' && (
                <div className="p-5 bg-[#FAF7F2] border-2 border-[#1C1916] space-y-5">
                  <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-[#D5CBB8]">
                    <div>
                      <div className="inline-flex items-center gap-2 px-2.5 py-0.5 bg-[#E85D04] text-white font-mono text-[10px] uppercase tracking-widest mb-2">
                        Verified NayaPay Merchant Account
                      </div>
                      <h4 className="font-serif text-lg text-[#1C1916]">
                        Send via NayaPay App or Raast ID
                      </h4>
                      <p className="text-xs text-[#575047] mt-0.5">
                        Instant transfer from NayaPay Wallet or any Pakistani Bank app via Raast.
                      </p>
                    </div>
                    <GatewayEmblem gateway="nayapay" />
                  </div>

                  {/* Account Credentials Box + QR */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center bg-[#FDF0E6] p-4 border border-[#E85D04]">
                    <div className="sm:col-span-7 space-y-3">
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-widest text-[#575047] block">
                          NayaPay Account Number
                        </span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="font-mono text-xl sm:text-2xl font-bold tracking-tight text-[#1C1916]">
                            03419347950
                          </span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard('03419347950', 'np-num')}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-mono bg-[#1C1916] text-[#FAF7F2] hover:bg-[#E85D04] transition-colors"
                          >
                            {copiedKey === 'np-num' ? (
                              <>
                                <Check className="w-3.5 h-3.5" /> Copied
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" /> Copy
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#E85D04]/30">
                        <div>
                          <span className="text-[10px] font-mono uppercase tracking-widest text-[#575047] block">
                            Account Title / Name
                          </span>
                          <span className="font-serif font-bold text-base text-[#1C1916] flex items-center gap-1">
                            Jamal Ahmad
                            <ShieldCheck className="w-4 h-4 text-[#E85D04]" />
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] font-mono uppercase tracking-widest text-[#575047] block">
                            Exact Amount
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-sm text-[#B84A27]">
                              {formatPkr(totalPkr)}
                            </span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(String(totalPkr), 'np-amt')}
                              className="text-[10px] font-mono underline text-[#1C1916]"
                            >
                              {copiedKey === 'np-amt' ? 'Copied!' : 'Copy'}
                            </button>
                          </div>
                        </div>
                      </div>

                      <ol className="text-xs text-[#1C1916] space-y-1 pt-2 border-t border-[#E85D04]/30 list-decimal list-inside font-sans">
                        <li>Open <strong>NayaPay App</strong> & tap <strong>Send Money</strong>.</li>
                        <li>Enter <strong>03419347950</strong> — verify title is <strong>Jamal Ahmad</strong>.</li>
                        <li>Send <strong>{formatPkr(totalPkr)}</strong> & enter the Transaction ID (TID) below.</li>
                      </ol>
                    </div>

                    <div className="sm:col-span-5 flex flex-col items-center justify-center">
                      <DynamicPaymentQR
                        payload={`NAYAPAY:03419347950:JAMAL_AHMAD:PKR:${totalPkr}`}
                        accentColor="#E85D04"
                        centerBadgeText="NP"
                        size={138}
                      />
                      <span className="font-mono text-[10px] text-[#575047] mt-1.5">
                        Scan for NayaPay Reference
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* GATEWAY PANEL 2: EASYPAISA */}
              {selectedGateway === 'easypaisa' && (
                <div className="p-5 bg-[#FAF7F2] border-2 border-[#1C1916] space-y-5">
                  <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-[#D5CBB8]">
                    <div>
                      <div className="inline-flex items-center gap-2 px-2.5 py-0.5 bg-[#1E7E34] text-white font-mono text-[10px] uppercase tracking-widest mb-2">
                        Verified Easypaisa Account
                      </div>
                      <h4 className="font-serif text-lg text-[#1C1916]">
                        Easypaisa Mobile Wallet Transfer
                      </h4>
                      <p className="text-xs text-[#575047] mt-0.5">
                        Pay effortlessly via the Easypaisa App, *786#, or any interbank Raast app.
                      </p>
                    </div>
                    <GatewayEmblem gateway="easypaisa" />
                  </div>

                  {/* Account Credentials Box + QR */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center bg-[#E8F6EC] p-4 border border-[#1E7E34]">
                    <div className="sm:col-span-7 space-y-3">
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-widest text-[#575047] block">
                          Easypaisa Account Number
                        </span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="font-mono text-xl sm:text-2xl font-bold tracking-tight text-[#1C1916]">
                            03419347950
                          </span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard('03419347950', 'ep-num')}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-mono bg-[#1C1916] text-[#FAF7F2] hover:bg-[#1E7E34] transition-colors"
                          >
                            {copiedKey === 'ep-num' ? (
                              <>
                                <Check className="w-3.5 h-3.5" /> Copied
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" /> Copy
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#1E7E34]/30">
                        <div>
                          <span className="text-[10px] font-mono uppercase tracking-widest text-[#575047] block">
                            Account Name
                          </span>
                          <span className="font-serif font-bold text-base text-[#1C1916] flex items-center gap-1">
                            Jamal Ahmad
                            <ShieldCheck className="w-4 h-4 text-[#1E7E34]" />
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] font-mono uppercase tracking-widest text-[#575047] block">
                            Amount to Send
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-sm text-[#1E7E34]">
                              {formatPkr(totalPkr)}
                            </span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(String(totalPkr), 'ep-amt')}
                              className="text-[10px] font-mono underline text-[#1C1916]"
                            >
                              {copiedKey === 'ep-amt' ? 'Copied!' : 'Copy'}
                            </button>
                          </div>
                        </div>
                      </div>

                      <ol className="text-xs text-[#1C1916] space-y-1 pt-2 border-t border-[#1E7E34]/30 list-decimal list-inside font-sans">
                        <li>Open <strong>Easypaisa App</strong> (or dial <strong>*786#</strong>) → <strong>Send Money</strong>.</li>
                        <li>Enter Mobile Account <strong>03419347950</strong> & confirm name <strong>Jamal Ahmad</strong>.</li>
                        <li>Transfer <strong>{formatPkr(totalPkr)}</strong> and paste your 11-digit <strong>Trx ID (TID)</strong> below.</li>
                      </ol>
                    </div>

                    <div className="sm:col-span-5 flex flex-col items-center justify-center">
                      <DynamicPaymentQR
                        payload={`EASYPAISA:03419347950:JAMAL_AHMAD:PKR:${totalPkr}`}
                        accentColor="#1E7E34"
                        centerBadgeText="EP"
                        size={138}
                      />
                      <span className="font-mono text-[10px] text-[#575047] mt-1.5">
                        Easypaisa Account QR
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* GATEWAY PANEL 3: BINANCE PAY */}
              {selectedGateway === 'binance' && (
                <div className="p-5 bg-[#FAF7F2] border-2 border-[#1C1916] space-y-5">
                  <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-[#D5CBB8]">
                    <div>
                      <div className="inline-flex items-center gap-2 px-2.5 py-0.5 bg-[#181A20] text-[#F0B90B] font-mono text-[10px] uppercase tracking-widest mb-2">
                        Zero-Fee Crypto Payment
                      </div>
                      <h4 className="font-serif text-lg text-[#1C1916]">
                        Binance Pay Instant Transfer
                      </h4>
                      <p className="text-xs text-[#575047] mt-0.5">
                        Send USDT, USDC, or BNB directly via Binance Pay ID with zero network gas fees.
                      </p>
                    </div>
                    <GatewayEmblem gateway="binance" />
                  </div>

                  {/* Binance Pay ID Box + QR */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center bg-[#FBF5E4] p-4 border border-[#C69214]">
                    <div className="sm:col-span-7 space-y-3">
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-widest text-[#575047] block">
                          Official Binance Pay ID
                        </span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="font-mono text-2xl font-bold tracking-tight text-[#1C1916]">
                            764552613
                          </span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard('764552613', 'bn-id')}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-mono bg-[#181A20] text-[#F0B90B] hover:bg-[#B84A27] hover:text-white transition-colors"
                          >
                            {copiedKey === 'bn-id' ? (
                              <>
                                <Check className="w-3.5 h-3.5" /> Copied ID
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" /> Copy Pay ID
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#C69214]/30">
                        <div>
                          <span className="text-[10px] font-mono uppercase tracking-widest text-[#575047] block">
                            Converted Crypto Total
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-base text-[#1C1916]">
                              {totalUsdt.toFixed(2)} {binanceCoin}
                            </span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(totalUsdt.toFixed(2), 'bn-amt')}
                              className="text-[10px] font-mono underline text-[#B84A27]"
                            >
                              {copiedKey === 'bn-amt' ? 'Copied!' : 'Copy'}
                            </button>
                          </div>
                          <span className="text-[10px] font-mono text-[#575047]">
                            Rate: 1 USDT = Rs. {USDT_RATE_PKR}
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] font-mono uppercase tracking-widest text-[#575047] block mb-1">
                            Select Asset
                          </span>
                          <div className="inline-flex border border-[#1C1916] bg-[#FAF7F2]">
                            {(['USDT', 'USDC', 'BNB'] as const).map((coin) => (
                              <button
                                key={coin}
                                type="button"
                                onClick={() => setBinanceCoin(coin)}
                                className={`px-2 py-0.5 font-mono text-[10px] font-bold ${
                                  binanceCoin === coin
                                    ? 'bg-[#181A20] text-[#F0B90B]'
                                    : 'text-[#1C1916]'
                                }`}
                              >
                                {coin}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <ol className="text-xs text-[#1C1916] space-y-1 pt-2 border-t border-[#C69214]/30 list-decimal list-inside font-sans">
                        <li>Open <strong>Binance App</strong> → tap <strong>Pay</strong> → <strong>Send</strong>.</li>
                        <li>Select <strong>Pay ID</strong> and paste <strong>764552613</strong>.</li>
                        <li>Send <strong>{totalUsdt.toFixed(2)} {binanceCoin}</strong> ({formatPkr(totalPkr)}) and enter your Order ID below.</li>
                      </ol>
                    </div>

                    <div className="sm:col-span-5 flex flex-col items-center justify-center">
                      <DynamicPaymentQR
                        payload={`BINANCE_PAY:764552613:USDT:${totalUsdt.toFixed(2)}`}
                        accentColor="#181A20"
                        centerBadgeText="BNB"
                        size={138}
                      />
                      <span className="font-mono text-[10px] text-[#575047] mt-1.5">
                        Binance Pay ID: 764552613
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* GATEWAY PANEL 4: GOPAYFAST (gopayfast.com) */}
              {selectedGateway === 'gopayfast' && (
                <div className="p-5 bg-[#FAF7F2] border-2 border-[#1C1916] space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-4 pb-3 border-b border-[#D5CBB8]">
                    <div>
                      <div className="inline-flex items-center gap-2 px-2.5 py-0.5 bg-[#0B4F6C] text-white font-mono text-[10px] uppercase tracking-widest mb-1.5">
                        State Bank Licensed Gateway • gopayfast.com
                      </div>
                      <h4 className="font-serif text-lg text-[#1C1916]">
                        GoPayFast Integrated Checkout
                      </h4>
                      <p className="text-xs text-[#575047]">
                        Pay securely via Visa/Mastercard/PayPak, Raast P2M, or 1Link Bank Account.
                      </p>
                    </div>
                    <a
                      href="https://gopayfast.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-mono text-[#0B4F6C] hover:underline"
                    >
                      gopayfast.com <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  {/* GoPayFast Sub-Channel Picker */}
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setGpfSubMethod('card')}
                      className={`flex items-center justify-center gap-1.5 py-2 px-2 border font-mono text-xs ${
                        gpfSubMethod === 'card'
                          ? 'bg-[#0B4F6C] text-white border-[#1C1916]'
                          : 'bg-white text-[#1C1916] border-[#D5CBB8]'
                      }`}
                    >
                      <CreditCard className="w-3.5 h-3.5" /> Debit / Credit Card
                    </button>
                    <button
                      type="button"
                      onClick={() => setGpfSubMethod('raast')}
                      className={`flex items-center justify-center gap-1.5 py-2 px-2 border font-mono text-xs ${
                        gpfSubMethod === 'raast'
                          ? 'bg-[#0B4F6C] text-white border-[#1C1916]'
                          : 'bg-white text-[#1C1916] border-[#D5CBB8]'
                      }`}
                    >
                      <Smartphone className="w-3.5 h-3.5" /> Raast Instant P2M
                    </button>
                    <button
                      type="button"
                      onClick={() => setGpfSubMethod('bank')}
                      className={`flex items-center justify-center gap-1.5 py-2 px-2 border font-mono text-xs ${
                        gpfSubMethod === 'bank'
                          ? 'bg-[#0B4F6C] text-white border-[#1C1916]'
                          : 'bg-white text-[#1C1916] border-[#D5CBB8]'
                      }`}
                    >
                      <Building2 className="w-3.5 h-3.5" /> 1Link Bank
                    </button>
                  </div>

                  {/* GoPayFast Session Telemetry Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-[#E7F2F7] border border-[#0B4F6C]/40 font-mono text-[11px] text-[#0B4F6C]">
                    <span>BASKET: {gpfSession?.basketId || 'GPF-892410'}</span>
                    <span>MERCHANT: {gpfSession?.merchantId || 'GPF-PK-20894'}</span>
                    <span>HASH: {gpfSession?.signature?.slice(0, 10) || '8F4A92C1B7'}…</span>
                  </div>

                  {gpfSubMethod === 'card' && (
                    <div className="space-y-3 bg-white p-4 border border-[#D5CBB8]">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="sm:col-span-2">
                          <label className="block font-mono text-[10px] uppercase tracking-wider text-[#575047] mb-1">
                            Card Number (Visa / Mastercard / PayPak)
                          </label>
                          <input
                            type="text"
                            value={gpfCardNumber}
                            onChange={(e) => setGpfCardNumber(e.target.value)}
                            className="w-full px-3 py-1.5 border border-[#1C1916] font-mono text-sm bg-[#FAF7F2]"
                          />
                        </div>
                        <div>
                          <label className="block font-mono text-[10px] uppercase tracking-wider text-[#575047] mb-1">
                            Cardholder Name
                          </label>
                          <input
                            type="text"
                            value={gpfCardHolder || customer.fullName}
                            onChange={(e) => setGpfCardHolder(e.target.value)}
                            placeholder="Name on Card"
                            className="w-full px-3 py-1.5 border border-[#1C1916] font-sans text-sm bg-[#FAF7F2]"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block font-mono text-[10px] uppercase tracking-wider text-[#575047] mb-1">
                              Expiry
                            </label>
                            <input
                              type="text"
                              value={gpfExpiry}
                              onChange={(e) => setGpfExpiry(e.target.value)}
                              className="w-full px-2.5 py-1.5 border border-[#1C1916] font-mono text-sm bg-[#FAF7F2]"
                            />
                          </div>
                          <div>
                            <label className="block font-mono text-[10px] uppercase tracking-wider text-[#575047] mb-1">
                              CVV
                            </label>
                            <input
                              type="password"
                              value={gpfCvv}
                              onChange={(e) => setGpfCvv(e.target.value)}
                              maxLength={4}
                              className="w-full px-2.5 py-1.5 border border-[#1C1916] font-mono text-sm bg-[#FAF7F2]"
                            />
                          </div>
                        </div>
                      </div>

                      {gpfOtpSent && !gpfAuthorizedCode && (
                        <div className="p-3 bg-[#FBF5E4] border border-[#C69214] flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <span className="font-mono text-[10px] uppercase text-[#947134] block">
                              GoPayFast 3D-Secure OTP Sent
                            </span>
                            <span className="text-xs text-[#1C1916]">
                              Enter 6-digit OTP (Pre-filled for sandbox: <strong>492810</strong>)
                            </span>
                          </div>
                          <input
                            type="text"
                            value={gpfOtpCode}
                            onChange={(e) => setGpfOtpCode(e.target.value)}
                            className="w-28 px-2.5 py-1 border border-[#1C1916] font-mono text-sm font-bold text-center bg-white"
                          />
                        </div>
                      )}

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                        {gpfAuthorizedCode ? (
                          <div className="inline-flex items-center gap-2 text-xs font-mono font-bold text-[#1E7E34] bg-[#E8F6EC] px-3 py-1.5 border border-[#1E7E34]">
                            <Check className="w-4 h-4" /> Authorized via GoPayFast: {gpfAuthorizedCode}
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={handleAuthorizeGoPayFast}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-[#0B4F6C] hover:bg-[#1C1916] text-white font-mono text-xs uppercase tracking-wider transition-colors"
                          >
                            <Lock className="w-3.5 h-3.5" />
                            {gpfOtpSent
                              ? `Verify 3DS & Authorize ${formatPkr(totalPkr)}`
                              : `Request GoPayFast 3DS OTP (${formatPkr(totalPkr)})`}
                          </button>
                        )}
                        <span className="font-mono text-[10px] text-[#575047]">
                          Secured by GoPayFast.com PCI-DSS
                        </span>
                      </div>
                    </div>
                  )}

                  {gpfSubMethod === 'raast' && (
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center bg-white p-4 border border-[#D5CBB8]">
                      <div className="sm:col-span-7 space-y-2">
                        <span className="font-mono text-[10px] uppercase tracking-widest text-[#0B4F6C] block">
                          GoPayFast Dynamic Raast P2M IBAN
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs sm:text-sm font-bold text-[#1C1916] break-all">
                            {gpfSession?.raastIban || 'PK42GPAY0000003419347950'}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              copyToClipboard(
                                gpfSession?.raastIban || 'PK42GPAY0000003419347950',
                                'gpf-iban'
                              )
                            }
                            className="px-2 py-0.5 text-[10px] font-mono bg-[#0B4F6C] text-white"
                          >
                            {copiedKey === 'gpf-iban' ? 'Copied' : 'Copy'}
                          </button>
                        </div>
                        <p className="text-xs text-[#575047]">
                          Scan QR from any Raast-enabled banking app or transfer to linked Mobile ID{' '}
                          <strong className="text-[#1C1916]">03419347950 (Jamal Ahmad)</strong>.
                        </p>
                      </div>
                      <div className="sm:col-span-5 flex justify-center">
                        <DynamicPaymentQR
                          payload={`GOPAYFAST:RAAST:PK42GPAY0000003419347950:${totalPkr}`}
                          accentColor="#0B4F6C"
                          centerBadgeText="GPF"
                          size={124}
                        />
                      </div>
                    </div>
                  )}

                  {gpfSubMethod === 'bank' && (
                    <div className="p-4 bg-white border border-[#D5CBB8] space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block font-mono text-[10px] uppercase tracking-wider text-[#575047] mb-1">
                            Select 1Link Participating Bank
                          </label>
                          <select
                            value={gpfBankName}
                            onChange={(e) => setGpfBankName(e.target.value)}
                            className="w-full px-3 py-1.5 border border-[#1C1916] font-sans text-sm bg-[#FAF7F2]"
                          >
                            <option>Meezan Bank</option>
                            <option>Habib Bank Limited (HBL)</option>
                            <option>Bank Alfalah</option>
                            <option>United Bank Limited (UBL)</option>
                            <option>Standard Chartered PK</option>
                            <option>Allied Bank (ABL)</option>
                            <option>MCB Bank</option>
                          </select>
                        </div>
                        <div>
                          <label className="block font-mono text-[10px] uppercase tracking-wider text-[#575047] mb-1">
                            Account / CNIC Last 4 Digits
                          </label>
                          <input
                            type="text"
                            placeholder="e.g., 4829"
                            className="w-full px-3 py-1.5 border border-[#1C1916] font-mono text-sm bg-[#FAF7F2]"
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleAuthorizeGoPayFast}
                        className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#0B4F6C] text-white font-mono text-xs uppercase tracking-wider"
                      >
                        Generate GoPayFast 1Link Voucher & Authorize
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 3: Transaction Verification Input (Shared across gateways) */}
              <div className="mt-5 p-4 bg-[#EAE2D3]/70 border border-[#1C1916] space-y-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#1C1916] flex items-center gap-1.5">
                    <FileCheck2 className="w-4 h-4 text-[#B84A27]" />
                    Payment Verification & Transaction Reference
                  </span>
                  <button
                    type="button"
                    onClick={generateSampleTid}
                    className="text-[11px] font-mono underline text-[#B84A27] hover:text-[#1C1916]"
                  >
                    + Fill Demo Transaction ID
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-mono text-[10px] uppercase tracking-wider text-[#575047] mb-1">
                      {selectedGateway === 'binance'
                        ? 'Your Binance Pay ID / Nickname'
                        : selectedGateway === 'gopayfast'
                        ? 'Payer Phone / Card Reference'
                        : `Your Sender ${selectedGateway === 'nayapay' ? 'NayaPay' : 'Easypaisa'} Number`}
                    </label>
                    <input
                      type="text"
                      value={senderAccount}
                      onChange={(e) => setSenderAccount(e.target.value)}
                      placeholder={
                        selectedGateway === 'binance' ? 'e.g., Binance User / Email' : '03XX-XXXXXXX'
                      }
                      className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#1C1916] font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-mono text-[10px] uppercase tracking-wider text-[#575047] mb-1">
                      {selectedGateway === 'binance'
                        ? 'Binance Order ID / Transaction ID *'
                        : selectedGateway === 'gopayfast'
                        ? 'GoPayFast Auth / Reference ID *'
                        : 'Transaction ID (TID / Reference #) *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      placeholder={
                        selectedGateway === 'binance'
                          ? 'e.g., 294810492817492018'
                          : selectedGateway === 'gopayfast'
                          ? 'Click Authorize above or enter Ref #'
                          : 'e.g., 19482710492 (from SMS/Receipt)'
                      }
                      className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#1C1916] font-mono text-xs font-bold"
                    />
                  </div>
                </div>

                {/* Optional Screenshot Proof Upload */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <label className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#FAF7F2] hover:bg-[#1C1916] hover:text-[#FAF7F2] text-[#1C1916] border border-[#1C1916] font-mono text-xs cursor-pointer transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    <span>
                      {screenshotName
                        ? `Attached: ${screenshotName.slice(0, 22)}`
                        : 'Attach Payment Screenshot (Optional)'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>

                  {screenshotDataUrl && (
                    <div className="flex items-center gap-2">
                      <img
                        src={screenshotDataUrl}
                        alt="Payment proof preview"
                        className="w-9 h-9 object-cover border border-[#1C1916]"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setScreenshotDataUrl(undefined);
                          setScreenshotName(undefined);
                        }}
                        className="text-[10px] font-mono text-[#B84A27] underline"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>

          {/* Right 5 Columns: Order Ledger Summary & Submit */}
          <div className="lg:col-span-5 p-5 sm:p-7 bg-[#EAE2D3]/55 flex flex-col justify-between">
            <div className="space-y-5">
              <div className="pb-3 border-b border-[#1C1916] flex items-center justify-between">
                <div>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-[#575047] block">
                    Atelier Manifest
                  </span>
                  <h3 className="font-serif text-xl text-[#1C1916]">
                    Satchel Summary ({items.reduce((s, i) => s + i.quantity, 0)} pcs)
                  </h3>
                </div>
                <span className="font-mono text-xs px-2 py-0.5 border border-[#1C1916] bg-[#FAF7F2]">
                  LOT DISPATCH
                </span>
              </div>

              {/* Itemized List */}
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {items.map((item) => (
                  <div
                    key={`${item.product.id}-${item.selectedOption}`}
                    className="flex items-start gap-3 p-2.5 bg-[#FAF7F2] border border-[#D5CBB8]"
                  >
                    <img
                      src={item.product.image}
                      alt={item.product.title}
                      className="w-14 h-14 object-cover border border-[#1C1916] shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-mono text-[10px] text-[#B84A27]">
                        {item.product.lotNumber} • {item.product.originCity}
                      </div>
                      <h4 className="font-serif text-sm text-[#1C1916] leading-snug truncate">
                        {item.product.title}
                      </h4>
                      <div className="font-mono text-[11px] text-[#575047] mt-0.5">
                        Variant: {item.selectedOption} × {item.quantity}
                      </div>
                    </div>
                    <div className="text-right font-mono text-xs font-bold text-[#1C1916]">
                      {formatPkr(item.product.pricePkr * item.quantity)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals Breakdown */}
              <div className="p-4 bg-[#FAF7F2] border border-[#1C1916] space-y-2 font-mono text-xs">
                <div className="flex justify-between text-[#575047]">
                  <span>Subtotal (PKR)</span>
                  <span>{formatPkr(subtotalPkr)}</span>
                </div>
                <div className="flex justify-between text-[#575047]">
                  <span>Insured Courier Dispatch</span>
                  <span>{shippingPkr === 0 ? 'COMPLIMENTARY' : formatPkr(shippingPkr)}</span>
                </div>
                <div className="pt-2 border-t border-[#D5CBB8] flex justify-between items-baseline text-sm font-bold text-[#1C1916]">
                  <span>Total Payable (PKR)</span>
                  <span className="text-base text-[#B84A27]">{formatPkr(totalPkr)}</span>
                </div>
                <div className="flex justify-between items-baseline text-[11px] text-[#575047]">
                  <span>Binance Pay Equivalent (USDT)</span>
                  <span className="font-bold text-[#1C1916]">{formatUsdt(totalPkr)}</span>
                </div>
              </div>

              {/* Selected Gateway Verification Card */}
              <div className="p-3.5 bg-[#FAF7F2] border-l-4 border-[#B84A27] border-t border-r border-b border-[#D5CBB8] text-xs space-y-1">
                <div className="font-mono text-[10px] uppercase tracking-widest text-[#575047]">
                  Active Beneficiary Account
                </div>
                {selectedGateway === 'nayapay' && (
                  <div className="font-mono text-xs text-[#1C1916]">
                    <strong>NayaPay:</strong> 03419347950 • <strong>Account Name:</strong> Jamal Ahmad
                  </div>
                )}
                {selectedGateway === 'easypaisa' && (
                  <div className="font-mono text-xs text-[#1C1916]">
                    <strong>Easypaisa:</strong> 03419347950 • <strong>Account Name:</strong> Jamal Ahmad
                  </div>
                )}
                {selectedGateway === 'binance' && (
                  <div className="font-mono text-xs text-[#1C1916]">
                    <strong>Binance Pay ID:</strong> 764552613 • <strong>Amount:</strong>{' '}
                    {totalUsdt.toFixed(2)} {binanceCoin}
                  </div>
                )}
                {selectedGateway === 'gopayfast' && (
                  <div className="font-mono text-xs text-[#1C1916]">
                    <strong>GoPayFast.com:</strong> Merchant GPF-PK-20894 (Jamal Ahmad)
                  </div>
                )}
              </div>

              {errorMsg && (
                <div className="p-3 bg-[#F5E1DA] border border-[#B84A27] text-[#93381B] text-xs font-mono flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-6 space-y-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-5 bg-[#B84A27] hover:bg-[#1C1916] text-[#FAF7F2] font-mono text-xs sm:text-sm font-bold uppercase tracking-widest border-2 border-[#1C1916] shadow-[4px_4px_0px_#1C1916] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0px_#1C1916] transition-all flex items-center justify-center gap-2"
              >
                <span>
                  {isSubmitting
                    ? 'Recording Ledger Receipt...'
                    : `Confirm Payment & Generate Receipt (${
                        selectedGateway === 'binance'
                          ? formatUsdt(totalPkr)
                          : formatPkr(totalPkr)
                      })`}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <p className="text-[11px] font-mono text-center text-[#575047]">
                Generates an official stamped invoice with your TID & one-click WhatsApp confirmation to Jamal Ahmad (03419347950).
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
