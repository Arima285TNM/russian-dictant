
import { GoogleGenAI, Modality } from "@google/genai";
// @ts-ignore
import { extractRawText } from "mammoth";
import { Lesson, DialogLine, LessonCategory } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

const audioCache = new Map<string, string>();

const getVoiceForSpeaker = (speaker: string): string => {
  const lowerCaseSpeaker = speaker.toLowerCase().trim();
  const maleNames = ['ivan', 'pavel', 'barista', 'dmitry', 'alexander', 'sergei', 'maxim', 'artem', 'boris', 'anton', 'victor', 'олег', 'oleg', 'мужчина', 'папа'];
  if (maleNames.some(name => lowerCaseSpeaker.includes(name))) {
    return 'Puck'; // Giọng nam
  }
  return 'Kore'; // Giọng nữ mặc định
};

export const generateRussianSpeech = async (text: string, speaker: string): Promise<string> => {
  const cacheKey = `${speaker}:${text}`;
  if (audioCache.has(cacheKey)) {
    return audioCache.get(cacheKey)!;
  }

  try {
    const voice = getVoiceForSpeaker(speaker);
    // Send just the text to the TTS model to avoid confusion with instructions
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice },
          },
        },
      },
    });
    
    const candidate = response.candidates?.[0];
    const audioPart = candidate?.content?.parts?.find(part => part.inlineData);
    
    if (audioPart && audioPart.inlineData) {
      const audioData = audioPart.inlineData.data;
      audioCache.set(cacheKey, audioData);
      return audioData;
    }
    
    const textPart = candidate?.content?.parts?.find(part => part.text);
    if (textPart && textPart.text) {
        throw new Error(`Model returned text instead of audio: ${textPart.text}`);
    }

    // Log full response for debugging if no content found
    console.error("Empty response from TTS model:", JSON.stringify(response, null, 2));
    throw new Error(`No audio generated. Finish reason: ${candidate?.finishReason || 'UNKNOWN'}`);
  } catch (error) {
    console.error("Speech Generation Error:", error);
    throw error;
  }
};

// --- GITHUB FETCHING LOGIC ---

const GITHUB_REPO_BASE = "https://raw.githubusercontent.com/Arima285TNM/dialog-text--/main";

const fetchFromGitHub = async (lessonId: string): Promise<DialogLine[]> => {
    // Xác định folder dựa trên ID bài học (Giả định folder 1-40)
    // Bạn có thể mở rộng logic này cho các folder khác như 41-80
    const idNum = parseInt(lessonId, 10);
    let folder = "1-40";
    if (idNum > 40 && idNum <= 80) folder = "41-80";
    
    // Tạo URL raw
    const url = `${GITHUB_REPO_BASE}/${folder}/${lessonId}.docx`;
    
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`GitHub fetch failed: ${response.status} ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    
    // Sử dụng mammoth để trích xuất text từ docx
    const result = await extractRawText({ arrayBuffer });
    const rawText = result.value;

    return parseDocxText(rawText);
};

const parseDocxText = (text: string): DialogLine[] => {
    const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
    const dialogLines: DialogLine[] = [];
    
    let currentSpeaker = "Unknown";

    for (const line of lines) {
        // Tìm pattern "Speaker: Content" hoặc "Speaker. Content"
        // Hỗ trợ tiếng Nga và ký tự Latin
        const match = line.match(/^([A-Za-zА-Яа-я0-9\s]+)[:.](.+)$/);
        
        if (match) {
            currentSpeaker = match[1].trim();
            const content = match[2].trim();
            if (content) {
                dialogLines.push({ speaker: currentSpeaker, text: content });
            }
        } else {
            // Nếu dòng không có tên người nói, gán vào người nói trước đó hoặc bỏ qua nếu là dòng rác
            // Ở đây ta giả định đó là nội dung tiếp theo của người nói hiện tại
            if (dialogLines.length > 0) {
                 dialogLines[dialogLines.length - 1].text += " " + line.trim();
            } else {
                // Dòng đầu tiên không có speaker, bỏ qua hoặc gán mặc định
            }
        }
    }
    
    return dialogLines;
};


// --- KHO DỮ LIỆU DỰ PHÒNG (FALLBACK) ---

const FALLBACK_REPOSITORY: Record<string, {lines: DialogLine[]}> = {
  "001": {
    lines: [
      { speaker: "Анна", text: "Привет!" },
      { speaker: "Иван", text: "Привет! Как тебя зовут?" },
      { speaker: "Анна", text: "Меня зовут Анна. А тебя?" },
      { speaker: "Иван", text: "Меня зовут Иван. Очень приятно." },
      { speaker: "Анна", text: "Мне тоже. Как дела?" },
      { speaker: "Иван", text: "Спасибо, хорошо. А у тебя?" },
      { speaker: "Анна", text: "Тоже неплохо." }
    ]
  }
};

export const getLessonCategories = async (): Promise<LessonCategory[]> => {
  const createCategoryLessons = (start: number, end: number) => {
    const lessons = [];
    for (let i = start; i <= end; i++) {
        const id = String(i).padStart(3, '0');
        lessons.push({
            id: id,
            title: `Bài ${id}`,
            description: `Bài học số ${id} từ GitHub`,
            disabled: false, 
        });
    }
    return lessons;
  };

  return [
    {
      id: "cat-1-40",
      title: "Thư mục 1-40",
      lessons: createCategoryLessons(1, 40)
    },
    {
      id: "cat-41-80",
      title: "Thư mục 41-80",
      lessons: createCategoryLessons(41, 80)
    },
  ];
};

export const fetchLessonText = async (lessonId: string): Promise<Lesson | null> => {
  try {
      console.log(`Fetching lesson ${lessonId} from GitHub...`);
      const lines = await fetchFromGitHub(lessonId);
      if (lines.length === 0) throw new Error("Parsed empty content");
      return { id: lessonId, lines };
  } catch (error) {
      console.warn(`Failed to fetch from GitHub for lesson ${lessonId}, checking fallback...`, error);
      
      const fallback = FALLBACK_REPOSITORY[lessonId];
      if (fallback) {
          return { id: lessonId, lines: JSON.parse(JSON.stringify(fallback.lines)) };
      }
      
      // Nếu lỗi, trả về một bài học mẫu thông báo lỗi để người dùng biết
      return {
          id: lessonId,
          lines: [{ speaker: "System", text: "Không tìm thấy file bài học trên GitHub hoặc lỗi tải file." }]
      };
  }
};
