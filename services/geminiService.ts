
import { GoogleGenAI } from "@google/genai";
import { Lesson, DialogLine, LessonCategory } from "../types";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

const REPO_OWNER = "Arima285TNM";
const REPO_NAME = "dialog-text";
const API_URL = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/`;
const RAW_URL_BASE = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/main/`;

export const translateText = async (text: string, isRuToVi: boolean): Promise<string> => {
  if (!text.trim()) return "";
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Bạn là một chuyên gia dịch thuật Nga-Việt. Hãy dịch câu sau từ ${isRuToVi ? "tiếng Nga sang tiếng Việt" : "tiếng Việt sang tiếng Nga"}: "${text}".
      Yêu cầu: Dịch ngắn gọn, tự nhiên, sát nghĩa nhất. Chỉ trả về kết quả dịch.`,
    });
    return response.text?.trim() || "Không thể dịch.";
  } catch (error) {
    console.error("Translation error:", error);
    return "Lỗi kết nối dịch thuật.";
  }
};

// Lấy danh sách bài học bằng cách liệt kê các file .json trong repo
export const getAllLessons = async (): Promise<{id: string, title: string, description: string}[]> => {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error("Failed to fetch repo contents");
    
    const files = await response.json();
    // Lọc lấy các file .json và không phải file data.json cũ (nếu có)
    return files
      .filter((file: any) => file.name.endsWith('.json') && file.name !== 'data.json' && file.name !== 'package.json' && file.name !== '1-40.json')
      .map((file: any) => {
        const id = file.name.replace('.json', '');
        return {
          id: id,
          title: `Bài học ${id}`,
          description: `Luyện nghe và viết chính tả bài hội thoại số ${id}`
        };
      })
      .sort((a: any, b: any) => a.id.localeCompare(b.id, undefined, {numeric: true}));
  } catch (e) {
    console.error("Error listing lessons from GitHub", e);
    return [];
  }
};

export const fetchLessonText = async (lessonId: string): Promise<Lesson | null> => {
    try {
        const response = await fetch(`${RAW_URL_BASE}${lessonId}.json`);
        if (!response.ok) throw new Error("Lesson file not found");
        
        const data = await response.json();
        
        // Hỗ trợ cả định dạng mảng trực tiếp hoặc định dạng object { "001": [...] }
        let linesRaw = Array.isArray(data) ? data : data[lessonId] || Object.values(data)[0];
        
        if (!Array.isArray(linesRaw)) return null;

        const lines: DialogLine[] = linesRaw.map((item: any) => ({
            speaker: item.speaker || "Người nói",
            text: item.text || "",
            audioData: item.audioBase64 || "" 
        }));
        
        return { id: lessonId, lines };
    } catch (e) {
        console.error(`Error fetching lesson ${lessonId}`, e);
        return null;
    }
};
