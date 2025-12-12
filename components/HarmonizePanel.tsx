/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import Spinner from './Spinner';
import { SparkleIcon } from './icons';

interface HarmonizePanelProps {
  onApplyHarmonize: () => void;
  onDoTheMagic: () => void;
  isLoading: boolean;
}

const HarmonizePanel: React.FC<HarmonizePanelProps> = ({ onApplyHarmonize, onDoTheMagic, isLoading }) => {
  return (
    <div className="w-full flex flex-col items-center gap-6 animate-fade-in">
      <h3 className="text-lg font-semibold text-center text-[#EDEBE4]">Harmonize Image</h3>
      
      {/* Do The Magic Section */}
      <div className="w-full bg-gradient-to-r from-[#F4D03F]/20 to-[#E67E22]/20 border border-[#F4D03F]/50 rounded-lg p-4 flex flex-col gap-3">
         <h4 className="text-md font-bold text-[#F4D03F] flex items-center gap-2">
            <SparkleIcon className="w-4 h-4" /> Do the Magic
         </h4>
         <p className="text-sm text-[#EDEBE4]/80">
            Automatically fixes logical inconsistencies! Corrects perspective, gravity, and awkward placements (e.g., character floating) to make the image make sense.
         </p>
         {isLoading ? (
            <div className="w-full flex items-center justify-center bg-[#03110F]/80 text-white font-bold py-3 px-4 rounded-lg border border-[#267364]">
                <Spinner className="w-5 h-5 mr-2" />
                Fixing Logic...
            </div>
        ) : (
             <button
                onClick={onDoTheMagic}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-[#F4D03F] to-[#E67E22] text-[#03110F] font-bold py-3 px-4 rounded-lg transition-all duration-300 shadow-lg shadow-[#F4D03F]/20 hover:shadow-xl hover:shadow-[#F4D03F]/40 hover:-translate-y-px active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Do the Magic
            </button>
        )}
      </div>

      <div className="w-full h-px bg-[#267364]/50"></div>

      {/* Standard Harmonize Section */}
      <div className="w-full flex flex-col gap-3">
        <p className="text-md text-center text-[#63A798]">
            Or use standard harmonization to unify style, lighting, and complete background areas.
        </p>
        
        {isLoading ? (
            <div className="w-full flex items-center justify-center bg-[#03110F]/80 text-white font-bold py-3 px-4 rounded-lg border border-[#267364]">
            <Spinner className="w-5 h-5 mr-2" />
            Harmonizing...
            </div>
        ) : (
            <button
            onClick={onApplyHarmonize}
            className="w-full bg-gradient-to-br from-[#E96693] to-[#50FFE5] text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-[#50FFE5]/20 hover:shadow-xl hover:shadow-[#50FFE5]/40 hover:-translate-y-px active:scale-95 active:shadow-inner text-base disabled:from-gray-700 disabled:to-gray-800 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none"
            disabled={isLoading}
            >
            Apply Style Harmonization
            </button>
        )}
      </div>
    </div>
  );
};

export default HarmonizePanel;