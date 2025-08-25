import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card } from './common/Card';
import { Button } from './common/Button';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface StudySessionsProps {
    onSessionComplete: (duration: number) => void;
}

const Presets = [
    { name: 'Pomodoro', work: 25, break: 5 },
    { name: 'Deep Work', work: 50, break: 10 },
];

const AMBIENT_SOUNDS = {
    Rain: [
        'https://www.youtube.com/watch?v=Qo4JIT8jMtI',
        'https://www.youtube.com/watch?v=eTeD8DAta4c',
        'https://www.youtube.com/watch?v=mPZkdNFkNps',
        'https://www.youtube.com/watch?v=6bPN0JyGfA4',
        'https://www.youtube.com/watch?v=biqyq0PTEUM'
    ],
    Cafe: [
        'https://www.youtube.com/watch?v=h2zkV-l_TbY',
        'https://www.youtube.com/watch?v=uiMXGIG_DQo',
        'https://www.youtube.com/watch?v=gaGrHUekGrc',
        'https://www.youtube.com/watch?v=QbXCfH7wyBQ',
        'https://www.youtube.com/watch?v=jAg6tyC9Xxc'
    ]
};
const AMBIENT_SOUND_PRESETS = ['None', 'Rain', 'Cafe'];

const MOTIVATIONAL_MESSAGES = {
  start: [
    "Let's get started! Focus and do your best.",
    "Time to dive in. You've got this!",
    "Okay, deep breath. Let's begin the work."
  ],
  break: [
    "Time for a quick break. Stretch your legs!",
    "You've earned this pause. Relax for a bit.",
    "Step away for a moment. You're doing great."
  ],
  end: [
    "Session complete! Awesome work.",
    "Great job! Take a well-deserved rest.",
    "Another session in the books. Fantastic effort!"
  ]
};

const getEmbedUrl = (url: string): { url: string; height: number } | null => {
    // Spotify
    const spotifyMatch = url.match(/https?:\/\/open\.spotify\.com\/(playlist|album)\/([a-zA-Z0-9]+)/);
    if (spotifyMatch) {
        return { url: `https://open.spotify.com/embed/${spotifyMatch[1]}/${spotifyMatch[2]}`, height: 152 };
    }

    // YouTube
    const youtubeMatch = url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (youtubeMatch) {
        return { url: `https://www.youtube.com/embed/${youtubeMatch[1]}`, height: 152 };
    }
    
    // Apple Music
    const appleMusicMatch = url.match(/https?:\/\/music\.apple\.com\/(\w{2}\/(?:album|playlist)\/.+)/);
    if (appleMusicMatch) {
        return { url: `https://embed.music.apple.com/${appleMusicMatch[1]}`, height: 152 };
    }

    // Napster
    const napsterMatch = url.match(/https?:\/\/(?:www\.)?(?:us\.)?napster\.com\/(album|playlist)\/([a-zA-Z0-9\.]+)/);
    if (napsterMatch) {
        return { url: `https://app.napster.com/embed/${napsterMatch[1]}/${napsterMatch[2]}`, height: 340 };
    }
    
    // SoundCloud
    const soundCloudMatch = url.match(/https?:\/\/(?:www\.)?soundcloud\.com\/.+/);
    if (soundCloudMatch) {
        return { url: `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&auto_play=false&visual=true`, height: 166 };
    }

    // Deezer
    const deezerMatch = url.match(/https?:\/\/(?:www\.)?deezer\.com\/(?:[\w-]+\/)?(playlist|album)\/(\d+)/);
    if (deezerMatch) {
        return { url: `https://widget.deezer.com/widget/auto/${deezerMatch[1]}/${deezerMatch[2]}`, height: 92 };
    }

    // iHeartRadio (Podcasts)
    const iheartMatch = url.match(/https?:\/\/(?:www\.)?iheart\.com\/(podcast\/[^\/?]+)/);
    if (iheartMatch) {
        return { url: `https://www.iheart.com/${iheartMatch[1]}/?embed=true`, height: 152 };
    }
    
    // Mixcloud
    const mixcloudMatch = url.match(/https?:\/\/(?:www\.)?mixcloud\.com(\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+\/?)/);
    if (mixcloudMatch) {
        return { url: `https://www.mixcloud.com/widget/iframe/?feed=${encodeURIComponent(mixcloudMatch[1])}`, height: 120 };
    }

    // TIDAL
    const tidalMatch = url.match(/https?:\/\/(?:www\.)?tidal\.com\/browse\/(album|playlist)\/([a-zA-Z0-9-]+)/);
    if (tidalMatch) {
        return { url: `https://embed.tidal.com/${tidalMatch[1]}s/${tidalMatch[2]}`, height: 96 };
    }

    return null;
};

export const StudySessions: React.FC<StudySessionsProps> = ({ onSessionComplete }) => {
  const [workDuration, setWorkDuration] = useState(25);
  const [breakDuration, setBreakDuration] = useState(5);
  
  const [minutes, setMinutes] = useState(workDuration);
  const [seconds, setSeconds] = useState(0);
  
  const [isActive, setIsActive] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [aiMessage, setAiMessage] = useState("Let's get started! Focus and do your best.");
  
  const [activeAmbientSound, setActiveAmbientSound] = useState('None');
  const [backgroundAudioUrl, setBackgroundAudioUrl] = useState<string | null>(null);

  const [playerMode, setPlayerMode] = useState<'link' | 'upload'>('link');
  const [embedUrl, setEmbedUrl] = useLocalStorage<string>('studyforge_music_embed_url', '');
  const [embedHeight, setEmbedHeight] = useState(152);
  const [urlInput, setUrlInput] = useState('');
  const [localAudioUrl, setLocalAudioUrl] = useState<string | null>(null);
  const [localAudioName, setLocalAudioName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);


  const getAIMessage = useCallback((context: 'start' | 'break' | 'end') => {
    const messages = MOTIVATIONAL_MESSAGES[context];
    const message = messages[Math.floor(Math.random() * messages.length)];
    setAiMessage(message);
  }, []);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isActive) {
      interval = setInterval(() => {
        if (seconds > 0) {
          setSeconds(s => s - 1);
        } else if (minutes > 0) {
          setMinutes(m => m - 1);
          setSeconds(59);
        } else {
          // Timer finished
          if (isBreak) { // Break finished
            setIsBreak(false);
            setMinutes(workDuration);
            getAIMessage('start');
          } else { // Work session finished
            onSessionComplete(workDuration);
            setSessionsCompleted(prev => prev + 1);
            setIsBreak(true);
            setMinutes(breakDuration);
            getAIMessage('end');
          }
          setIsActive(false);
        }
      }, 1000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isActive, seconds, minutes, isBreak, getAIMessage, workDuration, breakDuration, onSessionComplete]);

  const toggleTimer = () => {
    if (!isActive && minutes === 0 && seconds === 0) {
        // If timer is at 0, reset it before starting
        resetTimer(isBreak ? 'break' : 'work');
    }

    if (!isActive) { // We are about to START
        if (minutes === workDuration && seconds === 0 && !isBreak) getAIMessage('start');
        else if (minutes === breakDuration && seconds === 0 && isBreak) getAIMessage('break');
    }
    setIsActive(!isActive);
  };

  const resetTimer = (mode: 'work' | 'break') => {
    setIsActive(false);
    if (mode === 'work') {
        setIsBreak(false);
        setMinutes(workDuration);
        setAiMessage("Ready for a focus session?");
    } else {
        setIsBreak(true);
        setMinutes(breakDuration);
        setAiMessage("Time for a short break!");
    }
    setSeconds(0);
  };
  
  const applyPreset = (work: number, breakT: number) => {
    setWorkDuration(work);
    setBreakDuration(breakT);
    if (!isActive) {
        setMinutes(work);
        setSeconds(0);
        setIsBreak(false);
    }
  }

  const handleLoadUrl = () => {
    const embedInfo = getEmbedUrl(urlInput);
    if (embedInfo) {
        setEmbedUrl(embedInfo.url);
        setEmbedHeight(embedInfo.height);
        setUrlInput(''); // Clear input on success
        setLocalAudioUrl(null); // Switch off local audio if a link is loaded
        setLocalAudioName(null);
        setActiveAmbientSound('None');
        setBackgroundAudioUrl(null);
    } else {
        alert("Invalid or unsupported URL. Please use a valid link from Spotify, YouTube, Apple Music, SoundCloud, Deezer, TIDAL, Napster, Mixcloud, or iHeartRadio (podcasts).");
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
        const objectUrl = URL.createObjectURL(file);
        // Revoke the old URL if it exists to prevent memory leaks
        if (localAudioUrl) {
            URL.revokeObjectURL(localAudioUrl);
        }
        setLocalAudioUrl(objectUrl);
        setLocalAudioName(file.name);
        setEmbedUrl(''); // Clear embed URL if local file is used
        setActiveAmbientSound('None');
        setBackgroundAudioUrl(null);
        event.target.value = ''; // Allow re-uploading the same file
    }
  };
  
  const handleAmbientSoundClick = (soundName: string) => {
    setActiveAmbientSound(soundName);

    if (soundName === 'None') {
        setBackgroundAudioUrl(null);
        return;
    }

    const urls = AMBIENT_SOUNDS[soundName as keyof typeof AMBIENT_SOUNDS];
    if (urls) {
        // Clear main music player
        setEmbedUrl('');
        setLocalAudioUrl(null);
        setLocalAudioName(null);
        
        const randomUrl = urls[Math.floor(Math.random() * urls.length)];
        const embedInfo = getEmbedUrl(randomUrl);
        if (embedInfo) {
            const videoId = embedInfo.url.substring(embedInfo.url.lastIndexOf('/') + 1);
            const autoplayUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&loop=1&playlist=${videoId}&controls=0&showinfo=0&rel=0&iv_load_policy=3&modestbranding=1`;
            setBackgroundAudioUrl(autoplayUrl);
        }
    }
  };


  useEffect(() => {
    // This is a cleanup function that runs when the component unmounts.
    return () => {
        if (localAudioUrl) {
            URL.revokeObjectURL(localAudioUrl);
        }
    }
  }, [localAudioUrl]);

  const totalSeconds = (isBreak ? breakDuration : workDuration) * 60;
  const secondsRemaining = minutes * 60 + seconds;
  const progress = totalSeconds > 0 ? ((totalSeconds - secondsRemaining) / totalSeconds) * 100 : 0;

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6 bg-slate-950/30">
       {backgroundAudioUrl && (
            <iframe
                src={backgroundAudioUrl}
                frameBorder="0"
                allow="autoplay; encrypted-media"
                style={{
                    position: 'absolute',
                    left: '-9999px',
                    width: '1px',
                    height: '1px',
                }}
                aria-hidden="true"
                title="Ambient Sound Player"
            ></iframe>
        )}
      <div className="w-full max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 text-center p-6 md:p-8 flex flex-col justify-between">
            <div>
                <h2 className="text-3xl font-bold text-white mb-2">{isBreak ? "Take a Break" : "Focus Time"}</h2>
                <p className="text-slate-400 mb-8">Completed Sessions: <span className="font-bold text-violet-400">{sessionsCompleted}</span></p>
            </div>
            <div className="relative w-48 h-48 sm:w-60 sm:h-60 mx-auto my-8">
                <svg className="w-full h-full" viewBox="0 0 100 100">
                    <circle className="text-slate-700" strokeWidth="7" stroke="currentColor" fill="transparent" r="45" cx="50" cy="50" />
                    <circle className={isBreak ? "text-green-500" : "text-violet-500"} strokeWidth="7" strokeDasharray={2 * Math.PI * 45} strokeDashoffset={2 * Math.PI * 45 * (1 - progress/100)} strokeLinecap="round" stroke="currentColor" fill="transparent" r="45" cx="50" cy="50" style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'stroke-dashoffset 1s linear' }}/>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center"><span className="text-5xl sm:text-6xl font-mono text-slate-100">{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}</span></div>
            </div>
            <div>
                <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
                    <Button onClick={toggleTimer} size="lg" className="w-full sm:w-36">{isActive ? 'Pause' : 'Start'}</Button>
                    <Button onClick={() => resetTimer(isBreak ? 'break' : 'work')} variant="secondary" size="lg" className="w-full sm:w-36">Reset</Button>
                </div>
                <div className="bg-slate-800/70 p-4 rounded-lg"><p className="text-sm font-semibold text-violet-300">Accountability Partner says:</p><p className="italic text-violet-100 mt-1">"{aiMessage}"</p></div>
            </div>
        </Card>
        <div className="flex flex-col gap-6">
            <Card className="p-6">
                <h3 className="text-lg font-bold text-white mb-4">Timer Presets</h3>
                <div className="space-y-3">
                    {Presets.map(p => <Button key={p.name} variant="secondary" onClick={() => applyPreset(p.work, p.break)} className="w-full">{p.name} ({p.work}/{p.break})</Button>)}
                </div>
            </Card>
             <Card className="p-6">
                <h3 className="text-lg font-bold text-white mb-4">Custom Time</h3>
                <div className="flex gap-4">
                    <div>
                        <label htmlFor="work" className="block text-sm text-slate-400">Work (min)</label>
                        <input type="number" id="work" value={workDuration} onChange={e => setWorkDuration(Math.max(1, +e.target.value))} onBlur={() => !isActive && resetTimer('work')} className="mt-1 w-full bg-slate-700 border-slate-600 rounded-md p-2" />
                    </div>
                     <div>
                        <label htmlFor="break" className="block text-sm text-slate-400">Break (min)</label>
                        <input type="number" id="break" value={breakDuration} onChange={e => setBreakDuration(Math.max(1, +e.target.value))} className="mt-1 w-full bg-slate-700 border-slate-600 rounded-md p-2" />
                    </div>
                </div>
            </Card>
            <Card className="p-6">
                <h3 className="text-lg font-bold text-white mb-4">Ambient Sound</h3>
                <p className="text-xs text-slate-400 mb-3 -mt-3">Plays continuous background audio to help you focus. This will stop any other music. Click the buttons for another time will give u new ambient music. </p>
                <div className="space-y-3">
                    {AMBIENT_SOUND_PRESETS.map(name => (
                        <Button 
                            key={name} 
                            variant={activeAmbientSound === name ? 'primary' : 'secondary'} 
                            onClick={() => handleAmbientSoundClick(name)} 
                            className="w-full"
                        >
                            {name}
                        </Button>
                    ))}
                </div>
            </Card>
             <Card className="p-6">
                <h3 className="text-lg font-bold text-white mb-4">Music Player</h3>
                <div className="space-y-3">
                    <div className="flex items-center gap-2 p-1 bg-slate-900/70 rounded-lg">
                        <Button size="sm" variant={playerMode === 'link' ? 'primary' : 'secondary'} className="w-full" onClick={() => setPlayerMode('link')}>From Link</Button>
                        <Button size="sm" variant={playerMode === 'upload' ? 'primary' : 'secondary'} className="w-full" onClick={() => setPlayerMode('upload')}>Upload Audio</Button>
                    </div>

                    {playerMode === 'link' && (
                        <div className="flex gap-2">
                            <input 
                                type="text"
                                value={urlInput}
                                onChange={e => setUrlInput(e.target.value)}
                                onKeyPress={e => e.key === 'Enter' && handleLoadUrl()}
                                placeholder="Spotify, YouTube, SoundCloud URL..."
                                className="flex-grow bg-slate-700 border-slate-600 rounded-md p-2 text-sm"
                            />
                            <Button onClick={handleLoadUrl}>Load</Button>
                        </div>
                    )}
                    
                    {playerMode === 'upload' && (
                        <div>
                            <input type="file" accept="audio/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                            <Button variant="secondary" className="w-full" onClick={() => fileInputRef.current?.click()}>
                                {localAudioName ? 'Change File' : 'Select Audio File'}
                            </Button>
                            {localAudioName && <p className="text-xs text-slate-400 mt-2 truncate text-center">Now playing: {localAudioName}</p>}
                        </div>
                    )}

                    {embedUrl ? (
                        <iframe
                            className="rounded-xl mt-4"
                            src={embedUrl}
                            width="100%"
                            height={embedHeight}
                            frameBorder="0"
                            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                            loading="lazy"
                        ></iframe>
                    ) : localAudioUrl ? (
                        <audio controls src={localAudioUrl} className="w-full mt-4">
                            Your browser does not support the audio element.
                        </audio>
                    ) : (
                        <div className="mt-4 text-center text-sm text-slate-500 p-4 bg-slate-800/50 rounded-lg">
                            Your player will appear here.
                        </div>
                    )}
                </div>
            </Card>
        </div>
      </div>
    </div>
  );
};