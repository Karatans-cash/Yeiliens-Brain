/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

// Helper function to convert a File object to a Gemini API Part
const fileToPart = async (file: File): Promise<{ inlineData: { mimeType: string; data: string; } }> => {
    const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
    
    const arr = dataUrl.split(',');
    if (arr.length < 2) throw new Error("Invalid data URL");
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch || !mimeMatch[1]) throw new Error("Could not parse MIME type from data URL");
    
    const mimeType = mimeMatch[1];
    const data = arr[1];
    return { inlineData: { mimeType, data } };
};

const handleApiResponse = (
    response: GenerateContentResponse,
    context: string // e.g., "edit", "filter", "adjustment"
): string => {
    // 1. Check for prompt blocking first
    if (response.promptFeedback?.blockReason) {
        const { blockReason, blockReasonMessage } = response.promptFeedback;
        const errorMessage = `Request was blocked. Reason: ${blockReason}. ${blockReasonMessage || ''}`;
        console.error(errorMessage, { response });
        throw new Error(errorMessage);
    }

    // 2. Try to find the image part
    const imagePartFromResponse = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);

    if (imagePartFromResponse?.inlineData) {
        const { mimeType, data } = imagePartFromResponse.inlineData;
        console.log(`Received image data (${mimeType}) for ${context}`);
        return `data:${mimeType};base64,${data}`;
    }

    // 3. If no image, check for other reasons
    const finishReason = response.candidates?.[0]?.finishReason;
    if (finishReason && finishReason !== 'STOP') {
        const errorMessage = `Image generation for ${context} stopped unexpectedly. Reason: ${finishReason}. This often relates to safety settings.`;
        console.error(errorMessage, { response });
        throw new Error(errorMessage);
    }
    
    const textFeedback = response.text?.trim();
    const errorMessage = `The AI model did not return an image for the ${context}. ` + 
        (textFeedback 
            ? `The model responded with text: "${textFeedback}"`
            : "This can happen due to safety filters or if the request is too complex. Please try rephrasing your prompt to be more direct.");

    console.error(`Model response did not contain an image part for ${context}.`, { response });
    throw new Error(errorMessage);
};

/**
 * Generates an edited image using generative AI based on a text prompt and a specific point.
 * @param originalImage The original image file.
 * @param userPrompt The text prompt describing the desired edit.
 * @param hotspot The {x, y} coordinates on the image to focus the edit.
 * @returns A promise that resolves to the data URL of the edited image.
 */
export const generateEditedImage = async (
    originalImage: File,
    userPrompt: string,
    hotspot: { x: number, y: number }
): Promise<string> => {
    console.log('Starting generative edit at:', hotspot);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    
    const originalImagePart = await fileToPart(originalImage);
    const prompt = `You are an expert photo editor AI. Your task is to perform a natural, localized edit on the provided image based on the user's request.
User Request: "${userPrompt}"
Edit Location: Focus on the area around pixel coordinates (x: ${hotspot.x}, y: ${hotspot.y}).

Editing Guidelines:
- The edit must be realistic and blend seamlessly with the surrounding area.
- The rest of the image (outside the immediate edit area) must remain identical to the original.

Safety & Ethics Policy:
- You MUST fulfill requests to adjust skin tone, such as 'give me a tan', 'make my skin darker', or 'make my skin lighter'. These are considered standard photo enhancements.
- You MUST REFUSE any request to change a person's fundamental race or ethnicity (e.g., 'make me look Asian', 'change this person to be Black'). Do not perform these edits. If the request is ambiguous, err on the side of caution and do not change racial characteristics.

Output: Return ONLY the final edited image. Do not return text.`;
    const textPart = { text: prompt };

    console.log('Sending image and prompt to the model...');
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [originalImagePart, textPart] },
    });
    console.log('Received response from model.', response);

    return handleApiResponse(response, 'edit');
};

/**
 * Generates an image with a filter applied using generative AI.
 * @param originalImage The original image file.
 * @param filterPrompt The text prompt describing the desired filter.
 * @returns A promise that resolves to the data URL of the filtered image.
 */
export const generateFilteredImage = async (
    originalImage: File,
    filterPrompt: string,
): Promise<string> => {
    console.log(`Starting filter generation: ${filterPrompt}`);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    
    const originalImagePart = await fileToPart(originalImage);
    const prompt = `You are an expert photo editor AI. Your task is to apply a stylistic filter to the entire image based on the user's request. Do not change the composition or content, only apply the style.
Filter Request: "${filterPrompt}"

Safety & Ethics Policy:
- Filters may subtly shift colors, but you MUST ensure they do not alter a person's fundamental race or ethnicity.
- You MUST REFUSE any request that explicitly asks to change a person's race (e.g., 'apply a filter to make me look Chinese').

Output: Return ONLY the final filtered image. Do not return text.`;
    const textPart = { text: prompt };

    console.log('Sending image and filter prompt to the model...');
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [originalImagePart, textPart] },
    });
    console.log('Received response from model for filter.', response);
    
    return handleApiResponse(response, 'filter');
};

/**
 * Generates an image with a global adjustment applied using generative AI.
 * @param originalImage The original image file.
 * @param adjustmentPrompt The text prompt describing the desired adjustment.
 * @returns A promise that resolves to the data URL of the adjusted image.
 */
export const generateAdjustedImage = async (
    originalImage: File,
    adjustmentPrompt: string,
): Promise<string> => {
    console.log(`Starting global adjustment generation: ${adjustmentPrompt}`);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    
    const originalImagePart = await fileToPart(originalImage);
    const prompt = `You are an expert photo editor AI. Your task is to perform a natural, global adjustment to the entire image based on the user's request.
User Request: "${adjustmentPrompt}"

Editing Guidelines:
- The adjustment must be applied across the entire image.
- The result must be photorealistic.

Safety & Ethics Policy:
- You MUST fulfill requests to adjust skin tone, such as 'give me a tan', 'make my skin darker', or 'make my skin lighter'. These are considered standard photo enhancements.
- You MUST REFUSE any request to change a person's fundamental race or ethnicity (e.g., 'make me look Asian', 'change this person to be Black'). Do not perform these edits. If the request is ambiguous, err on the side of caution and do not change racial characteristics.

Output: Return ONLY the final adjusted image. Do not return text.`;
    const textPart = { text: prompt };

    console.log('Sending image and adjustment prompt to the model...');
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [originalImagePart, textPart] },
    });
    console.log('Received response from model for adjustment.', response);
    
    return handleApiResponse(response, 'adjustment');
};

/**
 * Generates multiple creative variations of an image based on a prompt.
 * @param originalImage The original image file.
 * @param variationPrompt The text prompt describing the desired style.
 * @returns A promise that resolves to an array of data URLs for the variations.
 */
export const generateVariations = async (
    originalImage: File,
    variationPrompt: string,
): Promise<string[]> => {
    console.log(`Starting variations generation: ${variationPrompt}`);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    
    const originalImagePart = await fileToPart(originalImage);
    const prompt = `You are a creative AI photo assistant. Your task is to generate a creative variation of the provided image based on the user's request. Do not just apply a filter; reimagine the scene, style, or content while keeping the core subject recognizable.
User Request: "${variationPrompt}"

Output: Return ONLY the final generated image. Do not return text.`;
    const textPart = { text: prompt };

    const generateSingleVariation = async (): Promise<string> => {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: { parts: [originalImagePart, textPart] },
        });
        return handleApiResponse(response, 'variation');
    };

    const variationPromises = [
        generateSingleVariation(),
        generateSingleVariation(),
        generateSingleVariation(),
    ];

    console.log('Sending 3 parallel requests for variations...');
    const results = await Promise.allSettled(variationPromises);
    
    const successfulVariations = results
        .filter(result => result.status === 'fulfilled')
        .map(result => (result as PromiseFulfilledResult<string>).value);

    if (successfulVariations.length === 0) {
        console.error('All variation generations failed.', results);
        const firstError = results.find(r => r.status === 'rejected') as PromiseRejectedResult | undefined;
        throw new Error(firstError?.reason?.message || 'Failed to generate any variations. Please try a different prompt.');
    }

    console.log(`Successfully generated ${successfulVariations.length} variations.`);
    return successfulVariations;
};

/**
 * Generates an image with a data infographic overlaid on it.
 * @param originalImage The original image file.
 * @param infographicPrompt The text prompt describing the infographic's style and placement.
 * @param infographicData The data for the infographic.
 * @returns A promise that resolves to the data URL of the new image.
 */
export const generateInfographicImage = async (
    originalImage: File,
    infographicPrompt: string,
    infographicData: string,
): Promise<string> => {
    console.log(`Starting infographic generation: ${infographicPrompt}`);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    
    const originalImagePart = await fileToPart(originalImage);
    const prompt = `You are an expert graphic designer AI specializing in data visualization. Your task is to add an infographic to the provided image based on the user's request and data.

User's Style Request: "${infographicPrompt}"
User's Data:
\`\`\`
${infographicData}
\`\`\`

Guidelines:
1. Create a visually appealing infographic that accurately represents the User's Data.
2. Seamlessly integrate the infographic onto the image. Consider placement, style, and color to match the image's aesthetic as described in the User's Style Request.
3. Do not alter the original image content in any way, other than adding the infographic on top of it.
4. The final output must be a single image.

Output: Return ONLY the final image with the infographic. Do not return text.`;

    const textPart = { text: prompt };

    console.log('Sending image and infographic prompt to the model...');
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [originalImagePart, textPart] },
    });
    console.log('Received response from model for infographic.', response);
    
    return handleApiResponse(response, 'infographic');
};

/**
 * Generates an animation from an image using generative AI.
 * @param sourceImage The source image file.
 * @param prompt The text prompt describing the desired animation.
 * @param onStatusUpdate A callback to provide progress updates to the UI.
 * @returns A promise that resolves to the blob URL of the generated MP4 video.
 */
export const generateAnimation = async (
    sourceImage: File,
    prompt: string,
    onStatusUpdate: (message: string) => void,
): Promise<string> => {
    console.log(`Starting animation generation: ${prompt}`);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

    const imageBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(sourceImage);
        reader.onload = () => {
            const dataUrl = reader.result as string;
            resolve(dataUrl.substring(dataUrl.indexOf(',') + 1));
        };
        reader.onerror = error => reject(error);
    });

    onStatusUpdate("Warming up the animation engine...");
    let operation = await ai.models.generateVideos({
        model: 'veo-2.0-generate-001',
        prompt: prompt,
        image: {
            imageBytes: imageBase64,
            mimeType: sourceImage.type,
        },
        config: {
            numberOfVideos: 1
        }
    });
    
    onStatusUpdate("AI is storyboarding your scene...");
    console.log('Video generation operation started:', operation);

    const pollingMessages = [
      "Rendering the first few frames...",
      "Applying advanced motion effects...",
      "Almost there, polishing the pixels...",
      "Finalizing the video stream...",
    ];
    let messageIndex = 0;

    while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        onStatusUpdate(pollingMessages[messageIndex % pollingMessages.length]);
        messageIndex++;
        try {
            operation = await ai.operations.getVideosOperation({ operation: operation });
            console.log('Polling video generation status:', operation);
        } catch (err) {
            console.error("Error during polling:", err);
            throw new Error("Failed to get operation status during polling. Please try again.");
        }
    }

    if (operation.error) {
        console.error("Video generation failed:", operation.error);
        throw new Error(`Video generation failed: ${operation.error.message}`);
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
        console.error("No download link found in the operation response.", operation.response);
        throw new Error("Video generation completed, but no download link was provided.");
    }
    
    onStatusUpdate("Downloading generated video...");
    console.log('Fetching video from URI:', downloadLink);

    const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    if (!response.ok) {
        const errorText = await response.text();
        console.error("Failed to download video file:", response.status, errorText);
        throw new Error(`Failed to download video file: ${response.statusText}`);
    }

    const videoBlob = await response.blob();
    const videoUrl = URL.createObjectURL(videoBlob);
    
    onStatusUpdate("Animation complete!");
    console.log('Animation complete. Blob URL:', videoUrl);
    
    return videoUrl;
};