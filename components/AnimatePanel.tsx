/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import { FilmIcon, UploadIcon } from './icons';
import Spinner from './Spinner';

interface AnimatePanelProps {
  onGenerateAnimation: (prompt: string, endFrame?: File) => void;
  isLoading: boolean;
  statusMessage: string;
}

const AnimatePanel: React.FC<AnimatePanelProps> = ({ onGenerateAnimation, isLoading, statusMessage }) => {
  const [selectedPresetPrompt, setSelectedPresetPrompt] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [endFrameFile, setEndFrameFile] = useState<File | null>(null);
  const [endFramePreview, setEndFramePreview] = useState<string | null>(null);

  const presets = [
    { name: 'Zoom In', prompt: 'A slow, smooth zoom in on the center of the image.' },
    { name: 'Pan Left', prompt: 'A slow, smooth pan from right to left across the image.' },
    { name: 'Gentle Breeze', prompt: 'A gentle breeze causes subtle movement in foliage, hair, or fabric.' },
    { name: 'Sparkle', prompt: 'Add a subtle, magical sparkling effect to the entire image.' },
  ];

  const activePrompt = selectedPresetPrompt || customPrompt;

  useEffect(() => {
    if (endFrameFile) {
        const url = URL.createObjectURL(endFrameFile);
        setEndFramePreview(url);
        return () => URL.revokeObjectURL(url);
    } else {
        setEndFramePreview(null);
    }
  }, [endFrameFile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setEndFrameFile(e.target.files[0]);
    }
  };

  const handlePresetClick = (prompt: string) => {
    setSelectedPresetPrompt(prompt);
    setCustomPrompt('');
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomPrompt(e.target.value);
    setSelectedPresetPrompt(null);
  };

  const handleGenerate = () => {
    if (activePrompt || endFrameFile) {
      onGenerateAnimation(activePrompt, endFrameFile || undefined);
    }
  };

  return (
    <div className="w-full flex flex-col gap-4 animate-fade-in">
      <h3 className="text-lg font-semibold text-center text-[#EDEBE4]">Animate Your Image</h3>
      <p className="text-sm text-center text-[#63A798] -mt-2">Describe the motion or add an end frame to create a transition.</p>
      
      {/* End Frame Upload Section */}
      <div className="w-full flex flex-col gap-2">
         <p className="text-sm font-medium text-[#63A798]">End Frame (Optional)</p>
         <label htmlFor="end-frame-upload" className={`w-full border-2 border-dashed border-[#267364] rounded-lg flex flex-col items-center justify-center text-[#63A798] transition-colors hover:border-[#50FFE5] hover:text-[#50FFE5] bg-[#03110F]/50 ${isLoading ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'} ${endFramePreview ? 'p-2' : 'p-4'}`}>
            {!endFramePreview ? (
              <>
                <UploadIcon className="w-6 h-6 mb-2" />
                <span className="text-xs">Upload Image to Transition To</span>
              </>
            ) : (
                <div className="relative w-full h-32">
                    <img src={endFramePreview} alt="End Frame Preview" className="w-full h-full object-contain" />
                    <button 
                        onClick={(e) => { e.preventDefault(); setEndFrameFile(null); }}
                        className="absolute top-0 right-0 bg-black/60 text-white rounded-full p-1 hover:bg-[#E96693]"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
            )}
         </label>
         <input
            id="end-frame-upload"
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleFileChange}
            disabled={isLoading}
         />
      </div>

      <div className="w-full h-px bg-[#267364]/50 my-1"></div>

      <div className="grid grid-cols-2 gap-2">
        {presets.map(preset => (
          <button
            key={preset.name}
            onClick={() => handlePresetClick(preset.prompt)}
            disabled={isLoading}
            className={`w-full text-center bg-white/10 border border-transparent text-[#EDEBE4] font-semibold py-3 px-4 rounded-md transition-all duration-200 ease-in-out hover:bg-white/20 hover:border-white/20 active:scale-95 text-sm disabled:opacity-50 disabled:cursor-not-allowed ${selectedPresetPrompt === preset.prompt ? 'ring-2 ring-offset-2 ring-offset-[#267364] ring-[#50FFE5]' : ''}`}
          >
            {preset.name}
          </button>
        ))}
      </div>

      <input
        type="text"
        value={customPrompt}
        onChange={handleCustomChange}
        placeholder={endFrameFile ? "Describe the transition (optional)" : "Describe the animation"}
        className="flex-grow bg-[#03110F] border border-[#267364] text-[#EDEBE4] rounded-lg p-4 focus:ring-2 focus:ring-[#50FFE5] focus:outline-none transition w-full disabled:cursor-not-allowed disabled:opacity-60 text-base"
        disabled={isLoading}
      />

      {isLoading ? (
          <div className="w-full mt-2 flex items-center justify-center bg-[#03110F]/80 text-white font-bold py-4 px-6 rounded-lg border border-[#267364]">
            <Spinner className="w-6 h-6 mr-3" />
            {statusMessage || 'Animating...'}
          </div>
      ) : (
        <button
            onClick={handleGenerate}
            className="w-full mt-2 flex items-center justify-center bg-gradient-to-br from-[#E96693] to-[#50FFE5] text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-[#50FFE5]/20 hover:shadow-xl hover:shadow-[#50FFE5]/40 hover:-translate-y-px active:scale-95 active:shadow-inner text-base disabled:from-gray-700 disabled:to-gray-800 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none"
            disabled={isLoading || (!activePrompt.trim() && !endFrameFile)}
        >
            <FilmIcon className="w-5 h-5 mr-2" />
            Generate Animation
        </button>
      )}
    </div>
  );
};

export default AnimatePanel;