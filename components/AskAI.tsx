import React, { useState, useEffect, useRef } from 'react';
import { Card } from './common/Card';
import { Button } from './common/Button';
import { Spinner } from './common/Spinner';
import { ChatMessage, GroundingSource } from '../types';
import { geminiService } from '../services/geminiService';
import type { Chat } from '@google/genai';

interface AskAIProps {
    chatHistory: ChatMessage[];
    setChatHistory: (messages: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => void;
}

const SendIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>;
const GlobeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>;


const PROMPT_STARTERS = [
    "Explain quantum computing simply",
    "Summarize the plot of 'Hamlet'",
    "Create a 3-step study plan for a history test",
];

export const AskAI: React.FC<AskAIProps> = ({ chatHistory, setChatHistory }) => {
    const [chat, setChat] = useState<Chat | null>(null);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [useSearch, setUseSearch] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        try {
            const newChat = geminiService.createChat();
            setChat(newChat);
            if (chatHistory.length === 0) {
                 setChatHistory([{
                    sender: 'ai',
                    text: "Hello! I'm your AI study assistant. Ask me anything about your subjects."
                }]);
            }
        } catch (error) {
             setChatHistory([{
                sender: 'ai',
                text: "There was an error initializing the chat. The AI service may be unavailable. Please try again later."
            }]);
            console.error(error);
        }
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [chatHistory]);

    const handleSend = async (prompt?: string) => {
        const messageText = prompt || input;
        if (!messageText.trim() || isLoading || !chat) return;

        const userMessage: ChatMessage = { sender: 'user', text: messageText };
        setChatHistory(prev => [...prev, userMessage]);
        
        if (!prompt) setInput('');
        setIsLoading(true);

        try {
            const config = useSearch ? { tools: [{ googleSearch: {} }] } : {};
            const result = await chat.sendMessageStream({ message: messageText, config });

            let aiResponseText = "";
            let rawSources: any[] = [];
            let firstChunk = true;

            for await (const chunk of result) {
                aiResponseText += chunk.text;
                if (firstChunk) {
                    setChatHistory((prev) => [...prev, { sender: 'ai', text: aiResponseText }]);
                    firstChunk = false;
                } else {
                     setChatHistory((prev) => {
                        const updatedMessages = [...prev];
                        const lastMessage = updatedMessages[updatedMessages.length - 1];
                        if (lastMessage.sender === 'ai') {
                            lastMessage.text = aiResponseText;
                        }
                        return updatedMessages;
                    });
                }
                const newSources = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks;
                if (newSources) {
                    rawSources.push(...newSources);
                }
            }

            // Update final message with all sources
            setChatHistory((prev) => {
                const updatedMessages = [...prev];
                const lastMessage = updatedMessages[updatedMessages.length - 1];
                if (lastMessage.sender === 'ai') {
                    const validSources: GroundingSource[] = rawSources
                        .filter(s => s?.web?.uri)
                        .map(s => ({
                            web: {
                                uri: s.web.uri,
                                title: s.web.title || s.web.uri,
                            }
                        }));
                    
                    const uniqueSources = Array.from(new Map(validSources.map(s => [s.web.uri, s])).values());
                    lastMessage.sources = uniqueSources;
                }
                return updatedMessages;
            });

        } catch (error) {
            console.error("Error sending message:", error);
            setChatHistory((prev) => [...prev, { sender: 'ai', text: "Sorry, I encountered an error. Please try again." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="h-full flex items-center justify-center p-4 md:p-6 bg-slate-950/30">
            <Card className="w-full max-w-3xl h-full flex flex-col">
                <div className="flex-grow p-4 overflow-y-auto space-y-4">
                    {chatHistory.map((msg, index) => (
                        <div key={index}>
                            <div className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                {msg.sender === 'ai' && <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex-shrink-0 shadow-lg"></div>}
                                <div className={`max-w-xl p-3 rounded-xl ${msg.sender === 'user' ? 'bg-violet-600 text-white' : 'bg-slate-700/80 text-slate-200'}`}>
                                   <div className="prose prose-sm prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n/g, '<br />')}} />
                                </div>
                            </div>
                             {msg.sender === 'ai' && msg.sources && msg.sources.length > 0 && (
                                <div className="max-w-xl ml-11 mt-2">
                                    <h4 className="text-xs font-semibold text-slate-400 mb-1">Sources:</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {msg.sources.map((source, i) => (
                                            <a href={source.web.uri} target="_blank" rel="noopener noreferrer" key={i} className="text-xs text-violet-400 bg-slate-800 p-2 rounded-md hover:bg-slate-700 block truncate">
                                                <p className="font-semibold truncate">{source.web.title}</p>
                                                <p className="text-violet-600 truncate">{source.web.uri}</p>
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                    {isLoading && chatHistory[chatHistory.length-1].sender === 'user' && (
                         <div className="flex items-start gap-3 justify-start">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex-shrink-0"></div>
                            <div className="max-w-md p-3 rounded-xl bg-slate-700">
                                <Spinner size="sm" />
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <div className="p-4 border-t border-slate-700/80">
                     <div className="flex flex-wrap gap-2 mb-3">
                        {PROMPT_STARTERS.map(prompt => (
                            <Button key={prompt} size="sm" variant="secondary" onClick={() => handleSend(prompt)}>{prompt}</Button>
                        ))}
                    </div>
                    <div className="flex items-center gap-3">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                            placeholder={"Ask a question..."}
                            className="w-full bg-slate-700/80 border-slate-600 text-slate-200 focus:border-violet-500 focus:ring-violet-500 rounded-lg"
                            disabled={isLoading || !chat}
                        />
                        <Button onClick={() => handleSend()} disabled={isLoading || !input.trim() || !chat} className="!p-3">
                            <SendIcon />
                        </Button>
                    </div>
                     <div className="flex items-center justify-end mt-2">
                        <label htmlFor="use-search" className="flex items-center cursor-pointer">
                            <div className="relative">
                                <input type="checkbox" id="use-search" className="sr-only" checked={useSearch} onChange={() => setUseSearch(!useSearch)} />
                                <div className={`block w-10 h-6 rounded-full transition ${useSearch ? 'bg-violet-500' : 'bg-slate-600'}`}></div>
                                <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition ${useSearch ? 'translate-x-4' : ''}`}></div>
                            </div>
                            <div className="ml-3 text-xs text-slate-400 flex items-center gap-1.5"><GlobeIcon /> Search the web</div>
                        </label>
                    </div>
                </div>
            </Card>
        </div>
    );
};