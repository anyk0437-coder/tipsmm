import React, { useState } from 'react';
import { X, PlusCircle } from 'lucide-react';
import { CategoryId, Product } from '../types/store';

interface AddCustomProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddProduct: (product: Product) => void;
}

export const AddCustomProductModal: React.FC<AddCustomProductModalProps> = ({
  isOpen,
  onClose,
  onAddProduct,
}) => {
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [category, setCategory] = useState<Exclude<CategoryId, 'all'>>('leather-carry');
  const [pricePkr, setPricePkr] = useState('6500');
  const [originCity, setOriginCity] = useState('Peshawar, KP');
  const [artisanName, setArtisanName] = useState('Jamal Ahmad Studio');
  const [image, setImage] = useState('/images/prod-leather-folio.jpg');
  const [description, setDescription] = useState(
    'Hand-crafted in small batches with full material provenance and direct workshop dispatch.'
  );

  if (!isOpen) return null;

  const categoryLabels: Record<Exclude<CategoryId, 'all'>, string> = {
    'leather-carry': 'Saddlery & Carry',
    'ceramics-home': 'Kiln & Tableware',
    'textiles-apparel': 'Hand-Loomed Textiles',
    'brass-objects': 'Brass & Copperware',
    footwear: 'Bespoke Footwear',
    apothecary: 'Botanical Apothecary',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newProduct: Product = {
      id: `krg-custom-${Date.now()}`,
      lotNumber: `LOT № ${Math.floor(100 + Math.random() * 899)}-X`,
      title: title.trim(),
      subtitle: subtitle.trim() || 'Bespoke small-batch edition from our studio',
      category,
      categoryLabel: categoryLabels[category],
      pricePkr: Math.max(100, Number(pricePkr) || 5000),
      originCity: originCity.trim() || 'Peshawar, KP',
      artisanName: artisanName.trim() || 'Jamal Ahmad Studio',
      craftingHours: 12,
      batchSize: 'Limited Edition',
      materials: ['Artisan Grade Material', 'Hand-Finished Detailing'],
      dimensions: 'Standard Studio Spec',
      weight: '0.75 kg',
      image,
      description,
      makerNote: 'Listed directly via the KĀRGHAR Custom Catalog Builder.',
      variants: {
        label: 'Edition Option',
        options: ['Standard Edition', 'Bespoke Gift Wrapped'],
      },
      inStock: 10,
      badge: 'Custom Listing',
    };

    try {
      await fetch('/api/custom-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProduct),
      });
    } catch {
      // Fallback handled in parent state
    }

    onAddProduct(newProduct);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1C1916]/75 backdrop-blur-[2px] p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl bg-[#FAF7F2] border-2 border-[#1C1916] shadow-[8px_8px_0px_#1C1916] p-6 my-auto paper-grain">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#1C1916]">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-widest text-[#B84A27] block">
              Multi-Category Store Builder
            </span>
            <h3 className="font-serif text-xl text-[#1C1916]">
              Add Custom Product to Catalog
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 bg-[#1C1916] text-white hover:bg-[#B84A27]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-mono text-[10px] uppercase text-[#575047] mb-1">
              Product Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Hand-Stitched Charsadda Leather Wallet"
              className="w-full px-3 py-2 bg-white border border-[#1C1916] font-sans text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-mono text-[10px] uppercase text-[#575047] mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Exclude<CategoryId, 'all'>)}
                className="w-full px-3 py-2 bg-white border border-[#1C1916] font-sans text-xs"
              >
                <option value="leather-carry">Saddlery & Carry</option>
                <option value="ceramics-home">Kiln & Tableware</option>
                <option value="textiles-apparel">Hand-Loomed Textiles</option>
                <option value="brass-objects">Brass & Copperware</option>
                <option value="footwear">Bespoke Footwear</option>
                <option value="apothecary">Botanical Apothecary</option>
              </select>
            </div>
            <div>
              <label className="block font-mono text-[10px] uppercase text-[#575047] mb-1">
                Price in PKR (Rs.) *
              </label>
              <input
                type="number"
                required
                min={100}
                value={pricePkr}
                onChange={(e) => setPricePkr(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#1C1916] font-mono text-sm font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-mono text-[10px] uppercase text-[#575047] mb-1">
                Origin City
              </label>
              <input
                type="text"
                value={originCity}
                onChange={(e) => setOriginCity(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#1C1916]"
              />
            </div>
            <div>
              <label className="block font-mono text-[10px] uppercase text-[#575047] mb-1">
                Studio / Artisan Name
              </label>
              <input
                type="text"
                value={artisanName}
                onChange={(e) => setArtisanName(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#1C1916]"
              />
            </div>
          </div>

          <div>
            <label className="block font-mono text-[10px] uppercase text-[#575047] mb-1">
              Select Studio Image Preset or Paste Image URL
            </label>
            <select
              value={image}
              onChange={(e) => setImage(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-[#1C1916] font-mono text-xs mb-2"
            >
              <option value="/images/prod-leather-bag.jpg">Leather Weekender Bag</option>
              <option value="/images/prod-leather-folio.jpg">Bridle Leather Folio</option>
              <option value="/images/prod-peshawari-sandal.jpg">Oxblood Peshawari Sandal</option>
              <option value="/images/prod-ceramic-set.jpg">Multani Ceramic Pour-Over</option>
              <option value="/images/prod-khaddar-shirt.jpg">Hand-Loomed Khaddar Overshirt</option>
              <option value="/images/prod-wool-throw.jpg">Swat Valley Wool Throw</option>
              <option value="/images/prod-brass-kettle.jpg">Hammered Copper Chai Kettle</option>
              <option value="/images/prod-brass-desk.jpg">Solid Brass Architect Tray</option>
              <option value="/images/prod-candle-apothecary.jpg">Deodar Cedar & Apricot Duo</option>
            </select>
          </div>

          <div>
            <label className="block font-mono text-[10px] uppercase text-[#575047] mb-1">
              Short Craft Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-[#1C1916]"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-[#1C1916] font-mono text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2 bg-[#B84A27] hover:bg-[#1C1916] text-white font-mono text-xs uppercase tracking-wider border border-[#1C1916]"
            >
              <PlusCircle className="w-4 h-4" /> Publish Lot to Store
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
