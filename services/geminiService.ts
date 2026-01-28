
import { GoogleGenAI, Type } from "@google/genai";
import { JournalEntry, Devotional } from "../types";

// Fix: Use the correct initialization pattern for GoogleGenAI
// Use import.meta.env for Vite, fallback to process.env for compatibility
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) || '';
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const analyzeJournalEntry = async (text: string): Promise<Partial<JournalEntry>> => {
  if (!ai) {
    // Fallback if API key is not configured
    return { 
      summary: "Journal recorded.", 
      keywords: text.split(' ').slice(0, 3), 
      mood: 'peaceful' 
    };
  }
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Analyze this voice journal entry. Extract key themes, a 1-sentence summary, keywords, and any prayer requests mentioned (identify names and specific needs). 
    Entry: "${text}"`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
          mood: { type: Type.STRING, description: "One of: peaceful, anxious, grateful, heavy, hopeful" },
          prayerRequests: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                personName: { type: Type.STRING },
                request: { type: Type.STRING }
              },
              required: ["personName", "request"]
            }
          }
        },
        required: ["summary", "keywords", "mood"]
      }
    }
  });

  try {
    // Fix: Directly access the .text property as per guidelines
    const resultText = response.text || '{}';
    return JSON.parse(resultText.trim());
  } catch (e) {
    console.error("Failed to parse AI response", e);
    return { summary: "Journal recorded.", keywords: [], mood: 'peaceful' };
  }
};

export const generatePersonalizedDevotional = async (recentEntries: JournalEntry[]): Promise<Devotional> => {
  if (!ai) {
    // Fallback if API key is not configured
    return {
      verse: "The Lord is my shepherd, I shall not want.",
      reference: "Psalm 23:1",
      reflection: "Take a moment to rest in the quiet assurance that you are seen and loved.",
      prayer: "God, help me to find my rest in You today."
    };
  }
  
  const context = recentEntries.map(e => e.transcript).join("\n---\n");
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Based on the following journal entries from the past few days, provide a personalized 'Holy Pause' devotional. 
    Focus on bringing the user back to God's presence. Do not over-analyze their emotions, just provide spiritual framing.
    Include: 1 relevant Bible verse, a short reflection (3-4 sentences), and a gentle prayer.
    
    User Context:
    ${context}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          verse: { type: Type.STRING },
          reference: { type: Type.STRING },
          reflection: { type: Type.STRING },
          prayer: { type: Type.STRING }
        },
        required: ["verse", "reference", "reflection", "prayer"]
      }
    }
  });

  try {
    // Fix: Directly access the .text property as per guidelines
    const resultText = response.text || '{}';
    return JSON.parse(resultText.trim());
  } catch (e) {
    return {
      verse: "The Lord is my shepherd, I shall not want.",
      reference: "Psalm 23:1",
      reflection: "Take a moment to rest in the quiet assurance that you are seen and loved.",
      prayer: "God, help me to find my rest in You today."
    };
  }
};
