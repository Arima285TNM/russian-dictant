
import { GoogleGenAI } from "@google/genai";
import { Lesson, DialogLine, LessonCategory } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const DATA_URL = "https://raw.githubusercontent.com/Arima285TNM/dialog-text/main/1-40.json";

const RUSSIAN_TITLES = [
  "Вопросы", "Семья", "Знакомство", "Делаем уборку", "Идеальная девушка",
  "Готовим русские блины", "Распродажа", "Резервируем отель", "В ресторане", "В зоопарке",
  "Спорт", "Я тебя люблю", "В кино", "Мне так стыдно", "В книжном магазине",
  "Москва", "Как вылечить болезнь?", "Музыка", "Театр", "Изучаем иностранный язык",
  "Говорим о работе", "Потерялся!", "Говорим о фотоаппарате", "Пишем открытку", "Готовимся к экзамену",
  "Покупаем одежду", "В аптеке", "В кафе Петербурга", "Нервный пассажир", "Деловой договор",
  "Путешествуем на поезде", "Александр Пушкин", "Интервью с Кристиной: au pair", "Интервью с бабушкой – КГБ", "Интервью с Алиной – Владивосток",
  "Поговорим о праздниках", "Северодвинск, северное сияние, белые ночи", "Глаголы движения", "Идём к парикмахеру", "Какая религия лучше?"
];

let lessonsDataCache: Record<string, any[]> | null = null;

export const translateText = async (text: string, isRuToVi: boolean): Promise<string> => {
  if (!text.trim()) return "";
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

const loadLessonsFromRemote = async (): Promise<Record<string, any[]>> => {
    if (lessonsDataCache) return lessonsDataCache;
    try {
        const response = await fetch(DATA_URL);
        if (response.ok) {
            const data = await response.json();
            lessonsDataCache = data;
            return data;
        }
    } catch (e) {
        console.error("Could not load remote data.json", e);
    }
    return {};
};

export const getLessonCategories = async (): Promise<LessonCategory[]> => {
  const lessons = [];
  for (let i = 1; i <= 40; i++) {
      const id = String(i).padStart(3, '0');
      lessons.push({
          id: id,
          title: `Bài ${id}: ${RUSSIAN_TITLES[i-1]}`,
          description: `Luyện nghe và viết chính tả: ${RUSSIAN_TITLES[i-1]}`,
          disabled: false, 
      });
  }

  return [
    {
      id: "cat-1-40",
      title: "Hội thoại 1-40",
      lessons: lessons
    }
  ];
};

export const fetchLessonText = async (lessonId: string): Promise<Lesson | null> => {
    const allData = await loadLessonsFromRemote();
    const cleanId = String(lessonId).padStart(3, '0');
    
    if (allData[cleanId]) {
        const lines: DialogLine[] = allData[cleanId].map((item: any) => ({
            speaker: item.speaker || "Người nói",
            text: item.text || "",
            audioData: item.audioBase64 || "" 
        }));
        return { id: lessonId, lines };
    }

    return null;
};
