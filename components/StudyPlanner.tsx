import React, { useState } from 'react';
import { Card } from './common/Card';
import { Button } from './common/Button';
import { Spinner } from './common/Spinner';
import { geminiService } from '../services/geminiService';
import { StudyPlan, StudyTask } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';

const TaskIcon: React.FC<{type: StudyTask['type']}> = ({ type }) => {
    const icons = {
        Read: '📖',
        Watch: '💻',
        Practice: '✍️',
        Review: '🧠',
        Quiz: '❓',
    };
    return <span className="text-lg mr-3">{icons[type] || '📌'}</span>;
};


export const StudyPlanner: React.FC = () => {
    const [topic, setTopic] = useState('');
    const [duration, setDuration] = useState('1 week');
    const [goals, setGoals] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const [isCreatingNew, setIsCreatingNew] = useState(false);
    
    const [plan, setPlan] = useLocalStorage<StudyPlan | null>('studyforge_study_plan', null);
    const [checkedTasks, setCheckedTasks] = useLocalStorage<string[]>('studyforge_checked_tasks', []);

    const handleGeneratePlan = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!topic.trim()) return;

        if (plan && isCreatingNew) {
            if (!window.confirm("This will replace your current study plan and reset all progress. Are you sure you want to continue?")) {
                return;
            }
        }

        setIsLoading(true);
        setError(null);

        const generatedPlan = await geminiService.generateStudyPlan(topic, duration, goals);
        
        if (generatedPlan) {
            setPlan(generatedPlan);
            setCheckedTasks([]); 
            setIsCreatingNew(false);
        } else {
            setError("Sorry, I couldn't generate a study plan. Please try refining your topic or try again later.");
        }
        setIsLoading(false);
    };

    const toggleTask = (period: string, taskDescription: string) => {
        const taskId = `${period}-${taskDescription}`;
        setCheckedTasks(prev => {
            if (prev.includes(taskId)) {
                return prev.filter(id => id !== taskId);
            } else {
                return [...prev, taskId];
            }
        });
    };
    
    const handleStartCreateNewPlan = () => {
        setIsCreatingNew(true);
        setTopic(plan?.planTitle || '');
        setDuration('1 week');
        setGoals('');
    };

    const renderForm = () => (
        <Card className="w-full max-w-2xl mx-auto">
            <form onSubmit={handleGeneratePlan}>
                <div className="p-6 md:p-8 space-y-6">
                    <div className="text-center">
                        <h1 className="text-3xl font-bold text-white">AI Study Planner</h1>
                        <p className="mt-2 text-slate-400">Tell me what you need to learn, and I'll create a custom study plan for you.</p>
                    </div>
                    <div>
                        <label htmlFor="topic" className="block text-sm font-medium text-slate-300">Topic or Subject</label>
                        <input type="text" id="topic" value={topic} onChange={e => setTopic(e.target.value)} required placeholder="e.g., 'React.js for Beginners' or 'World War II'" className="mt-1 w-full bg-slate-700/80 border-slate-600 text-slate-200 focus:border-violet-500 focus:ring-violet-500 rounded-lg" />
                    </div>
                    <div>
                        <label htmlFor="duration" className="block text-sm font-medium text-slate-300">How long do you have?</label>
                        <input type="text" id="duration" value={duration} onChange={e => setDuration(e.target.value)} placeholder="e.g., '2 weeks' or 'this weekend'" className="mt-1 w-full bg-slate-700/80 border-slate-600 text-slate-200 focus:border-violet-500 focus:ring-violet-500 rounded-lg" />
                    </div>
                    <div>
                        <label htmlFor="goals" className="block text-sm font-medium text-slate-300">Learning Goals (optional)</label>
                        <textarea id="goals" value={goals} onChange={e => setGoals(e.target.value)} rows={3} placeholder="e.g., 'Build a simple app', 'Understand key concepts for my exam'" className="mt-1 w-full bg-slate-700/80 border-slate-600 text-slate-200 focus:border-violet-500 focus:ring-violet-500 rounded-lg resize-none" />
                    </div>
                </div>
                <div className="bg-slate-800/50 px-6 py-4 flex items-center justify-end gap-4 rounded-b-2xl">
                    {isCreatingNew && (
                        <Button type="button" variant="secondary" onClick={() => setIsCreatingNew(false)}>
                            Cancel
                        </Button>
                    )}
                    <Button type="submit" disabled={isLoading || !topic.trim()}>
                        {isLoading ? <><Spinner size="sm" className="mr-2" /> Generating...</> : (plan && isCreatingNew) ? "Replace Plan" : "Create My Plan"}
                    </Button>
                </div>
            </form>
        </Card>
    );

    const renderPlan = () => {
        if (!plan) return null;
        const totalTasks = plan.schedule.reduce((acc, day) => acc + day.tasks.length, 0);
        const completedTasks = checkedTasks.length;
        const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

        return (
            <div className="w-full max-w-4xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <h1 className="text-3xl font-bold text-white">{plan.planTitle}</h1>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <Button variant="ghost" size="sm" onClick={() => { if(window.confirm('Are you sure you want to reset your progress on this plan? This action cannot be undone.')) setCheckedTasks([]); }}>Reset Progress</Button>
                        <Button variant="secondary" onClick={handleStartCreateNewPlan}>New Plan</Button>
                    </div>
                </div>
                
                <Card className="p-4 mb-6">
                    <h3 className="font-semibold text-slate-300">Progress</h3>
                    <div className="w-full bg-slate-700 rounded-full h-4 mt-2">
                        <div className="bg-gradient-to-r from-violet-500 to-cyan-500 h-4 rounded-full flex items-center justify-end pr-2" style={{ width: `${progress}%`, transition: 'width 0.5s ease-in-out' }}>
                           <span className="text-xs font-bold text-white">{Math.round(progress)}%</span>
                        </div>
                    </div>
                </Card>

                <div className="space-y-6">
                    {plan.schedule.map((day, dayIndex) => (
                        <Card key={dayIndex} className="p-4 md:p-6">
                            <h2 className="text-xl font-bold text-violet-400 mb-2">{day.period}</h2>
                            <div className="mb-4">
                                <h3 className="font-semibold text-slate-300">Topics:</h3>
                                <p className="text-slate-400 text-sm">{day.topics.join(', ')}</p>
                            </div>
                            <div className="space-y-3">
                                {day.tasks.map((task, taskIndex) => {
                                    const taskId = `${day.period}-${task.description}`;
                                    const isChecked = checkedTasks.includes(taskId);
                                    return (
                                        <div key={taskIndex} onClick={() => toggleTask(day.period, task.description)}
                                            className={`flex items-center p-3 rounded-lg cursor-pointer transition-all duration-200 ${isChecked ? 'bg-slate-700/50 text-slate-500 line-through' : 'bg-slate-800 hover:bg-slate-700/80'}`}>
                                            <TaskIcon type={task.type as StudyTask['type']} />
                                            <span className="flex-1">{task.description}</span>
                                            <div className={`w-5 h-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center ml-4 ${isChecked ? 'bg-violet-500 border-violet-500' : 'border-slate-600'}`}>
                                                {isChecked && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto p-4 md:p-6 bg-slate-950/30 flex items-start justify-center">
            {isLoading && <div className="mt-20"><Spinner size="lg" /></div>}
            {error && <Card className="w-full max-w-md mx-auto p-8 text-center"><p className="text-red-400">{error}</p><Button onClick={() => setError(null)} className="mt-4">Try Again</Button></Card>}
            {!isLoading && !error && (!plan || isCreatingNew) && renderForm()}
            {!isLoading && !error && plan && !isCreatingNew && renderPlan()}
        </div>
    );
};