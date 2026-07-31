import { GoogleGenAI } from "@google/genai";
import { HolySite } from "../types";
import { TourApiSpot } from "./tourApiService";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function askAIGuide(question: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: question,
      config: {
        systemInstruction: `당신은 한국 천주교 성지순례 가이드 '홀리(Holy)'입니다. 
사용자에게 한국의 천주교 성지, 역사, 순례 예절 등에 대해 친절하고 따뜻하게 설명해주세요.
답변은 한국어로 하며, 신자가 아닌 사람들도 이해하기 쉽게 감성적으로 전달해주세요.
만약 특정 성지에 대해 물어본다면 그 성지의 역사적 가치와 영성적 의미를 강조해주세요.`,
      },
    });
    return response.text;
  } catch (error) {
    console.error("AI Guide error:", error);
    return "죄송합니다. 현재 가이드 서비스를 이용할 수 없습니다. 잠시 후 다시 시도해주세요.";
  }
}

/**
 * "쉼표 순례길" 코스 카드용 짧은 소개 문구를 실시간으로 생성한다.
 * 성지 본문 소개글은 이미 잘 쓰여 있으므로 그대로 살리고, 이 함수는
 * "혼잡 관광지 → 이 성지"라는 그 순간의 페어링만 자연스러운 한 문장으로 이어붙인다.
 * 실패 시 null을 반환하며, 호출부는 courseMatchingService의 규칙 기반 subtitle로 대체한다.
 */
export async function generateCourseIntro(
  site: HolySite,
  attraction: TourApiSpot | null,
): Promise<string | null> {
  if (!attraction) return null;

  const prompt = `아래 정보를 참고해서, 관광객이 붐비는 "${attraction.title}"를 방문한 뒤 도보로 "${site.name}"까지 걸어가 보라고 권하는 한 문장을 한국어로 써줘.
- 성지 소개: ${site.description ?? ''}
- 감성 태그: ${site.emotionTag ?? ''}
조건: 1문장, 60자 이내, 광고 카피처럼 자연스럽고 담백하게. 설명체가 아니라 권유하는 말투로. 따옴표나 부가 설명 없이 문장 하나만 출력해.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: `당신은 '쉼표 순례길' 캠페인의 카피라이터입니다. 붐비는 관광지 옆에 숨은 성지를 감성적으로, 과장 없이 소개합니다.`,
      },
    });
    const text = response.text?.trim();
    return text || null;
  } catch (error) {
    console.error("Course intro generation error:", error);
    return null;
  }
}
