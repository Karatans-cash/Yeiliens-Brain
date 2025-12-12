/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import { generateImageFromText, generateImageFromReference } from '../services/geminiService';
import Spinner from './Spinner';
import { BrainMonsterHero, SparkleIcon, UploadIcon, ResizeIcon } from './icons';

// Helper to convert a data URL string to a File object
const dataURLtoFile = (dataurl: string, filename: string): File => {
    const arr = dataurl.split(',');
    if (arr.length < 2) throw new Error("Invalid data URL");
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch || !mimeMatch[1]) throw new Error("Could not parse MIME type from data URL");

    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, {type:mime});
}

interface TextToImageScreenProps {
  onImageGenerated: (file: File) => void;
  onBack: () => void;
}

const TextToImageScreen: React.FC<TextToImageScreenProps> = ({ onImageGenerated, onBack }) => {
  const [prompt, setPrompt] = useState('');
  const [referenceImages, setReferenceImages] = useState<File[]>([]);
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previews, setPreviews] = useState<string[]>([]);

  // Cleanup object URLs when images change or component unmounts
  useEffect(() => {
    const newPreviews = referenceImages.map(img => URL.createObjectURL(img));
    setPreviews(newPreviews);
    
    return () => {
        newPreviews.forEach(url => URL.revokeObjectURL(url));
    };
  }, [referenceImages]);

  const handleReferenceImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      // Append new files to existing ones
      const newFiles = Array.from(e.target.files);
      setReferenceImages(prev => [...prev, ...newFiles]);
    }
  };

  const removeReferenceImage = (indexToRemove: number) => {
    setReferenceImages(prev => prev.filter((_, index) => index !== indexToRemove));
  };
  
  const aspectRatios = [
    { label: 'Square (1:1)', value: '1:1' },
    { label: 'Landscape (16:9)', value: '16:9' },
    { label: 'Portrait (9:16)', value: '9:16' },
    { label: 'Classic (4:3)', value: '4:3' },
    { label: 'Tall (3:4)', value: '3:4' },
  ];

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    try {
      let imageUrl: string;
      if (referenceImages.length > 0) {
        imageUrl = await generateImageFromReference(referenceImages, prompt, aspectRatio);
      } else {
        imageUrl = await generateImageFromText(prompt, aspectRatio);
      }
      const imageFile = dataURLtoFile(imageUrl, `generated-${Date.now()}.png`);
      onImageGenerated(imageFile);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to generate image. ${errorMessage}`);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto text-center p-8 animate-fade-in flex flex-col items-center gap-6">
      <div className="w-full max-w-sm">
        <BrainMonsterHero />
      </div>

      <h2 className="text-3xl font-bold text-[#EDEBE4] font-heading tracking-wider" style={{ textShadow: '0 0 8px rgba(80, 255, 229, 0.7)' }}>
        Create Image from Text (or Images)
      </h2>

      {error && (
        <div className="text-center animate-fade-in bg-[#E96693]/10 border border-[#E96693]/20 p-4 rounded-lg max-w-2xl mx-auto flex flex-col items-center gap-2">
            <p className="text-md text-[#E96693]/80">{error}</p>
        </div>
      )}

      <form onSubmit={handleGenerate} className="w-full flex flex-col items-center gap-4">
        
        {/* Reference Image Uploader (Optional) */}
        <div className="w-full flex flex-col items-start gap-2">
           <label className="text-sm font-medium text-[#63A798]">Optional Reference Images (Mix & Match)</label>
           
           <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-2">
               {/* Upload Button */}
               <label htmlFor="ref-image-upload" className={`aspect-square w-full border-2 border-dashed border-[#267364] rounded-lg flex flex-col items-center justify-center text-[#63A798] transition-colors hover:border-[#50FFE5] hover:text-[#50FFE5] bg-[#03110F]/50 ${isLoading ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
                    <UploadIcon className="w-8 h-8 mb-2" />
                    <span className="text-xs">Add Image</span>
               </label>

               {/* Previews */}
               {previews.map((src, index) => (
                   <div key={index} className="relative aspect-square w-full rounded-lg overflow-hidden border border-[#63A798]/30">
                       <img src={src} alt={`Ref ${index}`} className="w-full h-full object-cover" />
                       <button
                           type="button"
                           onClick={() => removeReferenceImage(index)}
                           className="absolute top-1 right-1 bg-black/70 text-white rounded-full p-1 hover:bg-[#E96693] transition-colors"
                           disabled={isLoading}
                       >
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                       </button>
                   </div>
               ))}
           </div>

           <input
            id="ref-image-upload"
            type="file"
            className="hidden"
            accept="image/*"
            multiple
            onChange={handleReferenceImagesChange}
            disabled={isLoading}
           />
        </div>

        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={referenceImages.length > 0 ? "Describe how to combine these images (e.g., 'Use the character from the first image and the background from the second')" : "Describe what you want to create..."}
          rows={3}
          className="flex-grow bg-[#03110F] border border-[#267364] text-[#EDEBE4] rounded-lg p-4 text-base focus:ring-2 focus:ring-[#50FFE5] focus:outline-none transition w-full disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isLoading}
        />
        
        {/* Aspect Ratio Selector */}
        <div className="w-full flex flex-col items-start gap-2">
             <label className="text-sm font-medium text-[#63A798] flex items-center gap-2">
                 <ResizeIcon className="w-4 h-4"/> Output Size (Aspect Ratio)
             </label>
             <div className="w-full grid grid-cols-3 sm:grid-cols-5 gap-2">
                 {aspectRatios.map((ratio) => (
                     <button
                        key={ratio.value}
                        type="button"
                        onClick={() => setAspectRatio(ratio.value)}
                        disabled={isLoading}
                        className={`py-2 px-1 rounded-md text-xs sm:text-sm font-semibold transition-all duration-200 active:scale-95 disabled:opacity-50 ${
                            aspectRatio === ratio.value 
                            ? 'bg-gradient-to-br from-[#E96693] to-[#50FFE5] text-white shadow-md shadow-[#50FFE5]/20' 
                            : 'bg-white/10 hover:bg-white/20 text-[#EDEBE4] border border-[#63A798]/30'
                        }`}
                     >
                         {ratio.label}
                     </button>
                 ))}
             </div>
        </div>

        {isLoading ? (
          <div className="w-full max-w-sm flex items-center justify-center bg-[#03110F]/80 text-white font-bold py-4 px-6 rounded-lg border border-[#267364]">
            <Spinner className="w-6 h-6 mr-3" />
            Generating...
          </div>
        ) : (
          <button
            type="submit"
            className="w-full max-w-sm flex items-center justify-center bg-gradient-to-br from-[#E96693] to-[#50FFE5] text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-[#50FFE5]/20 hover:shadow-xl hover:shadow-[#50FFE5]/40 hover:-translate-y-px active:scale-95 active:shadow-inner text-base disabled:from-gray-700 disabled:to-gray-800 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none"
            disabled={isLoading || !prompt.trim()}
          >
            <SparkleIcon className="w-5 h-5 mr-2" />
            Generate Image
          </button>
        )}
      </form>

      <button
        onClick={onBack}
        disabled={isLoading}
        className="mt-4 text-center bg-white/10 border border-[#63A798]/50 text-[#EDEBE4] font-semibold py-2 px-5 rounded-md transition-all duration-200 ease-in-out hover:bg-white/20 hover:border-white/30 active:scale-95 text-base disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Back to Upload
      </button>
    </div>
  );
};

export default TextToImageScreen;