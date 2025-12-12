/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useMemo } from 'react';
import Spinner from './Spinner';
import { UserIcon, UploadIcon, TuneIcon } from './icons';

interface CharacterPanelProps {
  onGenerateCharacterFromImageAndText: (image: File, prompt: string) => void;
  onRotateCharacter: (direction: string, characterDesc: string) => void;
  isLoading: boolean;
  isHotspotSelected: boolean;
}

type Mode = 'insert' | 'rotate';

const CharacterPanel: React.FC<CharacterPanelProps> = ({ 
  onGenerateCharacterFromImageAndText, 
  onRotateCharacter,
  isLoading, 
  isHotspotSelected 
}) => {
  const [mode, setMode] = useState<Mode>('insert');
  
  // Insert Mode State
  const [prompt, setPrompt] = useState('');
  const [characterFile, setCharacterFile] = useState<File | null>(null);

  // Rotate Mode State
  const [direction, setDirection] = useState<string>('Left');
  const [characterDesc, setCharacterDesc] = useState('');
  
  const characterImageUrl = useMemo(() => {
    if (characterFile) {
      return URL.createObjectURL(characterFile);
    }
    return null;
  }, [characterFile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCharacterFile(e.target.files[0]);
    }
  };

  const handleInsertSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading || !isHotspotSelected || !characterFile || !prompt.trim()) return;
    onGenerateCharacterFromImageAndText(characterFile, prompt);
  };

  const handleRotateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading || !isHotspotSelected || !direction || !characterDesc.trim()) return;
    onRotateCharacter(direction, characterDesc);
  };

  const directions = ['Left', 'Right', 'Back', 'Front'];

  return (
    <div className="flex flex-col items-center gap-4 animate-fade-in w-full">
      <div className="flex bg-[#03110F] border border-[#267364] rounded-lg p-1 w-full">
         <button
            onClick={() => setMode('insert')}
            disabled={isLoading}
            className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${mode === 'insert' ? 'bg-[#63A798] text-[#03110F]' : 'text-[#63A798] hover:bg-white/5'}`}
         >
            Insert New
         </button>
         <button
            onClick={() => setMode('rotate')}
            disabled={isLoading}
            className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${mode === 'rotate' ? 'bg-[#63A798] text-[#03110F]' : 'text-[#63A798] hover:bg-white/5'}`}
         >
            Rotate Existing
         </button>
      </div>

      {mode === 'insert' && (
        <div className="w-full flex flex-col gap-4 animate-fade-in">
            <p className="text-md text-center text-[#63A798]">
                {isHotspotSelected ? '1. Upload a character image.' : 'Click an area on the image to place your character.'}
            </p>

            <form onSubmit={handleInsertSubmit} className="w-full flex flex-col items-center gap-3">
                <div className="w-full flex flex-col items-center gap-3">
                <label htmlFor="character-upload" className={`w-full h-32 border-2 border-dashed border-[#63A798] rounded-lg flex flex-col items-center justify-center text-[#63A798] transition-colors hover:border-[#96D6C9] hover:text-[#96D6C9] ${isLoading || !isHotspotSelected ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
                    {!characterFile ? (
                    <>
                        <UploadIcon className="w-8 h-8 mb-2" />
                        <span>Click or drag to upload</span>
                    </>
                    ) : (
                    <img src={characterImageUrl!} alt="Character preview" className="w-full h-full object-contain rounded-md p-1" />
                    )}
                </label>
                <input
                    id="character-upload"
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                    disabled={isLoading || !isHotspotSelected}
                />
                {characterFile && (
                    <>
                        <button type="button" onClick={() => setCharacterFile(null)} className="text-sm text-[#E96693] hover:underline" disabled={isLoading}>
                            Remove image
                        </button>
                        <p className="text-md text-center text-[#63A798]">
                            2. Describe what the character should do.
                        </p>
                        <input
                        type="text"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder={isHotspotSelected ? "e.g., 'make them wave their hand'" : "First click a point on the image"}
                        className="flex-grow bg-[#03110F] border border-[#267364] text-[#EDEBE4] rounded-lg p-4 text-base focus:ring-2 focus:ring-[#50FFE5] focus:outline-none transition w-full disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={isLoading || !isHotspotSelected}
                        />
                    </>
                )}
                </div>
                
                {isLoading ? (
                <div className="w-full flex items-center justify-center bg-[#03110F]/80 text-white font-bold py-4 px-6 text-base rounded-lg border border-[#267364]">
                    <Spinner className="h-6 w-6" />
                </div>
                ) : (
                <button
                    type="submit"
                    className="w-full flex items-center justify-center bg-gradient-to-br from-[#E96693] to-[#50FFE5] text-white font-bold py-4 px-6 text-base rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-[#50FFE5]/20 hover:shadow-xl hover:shadow-[#50FFE5]/40 hover:-translate-y-px active:scale-95 active:shadow-inner disabled:from-gray-700 disabled:to-gray-800 disabled:text-gray-400 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none"
                    disabled={isLoading || !isHotspotSelected || !characterFile || !prompt.trim()}
                >
                    <UserIcon className="w-5 h-5 mr-2" />
                    Generate Character
                </button>
                )}
            </form>
        </div>
      )}

      {mode === 'rotate' && (
         <div className="w-full flex flex-col gap-4 animate-fade-in">
            <p className="text-md text-center text-[#63A798]">
                {isHotspotSelected ? 'Select facing direction and describe the character.' : 'Click on the character you want to re-orient.'}
            </p>

            <form onSubmit={handleRotateSubmit} className="w-full flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-[#63A798]">Face Direction</label>
                    <div className="grid grid-cols-4 gap-2">
                        {directions.map((dir) => (
                            <button
                                key={dir}
                                type="button"
                                onClick={() => setDirection(dir)}
                                disabled={isLoading || !isHotspotSelected}
                                className={`py-2 rounded-md text-sm font-bold transition-all border ${
                                    direction === dir 
                                    ? 'bg-[#E96693] border-[#E96693] text-white shadow-lg shadow-[#E96693]/30' 
                                    : 'bg-[#03110F] border-[#267364] text-[#63A798] hover:bg-white/5'
                                } disabled:opacity-50`}
                            >
                                {dir}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-[#63A798]">Which character? what pose and expression</label>
                    <input
                        type="text"
                        value={characterDesc}
                        onChange={(e) => setCharacterDesc(e.target.value)}
                        placeholder="e.g., 'the red robot with a happy expression'"
                        className="w-full bg-[#03110F] border border-[#267364] text-[#EDEBE4] rounded-lg p-4 text-base focus:ring-2 focus:ring-[#50FFE5] focus:outline-none transition disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={isLoading || !isHotspotSelected}
                    />
                </div>

                {isLoading ? (
                <div className="w-full flex items-center justify-center bg-[#03110F]/80 text-white font-bold py-4 px-6 text-base rounded-lg border border-[#267364]">
                    <Spinner className="h-6 w-6" />
                </div>
                ) : (
                <button
                    type="submit"
                    className="w-full flex items-center justify-center bg-gradient-to-br from-[#F4D03F] to-[#E67E22] text-[#03110F] font-bold py-4 px-6 text-base rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-[#F4D03F]/20 hover:shadow-xl hover:shadow-[#F4D03F]/40 hover:-translate-y-px active:scale-95 active:shadow-inner disabled:from-gray-700 disabled:to-gray-800 disabled:text-gray-400 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none"
                    disabled={isLoading || !isHotspotSelected || !direction || !characterDesc.trim()}
                >
                    <TuneIcon className="w-5 h-5 mr-2" />
                    Rotate Character
                </button>
                )}
            </form>
         </div>
      )}
    </div>
  );
};

export default CharacterPanel;
