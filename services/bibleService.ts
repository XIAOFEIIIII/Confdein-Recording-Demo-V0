/**
 * Bible API service for fetching verse text by reference
 * Uses Free Use Bible API: https://bible.helloao.org/
 */

interface BibleVerseResponse {
  reference: string;
  text: string;
  translation?: string;
}

/**
 * Normalize Bible reference to handle abbreviations
 * Maps common abbreviations to full book names for API compatibility
 */
const normalizeReference = (reference: string): string => {
  // Common Bible book abbreviations mapping
  const abbreviations: Record<string, string> = {
    'Gen': 'Genesis', 'Ex': 'Exodus', 'Exod': 'Exodus', 'Lev': 'Leviticus',
    'Num': 'Numbers', 'Deut': 'Deuteronomy', 'Dt': 'Deuteronomy', 'Josh': 'Joshua',
    'Judg': 'Judges', 'Ruth': 'Ruth', '1 Sam': '1 Samuel', '2 Sam': '2 Samuel',
    '1 Kings': '1 Kings', '2 Kings': '2 Kings', '1 Chron': '1 Chronicles', '2 Chron': '2 Chronicles',
    'Ezra': 'Ezra', 'Neh': 'Nehemiah', 'Esth': 'Esther', 'Job': 'Job',
    'Ps': 'Psalm', 'Psalms': 'Psalm', 'Prov': 'Proverbs', 'Eccl': 'Ecclesiastes',
    'Song': 'Song of Solomon', 'Isa': 'Isaiah', 'Jer': 'Jeremiah', 'Lam': 'Lamentations',
    'Ezek': 'Ezekiel', 'Dan': 'Daniel', 'Hos': 'Hosea', 'Joel': 'Joel',
    'Amos': 'Amos', 'Obad': 'Obadiah', 'Jonah': 'Jonah', 'Mic': 'Micah',
    'Nah': 'Nahum', 'Hab': 'Habakkuk', 'Zeph': 'Zephaniah', 'Hag': 'Haggai',
    'Zech': 'Zechariah', 'Mal': 'Malachi',
    'Mt': 'Matthew', 'Matt': 'Matthew', 'Mk': 'Mark', 'Lk': 'Luke', 'Jn': 'John',
    'Acts': 'Acts', 'Rom': 'Romans', '1 Cor': '1 Corinthians', '2 Cor': '2 Corinthians',
    'Gal': 'Galatians', 'Eph': 'Ephesians', 'Phil': 'Philippians', 'Col': 'Colossians',
    '1 Thess': '1 Thessalonians', '2 Thess': '2 Thessalonians', '1 Tim': '1 Timothy',
    '2 Tim': '2 Timothy', 'Titus': 'Titus', 'Phlm': 'Philemon', 'Heb': 'Hebrews',
    'Jas': 'James', '1 Pet': '1 Peter', '2 Pet': '2 Peter', '1 Jn': '1 John',
    '2 Jn': '2 John', '3 Jn': '3 John', 'Jude': 'Jude', 'Rev': 'Revelation',
  };

  // Handle multiple verses (e.g., "Lev 18:5, 20" -> fetch "Leviticus 18:5-20")
  const trimmed = reference.trim();
  const parts = trimmed.split(/\s+/);
  
  if (parts.length > 0) {
    const firstPart = parts[0];
    // Check if it's an abbreviation
    if (firstPart.length <= 4 && /^[A-Za-z]+$/.test(firstPart)) {
      const normalized = abbreviations[firstPart];
      if (normalized) {
        const rest = parts.slice(1).join(' ');
        // Handle comma-separated verses: "18:5, 20" -> "18:5-20"
        const versePart = rest.replace(/,\s*(\d+)$/, '-$1');
        return normalized + ' ' + versePart;
      }
    }
  }
  
  return reference;
};

/**
 * Fetch verse text by reference using Bible API
 * @param reference Bible reference (e.g., "John 3:16", "Psalm 23:1", "Lev 19:32")
 * @returns Promise with verse text or null if not found
 */
export const fetchVerseText = async (reference: string): Promise<string | null> => {
  try {
    // Normalize reference (handle abbreviations like "Lev" -> "Leviticus")
    const normalizedRef = normalizeReference(reference);
    const encodedReference = encodeURIComponent(normalizedRef.replace(/\s+/g, '+'));
    
    // Try bible-api.com (supports CORS, no API key needed)
    const url = `https://bible-api.com/${encodedReference}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.warn(`Failed to fetch verse for ${reference} (normalized: ${normalizedRef}): ${response.status} ${response.statusText}`);
      return null;
    }
    
    const data = await response.json();
    
    // bible-api.com returns: { reference, verses: [{ book_id, book_name, chapter, verse, text }], text, translation_id, translation_name, translation_note }
    if (data.text) {
      return data.text.trim();
    }
    
    if (data.verses && Array.isArray(data.verses) && data.verses.length > 0) {
      // Join all verses
      return data.verses.map((v: any) => v.text || '').filter(Boolean).join(' ').trim();
    }
    
    return null;
  } catch (error) {
    console.error(`Error fetching verse for ${reference}:`, error);
    return null;
  }
};

/**
 * Batch fetch multiple verse texts
 * @param references Array of Bible references
 * @returns Promise with map of reference -> verse text
 */
export const fetchVerseTexts = async (
  references: string[]
): Promise<Record<string, string>> => {
  const results: Record<string, string> = {};
  
  // Fetch in parallel with a small delay to avoid rate limiting
  await Promise.all(
    references.map(async (ref, index) => {
      // Small delay to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, index * 100));
      const text = await fetchVerseText(ref);
      if (text) {
        results[ref] = text;
      }
    })
  );
  
  return results;
};
