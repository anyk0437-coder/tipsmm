import React, { useState } from 'react';
import {
  CheckCircle2,
  Printer,
  MessageCircle,
  Copy,
  Check,
  X,
  ShieldCheck,
} from 'lucide-react';
import { OrderRecord } from '../types/store';
import { formatPkr, formatUsdt } from '../data/catalog';
import { ArtisanWaxSeal, GatewayEmblem } from './PaymentGraphics';

interface OrderReceiptModalProps {
  order: OrderRecord | null;
  onClose: () => void;
}

export const OrderReceiptModal: React.FC<OrderReceiptModalProps> = ({ order, onClose }) => {
  const [copiedId, setCopiedId] = useState(false);

  if (!order) return null;

  const handleCopyOrder = () => {
    navigator.clipboard.writeText(
      `Order: ${order.id} | Gateway: ${order.payment.gatewayLabel} | Account: ${order.payment.recipientAccount} (${order.payment.recipientName}) | TID: ${order.payment.transactionId} | Amount: ${formatPkr(order.totalPkr)}`
    );
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const whatsappText = encodeURIComponent(
    `Assalam-o-Alaikum Jamal Ahmad! Here is my KĀRGHAR Order Receipt:\n\n` +
      `• Order ID: ${order.id}\n` +
      `• Customer: ${order.customer.fullName} (${order.customer.phone})\n` +
      `• City: ${order.customer.city}\n` +
      `• Payment Gateway: ${order.payment.gatewayLabel}\n` +
      `• Paid To: ${order.payment.recipientAccount} (${order.payment.recipientName})\n` +
      `• Transaction ID (TID): ${order.payment.transactionId}\n` +
      `• Total Amount: ${formatPkr(order.totalPkr)} (${formatUsdt(order.totalPkr)})\n` +
      `• Items: ${order.items.map((i) => `${i.product.title} x${i.quantity}`).join(', ')}`
  );

  const whatsappUrl = `https://wa.me/923419347950?text=${whatsappText}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1C1916]/80 backdrop-blur-[2px] p-3 sm:p-6 overflow-y-auto">
      <div
        id="printable-receipt"
        className="relative w-full max-w-3xl bg-[#FAF7F2] border-2 border-[#1C1916] shadow-[10px_10px_0px_#1C1916] p-6 sm:p-9 my-auto paper-grain"
      >
        {/* Close Button (Hidden on Print) */}
        <button
          onClick={onClose}
          className="no-print absolute top-4 right-4 inline-flex items-center gap-1 px-2.5 py-1 bg-[#1C1916] text-[#FAF7F2] hover:bg-[#B84A27] font-mono text-xs uppercase tracking-wider"
        >
          <span>Close</span>
          <X className="w-3.5 h-3.5" />
        </button>

        {/* Top Official Receipt Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b-2 border-[#1C1916]">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-[#284634] text-white font-mono text-[11px] uppercase tracking-widest mb-2">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Official Atelier Payment Voucher
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl text-[#1C1916]">
              KĀRGHAR (کارگھر) — Dispatch Receipt
            </h2>
            <p className="font-mono text-xs text-[#575047] mt-1">
              RECEIPT NO: <strong className="text-[#1C1916]">{order.id}</strong> • ISSUED:{' '}
              {new Date(order.createdAt).toLocaleString('en-PK', {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </p>
          </div>
          <ArtisanWaxSeal className="w-20 h-20 shrink-0 hidden sm:block" />
        </div>

        {/* Payment Gateway & Beneficiary Verification Box */}
        <div className="my-6 p-4 bg-[#F4EFE6] border-2 border-[#1C1916] grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
          <div className="sm:col-span-8 space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-widest px-2 py-0.5 bg-[#B84A27] text-white">
                Payment Recorded
              </span>
              <span className="font-mono text-xs font-bold text-[#284634] flex items-center gap-1">
                <ShieldCheck className="w-4 h-4" /> {order.status}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 font-mono text-xs">
              <div>
                <span className="text-[10px] uppercase text-[#575047] block">Payment Gateway</span>
                <strong className="text-[#1C1916]">{order.payment.gatewayLabel}</strong>
              </div>
              <div>
                <span className="text-[10px] uppercase text-[#575047] block">
                  Beneficiary Account
                </span>
                <strong className="text-[#1C1916]">
                  {order.payment.recipientAccount} ({order.payment.recipientName})
                </strong>
              </div>
              <div>
                <span className="text-[10px] uppercase text-[#575047] block">
                  Transaction ID (TID / Ref)
                </span>
                <strong className="text-[#B84A27] bg-white px-1.5 py-0.5 border border-[#1C1916]">
                  {order.payment.transactionId}
                </strong>
              </div>
              <div>
                <span className="text-[10px] uppercase text-[#575047] block">
                  Sender Reference
                </span>
                <strong className="text-[#1C1916]">
                  {order.payment.senderPhoneOrId || order.customer.phone}
                </strong>
              </div>
            </div>
          </div>

          <div className="sm:col-span-4 flex flex-col sm:items-end justify-center border-t sm:border-t-0 sm:border-l border-[#D5CBB8] pt-3 sm:pt-0 sm:pl-4">
            <GatewayEmblem gateway={order.payment.gateway} />
            <div className="mt-3 text-left sm:text-right">
              <span className="font-mono text-[10px] uppercase text-[#575047] block">
                Total Settled
              </span>
              <span className="font-mono text-lg font-bold text-[#1C1916] block">
                {formatPkr(order.totalPkr)}
              </span>
              <span className="font-mono text-xs text-[#B84A27]">
                ({formatUsdt(order.totalPkr)})
              </span>
            </div>
          </div>
        </div>

        {/* Customer & Itemized Table */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 text-xs">
          <div className="p-3.5 border border-[#D5CBB8] bg-white">
            <span className="font-mono text-[10px] uppercase tracking-widest text-[#575047] block mb-1">
              Consignee / Recipient
            </span>
            <div className="font-serif font-bold text-sm text-[#1C1916]">
              {order.customer.fullName}
            </div>
            <div className="font-mono text-[#575047] mt-0.5">{order.customer.phone}</div>
            <div className="text-[#1C1916] mt-1">
              {order.customer.address}, <strong>{order.customer.city}</strong>
            </div>
          </div>

          <div className="p-3.5 border border-[#D5CBB8] bg-white flex flex-col justify-between">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-[#575047] block mb-1">
                Merchant Verification Desk
              </span>
              <div className="font-serif font-bold text-sm text-[#1C1916]">
                Jamal Ahmad — KĀRGHAR Studio
              </div>
              <div className="font-mono text-[11px] text-[#575047] mt-0.5">
                NayaPay / Easypaisa: <strong>03419347950</strong>
              </div>
              <div className="font-mono text-[11px] text-[#575047]">
                Binance Pay ID: <strong>764552613</strong> • Web: <strong>gopayfast.com</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Itemized Manifest */}
        <div className="border border-[#1C1916] mb-6">
          <div className="grid grid-cols-12 bg-[#1C1916] text-[#FAF7F2] font-mono text-[11px] uppercase tracking-wider px-3.5 py-2">
            <div className="col-span-6">Crafted Piece & Lot</div>
            <div className="col-span-2 text-center">Spec</div>
            <div className="col-span-1 text-center">Qty</div>
            <div className="col-span-3 text-right">Amount</div>
          </div>
          <div className="divide-y divide-[#D5CBB8] bg-white">
            {order.items.map((item, idx) => (
              <div
                key={idx}
                className="grid grid-cols-12 items-center px-3.5 py-2.5 text-xs font-sans"
              >
                <div className="col-span-6 pr-2">
                  <span className="font-mono text-[10px] text-[#B84A27] block">
                    {item.product.lotNumber}
                  </span>
                  <span className="font-serif font-semibold text-[#1C1916]">
                    {item.product.title}
                  </span>
                </div>
                <div className="col-span-2 text-center font-mono text-[11px] text-[#575047]">
                  {item.selectedOption}
                </div>
                <div className="col-span-1 text-center font-mono text-xs font-bold">
                  {item.quantity}
                </div>
                <div className="col-span-3 text-right font-mono text-xs font-bold text-[#1C1916]">
                  {formatPkr(item.product.pricePkr * item.quantity)}
                </div>
              </div>
            ))}
          </div>
          <div className="bg-[#F4EFE6] border-t border-[#1C1916] px-3.5 py-3 flex flex-wrap items-center justify-between gap-2 font-mono text-xs">
            <span>
              Shipping: {order.shippingPkr === 0 ? 'Complimentary' : formatPkr(order.shippingPkr)}
            </span>
            <span className="text-sm font-bold text-[#1C1916]">
              GRAND TOTAL: {formatPkr(order.totalPkr)} ({formatUsdt(order.totalPkr)})
            </span>
          </div>
        </div>

        {/* Attached Screenshot Proof Preview if uploaded */}
        {order.payment.screenshotDataUrl && (
          <div className="mb-6 p-3 border border-[#D5CBB8] bg-white flex items-center gap-3">
            <img
              src={order.payment.screenshotDataUrl}
              alt="Payment Screenshot"
              className="w-16 h-16 object-cover border border-[#1C1916]"
            />
            <div className="font-mono text-xs">
              <strong className="block text-[#1C1916]">Attached Payment Proof Screenshot</strong>
              <span className="text-[#575047] text-[11px]">
                {order.payment.screenshotName || 'receipt-capture.png'}
              </span>
            </div>
          </div>
        )}

        {/* Action Bar (Hidden on Print) */}
        <div className="no-print flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[#D5CBB8]">
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#1C1916] hover:bg-[#B84A27] text-[#FAF7F2] font-mono text-xs uppercase tracking-wider transition-colors"
            >
              <Printer className="w-4 h-4" />
              Print / Save PDF Receipt
            </button>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#1E7E34] hover:bg-[#145A24] text-white font-mono text-xs uppercase tracking-wider transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              Send Receipt on WhatsApp (03419347950)
            </a>
          </div>

          <button
            type="button"
            onClick={handleCopyOrder}
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-[#1C1916] bg-white hover:bg-[#EAE2D3] font-mono text-xs text-[#1C1916]"
          >
            {copiedId ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#1E7E34]" /> Copied Summary
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" /> Copy Receipt Summary
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
