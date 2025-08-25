import React, { useState, useEffect } from 'react';
import { Card } from './common/Card';
import { Button } from './common/Button';
import { Note, SessionLog } from '../types';
import { ICONS } from '../constants';
import { geminiService } from '../services/geminiService';
import { Spinner } from './common/Spinner';

interface DashboardProps {
  notes: Note[];
  sessionLogs: SessionLog[];
  onQuickAction: (action: 'newNote' | 'newSession') => void;
}

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode }> = ({ title, value, icon }) => (
  <Card className="p-4 flex items-center gap-4">
    <div className="p-3 rounded-full bg-slate-700/80 text-violet-400">
        {icon}
    </div>
    <div>
        <p className="text-sm text-slate-400">{title}</p>
        <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  </Card>
);

interface DailyTip {
    tip: string;
    date: string;
}

const StudyTipCard = () => {
    const [tip, setTip] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchTip = async () => {
            setIsLoading(true);
            const todayStr = new Date().toISOString().split('T')[0];
            const storedTipData = window.localStorage.getItem('studyforge_daily_tip');

            if (storedTipData) {
                try {
                    const parsedData: DailyTip = JSON.parse(storedTipData);
                    if (parsedData.date === todayStr && parsedData.tip) {
                        setTip(parsedData.tip);
                        setIsLoading(false);
                        return;
                    }
                } catch (e) {
                    console.error("Failed to parse stored daily tip", e);
                    // If parsing fails, proceed to fetch a new tip
                }
            }
            
            // If we are here, we need a new tip
            const studyTip = await geminiService.getStudyTip();
            setTip(studyTip);
            
            const newTipData: DailyTip = { tip: studyTip, date: todayStr };
            window.localStorage.setItem('studyforge_daily_tip', JSON.stringify(newTipData));
            
            setIsLoading(false);
        };
        fetchTip();
    }, []); // Empty dependency array ensures this runs only once on component mount

    return (
        <Card className="p-6">
            <h2 className="text-xl font-bold text-white mb-4">💡 Study Tip of the Day</h2>
            {isLoading ? (
                <div className="flex justify-center items-center h-24">
                    <Spinner />
                </div>
            ) : (
                <p className="text-slate-300 italic">"{tip}"</p>
            )}
        </Card>
    );
};

export const Dashboard: React.FC<DashboardProps> = ({ notes, sessionLogs, onQuickAction }) => {
  const recentNotes = notes.slice(0, 3);
  const totalStudyMinutes = sessionLogs.reduce((acc, log) => acc + log.duration, 0);

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6 bg-slate-950/30 space-y-6">
        <h1 className="text-3xl font-bold text-white hidden lg:block">Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            <StatCard title="Total Notes" value={notes.length} icon={ICONS.NOTES} />
            <StatCard title="Study Sessions" value={sessionLogs.length} icon={ICONS.STUDY} />
            <StatCard title="Minutes Focused" value={totalStudyMinutes} icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/><path d="M12 12l4 4"/></svg>} />
            <Card className="p-4 flex flex-col justify-center gap-3">
                 <Button onClick={() => onQuickAction('newNote')} variant="primary" className="w-full">New Note</Button>
                 <Button onClick={() => onQuickAction('newSession')} variant="secondary" className="w-full">Start Session</Button>
            </Card>
        </div>
        
        <StudyTipCard />
        
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <Card className="p-6">
                <h2 className="text-xl font-bold text-white mb-4">Recent Notes</h2>
                <div className="space-y-3">
                    {recentNotes.length > 0 ? recentNotes.map(note => (
                        <div key={note.id} className="p-3 bg-slate-700/50 rounded-lg">
                            <h3 className="font-semibold text-slate-200 truncate">{note.content.split('\n')[0] || 'Untitled Note'}</h3>
                            <p className="text-sm text-slate-400 truncate mt-1">{note.summary || 'No summary yet.'}</p>
                        </div>
                    )) : (
                        <p className="text-slate-500">No notes yet. Create one!</p>
                    )}
                </div>
            </Card>
            <Card className="p-6">
                 <h2 className="text-xl font-bold text-white mb-4">Study History</h2>
                 <div className="space-y-3 max-h-60 overflow-y-auto">
                    {sessionLogs.length > 0 ? sessionLogs.map(log => (
                        <div key={log.id} className="p-3 bg-slate-700/50 rounded-lg flex justify-between items-center">
                            <div>
                               <p className="font-semibold text-slate-300">{log.duration} minute session</p>
                               <p className="text-xs text-slate-400">{new Date(log.date).toLocaleString()}</p>
                            </div>
                            <span className="text-sm font-bold text-violet-400">+{log.duration} min</span>
                        </div>
                    )) : (
                        <p className="text-slate-500">No study sessions logged yet.</p>
                    )}
                 </div>
            </Card>
        </div>
    </div>
  );
};