/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { ChartBarIcon } from './icons';

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
    <div className="w-full bg-gray-800/50 border border-gray-700 rounded-lg p-4 flex flex-col gap-4 animate-fade-in backdrop-blur-sm">
      <h3 className="text-lg font-semibold text-center text-gray-300">Add Infographic to Image</h3>
      
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
            <label htmlFor="infographic-prompt" className="text-sm font-medium text-gray-400">1. Describe the infographic style</label>
            <input
                id="infographic-prompt"
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., 'A futuristic holographic bar chart in the top right'"
                className="flex-grow bg-gray-800 border border-gray-600 text-gray-200 rounded-lg p-4 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition w-full disabled:cursor-not-allowed disabled:opacity-60 text-base"
                disabled={isLoading}
            />
        </div>

        <div className="flex flex-col gap-2">
            <label htmlFor="infographic-data" className="text-sm font-medium text-gray-400">2. Provide the data</label>
            <textarea
                id="infographic-data"
                value={data}
                onChange={(e) => setData(e.target.value)}
                placeholder="e.g., Q1, 50 | Q2, 75 | Q3, 60 | Q4, 90"
                rows={4}
                className="flex-grow bg-gray-800 border border-gray-600 text-gray-200 rounded-lg p-4 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition w-full disabled:cursor-not-allowed disabled:opacity-60 text-base"
                disabled={isLoading}
            />
        </div>
      </div>

        <button
            onClick={handleApply}
            className="w-full mt-2 flex items-center justify-center bg-gradient-to-br from-fuchsia-500 to-cyan-500 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-cyan-500/20 hover:shadow-xl hover:shadow-cyan-500/40 hover:-translate-y-px active:scale-95 active:shadow-inner text-base disabled:from-fuchsia-800 disabled:to-cyan-800 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none"
            disabled={isLoading || !prompt.trim() || !data.trim()}
        >
            <ChartBarIcon className="w-5 h-5 mr-2" />
            Generate Infographic
        </button>
    </div>
  );
};

export default InfographicsPanel;