import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface DevotionalSectionProps {
  title: string;
  content: string;
  defaultExpanded?: boolean;
}

const DevotionalSection: React.FC<DevotionalSectionProps> = ({ title, content, defaultExpanded = false }) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="border-b border-[#1f1e1d4d] last:border-b-0">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between py-4 text-left hover:bg-[#f5f4ed]/30 transition-colors"
      >
        <h4 className="text-[16px] font-bold uppercase tracking-widest text-[#141413]">
          {title}
        </h4>
        {isExpanded ? (
          <ChevronUp size={18} className="text-[#141413]/45 flex-shrink-0" />
        ) : (
          <ChevronDown size={18} className="text-[#141413]/45 flex-shrink-0" />
        )}
      </button>
      {isExpanded && (
        <div className="pb-6">
          <p className="melrose-text text-[#141413] whitespace-pre-line">
            {content}
          </p>
        </div>
      )}
    </div>
  );
};

export default DevotionalSection;
