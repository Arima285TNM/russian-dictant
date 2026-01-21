
import { GoogleGenAI, Type } from "@google/genai";
import { Lesson, DialogLine, Question, QuizSet } from "../types";

export interface DictionaryResult {
    meaning: string;
    partOfSpeech: string;
    cases?: {
        nom: string;
        gen: string;
        dat: string;
        acc: string;
        ins: string;
        pre: string;
    };
}

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

const REPO_OWNER = "Arima285TNM";
const REPO_NAME = "text";
const API_URL = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/`;

export const getAllLessons = async (category: 'dialogue' | 'passage'): Promise<{id: string, title: string, description: string}[]> => {
  try {
    const response = await fetch(`${API_URL}${category}`);
    if (!response.ok) throw new Error("Failed to fetch repo contents");
    
    const items = await response.json();
    
    return items
      .filter((item: any) => item.type === 'dir' || item.name.endsWith('.json'))
      .map((item: any) => {
        const id = item.name.replace('.json', '');
        const prefix = category === 'dialogue' ? 'Hội thoại' : 'Văn bản';
        return {
          id: `${category}/${id}`,
          title: `${prefix} ${id}`,
          description: `Luyện ${category === 'dialogue' ? 'nghe chính tả' : 'đọc hiểu'} bài số ${id}`
        };
      })
      .sort((a: any, b: any) => a.id.localeCompare(b.id, undefined, {numeric: true}));
  } catch (e) {
    console.error("Error listing lessons", e);
    return [];
  }
};

export const fetchLessonText = async (lessonPath: string): Promise<Lesson | null> => {
    try {
        // Thử fetch trực tiếp path. Nếu 404, thử thêm .json (đối với các file dialogue lẻ)
        let response = await fetch(`${API_URL}${lessonPath}`);
        if (!response.ok) {
            response = await fetch(`${API_URL}${lessonPath}.json`);
        }
        
        if (!response.ok) throw new Error("Không thể truy cập dữ liệu bài học trên GitHub");

        const dataInfo = await response.json();
        let contentData: any = null;
        let quizzes: QuizSet[] = [];

        // Trường hợp 1: dataInfo là một mảng (Thư mục - Thường dành cho Passage/Reading)
        if (Array.isArray(dataInfo)) {
            const contentFile = dataInfo.find(f => f.name.includes('content') && f.name.endsWith('.json'));
            if (!contentFile) throw new Error("Thư mục không chứa file content.json");

            const contentRes = await fetch(contentFile.download_url);
            contentData = await contentRes.json();

            // Tìm tệp câu hỏi (Easy, Medium, Hard)
            const quizFiles = dataInfo.filter(f => f.name.includes('quiz') && f.name.endsWith('.json'));
            for (const qFile of quizFiles) {
                try {
                    const qRes = await fetch(qFile.download_url);
                    const qData = await qRes.json();
                    let difficulty: 'Easy' | 'Medium' | 'Hard' = 'Easy';
                    if (qFile.name.toLowerCase().includes('medium')) difficulty = 'Medium';
                    if (qFile.name.toLowerCase().includes('hard')) difficulty = 'Hard';
                    
                    const questions = Array.isArray(qData) ? qData : (qData.questions || []);
                    if (questions.length > 0) quizzes.push({ difficulty, questions });
                } catch (err) {
                    console.warn("Lỗi tải quiz:", err);
                }
            }
        } 
        // Trường hợp 2: dataInfo là một đối tượng (Tệp đơn lẻ - Thường dành cho Dialogue/Dictation)
        else if (dataInfo.download_url) {
            const contentRes = await fetch(dataInfo.download_url);
            contentData = await contentRes.json();
        }

        if (!contentData) throw new Error("Không thể tải nội dung bài học");

        // PHÂN LOẠI: Nếu có fullText -> READING. Nếu không, kiểm tra cấu trúc mảng -> DICTATION
        if (contentData.fullText || lessonPath.startsWith('passage')) {
            const wordMeanings: Record<string, string> = {};
            if (Array.isArray(contentData.words)) {
                contentData.words.forEach((w: any) => {
                    const cleanKey = w.word.toLowerCase().replace(/[.,!?;:«»""\(\)\[\]]/g, '').trim();
                    wordMeanings[cleanKey] = w.translation;
                });
            }

            return {
                id: lessonPath,
                type: 'READING',
                fullText: contentData.fullText || "",
                quizzes: quizzes.sort((a, b) => {
                    const order = { 'Easy': 1, 'Medium': 2, 'Hard': 3 };
                    return order[a.difficulty] - order[b.difficulty];
                }),
                wordMeanings: wordMeanings
            };
        }

        // Xử lý DICTATION (Dữ liệu hội thoại)
        // Lưu ý: data.json của bạn có thể chứa nhiều bài học dưới dạng { "001": [...], "002": [...] }
        // Hoặc một tệp chỉ chứa mảng các dòng hội thoại trực tiếp.
        let linesRaw = Array.isArray(contentData) ? contentData : null;
        if (!linesRaw) {
            // Thử tìm mảng đầu tiên trong object (ví dụ keys "001", "data", "lines"...)
            const firstArrayKey = Object.keys(contentData).find(key => Array.isArray(contentData[key]));
            if (firstArrayKey) linesRaw = contentData[firstArrayKey];
        }

        if (!linesRaw) throw new Error("Định dạng tệp hội thoại không hợp lệ");

        const lines: DialogLine[] = linesRaw.map((item: any) => ({
            speaker: item.speaker || "Người nói",
            text: item.text || "",
            audioData: item.audioBase64 || item.audioData || "",
            wordMeanings: item.wordMeanings || {}
        }));

        return { id: lessonPath, type: 'DICTATION', lines };

    } catch (e) {
        console.error(`Error processing lesson ${lessonPath}:`, e);
        return null;
    }
};

export const lookupWord = async (word: string): Promise<DictionaryResult | null> => {
    if (!word.trim()) return null;
    const ai = getAI();
    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `Tra từ tiếng Nga: "${word}". Trả về nghĩa tiếng Việt và 6 cách. Trả về JSON.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        meaning: { type: Type.STRING },
                        partOfSpeech: { type: Type.STRING },
                        cases: {
                            type: Type.OBJECT,
                            properties: {
                                nom: { type: Type.STRING }, gen: { type: Type.STRING }, dat: { type: Type.STRING },
                                acc: { type: Type.STRING }, ins: { type: Type.STRING }, pre: { type: Type.STRING }
                            }
                        }
                    },
                    required: ["meaning", "partOfSpeech"]
                }
            }
        });
        const text = response.text;
        return text ? JSON.parse(text) : null;
    } catch { return null; }
};
