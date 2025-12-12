
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import React, { useState, useCallback, useRef, useEffect } from 'react';
import ReactCrop, { type Crop, type PixelCrop } from 'react-image-crop';
import { generateEditedImage, generateFilteredImage, generateAdjustedImage, generateVariations, generateInfographicImage, generateAnimation, generateCharacterFromImageAndText, harmonizeImage, rotateCharacter, fixImageComposition } from './services/geminiService';
import Header from './components/Header';
import Spinner from './components/Spinner';
import FilterPanel from './components/FilterPanel';
import AdjustmentPanel from './components/AdjustmentPanel';
import CropPanel from './components/CropPanel';
import VariationsPanel from './components/VariationsPanel';
import InfographicsPanel from './components/InfographicsPanel';
import AnimatePanel from './components/AnimatePanel';
import CharacterPanel from './components/CharacterPanel';
import HarmonizePanel from './components/HarmonizePanel';
import ResizePanel from './components/ResizePanel';
import { UndoIcon, RedoIcon, EyeIcon, TuneIcon, UserIcon, SparkleIcon, ResizeIcon, BrainMonsterHero, UploadIcon, ChartBarIcon } from './components/icons';
import StartScreen from './components/StartScreen';
import TextToImageScreen from './components/TextToImageScreen';
import GuidedTour from './components/GuidedTour';
import PricingScreen from './components/PricingScreen';
import TutorialsScreen from './components/TutorialsScreen';
import UsageLimitModal from './components/UsageLimitModal';

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

type Tab = 'retouch' | 'character' | 'harmonize' | 'adjust' | 'filters' | 'crop' | 'resize' | 'variations' | 'infographics' | 'animate';
type View = 'start' | 'textToImage' | 'pricing' | 'tutorials';

// --- USAGE LIMIT CONFIG ---
const DAILY_FREE_LIMIT = 5;
const COST_IMAGE_GEN = 1;
const COST_VIDEO_GEN = 5; // Video is expensive

const App: React.FC = () => {
  // Navigation & State
  const [view, setView] = useState<View>('start');
  const [isPro, setIsPro] = useState<boolean>(false);
  const [credits, setCredits] = useState<number>(DAILY_FREE_LIMIT);
  const [showLimitModal, setShowLimitModal] = useState(false);

  // Editor State
  const [history, setHistory] = useState<File[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [prompt, setPrompt] = useState<string>('');
  const [loadingTab, setLoadingTab] = useState<Tab | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editHotspot, setEditHotspot] = useState<{ x: number, y: number } | null>(null);
  const [displayHotspot, setDisplayHotspot] = useState<{ x: number, y: number } | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('retouch');
  const [retouchImage, setRetouchImage] = useState<File | null>(null);
  const [retouchImagePreview, setRetouchImagePreview] = useState<string | null>(null);
  
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [aspect, setAspect] = useState<number | undefined>();
  const [isComparing, setIsComparing] = useState<boolean>(false);
  
  const [variations, setVariations] = useState<string[]>([]);
  const [selectedVariationIndex, setSelectedVariationIndex] = useState<number | null>(null);
  
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [animationStatusMessage, setAnimationStatusMessage] = useState<string>('');
  
  const imgRef = useRef<HTMLImageElement>(null);

  const [isTourActive, setIsTourActive] = useState(false);
  const [apiKeyReady, setApiKeyReady] = useState(false);

  // --- USAGE LOGIC ---
  useEffect(() => {
    // Check local storage for usage tracking
    const today = new Date().toDateString();
    const storedDate = localStorage.getItem('bw_usage_date');
    const storedCredits = localStorage.getItem('bw_credits');
    const storedIsPro = localStorage.getItem('bw_is_pro');

    // NOTE: In a real production app, 'isPro' and 'credits' should be fetched from your secure backend database.
    // LocalStorage is easily editable by users and is not secure for paid features.
    if (storedIsPro === 'true') {
        setIsPro(true);
        setCredits(9999);
    } else {
        if (storedDate !== today) {
            // Reset for new day
            localStorage.setItem('bw_usage_date', today);
            localStorage.setItem('bw_credits', DAILY_FREE_LIMIT.toString());
            setCredits(DAILY_FREE_LIMIT);
        } else {
            setCredits(storedCredits ? parseInt(storedCredits) : DAILY_FREE_LIMIT);
        }
    }

    const checkKey = async () => {
        const win = window as any;
        if (win.aistudio) {
            const has = await win.aistudio.hasSelectedApiKey();
            setApiKeyReady(has);
        } else {
            setApiKeyReady(true);
        }
    };
    checkKey();
  }, []);

  const checkCredits = (cost: number): boolean => {
      if (isPro) return true;
      if (credits >= cost) {
          return true;
      }
      setShowLimitModal(true);
      return false;
  };

  const deductCredits = (cost: number) => {
      if (isPro) return;
      const newCredits = credits - cost;
      setCredits(newCredits);
      localStorage.setItem('bw_credits', newCredits.toString());
  };

  const handleUpgrade = () => {
      // NOTE: This is where you would verify the transaction success.
      // e.g. verifyPayment(token).then(() => setIsPro(true))
      
      setIsPro(true);
      setCredits(9999);
      localStorage.setItem('bw_is_pro', 'true');
      setShowLimitModal(false);
      setView('start'); // Go back to app
  };

  // --- END USAGE LOGIC ---

  const currentImage = history[historyIndex] ?? null;
  const originalImage = history[0] ?? null;

  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (currentImage) {
      const url = URL.createObjectURL(currentImage);
      setCurrentImageUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setCurrentImageUrl(null);
    }
  }, [currentImage]);
  
  useEffect(() => {
    if (originalImage) {
      const url = URL.createObjectURL(originalImage);
      setOriginalImageUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setOriginalImageUrl(null);
    }
  }, [originalImage]);

  useEffect(() => {
    if (retouchImage) {
      const url = URL.createObjectURL(retouchImage);
      setRetouchImagePreview(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setRetouchImagePreview(null);
    }
  }, [retouchImage]);


  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const addImageToHistory = useCallback((newImageFile: File) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newImageFile);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setCrop(undefined);
    setCompletedCrop(undefined);
    setVariations([]);
    setSelectedVariationIndex(null);
    setVideoUrl(null);
    setRetouchImage(null);
  }, [history, historyIndex]);

  const handleImageUpload = useCallback((file: File) => {
    setError(null);
    setHistory([file]);
    setHistoryIndex(0);
    setEditHotspot(null);
    setDisplayHotspot(null);
    setActiveTab('retouch');
    setCrop(undefined);
    setCompletedCrop(undefined);
    setVariations([]);
    setSelectedVariationIndex(null);
    setVideoUrl(null);
    setRetouchImage(null);
    
    // Switch to editor view if uploading from Home
    setView('start'); 
    
    const tourSeen = localStorage.getItem('brainwave_tour_seen');
    if (!tourSeen) {
      setIsTourActive(true);
    }
  }, []);
  
  const handleAnimationSelect = useCallback((files: FileList | null) => {
    if (files && files[0]) {
        const file = files[0];
        setError(null);
        setHistory([file]);
        setHistoryIndex(0);
        setEditHotspot(null);
        setDisplayHotspot(null);
        setActiveTab('animate'); 
        setCrop(undefined);
        setCompletedCrop(undefined);
        setVariations([]);
        setSelectedVariationIndex(null);
        setVideoUrl(null);
        setRetouchImage(null);
        setView('start');
    }
  }, []);

  const handleEndTour = () => {
    setIsTourActive(false);
    localStorage.setItem('brainwave_tour_seen', 'true');
  };

  const handleImageGenerated = useCallback((file: File) => {
    handleImageUpload(file);
    deductCredits(COST_IMAGE_GEN);
  }, [handleImageUpload, isPro, credits]);

  const handleGenerate = useCallback(async () => {
    if (!currentImage || loadingTab) return;
    if (!checkCredits(COST_IMAGE_GEN)) return;
    
    if (!prompt.trim()) {
        setError('Please enter a description for your edit.');
        return;
    }
    if (!editHotspot) {
        setError('Please click on the image to select an area to edit.');
        return;
    }

    setLoadingTab('retouch');
    setError(null);
    
    try {
        const editedImageUrl = await generateEditedImage(currentImage, prompt, editHotspot, retouchImage || undefined);
        const newImageFile = dataURLtoFile(editedImageUrl, `edited-${Date.now()}.png`);
        addImageToHistory(newImageFile);
        deductCredits(COST_IMAGE_GEN);
        setEditHotspot(null);
        setDisplayHotspot(null);
        setRetouchImage(null);
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(`Failed to generate the image. ${errorMessage}`);
        console.error(err);
    } finally {
        setLoadingTab(null);
    }
  }, [currentImage, prompt, editHotspot, addImageToHistory, loadingTab, retouchImage, isPro, credits]);

  const handleGenerateCharacterFromImageAndText = useCallback(async (characterImage: File, characterPrompt: string) => {
    if (!currentImage || loadingTab || !editHotspot) return;
    if (!checkCredits(COST_IMAGE_GEN)) return;

    setLoadingTab('character');
    setError(null);

    try {
        const newImageUrl = await generateCharacterFromImageAndText(currentImage, characterImage, characterPrompt, editHotspot);
        const newImageFile = dataURLtoFile(newImageUrl, `character-inserted-${Date.now()}.png`);
        addImageToHistory(newImageFile);
        deductCredits(COST_IMAGE_GEN);
        setEditHotspot(null);
        setDisplayHotspot(null);
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to insert the character image. ' + err.message;
        setError(errorMessage);
        console.error(err);
    } finally {
        setLoadingTab(null);
    }
  }, [currentImage, editHotspot, addImageToHistory, loadingTab, isPro, credits]);

  const handleRotateCharacter = useCallback(async (direction: string, characterDesc: string) => {
    if (!currentImage || loadingTab || !editHotspot) return;
    if (!checkCredits(COST_IMAGE_GEN)) return;

    setLoadingTab('character');
    setError(null);
    
    try {
        const newImageUrl = await rotateCharacter(currentImage, editHotspot, direction, characterDesc);
        const newImageFile = dataURLtoFile(newImageUrl, `character-rotated-${Date.now()}.png`);
        addImageToHistory(newImageFile);
        deductCredits(COST_IMAGE_GEN);
        setEditHotspot(null);
        setDisplayHotspot(null);
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to rotate character. ' + err.message;
        setError(errorMessage);
        console.error(err);
    } finally {
        setLoadingTab(null);
    }
  }, [currentImage, editHotspot, addImageToHistory, loadingTab, isPro, credits]);

  const handleApplyHarmonize = useCallback(async () => {
    if (!currentImage || loadingTab) return;
    if (!checkCredits(COST_IMAGE_GEN)) return;

    setLoadingTab('harmonize');
    setError(null);

    try {
        const newImageUrl = await harmonizeImage(currentImage);
        const newImageFile = dataURLtoFile(newImageUrl, `harmonized-${Date.now()}.png`);
        addImageToHistory(newImageFile);
        deductCredits(COST_IMAGE_GEN);
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(`Failed to harmonize the image. ${errorMessage}`);
        console.error(err);
    } finally {
        setLoadingTab(null);
    }
  }, [currentImage, addImageToHistory, loadingTab, isPro, credits]);

  const handleDoTheMagic = useCallback(async () => {
    if (!currentImage || loadingTab) return;
    if (!checkCredits(COST_IMAGE_GEN)) return;

    setLoadingTab('harmonize');
    setError(null);

    try {
        const newImageUrl = await fixImageComposition(currentImage);
        const newImageFile = dataURLtoFile(newImageUrl, `magic-fix-${Date.now()}.png`);
        addImageToHistory(newImageFile);
        deductCredits(COST_IMAGE_GEN);
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(`Failed to perform magic fix. ${errorMessage}`);
        console.error(err);
    } finally {
        setLoadingTab(null);
    }
  }, [currentImage, addImageToHistory, loadingTab, isPro, credits]);
  
  const handleApplyFilter = useCallback(async (filterPrompt: string) => {
    if (!currentImage || loadingTab) return;
    if (!checkCredits(COST_IMAGE_GEN)) return;
    
    setLoadingTab('filters');
    setError(null);
    
    try {
        const filteredImageUrl = await generateFilteredImage(currentImage, filterPrompt);
        const newImageFile = dataURLtoFile(filteredImageUrl, `filtered-${Date.now()}.png`);
        addImageToHistory(newImageFile);
        deductCredits(COST_IMAGE_GEN);
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(`Failed to apply the filter. ${errorMessage}`);
        console.error(err);
    } finally {
        setLoadingTab(null);
    }
  }, [currentImage, addImageToHistory, loadingTab, isPro, credits]);
  
  const handleApplyAdjustment = useCallback(async (adjustmentPrompt: string) => {
    if (!currentImage || loadingTab) return;
    if (!checkCredits(COST_IMAGE_GEN)) return;
    
    setLoadingTab('adjust');
    setError(null);
    
    try {
        const adjustedImageUrl = await generateAdjustedImage(currentImage, adjustmentPrompt);
        const newImageFile = dataURLtoFile(adjustedImageUrl, `adjusted-${Date.now()}.png`);
        addImageToHistory(newImageFile);
        deductCredits(COST_IMAGE_GEN);
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(`Failed to apply the adjustment. ${errorMessage}`);
        console.error(err);
    } finally {
        setLoadingTab(null);
    }
  }, [currentImage, addImageToHistory, loadingTab, isPro, credits]);

  const handleGenerateVariations = useCallback(async (variationPrompt: string) => {
    if (!currentImage || loadingTab) return;
    // Variations generates 3 images, so cost is higher
    if (!checkCredits(COST_IMAGE_GEN * 3)) return;

    setLoadingTab('variations');
    setError(null);
    setVariations([]);
    setSelectedVariationIndex(null);

    try {
      const generatedVariations = await generateVariations(currentImage, variationPrompt);
      if (generatedVariations.length === 0) {
        setError('The AI could not generate variations for this prompt. Please try a different one.');
      }
      setVariations(generatedVariations);
      deductCredits(COST_IMAGE_GEN * 3);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to generate variations. ${errorMessage}`);
      console.error(err);
    } finally {
      setLoadingTab(null);
    }
  }, [currentImage, loadingTab, isPro, credits]);
  
  const handleApplyVariation = useCallback(() => {
    if (selectedVariationIndex === null || !variations[selectedVariationIndex]) {
      setError('Please select a variation to apply.');
      return;
    }
    const newImageFile = dataURLtoFile(variations[selectedVariationIndex], `variation-${Date.now()}.png`);
    addImageToHistory(newImageFile);
  }, [selectedVariationIndex, variations, addImageToHistory]);

  const handleApplyInfographic = useCallback(async (infographicPrompt: string, infographicData: string, overlayImage?: File) => {
    if (!currentImage || loadingTab) return;
    if (!checkCredits(COST_IMAGE_GEN)) return;

    setLoadingTab('infographics');
    setError(null);

    try {
        const newImageUrl = await generateInfographicImage(currentImage, infographicPrompt, infographicData, overlayImage, editHotspot || undefined);
        const newImageFile = dataURLtoFile(newImageUrl, `infographic-${Date.now()}.png`);
        addImageToHistory(newImageFile);
        deductCredits(COST_IMAGE_GEN);
        setEditHotspot(null);
        setDisplayHotspot(null);
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(`Failed to generate the infographic. ${errorMessage}`);
        console.error(err);
    } finally {
        setLoadingTab(null);
    }
  }, [currentImage, addImageToHistory, loadingTab, editHotspot, isPro, credits]);

  const handleGenerateAnimation = useCallback(async (animationPrompt: string, endFrame?: File) => {
    if (!currentImage || loadingTab) return;
    // Animation is Pro only or high credit cost
    if (!checkCredits(COST_VIDEO_GEN)) return;

    setLoadingTab('animate');
    setError(null);
    setVideoUrl(null);

    try {
        const generatedVideoUrl = await generateAnimation(
          currentImage, 
          animationPrompt,
          (message) => setAnimationStatusMessage(message),
          endFrame
        );
        setVideoUrl(generatedVideoUrl);
        deductCredits(COST_VIDEO_GEN);
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(`Failed to generate the animation. ${errorMessage}`);
        console.error(err);
    } finally {
        setLoadingTab(null);
        setAnimationStatusMessage('');
    }
  }, [currentImage, loadingTab, isPro, credits]);


  const handleApplyCrop = useCallback(() => {
    if (!completedCrop || !imgRef.current) {
        setError('Please select an area to crop.');
        return;
    }

    const image = imgRef.current;
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    
    canvas.width = completedCrop.width;
    canvas.height = completedCrop.height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        setError('Could not process the crop.');
        return;
    }

    const pixelRatio = window.devicePixelRatio || 1;
    canvas.width = completedCrop.width * pixelRatio;
    canvas.height = completedCrop.height * pixelRatio;
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      completedCrop.width,
      completedCrop.height,
    );
    
    const croppedImageUrl = canvas.toDataURL('image/png');
    const newImageFile = dataURLtoFile(croppedImageUrl, `cropped-${Date.now()}.png`);
    addImageToHistory(newImageFile);
    // Crop is a local operation, no credit cost? Let's keep it free.

  }, [completedCrop, addImageToHistory]);

  const handleApplyResize = useCallback((width: number, height: number) => {
    if (!currentImage) {
        setError('Could not find the image to resize.');
        return;
    }

    const image = new Image();
    image.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
            setError('Could not process the resize operation.');
            return;
        }

        ctx.drawImage(image, 0, 0, width, height);
        
        const resizedImageUrl = canvas.toDataURL('image/png');
        const newImageFile = dataURLtoFile(resizedImageUrl, `resized-${Date.now()}.png`);
        addImageToHistory(newImageFile);
    };
    image.onerror = () => {
        setError('Failed to load the image for resizing.');
    };
    image.src = URL.createObjectURL(currentImage);
    // Resize is local, no cost.

  }, [currentImage, addImageToHistory]);

  const handleUndo = useCallback(() => {
    if (canUndo) {
      setHistoryIndex(historyIndex - 1);
      setEditHotspot(null);
      setDisplayHotspot(null);
      setVariations([]);
      setSelectedVariationIndex(null);
      setVideoUrl(null);
      setRetouchImage(null);
    }
  }, [canUndo, historyIndex]);
  
  const handleRedo = useCallback(() => {
    if (canRedo) {
      setHistoryIndex(historyIndex + 1);
      setEditHotspot(null);
      setDisplayHotspot(null);
      setVariations([]);
      setSelectedVariationIndex(null);
      setVideoUrl(null);
      setRetouchImage(null);
    }
  }, [canRedo, historyIndex]);

  const handleReset = useCallback(() => {
    if (history.length > 0) {
      setHistoryIndex(0);
      setError(null);
      setEditHotspot(null);
      setDisplayHotspot(null);
      setVariations([]);
      setSelectedVariationIndex(null);
      setVideoUrl(null);
      setRetouchImage(null);
    }
  }, [history]);

  const handleUploadNew = useCallback(() => {
      setHistory([]);
      setHistoryIndex(-1);
      setError(null);
      setPrompt('');
      setEditHotspot(null);
      setDisplayHotspot(null);
      setVariations([]);
      setSelectedVariationIndex(null);
      setVideoUrl(null);
      setRetouchImage(null);
      setView('start');
  }, []);

  const handleDownload = useCallback(() => {
    if (videoUrl) {
      const link = document.createElement('a');
      link.href = videoUrl;
      link.download = `animated-${currentImage?.name.split('.')[0] || 'video'}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (currentImage) {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(currentImage);
        link.download = `edited-${currentImage.name}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    }
  }, [currentImage, videoUrl]);
  
  const handleFileSelect = (files: FileList | null) => {
    if (files && files[0]) {
      handleImageUpload(files[0]);
    }
  };

  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!['retouch', 'character', 'infographics'].includes(activeTab) || videoUrl || loadingTab) return;
    
    const img = e.currentTarget;
    const rect = img.getBoundingClientRect();

    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    
    setDisplayHotspot({ x: offsetX, y: offsetY });

    const { naturalWidth, naturalHeight, clientWidth, clientHeight } = img;
    const scaleX = naturalWidth / clientWidth;
    const scaleY = naturalHeight / clientHeight;

    const originalX = Math.round(offsetX * scaleX);
    const originalY = Math.round(offsetY * scaleY);

    setEditHotspot({ x: originalX, y: originalY });
};

  if (!apiKeyReady) {
    return (
         <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-[#267364] to-[#03110F] text-[#EDEBE4] p-4 font-body">
             <div className="max-w-md w-full text-center space-y-6 p-10 bg-black/40 backdrop-blur-xl rounded-3xl border border-[#63A798]/30 shadow-2xl">
                 <div className="w-32 h-auto mx-auto drop-shadow-[0_0_15px_rgba(80,255,229,0.5)]">
                     <BrainMonsterHero />
                 </div>
                 <h1 className="text-3xl font-bold font-heading text-[#50FFE5] tracking-wider">Upgrade Required</h1>
                 <p className="text-[#96D6C9] text-base leading-relaxed">
                    To use the powerful <strong>Gemini 3 Pro Image</strong> (Nano Banana Pro), please select a supported API key.
                 </p>
                 <button
                    onClick={async () => {
                        const win = window as any;
                        if (win.aistudio) {
                            await win.aistudio.openSelectKey();
                            setApiKeyReady(true);
                        }
                    }}
                    className="w-full bg-gradient-to-br from-[#E96693] to-[#50FFE5] text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-[#50FFE5]/20 hover:shadow-xl hover:shadow-[#50FFE5]/40 transition-all hover:-translate-y-1 active:scale-95 text-lg"
                 >
                    Connect API Key
                 </button>
                 <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="block text-sm text-[#63A798] hover:text-[#50FFE5] underline mt-4">
                    About Billing & Keys
                 </a>
             </div>
         </div>
    )
  }

  const renderContent = () => {
    // 1. Navigation Views
    if (view === 'pricing') {
        return <PricingScreen onGoBack={() => setView('start')} onUpgrade={handleUpgrade} isPro={isPro} />;
    }

    if (view === 'tutorials') {
        return <TutorialsScreen onGoBack={() => setView('start')} />;
    }

    // 2. Editor Error
    if (error) {
       return (
           <div className="text-center animate-fade-in-up bg-[#E96693]/10 border border-[#E96693]/20 p-8 rounded-2xl max-w-2xl mx-auto flex flex-col items-center gap-6 shadow-xl backdrop-blur-sm">
            <h2 className="text-2xl font-bold font-heading text-[#E96693]">An Error Occurred</h2>
            <p className="text-base text-[#E96693]/90">{error}</p>
            <button
                onClick={() => setError(null)}
                className="bg-[#E96693] hover:bg-opacity-90 text-white font-semibold py-2.5 px-8 rounded-lg text-sm transition-all hover:-translate-y-0.5 shadow-lg shadow-[#E96693]/20"
              >
                Try Again
            </button>
          </div>
        );
    }
    
    // 3. Text to Image
    if (view === 'textToImage') {
         return <TextToImageScreen 
                  onImageGenerated={(file) => {
                      if(checkCredits(COST_IMAGE_GEN)) {
                        handleImageGenerated(file);
                        setView('start');
                      }
                  }}
                  onBack={() => setView('start')} 
                />;
    }

    // 4. Start Screen (Home)
    if (!currentImageUrl) {
      return <StartScreen 
                onFileSelect={handleFileSelect} 
                onSwitchToTextToImage={() => setView('textToImage')}
                onAnimateSelect={handleAnimationSelect}
              />;
    }

    // 5. Video Player
    if (videoUrl) {
      return (
        <div className="w-full max-w-5xl mx-auto flex flex-col items-center gap-8 animate-fade-in-up">
          <div className="relative w-full rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-black/40">
             <video src={videoUrl} controls autoPlay loop className="w-full h-auto object-contain max-h-[70vh]" />
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setVideoUrl(null)}
              className="bg-white/5 border border-white/10 text-[#EDEBE4] font-semibold py-3 px-6 rounded-xl transition-all hover:bg-white/10 hover:border-white/20 active:scale-95 text-sm backdrop-blur-sm"
            >
              Back to Editor
            </button>
            <button 
                onClick={handleDownload}
                className="bg-gradient-to-br from-[#63A798] to-[#96D6C9] text-[#03110F] font-bold py-3 px-8 rounded-xl transition-all shadow-lg shadow-[#96D6C9]/20 hover:shadow-xl hover:shadow-[#96D6C9]/40 hover:-translate-y-px active:scale-95 text-base"
            >
                Download Video
            </button>
          </div>
        </div>
      );
    }

    const imageDisplay = (
      <div className="relative w-full h-full flex items-center justify-center">
        {/* Base image is the original, always at the bottom */}
        {originalImageUrl && (
            <img
                key={originalImageUrl}
                src={originalImageUrl}
                alt="Original"
                className="absolute inset-0 w-full h-full object-contain pointer-events-none opacity-0" 
            />
        )}
        {isComparing && originalImageUrl && (
             <img 
                src={originalImageUrl}
                alt="Original for comparison"
                className="absolute w-full h-full object-contain z-10 pointer-events-none animate-fade-in"
             />
        )}
        
        <img
            ref={imgRef}
            key={currentImageUrl}
            src={currentImageUrl}
            alt="Current"
            onClick={handleImageClick}
            className={`w-auto h-auto max-w-full max-h-[70vh] object-contain transition-opacity duration-200 ease-in-out ${isComparing ? 'opacity-0' : 'opacity-100'} ${['retouch', 'character', 'infographics'].includes(activeTab) && !loadingTab ? 'cursor-crosshair' : ''}`}
        />
      </div>
    );
    
    // For ReactCrop, we need a single image element. We'll use the current one.
    const cropImageElement = (
      <img 
        ref={imgRef}
        key={`crop-${currentImageUrl}`}
        src={currentImageUrl} 
        alt="Crop this image"
        className="w-auto h-auto max-w-full max-h-[70vh] object-contain"
      />
    );
    
    const tabs: {id: Tab, name: string, icon?: React.FC<{className?: string}>}[] = [
      { id: 'retouch', name: 'Retouch' },
      { id: 'character', name: 'Character', icon: UserIcon },
      { id: 'harmonize', name: 'Harmonize', icon: TuneIcon },
      { id: 'adjust', name: 'Adjust' },
      { id: 'filters', name: 'Filters' },
      { id: 'crop', name: 'Crop' },
      { id: 'resize', name: 'Resize', icon: ResizeIcon },
      { id: 'variations', name: 'Variations' },
      { id: 'infographics', name: 'Text & UI', icon: ChartBarIcon },
      { id: 'animate', name: 'Animate' },
    ];


    return (
      <div className="w-full flex flex-col lg:flex-row gap-8 animate-fade-in-up items-start">
        {/* Main Content Area (Left) - Canvas */}
        <div className="w-full lg:w-2/3 flex flex-col gap-6">
          <div data-tour-id="image-canvas" className="relative w-full min-h-[50vh] bg-[#03110F]/60 border border-[#267364]/30 rounded-3xl overflow-hidden flex items-center justify-center p-4 shadow-2xl backdrop-blur-sm">
              {activeTab === 'crop' ? (
                <ReactCrop 
                  crop={crop} 
                  onChange={c => setCrop(c)} 
                  onComplete={c => setCompletedCrop(c)}
                  aspect={aspect}
                  className="max-h-[70vh]"
                >
                  {cropImageElement}
                </ReactCrop>
              ) : imageDisplay }

              {displayHotspot && !loadingTab && ['retouch', 'character', 'infographics'].includes(activeTab) && (
                  <div 
                      className="absolute rounded-full w-6 h-6 bg-[#50FFE5]/50 border-2 border-white pointer-events-none -translate-x-1/2 -translate-y-1/2 z-10"
                      style={{ left: `${displayHotspot.x}px`, top: `${displayHotspot.y}px` }}
                  >
                      <div className="absolute inset-0 rounded-full w-6 h-6 animate-ping bg-[#50FFE5]"></div>
                  </div>
              )}
          </div>
          
          {/* Toolbar (Bottom of Canvas) */}
          <div className="flex flex-wrap items-center justify-center gap-3 p-2 bg-black/20 backdrop-blur-md rounded-2xl border border-white/5 w-fit mx-auto">
              <button 
                  onClick={handleUndo}
                  disabled={!canUndo || loadingTab !== null}
                  className="p-3 text-[#EDEBE4] hover:text-white hover:bg-white/10 rounded-xl transition-all disabled:opacity-30 disabled:hover:bg-transparent"
                  title="Undo"
              >
                  <UndoIcon className="w-6 h-6" />
              </button>
              <button 
                  onClick={handleRedo}
                  disabled={!canRedo || loadingTab !== null}
                  className="p-3 text-[#EDEBE4] hover:text-white hover:bg-white/10 rounded-xl transition-all disabled:opacity-30 disabled:hover:bg-transparent"
                  title="Redo"
              >
                  <RedoIcon className="w-6 h-6" />
              </button>
              
              <div className="h-6 w-px bg-white/10 mx-2"></div>

              {canUndo && (
                <button 
                    onMouseDown={() => setIsComparing(true)}
                    onMouseUp={() => setIsComparing(false)}
                    onMouseLeave={() => setIsComparing(false)}
                    onTouchStart={() => setIsComparing(true)}
                    onTouchEnd={() => setIsComparing(false)}
                    disabled={loadingTab !== null}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-[#EDEBE4] hover:text-white hover:bg-white/10 rounded-xl transition-all disabled:opacity-50"
                >
                    <EyeIcon className="w-5 h-5" />
                    <span className="hidden sm:inline">Compare</span>
                </button>
              )}

              <div className="h-6 w-px bg-white/10 mx-2"></div>

              <button 
                  onClick={handleReset}
                  disabled={!canUndo || loadingTab !== null}
                  className="px-4 py-2 text-sm font-medium text-[#63A798] hover:text-[#50FFE5] transition-colors disabled:opacity-50"
                >
                  Reset
              </button>
              <button 
                  onClick={handleUploadNew}
                  disabled={loadingTab !== null}
                  className="px-4 py-2 text-sm font-medium text-[#E96693] hover:text-white transition-colors disabled:opacity-50"
              >
                  New Image
              </button>

              <div className="ml-2">
                 <button 
                    onClick={handleDownload}
                    disabled={loadingTab !== null}
                    className="bg-[#50FFE5] text-[#03110F] font-bold py-2.5 px-6 rounded-xl shadow-lg shadow-[#50FFE5]/20 hover:shadow-[#50FFE5]/40 hover:-translate-y-0.5 active:translate-y-0 transition-all text-sm disabled:opacity-50 disabled:bg-gray-600 disabled:shadow-none"
                >
                    Download
                </button>
              </div>
          </div>
        </div>
        
        {/* Editor Panel (Right) */}
        <div className="w-full lg:w-1/3 flex flex-col gap-6">
             {/* Tool Selection Grid */}
             <div className="bg-black/30 backdrop-blur-xl border border-white/10 rounded-3xl p-6">
                <h3 className="text-sm font-bold text-[#63A798] uppercase tracking-widest mb-4 flex items-center gap-2">
                    <SparkleIcon className="w-4 h-4"/> Tools
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-2">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            disabled={loadingTab !== null}
                            className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-200 gap-2 border ${
                                activeTab === tab.id 
                                ? 'bg-[#267364]/40 border-[#50FFE5] text-[#50FFE5] shadow-[0_0_15px_rgba(80,255,229,0.15)]' 
                                : 'bg-white/5 border-transparent text-[#96D6C9] hover:bg-white/10 hover:text-white'
                            } disabled:opacity-30`}
                        >
                            {tab.icon && <tab.icon className="w-5 h-5" />}
                            <span className="text-xs font-medium">{tab.name}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Active Tool Control Panel */}
            <div className="bg-black/30 backdrop-blur-xl border border-white/10 rounded-3xl p-6 flex-grow min-h-[400px]">
                <h3 className="text-xl font-heading text-[#EDEBE4] tracking-wide mb-6 border-b border-white/5 pb-4">
                    {tabs.find(t => t.id === activeTab)?.name} Config
                </h3>

                <div className="w-full">
                    {activeTab === 'retouch' && (
                        <div className="flex flex-col items-center gap-6">
                            <div className="w-full text-center">
                                <p className="text-sm text-[#96D6C9] mb-4">
                                    {editHotspot ? 'Target selected. Describe your edit.' : 'Tap on the image to select an area.'}
                                </p>
                            </div>
                            
                            <form onSubmit={(e) => { e.preventDefault(); handleGenerate(); }} className="w-full flex flex-col items-center gap-4">
                                {/* Reference Image Upload */}
                                {editHotspot && (
                                    <div className="w-full flex flex-col gap-2">
                                        <label className="text-xs font-bold text-[#63A798] uppercase">Reference (Optional)</label>
                                        <label htmlFor="retouch-image-upload" className={`relative w-full h-20 border border-dashed border-[#63A798]/50 rounded-xl flex flex-col items-center justify-center text-[#63A798] transition-colors hover:border-[#50FFE5] hover:text-[#50FFE5] bg-black/20 ${loadingTab ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'} ${retouchImagePreview ? 'p-1' : ''}`}>
                                            {!retouchImagePreview ? (
                                            <div className="flex items-center gap-2">
                                                <UploadIcon className="w-4 h-4" />
                                                <span className="text-xs font-medium">Upload source image</span>
                                            </div>
                                            ) : (
                                            <div className="relative w-full h-full">
                                                <img src={retouchImagePreview} alt="Reference Preview" className="w-full h-full object-cover rounded-lg opacity-80" />
                                                <button 
                                                    type="button"
                                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setRetouchImage(null); }}
                                                    className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 hover:bg-[#E96693]"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                                </button>
                                            </div>
                                            )}
                                        </label>
                                        <input
                                            id="retouch-image-upload"
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={(e) => e.target.files && setRetouchImage(e.target.files[0])}
                                            disabled={loadingTab !== null}
                                        />
                                    </div>
                                )}

                                <div className="w-full space-y-2">
                                    <label className="text-xs font-bold text-[#63A798] uppercase">Prompt</label>
                                    <input
                                        data-tour-id="prompt-input"
                                        type="text"
                                        value={prompt}
                                        onChange={(e) => setPrompt(e.target.value)}
                                        placeholder={editHotspot ? (retouchImage ? "Describe placement..." : "e.g., 'change shirt to blue'") : "Select a point first"}
                                        className="w-full bg-black/20 border border-white/10 text-[#EDEBE4] rounded-xl p-4 text-sm focus:ring-1 focus:ring-[#50FFE5] focus:border-[#50FFE5] focus:outline-none transition disabled:cursor-not-allowed disabled:opacity-50 placeholder-white/20"
                                        disabled={loadingTab !== null || !editHotspot}
                                    />
                                </div>

                                {loadingTab === 'retouch' ? (
                                    <div className="w-full flex items-center justify-center bg-[#267364]/20 text-[#50FFE5] font-semibold py-4 px-6 text-sm rounded-xl border border-[#267364]/50">
                                        <Spinner className="h-5 w-5 mr-2" />
                                        Processing...
                                    </div>
                                ) : (
                                    <button 
                                        data-tour-id="generate-button"
                                        type="submit"
                                        className="w-full bg-gradient-to-r from-[#E96693] to-[#50FFE5] text-white font-bold py-4 px-6 text-sm rounded-xl transition-all duration-300 shadow-lg shadow-[#50FFE5]/20 hover:shadow-[#50FFE5]/40 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none"
                                        disabled={loadingTab !== null || !prompt.trim() || !editHotspot}
                                    >
                                        Generate Edit
                                    </button>
                                )}
                            </form>
                        </div>
                    )}
                    {activeTab === 'character' && (
                        <CharacterPanel
                            onGenerateCharacterFromImageAndText={handleGenerateCharacterFromImageAndText}
                            onRotateCharacter={handleRotateCharacter}
                            isLoading={loadingTab === 'character'}
                            isHotspotSelected={!!editHotspot}
                        />
                    )}
                    {activeTab === 'harmonize' && (
                        <HarmonizePanel
                            onApplyHarmonize={handleApplyHarmonize}
                            onDoTheMagic={handleDoTheMagic}
                            isLoading={loadingTab === 'harmonize'}
                        />
                    )}
                    {activeTab === 'crop' && <CropPanel onApplyCrop={handleApplyCrop} onSetAspect={setAspect} isLoading={loadingTab !== null} isCropping={!!completedCrop?.width && completedCrop.width > 0} />}
                    {activeTab === 'resize' && (
                        <ResizePanel
                            onApplyResize={handleApplyResize}
                            isLoading={loadingTab !== null}
                            originalWidth={imgRef.current?.naturalWidth ?? 0}
                            originalHeight={imgRef.current?.naturalHeight ?? 0}
                        />
                    )}
                    {activeTab === 'adjust' && <AdjustmentPanel onApplyAdjustment={handleApplyAdjustment} isLoading={loadingTab === 'adjust'} />}
                    {activeTab === 'filters' && <FilterPanel onApplyFilter={handleApplyFilter} isLoading={loadingTab === 'filters'} />}
                    {activeTab === 'variations' && (
                        <VariationsPanel 
                            onGenerateVariations={handleGenerateVariations}
                            onApplyVariation={handleApplyVariation}
                            variations={variations}
                            selectedVariationIndex={selectedVariationIndex}
                            onSelectVariation={setSelectedVariationIndex}
                            isLoading={loadingTab === 'variations'}
                        />
                    )}
                    {activeTab === 'infographics' && (
                        <InfographicsPanel 
                            onApplyInfographic={handleApplyInfographic} 
                            isLoading={loadingTab === 'infographics'} 
                            isHotspotSelected={!!editHotspot}
                        />
                    )}
                    {activeTab === 'animate' && <AnimatePanel onGenerateAnimation={handleGenerateAnimation} isLoading={loadingTab === 'animate'} statusMessage={animationStatusMessage} />}
                </div>
            </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="min-h-screen text-[#EDEBE4] flex flex-col font-body bg-fixed">
      <Header 
        showBackButton={!!currentImage || view !== 'start'} 
        onBackToHome={() => {
            if (currentImage) handleUploadNew();
            else setView('start');
        }}
        onNavClick={(viewName) => {
            handleUploadNew(); // Reset editor state when changing main views
            setView(viewName);
        }}
        currentView={view}
        credits={isPro ? '∞' : credits}
        isPro={isPro}
      />
      <main className={`flex-grow w-full max-w-[1800px] mx-auto px-4 pb-8 md:px-8 flex justify-center ${currentImage ? 'items-start' : 'items-center'}`}>
        {renderContent()}
      </main>
      {isTourActive && <GuidedTour onEndTour={handleEndTour} />}
      {showLimitModal && <UsageLimitModal onClose={() => setShowLimitModal(false)} onUpgrade={() => { setShowLimitModal(false); setView('pricing'); }} />}
    </div>
  );
};

export default App;
