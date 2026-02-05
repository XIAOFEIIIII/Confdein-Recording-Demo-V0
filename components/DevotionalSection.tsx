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
    <div className="border-b border-[#e7ded4] last:border-b-0">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between py-4 text-left hover:bg-[#f6f5f3]/30 transition-colors"
      >
        <h4 className="text-[14px] font-bold uppercase tracking-widest text-[#4a3a33]">
          {title}
        </h4>
        {isExpanded ? (
          <ChevronUp size={18} className="text-[#4a3a33]/45 flex-shrink-0" />
        ) : (
          <ChevronDown size={18} className="text-[#4a3a33]/45 flex-shrink-0" />
        )}
      </button>
      {isExpanded && (
        <div className="pb-6">
          <p className="melrose-text text-[#4a3a33] whitespace-pre-line">
            {content}
          </p>
        </div>
      )}
    </div>
  );
};

export default DevotionalSection;
