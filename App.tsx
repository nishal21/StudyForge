import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { MobileHeader } from './components/MobileHeader';
import { Dashboard } from './components/Dashboard';
import { MyNotes } from './components/MyNotes';
import { Flashcards } from './components/Flashcards';
import { StudySessions } from './components/StudySessions';
import { AskAI } from './components/AskAI';
import { StudyPlanner } from './components/StudyPlanner';
import { LandingPage } from './components/LandingPage';
import { View, Note, SessionLog, ChatMessage } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';
import { initializeGemini, clearGemini } from './services/geminiService';
import { NAV_ITEMS } from './constants';

function App() {
  const [apiKey, setApiKey] = useLocalStorage<string | null>('studyforge_api_key', null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [activeView, setActiveView] = useState<View>(View.Dashboard);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // App-wide state managed with local storage
  const [notes, setNotes] = useLocalStorage<Note[]>('studyforge_notes', []);
  const [sessionLogs, setSessionLogs] = useLocalStorage<SessionLog[]>('studyforge_session_logs', []);
  const [chatHistory, setChatHistory] = useLocalStorage<ChatMessage[]>('studyforge_chat_history', []);

  const [activeNote, setActiveNote] = useState<Note | null>(null);
  
  useEffect(() => {
    if (apiKey) {
      const success = initializeGemini(apiKey);
      setIsInitialized(success);
      if(!success) {
        alert("Invalid API Key. Please enter a valid Google Gemini API key.");
        setApiKey(null);
      }
    } else {
      setIsInitialized(false);
    }
  }, [apiKey, setApiKey]);
  
  const handleApiKeySubmit = (key: string) => {
    setApiKey(key);
  };

  const handleApiKeyClear = () => {
    if (window.confirm("Are you sure you want to reset your API key? You will be returned to the landing page.")) {
      clearGemini();
      // Directly remove from localStorage and reload for a guaranteed clean state.
      window.localStorage.removeItem('studyforge_api_key');
      window.location.reload();
    }
  };
  
  const handleResetData = () => {
    if (window.confirm(
        "Are you sure you want to reset all app data?\n\nThis will permanently delete:\n- All your notes\n- All study session logs\n- Your entire chat history\n- Your study plan and progress\n\nThis action cannot be undone."
      )) {
      window.localStorage.removeItem('studyforge_notes');
      window.localStorage.removeItem('studyforge_session_logs');
      window.localStorage.removeItem('studyforge_chat_history');
      window.localStorage.removeItem('studyforge_study_plan');
      window.localStorage.removeItem('studyforge_checked_tasks');
      window.location.reload();
    }
  };


  const handleUpdateNote = (updatedNote: Note) => {
    const existingIndex = notes.findIndex(n => n.id === updatedNote.id);
    if (existingIndex > -1) {
        const newNotes = [...notes];
        newNotes[existingIndex] = updatedNote;
        setNotes(newNotes);
    } else {
        setNotes([updatedNote, ...notes]);
    }
    setActiveNote(updatedNote);
  };

  const handleDeleteNote = (noteId: string) => {
    setNotes(notes.filter(n => n.id !== noteId));
    if (activeNote?.id === noteId) {
      setActiveNote(null);
    }
  };

  const handleSessionComplete = (duration: number) => {
    const newLog: SessionLog = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      duration,
    };
    setSessionLogs([newLog, ...sessionLogs]);
  };
  
  const handleDashboardAction = (action: 'newNote' | 'newSession') => {
    if (action === 'newNote') {
      setActiveView(View.Notes);
      const newNote = { id: Date.now().toString(), content: '', summary: '', tags: [] };
      handleUpdateNote(newNote);
      setActiveNote(newNote);
    } else {
      setActiveView(View.Study);
    }
  };

  const renderActiveView = () => {
    switch (activeView) {
      case View.Dashboard:
        return <Dashboard 
                  notes={notes}
                  sessionLogs={sessionLogs}
                  onQuickAction={handleDashboardAction}
               />;
      case View.Notes:
        return <MyNotes 
                  notes={notes}
                  activeNote={activeNote} 
                  setActiveNote={setActiveNote} 
                  onUpdateNote={handleUpdateNote}
                  onDeleteNote={handleDeleteNote}
               />;
      case View.Flashcards:
        return <Flashcards notes={notes} />;
      case View.Planner:
        return <StudyPlanner />;
      case View.Study:
        return <StudySessions onSessionComplete={handleSessionComplete} />;
      case View.Ask:
        return <AskAI chatHistory={chatHistory} setChatHistory={setChatHistory} />;
      default:
        return <Dashboard 
                  notes={notes}
                  sessionLogs={sessionLogs}
                  onQuickAction={handleDashboardAction}
               />;
    }
  };
  
  const currentViewName = NAV_ITEMS.find(item => item.id === activeView)?.label || 'Dashboard';

  if (!isInitialized) {
    return <LandingPage onApiKeySubmit={handleApiKeySubmit} />;
  }

  return (
    <div className="h-screen w-screen flex bg-slate-950 text-slate-100 font-sans">
      <Sidebar
        activeView={activeView}
        setActiveView={setActiveView}
        onApiKeyClear={handleApiKeyClear}
        onResetData={handleResetData}
        isOpen={isMenuOpen}
        setIsOpen={setIsMenuOpen}
      />
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <MobileHeader 
            title={currentViewName} 
            onMenuClick={() => setIsMenuOpen(true)}
        />
        <main className="flex-1 h-full overflow-y-auto">
            {renderActiveView()}
        </main>
      </div>
    </div>
  );
}

export default App;