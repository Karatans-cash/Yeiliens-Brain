/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import { ResizeIcon } from './icons';

interface ResizePanelProps {
  onApplyResize: (width: number, height: number) => void;
  isLoading: boolean;
  originalWidth: number;
  originalHeight: number;
}

const ResizePanel: React.FC<ResizePanelProps> = ({ 
  onApplyResize, 
  isLoading, 
  originalWidth, 
  originalHeight 
}) => {
  const [width, setWidth] = useState<string>(originalWidth.toString());
  const [height, setHeight] = useState<string>(originalHeight.toString());
  const [keepAspectRatio, setKeepAspectRatio] = useState<boolean>(true);
  const [activeRatio, setActiveRatio] = useState<string | null>(null);

  const aspectRatios = [
    { name: '1:1', value: 1 / 1 },
    { name: '4:3', value: 4 / 3 },
    { name: '3:4', value: 3 / 4 },
    { name: '16:9', value: 16 / 9 },
    { name: '9:16', value: 9 / 16 },
  ];

  // When original dimensions change, update the state
  useEffect(() => {
    setWidth(originalWidth.toString());
    setHeight(originalHeight.toString());
    setActiveRatio(null); // Reset active ratio when a new image is focused
  }, [originalWidth, originalHeight]);

  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newWidth = e.target.value;
    setWidth(newWidth);
    setActiveRatio(null); // Deselect preset on manual change
    if (keepAspectRatio && originalWidth > 0) {
      const newWidthNum = parseInt(newWidth, 10);
      if (!isNaN(newWidthNum)) {
        const newHeight = Math.round((newWidthNum / originalWidth) * originalHeight);
        setHeight(newHeight.toString());
      }
    }
  };

  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newHeight = e.target.value;
    setHeight(newHeight);
    setActiveRatio(null); // Deselect preset on manual change
    if (keepAspectRatio && originalHeight > 0) {
      const newHeightNum = parseInt(newHeight, 10);
      if (!isNaN(newHeightNum)) {
        const newWidth = Math.round((newHeightNum / originalHeight) * originalWidth);
        setWidth(newWidth.toString());
      }
    }
  };

  const handleRatioClick = (name: string, ratioValue: number) => {
    if (!originalWidth || !originalHeight) return;

    setActiveRatio(name);
    setKeepAspectRatio(true);

    const originalRatio = originalWidth / originalHeight;
    let newWidth: number;
    let newHeight: number;

    // This logic maximizes the image area within the new aspect ratio
    if (ratioValue > originalRatio) {
      // New aspect is wider, so original width is the constraint
      newWidth = originalWidth;
      newHeight = Math.round(originalWidth / ratioValue);
    } else {
      // New aspect is taller or same, so original height is the constraint
      newHeight = originalHeight;
      newWidth = Math.round(originalHeight * ratioValue);
    }
    
    setWidth(newWidth.toString());
    setHeight(newHeight.toString());
  };
  
  const handleApply = () => {
    const finalWidth = parseInt(width, 10);
    const finalHeight = parseInt(height, 10);
    if (!isNaN(finalWidth) && !isNaN(finalHeight) && finalWidth > 0 && finalHeight > 0) {
      onApplyResize(finalWidth, finalHeight);
    }
  };

  return (
    <div className="w-full flex flex-col items-center gap-4 animate-fade-in">
      <h3 className="text-lg font-semibold text-[#EDEBE4]">Resize Image</h3>
      <p className="text-sm text-[#63A798] -mt-2">Enter new dimensions for your image.</p>
      
      <div className="w-full flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="w-1/2">
            <label htmlFor="width-input" className="block text-sm font-medium text-[#63A798] mb-1">Width</label>
            <input
              id="width-input"
              type="number"
              value={width}
              onChange={handleWidthChange}
              className="flex-grow bg-[#03110F] border border-[#267364] text-[#EDEBE4] rounded-lg p-3 text-base focus:ring-2 focus:ring-[#50FFE5] focus:outline-none transition w-full disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isLoading}
            />
          </div>
          <div className="w-1/2">
            <label htmlFor="height-input" className="block text-sm font-medium text-[#63A798] mb-1">Height</label>
            <input
              id="height-input"
              type="number"
              value={height}
              onChange={handleHeightChange}
              className="flex-grow bg-[#03110F] border border-[#267364] text-[#EDEBE4] rounded-lg p-3 text-base focus:ring-2 focus:ring-[#50FFE5] focus:outline-none transition w-full disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isLoading}
            />
          </div>
        </div>
        
        <div className="flex items-center gap-2">
            <input
                id="aspect-ratio-toggle"
                type="checkbox"
                checked={keepAspectRatio}
                onChange={(e) => setKeepAspectRatio(e.target.checked)}
                className="w-4 h-4 rounded bg-[#03110F] border-[#267364] text-[#E96693] focus:ring-[#E96693]"
                disabled={isLoading}
            />
            <label htmlFor="aspect-ratio-toggle" className="text-sm text-[#EDEBE4]">
                Keep aspect ratio
            </label>
        </div>

        <div className="flex flex-col gap-2 pt-2">
            <p className="text-sm font-medium text-[#63A798]">Aspect Ratio Presets</p>
            <div className="flex flex-wrap gap-2">
                {aspectRatios.map(({ name, value }) => (
                    <button
                        key={name}
                        onClick={() => handleRatioClick(name, value)}
                        disabled={isLoading}
                        className={`px-4 py-2 rounded-md text-sm font-semibold transition-all duration-200 active:scale-95 disabled:opacity-50 flex-grow ${
                            activeRatio === name 
                            ? 'bg-gradient-to-br from-[#E96693] to-[#50FFE5] text-white shadow-md shadow-[#50FFE5]/20' 
                            : 'bg-white/10 hover:bg-white/20 text-[#EDEBE4]'
                        }`}
                    >
                        {name}
                    </button>
                ))}
            </div>
        </div>
      </div>

      <button
        onClick={handleApply}
        disabled={isLoading || !width || !height || parseInt(width) <= 0 || parseInt(height) <= 0}
        className="w-full mt-2 flex items-center justify-center bg-gradient-to-br from-[#63A798] to-[#96D6C9] text-[#03110F] font-bold py-4 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-[#96D6C9]/20 hover:shadow-xl hover:shadow-[#96D6C9]/40 hover:-translate-y-px active:scale-95 active:shadow-inner text-base disabled:from-gray-700 disabled:to-gray-800 disabled:text-gray-400 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none"
      >
        <ResizeIcon className="w-5 h-5 mr-2"/>
        Apply Resize
      </button>
    </div>
  );
};

export default ResizePanel;