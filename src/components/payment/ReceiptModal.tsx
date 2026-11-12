import React from 'react';
import { CheckCircle2, Printer, X, ShieldCheck, Wrench, Download } from 'lucide-react';

interface ReceiptModalProps {
  receipt: any;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ receipt, onClose }) => {
  if (!receipt) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl relative border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-stone-400 hover:text-stone-800 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-start justify-between border-b border-stone-100 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-800 text-lime-accent flex items-center justify-center">
                <Wrench className="w-3.5 h-3.5" />
              </div>
              <span className="text-base font-extrabold text-stone-900">
                Neighbour<span className="text-emerald-800">Lend</span>
              </span>
            </div>
            <p className="text-[10px] text-stone-500 uppercase tracking-wider font-semibold">
              Community Equipment Sharing Network
            </p>
          </div>

          <div className="text-right">
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
              Tax Invoice & Receipt
            </span>
            <p className="text-[10px] text-stone-400 font-mono mt-1">{receipt.receiptNumber}</p>
          </div>
        </div>

        {/* Status banner */}
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-emerald-900 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            <span>Payment Status: {receipt.status}</span>
          </div>
          <span className="text-[11px] text-emerald-800 font-mono">
            Auth: {receipt.authorizationCode}
          </span>
        </div>

        {/* Participants Info */}
        <div className="grid grid-cols-2 gap-4 text-xs border-b border-stone-100 pb-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Borrower</p>
            <p className="font-bold text-stone-900 mt-0.5">{receipt.borrower?.name}</p>
            <p className="text-stone-500 text-[11px]">{receipt.borrower?.email}</p>
            <p className="text-stone-500 text-[11px]">{receipt.borrower?.location}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Equipment Lender</p>
            <p className="font-bold text-stone-900 mt-0.5">{receipt.lender?.name}</p>
            <p className="text-stone-500 text-[11px]">{receipt.lender?.email}</p>
            <p className="text-stone-500 text-[11px]">{receipt.lender?.location}</p>
          </div>
        </div>

        {/* Itemized Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-stone-900 border-b border-stone-100 pb-2">
            <span>Description</span>
            <span>Amount</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-stone-900">{receipt.equipment?.name}</p>
                <p className="text-[11px] text-stone-500">
                  Rental Period: {receipt.rentalPeriod?.startDate} to {receipt.rentalPeriod?.endDate} ({receipt.rentalPeriod?.totalDays} days @ ${receipt.pricing?.pricePerDay}/day)
                </p>
              </div>
              <span className="font-bold text-stone-900 tabular-nums">${receipt.pricing?.rentalTotal}</span>
            </div>

            {receipt.pricing?.securityDeposit > 0 && (
              <div className="flex items-start justify-between text-stone-600">
                <div>
                  <p className="font-medium text-stone-800">Refundable Security Deposit (Held in Escrow)</p>
                  <p className="text-[10px] text-stone-400">
                    {receipt.pricing?.depositRefunded ? `Refunded: Ref ${receipt.pricing.depositRefundRef}` : 'Released upon undamaged return'}
                  </p>
                </div>
                <span className="font-bold text-stone-900 tabular-nums">${receipt.pricing?.securityDeposit}</span>
              </div>
            )}
          </div>

          <div className="border-t border-stone-200 pt-3 space-y-1.5 text-xs">
            <div className="flex items-center justify-between font-bold text-stone-900 text-sm">
              <span>Total Paid</span>
              <span className="text-emerald-800 tabular-nums text-base">${receipt.pricing?.grandTotal}</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-stone-500">
              <span>Payment Method:</span>
              <span className="font-semibold text-stone-700">
                {receipt.cardInfo ? `${receipt.cardInfo.brand} ···· ${receipt.cardInfo.last4}` : receipt.upiInfo ? `UPI: ${receipt.upiInfo.vpa}` : receipt.paymentMethod}
              </span>
            </div>
            <div className="flex items-center justify-between text-[10px] text-stone-400 font-mono">
              <span>Transaction Ref:</span>
              <span>{receipt.transactionRef}</span>
            </div>
            <div className="flex items-center justify-between text-[10px] text-stone-400">
              <span>Date & Time:</span>
              <span>{new Date(receipt.issuedAt).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-800 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
            <span>Escrow Protected by NeighbourLend</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Invoice</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-bold cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
