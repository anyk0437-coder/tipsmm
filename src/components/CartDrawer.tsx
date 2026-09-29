import React from 'react';
import { X, Trash2, ArrowRight, ShoppingBag } from 'lucide-react';
import { CartItem, PaymentGatewayId } from '../types/store';
import { formatPkr, formatUsdt } from '../data/catalog';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQty: (productId: string, option: string, delta: number) => void;
  onRemove: (productId: string, option: string) => void;
  onCheckout: (gateway?: PaymentGatewayId) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQty,
  onRemove,
  onCheckout,
}) => {
  if (!isOpen) return null;

  const subtotalPkr = items.reduce(
    (sum, item) => sum + item.product.pricePkr * item.quantity,
    0
  );
  const shippingPkr = subtotalPkr >= 15000 || subtotalPkr === 0 ? 0 : 350;
  const totalPkr = subtotalPkr + shippingPkr;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-[#1C1916]/65 backdrop-blur-[1px]">
      <div className="relative w-full max-w-md bg-[#F4EFE6] border-l-2 border-[#1C1916] h-full flex flex-col justify-between paper-grain shadow-[-8px_0px_0px_#1C1916]">
        {/* Header */}
        <div className="px-5 py-4 bg-[#1C1916] text-[#FAF7F2] flex items-center justify-between border-b border-[#1C1916]">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-4 h-4 text-[#F0B90B]" />
            <div>
              <h3 className="font-serif text-lg leading-none">Atelier Parcel Satchel</h3>
              <span className="font-mono text-[10px] text-[#D5CBB8] uppercase tracking-widest">
                {items.reduce((s, i) => s + i.quantity, 0)} Pieces Selected
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 bg-[#2C2723] hover:bg-[#B84A27] text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3.5">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12 px-4 border border-dashed border-[#8A8175]">
              <span className="font-mono text-xs uppercase tracking-widest text-[#8A8175] mb-2">
                Satchel Empty
              </span>
              <p className="font-serif text-lg text-[#1C1916] mb-1">
                No handcrafted lots in your parcel yet.
              </p>
              <p className="text-xs text-[#575047] max-w-xs">
                Explore our leatherwork, Multan stoneware, hand-loomed khaddar, or forged brassware.
              </p>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={`${item.product.id}-${item.selectedOption}`}
                className="p-3.5 bg-[#FAF7F2] border border-[#1C1916] shadow-[3px_3px_0px_#D5CBB8] flex gap-3"
              >
                <img
                  src={item.product.image}
                  alt={item.product.title}
                  className="w-20 h-20 object-cover border border-[#1C1916] shrink-0"
                />
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-mono text-[10px] text-[#B84A27] font-semibold">
                        {item.product.lotNumber}
                      </span>
                      <button
                        type="button"
                        onClick={() => onRemove(item.product.id, item.selectedOption)}
                        className="text-[#8A8175] hover:text-[#B84A27]"
                        title="Remove piece"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <h4 className="font-serif text-sm text-[#1C1916] leading-snug truncate">
                      {item.product.title}
                    </h4>
                    <span className="font-mono text-[10px] text-[#575047] block">
                      Spec: {item.selectedOption}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 mt-2 border-t border-[#D5CBB8]">
                    <div className="inline-flex items-center border border-[#1C1916] bg-white">
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateQty(item.product.id, item.selectedOption, -1)
                        }
                        className="px-2 py-0.5 font-mono text-xs hover:bg-[#EAE2D3]"
                      >
                        −
                      </button>
                      <span className="px-2 py-0.5 font-mono text-xs font-bold">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateQty(item.product.id, item.selectedOption, 1)
                        }
                        className="px-2 py-0.5 font-mono text-xs hover:bg-[#EAE2D3]"
                      >
                        +
                      </button>
                    </div>

                    <div className="text-right">
                      <span className="font-mono text-xs font-bold text-[#1C1916] block">
                        {formatPkr(item.product.pricePkr * item.quantity)}
                      </span>
                      <span className="font-mono text-[10px] text-[#575047]">
                        {formatUsdt(item.product.pricePkr * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer & Direct Gateway Buttons */}
        {items.length > 0 && (
          <div className="p-5 bg-[#FAF7F2] border-t-2 border-[#1C1916] space-y-4">
            <div className="space-y-1.5 font-mono text-xs">
              <div className="flex justify-between text-[#575047]">
                <span>Subtotal</span>
                <span>{formatPkr(subtotalPkr)}</span>
              </div>
              <div className="flex justify-between text-[#575047]">
                <span>Courier Dispatch</span>
                <span>
                  {shippingPkr === 0
                    ? 'FREE (Over Rs. 15,000)'
                    : formatPkr(shippingPkr)}
                </span>
              </div>
              <div className="pt-2 border-t border-[#1C1916] flex justify-between items-baseline text-sm font-bold text-[#1C1916]">
                <span>Total Payable</span>
                <div className="text-right">
                  <span className="text-base text-[#B84A27] block">
                    {formatPkr(totalPkr)}
                  </span>
                  <span className="text-[10px] text-[#575047] font-normal">
                    Binance Pay: {formatUsdt(totalPkr)}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onCheckout('nayapay')}
              className="w-full py-3 px-4 bg-[#B84A27] hover:bg-[#1C1916] text-[#FAF7F2] font-mono text-xs font-bold uppercase tracking-widest border-2 border-[#1C1916] shadow-[4px_4px_0px_#1C1916] flex items-center justify-center gap-2 transition-all"
            >
              <span>Proceed to Payment Ledger</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-[#575047] block mb-1.5 text-center">
                Or Jump Directly to Payment Gateway:
              </span>
              <div className="grid grid-cols-2 gap-1.5 font-mono text-[11px]">
                <button
                  type="button"
                  onClick={() => onCheckout('nayapay')}
                  className="py-1.5 px-2 bg-[#FDF0E6] hover:bg-[#E85D04] hover:text-white border border-[#E85D04] text-[#1C1916] font-bold transition-colors"
                >
                  NayaPay • 03419347950
                </button>
                <button
                  type="button"
                  onClick={() => onCheckout('easypaisa')}
                  className="py-1.5 px-2 bg-[#E8F6EC] hover:bg-[#1E7E34] hover:text-white border border-[#1E7E34] text-[#1C1916] font-bold transition-colors"
                >
                  Easypaisa • 03419347950
                </button>
                <button
                  type="button"
                  onClick={() => onCheckout('binance')}
                  className="py-1.5 px-2 bg-[#FBF5E4] hover:bg-[#181A20] hover:text-[#F0B90B] border border-[#C69214] text-[#1C1916] font-bold transition-colors"
                >
                  Binance • ID 764552613
                </button>
                <button
                  type="button"
                  onClick={() => onCheckout('gopayfast')}
                  className="py-1.5 px-2 bg-[#E7F2F7] hover:bg-[#0B4F6C] hover:text-white border border-[#0B4F6C] text-[#1C1916] font-bold transition-colors"
                >
                  GoPayFast.com
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
