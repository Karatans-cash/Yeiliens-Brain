/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { FilmIcon } from './icons';
import Spinner from './Spinner';

interface AnimatePanelProps {
  onGenerateAnimation: (prompt: string) => void;
  isLoading: boolean;
  statusMessage: string;
}

const AnimatePanel: React.FC<AnimatePanelProps> = ({ onGenerateAnimation, isLoading, statusMessage }) => {
  const [selectedPresetPrompt, setSelectedPresetPrompt] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');

  const presets = [
    { name: 'Zoom In', prompt: 'A slow, smooth zoom in on the center of the image.' },
    { name: 'Pan Left', prompt: 'A slow, smooth pan from right to left across the image.' },
    { name: 'Gentle Breeze', prompt: 'A gentle breeze causes subtle movement in foliage, hair, or fabric.' },
    { name: 'Sparkle', prompt: 'Add a subtle, magical sparkling effect to the entire image.' },
  ];

  const activePrompt = selectedPresetPrompt || customPrompt;

  const handlePresetClick = (prompt: string) => {
    setSelectedPresetPrompt(prompt);
    setCustomPrompt('');
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomPrompt(e.target.value);
    setSelectedPresetPrompt(null);
  };

  const handleGenerate = () => {
    if (activePrompt) {
      onGenerateAnimation(activePrompt);
    }
  };

  return (
    <div className="w-full bg-gray-800/50 border border-gray-700 rounded-lg p-4 flex flex-col gap-4 animate-fade-in backdrop-blur-sm">
      <h3 className="text-lg font-semibold text-center text-gray-300">Animate Your Image</h3>
      <p className="text-sm text-center text-gray-400 -mt-2">Describe the motion you want to see. Video generation may take a few minutes.</p>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {presets.map(preset => (
          <button
            key={preset.name}
            onClick={() => handlePresetClick(preset.prompt)}
            disabled={isLoading}
            className={`w-full text-center bg-white/10 border border-transparent text-gray-200 font-semibold py-3 px-4 rounded-md transition-all duration-200 ease-in-out hover:bg-white/20 hover:border-white/20 active:scale-95 text-base disabled:opacity-50 disabled:cursor-not-allowed ${selectedPresetPrompt === preset.prompt ? 'ring-2 ring-offset-2 ring-offset-gray-800 ring-cyan-500' : ''}`}
          >
            {preset.name}
          </button>
        ))}
      </div>

      <input
        type="text"
        value={customPrompt}
        onChange={handleCustomChange}
        placeholder="Or describe a custom animation (e.g., 'make the clouds move')"
        className="flex-grow bg-gray-800 border border-gray-600 text-gray-200 rounded-lg p-4 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition w-full disabled:cursor-not-allowed disabled:opacity-60 text-base"
        disabled={isLoading}
      />

      {isLoading ? (
          <div className="w-full mt-2 flex items-center justify-center bg-gray-800/80 text-white font-bold py-4 px-6 rounded-lg border border-gray-700">
            <Spinner className="w-6 h-6 mr-3" />
            {statusMessage || 'Animating your image...'}
          </div>
      ) : (
        <button
            onClick={handleGenerate}
            className="w-full mt-2 flex items-center justify-center bg-gradient-to-br from-fuchsia-500 to-cyan-500 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-cyan-500/20 hover:shadow-xl hover:shadow-cyan-500/40 hover:-translate-y-px active:scale-95 active:shadow-inner text-base disabled:from-fuchsia-800 disabled:to-cyan-800 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none"
            disabled={isLoading || !activePrompt.trim()}
        >
            <FilmIcon className="w-5 h-5 mr-2" />
            Generate Animation
        </button>
      )}
    </div>
  );
};

export default AnimatePanel;