/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { ChartBarIcon } from './icons';
import Spinner from './Spinner';

interface InfographicsPanelProps {
  onApplyInfographic: (prompt: string, data: string) => void;
  isLoading: boolean;
}

const InfographicsPanel: React.FC<InfographicsPanelProps> = ({ onApplyInfographic, isLoading }) => {
  const [prompt, setPrompt] = useState('');
  const [data, setData] = useState('');

  const handleApply = () => {
    if (prompt && data) {
      onApplyInfographic(prompt, data);
    }
  };

  return (
    <div className="w-full flex flex-col gap-4 animate-fade-in">
      <h3 className="text-lg font-semibold text-center text-[#EDEBE4]">Add Infographic to Image</h3>
      
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
            <label htmlFor="infographic-prompt" className="text-sm font-medium text-[#63A798]">1. Describe the infographic style</label>
            <input
                id="infographic-prompt"
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., 'A futuristic holographic bar chart'"
                className="flex-grow bg-[#03110F] border border-[#267364] text-[#EDEBE4] rounded-lg p-4 focus:ring-2 focus:ring-[#50FFE5] focus:outline-none transition w-full disabled:cursor-not-allowed disabled:opacity-60 text-base"
                disabled={isLoading}
            />
        </div>

        <div className="flex flex-col gap-2">
            <label htmlFor="infographic-data" className="text-sm font-medium text-[#63A798]">2. Provide the data</label>
            <textarea
                id="infographic-data"
                value={data}
                onChange={(e) => setData(e.target.value)}
                placeholder="e.g., Q1, 50 | Q2, 75 | Q3, 60"
                rows={4}
                className="flex-grow bg-[#03110F] border border-[#267364] text-[#EDEBE4] rounded-lg p-4 focus:ring-2 focus:ring-[#50FFE5] focus:outline-none transition w-full disabled:cursor-not-allowed disabled:opacity-60 text-base"
                disabled={isLoading}
            />
        </div>
      </div>

      {isLoading ? (
        <div className="w-full mt-2 flex items-center justify-center bg-[#03110F]/80 text-white font-bold py-4 px-6 rounded-lg border border-[#267364]">
          <Spinner className="w-6 h-6 mr-3" />
          Generating Infographic...
        </div>
      ) : (
        <button
            onClick={handleApply}
            className="w-full mt-2 flex items-center justify-center bg-gradient-to-br from-[#E96693] to-[#50FFE5] text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-[#50FFE5]/20 hover:shadow-xl hover:shadow-[#50FFE5]/40 hover:-translate-y-px active:scale-95 active:shadow-inner text-base disabled:from-gray-700 disabled:to-gray-800 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none"
            disabled={isLoading || !prompt.trim() || !data.trim()}
        >
            <ChartBarIcon className="w-5 h-5 mr-2" />
            Generate Infographic
        </button>
      )}
    </div>
  );
};

export default InfographicsPanel;