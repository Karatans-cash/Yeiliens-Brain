
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { BrainMonsterRetouchIcon, BrainMonsterFilterIcon, BrainMonsterEffectIcon, UserIcon, SparkleIcon, FilmIcon, TuneIcon } from './icons';

interface TutorialsScreenProps {
    onGoBack: () => void;
}

const TutorialsScreen: React.FC<TutorialsScreenProps> = ({ onGoBack }) => {
    
    const tools = [
        {
            title: "Smart Retouch",
            icon: BrainMonsterRetouchIcon,
            description: "Edit specific parts of an image by selecting an area and typing what you want to change.",
            example: "Select a shirt -> Type 'Change to red leather jacket'.",
            color: "text-[#50FFE5]",
            bgColor: "bg-[#50FFE5]/10"
        },
        {
            title: "Character Insert",
            icon: UserIcon,
            description: "Place a new character into your scene. The AI calculates perspective and lighting automatically.",
            example: "Click on a chair -> Upload a robot image -> Type 'Sitting reading a book'.",
            color: "text-[#E96693]",
            bgColor: "bg-[#E96693]/10"
        },
        {
            title: "Harmonize & Magic Fix",
            icon: BrainMonsterEffectIcon,
            description: "The ultimate 'Fix It' button. It unifies art styles and fixes physics errors (like floating objects).",
            example: "Use this after pasting multiple images together to make them look like one photo.",
            color: "text-[#F4D03F]",
            bgColor: "bg-[#F4D03F]/10"
        },
        {
            title: "Creative Filters",
            icon: BrainMonsterFilterIcon,
            description: "Apply a global style to the entire image without changing the composition.",
            example: "Type 'Cyberpunk city style' or 'Vintage 1920s film photo'.",
            color: "text-[#96D6C9]",
            bgColor: "bg-[#96D6C9]/10"
        },
        {
            title: "Animation (Veo)",
            icon: FilmIcon,
            description: "Turn static images into short video clips using Google's Veo model.",
            example: "Upload a landscape -> Type 'Camera panning right, birds flying'.",
            color: "text-[#50FFE5]",
            bgColor: "bg-[#50FFE5]/10"
        }
    ];

    return (
        <div className="w-full max-w-5xl mx-auto p-4 animate-fade-in-up flex flex-col items-center gap-8">
             <div className="text-center space-y-4 mb-8">
                 <h2 className="text-4xl font-heading text-[#EDEBE4]">
                    How to use Brainwave
                </h2>
                <p className="text-lg text-[#96D6C9] max-w-2xl mx-auto">
                    Master the tools to create mind-bending art.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                {tools.map((tool, index) => (
                    <div key={index} className="bg-black/30 backdrop-blur-md border border-white/5 rounded-2xl p-6 flex items-start gap-4 hover:bg-black/40 transition-colors">
                        <div className={`p-3 rounded-xl ${tool.bgColor}`}>
                             {typeof tool.icon === 'function' ? (
                                <tool.icon className={`w-8 h-8 ${tool.color}`} />
                             ) : (
                                // For the image based icons (BrainMonster)
                                <div className="w-8 h-8">
                                    <tool.icon className="w-full h-full object-contain" />
                                </div>
                             )}
                        </div>
                        <div>
                            <h3 className={`text-xl font-bold mb-2 ${tool.color}`}>{tool.title}</h3>
                            <p className="text-[#EDEBE4]/90 text-sm mb-3 leading-relaxed">
                                {tool.description}
                            </p>
                            <div className="text-xs bg-white/5 p-2 rounded-lg border border-white/5 text-[#96D6C9] italic">
                                <span className="font-bold not-italic text-white/50 mr-2">Try:</span>
                                {tool.example}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <button 
                onClick={onGoBack}
                className="mt-8 px-8 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-all"
            >
                Start Creating
            </button>
        </div>
    );
};

export default TutorialsScreen;
