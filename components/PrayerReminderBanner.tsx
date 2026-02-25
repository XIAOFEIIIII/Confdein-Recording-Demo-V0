import React from 'react';
import { X, Check } from 'lucide-react';

interface PrayerReminderBannerProps {
  slotLabel: string;
  slotTime: string;
  onComplete: () => void;
  onDismiss: () => void;
  currentProgress: { completed: number; total: number };
}

const PrayerReminderBanner: React.FC<PrayerReminderBannerProps> = ({
  slotLabel,
  slotTime,
  onComplete,
  onDismiss,
  currentProgress,
}) => {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-[#f5f4ed]/95 backdrop-blur-sm border-b border-[#141413]/10 shadow-sm">
      <div className="max-w-2xl mx-auto px-10 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <p className="text-[#141413] text-[16px] font-medium">
              Time to pray: {slotLabel} ({slotTime})
            </p>
            <p className="text-[#141413]/50 text-[14px] mt-1">
              {currentProgress.completed}/{currentProgress.total} completed today
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onComplete}
              className="flex items-center gap-2 px-4 py-2 bg-[#141413] text-white rounded-lg hover:bg-[#141413]/90 transition-colors text-[16px] font-medium"
            >
              <Check size={14} />
              Mark as completed
            </button>
            <button
              type="button"
              onClick={onDismiss}
              className="p-2 text-[#141413]/50 hover:text-[#141413] hover:bg-[#141413]/10 rounded-full transition-colors"
              aria-label="Dismiss"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrayerReminderBanner;
