import React, { useState } from 'react';
import { api } from '../../services/api.ts';
import { BookingRequest } from '../../types/index.ts';
import {
  CreditCard,
  QrCode,
  ShieldCheck,
  Lock,
  CheckCircle2,
  AlertCircle,
  X,
  ChevronRight,
  ArrowRight,
  Clock,
  Sparkles,
  Info
} from 'lucide-react';

interface PaymentModalProps {
  booking: BookingRequest;
  onSuccess: (updatedBooking: BookingRequest) => void;
  onClose: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  booking,
  onSuccess,
  onClose
}) => {
  const [method, setMethod] = useState<'UPI' | 'Credit Card'>('UPI');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState<any | null>(null);

  // UPI Form state
  const [upiId, setUpiId] = useState('');
  const [showQr, setShowQr] = useState(false);

  // Card Form state
  const [cardholderName, setCardholderName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expDate, setExpDate] = useState('');
  const [cvc, setCvc] = useState('');
  const [billingZip, setBillingZip] = useState('94107');

  const grandTotal = booking.totalPrice + (booking.securityDeposit || 0);

  // Format card number with spaces: XXXX XXXX XXXX XXXX
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
    const parts = raw.match(/[\s\S]{1,4}/g) || [];
    setCardNumber(parts.join(' '));
  };

  // Format expiration: MM/YY
  const handleExpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (raw.length >= 2) {
      raw = raw.slice(0, 2) + '/' + raw.slice(2);
    }
    setExpDate(raw);
  };

  const detectBrand = (num: string) => {
    const clean = num.replace(/\s/g, '');
    if (/^4/.test(clean)) return 'Visa';
    if (/^(5[1-5]|2[2-7])/.test(clean)) return 'Mastercard';
    if (/^3[47]/.test(clean)) return 'Amex';
    if (/^(508|60|65|81|82)/.test(clean)) return 'RuPay';
    return null;
  };

  const cardBrand = detectBrand(cardNumber);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);

    try {
      const payload: any = {
        method
      };

      if (method === 'UPI') {
        if (!upiId.trim() && !showQr) {
          setErrorMsg('Please enter a valid UPI ID (e.g. yourname@okhdfcbank) or select Scan QR.');
          setSubmitting(false);
          return;
        }
        payload.upiId = upiId.trim() || 'neighbor.lend@upi';
      } else {
        if (!cardholderName.trim()) {
          setErrorMsg('Please enter the name on the card.');
          setSubmitting(false);
          return;
        }
        const cleanCard = cardNumber.replace(/\s/g, '');
        if (cleanCard.length < 13) {
          setErrorMsg('Please enter a valid card number.');
          setSubmitting(false);
          return;
        }
        payload.cardholderName = cardholderName.trim();
        payload.cardNumber = cleanCard;
        payload.expDate = expDate;
        payload.cvc = cvc;
        payload.billingZip = billingZip;
      }

      const res = await api.payBooking(booking.bookingId, payload);
      setPaymentSuccess(res.paymentDetails);
      onSuccess(res.booking);
    } catch (err: any) {
      setErrorMsg(err.message || 'Payment processing failed. Please check your payment details.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl relative border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-stone-400 hover:text-stone-800 rounded-lg cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {paymentSuccess ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-bold text-stone-900">Payment Successfully Secured!</h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                Total paid: <strong className="text-stone-900 tabular-nums">${paymentSuccess.totalPaid}</strong> via {paymentSuccess.method}.
              </p>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-left space-y-2 text-xs">
              <div className="flex justify-between text-emerald-950 font-bold">
                <span>Transaction Reference:</span>
                <span className="font-mono text-emerald-900">{paymentSuccess.transactionId}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Rental Duration Charge:</span>
                <span className="font-semibold tabular-nums">${paymentSuccess.rentalAmount}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Refundable Security Deposit:</span>
                <span className="font-semibold tabular-nums text-emerald-800">${paymentSuccess.depositAmount} (Held in Escrow)</span>
              </div>
              <p className="text-[10px] text-stone-500 pt-1 border-t border-emerald-200/60">
                * Security deposit will be automatically unlocked and refunded to your account upon equipment return and inspection.
              </p>
            </div>

            <button
              onClick={onClose}
              className="w-full py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Back to Dashboard
            </button>
          </div>
        ) : (
          <>
            <div>
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-700" />
                <h3 className="text-lg font-bold text-stone-900">Online Checkout & Escrow</h3>
              </div>
              <p className="text-xs text-stone-500 mt-1">
                Complete rental payment and refundable security deposit for <strong className="text-stone-800">{booking.equipment?.name || 'Equipment'}</strong>.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Payment Method Selector Tabs */}
            <div className="grid grid-cols-2 gap-2 bg-stone-100 p-1 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => { setMethod('UPI'); setErrorMsg(null); }}
                className={`py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  method === 'UPI' ? 'bg-white text-emerald-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <QrCode className="w-4 h-4 text-emerald-700" />
                <span>UPI (GPay / PhonePe / QR)</span>
              </button>

              <button
                type="button"
                onClick={() => { setMethod('Credit Card'); setErrorMsg(null); }}
                className={`py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  method === 'Credit Card' ? 'bg-white text-emerald-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <CreditCard className="w-4 h-4 text-emerald-700" />
                <span>Credit / Debit Card</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* UPI Tab */}
              {method === 'UPI' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-stone-800">Select UPI Option:</span>
                    <button
                      type="button"
                      onClick={() => setShowQr(!showQr)}
                      className="text-emerald-800 font-semibold hover:underline cursor-pointer"
                    >
                      {showQr ? 'Enter UPI ID instead' : 'Scan Dynamic QR Code'}
                    </button>
                  </div>

                  {showQr ? (
                    <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 text-center space-y-3">
                      <div className="w-36 h-36 bg-white p-2 mx-auto rounded-xl border border-stone-300 shadow-2xs flex flex-col items-center justify-center relative">
                        {/* Dynamic Stylized QR Code SVG */}
                        <svg className="w-full h-full text-stone-900" viewBox="0 0 100 100" fill="currentColor">
                          <rect width="100" height="100" fill="white" />
                          {/* Corner Squares */}
                          <rect x="10" y="10" width="24" height="24" fill="currentColor" />
                          <rect x="14" y="14" width="16" height="16" fill="white" />
                          <rect x="18" y="18" width="8" height="8" fill="currentColor" />

                          <rect x="66" y="10" width="24" height="24" fill="currentColor" />
                          <rect x="70" y="14" width="16" height="16" fill="white" />
                          <rect x="74" y="18" width="8" height="8" fill="currentColor" />

                          <rect x="10" y="66" width="24" height="24" fill="currentColor" />
                          <rect x="14" y="70" width="16" height="16" fill="white" />
                          <rect x="18" y="74" width="8" height="8" fill="currentColor" />

                          {/* Data points */}
                          <rect x="40" y="15" width="6" height="6" fill="currentColor" />
                          <rect x="50" y="25" width="6" height="6" fill="currentColor" />
                          <rect x="40" y="40" width="20" height="20" fill="#047857" />
                          <rect x="20" y="45" width="6" height="6" fill="currentColor" />
                          <rect x="75" y="45" width="8" height="8" fill="currentColor" />
                          <rect x="45" y="75" width="10" height="10" fill="currentColor" />
                          <rect x="70" y="75" width="8" height="8" fill="currentColor" />
                        </svg>
                      </div>

                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-stone-900">Scan with any UPI App</p>
                        <p className="text-[11px] text-stone-500">Google Pay, PhonePe, Paytm, BHIM</p>
                        <p className="text-xs font-bold text-emerald-800 tabular-nums pt-1">${grandTotal} USD</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-stone-800">Enter UPI Virtual Address (VPA)</label>
                      <input
                        type="text"
                        value={upiId}
                        onChange={e => setUpiId(e.target.value)}
                        placeholder="e.g. mobile@okhdfcbank or user@paytm"
                        className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-emerald-600"
                      />

                      {/* Quick UPI suffix shortcuts */}
                      <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[11px]">
                        <span className="text-stone-400 font-medium">Quick handle:</span>
                        {['@okhdfcbank', '@oksbi', '@paytm', '@ybl'].map(handle => (
                          <button
                            type="button"
                            key={handle}
                            onClick={() => {
                              const base = upiId.split('@')[0] || 'neighbor';
                              setUpiId(base + handle);
                            }}
                            className="px-2 py-0.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded font-mono cursor-pointer"
                          >
                            {handle}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Credit / Debit Card Tab */}
              {method === 'Credit Card' && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-800">Cardholder Full Name</label>
                    <input
                      type="text"
                      required
                      value={cardholderName}
                      onChange={e => setCardholderName(e.target.value)}
                      placeholder="e.g. Alex Henderson"
                      className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-stone-800">Card Number</label>
                      {cardBrand && (
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {cardBrand}
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <CreditCard className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        required
                        value={cardNumber}
                        onChange={handleCardNumberChange}
                        placeholder="4242 4242 4242 4242"
                        className="w-full pl-9 pr-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-emerald-600 font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-stone-800">Expires</label>
                      <input
                        type="text"
                        required
                        value={expDate}
                        onChange={handleExpChange}
                        placeholder="MM/YY"
                        maxLength={5}
                        className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-emerald-600 font-mono text-center"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-stone-800">CVC</label>
                      <input
                        type="password"
                        required
                        value={cvc}
                        onChange={e => setCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        placeholder="123"
                        maxLength={4}
                        className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-emerald-600 font-mono text-center"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-stone-800">Postal / ZIP</label>
                      <input
                        type="text"
                        required
                        value={billingZip}
                        onChange={e => setBillingZip(e.target.value)}
                        placeholder="94107"
                        className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-emerald-600 text-center"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Cost Summary Box */}
              <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200 space-y-2 text-xs">
                <div className="flex justify-between text-stone-600">
                  <span>Rental Charge ({booking.totalDays} days):</span>
                  <span className="font-semibold text-stone-900 tabular-nums">${booking.totalPrice}</span>
                </div>

                {booking.securityDeposit > 0 && (
                  <div className="flex justify-between text-stone-600">
                    <span className="flex items-center gap-1">
                      <span>Refundable Security Deposit:</span>
                      <Info className="w-3 h-3 text-stone-400" />
                    </span>
                    <span className="font-semibold text-emerald-800 tabular-nums">${booking.securityDeposit}</span>
                  </div>
                )}

                <div className="border-t border-stone-200 pt-2 flex justify-between font-bold text-stone-900 text-sm">
                  <span>Total Amount Authorized</span>
                  <span className="text-emerald-800 tabular-nums text-base">${grandTotal}</span>
                </div>
              </div>

              {/* Escrow trust notice */}
              <div className="flex items-center gap-2 text-[11px] text-stone-500 pt-1">
                <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>
                  Funds are protected in escrow. Your security deposit of ${booking.securityDeposit} is immediately refunded upon return.
                </span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  {submitting ? 'Processing Payment...' : `Authorize & Pay $${grandTotal}`}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
