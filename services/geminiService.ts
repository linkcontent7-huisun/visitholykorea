import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getPilgrimageAdvice = async (query: string, userLocation?: { lat: number, lng: number }) => {
  try {
    const config: any = {
      tools: [{ googleMaps: {} }, { googleSearch: {} }],
    };

    if (userLocation) {
      config.toolConfig = {
        retrievalConfig: {
          latLng: {
            latitude: userLocation.lat,
            longitude: userLocation.lng
          }
        }
      };
    }

    const response = await ai.models.generateContent({
      // Maps grounding is only supported in Gemini 2.5 series models.
      model: 'gemini-2.5-flash',
      contents: `사용자가 다음 질문을 했습니다: "${query}". 대한민국 천주교 성지 및 성당에 대한 정보를 정중하고 경건한 태도로 제공해주세요. 가능한 경우 방문 팁과 역사적 배경도 포함해주세요.`,
      config: config,
    });

    return {
      text: response.text,
      grounding: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
    };
  } catch (error) {
    console.error("Gemini Error:", error);
    return {
      text: "죄송합니다. 성지 정보를 가져오는 중에 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
      grounding: []
    };
  }
};