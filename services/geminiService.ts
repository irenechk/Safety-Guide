import { GoogleGenAI, Type } from "@google/genai";
import { SafetyAdvice, Coordinates, SafePlace } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Schema for structured safety advice
const safetySchema = {
  type: Type.OBJECT,
  properties: {
    tips: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of simple, practical safety tips.",
    },
    avoid: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Things to avoid in this situation.",
    },
    steps: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Step-by-step instructions for staying safe.",
    },
    emergencyGuide: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Short guide on what to do if things go wrong.",
    },
    reminders: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Small reminders like keeping numbers saved or trusting instincts.",
    },
  },
  required: ["tips", "avoid", "steps", "emergencyGuide", "reminders"],
};

export const getSafetyAdvice = async (scenario: string): Promise<SafetyAdvice> => {
  const model = "gemini-2.5-flash";
  
  const prompt = `
    The user is in the following scenario or location: "${scenario}".
    
    Provide helpful, practical, easy-to-follow safety advice. 
    Explain things in a calm, reassuring tone—never scary or dramatic.
    Keep the language human, warm, and supportive. 
    Ensure the advice is relevant to the exact place or scenario.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: safetySchema,
        systemInstruction: "You are a warm, supportive Personal Safety Assistant. Your goal is to make the user feel empowered and safe, not fearful.",
      },
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No data returned");
    return JSON.parse(jsonText) as SafetyAdvice;
  } catch (error) {
    console.error("Error fetching safety advice:", error);
    throw error;
  }
};

export const findSafePlaces = async (location: Coordinates | string): Promise<SafePlace[]> => {
  const model = "gemini-2.5-flash";
  let prompt = "Find the nearest police stations, hospitals, fire stations, or 24-hour public safe zones (like open convenience stores, lobbies, or busy areas) where someone can go for safety. In your text response, please list the places and explicitly mention the phone number for each place if available (e.g., 'Phone: 555-1234').";
  
  let config: any = {
    tools: [{ googleMaps: {} }],
  };

  if (typeof location === 'string') {
    prompt += ` The user is currently located at or near: "${location}". Find safe places near this location.`;
  } else {
    prompt += " Search near the user's current coordinates.";
    config.toolConfig = {
      retrievalConfig: {
        latLng: {
          latitude: location.latitude,
          longitude: location.longitude,
        },
      },
    };
  }

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: config,
    });

    // Extract grounding chunks for Maps
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    
    if (!chunks) return [];

    const places: SafePlace[] = [];
    chunks.forEach((chunk: any) => {
      // Check for Web grounding (search fallback)
      if (chunk.web?.uri && chunk.web?.title) {
         places.push({ title: chunk.web.title, uri: chunk.web.uri });
      }
      // Check for Maps grounding (primary for safe places)
      if (chunk.maps?.uri && chunk.maps?.title) {
         places.push({ title: chunk.maps.title, uri: chunk.maps.uri });
      }
    });

    // Filter duplicates based on URI
    const uniquePlaces = places.filter((place, index, self) =>
      index === self.findIndex((p) => p.uri === place.uri)
    );

    // Attempt to extract phone numbers from the text response to enrich the structured data
    if (response.text) {
        const fullText = response.text;
        uniquePlaces.forEach(place => {
            // Create a safe regex for the place name
            try {
                // Find where the place is mentioned in the text
                const escapedTitle = place.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const nameRegex = new RegExp(escapedTitle, 'i');
                const match = fullText.match(nameRegex);
                
                if (match && match.index !== undefined) {
                    // Look at the text immediately following the name (up to 300 chars)
                    const snippet = fullText.substring(match.index, match.index + 300);
                    // Look for common phone number patterns
                    const phoneMatch = snippet.match(/(?:Phone|Call|Tel|T|Contact)[:.]?\s*([+\d\s().-]{8,20})/i);
                    
                    if (phoneMatch && phoneMatch[1]) {
                        const rawNumber = phoneMatch[1].trim();
                        // Basic validation: must have at least 7 digits to be considered a phone number
                        if (rawNumber.replace(/\D/g, '').length >= 7) {
                            place.phoneNumber = rawNumber;
                        }
                    }
                }
            } catch (e) {
                // Ignore regex errors for weird titles
            }
        });
    }

    return uniquePlaces;
  } catch (error) {
    console.error("Error finding safe places:", error);
    return [];
  }
};