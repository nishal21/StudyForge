import React, { useState, useEffect, useRef } from 'react';
import { Button } from './common/Button';
import { Card } from './common/Card';
import { NAV_ITEMS } from '../constants';

interface LandingPageProps {
  onApiKeySubmit: (key: string) => void;
}

const LockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>;

const FeatureCard: React.FC<{ icon: React.ReactElement<{ className?: string }>; title: string; description: string }> = ({ icon, title, description }) => (
  <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700/60 transform hover:scale-105 hover:border-violet-500/50 transition-all duration-300">
    <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-slate-700 text-violet-400 mb-4">
      {React.cloneElement(icon, { className: "h-6 w-6" })}
    </div>
    <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
    <p className="text-slate-400 text-sm">{description}</p>
  </div>
);

export const LandingPage: React.FC<LandingPageProps> = ({ onApiKeySubmit }) => {
  const [apiKey, setApiKey] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: any[] = [];
    const particleCount = 70;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const createParticles = () => {
      particles = [];
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: Math.random() * 0.5 - 0.25,
          vy: Math.random() * 0.5 - 0.25,
          radius: Math.random() * 1.5 + 0.5,
        });
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(167, 139, 250, 0.6)';
        ctx.fill();
      });

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(167, 139, 250, ${1 - dist / 100})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };
    
    resizeCanvas();
    createParticles();
    animate();

    window.addEventListener('resize', resizeCanvas);
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };

  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey.trim()) {
      onApiKeySubmit(apiKey.trim());
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-950 text-white font-sans overflow-y-auto">
      <canvas ref={canvasRef} className="absolute inset-0 -z-10 h-full w-full opacity-50"></canvas>
      <div className="absolute inset-0 -z-20 h-full w-full bg-slate-950 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
      
      <main className="container mx-auto px-6 py-12 relative z-10">
        <section className="text-center py-12 md:py-20">
          <div className="inline-block bg-gradient-to-br from-violet-500 to-cyan-500 p-4 rounded-xl mb-6 shadow-lg">
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.25278C12 6.25278 10.8333 5 8.5 5C6.16667 5 5 6.25278 5 8.5C5 12.2528 8.5 15.5 12 19L19 12C19 8.5 14.5 5.5 12 6.25278Z" />
            </svg>
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-slate-200 to-slate-400">
            StudyForge
          </h1>
          <p className="mt-4 text-lg md:text-xl max-w-2xl mx-auto text-slate-300">
            Supercharge your learning with a powerful, AI-driven toolkit designed for students.
          </p>
          <div className="mt-8">
            <Button size="lg" onClick={() => document.getElementById('api-key-section')?.scrollIntoView({ behavior: 'smooth' })}>
              Get Started for Free
            </Button>
          </div>
        </section>

        <section className="py-12 md:py-20">
            <h2 className="text-3xl font-bold text-center mb-12">Your All-in-One Study Hub</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <FeatureCard icon={NAV_ITEMS[1].icon} title="Intelligent Notes" description="Type, scan, or speak your notes. Our AI summarizes key points, extracts text from images, and transcribes lectures for you."/>
                <FeatureCard icon={NAV_ITEMS[2].icon} title="Flashcards & Quizzes" description="Automatically generate flashcards and multiple-choice quizzes from your notes to test your knowledge and reinforce learning."/>
                <FeatureCard icon={NAV_ITEMS[3].icon} title="AI Study Planner" description="Tell the AI your topic and timeframe, and get a personalized, step-by-step study plan to keep you on track."/>
                <FeatureCard icon={NAV_ITEMS[4].icon} title="Focus Sessions" description="Use the built-in Pomodoro timer with ambient sounds, or play any song or playlist while you study by embedding from Spotify, YouTube, SoundCloud, and many more."/>
                <FeatureCard icon={NAV_ITEMS[5].icon} title="Ask AI Anything" description="Get instant, reliable answers to your study questions, with optional web search for up-to-the-minute information."/>
                <FeatureCard icon={NAV_ITEMS[0].icon} title="Unified Dashboard" description="See your recent notes, track study progress, and get a daily study tip—all in one place."/>
            </div>
        </section>

        <section id="api-key-section" className="py-12 md:py-20">
          <Card className="w-full max-w-2xl mx-auto">
            <form onSubmit={handleSubmit}>
              <div className="p-8">
                <h2 className="text-2xl font-bold text-center text-white">Enter Your Gemini API Key</h2>
                <p className="mt-4 text-center text-slate-300">
                  To power the AI features, StudyForge requires a Google Gemini API key. It's free and easy to get.
                </p>
                <div className="mt-6">
                  <label htmlFor="apiKey" className="block text-sm font-medium text-slate-200">
                    Gemini API Key
                  </label>
                  <input
                    id="apiKey"
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-md text-sm shadow-sm placeholder-slate-400
                               focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                    placeholder="Enter your API key here"
                    required
                  />
                </div>
                <p className="mt-3 text-xs text-slate-400 text-center">
                  Get your free API key from{' '}
                  <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:underline font-semibold">
                    Google AI Studio
                  </a>.
                </p>
                <p className="flex items-center justify-center gap-2 mt-4 text-xs text-slate-500">
                  <LockIcon /> Your key is stored securely in your browser and never leaves your machine.
                </p>
              </div>
              <div className="bg-slate-800/50 px-6 py-4 text-right rounded-b-2xl">
                <Button type="submit" disabled={!apiKey.trim()}>
                  Unlock StudyForge
                </Button>
              </div>
            </form>
          </Card>
        </section>

        <footer className="text-center py-10 border-t border-slate-800">
            <p className="text-slate-500">Built with ❤️ for students everywhere.</p>
        </footer>
      </main>
    </div>
  );
};