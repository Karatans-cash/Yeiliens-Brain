
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { SparkleIcon, FilmIcon, BrainMonsterHero, HeartIcon } from './icons';
import Spinner from './Spinner';

interface PricingScreenProps {
    onGoBack: () => void;
    onUpgrade: () => void;
    isPro: boolean;
}

const PricingScreen: React.FC<PricingScreenProps> = ({ onGoBack, onUpgrade, isPro }) => {
    const [processingTier, setProcessingTier] = useState<string | null>(null);

    const handleSubscribe = (tierName: string) => {
        setProcessingTier(tierName);
        
        // --- PAYMENT GATEWAY INTEGRATION POINT ---
        // In a real app, this is where you would call your backend or Stripe/Midtrans.
        // Example:
        // const session = await createStripeCheckoutSession(tierName);
        // window.location.href = session.url;
        
        // Simulating network request delay
        setTimeout(() => {
            setProcessingTier(null);
            onUpgrade();
            alert(`Payment Successful! Welcome to ${tierName}. (This is a demo, no charge was made)`);
        }, 2000);
    };

    return (
        <div className="w-full max-w-6xl mx-auto p-4 animate-fade-in-up flex flex-col items-center gap-12">
            <div className="text-center space-y-4">
                 <h2 className="text-4xl md:text-6xl font-heading text-[#EDEBE4] drop-shadow-[0_0_15px_rgba(80,255,229,0.5)]">
                    Unleash Your Full Potential
                </h2>
                <p className="text-lg text-[#96D6C9] max-w-2xl mx-auto">
                    Choose a plan that fits your creative needs. Cover server costs and get access to premium models like Gemini 3 Pro and Veo.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
                {/* Free Tier */}
                <div className="bg-black/30 backdrop-blur-xl border border-white/10 rounded-3xl p-8 flex flex-col gap-6 hover:border-[#63A798] transition-all duration-300">
                    <div>
                        <h3 className="text-2xl font-bold text-[#63A798]">Starter</h3>
                        <div className="flex items-baseline gap-1 mt-2">
                            <span className="text-4xl font-bold text-white">Free</span>
                        </div>
                        <p className="text-sm text-[#96D6C9] mt-2">Perfect for trying out the magic.</p>
                    </div>
                    <ul className="space-y-3 flex-grow">
                        <li className="flex items-center gap-3 text-sm text-[#EDEBE4]"><span className="text-[#63A798]">✓</span> 5 Generations per day</li>
                        <li className="flex items-center gap-3 text-sm text-[#EDEBE4]"><span className="text-[#63A798]">✓</span> Smart Retouching</li>
                        <li className="flex items-center gap-3 text-sm text-[#EDEBE4]"><span className="text-[#63A798]">✓</span> Standard Speed</li>
                        <li className="flex items-center gap-3 text-sm text-white/40"><span className="text-white/20">✕</span> No Video Generation</li>
                        <li className="flex items-center gap-3 text-sm text-white/40"><span className="text-white/20">✕</span> No Commercial Rights</li>
                    </ul>
                    <button 
                        className="w-full py-4 rounded-xl border border-white/10 text-white font-bold bg-white/5 cursor-default"
                        disabled
                    >
                        Current Plan
                    </button>
                </div>

                {/* Creator Tier */}
                <div className="relative bg-black/40 backdrop-blur-xl border border-[#50FFE5] rounded-3xl p-8 flex flex-col gap-6 transform md:-translate-y-4 shadow-[0_0_30px_rgba(80,255,229,0.15)]">
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#50FFE5] text-[#03110F] px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                        Most Popular
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-[#50FFE5]">Creator</h3>
                        <div className="flex items-baseline gap-1 mt-2">
                            <span className="text-4xl font-bold text-white">$9.99</span>
                            <span className="text-white/50">/mo</span>
                        </div>
                        <p className="text-sm text-[#96D6C9] mt-2">For serious artists and hobbyists.</p>
                    </div>
                    <ul className="space-y-3 flex-grow">
                        <li className="flex items-center gap-3 text-sm text-white"><span className="text-[#50FFE5]">✓</span> <strong>Unlimited</strong> Image Gen</li>
                        <li className="flex items-center gap-3 text-sm text-white"><span className="text-[#50FFE5]">✓</span> Priority Processing</li>
                        <li className="flex items-center gap-3 text-sm text-white"><span className="text-[#50FFE5]">✓</span> High-Res Downloads</li>
                        <li className="flex items-center gap-3 text-sm text-white"><span className="text-[#50FFE5]">✓</span> Commercial Rights</li>
                        <li className="flex items-center gap-3 text-sm text-white/40"><span className="text-white/20">✕</span> Video Generation (Add-on)</li>
                    </ul>
                    <button 
                        onClick={() => handleSubscribe('Creator')}
                        disabled={isPro || processingTier !== null}
                        className="w-full py-4 rounded-xl bg-gradient-to-r from-[#267364] to-[#50FFE5] text-[#03110F] font-bold hover:shadow-lg hover:shadow-[#50FFE5]/30 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-wait flex items-center justify-center"
                    >
                        {processingTier === 'Creator' ? <Spinner className="w-5 h-5 text-black" /> : (isPro ? 'Active Plan' : 'Start Creating')}
                    </button>
                </div>

                {/* Pro Tier */}
                <div className="bg-black/30 backdrop-blur-xl border border-[#E96693] rounded-3xl p-8 flex flex-col gap-6 hover:border-[#E96693] transition-all duration-300">
                    <div>
                        <h3 className="text-2xl font-bold text-[#E96693]">Pro</h3>
                        <div className="flex items-baseline gap-1 mt-2">
                            <span className="text-4xl font-bold text-white">$19.99</span>
                            <span className="text-white/50">/mo</span>
                        </div>
                        <p className="text-sm text-[#E96693]/80">Full suite including Video AI.</p>
                    </div>
                    <ul className="space-y-3 flex-grow">
                        <li className="flex items-center gap-3 text-sm text-white"><span className="text-[#E96693]">✓</span> <strong>Everything in Creator</strong></li>
                        <li className="flex items-center gap-3 text-sm text-white"><span className="text-[#E96693]">✓</span> <strong>Veo Video Generation</strong></li>
                        <li className="flex items-center gap-3 text-sm text-white"><span className="text-[#E96693]">✓</span> Gemini 1.5 Pro (Logic)</li>
                        <li className="flex items-center gap-3 text-sm text-white"><span className="text-[#E96693]">✓</span> Early Access Features</li>
                    </ul>
                    <button 
                        onClick={() => handleSubscribe('Pro')}
                        disabled={isPro || processingTier !== null}
                        className="w-full py-4 rounded-xl bg-gradient-to-r from-[#E96693] to-[#F4D03F] text-white font-bold hover:shadow-lg hover:shadow-[#E96693]/30 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-wait flex items-center justify-center"
                    >
                        {processingTier === 'Pro' ? <Spinner className="w-5 h-5 text-white" /> : (isPro ? 'Switch to Pro' : 'Go Pro')}
                    </button>
                </div>
            </div>

            <div className="text-center text-white/30 text-xs max-w-lg border-t border-white/5 pt-4">
                <strong>Important:</strong> This is a demo application. The payment buttons above mimic a transaction delay but do NOT process real money. 
                <br/>
                In a production environment, this would redirect to a secure payment gateway like Stripe or Midtrans.
            </div>
            
             <button onClick={onGoBack} className="text-[#63A798] hover:text-white transition-colors text-sm">
                Back to Home
            </button>
        </div>
    );
};

export default PricingScreen;
