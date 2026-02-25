import React, { useState } from 'react';
import { CurrentUserId, PrayerReminderSettings, PrayerReminderTimeSlot } from '../types';
import { getProfiles, getAvatarSrc } from '../data/userData';
import { Check, Plus, Trash2, Edit2, X, ChevronRight, ChevronDown, Bell, Users } from 'lucide-react';

const PROFILES = getProfiles();

interface SettingsProps {
  currentUser: CurrentUserId;
  onSwitchUser: (userId: CurrentUserId) => void;
  prayerReminderSettings: PrayerReminderSettings | null;
  onUpdatePrayerReminderSettings: (settings: PrayerReminderSettings) => void;
}

const Settings: React.FC<SettingsProps> = ({ 
  currentUser, 
  onSwitchUser, 
  prayerReminderSettings, 
  onUpdatePrayerReminderSettings 
}) => {
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editHour, setEditHour] = useState(0);
  const [editMinute, setEditMinute] = useState(0);
  const [newSlotLabel, setNewSlotLabel] = useState('');
  const [newSlotHour, setNewSlotHour] = useState(12);
  const [newSlotMinute, setNewSlotMinute] = useState(0);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [expandedSection, setExpandedSection] = useState<'prayer' | 'account' | null>(null);

  if (!prayerReminderSettings) {
    return null;
  }

  const sortedSlots = [...prayerReminderSettings.timeSlots].sort(
    (a, b) => a.hour * 60 + a.minute - (b.hour * 60 + b.minute)
  );

  const handleToggleEnabled = () => {
    onUpdatePrayerReminderSettings({
      ...prayerReminderSettings,
      enabled: !prayerReminderSettings.enabled,
    });
  };

  const handleToggleSlotEnabled = (slotId: string) => {
    onUpdatePrayerReminderSettings({
      ...prayerReminderSettings,
      timeSlots: prayerReminderSettings.timeSlots.map(slot =>
        slot.id === slotId ? { ...slot, enabled: !slot.enabled } : slot
      ),
    });
  };

  const handleStartEdit = (slot: PrayerReminderTimeSlot) => {
    setEditLabel(slot.label);
    setEditHour(slot.hour);
    setEditMinute(slot.minute);
    setEditingSlotId(slot.id);
  };

  const handleSaveEdit = () => {
    if (!editingSlotId) return;
    onUpdatePrayerReminderSettings({
      ...prayerReminderSettings,
      timeSlots: prayerReminderSettings.timeSlots.map(slot =>
        slot.id === editingSlotId ? { ...slot, label: editLabel, hour: editHour, minute: editMinute } : slot
      ),
    });
    setEditingSlotId(null);
  };

  const handleCancelEdit = () => {
    setEditingSlotId(null);
  };

  const handleDeleteSlot = (slotId: string) => {
    if (prayerReminderSettings.timeSlots.length <= 1) return;
    onUpdatePrayerReminderSettings({
      ...prayerReminderSettings,
      timeSlots: prayerReminderSettings.timeSlots.filter(slot => slot.id !== slotId),
    });
  };

  const handleAddSlot = () => {
    if (!newSlotLabel.trim()) return;
    const newSlot: PrayerReminderTimeSlot = {
      id: `prayer-slot-${Date.now()}`,
      label: newSlotLabel.trim(),
      hour: newSlotHour,
      minute: newSlotMinute,
      enabled: true,
    };
    onUpdatePrayerReminderSettings({
      ...prayerReminderSettings,
      timeSlots: [...prayerReminderSettings.timeSlots, newSlot],
    });
    setNewSlotLabel('');
    setNewSlotHour(12);
    setNewSlotMinute(0);
    setIsAddingNew(false);
  };

  const enabledSlotsCount = sortedSlots.filter(s => s.enabled).length;
  const activeProfile = PROFILES.find(p => p.id === currentUser);

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-500 max-w-2xl py-6 flex flex-col gap-4">
      {/* Prayer Reminder Entry */}
      <div className="bg-[#f5f4ed]/40 rounded-2xl overflow-hidden">
        <button
          type="button"
          onClick={() => setExpandedSection(expandedSection === 'prayer' ? null : 'prayer')}
          className="w-full flex items-center gap-4 p-4 text-left transition-all hover:bg-[#f5f4ed]/60"
        >
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#141413]/10 flex items-center justify-center">
            <Bell size={18} className="text-[#141413]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[#141413] font-semibold text-[16px]">
              Prayer Reminder
            </p>
            <p className="text-[#141413]/50 text-[14px]">
              {prayerReminderSettings.enabled 
                ? `${enabledSlotsCount} reminder${enabledSlotsCount !== 1 ? 's' : ''} enabled`
                : 'Disabled'}
            </p>
          </div>
          {expandedSection === 'prayer' ? (
            <ChevronDown size={20} className="text-[#141413]/50 flex-shrink-0" />
          ) : (
            <ChevronRight size={20} className="text-[#141413]/50 flex-shrink-0" />
          )}
        </button>

        {expandedSection === 'prayer' && (
          <div className="px-4 pb-4 pt-2 border-t border-[#141413]/10">
            <div className="flex flex-col gap-3">
              {sortedSlots.map((slot) => {
            const isEditing = editingSlotId === slot.id;

            return (
              <div
                key={slot.id}
                className="flex items-center gap-3 p-3 bg-[#f5f4ed]/40 rounded-xl"
              >
                {isEditing ? (
                  <>
                    <input
                      type="text"
                      value={editLabel}
                      onChange={(e) => setEditLabel(e.target.value)}
                      className="flex-1 px-2 py-1 text-[16px] bg-white border border-[#141413]/20 rounded"
                      placeholder="Label"
                    />
                    <input
                      type="number"
                      min="0"
                      max="23"
                      value={editHour}
                      onChange={(e) => setEditHour(parseInt(e.target.value) || 0)}
                      className="w-16 px-2 py-1 text-[16px] bg-white border border-[#141413]/20 rounded"
                      placeholder="Hour"
                    />
                    <span className="text-[#141413]/50">:</span>
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={editMinute}
                      onChange={(e) => setEditMinute(parseInt(e.target.value) || 0)}
                      className="w-16 px-2 py-1 text-[16px] bg-white border border-[#141413]/20 rounded"
                      placeholder="Min"
                    />
                    <button
                      type="button"
                      onClick={handleSaveEdit}
                      className="p-1 text-[#141413] hover:bg-[#141413]/10 rounded"
                    >
                      <Check size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="p-1 text-[#141413] hover:bg-[#141413]/10 rounded"
                    >
                      <X size={16} />
                    </button>
                  </>
                ) : (
                  <>
                    <div className="flex-1">
                      <p className="text-[#141413] text-[16px] font-medium">
                        {slot.label}
                      </p>
                      <p className="text-[#141413]/50 text-[14px]">
                        {String(slot.hour).padStart(2, '0')}:{String(slot.minute).padStart(2, '0')}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleSlotEnabled(slot.id)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                        slot.enabled ? 'bg-[#141413]/20' : 'bg-[#141413]/10'
                      }`}
                    >
                      <span
                        className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                          slot.enabled ? 'translate-x-5' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </>
                )}
              </div>
            );
          })}

          {isAddingNew ? (
            <div className="flex items-center gap-3 p-3 bg-[#f5f4ed]/60 rounded-xl">
              <input
                type="text"
                value={newSlotLabel}
                onChange={(e) => setNewSlotLabel(e.target.value)}
                className="flex-1 px-2 py-1 text-[16px] bg-white border border-[#141413]/20 rounded"
                placeholder="Label"
              />
              <input
                type="number"
                min="0"
                max="23"
                value={newSlotHour}
                onChange={(e) => setNewSlotHour(parseInt(e.target.value) || 0)}
                className="w-16 px-2 py-1 text-[16px] bg-white border border-[#141413]/20 rounded"
                placeholder="Hour"
              />
              <span className="text-[#141413]/50">:</span>
              <input
                type="number"
                min="0"
                max="59"
                value={newSlotMinute}
                onChange={(e) => setNewSlotMinute(parseInt(e.target.value) || 0)}
                className="w-16 px-2 py-1 text-[16px] bg-white border border-[#141413]/20 rounded"
                placeholder="Min"
              />
              <button
                type="button"
                onClick={handleAddSlot}
                disabled={!newSlotLabel.trim()}
                className="p-1 text-[#141413] hover:bg-[#141413]/10 rounded disabled:opacity-40"
              >
                <Check size={16} />
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAddingNew(false);
                  setNewSlotLabel('');
                }}
                className="p-1 text-[#141413] hover:bg-[#141413]/10 rounded"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsAddingNew(true)}
              className="flex items-center gap-2 p-3 bg-[#f5f4ed]/40 hover:bg-[#f5f4ed]/60 rounded-xl text-[#141413] transition-colors"
            >
              <Plus size={16} />
              <span className="text-[16px]">Add time slot</span>
            </button>
          )}
            </div>
          </div>
        )}
      </div>

      {/* Account Switch Entry */}
      <div className="bg-[#f5f4ed]/40 rounded-2xl overflow-hidden">
        <button
          type="button"
          onClick={() => setExpandedSection(expandedSection === 'account' ? null : 'account')}
          className="w-full flex items-center gap-4 p-4 text-left transition-all hover:bg-[#f5f4ed]/60"
        >
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#141413]/10 flex items-center justify-center">
            <Users size={18} className="text-[#141413]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[#141413] font-semibold text-[16px]">
              Account Switch
            </p>
            <p className="text-[#141413]/50 text-[14px]">
              Currently: {activeProfile?.displayName || 'Unknown'}
            </p>
          </div>
          {expandedSection === 'account' ? (
            <ChevronDown size={20} className="text-[#141413]/50 flex-shrink-0" />
          ) : (
            <ChevronRight size={20} className="text-[#141413]/50 flex-shrink-0" />
          )}
        </button>

        {expandedSection === 'account' && (
          <div className="px-4 pb-4 pt-2 border-t border-[#141413]/10">
            <p className="text-[#141413]/50 text-[14px] mb-4">
              Switch whose journal, devotional, and verses you see. No login—just pick a profile.
            </p>
            <div className="flex flex-col gap-3">
              {PROFILES.map((profile) => {
                const isActive = currentUser === profile.id;
                return (
                  <button
                    key={profile.id}
                    type="button"
                    onClick={() => onSwitchUser(profile.id)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl text-left transition-all ${
                      isActive
                        ? 'bg-[#f5f4ed]/80 shadow-sm ring-1 ring-[#141413]/10'
                        : 'bg-[#f5f4ed]/40 hover:bg-[#f5f4ed]/60'
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
                      <p className="text-[#141413] font-semibold text-[16px]">
                        {profile.displayName}
                      </p>
                      <p className="text-[#141413]/50 text-[14px]">
                        {profile.id === 'erica' ? 'Journal, devo & verses (default)' : 'Different journal, devo & verses'}
                      </p>
                    </div>
                    {isActive && (
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#141413]/10 flex items-center justify-center">
                        <Check size={16} className="text-[#141413]" strokeWidth={2.5} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
