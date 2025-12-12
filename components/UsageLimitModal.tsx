
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { SparkleIcon } from './icons';

interface UsageLimitModalProps {
    onClose: () => void;
    onUpgrade: () => void;
}

const UsageLimitModal: React.FC<UsageLimitModalProps> = ({ onClose, onUpgrade }) => {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-[#03110F] border border-[#E96693] rounded-3xl p-8 max-w-md w-full flex flex-col items-center text-center shadow-[0_0_50px_rgba(233,102,147,0.3)]">
                <div className="w-16 h-16 bg-[#E96693]/20 rounded-full flex items-center justify-center mb-6">
                    <SparkleIcon className="w-8 h-8 text-[#E96693]" />
                </div>
                
                <h3 className="text-3xl font-heading text-[#EDEBE4] mb-4">Out of Energy!</h3>
                <p className="text-[#96D6C9] mb-8">
                    You've used all your free generations for today. Upgrade to Pro to continue creating without limits and unlock faster speeds.
                </p>

                <button 
                    onClick={onUpgrade}
                    className="w-full py-4 bg-gradient-to-r from-[#E96693] to-[#F4D03F] text-white font-bold rounded-xl shadow-lg hover:shadow-[#E96693]/40 hover:-translate-y-1 transition-all mb-3"
                >
                    Upgrade to Unlimited
                </button>
                
                <button 
                    onClick={onClose}
                    className="text-sm text-[#63A798] hover:text-white transition-colors"
                >
                    Maybe later
                </button>
            </div>
        </div>
    );
};

export default UsageLimitModal;
