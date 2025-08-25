import React, { useState } from 'react';
import { Button } from './common/Button';
import { Card } from './common/Card';

interface ApiKeyModalProps {
  onApiKeySubmit: (key: string) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ onApiKeySubmit }) => {
  const [apiKey, setApiKey] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey.trim()) {
      onApiKeySubmit(apiKey.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900 bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg">
        <form onSubmit={handleSubmit}>
          <div className="p-8">
            <h2 className="text-2xl font-bold text-center text-white">Enter Your Gemini API Key</h2>
            <p className="mt-4 text-center text-slate-300">
              To use StudyForge, please provide your own Google Gemini API key. Your key is stored securely in your browser's local storage and is never sent to our servers.
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
                           focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                placeholder="Enter your API key"
                required
              />
            </div>
            <p className="mt-3 text-xs text-slate-500">
              You can get a free API key from{' '}
              <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">
                Google AI Studio
              </a>.
            </p>
          </div>
          <div className="bg-slate-800/50 px-6 py-4 text-right rounded-b-2xl">
            <Button type="submit" disabled={!apiKey.trim()}>
              Save and Start
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};