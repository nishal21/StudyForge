import React, { useState, useRef, useEffect } from 'react';
import { Card } from './common/Card';
import { Button } from './common/Button';
import { Spinner } from './common/Spinner';
import { geminiService } from '../services/geminiService';
import { Note } from '../types';

type InputType = 'text' | 'camera' | 'voice';
type MobileView = 'list' | 'editor';

const CameraIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>;
const TypeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>;
const MicIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line></svg>;
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
const TagIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>;
const SearchIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>;
const BackIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>;


interface MyNotesProps {
  notes: Note[];
  activeNote: Note | null;
  setActiveNote: (note: Note | null) => void;
  onUpdateNote: (note: Note) => void;
  onDeleteNote: (noteId: string) => void;
}

export const MyNotes: React.FC<MyNotesProps> = ({ notes, activeNote, setActiveNote, onUpdateNote, onDeleteNote }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  
  const [inputType, setInputType] = useState<InputType>('text');
  const [isCapturing, setIsCapturing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isFlashing, setIsFlashing] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilterTag, setActiveFilterTag] = useState<string | null>(null);

  const [mobileView, setMobileView] = useState<MobileView>('list');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  
  useEffect(() => {
    setContent(activeNote?.content || '');
    setTags(activeNote?.tags || []);
    if(activeNote) {
      setMobileView('editor');
    } else {
      setMobileView('list');
    }
  }, [activeNote]);
  
  const triggerFlash = () => {
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 700);
  };

  const handleSetActiveNote = (note: Note | null) => {
    setActiveNote(note);
    if(note) {
      setMobileView('editor');
    }
  }

  const handleSummarize = async () => {
    if (!content.trim() || !activeNote) return;
    setIsLoading(true);
    const summary = await geminiService.summarizeText(content);
    onUpdateNote({ ...activeNote, content, summary, tags });
    setIsLoading(false);
  };
  
  const startCamera = async () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().then(() => {
                setIsCapturing(true);
            }).catch(err => {
                console.error("Failed to play camera stream:", err);
                alert("Could not start the camera. Please ensure permissions are granted and no other app is using it.");
                stopCamera();
            });
          };
        }
      } catch (error) {
        console.error("Error accessing camera:", error);
        alert("Could not access camera. Please check permissions.");
      }
    }
  };
  
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsCapturing(false);
    }
  };

  const handleCapture = async () => {
    if (!videoRef.current || !canvasRef.current || !activeNote) return;
    setIsLoading(true);
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    context?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
    const base64Image = canvas.toDataURL('image/jpeg').split(',')[1];
    
    stopCamera();

    const extractedText = await geminiService.extractTextFromImage(base64Image);
    const latestNote = notes.find(n => n.id === activeNote.id);
    if (latestNote) {
        const newContent = latestNote.content ? `${latestNote.content}\n\n${extractedText}` : extractedText;
        setContent(newContent);
        onUpdateNote({ ...latestNote, content: newContent });
        triggerFlash();
    }
    setIsLoading(false);
  };
  
  const startRecording = async () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(stream);
        audioChunksRef.current = [];
        mediaRecorderRef.current.ondataavailable = (event) => audioChunksRef.current.push(event.data);
        mediaRecorderRef.current.onstop = async () => {
          setIsLoading(true);
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = async () => {
            const base64Audio = (reader.result as string).split(',')[1];
            const transcribedText = await geminiService.transcribeAudio(base64Audio, audioBlob.type);
            
            const latestNote = notes.find(n => n.id === activeNote?.id);
            if (latestNote) {
                const newContent = latestNote.content ? `${latestNote.content}\n\n[Voice Note]:\n${transcribedText}` : `[Voice Note]:\n${transcribedText}`;
                setContent(newContent);
                onUpdateNote({ ...latestNote, content: newContent });
                triggerFlash();
            }
            setIsLoading(false);
          };
          stream.getTracks().forEach(track => track.stop());
        };
        mediaRecorderRef.current.start();
        setIsRecording(true);
      } catch (err) {
        console.error("Error accessing microphone:", err);
        alert("Could not access microphone. Please check permissions.");
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleTagInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim().toLowerCase())) {
        setTags([...tags, tagInput.trim().toLowerCase()]);
      }
      setTagInput('');
    }
  };
  
  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };
  
  const handleSave = () => {
    if (!activeNote) return;
    onUpdateNote({ ...activeNote, content, tags });
  };
  
  const handleCreateNewNote = () => {
    const newNote = {
        id: Date.now().toString(),
        content: '',
        summary: '',
        tags: [],
    };
    onUpdateNote(newNote);
    setActiveNote(newNote);
  };
  
  const allTags = [...new Set(notes.flatMap(n => n.tags))];

  const filteredNotes = notes.filter(note => {
    const searchMatch = searchTerm.toLowerCase() 
      ? note.content.toLowerCase().includes(searchTerm.toLowerCase()) || 
        note.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))
      : true;
    const tagMatch = activeFilterTag ? note.tags.includes(activeFilterTag) : true;
    return searchMatch && tagMatch;
  }).sort((a, b) => parseInt(b.id) - parseInt(a.id));

  const renderInputArea = () => {
    if (inputType === 'text') {
        return (
            <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onBlur={handleSave}
                className="w-full flex-grow bg-slate-900/70 text-slate-200 rounded-lg p-4 focus:ring-2 focus:ring-violet-500 transition border border-slate-700 resize-none"
                placeholder="Type your notes here..."
            />
        );
    }
    if (inputType === 'camera') {
        return (
            <div className="w-full flex-grow flex flex-col items-center justify-center bg-slate-900 rounded-lg border border-slate-700">
                <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-contain rounded-lg"
                    style={{ display: isCapturing ? 'block' : 'none' }}
                />
                {!isCapturing && <p className="text-slate-500">Camera is off</p>}
                <canvas ref={canvasRef} className="hidden"></canvas>
            </div>
        );
    }
    if (inputType === 'voice') {
        return (
            <div className="w-full flex-grow flex flex-col items-center justify-center bg-slate-900 rounded-lg border border-slate-700 text-center">
                {isRecording ? (
                    <div className="flex items-center gap-3">
                        <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span></span>
                        <p className="text-slate-300">Recording...</p>
                    </div>
                ) : <p className="text-slate-500">Ready to record your voice note.</p>}
            </div>
        );
    }
    return null;
  };

  const NoteList = (
    <Card className="w-full lg:w-80 lg:flex-shrink-0 flex flex-col h-full">
      <div className="p-4 border-b border-slate-700">
          <Button variant="primary" onClick={handleCreateNewNote} className="w-full hidden lg:inline-flex" leftIcon={<PlusIcon />}>New Note</Button>
          <div className="relative mt-4 lg:mt-4">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"/>
              <input 
                  type="text" 
                  placeholder="Search notes..." 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
              />
          </div>
      </div>
      <div className="p-4 border-b border-slate-700">
          <h3 className="text-xs font-semibold uppercase text-slate-400 mb-2">Filter by Tag</h3>
          <div className="flex flex-wrap gap-2">
              <button onClick={() => setActiveFilterTag(null)} className={`px-2 py-1 text-xs rounded-full transition ${!activeFilterTag ? 'bg-violet-500 text-white font-semibold' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>All</button>
              {allTags.map(tag => (
                  <button key={tag} onClick={() => setActiveFilterTag(tag)} className={`px-2 py-1 text-xs rounded-full transition ${activeFilterTag === tag ? 'bg-violet-500 text-white font-semibold' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>#{tag}</button>
              ))}
          </div>
      </div>
      <div className="flex-grow overflow-y-auto">
          {filteredNotes.length > 0 ? filteredNotes.map(note => {
              const title = note.content.split('\n')[0].trim() || 'Untitled Note';
              const isActive = activeNote?.id === note.id;
              return (
                  <button key={note.id} onClick={() => handleSetActiveNote(note)} className={`w-full text-left p-4 border-l-4 transition-colors ${isActive ? 'border-violet-500 bg-slate-700/50' : 'border-transparent hover:bg-slate-700/30'}`}>
                      <h3 className="font-semibold text-slate-100 truncate">{title}</h3>
                      <p className="text-xs text-slate-400 truncate mt-1">{new Date(parseInt(note.id)).toLocaleDateString()}</p>
                  </button>
              )
          }) : <p className="p-4 text-center text-sm text-slate-500">No notes found.</p>}
      </div>
    </Card>
  );

  const EditorView = (
    activeNote ? (
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
          <div className="flex flex-col gap-4 h-full">
              <div className="lg:hidden flex items-center mb-2">
                <Button variant="ghost" size="sm" onClick={() => setActiveNote(null)} className="mr-2">
                  <BackIcon/> Back to list
                </Button>
              </div>
              <Card className={`p-4 flex-grow flex flex-col ${isFlashing ? 'animate-flash' : ''}`}>
                  <div className="flex-grow flex flex-col">
                      {renderInputArea()}
                  </div>
              </Card>
               <Card className="p-4">
                  <div className="flex justify-between items-center">
                       <div className="flex items-center gap-2">
                          <Button variant={inputType === 'text' ? 'secondary' : 'ghost'} size="sm" onClick={() => setInputType('text')}><TypeIcon/></Button>
                          <Button variant={inputType === 'camera' ? 'secondary' : 'ghost'} size="sm" onClick={() => setInputType('camera')}><CameraIcon/></Button>
                          <Button variant={inputType === 'voice' ? 'secondary' : 'ghost'} size="sm" onClick={() => setInputType('voice')}><MicIcon/></Button>
                       </div>
                       <div className="flex items-center gap-2">
                           {inputType === 'camera' && (<> {!isCapturing ? <Button size="sm" onClick={startCamera}>Start Camera</Button> : <> <Button size="sm" onClick={handleCapture} disabled={isLoading}>{isLoading ? 'Processing...' : 'Capture'}</Button><Button size="sm" variant="secondary" onClick={stopCamera}>Stop</Button></>} </>)}
                           {inputType === 'voice' && (<> {!isRecording ? <Button size="sm" onClick={startRecording} disabled={isLoading}>Record</Button> : <Button size="sm" variant="danger" onClick={stopRecording}>Stop</Button>} </>)}
                       </div>
                  </div>
              </Card>
          </div>
          
          <div className="flex flex-col gap-6">
              <Card className="flex-1 flex flex-col">
                  <div className="p-4 border-b border-slate-700 flex justify-between items-center">
                      <h2 className="text-lg font-bold text-white">AI Summary</h2>
                      <Button onClick={handleSummarize} disabled={!content.trim() || isLoading || isRecording} size="sm">
                          {isLoading && !isCapturing ? <Spinner size="sm" className="mr-2"/> : null}
                          Generate
                      </Button>
                  </div>
                  <div className="p-4 flex-grow overflow-y-auto">
                      {isLoading && !isCapturing ? (
                          <div className="flex items-center justify-center h-full"><Spinner /></div>
                      ) : activeNote?.summary ? (
                          <div className="prose prose-sm prose-invert max-w-none text-slate-300" dangerouslySetInnerHTML={{ __html: activeNote.summary.replace(/\n/g, '<br/>') }} />
                      ) : (
                          <div className="text-center text-slate-500 h-full flex items-center justify-center">
                              <p>Click "Generate" to create a summary.</p>
                          </div>
                      )}
                  </div>
              </Card>
              <Card className="p-4">
                  <div className="flex justify-between items-center">
                      <h3 className="text-sm font-semibold uppercase text-slate-400 flex items-center gap-2"><TagIcon /> Tags</h3>
                       <Button variant="danger" size="sm" onClick={() => onDeleteNote(activeNote.id)}><TrashIcon/></Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                      {tags.map(tag => (
                          <div key={tag} className="flex items-center gap-1 bg-slate-700 text-slate-200 px-2 py-1 rounded-full text-xs">
                              <span>{tag}</span>
                              <button onClick={() => removeTag(tag)} className="text-slate-400 hover:text-white">×</button>
                          </div>
                      ))}
                  </div>
                  <input 
                      type="text" 
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleTagInput}
                      onBlur={handleSave}
                      placeholder="Add a tag and press Enter"
                      className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-sm mt-3 focus:ring-2 focus:ring-violet-500"
                  />
              </Card>
          </div>
      </div>
    ) : (
      <div className="hidden lg:flex flex-1 items-center justify-center text-center">
          <div>
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-slate-800 text-violet-400 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536L16.732 3.732z" /></svg>
              </div>
              <h2 className="text-2xl font-bold text-white">Select or Create a Note</h2>
              <p className="mt-2 text-slate-400">Choose a note from the left panel or click "New Note" to start.</p>
          </div>
      </div>
    )
  );

  return (
    <div className="h-full flex flex-row gap-6 p-4 md:p-6 bg-slate-950/30">
      {/* Desktop view */}
      <div className="hidden lg:flex h-full w-full gap-6">
        {NoteList}
        {EditorView}
      </div>
      
      {/* Mobile view */}
      <div className="lg:hidden w-full h-full">
        {mobileView === 'list' && !activeNote ? NoteList : EditorView}
      </div>
      
      <Button variant="primary" onClick={handleCreateNewNote} className="lg:hidden fixed bottom-6 right-6 !rounded-full !p-4 shadow-lg shadow-violet-500/50 z-20" leftIcon={<PlusIcon />}>
        <span className="sr-only">New Note</span>
      </Button>
    </div>
  );
};
