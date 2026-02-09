import React from 'react';
import { CurrentUserId } from '../types';
import { getProfiles, getAvatarSrc } from '../data/userData';
import { Check } from 'lucide-react';

const PROFILES = getProfiles();

interface SettingsProps {
  currentUser: CurrentUserId;
  onSwitchUser: (userId: CurrentUserId) => void;
}

const Settings: React.FC<SettingsProps> = ({ currentUser, onSwitchUser }) => {
  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-500 max-w-2xl py-6 flex flex-col gap-6">
      <div>
        <h3 className="text-[#4a3a33]/45 text-[10px] font-bold uppercase tracking-widest mb-1">
          Content
        </h3>
        <p className="text-[#4a3a33] text-[15px]">
          Switch whose journal, devotional, and verses you see. No login—just pick a profile.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {PROFILES.map((profile) => {
          const isActive = currentUser === profile.id;
          return (
            <button
              key={profile.id}
              type="button"
              onClick={() => onSwitchUser(profile.id)}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-all ${
                isActive
                  ? 'bg-[#f6f5f3]/80 shadow-sm ring-1 ring-[#4a3a33]/10'
                  : 'bg-[#f6f5f3]/40 hover:bg-[#f6f5f3]/60'
              }`}
            >
              <div className="w-12 h-12 rounded-full overflow-hidden bg-white border border-stone-100 shadow-sm flex-shrink-0 flex items-center justify-center p-0.5">
                <img
                  src={getAvatarSrc(profile.avatarUrl, profile.avatarSeed)}
                  alt=""
                  className="w-full h-full object-contain scale-125 translate-y-1"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[#4a3a33] font-semibold text-[15px]">
                  {profile.displayName}
                </p>
                <p className="text-[#4a3a33]/50 text-[13px]">
                  {profile.id === 'erica' ? 'Journal, devo & verses (default)' : 'Different journal, devo & verses'}
                </p>
              </div>
              {isActive && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#4a3a33]/10 flex items-center justify-center">
                  <Check size={16} className="text-[#4a3a33]" strokeWidth={2.5} />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Settings;
