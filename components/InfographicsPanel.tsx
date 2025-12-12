/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import { ChartBarIcon, UploadIcon } from './icons';
import Spinner from './Spinner';

interface InfographicsPanelProps {
  onApplyInfographic: (prompt: string, data: string, overlayImage?: File) => void;
  isLoading: boolean;
  isHotspotSelected: boolean;
}

type Mode = 'generate-text' | 'add-logo';

const InfographicsPanel: React.FC<InfographicsPanelProps> = ({ onApplyInfographic, isLoading, isHotspotSelected }) => {
  const [mode, setMode] = useState<Mode>('generate-text');
  
  // State for Generate Text Mode
  const [prompt, setPrompt] = useState('');
  const [data, setData] = useState('');

  // State for Add Logo Mode
  const [overlayFile, setOverlayFile] = useState<File | null>(null);
  const [overlayPreview, setOverlayPreview] = useState<string | null>(null);

  useEffect(() => {
    if (overlayFile) {
        const url = URL.createObjectURL(overlayFile);
        setOverlayPreview(url);
        return () => URL.revokeObjectURL(url);
    } else {
        setOverlayPreview(null);
    }
  }, [overlayFile]);

  const handleApply = () => {
    if (mode === 'generate-text') {
        if (prompt && data) {
            onApplyInfographic(prompt, data);
        }
    } else {
        if (overlayFile && (prompt || isHotspotSelected)) {
            // If prompt is empty but hotspot is selected, provide a default instruction
            const effectivePrompt = prompt || "Place the logo naturally on the surface at the selected point.";
            onApplyInfographic(effectivePrompt, '', overlayFile);
        }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setOverlayFile(e.target.files[0]);
    }
  };

  return (
    <div className="w-full flex flex-col gap-4 animate-fade-in">
      <h3 className="text-lg font-semibold text-center text-[#EDEBE4]">Text & Logo Overlay</h3>
      
      {/* Mode Switcher */}
      <div className="flex bg-[#03110F] border border-[#267364] rounded-lg p-1 w-full mb-2">
         <button
            onClick={() => setMode('generate-text')}
            disabled={isLoading}
            className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${mode === 'generate-text' ? 'bg-[#63A798] text-[#03110F]' : 'text-[#63A798] hover:bg-white/5'}`}
         >
            Generate Text
         </button>
         <button
            onClick={() => setMode('add-logo')}
            disabled={isLoading}
            className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${mode === 'add-logo' ? 'bg-[#63A798] text-[#03110F]' : 'text-[#63A798] hover:bg-white/5'}`}
         >
            Add Logo
         </button>
      </div>

      <div className="flex flex-col gap-4">
        {mode === 'generate-text' ? (
            // --- MODE: GENERATE TEXT ---
            <>
                <p className="text-md text-center text-[#63A798]">
                    {isHotspotSelected ? 'Coordinates selected! Now describe the style.' : 'Optional: Click on the image to set center point.'}
                </p>
                
                <div className="flex flex-col gap-2 animate-fade-in">
                    <label htmlFor="infographic-prompt" className="text-sm font-medium text-[#63A798]">1. Visual Style & Placement</label>
                    <input
                        id="infographic-prompt"
                        type="text"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="e.g., 'Elegant gold cursive writing'"
                        className="flex-grow bg-[#03110F] border border-[#267364] text-[#EDEBE4] rounded-lg p-4 focus:ring-2 focus:ring-[#50FFE5] focus:outline-none transition w-full disabled:cursor-not-allowed disabled:opacity-60 text-base"
                        disabled={isLoading}
                    />
                </div>

                <div className="flex flex-col gap-2 animate-fade-in">
                    <label htmlFor="infographic-data" className="text-sm font-medium text-[#63A798]">2. Text Content</label>
                    <textarea
                        id="infographic-data"
                        value={data}
                        onChange={(e) => setData(e.target.value)}
                        placeholder="e.g., 'The Future is Now' or 'Sale 50% Off'"
                        rows={3}
                        className="flex-grow bg-[#03110F] border border-[#267364] text-[#EDEBE4] rounded-lg p-4 focus:ring-2 focus:ring-[#50FFE5] focus:outline-none transition w-full disabled:cursor-not-allowed disabled:opacity-60 text-base"
                        disabled={isLoading}
                    />
                </div>
            </>
        ) : (
            // --- MODE: ADD LOGO ---
            <>
                 <p className="text-md text-center text-[#63A798]">
                    {isHotspotSelected ? 'Target selected! Upload your logo below.' : 'Click on the object in the image to place the logo.'}
                </p>

                <div className="flex flex-col gap-2 animate-fade-in">
                    <label className="text-sm font-medium text-[#63A798]">1. Upload Logo Image</label>
                    <p className="text-xs text-[#63A798]/80 -mt-1">
                        Supported: PNG, JPG, WebP. Solid backgrounds will be automatically removed.
                    </p>
                    <label htmlFor="graphic-upload" className={`w-full h-32 border-2 border-dashed border-[#267364] rounded-lg flex flex-col items-center justify-center text-[#63A798] transition-colors hover:border-[#50FFE5] hover:text-[#50FFE5] bg-[#03110F]/50 ${isLoading ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'} ${overlayPreview ? 'p-1' : ''}`}>
                        {!overlayPreview ? (
                        <>
                            <UploadIcon className="w-6 h-6 mb-2" />
                            <span className="text-xs">Click to upload logo</span>
                        </>
                        ) : (
                        <div className="relative w-full h-full">
                            <img src={overlayPreview} alt="Logo Preview" className="w-full h-full object-contain rounded-md" />
                            <button 
                                type="button"
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOverlayFile(null); }}
                                className="absolute top-0 right-0 bg-black/60 text-white rounded-full p-1 hover:bg-[#E96693]"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        )}
                    </label>
                    <input
                        id="graphic-upload"
                        type="file"
                        className="hidden"
                        accept="image/png, image/jpeg, image/webp"
                        onChange={handleFileChange}
                        disabled={isLoading}
                    />
                </div>
                
                <div className="flex flex-col gap-2 animate-fade-in">
                    <label htmlFor="graphic-prompt" className="text-sm font-medium text-[#63A798]">2. Placement Instruction (Optional if clicked)</label>
                    <input
                        id="graphic-prompt"
                        type="text"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder={isHotspotSelected ? "e.g., 'blend into the fabric texture'" : "e.g., 'On the front of the laptop'"}
                        className="flex-grow bg-[#03110F] border border-[#267364] text-[#EDEBE4] rounded-lg p-4 focus:ring-2 focus:ring-[#50FFE5] focus:outline-none transition w-full disabled:cursor-not-allowed disabled:opacity-60 text-base"
                        disabled={isLoading}
                    />
                </div>
            </>
        )}
      </div>

      {isLoading ? (
        <div className="w-full mt-2 flex items-center justify-center bg-[#03110F]/80 text-white font-bold py-4 px-6 rounded-lg border border-[#267364]">
          <Spinner className="w-6 h-6 mr-3" />
          {mode === 'generate-text' ? 'Generating Text...' : 'Applying Logo...'}
        </div>
      ) : (
        <button
            onClick={handleApply}
            className="w-full mt-2 flex items-center justify-center bg-gradient-to-br from-[#E96693] to-[#50FFE5] text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-[#50FFE5]/20 hover:shadow-xl hover:shadow-[#50FFE5]/40 hover:-translate-y-px active:scale-95 active:shadow-inner text-base disabled:from-gray-700 disabled:to-gray-800 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none"
            disabled={isLoading || (mode === 'generate-text' ? !data.trim() : !overlayFile)}
        >
            <ChartBarIcon className="w-5 h-5 mr-2" />
            {mode === 'generate-text' ? 'Generate Overlay' : 'Apply Logo'}
        </button>
      )}
    </div>
  );
};

export default InfographicsPanel;