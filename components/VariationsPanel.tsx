/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { SparkleIcon } from './icons';
import Spinner from './Spinner';

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
    <div className="w-full flex flex-col gap-4 animate-fade-in">
      <h3 className="text-lg font-semibold text-center text-[#EDEBE4]">Generate Creative Variations</h3>
      
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
      
      <form onSubmit={handleGenerate} className="flex flex-col items-center gap-2">
        <input
          type="text"
          value={customPrompt}
          onChange={handleCustomChange}
          placeholder="Or describe a custom style"
          className="flex-grow bg-[#03110F] border border-[#267364] text-[#EDEBE4] rounded-lg p-4 focus:ring-2 focus:ring-[#50FFE5] focus:outline-none transition w-full disabled:cursor-not-allowed disabled:opacity-60 text-base"
          disabled={isLoading}
        />
        {isLoading ? (
          <div className="w-full mt-2 flex items-center justify-center bg-[#03110F]/80 text-white font-bold py-4 px-6 rounded-lg border border-[#267364]">
            <Spinner className="w-6 h-6" />
          </div>
        ) : (
          <button
              type="submit"
              className="w-full mt-2 flex items-center justify-center bg-gradient-to-br from-[#E96693] to-[#50FFE5] text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-[#50FFE5]/20 hover:shadow-xl hover:shadow-[#50FFE5]/40 hover:-translate-y-px active:scale-95 active:shadow-inner text-base disabled:from-gray-700 disabled:to-gray-800 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none"
              disabled={isLoading || !activePrompt?.trim()}
          >
              <SparkleIcon className="w-5 h-5 mr-2" />
              Generate
          </button>
        )}
      </form>

      {variations.length > 0 && !isLoading && (
        <div className="animate-fade-in flex flex-col gap-4 pt-2">
          <p className="text-center text-[#63A798]">Select your favorite variation below:</p>
          <div className="grid grid-cols-2 sm:grid-cols-2 gap-2">
            {variations.map((src, index) => (
              <button
                key={index}
                onClick={() => onSelectVariation(index)}
                className={`relative rounded-lg overflow-hidden border-2 transition-all duration-200 ${selectedVariationIndex === index ? 'border-[#E96693] ring-2 ring-[#E96693]/50' : 'border-transparent hover:border-[#E96693]/50'}`}
              >
                <img src={src} alt={`Variation ${index + 1}`} className="w-full h-auto object-cover" />
                {selectedVariationIndex === index && (
                   <div className="absolute inset-0 bg-[#E96693]/50 flex items-center justify-center">
                    <span className="text-white font-bold text-lg">Selected</span>
                  </div>
                )}
              </button>
            ))}
          </div>
          <button
            onClick={onApplyVariation}
            disabled={selectedVariationIndex === null}
            className="w-full bg-gradient-to-br from-[#63A798] to-[#96D6C9] text-[#03110F] font-bold py-4 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-[#96D6C9]/20 hover:shadow-xl hover:shadow-[#96D6C9]/40 hover:-translate-y-px active:scale-95 active:shadow-inner text-base disabled:from-gray-700 disabled:to-gray-800 disabled:text-gray-400 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none"
          >
            Apply Selected Variation
          </button>
        </div>
      )}
    </div>
  );
};

export default VariationsPanel;