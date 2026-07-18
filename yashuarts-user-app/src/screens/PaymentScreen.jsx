import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Shield, Phone, MessageSquare } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import api from '../services/api';

const UPI_ADDRESS = '9398029785@ibl';
const SUPPORT_PHONE = '+919398029785';

export const PaymentScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const order = location.state?.order;

  const [showQR, setShowQR] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [confirming, setConfirming] = useState(false);

  if (!order) {
    navigate('/');
    return null;
  }

  const upiUri = `upi://pay?pa=${UPI_ADDRESS}&pn=YashuArts&am=${order.amount}&cu=INR&tn=Order${order.id.slice(0, 8)}`;

  const handleIHavePaid = async () => {
    setConfirming(true);
    try {
      await api.orders.updateStatus(order.id, order.order_status, 'paid');
      setPaymentConfirmed(true);
    } catch (err) {
      console.error('Error confirming payment:', err);
      alert('Unable to confirm payment status. Please contact support.');
    } finally {
      setConfirming(false);
    }
  };

  const handleWhatsAppPayment = () => {
    const text = encodeURIComponent(
      `Hi! I want to make payment of ₹${order.amount} for Order #${order.id.slice(0, 8)}. Please share payment details.`
    );
    window.open(`https://wa.me/${SUPPORT_PHONE.replace('+', '')}?text=${text}`, '_blank');
  };

  if (paymentConfirmed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-green-150">
          <div className="bg-green-100 p-4 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Payment Confirmed!</h2>
          <p className="text-gray-600 mb-6 font-medium">Thank you for your order</p>
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left border border-gray-150">
            <div className="flex justify-between mb-2 text-sm">
              <span className="text-gray-600">Order ID:</span>
              <span className="font-semibold text-gray-900">#{order.id.slice(0, 8)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Amount Paid:</span>
              <span className="font-semibold text-green-600 text-lg">₹{order.amount}</span>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-6 leading-relaxed">
            We'll start working on your artwork right away. You'll receive updates on WhatsApp.
          </p>
          <button
            onClick={() => navigate('/')}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-white py-3.5 rounded-xl font-bold uppercase tracking-wider hover:from-amber-600 hover:to-orange-700 transition-all shadow-md"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pb-20">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="text-gray-600 hover:text-gray-900 p-1 flex items-center justify-center"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">Payment</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Order Summary Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4" style={{ fontFamily: "'Cinzel', serif" }}>
            Order Summary
          </h2>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">Order ID</p>
                <p className="font-semibold text-gray-900 font-mono">#{order.id.slice(0, 8)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 uppercase font-semibold">Amount</p>
                <p className="text-3xl font-bold text-amber-600">₹{order.amount}</p>
              </div>
            </div>
          </div>
          <div className="text-sm text-gray-600">
            <p>
              <strong>Artwork Type:</strong> {order.artwork_type} ({order.artwork_size})
            </p>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4" style={{ fontFamily: "'Cinzel', serif" }}>
            Choose Payment Method
          </h2>
          <div className="space-y-3">
            {/* UPI App redirection */}
            <button
              onClick={() => {
                window.location.href = upiUri;
              }}
              className="w-full flex items-center justify-between p-4 border-2 border-gray-200 rounded-lg hover:border-amber-400 hover:bg-amber-50 transition-all text-left"
            >
              <div className="flex items-center gap-3">
                <div className="bg-amber-100 p-2 rounded-lg">
                  <svg className="w-6 h-6 text-amber-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" />
                  </svg>
                </div>
                <div>
                  <div className="font-semibold text-gray-900">UPI Smart Pay</div>
                  <div className="text-xs text-gray-600">GPay, PhonePe, Paytm</div>
                </div>
              </div>
              <span className="text-amber-600 font-bold text-sm">Pay Now</span>
            </button>

            {/* WhatsApp Payment Support */}
            <button
              onClick={handleWhatsAppPayment}
              className="w-full flex items-center justify-between p-4 border-2 border-gray-200 rounded-lg hover:border-green-400 hover:bg-green-50 transition-all text-left"
            >
              <div className="flex items-center gap-3">
                <div className="bg-green-100 p-2 rounded-lg">
                  <MessageSquare className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">WhatsApp Pay</div>
                  <div className="text-xs text-gray-600">Chat with artist</div>
                </div>
              </div>
              <span className="text-green-600 font-bold text-sm">Contact</span>
            </button>

            {/* QR Code toggle */}
            <button
              onClick={() => setShowQR(!showQR)}
              className="w-full flex items-center justify-between p-4 border-2 border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all text-left"
            >
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                    />
                  </svg>
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Scan QR Code</div>
                  <div className="text-xs text-gray-600">Any UPI app</div>
                </div>
              </div>
              <span className="text-blue-600 font-bold text-sm">{showQR ? 'Hide' : 'Show'}</span>
            </button>
          </div>

          {/* QR Code display */}
          {showQR && (
            <div className="mt-6 p-6 bg-gray-50 rounded-2xl border border-gray-150 text-center animate-scale-up">
              <QRCodeSVG value={upiUri} size={200} className="mx-auto mb-4 border-4 border-white shadow-md" />
              <p className="text-xs text-gray-600 font-semibold">Scan with any UPI app to pay</p>
            </div>
          )}
        </div>

        {/* Security Alert info */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white mb-6 shadow-md">
          <div className="flex items-center gap-3 mb-3">
            <Shield className="w-6 h-6" />
            <h3 className="font-semibold text-lg" style={{ fontFamily: "'Cinzel', serif" }}>
              Secure Payment
            </h3>
          </div>
          <p className="text-blue-100 text-xs sm:text-sm leading-relaxed">
            All payments are processed securely. Your transactional safety is our primary focus.
          </p>
        </div>

        {/* Action Button */}
        <button
          onClick={handleIHavePaid}
          disabled={confirming}
          className="w-full bg-green-600 text-white py-4 rounded-xl font-bold uppercase tracking-wider hover:bg-green-700 transition-all disabled:opacity-50 shadow-md mb-4 flex items-center justify-center gap-2"
        >
          {confirming ? 'Confirming...' : 'I have Paid'}
        </button>

        {/* Telephone Call Support */}
        <div className="text-center">
          <a href={`tel:${SUPPORT_PHONE}`} className="inline-flex items-center gap-2 text-amber-600 hover:text-amber-700 font-medium text-sm">
            <Phone className="w-4 h-4" /> Need help? Call support
          </a>
        </div>
      </main>
    </div>
  );
};

export default PaymentScreen;
