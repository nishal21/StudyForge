export enum View {
  Dashboard = 'DASHBOARD',
  Notes = 'NOTES',
  Flashcards = 'FLASHCARDS',
  Planner = 'PLANNER',
  Study = 'STUDY',
  Ask = 'ASK'
}

export interface Note {
  id: string;
  content: string;
  summary: string;
  tags: string[];
}

export interface Flashcard {
  question: string;
  answer: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
}

export interface GroundingSource {
    web: {
        uri: string;
        title: string;
    }
}

export interface ChatMessage {
    sender: 'user' | 'ai';
    text: string;
    sources?: GroundingSource[];
}

export interface SessionLog {
    id: string;
    date: string;
    duration: number; // in minutes
}

export interface StudyPlan {
    planTitle: string;
    schedule: StudyDay[];
}

export interface StudyDay {
    period: string;
    topics: string[];
    tasks: StudyTask[];
}

export interface StudyTask {
    description: string;
    type: 'Read' | 'Watch' | 'Practice' | 'Review' | 'Quiz';
}