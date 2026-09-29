import React from 'react';
import { X, FileText, ArrowUpRight } from 'lucide-react';
import { OrderRecord } from '../types/store';
import { formatPkr, formatUsdt } from '../data/catalog';
import { GatewayEmblem } from './PaymentGraphics';

interface OrdersDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  orders: OrderRecord[];
  onSelectOrder: (order: OrderRecord) => void;
}

export const OrdersDrawer: React.FC<OrdersDrawerProps> = ({
  isOpen,
  onClose,
  orders,
  onSelectOrder,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-[#1C1916]/65 backdrop-blur-[1px]">
      <div className="relative w-full max-w-md bg-[#F4EFE6] border-l-2 border-[#1C1916] h-full flex flex-col justify-between paper-grain shadow-[-8px_0px_0px_#1C1916]">
        {/* Header */}
        <div className="px-5 py-4 bg-[#1C1916] text-[#FAF7F2] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <FileText className="w-4 h-4 text-[#F0B90B]" />
            <div>
              <h3 className="font-serif text-lg leading-none">Order & Receipt Ledger</h3>
              <span className="font-mono text-[10px] text-[#D5CBB8] uppercase tracking-widest">
                {orders.length} Recorded Vouchers
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 bg-[#2C2723] hover:bg-[#B84A27] text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-3.5">
          {orders.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12 px-4 border border-dashed border-[#8A8175]">
              <span className="font-mono text-xs uppercase tracking-widest text-[#8A8175] mb-2">
                No Vouchers Recorded Yet
              </span>
              <p className="font-serif text-base text-[#1C1916]">
                Once you complete a payment via NayaPay, Easypaisa, Binance Pay, or GoPayFast, your stamped receipt will appear here.
              </p>
            </div>
          ) : (
            orders.map((ord) => (
              <div
                key={ord.id}
                className="p-4 bg-[#FAF7F2] border border-[#1C1916] shadow-[3px_3px_0px_#D5CBB8] space-y-2.5"
              >
                <div className="flex items-center justify-between border-b border-[#D5CBB8] pb-2">
                  <div>
                    <span className="font-mono text-xs font-bold text-[#B84A27] block">
                      {ord.id}
                    </span>
                    <span className="font-mono text-[10px] text-[#575047]">
                      {new Date(ord.createdAt).toLocaleString('en-PK', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </span>
                  </div>
                  <GatewayEmblem gateway={ord.payment.gateway} />
                </div>

                <div className="font-mono text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-[#575047]">Paid To:</span>
                    <strong className="text-[#1C1916]">
                      {ord.payment.recipientAccount} ({ord.payment.recipientName})
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#575047]">Transaction ID:</span>
                    <strong className="text-[#1C1916]">{ord.payment.transactionId}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#575047]">Total:</span>
                    <strong className="text-[#B84A27]">
                      {formatPkr(ord.totalPkr)} ({formatUsdt(ord.totalPkr)})
                    </strong>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onSelectOrder(ord)}
                  className="w-full py-1.5 px-3 bg-[#1C1916] hover:bg-[#B84A27] text-[#FAF7F2] font-mono text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span>Open Stamped Receipt</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
