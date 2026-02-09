import React, { useState, useEffect } from 'react';
import { X, Save, Trash2 } from 'lucide-react';
import { JournalEntry, MoodLevel } from '../types';

interface EntryEditorProps {
  entry: JournalEntry;
  onSave: (updatedEntry: JournalEntry) => void;
  onDelete?: (entryId: string) => void;
  onClose: () => void;
  /** When true, use Patrick Hand for diary content (e.g. Roman's entries). */
  usePatrickHand?: boolean;
}

const EntryEditor: React.FC<EntryEditorProps> = ({ entry, onSave, onDelete, onClose, usePatrickHand }) => {
  // Combine transcript, scripture, and tags into one field for editing
  const getCombinedContent = () => {
    let content = entry.transcript;
    if (entry.scripture) {
      content += '\n\n' + entry.scripture;
    }
    if (entry.keywords.length > 0) {
      content += '\n\nTags: ' + entry.keywords.join(', ');
    }
    return content;
  };

  const [content, setContent] = useState(getCombinedContent());
  const [moodLevel, setMoodLevel] = useState<MoodLevel>(entry.moodLevel);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const moodEmojis: Record<MoodLevel, string> = {
    1: ':(',
    2: ':/',
    3: ':|',
    4: ':)',
    5: ':D',
  };

  const handleSave = () => {
    // Parse combined content: extract tags and scripture if present
    const lines = content.split('\n\n').map(l => l.trim()).filter(l => l.length > 0);
    let transcript = '';
    let scripture: string | undefined = undefined;
    let tags: string[] = [];

    for (const line of lines) {
      if (line.startsWith('Tags: ')) {
        tags = line.slice(6).split(',').map(t => t.trim()).filter(t => t.length > 0);
      } else if (line.match(/^[A-Za-z]+\s+\d+:\d+/)) {
        // Looks like scripture reference (e.g. "Lev 19:32")
        scripture = line;
      } else {
        transcript += (transcript ? '\n\n' : '') + line;
      }
    }

    const updatedEntry: JournalEntry = {
      ...entry,
      transcript: transcript || content, // Fallback to full content if no parsing
      keywords: tags,
      scripture,
      moodLevel,
    };
    onSave(updatedEntry);
    onClose();
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(entry.id);
      onClose();
    }
  };

  return (
    <div className={`fixed inset-0 z-[200] bg-[#fbfbfa] flex flex-col ${usePatrickHand ? 'handwriting-roman' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#e7ded4]">
        <h2 className="text-[14px] font-bold uppercase tracking-widest text-[#4a3a33]">
          Edit Entry
        </h2>
        <div className="flex items-center gap-2">
          {onDelete && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 text-[#4a3a33]/30 hover:text-red-600 transition-colors"
              aria-label="Delete"
            >
              <Trash2 size={18} />
            </button>
          )}
          <button
            onClick={handleSave}
            className="p-2 text-[#4a3a33]/50 hover:text-[#4a3a33] transition-colors"
            aria-label="Save"
          >
            <Save size={18} />
          </button>
          <button
            onClick={onClose}
            className="p-2 text-[#4a3a33]/20 hover:text-[#4a3a33]/40 transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-10 px-6">
          <div className="bg-[#fbfbfa] rounded-2xl p-6 max-w-sm w-full shadow-lg">
            <p className="text-[#4a3a33] text-[15px] mb-4">
              Are you sure you want to delete this entry? This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl text-[13px] font-semibold hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 bg-[#f6f5f3] text-[#4a3a33] rounded-xl text-[13px] font-semibold hover:bg-[#f0efed] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-10 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Combined Content: transcript, scripture, tags all in one */}
          <div>
            <label className="block text-[14px] font-bold uppercase tracking-widest text-[#4a3a33] mb-3">
              Content
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full min-h-[400px] bg-transparent border-b border-[#e7ded4] handwriting text-[#4a3a33] text-[15px] leading-relaxed resize-none focus:outline-none focus:border-[#4a3a33]/40"
              placeholder="Write your thoughts...&#10;&#10;You can add scripture references (e.g. Lev 19:32) and tags (Tags: dream, sermon notes) on separate lines."
            />
            <p className="text-[11px] text-[#4a3a33]/40 mt-2">
              Tip: Add scripture on a new line, and tags with "Tags: " prefix
            </p>
          </div>

          {/* Mood Level */}
          <div>
            <label className="block text-[14px] font-bold uppercase tracking-widest text-[#4a3a33] mb-3">
              How are you feeling?
            </label>
            <div className="flex items-center justify-between gap-2">
              {([1, 2, 3, 4, 5] as MoodLevel[]).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setMoodLevel(level)}
                  className={`flex-1 aspect-square rounded-full border-2 transition-all flex items-center justify-center ${
                    moodLevel === level
                      ? 'border-[#4a3a33] bg-[#4a3a33]/5'
                      : 'border-[#e7ded4] bg-white hover:border-[#4a3a33]/30'
                  }`}
                  style={{ minWidth: '48px', minHeight: '48px' }}
                >
                  <span className="text-xl font-mono text-[#4a3a33]">{moodEmojis[level]}</span>
                </button>
              ))}
            </div>
            <p className="text-[11px] text-[#4a3a33]/50 mt-2 text-center">
              {moodLevel === 1 ? 'Terrible' : moodLevel === 2 ? 'Bad' : moodLevel === 3 ? 'Okay' : moodLevel === 4 ? 'Good' : 'Great'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EntryEditor;
