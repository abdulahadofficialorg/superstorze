import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { useLanguage } from '../context/ThemeLanguageContext';
import { createDepositRequest } from '../services/storeService';
import {
  X,
  Wallet,
  Copy,
  Check,
  Upload,
  Image as ImageIcon,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const DepositModal: React.FC<DepositModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { user, profile } = useAuth();
  const { siteSettings, showToast } = useStore();
  const { isBangla, t } = useLanguage();

  const [paymentMethod, setPaymentMethod] = useState<'bKash' | 'Nagad' | 'Rocket' | 'Cellfin' | 'Upay'>('bKash');
  const [amount, setAmount] = useState<string>('500');
  const [senderNumber, setSenderNumber] = useState<string>('');
  const [transactionId, setTransactionId] = useState<string>('');
  const [userNote, setUserNote] = useState<string>('');
  const [screenshotUrl, setScreenshotUrl] = useState<string>('');
  const [isUploadingImage, setIsUploadingImage] = useState<boolean>(false);
  const [copiedNumber, setCopiedNumber] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Get active target number based on payment method
  const getTargetNumber = () => {
    switch (paymentMethod) {
      case 'bKash':
        return {
          number: siteSettings.bkashNumber || '01859665565',
          type: siteSettings.bkashType || 'Personal / Send Money',
          color: 'from-pink-600 to-rose-600',
          textColor: 'text-pink-400',
          borderColor: 'border-pink-500/40',
          bgActive: 'bg-pink-600/20 text-pink-300 border-pink-500',
        };
      case 'Nagad':
        return {
          number: siteSettings.nagadNumber || '01859665565',
          type: siteSettings.nagadType || 'Personal / Send Money',
          color: 'from-orange-600 to-amber-600',
          textColor: 'text-orange-400',
          borderColor: 'border-orange-500/40',
          bgActive: 'bg-orange-600/20 text-orange-300 border-orange-500',
        };
      case 'Rocket':
        return {
          number: siteSettings.rocketNumber || '01859665565',
          type: siteSettings.rocketType || 'Personal / Send Money',
          color: 'from-purple-600 to-indigo-600',
          textColor: 'text-purple-400',
          borderColor: 'border-purple-500/40',
          bgActive: 'bg-purple-600/20 text-purple-300 border-purple-500',
        };
      case 'Cellfin':
      case 'Upay':
        return {
          number: siteSettings.bkashNumber || '01859665565',
          type: 'Bank Transfer / Personal',
          color: 'from-cyan-600 to-blue-600',
          textColor: 'text-cyan-400',
          borderColor: 'border-cyan-500/40',
          bgActive: 'bg-cyan-600/20 text-cyan-300 border-cyan-500',
        };
      default:
        return {
          number: siteSettings.bkashNumber || '01859665565',
          type: 'Personal / Send Money',
          color: 'from-cyan-600 to-blue-600',
          textColor: 'text-cyan-400',
          borderColor: 'border-cyan-500/40',
          bgActive: 'bg-cyan-600/20 text-cyan-300 border-cyan-500',
        };
    }
  };

  const target = getTargetNumber();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedNumber(true);
    showToast(isBangla ? 'নাম্বার কপি করা হয়েছে!' : 'Number copied to clipboard!', 'success');
    setTimeout(() => setCopiedNumber(false), 2000);
  };

function compressImage(file: File, maxWidth = 800, quality = 0.75): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(img.src);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg(isBangla ? 'শুধুমাত্র ছবি ফাইল (JPG, PNG, WebP) আপলোড করা যাবে।' : 'Only image files (JPG, PNG, WebP) are allowed.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg(isBangla ? 'ছবির সাইজ ১০MB এর বেশি হতে পারবে না।' : 'File size must be under 10MB.');
      return;
    }

    setErrorMsg('');
    setIsUploadingImage(true);
    try {
      const compressed = await compressImage(file);
      setScreenshotUrl(compressed);
      showToast(isBangla ? 'স্ক্রিনশট সফলভাবে সিলেক্ট করা হয়েছে!' : 'Screenshot selected successfully!', 'success');
    } catch {
      setErrorMsg(isBangla ? 'ছবি পড়তে সমস্যা হয়েছে। দয়া করে অন্য ছবি চেষ্টা করুন।' : 'Failed to read image.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!user) {
      setErrorMsg(isBangla ? 'ডিপোজিট রিকোয়েস্ট পাঠানোর জন্য অনুগ্রহ করে প্রথমে সাইন ইন করুন।' : 'Please sign in first to submit a deposit request.');
      return;
    }

    const numAmount = parseFloat(amount);
    const minAllowed = siteSettings.minDepositAmount || 20;
    if (isNaN(numAmount) || numAmount < minAllowed) {
      setErrorMsg(
        isBangla
          ? `সর্বনিম্ন ডিপোজিট পরিমাণ ৳ ${minAllowed} টাকা।`
          : `Minimum deposit amount is ৳ ${minAllowed}.`
      );
      return;
    }

    if (!senderNumber.trim() || senderNumber.trim().length < 11) {
      setErrorMsg(isBangla ? 'সঠিক ১১ ডিজিটের প্রেরক মোবাইল নাম্বার লিখুন।' : 'Enter a valid 11-digit sender phone number.');
      return;
    }

    if (!transactionId.trim() || transactionId.trim().length < 4) {
      setErrorMsg(isBangla ? 'সঠিক লেনদেন আইডি (Transaction ID / TrxID) লিখুন।' : 'Enter a valid Transaction ID (TrxID).');
      return;
    }

    setIsSubmitting(true);
    try {
      await createDepositRequest({
        userId: user.uid,
        userName: profile?.displayName || user.displayName || 'Customer',
        userEmail: user.email || '',
        amount: numAmount,
        paymentMethod,
        targetNumber: target.number,
        senderNumber: senderNumber.trim(),
        transactionId: transactionId.trim().toUpperCase(),
        screenshotUrl: screenshotUrl || '',
        userNote: userNote.trim() || '',
      });

      showToast(
        isBangla
          ? `ডিপোজিট রিকোয়েস্ট সফলভাবে জমা হয়েছে! এডমিন ভেরিফাই করে কিছুক্ষণের মধ্যে ৳${numAmount} যুক্ত করবেন।`
          : `Deposit request submitted! Admin will verify and credit ৳${numAmount} shortly.`,
        'success'
      );

      // Reset form
      setSenderNumber('');
      setTransactionId('');
      setUserNote('');
      setScreenshotUrl('');
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error('Deposit submission error:', err);
      setErrorMsg(err.message || (isBangla ? 'ডিপোজিট রিকোয়েস্ট জমা দেওয়া সম্ভব হয়নি। আবার চেষ্টা করুন।' : 'Failed to submit request.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-xl bg-[#0a1122] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl my-8 overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-600/10 blur-[100px] pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-700 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-cyan-950 border border-cyan-800/80 flex items-center justify-center text-cyan-400">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-heading font-black text-xl sm:text-2xl text-white">
              {t('deposit_modal_title')}
            </h2>
            <p className="text-xs text-slate-400">
              {t('deposit_modal_sub')}
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-950/50 border border-rose-800/80 text-rose-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 1: Select Payment Method */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              {isBangla ? '১. পেমেন্ট মাধ্যম নির্বাচন করুন:' : '1. Select Payment Method:'}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { id: 'bKash', label: 'bKash', bg: 'hover:border-pink-500' },
                { id: 'Nagad', label: 'Nagad', bg: 'hover:border-orange-500' },
                { id: 'Rocket', label: 'Rocket', bg: 'hover:border-purple-500' },
                { id: 'Cellfin', label: 'Cellfin/Upay', bg: 'hover:border-cyan-500' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPaymentMethod(m.id as any)}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${
                    paymentMethod === m.id
                      ? `${target.bgActive} shadow-md`
                      : 'bg-[#060c18] border-slate-800 text-slate-300 ' + m.bg
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Official Number Copy Box */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-[#0d1629] to-[#080e1c] border border-slate-800 relative">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-bold uppercase tracking-wider ${target.textColor}`}>
                    {paymentMethod} {isBangla ? 'একাউন্ট নাম্বার:' : 'Account Number:'}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    {target.type}
                  </span>
                </div>
                <div className="font-heading font-black text-xl sm:text-2xl text-white tracking-wider font-mono">
                  {target.number}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  {isBangla
                    ? <>অ্যাপ থেকে এই নাম্বারে <strong className="text-slate-200">Send Money</strong> করুন।</>
                    : <>Send money to this number via your {paymentMethod} app.</>}
                </p>
              </div>

              <button
                type="button"
                onClick={() => copyToClipboard(target.number)}
                className="self-start sm:self-center px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-white border border-slate-700 font-semibold text-xs transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
              >
                {copiedNumber ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiedNumber ? (isBangla ? 'কপি হয়েছে' : 'Copied') : (isBangla ? 'নাম্বার কপি' : 'Copy Number')}</span>
              </button>
            </div>
          </div>

          {/* Step 2: Amount & Quick Pills */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-300">
                {isBangla ? '২. জমার পরিমাণ (টাকা):' : '2. Deposit Amount (BDT):'}
              </label>
              <span className="text-[11px] text-slate-400 font-mono">
                {isBangla ? 'সর্বনিম্ন: ৳২০' : 'Minimum: ৳20'}
              </span>
            </div>

            <div className="relative mb-2">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                ৳
              </span>
              <input
                type="number"
                min="20"
                step="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="500"
                className="w-full bg-[#060c18] border border-slate-800 focus:border-cyan-500 rounded-xl py-2.5 pl-8 pr-4 text-white text-base font-bold font-mono focus:outline-none"
                required
              />
            </div>

            {/* Quick Amount Pills */}
            <div className="flex flex-wrap gap-2">
              {['100', '200', '500', '1000', '2000'].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setAmount(amt)}
                  className={`px-3 py-1 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
                    amount === amt
                      ? 'bg-cyan-500 text-black font-bold'
                      : 'bg-slate-900 border border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  +৳{amt}
                </button>
              ))}
            </div>
          </div>

          {/* Step 3: Sender Phone & Transaction ID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {isBangla ? '৩. প্রেরক মোবাইল নাম্বার (Sender No):' : '3. Sender Phone Number:'}
              </label>
              <input
                type="tel"
                value={senderNumber}
                onChange={(e) => setSenderNumber(e.target.value)}
                placeholder="017xxxxxxxx"
                className="w-full bg-[#060c18] border border-slate-800 focus:border-cyan-500 rounded-xl py-2.5 px-3.5 text-white text-xs font-mono focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {isBangla ? '৪. ট্রানজেকশন আইডি (TrxID):' : '4. Transaction ID (TrxID):'}
              </label>
              <input
                type="text"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value.toUpperCase())}
                placeholder="9JA82K19B"
                className="w-full bg-[#060c18] border border-slate-800 focus:border-cyan-500 rounded-xl py-2.5 px-3.5 text-white text-xs font-mono tracking-wider focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Step 4: Screenshot Upload (Payment Proof) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
                <span>{isBangla ? '৫. পেমেন্ট কনফার্মেশন স্ক্রিনশট (প্রুফ):' : '5. Payment Screenshot (Optional):'}</span>
              </label>
              <span className="text-[11px] text-cyan-400">
                {isBangla ? 'খুব দ্রুত ভেরিফিকেশনের জন্য জরুরি' : 'Recommended for fast verification'}
              </span>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageFileChange}
              accept="image/*"
              className="hidden"
            />

            {screenshotUrl ? (
              <div className="relative p-3 rounded-2xl bg-[#060c18] border border-cyan-800/80 flex items-center gap-4">
                <div className="w-20 h-20 rounded-xl overflow-hidden bg-black/60 border border-slate-700 flex-shrink-0">
                  <img
                    src={screenshotUrl}
                    alt="Payment Screenshot"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>{isBangla ? 'স্ক্রিনশট যোগ করা হয়েছে' : 'Screenshot attached'}</span>
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {isBangla ? 'এডমিন এই স্ক্রিনশট দেখে সাথে সাথে ভেরিফাই করবেন।' : 'Admin will use this to verify quickly.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setScreenshotUrl('');
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="text-[11px] text-rose-400 hover:text-rose-300 mt-2 font-semibold underline cursor-pointer"
                  >
                    {isBangla ? 'ছবিটি মুছে অন্য ছবি দিন' : 'Remove & upload another'}
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingImage}
                className="w-full py-4 px-4 rounded-2xl border-2 border-dashed border-slate-700 hover:border-cyan-500 bg-[#060c18]/80 hover:bg-[#091224] transition-all flex flex-col items-center justify-center gap-2 group cursor-pointer text-center"
              >
                <div className="w-10 h-10 rounded-full bg-slate-900 group-hover:bg-cyan-950 flex items-center justify-center text-slate-400 group-hover:text-cyan-400 border border-slate-800 transition-colors">
                  <Upload className="w-5 h-5" />
                </div>
                <div className="text-xs">
                  <span className="text-cyan-400 font-bold">
                    {isBangla ? 'এখানে ক্লিক করে স্ক্রিনশট আপলোড করুন' : 'Click to upload payment screenshot'}
                  </span>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {isBangla ? '(বিকাশ/নগদ অ্যাপের কনফার্মেশন স্ক্রিন বা SMS স্ক্রিনশট, সর্বোচ্চ ৫MB)' : '(App confirmation screen or SMS, max 5MB)'}
                  </p>
                </div>
              </button>
            )}
          </div>

          {/* Optional Note */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              {isBangla ? 'অতিরিক্ত কোনো মন্তব্য (ঐচ্ছিক):' : 'Additional Note (Optional):'}
            </label>
            <input
              type="text"
              value={userNote}
              onChange={(e) => setUserNote(e.target.value)}
              placeholder={isBangla ? 'যেমন: দ্রুত ভেরিফাই করে দিন...' : 'e.g. Please approve quickly...'}
              className="w-full bg-[#060c18] border border-slate-800 focus:border-cyan-500 rounded-xl py-2 px-3 text-white text-xs focus:outline-none"
            />
          </div>

          {/* Submit & Back Buttons */}
          <div className="pt-2 space-y-2">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="py-3.5 px-5 rounded-2xl bg-[#0e172a] hover:bg-slate-800 text-slate-300 hover:text-white font-semibold text-xs border border-slate-800 transition-all cursor-pointer"
              >
                {isBangla ? '← পেছনে যান' : 'Cancel'}
              </button>

              <button
                type="submit"
                disabled={isSubmitting || isUploadingImage}
                className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 text-black font-heading font-black text-sm transition-all shadow-xl shadow-cyan-500/20 active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    <span>{isBangla ? 'রিকোয়েস্ট পাঠানো হচ্ছে...' : 'Submitting...'}</span>
                  </>
                ) : (
                  <>
                    <span>{isBangla ? 'ডিপোজিট নিশ্চিত করুন' : 'Confirm Deposit'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

            <p className="text-[10px] text-slate-400 text-center mt-2.5">
              {isBangla
                ? '🔒 আপনার লেনদেন সম্পূর্ণ নিরাপদ। এডমিন ভেরিফাই করামাত্র স্বয়ংক্রিয়ভাবে ওয়ালেট ব্যালেন্স বাড়বে।'
                : '🔒 100% secure transaction. Balance will be updated as soon as admin verifies.'}
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};
