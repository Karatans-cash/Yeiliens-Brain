/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { SparkleIcon } from './icons';

interface VariationsPanelProps {
  onGenerateVariations: (prompt: string) => void;
  onApplyVariation: () => void;
  variations: string[];
  selectedVariationIndex: number | null;
  onSelectVariation: (index: number) => void;
  isLoading: boolean;
}

const VariationsPanel: React.FC<VariationsPanelProps> = ({ 
    onGenerateVariations,
    onApplyVariation,
    variations,
    selectedVariationIndex,
    onSelectVariation,
    isLoading 
}) => {
  const [selectedPresetPrompt, setSelectedPresetPrompt] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');

  const presets = [
    { name: 'Anime', prompt: 'A vibrant Japanese anime style' },
    { name: 'Film Noir', prompt: 'A gritty, high-contrast, black and white film noir style' },
    { name: 'Watercolor', prompt: 'A beautiful and delicate watercolor painting' },
    { name: 'Photorealistic', prompt: 'A hyper-realistic 8k digital photograph with dramatic lighting' },
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

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (activePrompt) {
      onGenerateVariations(activePrompt);
    }
  };

  return (
    <div className="w-full bg-gray-800/50 border border-gray-700 rounded-lg p-4 flex flex-col gap-4 animate-fade-in backdrop-blur-sm">
      <h3 className="text-lg font-semibold text-center text-gray-300">Generate Creative Variations</h3>
      
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
      
      <form onSubmit={handleGenerate} className="flex items-center gap-2">
        <input
          type="text"
          value={customPrompt}
          onChange={handleCustomChange}
          placeholder="Or describe a custom style (e.g., '3D render, cyberpunk aesthetic')"
          className="flex-grow bg-gray-800 border border-gray-600 text-gray-200 rounded-lg p-4 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition w-full disabled:cursor-not-allowed disabled:opacity-60 text-base"
          disabled={isLoading}
        />
        <button
            type="submit"
            className="flex items-center justify-center bg-gradient-to-br from-fuchsia-500 to-cyan-500 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-cyan-500/20 hover:shadow-xl hover:shadow-cyan-500/40 hover:-translate-y-px active:scale-95 active:shadow-inner text-base disabled:from-fuchsia-800 disabled:to-cyan-800 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none"
            disabled={isLoading || !activePrompt?.trim()}
        >
            <SparkleIcon className="w-5 h-5 mr-2" />
            Generate
        </button>
      </form>

      {variations.length > 0 && !isLoading && (
        <div className="animate-fade-in flex flex-col gap-4 pt-2">
          <p className="text-center text-gray-400">Select your favorite variation below:</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {variations.map((src, index) => (
              <button
                key={index}
                onClick={() => onSelectVariation(index)}
                className={`relative rounded-lg overflow-hidden border-2 transition-all duration-200 ${selectedVariationIndex === index ? 'border-fuchsia-500 ring-2 ring-fuchsia-500/50' : 'border-transparent hover:border-fuchsia-500/50'}`}
              >
                <img src={src} alt={`Variation ${index + 1}`} className="w-full h-auto object-cover" />
                {selectedVariationIndex === index && (
                   <div className="absolute inset-0 bg-fuchsia-500/50 flex items-center justify-center">
                    <span className="text-white font-bold text-lg">Selected</span>
                  </div>
                )}
              </button>
            ))}
          </div>
          <button
            onClick={onApplyVariation}
            disabled={selectedVariationIndex === null}
            className="w-full bg-gradient-to-br from-green-600 to-green-500 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-green-500/20 hover:shadow-xl hover:shadow-green-500/40 hover:-translate-y-px active:scale-95 active:shadow-inner text-base disabled:from-green-800 disabled:to-green-700 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none"
          >
            Apply Selected Variation
          </button>
        </div>
      )}
    </div>
  );
};

export default VariationsPanel;