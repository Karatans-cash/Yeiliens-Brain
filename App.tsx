/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import React, { useState, useCallback, useRef, useEffect } from 'react';
import ReactCrop, { type Crop, type PixelCrop } from 'react-image-crop';
import { generateEditedImage, generateFilteredImage, generateAdjustedImage, generateVariations, generateInfographicImage, generateAnimation } from './services/geminiService';
import Header from './components/Header';
import Spinner from './components/Spinner';
import FilterPanel from './components/FilterPanel';
import AdjustmentPanel from './components/AdjustmentPanel';
import CropPanel from './components/CropPanel';
import VariationsPanel from './components/VariationsPanel';
import InfographicsPanel from './components/InfographicsPanel';
import AnimatePanel from './components/AnimatePanel';
import { UndoIcon, RedoIcon, EyeIcon, FilmIcon, UserIcon, SparkleIcon } from './components/icons';
import StartScreen from './components/StartScreen';

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

type Tab = 'retouch' | 'adjust' | 'filters' | 'crop' | 'variations' | 'infographics' | 'animate';

const App: React.FC = () => {
  const [history, setHistory] = useState<File[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [prompt, setPrompt] = useState<string>('');
  const [loadingTab, setLoadingTab] = useState<Tab | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editHotspot, setEditHotspot] = useState<{ x: number, y: number } | null>(null);
  const [displayHotspot, setDisplayHotspot] = useState<{ x: number, y: number } | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('retouch');
  
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [aspect, setAspect] = useState<number | undefined>();
  const [isComparing, setIsComparing] = useState<boolean>(false);
  
  const [variations, setVariations] = useState<string[]>([]);
  const [selectedVariationIndex, setSelectedVariationIndex] = useState<number | null>(null);
  
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [animationStatusMessage, setAnimationStatusMessage] = useState<string>('');
  
  const imgRef = useRef<HTMLImageElement>(null);

  const currentImage = history[historyIndex] ?? null;
  const originalImage = history[0] ?? null;

  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);

  // Effect to create and revoke object URLs safely for the current image
  useEffect(() => {
    if (currentImage) {
      const url = URL.createObjectURL(currentImage);
      setCurrentImageUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setCurrentImageUrl(null);
    }
  }, [currentImage]);
  
  // Effect to create and revoke object URLs safely for the original image
  useEffect(() => {
    if (originalImage) {
      const url = URL.createObjectURL(originalImage);
      setOriginalImageUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setOriginalImageUrl(null);
    }
  }, [originalImage]);


  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const addImageToHistory = useCallback((newImageFile: File) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newImageFile);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    // Reset transient states after an action
    setCrop(undefined);
    setCompletedCrop(undefined);
    setVariations([]);
    setSelectedVariationIndex(null);
    setVideoUrl(null);
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
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!currentImage || loadingTab) return;
    
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
        const editedImageUrl = await generateEditedImage(currentImage, prompt, editHotspot);
        const newImageFile = dataURLtoFile(editedImageUrl, `edited-${Date.now()}.png`);
        addImageToHistory(newImageFile);
        setEditHotspot(null);
        setDisplayHotspot(null);
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(`Failed to generate the image. ${errorMessage}`);
        console.error(err);
    } finally {
        setLoadingTab(null);
    }
  }, [currentImage, prompt, editHotspot, addImageToHistory, loadingTab]);
  
  const handleApplyFilter = useCallback(async (filterPrompt: string) => {
    if (!currentImage || loadingTab) return;
    
    setLoadingTab('filters');
    setError(null);
    
    try {
        const filteredImageUrl = await generateFilteredImage(currentImage, filterPrompt);
        const newImageFile = dataURLtoFile(filteredImageUrl, `filtered-${Date.now()}.png`);
        addImageToHistory(newImageFile);
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(`Failed to apply the filter. ${errorMessage}`);
        console.error(err);
    } finally {
        setLoadingTab(null);
    }
  }, [currentImage, addImageToHistory, loadingTab]);
  
  const handleApplyAdjustment = useCallback(async (adjustmentPrompt: string) => {
    if (!currentImage || loadingTab) return;
    
    setLoadingTab('adjust');
    setError(null);
    
    try {
        const adjustedImageUrl = await generateAdjustedImage(currentImage, adjustmentPrompt);
        const newImageFile = dataURLtoFile(adjustedImageUrl, `adjusted-${Date.now()}.png`);
        addImageToHistory(newImageFile);
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(`Failed to apply the adjustment. ${errorMessage}`);
        console.error(err);
    } finally {
        setLoadingTab(null);
    }
  }, [currentImage, addImageToHistory, loadingTab]);

  const handleGenerateVariations = useCallback(async (variationPrompt: string) => {
    if (!currentImage || loadingTab) return;

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
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to generate variations. ${errorMessage}`);
      console.error(err);
    } finally {
      setLoadingTab(null);
    }
  }, [currentImage, loadingTab]);
  
  const handleApplyVariation = useCallback(() => {
    if (selectedVariationIndex === null || !variations[selectedVariationIndex]) {
      setError('Please select a variation to apply.');
      return;
    }
    const newImageFile = dataURLtoFile(variations[selectedVariationIndex], `variation-${Date.now()}.png`);
    addImageToHistory(newImageFile);
  }, [selectedVariationIndex, variations, addImageToHistory]);

  const handleApplyInfographic = useCallback(async (infographicPrompt: string, infographicData: string) => {
    if (!currentImage || loadingTab) return;

    setLoadingTab('infographics');
    setError(null);

    try {
        const newImageUrl = await generateInfographicImage(currentImage, infographicPrompt, infographicData);
        const newImageFile = dataURLtoFile(newImageUrl, `infographic-${Date.now()}.png`);
        addImageToHistory(newImageFile);
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(`Failed to generate the infographic. ${errorMessage}`);
        console.error(err);
    } finally {
        setLoadingTab(null);
    }
  }, [currentImage, addImageToHistory, loadingTab]);

  const handleGenerateAnimation = useCallback(async (animationPrompt: string) => {
    if (!currentImage || loadingTab) return;

    setLoadingTab('animate');
    setError(null);
    setVideoUrl(null);

    try {
        const generatedVideoUrl = await generateAnimation(
          currentImage, 
          animationPrompt,
          (message) => setAnimationStatusMessage(message)
        );
        setVideoUrl(generatedVideoUrl);
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(`Failed to generate the animation. ${errorMessage}`);
        console.error(err);
    } finally {
        setLoadingTab(null);
        setAnimationStatusMessage('');
    }
  }, [currentImage, loadingTab]);


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

  }, [completedCrop, addImageToHistory]);

  const handleUndo = useCallback(() => {
    if (canUndo) {
      setHistoryIndex(historyIndex - 1);
      setEditHotspot(null);
      setDisplayHotspot(null);
      setVariations([]);
      setSelectedVariationIndex(null);
      setVideoUrl(null);
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
    if (activeTab !== 'retouch' || videoUrl || loadingTab) return;
    
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

  const renderContent = () => {
    if (error) {
       return (
           <div className="text-center animate-fade-in bg-[#E96693]/10 border border-[#E96693]/20 p-8 rounded-lg max-w-2xl mx-auto flex flex-col items-center gap-4">
            <h2 className="text-2xl font-bold text-[#E96693]">An Error Occurred</h2>
            <p className="text-md text-[#E96693]/80">{error}</p>
            <button
                onClick={() => setError(null)}
                className="bg-[#E96693] hover:bg-opacity-80 text-white font-bold py-2 px-6 rounded-lg text-md transition-colors"
              >
                Try Again
            </button>
          </div>
        );
    }
    
    if (!currentImageUrl) {
      return <StartScreen onFileSelect={handleFileSelect} />;
    }

    if (videoUrl) {
      return (
        <div className="w-full max-w-4xl mx-auto flex flex-col items-center gap-6 animate-fade-in">
          <video src={videoUrl} controls autoPlay loop className="w-full h-auto object-contain max-h-[70vh] rounded-xl shadow-2xl" />
          <div className="flex items-center gap-4">
            <button
              onClick={() => setVideoUrl(null)}
              className="text-center bg-white/10 border border-[#63A798]/50 text-[#EDEBE4] font-semibold py-3 px-5 rounded-md transition-all duration-200 ease-in-out hover:bg-white/20 hover:border-white/30 active:scale-95 text-base"
            >
              Back to Editor
            </button>
            <button 
                onClick={handleDownload}
                className="bg-gradient-to-br from-[#63A798] to-[#96D6C9] text-[#03110F] font-bold py-3 px-5 rounded-md transition-all duration-300 ease-in-out shadow-lg shadow-[#96D6C9]/20 hover:shadow-xl hover:shadow-[#96D6C9]/40 hover:-translate-y-px active:scale-95 active:shadow-inner text-base"
            >
                Download Video
            </button>
          </div>
        </div>
      );
    }

    const imageDisplay = (
      <div className="relative">
        {/* Base image is the original, always at the bottom */}
        {originalImageUrl && (
            <img
                key={originalImageUrl}
                src={originalImageUrl}
                alt="Original"
                className="w-full h-auto object-contain max-h-[70vh] rounded-xl pointer-events-none"
            />
        )}
        {/* The current image is an overlay that fades in/out for comparison */}
        <img
            ref={imgRef}
            key={currentImageUrl}
            src={currentImageUrl}
            alt="Current"
            onClick={handleImageClick}
            className={`absolute top-0 left-0 w-full h-auto object-contain max-h-[70vh] rounded-xl transition-opacity duration-200 ease-in-out ${isComparing ? 'opacity-0' : 'opacity-100'} ${activeTab === 'retouch' && !loadingTab ? 'cursor-crosshair' : ''}`}
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
        className="w-full h-auto object-contain max-h-[70vh] rounded-xl"
      />
    );


    return (
      <div className="w-full flex flex-col md:flex-row gap-8 animate-fade-in">
        {/* Main Content Area (Left) */}
        <div className="w-full md:w-2/3 flex flex-col gap-6">
          <div className="relative w-full shadow-2xl rounded-xl overflow-hidden bg-black/20 flex items-center justify-center">
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

              {displayHotspot && !loadingTab && activeTab === 'retouch' && (
                  <div 
                      className="absolute rounded-full w-6 h-6 bg-[#50FFE5]/50 border-2 border-white pointer-events-none -translate-x-1/2 -translate-y-1/2 z-10"
                      style={{ left: `${displayHotspot.x}px`, top: `${displayHotspot.y}px` }}
                  >
                      <div className="absolute inset-0 rounded-full w-6 h-6 animate-ping bg-[#50FFE5]"></div>
                  </div>
              )}
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-3">
              <button 
                  onClick={handleUndo}
                  disabled={!canUndo || loadingTab !== null}
                  className="flex items-center justify-center text-center bg-white/10 border border-[#63A798]/50 text-[#EDEBE4] font-semibold py-3 px-5 rounded-md transition-all duration-200 ease-in-out hover:bg-white/20 hover:border-white/30 active:scale-95 text-base disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-white/5"
                  aria-label="Undo last action"
              >
                  <UndoIcon className="w-5 h-5 mr-2" />
                  Undo
              </button>
              <button 
                  onClick={handleRedo}
                  disabled={!canRedo || loadingTab !== null}
                  className="flex items-center justify-center text-center bg-white/10 border border-[#63A798]/50 text-[#EDEBE4] font-semibold py-3 px-5 rounded-md transition-all duration-200 ease-in-out hover:bg-white/20 hover:border-white/30 active:scale-95 text-base disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-white/5"
                  aria-label="Redo last action"
              >
                  <RedoIcon className="w-5 h-5 mr-2" />
                  Redo
              </button>
              
              <div className="h-6 w-px bg-[#267364] mx-1 hidden sm:block"></div>

              {canUndo && (
                <button 
                    onMouseDown={() => setIsComparing(true)}
                    onMouseUp={() => setIsComparing(false)}
                    onMouseLeave={() => setIsComparing(false)}
                    onTouchStart={() => setIsComparing(true)}
                    onTouchEnd={() => setIsComparing(false)}
                    disabled={loadingTab !== null}
                    className="flex items-center justify-center text-center bg-white/10 border border-[#63A798]/50 text-[#EDEBE4] font-semibold py-3 px-5 rounded-md transition-all duration-200 ease-in-out hover:bg-white/20 hover:border-white/30 active:scale-95 text-base disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Press and hold to see original image"
                >
                    <EyeIcon className="w-5 h-5 mr-2" />
                    Compare
                </button>
              )}

              <button 
                  onClick={handleReset}
                  disabled={!canUndo || loadingTab !== null}
                  className="text-center bg-transparent border border-[#63A798]/50 text-[#EDEBE4] font-semibold py-3 px-5 rounded-md transition-all duration-200 ease-in-out hover:bg-white/10 hover:border-white/30 active:scale-95 text-base disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-transparent"
                >
                  Reset
              </button>
              <button 
                  onClick={handleUploadNew}
                  disabled={loadingTab !== null}
                  className="text-center bg-white/10 border border-[#63A798]/50 text-[#EDEBE4] font-semibold py-3 px-5 rounded-md transition-all duration-200 ease-in-out hover:bg-white/20 hover:border-white/30 active:scale-95 text-base disabled:opacity-50 disabled:cursor-not-allowed"
              >
                  Upload New
              </button>

              <button 
                  onClick={handleDownload}
                  disabled={loadingTab !== null}
                  className="flex-grow sm:flex-grow-0 ml-auto bg-gradient-to-br from-[#63A798] to-[#96D6C9] text-[#03110F] font-bold py-3 px-5 rounded-md transition-all duration-300 ease-in-out shadow-lg shadow-[#96D6C9]/20 hover:shadow-xl hover:shadow-[#96D6C9]/40 hover:-translate-y-px active:scale-95 active:shadow-inner text-base disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-800 disabled:to-gray-700"
              >
                  {videoUrl ? 'Download Video' : 'Download Image'}
              </button>
          </div>
        </div>
        
        {/* Editor Panel (Right) */}
        <div className="w-full md:w-1/3 flex flex-col gap-4 bg-[#267364]/50 border border-[#63A798]/50 rounded-lg p-6 backdrop-blur-sm">
            <h3 className="text-xl font-bold text-center text-[#EDEBE4] flex items-center justify-center gap-2"><SparkleIcon className="w-5 h-5 text-[#96D6C9]"/> Editor Panel</h3>
            <div className="w-full bg-[#03110F]/30 rounded-lg p-1.5 flex items-center justify-center gap-1.5">
              {(['retouch', 'adjust', 'filters', 'crop', 'variations', 'infographics', 'animate'] as Tab[]).map(tab => (
                   <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      disabled={loadingTab !== null}
                      className={`w-full capitalize font-semibold py-2.5 px-2 rounded-md transition-all duration-200 text-xs md:text-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                          activeTab === tab 
                          ? 'bg-gradient-to-br from-[#E96693] to-[#50FFE5] text-white shadow-md shadow-[#E96693]/30' 
                          : 'text-[#63A798] hover:text-[#EDEBE4] hover:bg-white/10'
                      }`}
                  >
                      {tab}
                  </button>
              ))}
            </div>
        
            <div className="w-full pt-2">
                {activeTab === 'retouch' && (
                    <div className="flex flex-col items-center gap-4">
                        <p className="text-md text-[#63A798]">
                            {editHotspot ? 'Great! Now describe your localized edit below.' : 'Click an area on the image to make a precise edit.'}
                        </p>
                        <form onSubmit={(e) => { e.preventDefault(); handleGenerate(); }} className="w-full flex flex-col items-center gap-2">
                            <input
                                type="text"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder={editHotspot ? "e.g., 'change my shirt color to blue'" : "First click a point on the image"}
                                className="flex-grow bg-[#03110F] border border-[#267364] text-[#EDEBE4] rounded-lg p-4 text-base focus:ring-2 focus:ring-[#50FFE5] focus:outline-none transition w-full disabled:cursor-not-allowed disabled:opacity-60"
                                disabled={loadingTab !== null || !editHotspot}
                            />
                            {loadingTab === 'retouch' ? (
                                <div className="w-full flex items-center justify-center bg-[#03110F]/80 text-white font-bold py-4 px-6 text-base rounded-lg border border-[#267364]">
                                    <Spinner className="h-6 w-6" />
                                </div>
                            ) : (
                                <button 
                                    type="submit"
                                    className="w-full bg-gradient-to-br from-[#E96693] to-[#50FFE5] text-white font-bold py-4 px-6 text-base rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-[#50FFE5]/20 hover:shadow-xl hover:shadow-[#50FFE5]/40 hover:-translate-y-px active:scale-95 active:shadow-inner disabled:from-gray-700 disabled:to-gray-800 disabled:text-gray-400 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none"
                                    disabled={loadingTab !== null || !prompt.trim() || !editHotspot}
                                >
                                    Generate
                                </button>
                            )}
                        </form>
                    </div>
                )}
                {activeTab === 'crop' && <CropPanel onApplyCrop={handleApplyCrop} onSetAspect={setAspect} isLoading={loadingTab !== null} isCropping={!!completedCrop?.width && completedCrop.width > 0} />}
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
                {activeTab === 'infographics' && <InfographicsPanel onApplyInfographic={handleApplyInfographic} isLoading={loadingTab === 'infographics'} />}
                {activeTab === 'animate' && <AnimatePanel onGenerateAnimation={handleGenerateAnimation} isLoading={loadingTab === 'animate'} statusMessage={animationStatusMessage} />}
            </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="min-h-screen text-[#EDEBE4] flex flex-col">
      <Header />
      <main className={`flex-grow w-full max-w-[1600px] mx-auto p-4 md:p-8 flex justify-center ${currentImage ? 'items-start' : 'items-center'}`}>
        {renderContent()}
      </main>
    </div>
  );
};

export default App;