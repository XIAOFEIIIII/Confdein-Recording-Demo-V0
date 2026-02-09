import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { JournalEntry } from '../types';

interface EntryEditorProps {
  entry: JournalEntry;
  onSave: (updatedEntry: JournalEntry) => void;
  onClose: () => void;
  /** When true, use Patrick Hand for diary content (e.g. Roman's entries). */
  usePatrickHand?: boolean;
}

const EntryEditor: React.FC<EntryEditorProps> = ({ entry, onSave, onClose, usePatrickHand }) => {
  const [transcript, setTranscript] = useState(entry.transcript);
  const [keywords, setKeywords] = useState(entry.keywords.join(', '));
  const [scripture, setScripture] = useState(entry.scripture || '');

  const handleSave = () => {
    const updatedEntry: JournalEntry = {
      ...entry,
      transcript,
      keywords: keywords.split(',').map(k => k.trim()).filter(k => k.length > 0),
      scripture: scripture.trim() || undefined,
    };
    onSave(updatedEntry);
    onClose();
  };

  return (
    <div className={`fixed inset-0 z-[200] bg-[#fbfbfa] flex flex-col ${usePatrickHand ? 'handwriting-roman' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#e7ded4]">
        <h2 className="text-[14px] font-bold uppercase tracking-widest text-[#4a3a33]">
          Edit Entry
        </h2>
        <div className="flex items-center gap-2">
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

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-10 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Transcript */}
          <div>
            <label className="block text-[14px] font-bold uppercase tracking-widest text-[#4a3a33] mb-3">
              Content
            </label>
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              className="w-full min-h-[300px] bg-transparent border-b border-[#e7ded4] handwriting text-[#4a3a33] text-[15px] leading-relaxed resize-none focus:outline-none focus:border-[#4a3a33]/40"
              placeholder="Write your thoughts..."
            />
          </div>

          {/* Scripture */}
          <div>
            <label className="block text-[14px] font-bold uppercase tracking-widest text-[#4a3a33] mb-3">
              Scripture
            </label>
            <input
              type="text"
              value={scripture}
              onChange={(e) => setScripture(e.target.value)}
              className="w-full bg-transparent border-b border-[#e7ded4] handwriting text-[#4a3a33] text-[13px] focus:outline-none focus:border-[#4a3a33]/40"
              placeholder="e.g. Lev 19:32"
            />
          </div>

          {/* Keywords */}
          <div>
            <label className="block text-[14px] font-bold uppercase tracking-widest text-[#4a3a33] mb-3">
              Keywords (comma-separated)
            </label>
            <input
              type="text"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              className="w-full bg-transparent border-b border-[#e7ded4] text-[#4a3a33] text-[14px] focus:outline-none focus:border-[#4a3a33]/40"
              placeholder="purity, love, commandments"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EntryEditor;
