
import React from 'react';
import { Button } from './Button';
import { ICONS } from '../../constants';

interface PremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
}

export const PremiumModal: React.FC<PremiumModalProps> = ({ isOpen, onClose, onUpgrade }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md transform transition-all">
        <div className="p-8 text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white mb-6">
                {ICONS.PREMIUM}
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Go Premium!</h3>
            <p className="mt-4 text-gray-600 dark:text-gray-300">
                Unlock the full potential of StudyForge and supercharge your learning.
            </p>
            <ul className="mt-6 space-y-3 text-left text-gray-700 dark:text-gray-200">
                <li className="flex items-center"><span className="text-green-500 mr-2">✔</span> Unlimited AI summaries & quizzes</li>
                <li className="flex items-center"><span className="text-green-500 mr-2">✔</span> Advanced OCR for handwritten notes</li>
                <li className="flex items-center"><span className="text-green-500 mr-2">✔</span> PDF file uploads</li>
                <li className="flex items-center"><span className="text-green-500 mr-2">✔</span> Priority AI responses</li>
            </ul>
            <p className="mt-4 text-xs text-gray-500">
                In a real app, this would integrate with Stripe or Razorpay.
            </p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700/50 px-6 py-4 flex flex-col sm:flex-row-reverse gap-3">
          <Button onClick={onUpgrade} className="w-full sm:w-auto">
            Upgrade Now
          </Button>
          <Button onClick={onClose} variant="secondary" className="w-full sm:w-auto">
            Maybe Later
          </Button>
        </div>
      </div>
    </div>
  );
};
