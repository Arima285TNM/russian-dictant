
import { GoogleGenAI, Modality, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { Lesson, DialogLine, LessonCategory } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

const audioCache = new Map<string, string>();
let lessonsDataCache: Record<string, DialogLine[]> | null = null;

const getVoiceForSpeaker = (speaker: string): string => {
  const lowerCaseSpeaker = speaker.toLowerCase().trim();
  const maleNames = ['ivan', 'pavel', 'barista', 'dmitry', 'alexander', 'sergei', 'maxim', 'artem', 'boris', 'anton', 'victor', 'олег', 'oleg', 'мужчина', 'папа', 'прохожий', 'продавец', 'геннадий', 'алексей', 'пьер', 'василий', 'виктор', 'лев', 'валентин', 'дмитрий', 'артур', 'саша', 'михаил', 'слава', 'кирилл', 'игорь', 'костя', 'антон', 'вадим', 'филипп', 'иван', 'арсен', 'семён', 'егорь', 'руслан', 'тимофей'];
  if (maleNames.some(name => lowerCaseSpeaker.includes(name))) {
    return 'Puck'; 
  }
  return 'Kore'; 
};

export const generateRussianSpeech = async (text: string, speaker: string): Promise<string> => {
  const cacheKey = `${speaker}:${text}`;
  if (audioCache.has(cacheKey)) return audioCache.get(cacheKey)!;

  try {
    const voice = getVoiceForSpeaker(speaker);
    const prompt = `Read this Russian text: "${text}"`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice },
          },
        },
        safetySettings: [
            { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        ],
      },
    });
    
    const candidate = response.candidates?.[0];
    const audioPart = candidate?.content?.parts?.find(part => part.inlineData);
    
    if (audioPart && audioPart.inlineData) {
      const audioData = audioPart.inlineData.data;
      audioCache.set(cacheKey, audioData);
      return audioData;
    }
    throw new Error(`TTS Failed: ${candidate?.finishReason}`);
  } catch (error) {
    console.error("Speech Generation Error:", error);
    throw error;
  }
};

const loadLessonsFromLocal = async (): Promise<Record<string, DialogLine[]>> => {
    if (lessonsDataCache) return lessonsDataCache;
    try {
        const response = await fetch('./data.json');
        if (response.ok) {
            const data = await response.json();
            lessonsDataCache = data;
            return data;
        }
    } catch (e) {
        console.warn("Could not load data.json locally, checking fallback paths...");
    }
    return {};
};

export const getLessonCategories = async (): Promise<LessonCategory[]> => {
  const createCategoryLessons = (start: number, end: number) => {
    const lessons = [];
    for (let i = start; i <= end; i++) {
        const id = String(i).padStart(3, '0');
        lessons.push({
            id: id,
            title: `Bài ${id}`,
            description: `Hội thoại tiếng Nga bài số ${i}`,
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
    const allData = await loadLessonsFromLocal();
    const cleanId = String(lessonId).padStart(3, '0');
    
    if (allData[cleanId]) {
        return { id: lessonId, lines: allData[cleanId] };
    }

    return {
        id: lessonId,
        lines: [{ 
            speaker: "System", 
            text: `Dữ liệu cho bài ${lessonId} chưa có trong file data.json.` 
        }]
    };
};
