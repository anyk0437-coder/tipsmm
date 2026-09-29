import React, { useState } from 'react';
import {
  X,
  Clock,
  MapPin,
  Hammer,
  Scale,
  Ruler,
  ShoppingBag,
  Zap,
  Check,
} from 'lucide-react';
import { PaymentGatewayId, Product } from '../types/store';
import { formatPkr, formatUsdt } from '../data/catalog';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, option: string, quantity: number) => void;
  onInstantBuy: (product: Product, option: string, quantity: number, gateway: PaymentGatewayId) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onAddToCart,
  onInstantBuy,
}) => {
  const [selectedOption, setSelectedOption] = useState<string>(
    product?.variants?.options[0] || 'Standard Atelier Edition'
  );
  const [quantity, setQuantity] = useState(1);
  const [addedFeedback, setAddedFeedback] = useState(false);

  if (!product) return null;

  const activeOption =
    product.variants?.options.includes(selectedOption)
      ? selectedOption
      : product.variants?.options[0] || 'Standard Atelier Edition';

  const handleAdd = () => {
    onAddToCart(product, activeOption, quantity);
    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1C1916]/75 backdrop-blur-[2px] p-3 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-[#FAF7F2] border-2 border-[#1C1916] shadow-[10px_10px_0px_#1C1916] my-auto overflow-hidden paper-grain">
        {/* Top Archival Bar */}
        <div className="flex items-center justify-between px-5 py-3 bg-[#1C1916] text-[#FAF7F2]">
          <div className="flex items-center gap-3 font-mono text-xs">
            <span className="text-[#F0B90B] font-bold">{product.lotNumber}</span>
            <span className="text-[#8A8175]">•</span>
            <span>ORIGIN: {product.originCity.toUpperCase()}</span>
          </div>
          <button
            onClick={onClose}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#2C2723] hover:bg-[#B84A27] text-xs font-mono uppercase"
          >
            Close <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12">
          {/* Left Image & Provenance */}
          <div className="md:col-span-6 border-b md:border-b-0 md:border-r border-[#D5CBB8] bg-[#EAE2D3]/50 flex flex-col justify-between">
            <div className="relative aspect-[4/3] md:aspect-square overflow-hidden border-b border-[#D5CBB8]">
              <img
                src={product.image}
                alt={product.title}
                className="w-full h-full object-cover"
              />
              {product.badge && (
                <span className="absolute top-3 left-3 px-2.5 py-1 bg-[#1C1916] text-[#FAF7F2] font-mono text-[10px] uppercase tracking-widest">
                  {product.badge}
                </span>
              )}
              {product.urduTitle && (
                <span className="absolute bottom-3 right-3 px-3 py-1 bg-[#FAF7F2]/95 border border-[#1C1916] font-serif text-xs text-[#1C1916]">
                  {product.urduTitle}
                </span>
              )}
            </div>

            {/* Maker Note Footer */}
            <div className="p-4 bg-[#F4EFE6] text-xs space-y-1.5">
              <div className="font-mono text-[10px] uppercase tracking-widest text-[#B84A27]">
                Bench Note from {product.artisanName}
              </div>
              <p className="font-serif italic text-sm text-[#1C1916] leading-relaxed">
                “{product.makerNote}”
              </p>
            </div>
          </div>

          {/* Right Dossier Specs & Actions */}
          <div className="md:col-span-6 p-5 sm:p-7 flex flex-col justify-between space-y-5">
            <div className="space-y-4">
              <div>
                <div className="font-mono text-[11px] uppercase tracking-widest text-[#B84A27]">
                  {product.categoryLabel}
                </div>
                <h2 className="font-serif text-2xl sm:text-3xl text-[#1C1916] leading-tight mt-1">
                  {product.title}
                </h2>
                <p className="text-xs text-[#575047] mt-1">{product.subtitle}</p>
              </div>

              {/* Price Block */}
              <div className="flex items-baseline justify-between p-3.5 bg-[#F4EFE6] border border-[#1C1916]">
                <div>
                  <span className="font-mono text-2xl font-bold text-[#1C1916]">
                    {formatPkr(product.pricePkr)}
                  </span>
                  {product.originalPricePkr && (
                    <span className="ml-2 font-mono text-xs line-through text-[#8A8175]">
                      {formatPkr(product.originalPricePkr)}
                    </span>
                  )}
                </div>
                <div className="text-right font-mono text-xs text-[#B84A27] font-semibold">
                  ≈ {formatUsdt(product.pricePkr)}
                </div>
              </div>

              <p className="text-xs sm:text-sm text-[#1C1916]/90 leading-relaxed">
                {product.description}
              </p>

              {/* Archival Spec Grid */}
              <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-[#D5CBB8] font-mono text-xs">
                <div className="p-2 bg-[#F4EFE6]/70 border border-[#D5CBB8]">
                  <span className="text-[10px] text-[#575047] flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-[#B84A27]" /> ORIGIN
                  </span>
                  <strong className="text-[#1C1916]">{product.originCity}</strong>
                </div>
                <div className="p-2 bg-[#F4EFE6]/70 border border-[#D5CBB8]">
                  <span className="text-[10px] text-[#575047] flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[#B84A27]" /> BENCH TIME
                  </span>
                  <strong className="text-[#1C1916]">{product.craftingHours} Hours</strong>
                </div>
                <div className="p-2 bg-[#F4EFE6]/70 border border-[#D5CBB8]">
                  <span className="text-[10px] text-[#575047] flex items-center gap-1">
                    <Ruler className="w-3 h-3 text-[#B84A27]" /> DIMENSIONS
                  </span>
                  <strong className="text-[#1C1916] truncate block">{product.dimensions}</strong>
                </div>
                <div className="p-2 bg-[#F4EFE6]/70 border border-[#D5CBB8]">
                  <span className="text-[10px] text-[#575047] flex items-center gap-1">
                    <Scale className="w-3 h-3 text-[#B84A27]" /> WEIGHT / LOT
                  </span>
                  <strong className="text-[#1C1916]">
                    {product.weight} ({product.inStock} left)
                  </strong>
                </div>
              </div>

              {/* Materials Tags */}
              <div>
                <span className="font-mono text-[10px] uppercase tracking-widest text-[#575047] block mb-1.5">
                  Raw Materials & Hardware
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {product.materials.map((mat) => (
                    <span
                      key={mat}
                      className="px-2 py-0.5 bg-[#EAE2D3] border border-[#D5CBB8] font-mono text-[11px] text-[#1C1916]"
                    >
                      {mat}
                    </span>
                  ))}
                </div>
              </div>

              {/* Variant & Quantity Selector */}
              {product.variants && (
                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-widest text-[#575047] mb-1.5">
                    Select {product.variants.label}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {product.variants.options.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setSelectedOption(opt)}
                        className={`px-3 py-1.5 font-mono text-xs border transition-colors ${
                          activeOption === opt
                            ? 'bg-[#1C1916] text-[#FAF7F2] border-[#1C1916]'
                            : 'bg-white text-[#1C1916] border-[#D5CBB8] hover:border-[#1C1916]'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-[#D5CBB8] space-y-3">
              <div className="flex items-center gap-3">
                <div className="inline-flex items-center border border-[#1C1916] bg-white">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3 py-2 font-mono text-sm hover:bg-[#EAE2D3]"
                  >
                    −
                  </button>
                  <span className="px-3 py-2 font-mono text-xs font-bold">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-3 py-2 font-mono text-sm hover:bg-[#EAE2D3]"
                  >
                    +
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleAdd}
                  className="flex-1 py-2.5 px-4 bg-[#1C1916] hover:bg-[#B84A27] text-[#FAF7F2] font-mono text-xs uppercase tracking-widest border border-[#1C1916] transition-colors flex items-center justify-center gap-2"
                >
                  {addedFeedback ? (
                    <>
                      <Check className="w-4 h-4" /> Added to Satchel
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4" /> Add to Satchel
                    </>
                  )}
                </button>
              </div>

              {/* Direct Gateway Express Checkout */}
              <div>
                <span className="font-mono text-[10px] uppercase tracking-widest text-[#575047] block mb-1.5">
                  Express Direct Checkout With:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  <button
                    type="button"
                    onClick={() => onInstantBuy(product, activeOption, quantity, 'nayapay')}
                    className="py-1.5 px-2 bg-[#FDF0E6] hover:bg-[#E85D04] hover:text-white text-[#1C1916] border border-[#E85D04] font-mono text-[11px] font-bold transition-colors"
                  >
                    NayaPay
                  </button>
                  <button
                    type="button"
                    onClick={() => onInstantBuy(product, activeOption, quantity, 'easypaisa')}
                    className="py-1.5 px-2 bg-[#E8F6EC] hover:bg-[#1E7E34] hover:text-white text-[#1C1916] border border-[#1E7E34] font-mono text-[11px] font-bold transition-colors"
                  >
                    Easypaisa
                  </button>
                  <button
                    type="button"
                    onClick={() => onInstantBuy(product, activeOption, quantity, 'binance')}
                    className="py-1.5 px-2 bg-[#FBF5E4] hover:bg-[#181A20] hover:text-[#F0B90B] text-[#1C1916] border border-[#C69214] font-mono text-[11px] font-bold transition-colors"
                  >
                    Binance Pay
                  </button>
                  <button
                    type="button"
                    onClick={() => onInstantBuy(product, activeOption, quantity, 'gopayfast')}
                    className="py-1.5 px-2 bg-[#E7F2F7] hover:bg-[#0B4F6C] hover:text-white text-[#1C1916] border border-[#0B4F6C] font-mono text-[11px] font-bold transition-colors"
                  >
                    GoPayFast
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
