
import { GoogleGenAI, GenerateContentResponse, Type, Chat } from "@google/genai";

let ai: GoogleGenAI | null = null;

export const initializeGemini = (apiKey: string): boolean => {
  if (!apiKey) {
    console.error("API key is missing for Gemini initialization.");
    ai = null;
    return false;
  }
  try {
    ai = new GoogleGenAI({ apiKey });
    return true;
  } catch (error) {
    console.error("Failed to initialize Gemini AI:", error);
    ai = null;
    return false;
  }
};

export const clearGemini = () => {
  ai = null;
};

const getAi = () => {
  if (!ai) {
    throw new Error("Gemini AI not initialized. Please set the API key first.");
  }
  return ai;
};

const FLASHCARD_SCHEMA = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      question: { type: Type.STRING },
      answer: { type: Type.STRING },
    },
    required: ["question", "answer"],
  },
};

const QUIZ_SCHEMA = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        question: { type: Type.STRING },
        options: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
        correctAnswer: { type: Type.STRING },
      },
      required: ["question", "options", "correctAnswer"],
    },
};

const STUDY_PLAN_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    planTitle: { type: Type.STRING },
    schedule: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          period: { type: Type.STRING, description: "The time period for this part of the plan, e.g., 'Day 1' or 'Week 1'." },
          topics: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "A list of specific topics to cover in this period."
          },
          tasks: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                description: { type: Type.STRING, description: "A detailed description of the task." },
                type: { type: Type.STRING, description: "The type of task, e.g., 'Read', 'Watch', 'Practice', 'Review', 'Quiz'." }
              },
              required: ["description", "type"]
            }
          }
        },
        required: ["period", "topics", "tasks"]
      }
    }
  },
  required: ["planTitle", "schedule"]
};


export const geminiService = {
  summarizeText: async (text: string): Promise<string> => {
    try {
      const ai = getAi();
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Summarize the following notes concisely for a student. Focus on key concepts, definitions, and important facts. Format the output neatly using markdown:\n\n---\n\n${text}`,
      });
      return response.text;
    } catch (error) {
      console.error("Error summarizing text:", error);
      return "Sorry, I couldn't summarize the notes. Please try again.";
    }
  },

  extractTextFromImage: async (base64Image: string): Promise<string> => {
    try {
      const ai = getAi();
      const imagePart = {
        inlineData: {
          mimeType: 'image/jpeg',
          data: base64Image,
        },
      };
      const textPart = {
        text: 'Extract the handwritten text from this image. If the image is unclear, state that.'
      };
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, textPart] },
      });
      return response.text;
    } catch (error) {
        console.error("Error extracting text from image:", error);
        return "Sorry, I couldn't read the text from the image. Please try a clearer picture.";
    }
  },

  transcribeAudio: async (base64Audio: string, mimeType: string): Promise<string> => {
    try {
        const ai = getAi();
        const audioPart = {
            inlineData: {
                mimeType,
                data: base64Audio,
            },
        };
        const textPart = {
            text: "Transcribe the following audio recording of a student's notes accurately. If parts are unclear, indicate that."
        };
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [audioPart, textPart] },
        });
        return response.text;
    } catch (error) {
        console.error("Error transcribing audio:", error);
        return "Sorry, I couldn't process the audio. Please try again.";
    }
  },

  generateFlashcards: async (notes: string, options: { count: number, difficulty: string }): Promise<any> => {
    try {
        const ai = getAi();
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Based on these notes, generate ${options.count} flashcards. The difficulty should be '${options.difficulty}'. Each flashcard must be a clear question and a concise answer pair. Notes:\n\n${notes}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: FLASHCARD_SCHEMA,
            },
        });
        return JSON.parse(response.text);
    } catch (error) {
        console.error("Error generating flashcards:", error);
        return [];
    }
  },

  generateQuiz: async (notes: string, options: { count: number, difficulty: string }): Promise<any> => {
    try {
        const ai = getAi();
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Based on these notes, generate a multiple-choice quiz with ${options.count} questions. The difficulty should be '${options.difficulty}'. Each question must have 4 options, and one must be the correct answer. Notes:\n\n${notes}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: QUIZ_SCHEMA,
            },
        });
        return JSON.parse(response.text);
    } catch (error) {
        console.error("Error generating quiz:", error);
        return [];
    }
  },

  generateStudyPlan: async (topic: string, duration: string, goals: string): Promise<any> => {
    try {
        const ai = getAi();
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Create a detailed study plan for a student.
            - Topic: ${topic}
            - Timeframe: ${duration}
            - Learning Goals: ${goals}
            
            Break down the plan into logical periods (e.g., days or weeks). For each period, list the key topics to cover and suggest a mix of actionable tasks like reading specific chapters, watching videos, doing practice problems, and reviewing concepts.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: STUDY_PLAN_SCHEMA,
            },
        });
        return JSON.parse(response.text);
    } catch (error) {
        console.error("Error generating study plan:", error);
        return null;
    }
  },
  
  getStudyTip: async (): Promise<string> => {
    try {
      const ai = getAi();
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: 'Provide a concise, insightful, and actionable study tip for a university student. The tip should be a single paragraph.',
        config: {
            temperature: 0.8,
        }
      });
      return response.text;
    } catch (error) {
      console.error("Error getting study tip:", error);
      return "Could not fetch a study tip right now. Try to stay organized and take regular breaks!";
    }
  },

  createChat: (): Chat => {
    const ai = getAi();
    return ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction: 'You are a helpful and friendly AI study assistant for students. Answer questions clearly and concisely. If a question is outside academic topics, politely decline to answer. Use markdown for formatting when it improves clarity.'
        }
    });
  }
};
