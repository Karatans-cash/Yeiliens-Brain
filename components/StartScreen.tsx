/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { BrainMonsterRetouchIcon, BrainMonsterFilterIcon, BrainMonsterEffectIcon, BrainIcon, BrainMonsterHero, HeartIcon, SparkleIcon } from './icons';

interface StartScreenProps {
  onFileSelect: (files: FileList | null) => void;
}

const StartScreen: React.FC<StartScreenProps> = ({ onFileSelect }) => {
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFileSelect(e.target.files);
  };
  
  return (
    <div 
      className={`w-full max-w-5xl mx-auto text-center p-8 transition-all duration-300 rounded-2xl border-2 ${isDraggingOver ? 'bg-white/10 border-dashed border-[#96D6C9]' : 'border-transparent'}`}
      onDragOver={(e) => { e.preventDefault(); setIsDraggingOver(true); }}
      onDragLeave={() => setIsDraggingOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDraggingOver(false);
        onFileSelect(e.dataTransfer.files);
      }}
    >
      <div className="flex flex-col items-center gap-8 animate-fade-in">
        
        <div className="w-full max-w-md">
           <BrainMonsterHero />
        </div>

        <div className="flex flex-col items-center gap-3">
            <label htmlFor="image-upload-start" className="relative inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-[#03110F] bg-[#96D6C9] rounded-2xl cursor-pointer group hover:bg-opacity-90 transition-all duration-300 shadow-lg shadow-[#96D6C9]/20 hover:shadow-xl hover:shadow-[#96D6C9]/40 hover:-translate-y-1">
                <div className="z-10 flex items-center justify-center">
                    <div className="transition-transform duration-300 group-hover:scale-110">
                        <HeartIcon className="w-6 h-6 mr-3 text-[#E96693]" />
                    </div>
                    Upload an Image
                </div>
            </label>
            <input id="image-upload-start" type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
            <p className="text-sm text-[#63A798]">or drag and drop your brain-file</p>
        </div>

        <div className="mt-8 w-full">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#267364] p-6 rounded-2xl border border-[#63A798]/50 flex flex-col items-center text-center backdrop-blur-md transition-all duration-300 hover:border-[#96D6C9]/80 hover:shadow-[0_0_25px_rgba(80,255,229,0.3)] hover:-translate-y-2">
                    <BrainMonsterRetouchIcon className="w-28 h-28 mb-4" />
                    <h3 className="text-lg font-bold text-[#EDEBE4] tracking-wider flex items-center gap-2 font-heading">
                       <SparkleIcon className="w-4 h-4 text-[#96D6C9]"/>
                       IQ 9000 Retouching
                    </h3>
                    <p className="mt-2 text-[#E9FFFB] text-sm">Remove objects with brain-powered precision! Zap away pesky pixels with startling accuracy.</p>
                </div>
                <div className="bg-[#267364] p-6 rounded-2xl border border-[#63A798]/50 flex flex-col items-center text-center backdrop-blur-md transition-all duration-300 hover:border-[#96D6C9]/80 hover:shadow-[0_0_25px_rgba(80,255,229,0.3)] hover:-translate-y-2">
                    <BrainMonsterFilterIcon className="w-28 h-28 mb-4" />
                    <h3 className="text-lg font-bold text-[#EDEBE4] tracking-wider flex items-center gap-2 font-heading">
                       <SparkleIcon className="w-4 h-4 text-[#96D6C9]"/>
                       Cosmic-Cool Filters
                    </h3>
                    <p className="mt-2 text-[#E9FFFB] text-sm">Turn your pics into something weirder! Sunglasses make everything 200% more artistic.</p>
                </div>
                <div className="bg-[#267364] p-6 rounded-2xl border border-[#63A798]/50 flex flex-col items-center text-center backdrop-blur-md transition-all duration-300 hover:border-[#96D6C9]/80 hover:shadow-[0_0_25px_rgba(80,255,229,0.3)] hover:-translate-y-2">
                    <BrainMonsterEffectIcon className="w-28 h-28 mb-4" />
                    <h3 className="text-lg font-bold text-[#EDEBE4] tracking-wider flex items-center gap-2 font-heading">
                        <SparkleIcon className="w-4 h-4 text-[#96D6C9]"/>
                        Otherworldly Effects
                    </h3>
                    <p className="mt-2 text-[#E9FFFB] text-sm">Bend reality, just a little. It's fun! You might even make some new, fluffy friends.</p>
                    <p className="mt-2 text-xs text-[#63A798] opacity-80">(Warning: may attract space llamas.)</p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default StartScreen;