
import { GoogleGenAI } from "@google/genai";

export async function generateCustomDesign(prompt: string): Promise<string | null> {
  try {
    // Standard initialization as per guidelines
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const fullPrompt = `A high-quality, professional anime-style graphic for a T-shirt. Subject: ${prompt}. Minimalist vector style, clean lines, isolated on a neutral background, suitable for printing on apparel.`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: fullPrompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1"
        }
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      // Find the image part in the multi-part response
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Design Generation Error:", error);
    return null;
  }
}
