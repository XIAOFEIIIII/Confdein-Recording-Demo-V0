import React, { useState, useRef, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface ImmersiveReaderProps {
  title: string;
  content: string;
  onClose: () => void;
}

const ImmersiveReader: React.FC<ImmersiveReaderProps> = ({ title, content, onClose }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);

  // Split content into paragraphs (split by double newlines)
  // Merge short paragraphs (likely headings) with the next paragraph
  const rawParagraphs = content
    .split(/\n\n+/)
    .map(p => p.trim())
    .filter(p => p.length > 0);

  const paragraphs: string[] = [];
  for (let i = 0; i < rawParagraphs.length; i++) {
    const current = rawParagraphs[i];
    // If current paragraph is short (likely a heading) and not the last one, merge with next
    if (current.length < 100 && i < rawParagraphs.length - 1) {
      paragraphs.push(current + '\n\n' + rawParagraphs[i + 1]);
      i++; // Skip next paragraph as it's been merged
    } else {
      paragraphs.push(current);
    }
  }

  const totalPages = paragraphs.length;

  const handlePrev = () => {
    const newPage = Math.max(0, currentPage - 1);
    setCurrentPage(newPage);
    if (containerRef.current) {
      isScrollingRef.current = true;
      const pageWidth = containerRef.current.clientWidth;
      containerRef.current.scrollTo({
        left: newPage * pageWidth,
        behavior: 'smooth'
      });
      setTimeout(() => {
        isScrollingRef.current = false;
      }, 500);
    }
  };

  const handleNext = () => {
    const newPage = Math.min(totalPages - 1, currentPage + 1);
    setCurrentPage(newPage);
    if (containerRef.current) {
      isScrollingRef.current = true;
      const pageWidth = containerRef.current.clientWidth;
      containerRef.current.scrollTo({
        left: newPage * pageWidth,
        behavior: 'smooth'
      });
      setTimeout(() => {
        isScrollingRef.current = false;
      }, 500);
    }
  };

  // Update current page based on scroll position (only when user scrolls, not programmatic)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (isScrollingRef.current) return; // Ignore programmatic scrolls
      const pageWidth = container.clientWidth;
      const newPage = Math.round(container.scrollLeft / pageWidth);
      setCurrentPage((prev) => {
        if (newPage !== prev && newPage >= 0 && newPage < totalPages) {
          return newPage;
        }
        return prev;
      });
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [totalPages]);

  return (
    <div className="fixed inset-0 z-[200] bg-[#fbfbfa] flex flex-col">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 p-2 text-[#4a3a33]/20 hover:text-[#4a3a33]/40 transition-colors z-10"
        aria-label="Close"
      >
        <X size={18} />
      </button>

      {/* Page indicator - below close button */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 px-6 absolute top-14 right-6 left-6">
          {paragraphs.map((_, idx) => (
            <div
              key={idx}
              className={`h-1 rounded-full transition-all ${
                idx === currentPage
                  ? 'bg-[#4a3a33] flex-1 max-w-[40px]'
                  : 'bg-[#4a3a33]/20 flex-1 max-w-[40px]'
              }`}
            />
          ))}
        </div>
      )}

      {/* Content area - scrollable container */}
      <div
        ref={containerRef}
        className="flex-1 flex overflow-x-auto snap-x snap-mandatory no-scrollbar"
        style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}
      >
        {paragraphs.map((paragraph, idx) => (
          <div
            key={idx}
            className="flex-shrink-0 w-full h-full snap-start flex items-center justify-center px-10"
            style={{ minWidth: '100%' }}
          >
            <div className="max-w-2xl w-full py-12">
              <p className="melrose-text text-[#4a3a33] whitespace-pre-line leading-relaxed">
                {paragraph}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation arrows */}
      {totalPages > 1 && (
        <>
          {currentPage > 0 && (
            <button
              onClick={handlePrev}
              className="absolute left-6 top-1/2 -translate-y-1/2 p-3 bg-[#f6f5f3]/70 backdrop-blur-sm rounded-full text-[#4a3a33]/50 hover:text-[#4a3a33] hover:bg-[#f6f5f3]/90 transition-all shadow-sm"
              aria-label="Previous"
            >
              <ChevronLeft size={20} />
            </button>
          )}
          {currentPage < totalPages - 1 && (
            <button
              onClick={handleNext}
              className="absolute right-6 top-1/2 -translate-y-1/2 p-3 bg-[#f6f5f3]/70 backdrop-blur-sm rounded-full text-[#4a3a33]/50 hover:text-[#4a3a33] hover:bg-[#f6f5f3]/90 transition-all shadow-sm"
              aria-label="Next"
            >
              <ChevronRight size={20} />
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default ImmersiveReader;
