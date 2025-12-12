
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { BrainMonsterRetouchIcon, BrainMonsterFilterIcon, BrainMonsterEffectIcon, BrainMonsterHero, HeartIcon, SparkleIcon, FilmIcon } from './icons';

interface StartScreenProps {
  onFileSelect: (files: FileList | null) => void;
  onSwitchToTextToImage: () => void;
  onAnimateSelect: (files: FileList | null) => void;
}

const StartScreen: React.FC<StartScreenProps> = ({ onFileSelect, onSwitchToTextToImage, onAnimateSelect }) => {
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFileSelect(e.target.files);
  };

  const handleAnimateFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onAnimateSelect(e.target.files);
  }
  
  return (
    <div 
      className={`w-full max-w-6xl mx-auto p-4 md:p-8 transition-all duration-500`}
      onDragOver={(e) => { e.preventDefault(); setIsDraggingOver(true); }}
      onDragLeave={() => setIsDraggingOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDraggingOver(false);
        onFileSelect(e.dataTransfer.files);
      }}
    >
      <div className="flex flex-col items-center gap-12 animate-fade-in-up">
        
        {/* Hero Section */}
        <div className="w-full max-w-2xl flex flex-col items-center text-center gap-6">
           <div className="w-48 h-auto drop-shadow-[0_0_20px_rgba(80,255,229,0.2)]">
               <BrainMonsterHero />
           </div>
           
           <div className="space-y-2">
               <h2 className="text-3xl md:text-4xl font-heading text-[#EDEBE4] tracking-wide">
                   Unleash Your Imagination
               </h2>
               <p className="text-[#96D6C9] text-lg font-light max-w-lg mx-auto leading-relaxed">
                   Upload an image to start retouching, animating, or creating entirely new realities with AI.
               </p>
           </div>
        </div>

        {/* Action Buttons - Clean & Modern */}
        <div className={`flex flex-col items-center gap-6 w-full max-w-xl p-8 rounded-3xl border transition-all duration-300 ${isDraggingOver ? 'bg-[#50FFE5]/10 border-[#50FFE5] scale-105' : 'bg-black/20 backdrop-blur-xl border-white/5'}`}>
            
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <button
                    onClick={onSwitchToTextToImage}
                    className="relative group overflow-hidden flex flex-col items-center justify-center px-6 py-6 bg-[#267364]/30 hover:bg-[#267364]/60 border border-white/10 hover:border-[#50FFE5]/50 rounded-2xl transition-all duration-300"
                 >
                    <SparkleIcon className="w-8 h-8 mb-3 text-[#50FFE5] group-hover:scale-110 transition-transform" />
                    <span className="font-semibold text-white">Create from Text</span>
                    <span className="text-xs text-[#96D6C9] mt-1">Generate new images</span>
                </button>

                <label htmlFor="animation-upload-start" className="relative group overflow-hidden flex flex-col items-center justify-center px-6 py-6 bg-[#267364]/30 hover:bg-[#267364]/60 border border-white/10 hover:border-[#F4D03F]/50 rounded-2xl cursor-pointer transition-all duration-300">
                    <FilmIcon className="w-8 h-8 mb-3 text-[#F4D03F] group-hover:scale-110 transition-transform" />
                    <span className="font-semibold text-white">Animate Image</span>
                    <span className="text-xs text-[#96D6C9] mt-1">Video from static</span>
                </label>
                <input id="animation-upload-start" type="file" className="hidden" accept="image/*" onChange={handleAnimateFileChange} />
            </div>

            <div className="flex items-center w-full gap-4">
              <div className="flex-grow h-px bg-gradient-to-r from-transparent via-[#63A798]/30 to-transparent"></div>
              <span className="text-xs font-medium text-[#63A798] uppercase tracking-widest">or</span>
              <div className="flex-grow h-px bg-gradient-to-r from-transparent via-[#63A798]/30 to-transparent"></div>
            </div>
            
            <label htmlFor="image-upload-start" className="w-full relative flex items-center justify-center gap-3 px-8 py-5 text-lg font-bold text-[#03110F] bg-gradient-to-r from-[#50FFE5] to-[#63A798] rounded-xl cursor-pointer shadow-lg shadow-[#50FFE5]/10 hover:shadow-[#50FFE5]/30 hover:-translate-y-0.5 transition-all duration-300">
                <HeartIcon className="w-6 h-6 text-[#03110F]" />
                Upload & Edit Image
            </label>
            <input id="image-upload-start" type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
            
            <p className={`text-sm ${isDraggingOver ? 'text-[#50FFE5]' : 'text-[#63A798]/70'}`}>
                {isDraggingOver ? 'Drop it like it\'s hot!' : 'Drag & drop anywhere to start'}
            </p>
        </div>

        {/* Feature Cards - Glassmorphism */}
        <div className="w-full mt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Feature 1 */}
                <div className="group bg-black/20 backdrop-blur-md p-8 rounded-3xl border border-white/5 hover:border-[#50FFE5]/30 hover:bg-black/30 transition-all duration-500 flex flex-col items-center text-center">
                    <div className="w-20 h-20 mb-6 p-4 rounded-full bg-[#50FFE5]/5 group-hover:bg-[#50FFE5]/10 transition-colors">
                        <BrainMonsterRetouchIcon className="w-full h-full object-contain drop-shadow-lg" />
                    </div>
                    <h3 className="text-xl font-heading text-[#EDEBE4] tracking-wide mb-3 group-hover:text-[#50FFE5] transition-colors">
                       Smart Retouch
                    </h3>
                    <p className="text-[#96D6C9]/80 text-sm leading-relaxed">
                        Remove objects or fix details with localized AI editing. Precision meets magic.
                    </p>
                </div>

                {/* Feature 2 */}
                <div className="group bg-black/20 backdrop-blur-md p-8 rounded-3xl border border-white/5 hover:border-[#E96693]/30 hover:bg-black/30 transition-all duration-500 flex flex-col items-center text-center">
                    <div className="w-20 h-20 mb-6 p-4 rounded-full bg-[#E96693]/5 group-hover:bg-[#E96693]/10 transition-colors">
                        <BrainMonsterFilterIcon className="w-full h-full object-contain drop-shadow-lg" />
                    </div>
                    <h3 className="text-xl font-heading text-[#EDEBE4] tracking-wide mb-3 group-hover:text-[#E96693] transition-colors">
                       Creative Filters
                    </h3>
                    <p className="text-[#96D6C9]/80 text-sm leading-relaxed">
                        Transform reality with stylistic filters. From Cyberpunk to Watercolor in seconds.
                    </p>
                </div>

                {/* Feature 3 */}
                <div className="group bg-black/20 backdrop-blur-md p-8 rounded-3xl border border-white/5 hover:border-[#F4D03F]/30 hover:bg-black/30 transition-all duration-500 flex flex-col items-center text-center">
                    <div className="w-20 h-20 mb-6 p-4 rounded-full bg-[#F4D03F]/5 group-hover:bg-[#F4D03F]/10 transition-colors">
                        <BrainMonsterEffectIcon className="w-full h-full object-contain drop-shadow-lg" />
                    </div>
                    <h3 className="text-xl font-heading text-[#EDEBE4] tracking-wide mb-3 group-hover:text-[#F4D03F] transition-colors">
                        Magic Effects
                    </h3>
                    <p className="text-[#96D6C9]/80 text-sm leading-relaxed">
                        Harmonize composites, fix perspective, or add new characters seamlessly.
                    </p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default StartScreen;
