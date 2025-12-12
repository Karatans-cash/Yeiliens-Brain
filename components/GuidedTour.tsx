/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect, useMemo } from 'react';

interface GuidedTourProps {
  onEndTour: () => void;
}

const tourSteps = [
  {
    targetId: 'image-canvas',
    title: 'Step 1: Select an Area',
    content: 'Welcome! First, click anywhere on the image to place a hotspot. This tells the AI where to focus the edit.',
    position: 'bottom',
  },
  {
    targetId: 'prompt-input',
    title: 'Step 2: Describe Your Edit',
    content: "Great! Now, tell the AI what you want to do. Be specific, like 'make the sky purple' or 'remove this car'.",
    position: 'top',
  },
  {
    targetId: 'generate-button',
    title: "Step 3: Generate!",
    content: "Click 'Generate' and watch the magic happen. You're all set to start creating!",
    position: 'top',
  },
];

interface Position {
  top?: number;
  left?: number;
  width?: number;
  height?: number;
}

const GuidedTour: React.FC<GuidedTourProps> = ({ onEndTour }) => {
  const [step, setStep] = useState(0);
  const [targetPosition, setTargetPosition] = useState<Position | null>(null);

  const currentStep = useMemo(() => tourSteps[step], [step]);

  useEffect(() => {
    if (!currentStep) return;

    const timer = setTimeout(() => {
      const targetElement = document.querySelector(`[data-tour-id="${currentStep.targetId}"]`);
      if (targetElement) {
        const rect = targetElement.getBoundingClientRect();
        setTargetPosition({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        });
      } else {
        console.warn(`Tour target not found: ${currentStep.targetId}`);
        setTargetPosition(null);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [currentStep]);

  const handleNext = () => {
    if (step < tourSteps.length - 1) {
      setStep(step + 1);
    } else {
      onEndTour();
    }
  };

  const tooltipStyle: React.CSSProperties = useMemo(() => {
    if (!targetPosition || !currentStep) return { display: 'none' };
    
    const baseStyle: React.CSSProperties = {
        position: 'fixed',
        transform: 'translate(-50%, 16px)',
    };
    
    if (currentStep.position === 'top') {
        baseStyle.top = `${targetPosition.top}px`;
        baseStyle.left = `${targetPosition.left + targetPosition.width / 2}px`;
        baseStyle.transform = 'translate(-50%, -100%) translateY(-16px)';
    } else {
        baseStyle.top = `${targetPosition.top + targetPosition.height}px`;
        baseStyle.left = `${targetPosition.left + targetPosition.width / 2}px`;
    }

    return baseStyle;
  }, [targetPosition, currentStep]);

  return (
    <div className="fixed inset-0 bg-black/70 z-50 animate-fade-in">
      {targetPosition && (
          <div
              className="fixed transition-all duration-300 ease-in-out pointer-events-none border-2 border-[#50FFE5] rounded-lg"
              style={{
                  top: `${targetPosition.top - 4}px`,
                  left: `${targetPosition.left - 4}px`,
                  width: `${targetPosition.width + 8}px`,
                  height: `${targetPosition.height + 8}px`,
                  boxShadow: '0 0 15px 5px rgba(80, 255, 229, 0.5)',
              }}
           />
      )}
      
      {targetPosition && currentStep && (
        <div
            style={tooltipStyle}
            onClick={(e) => e.stopPropagation()}
            className="z-[51] w-80 bg-[#03110F] border border-[#63A798] p-6 rounded-lg shadow-2xl animate-fade-in flex flex-col gap-4"
        >
            <h3 className="text-xl font-bold font-heading text-[#96D6C9]">{currentStep.title}</h3>
            <p className="text-base text-[#EDEBE4]">{currentStep.content}</p>
            <div className="flex items-center justify-between mt-2">
                <button onClick={onEndTour} className="text-sm text-[#63A798] hover:underline">
                    Skip Tour
                </button>
                <button
                    onClick={handleNext}
                    className="bg-gradient-to-br from-[#E96693] to-[#50FFE5] text-white font-bold py-2 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-[#50FFE5]/20 hover:shadow-xl hover:shadow-[#50FFE5]/40 hover:-translate-y-px active:scale-95"
                >
                    {step === tourSteps.length - 1 ? 'Finish' : 'Next'}
                </button>
            </div>
            <div className="flex items-center justify-center gap-2 mt-2">
                {tourSteps.map((_, index) => (
                    <div key={index} className={`w-2 h-2 rounded-full transition-colors ${step === index ? 'bg-[#96D6C9]' : 'bg-[#267364]'}`}></div>
                ))}
            </div>
        </div>
      )}
    </div>
  );
};

export default GuidedTour;
