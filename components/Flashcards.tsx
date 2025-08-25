import React, { useState } from 'react';
import { Card } from './common/Card';
import { Button } from './common/Button';
import { Spinner } from './common/Spinner';
import { Note, Flashcard, QuizQuestion } from '../types';
import { geminiService } from '../services/geminiService';

const FlipIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 2v6h6M21.5 22v-6h-6"/><path d="M22 11.5A10 10 0 0 0 3.5 12.5"/><path d="M2 12.5a10 10 0 0 0 18.5-1"/></svg>;
const ShuffleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 3 21 3 21 8"></polyline><line x1="4" y1="20" x2="21" y2="3"></line><polyline points="21 16 21 21 16 21"></polyline><line x1="15" y1="15" x2="21" y2="21"></line><line x1="4" y1="4" x2="9" y2="9"></line></svg>;
const ChevronLeftIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>;
const ChevronRightIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>;
const CheckCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-400"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;
const XCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>;
const SettingsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 0 2l-.15.08a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l-.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1 0-2l.15-.08a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>;

interface FlashcardsProps {
  notes: Note[];
}

type Step = 'select' | 'settings' | 'study';

export const Flashcards: React.FC<FlashcardsProps> = ({ notes }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<Step>('select');
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [quiz, setQuiz] = useState<QuizQuestion[]>([]);
  const [view, setView] = useState<'flashcards' | 'quiz'>('flashcards');
  const [selectedNoteIds, setSelectedNoteIds] = useState<Set<string>>(new Set());

  // Generation Settings
  const [itemCount, setItemCount] = useState(5);
  const [difficulty, setDifficulty] = useState('Medium');
  
  // Flashcard state
  const [currentCard, setCurrentCard] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  
  // Quiz state
  const [currentQuizQuestion, setCurrentQuizQuestion] = useState(0);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [isQuizComplete, setIsQuizComplete] = useState(false);

  const resetAll = () => {
    setStep('select');
    setSelectedNoteIds(new Set());
    setFlashcards([]);
    setQuiz([]);
    resetFlashcardState();
    resetQuizState();
  };

  const resetFlashcardState = () => {
    setCurrentCard(0);
    setIsFlipped(false);
  };

  const resetQuizState = () => {
    setCurrentQuizQuestion(0);
    setUserAnswers([]);
    setIsQuizComplete(false);
  };

  const handleGenerate = async () => {
    if (selectedNoteIds.size === 0) return;
    setIsLoading(true);

    const selectedNotes = notes.filter(note => selectedNoteIds.has(note.id));
    const combinedContent = selectedNotes.map(note => note.summary || note.content).filter(Boolean).join('\n\n---\n\n');

    if (!combinedContent.trim()) {
      setIsLoading(false);
      alert("Selected notes have no content to generate from.");
      return;
    }
    
    const options = { count: itemCount, difficulty };
    const [generatedFlashcards, generatedQuiz] = await Promise.all([
      geminiService.generateFlashcards(combinedContent, options),
      geminiService.generateQuiz(combinedContent, { ...options, count: Math.min(itemCount, 10)}) // Quizzes usually shorter
    ]);

    setFlashcards(generatedFlashcards || []);
    setQuiz(generatedQuiz || []);
    
    resetFlashcardState();
    resetQuizState();
    setIsLoading(false);
    setStep('study');
  };

  const handleToggleNoteSelection = (noteId: string) => {
    setSelectedNoteIds(prev => {
      const newSet = new Set(prev);
      newSet.has(noteId) ? newSet.delete(noteId) : newSet.add(noteId);
      return newSet;
    });
  };
  
  const handleShuffle = () => {
    setFlashcards(prev => [...prev].sort(() => Math.random() - 0.5));
    resetFlashcardState();
  };
  
  const handleQuizAnswer = (answer: string) => {
    const newAnswers = [...userAnswers, answer];
    setUserAnswers(newAnswers);
    if (currentQuizQuestion < quiz.length - 1) {
      setCurrentQuizQuestion(prev => prev + 1);
    } else {
      setIsQuizComplete(true);
    }
  };
  
  const calculateScore = () => quiz.reduce((score, question, index) => userAnswers[index] === question.correctAnswer ? score + 1 : score, 0);

  const renderNoteSelector = () => (
    <div className="p-4 md:p-6 flex flex-col h-full">
      <h3 className="text-xl font-bold text-white">1. Select Notes to Study</h3>
      <p className="mt-1 text-slate-400">Choose one or more notes to generate materials from.</p>
      <div className="mt-6 space-y-3 overflow-y-auto flex-grow">
        {notes.length > 0 ? notes.map(note => (
           <div key={note.id} onClick={() => handleToggleNoteSelection(note.id)} className={`p-4 rounded-lg border-2 flex items-center gap-4 cursor-pointer transition-all ${selectedNoteIds.has(note.id) ? 'bg-violet-900/50 border-violet-500 scale-[1.02]' : 'bg-slate-800/80 border-slate-700 hover:border-slate-600'}`}>
              <div className={`w-5 h-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center ${selectedNoteIds.has(note.id) ? 'bg-violet-500 border-violet-500' : 'border-slate-600'}`}>
                {selectedNoteIds.has(note.id) && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
              </div>
              <div>
                 <h4 className="font-semibold text-slate-100 truncate">{note.content.split('\n')[0] || 'Untitled Note'}</h4>
                 <p className="text-sm text-slate-400 truncate mt-1">{note.summary || note.content.substring(0, 100) || 'No content'}</p>
             </div>
           </div>
        )) : (
          <div className="text-center py-10"><p className="text-slate-500">Create some notes in "My Notes" first.</p></div>
        )}
      </div>
      <div className="pt-4 mt-4 border-t border-slate-700/60">
        <Button onClick={() => setStep('settings')} disabled={selectedNoteIds.size === 0} className="w-full">
            Next: Settings {selectedNoteIds.size > 0 && `(${selectedNoteIds.size} selected)`}
        </Button>
      </div>
    </div>
  );
  
  const renderSettings = () => (
    <div className="p-4 md:p-6 flex flex-col h-full">
      <h3 className="text-xl font-bold text-white flex items-center gap-2"><SettingsIcon /> 2. Generation Settings</h3>
      <div className="mt-6 space-y-6 flex-grow">
        <div>
          <label htmlFor="itemCount" className="block text-sm font-medium text-slate-300">Number of Items</label>
          <p className="text-xs text-slate-500 mb-2">How many flashcards/quiz questions? (Max 20)</p>
          <input type="range" id="itemCount" min="3" max="20" value={itemCount} onChange={e => setItemCount(parseInt(e.target.value))} className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-violet-500" />
          <div className="text-center mt-1 font-bold text-white">{itemCount}</div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300">Difficulty</label>
          <div className="grid grid-cols-3 gap-3 mt-2">
            {['Easy', 'Medium', 'Hard'].map(d => (
              <Button key={d} variant={difficulty === d ? 'primary' : 'secondary'} onClick={() => setDifficulty(d)}>{d}</Button>
            ))}
          </div>
        </div>
      </div>
      <div className="pt-4 mt-4 border-t border-slate-700/60 flex gap-4">
        <Button onClick={() => setStep('select')} variant="secondary" className="w-full">Back</Button>
        <Button onClick={handleGenerate} disabled={isLoading} className="w-full">
          {isLoading ? <Spinner size="sm" className="mr-2" /> : 'Generate with AI'}
        </Button>
      </div>
    </div>
  );

  const renderFlashcardView = () => (
    <div className="flex-grow flex flex-col items-center justify-center p-4 md:p-6 bg-slate-950/30 rounded-b-xl">
      {flashcards.length > 0 ? (
        <>
          <div className="w-full max-w-lg h-80 [perspective:1000px] cursor-pointer" onClick={() => setIsFlipped(!isFlipped)}>
            <div className={`relative w-full h-full transition-transform duration-700 [transform-style:preserve-3d] ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}>
              <div className="absolute w-full h-full [backface-visibility:hidden] flex flex-col items-center justify-center p-6 bg-gradient-to-br from-slate-700 to-slate-800 rounded-2xl shadow-lg border border-slate-600">
                <p className="text-xl md:text-2xl font-semibold text-center text-slate-100">{flashcards[currentCard].question}</p>
                <div className="absolute bottom-4 right-4 text-slate-500 flex items-center gap-1"><FlipIcon/> <span className="text-xs">Flip</span></div>
              </div>
              <div className="absolute w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)] flex flex-col items-center justify-center p-6 bg-gradient-to-br from-violet-900/80 to-cyan-900/80 rounded-2xl shadow-lg border border-violet-700">
                <p className="text-lg md:text-xl text-center text-violet-200">{flashcards[currentCard].answer}</p>
                 <div className="absolute bottom-4 right-4 text-violet-500 flex items-center gap-1"><FlipIcon/> <span className="text-xs">Flip</span></div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-6 mt-8">
            <Button variant="ghost" onClick={() => { setCurrentCard(p => Math.max(0, p - 1)); setIsFlipped(false); }} disabled={currentCard === 0} className="!p-3"><ChevronLeftIcon /></Button>
            <p className="text-slate-300 font-medium tabular-nums">{currentCard + 1} / {flashcards.length}</p>
            <Button variant="ghost" onClick={() => { setCurrentCard(p => Math.min(flashcards.length - 1, p + 1)); setIsFlipped(false); }} disabled={currentCard === flashcards.length - 1} className="!p-3"><ChevronRightIcon/></Button>
          </div>
           <Button onClick={handleShuffle} variant="secondary" leftIcon={<ShuffleIcon />} className="mt-6">Shuffle Deck</Button>
        </>
      ) : <p className="text-slate-500">No flashcards generated.</p>}
    </div>
  );

  const renderQuizView = () => {
    if (quiz.length === 0) return <div className="flex-grow flex items-center justify-center"><p className="text-slate-500">No quiz generated.</p></div>

    if (isQuizComplete) {
      const score = calculateScore();
      const scorePercentage = (score / quiz.length) * 100;
      return (
        <div className="flex-grow p-4 md:p-6 overflow-y-auto">
            <div className="max-w-3xl mx-auto text-center">
                <h3 className="text-2xl font-bold text-white">Quiz Complete!</h3>
                <div className="relative w-40 h-40 mx-auto my-6">
                    <svg className="w-full h-full" viewBox="0 0 100 100"><circle className="text-slate-700" strokeWidth="10" stroke="currentColor" fill="transparent" r="45" cx="50" cy="50" /><circle className="text-violet-500" strokeWidth="10" strokeDasharray={2 * Math.PI * 45} strokeDashoffset={2 * Math.PI * 45 * (1 - scorePercentage/100)} strokeLinecap="round" stroke="currentColor" fill="transparent" r="45" cx="50" cy="50" style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'stroke-dashoffset 1s ease-out' }}/></svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center"><span className="text-4xl font-bold text-slate-100">{score}</span><span className="text-lg text-slate-400">/ {quiz.length}</span></div>
                </div>
                <p className="text-lg text-slate-300">You scored {scorePercentage.toFixed(0)}%.</p>
                <Button onClick={resetQuizState} className="mt-6">Try Again</Button>
            </div>
            <div className="mt-10 space-y-6 max-w-3xl mx-auto">
                <h4 className="text-xl font-semibold text-left">Review Your Answers</h4>
                {quiz.map((q, index) => (
                    <div key={index} className="p-4 rounded-lg bg-slate-800/80 border border-slate-700">
                        <p className="font-semibold">{index + 1}. {q.question}</p>
                        <div className="mt-3 flex items-center gap-3 text-sm"><span className={`flex items-center gap-1.5 p-1.5 rounded-md ${userAnswers[index] === q.correctAnswer ? 'bg-green-900/50' : 'bg-red-900/50'}`}>{userAnswers[index] === q.correctAnswer ? <CheckCircleIcon/> : <XCircleIcon/>}<span className="font-medium">Your answer:</span>{userAnswers[index]}</span></div>
                        {userAnswers[index] !== q.correctAnswer && <div className="mt-2 flex items-center gap-3 text-sm"><span className="flex items-center gap-1.5 p-1.5 rounded-md bg-green-900/50"><CheckCircleIcon/><span className="font-medium">Correct answer:</span>{q.correctAnswer}</span></div>}
                    </div>
                ))}
            </div>
        </div>
      );
    }
    const question = quiz[currentQuizQuestion];
    const progress = ((currentQuizQuestion) / quiz.length) * 100;
    return (
        <div className="flex-grow flex flex-col p-4 md:p-6">
            <div className="w-full max-w-3xl mx-auto">
                <p className="text-sm font-semibold text-violet-400">Question {currentQuizQuestion + 1} of {quiz.length}</p>
                <div className="w-full bg-slate-700 rounded-full h-2 mt-2"><div className="bg-violet-500 h-2 rounded-full" style={{ width: `${progress}%`, transition: 'width 0.5s' }}></div></div>
            </div>
            <div className="flex-grow flex items-center justify-center">
                <div className="w-full max-w-3xl text-center">
                    <h3 className="text-xl md:text-2xl font-bold text-white mb-8">{question.question}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {question.options.map((option, index) => <button key={index} onClick={() => handleQuizAnswer(option)} className="p-4 w-full text-left text-lg rounded-xl border-2 border-slate-700 bg-slate-800 hover:border-violet-500 hover:bg-violet-900/50 hover:shadow-md transition duration-200 focus:outline-none focus:ring-2 focus:ring-violet-500">{option}</button>)}
                    </div>
                </div>
            </div>
        </div>
    );
  };
  
  const renderStudyView = () => (
    <>
        <div className="p-4 border-b border-slate-700/60 flex flex-col md:flex-row justify-between items-center gap-3">
            <div className="flex items-center gap-2 p-1 bg-slate-900/70 rounded-lg">
                <Button size="sm" variant={view === 'flashcards' ? 'primary' : 'secondary'} onClick={() => setView('flashcards')}>Flashcards</Button>
                <Button size="sm" variant={view === 'quiz' ? 'primary' : 'secondary'} onClick={() => setView('quiz')}>Quiz</Button>
            </div>
            <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={() => setStep('settings')} disabled={isLoading}>Regenerate</Button>
                <Button variant="secondary" size="sm" onClick={resetAll}>Change Notes</Button>
            </div>
        </div>
        {view === 'flashcards' ? renderFlashcardView() : renderQuizView()}
    </>
  );

  return (
    <div className="h-full flex flex-col p-4 md:p-6 bg-slate-950/30">
      <Card className="flex-1 flex flex-col">
        {isLoading && <div className="flex-grow flex items-center justify-center"><Spinner /></div>}
        {!isLoading && step === 'select' && renderNoteSelector()}
        {!isLoading && step === 'settings' && renderSettings()}
        {!isLoading && step === 'study' && renderStudyView()}
      </Card>
    </div>
  );
};