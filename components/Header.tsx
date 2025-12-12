
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { BrainMonsterLogoIcon, BackArrowIcon } from './icons';

interface HeaderProps {
  showBackButton?: boolean;
  onBackToHome?: () => void;
  onNavClick?: (view: 'start' | 'tutorials' | 'pricing') => void;
  currentView?: string;
  credits?: number | string;
  isPro?: boolean;
}

const Header: React.FC<HeaderProps> = ({ showBackButton = false, onBackToHome, onNavClick, currentView, credits, isPro }) => {
  return (
    <header className="w-full py-6 px-4 md:px-8 z-50">
      {/* Container with min-height */}
      <div className="relative flex items-center justify-between w-full max-w-[1800px] mx-auto min-h-[5rem] md:min-h-[7rem] lg:min-h-[9rem] xl:min-h-[10rem]">
        
        {/* Left Side: Back Button OR Navigation */}
        <div className="flex-1 flex justify-start z-20 items-center gap-4">
            {showBackButton ? (
                <button
                    onClick={onBackToHome}
                    className="flex items-center justify-center text-center bg-black/20 border border-white/10 text-[#EDEBE4] font-medium py-2 px-4 md:py-3 md:px-6 rounded-xl transition-all duration-200 ease-in-out hover:bg-white/10 hover:border-white/20 active:scale-95 text-sm md:text-base whitespace-nowrap shadow-lg backdrop-blur-md"
                    aria-label="Back"
                >
                    <BackArrowIcon className="w-5 h-5 mr-2" />
                    <span className="hidden lg:inline">Back</span>
                </button>
            ) : (
                <nav className="hidden md:flex items-center gap-2 bg-black/20 backdrop-blur-md p-1.5 rounded-2xl border border-white/5">
                    <button 
                        onClick={() => onNavClick?.('start')}
                        className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${currentView === 'start' ? 'bg-[#267364] text-white shadow-lg' : 'text-[#96D6C9] hover:bg-white/5'}`}
                    >
                        Home
                    </button>
                    <button 
                        onClick={() => onNavClick?.('tutorials')}
                        className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${currentView === 'tutorials' ? 'bg-[#267364] text-white shadow-lg' : 'text-[#96D6C9] hover:bg-white/5'}`}
                    >
                        Tutorials
                    </button>
                    <button 
                        onClick={() => onNavClick?.('pricing')}
                        className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${currentView === 'pricing' ? 'bg-[#E96693] text-white shadow-lg' : 'text-[#E96693] hover:bg-white/5'}`}
                    >
                        Pricing
                    </button>
                </nav>
            )}
        </div>

        {/* Center: Logo & Title (Absolute Positioned for True Centering) */}
        <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center gap-4 w-auto pointer-events-none z-10">
            {/* Logo */}
            <div className="pointer-events-auto cursor-pointer" onClick={() => onNavClick?.('start')}>
                <BrainMonsterLogoIcon className="w-20 h-20 md:w-28 md:h-28 lg:w-32 lg:h-32 xl:w-40 xl:h-40 drop-shadow-[0_0_30px_rgba(80,255,229,0.3)] transition-all duration-300 hover:scale-105" />
            </div>
            
            {/* Text - Using Font Heading (Bangers) */}
            <h1 className="hidden md:block font-bold tracking-widest text-[#EDEBE4] font-heading whitespace-nowrap md:text-5xl lg:text-6xl xl:text-7xl pointer-events-auto transition-all duration-300 drop-shadow-xl" 
                style={{ textShadow: '0 0 25px rgba(80, 255, 229, 0.4)' }}>
              Brainwave Generator
            </h1>
        </div>

        {/* Right Side: Credits / Mobile Nav */}
        <div className="flex-1 flex justify-end min-w-[50px] items-center gap-3 z-20">
             {/* Credit Counter */}
             <div className={`flex flex-col items-end px-4 py-2 rounded-xl backdrop-blur-md border ${isPro ? 'bg-[#E96693]/10 border-[#E96693]/30' : 'bg-black/20 border-white/10'}`}>
                <span className="text-xs uppercase tracking-wider text-[#96D6C9] font-bold">
                    {isPro ? 'Pro Member' : 'Free Credits'}
                </span>
                <span className={`text-xl font-heading ${isPro ? 'text-[#E96693]' : 'text-[#50FFE5]'}`}>
                    {credits} {isPro ? '' : '/ 5'}
                </span>
             </div>
             
             {/* Mobile Menu Button (Simple version) */}
             <div className="md:hidden">
                 <button 
                    onClick={() => onNavClick?.('pricing')}
                    className="bg-[#E96693] text-white p-2 rounded-lg"
                 >
                    UPGRADE
                 </button>
             </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
