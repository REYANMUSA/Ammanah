import React, { useState } from 'react';
import { ShieldAlert, Send, CheckCircle2, Clock, X, HeartHandshake } from 'lucide-react';
import { EmergencyRequest } from '../../types/database';
import { dataService } from '../../lib/storage/dataService';
import { playCalmChime, triggerHapticFeedback } from '../../lib/notifications/notificationService';

interface INeedYouModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSent?: (req: EmergencyRequest) => void;
}

export const INeedYouModal: React.FC<INeedYouModalProps> = ({
  isOpen,
  onClose,
  onSent,
}) => {
  const [step, setStep] = useState<'confirm' | 'sending' | 'sent'>('confirm');
  const [customMessage, setCustomMessage] = useState('I need you right now.');
  const [recentRequest, setRecentRequest] = useState<EmergencyRequest | null>(null);

  if (!isOpen) return null;

  const handleSend = async () => {
    setStep('sending');
    triggerHapticFeedback();

    try {
      const req = await dataService.sendEmergencyRequest(customMessage);
      playCalmChime();
      setRecentRequest(req);
      setStep('sent');
      if (onSent) onSent(req);
    } catch (err) {
      console.error(err);
      setStep('confirm');
    }
  };

  const handleReset = () => {
    setStep('confirm');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-sm rounded-2xl bg-[#FBFBF9] border border-[#E3DDD1] shadow-2xl p-6 text-center">
        {step === 'confirm' && (
          <>
            <div className="w-14 h-14 rounded-full bg-[#FAECE7] border border-[#F3C7B9] mx-auto mb-4 flex items-center justify-center">
              <ShieldAlert className="w-7 h-7 text-[#B93815]" />
            </div>

            <h3 className="text-xl font-serif font-bold text-[#1F2421] mb-1">
              I Need You
            </h3>
            <p className="text-xs text-[#6B756E] mb-4">
              Sends an immediate, high-priority notification to your connected person.
            </p>

            <div className="mb-4 text-left">
              <label className="block text-[11px] font-medium text-[#505D54] mb-1">
                Optional note:
              </label>
              <input
                type="text"
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Can you call / check in with me?"
                className="w-full px-3 py-2 rounded-xl border border-[#D5CEC2] bg-white text-xs focus:outline-none focus:ring-1 focus:ring-[#B93815]"
              />
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={handleSend}
                className="w-full py-3 rounded-xl bg-[#B93815] hover:bg-[#9E2F11] text-white text-sm font-semibold tracking-wide flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all"
              >
                <Send className="w-4 h-4" />
                <span>Confirm & Send Alert</span>
              </button>
              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl border border-[#DCD6C8] text-xs font-medium text-[#6B756E] hover:bg-[#F4F1EA] transition-colors"
              >
                Cancel
              </button>
            </div>
          </>
        )}

        {step === 'sending' && (
          <div className="py-8">
            <div className="w-12 h-12 rounded-full border-2 border-[#B93815] border-t-transparent animate-spin mx-auto mb-4" />
            <p className="text-sm font-medium text-[#1F2421]">Sending urgent signal...</p>
          </div>
        )}

        {step === 'sent' && (
          <>
            <div className="w-14 h-14 rounded-full bg-[#EBF3ED] border border-[#C1DEC9] mx-auto mb-4 flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7 text-[#2E473B]" />
            </div>

            <h3 className="text-lg font-serif font-bold text-[#1F2421] mb-1">
              Alert Sent
            </h3>
            <p className="text-xs text-[#505D54] leading-relaxed mb-4">
              Your message was dispatched. It will remain prominent until acknowledged.
            </p>

            {recentRequest && (
              <div className="p-3 rounded-xl bg-[#F4F1EA] border border-[#E3DDD1] text-left text-xs mb-5 space-y-1">
                <div className="flex items-center gap-1.5 text-[#6B756E]">
                  <Clock className="w-3.5 h-3.5 text-[#2E473B]" />
                  <span>Time: {new Date(recentRequest.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[#6B756E]">
                  <HeartHandshake className="w-3.5 h-3.5 text-[#2E473B]" />
                  <span>Status: <strong className="text-[#B93815] uppercase tracking-wider">{recentRequest.status}</strong></span>
                </div>
              </div>
            )}

            <button
              onClick={handleReset}
              className="w-full py-2.5 rounded-xl bg-[#2E473B] text-white text-xs font-medium hover:bg-[#23372E] transition-colors"
            >
              Done
            </button>
          </>
        )}
      </div>
    </div>
  );
};
