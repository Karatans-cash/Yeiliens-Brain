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
 * Generates an image from a text prompt.
 * @param prompt The text prompt describing the desired image.
 * @param aspectRatio The desired aspect ratio (e.g., "1:1", "16:9", "9:16").
 * @returns A promise that resolves to the data URL of the generated image.
 */
export const generateImageFromText = async (
    prompt: string,
    aspectRatio: string = "1:1"
): Promise<string> => {
    console.log(`Starting text-to-image generation: ${prompt} with ratio ${aspectRatio}`);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    
    // Updated to use gemini-3-pro-image-preview (Nano Banana Pro)
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: { parts: [{ text: prompt }] },
        config: {
             imageConfig: { aspectRatio: aspectRatio }
        }
    });
    
    console.log('Received response from model for text-to-image.', response);
    
    // Reuse the existing handler which is built for GenerateContentResponse
    return handleApiResponse(response, 'text-to-image');
};

/**
 * Generates an image from one or more reference images and a text prompt (Image-to-Image).
 * @param referenceImages An array of source images to use as references.
 * @param prompt The text prompt describing the desired output.
 * @param aspectRatio The desired aspect ratio (e.g., "1:1", "16:9", "9:16").
 * @returns A promise that resolves to the data URL of the generated image.
 */
export const generateImageFromReference = async (
    referenceImages: File[],
    prompt: string,
    aspectRatio: string = "1:1"
): Promise<string> => {
    console.log(`Starting image-to-image generation with ${referenceImages.length} images: ${prompt} with ratio ${aspectRatio}`);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    
    const imageParts = await Promise.all(referenceImages.map(fileToPart));
    const textPart = { text: prompt };

    // Using gemini-3-pro-image-preview (Nano Banana Pro)
    // Supports multiple images + text input
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: { parts: [...imageParts, textPart] },
        config: {
             imageConfig: { aspectRatio: aspectRatio } 
        }
    });
    
    console.log('Received response from model for image-to-image.', response);
    
    return handleApiResponse(response, 'image-to-image');
};

/**
 * Generates an edited image using generative AI based on a text prompt, a specific point, and an optional reference image.
 * @param originalImage The original image file.
 * @param userPrompt The text prompt describing the desired edit.
 * @param hotspot The {x, y} coordinates on the image to focus the edit.
 * @param referenceImage Optional reference image to insert or blend.
 * @returns A promise that resolves to the data URL of the edited image.
 */
export const generateEditedImage = async (
    originalImage: File,
    userPrompt: string,
    hotspot: { x: number, y: number },
    referenceImage?: File
): Promise<string> => {
    console.log('Starting generative edit at:', hotspot, 'Reference image:', !!referenceImage);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    
    const originalImagePart = await fileToPart(originalImage);
    const parts: ({ text: string } | { inlineData: { mimeType: string; data: string } })[] = [originalImagePart];
    
    let prompt = "";

    if (referenceImage) {
        const referenceImagePart = await fileToPart(referenceImage);
        parts.push(referenceImagePart);
        
        prompt = `Task: Precision Object Insertion / Reference-Guided Inpainting.
Role: Expert Digital Compositor.

Input 1: Base Image (The Master Canvas).
Input 2: Reference Image (The Visual Asset).

User Instruction: "${userPrompt}"
Target Location: Centered around pixel coordinates (x: ${hotspot.x}, y: ${hotspot.y}) on the Base Image.

**STRICT COMPOSITION RULES:**
1.  **MASTER CANVAS AUTHORITY:** The Base Image determines the aspect ratio, perspective, lighting environment, and scene composition. You are strictly FORBIDDEN from altering the global structure, dimensions, or background details of Input 1 outside the edit zone.
2.  **ASSET ADAPTATION:** You must transform the Reference Image (Input 2) to fit *into* the scene of Input 1. Do not warp Input 1 to match Input 2.
3.  **ZERO HALLUCINATION:** Do not generate new objects unrelated to the instruction. Do not apply the Reference Image's background to the Base Image. Extract only the relevant subject/texture from the Reference Image.
4.  **SEAMLESS BLENDING:** Match the inserted object's shadows, color temperature, and blur to the Base Image's environment.

Output: Return ONLY the final edited image. Do not return text.`;

    } else {
        prompt = `You are an expert photo editor AI. Your task is to perform a natural, localized edit on the provided image based on the user's request.
User Request: "${userPrompt}"
Edit Location: Focus on the area around pixel coordinates (x: ${hotspot.x}, y: ${hotspot.y}).

Editing Guidelines:
- The edit must be realistic and blend seamlessly with the surrounding area.
- The rest of the image (outside the immediate edit area) must remain identical to the original.

Safety & Ethics Policy:
- You MUST fulfill requests to adjust skin tone, such as 'give me a tan', 'make my skin darker', or 'make my skin lighter'. These are considered standard photo enhancements.
- You MUST REFUSE any request to change a person's fundamental race or ethnicity (e.g., 'make me look Asian', 'change this person to be Black'). Do not perform these edits. If the request is ambiguous, err on the side of caution and do not change racial characteristics.

Output: Return ONLY the final edited image. Do not return text.`;
    }

    const textPart = { text: prompt };
    parts.push(textPart);

    console.log('Sending parts to the model...');
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: { parts: parts },
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
        model: 'gemini-3-pro-image-preview',
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
        model: 'gemini-3-pro-image-preview',
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
            model: 'gemini-3-pro-image-preview',
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
 * Generates an image with a data infographic, text overlay, or realistic graphic placement.
 * @param originalImage The original image file (background).
 * @param promptText The instruction for placement/style.
 * @param infographicData Optional text content to generate.
 * @param overlayImage Optional image file to overlay (logo, graphic).
 * @param hotspot Optional coordinate {x,y} to center the placement.
 * @returns A promise that resolves to the data URL of the new image.
 */
export const generateInfographicImage = async (
    originalImage: File,
    promptText: string,
    infographicData?: string,
    overlayImage?: File,
    hotspot?: { x: number, y: number }
): Promise<string> => {
    console.log(`Starting text/graphic generation. Overlay mode: ${!!overlayImage}, Hotspot:`, hotspot);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    
    const originalImagePart = await fileToPart(originalImage);
    const parts: any[] = [originalImagePart];
    let systemPrompt = "";
    
    const locationInstruction = hotspot 
        ? `Target Location: Centered strictly around pixel coordinates (x: ${hotspot.x}, y: ${hotspot.y}) on the Base Image.` 
        : "Target Location: Determine best placement based on the user's description or optimal composition.";

    if (overlayImage) {
        // --- MODE: ADD LOGO / TEXTURE OVERLAY ---
        const overlayPart = await fileToPart(overlayImage);
        parts.push(overlayPart);
        
        systemPrompt = `Task: Non-Destructive Texture Overlay / Decal Application.
Role: Expert Digital Compositor & Product Mockup Specialist.

Input 1: Base Image (The canvas).
Input 2: Overlay Graphic (The logo/sticker).

User Instruction: "${promptText}"
${locationInstruction}

**CRITICAL RULES FOR "STRICT MOCKUP" MODE:**
1.  **SACRED BACKGROUND:** The Base Image is immutable. You are strictly FORBIDDEN from redrawing, restyling, or changing the lighting/environment of Input 1. Every pixel outside the Target Location MUST remain identical.
2.  **TRANSPARENCY HANDLING:** Treat Input 2 as a die-cut sticker.
    *   If Input 2 is a PNG with transparency, respect the alpha channel.
    *   If Input 2 has a solid background (e.g., white or black), REMOVE THE BACKGROUND completely so only the logo/text remains.
    *   NEVER render the rectangular bounding box of the image file.
3.  **SURFACE INTEGRATION:** Warp the logo to follow the perspective, curvature, and roughness of the target surface (e.g., folds in fabric, curve of a bottle).
4.  **LIGHTING & BLENDING:** Apply lighting, shadows, and texture from Input 1 onto the logo (Multiply/Overlay blending). It must look like it belongs in the scene physically.

Output: Return the Base Image with the Overlay Graphic applied as a realistic print/decal.`;

    } else {
        // --- MODE: GENERATE TEXT / TYPOGRAPHY ---
        systemPrompt = `You are an expert graphic designer and typography specialist. Your task is to overlay text, typography, or informational graphics onto the provided image.

User's Style/Placement Request: "${promptText}"
${locationInstruction}
Text Content / Data to Include:
\`\`\`
${infographicData || ''}
\`\`\`

Guidelines:
1.  **Typography & Design:** Select fonts, colors, and styles that match the request.
2.  **Placement:** Position the text/graphics naturally at the Target Location.
3.  **Readability:** Ensure the text is legible against the background.
4.  **Integration:** The text should look like a high-quality design layer or a natural part of the scene.
5.  **Preservation:** Do not alter the original image content (people, background objects) other than adding the requested overlay.

Output: Return ONLY the final image with the text/graphics added. Do not return text.`;
    }

    parts.push({ text: systemPrompt });

    console.log('Sending image and prompt to the model...');
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: { parts: parts },
    });
    console.log('Received response from model for text/graphic.', response);
    
    return handleApiResponse(response, overlayImage ? 'graphic overlay' : 'text generation');
};

/**
 * Generates a new character based on a reference image and a text prompt, and inserts it into a background image.
 * @param originalImage The background image file.
 * @param characterImage The reference character image file.
 * @param userPrompt The text prompt describing the desired changes or pose for the character.
 * @param hotspot The {x, y} coordinates on the background image for placement.
 * @returns A promise that resolves to the data URL of the composited image.
 */
export const generateCharacterFromImageAndText = async (
    originalImage: File,
    characterImage: File,
    userPrompt: string,
    hotspot: { x: number, y: number }
): Promise<string> => {
    console.log(`Starting character generation from image and text at:`, hotspot);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

    const originalImagePart = await fileToPart(originalImage);
    const characterImagePart = await fileToPart(characterImage);

    // Enhanced prompt to prevent "double overlay" and ensure clean inpainting
    const prompt = `Task: Seamless Object Insertion / Inpainting.
Role: Expert Image Compositor and Digital Artist.

Input 1: Background Image (The main canvas).
Input 2: Reference Character (The source for character design/style).

User Instructions: "${userPrompt}"
Target Location: Centered around pixel coordinates (x: ${hotspot.x}, y: ${hotspot.y}) on the Background Image.

**STRICT COMPOSITING RULES:**
1.  **Preserve Background:** Do NOT overlay the Reference Image on top of the Background Image. Do NOT change the dimensions, aspect ratio, or details of the Background Image outside of the immediate Target Location. The room/environment must remain exactly the same.
2.  **Extract & Adapt:** Analyze the Reference Character to understand its design (appearance, colors, style). Then, GENERATE a new instance of this character at the Target Location.
3.  **Context Aware Integration:**
    *   If the user asks to put the character "in the monitor" or "on the screen", the character must look like a 2D digital image *displayed* on that screen (flat, potentially glowing), preserving the monitor's frame and perspective.
    *   If the user asks to put the character "on the chair" or "standing in the room", the character must look like a 3D object in that space, with correct perspective and shadows cast on the floor/furniture.
4.  **No Ghosting:** Ensure there is no "double exposure" or ghosting effect. The result should look like a single, cohesive photograph or artwork.

Output: Return ONLY the final composited image.`;

    const textPart = { text: prompt };

    console.log('Sending images and prompt to the model for character generation...');
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: { parts: [originalImagePart, characterImagePart, textPart] },
    });
    console.log('Received response from model for character insertion.', response);

    return handleApiResponse(response, 'character generation from image');
};

/**
 * Rotates (re-orients) a specific character in the image to face a new direction.
 * @param originalImage The original image.
 * @param hotspot The coordinates of the character.
 * @param direction The direction to face (e.g., "Left", "Right", "Back", "Front").
 * @param characterDescription Description to identify the character and optional expression/pose instructions.
 */
export const rotateCharacter = async (
    originalImage: File,
    hotspot: { x: number, y: number },
    direction: string,
    characterDescription: string
): Promise<string> => {
    console.log(`Starting character re-orientation: Face ${direction}, at ${hotspot.x},${hotspot.y}`);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    
    const originalImagePart = await fileToPart(originalImage);
    const prompt = `You are an expert photo editor AI. Your task is to change the facing direction and pose of a specific subject in the image.

Target Subject & Instructions: "${characterDescription}"
Location: Near pixel coordinates (x: ${hotspot.x}, y: ${hotspot.y}).
Desired Facing Direction: ${direction}.

Guidelines:
1. Accurately identify the subject described at the location.
2. Redraw the subject's pose naturally to face the new direction (${direction}).
3. Incorporate any specific expression or pose details requested in the description ("${characterDescription}").
4. Inpaint the background behind the subject if the new pose reveals previously hidden areas.
5. Blend the subject seamlessly into the scene (shadows, lighting).
6. Do not alter other parts of the image.

Output: Return ONLY the final edited image.`;

    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: { parts: [originalImagePart, { text: prompt }] },
    });
    
    return handleApiResponse(response, 'character rotation');
}

/**
 * Harmonizes the lighting, shadows, and colors of an image.
 * @param originalImage The original image file.
 * @returns A promise that resolves to the data URL of the harmonized image.
 */
export const harmonizeImage = async (
    originalImage: File
): Promise<string> => {
    console.log(`Starting image harmonization.`);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    
    const originalImagePart = await fileToPart(originalImage);
    const prompt = `You are a master digital artist and style transfer expert AI. Your primary goal is to unify a composite image by matching the background style to the foreground subjects' style, while also completing any unfinished areas. The provided image may contain foreground subjects (e.g., cartoon characters) on a background of a different style (e.g., a photograph), and might have empty or white spaces.

Your task is to create a new, complete, and perfectly cohesive image by performing the following actions:

1.  **Identify Subject and Style:** First, identify the primary foreground subjects and analyze their distinct art style (e.g., Japanese anime, cartoon, cel-shaded).

2.  **Redraw and Complete the Background:** Redraw the entire background to perfectly match the art style of the foreground subjects. **Crucially, if there are any empty, white, or transparent areas in the background, generatively fill them with a new environment that seamlessly extends the existing background scene.** For example, if the background is a city street, continue the street, buildings, and sky into the empty spaces. The final image must not have any empty areas.

3.  **Correct Perspective and Composition:** Analyze the placement of the subjects. If they are in an illogical position (e.g., floating), reposition them to create a believable and well-composed scene (e.g., place them firmly on a surface). Ensure the perspective of the newly drawn and completed background is consistent with the subjects' placement.

4.  **Integrate Lighting and Shadows:** Create a unified lighting scheme across the entire new image. Add shadows that the subjects cast onto the new background, and ensure the lighting on the subjects is consistent with the new environment.

5.  **Maintain Core Identity:** The subjects and the general layout of the background must remain recognizable. You are changing the style, fixing the composition, and completing the scene, not creating a completely new one.

Output: Return ONLY the final, fully rendered, and stylistically unified image. Do not return text.`;
    const textPart = { text: prompt };

    console.log('Sending image for harmonization...');
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: { parts: [originalImagePart, textPart] },
    });
    console.log('Received response from model for harmonization.', response);
    
    return handleApiResponse(response, 'harmonization');
};

/**
 * Fixes the composition of an image to make it logically and physically consistent (Do the Magic).
 * @param originalImage The original image file.
 * @returns A promise that resolves to the data URL of the fixed image.
 */
export const fixImageComposition = async (
    originalImage: File
): Promise<string> => {
    console.log(`Starting 'Do the Magic' composition fix.`);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    
    const originalImagePart = await fileToPart(originalImage);
    const prompt = `You are an advanced AI image compositor and editor. Your primary task is to fix logical and physical inconsistencies in the provided image to make it "make sense".

User Request: "Do the Magic" - Fix this image.
Context: The image likely contains subjects (e.g., characters) pasted onto a background in a way that defies physics or perspective (e.g., floating in mid-air, wrong scale, facing the wrong way relative to the scene, or ignoring gravity).

Instructions:
1.  **Analyze Logical Inconsistencies:** Identify elements that are physically impossible or awkward (e.g., a character floating in front of a desk instead of sitting at it or standing on the floor).
2.  **Redraw for Logic & Physics:** Redraw the scene to correct these issues.
    *   **Gravity:** If a subject is floating, place them firmly on the nearest logical surface (e.g., the floor, a chair, a rock).
    *   **Perspective:** Adjust the subject's angle and pose to match the background's perspective.
    *   **Interaction:** Ensure the subject interacts naturally with the environment (e.g., feet touching the ground, hands resting on a table).
3.  **Seamless Integration:** Fix lighting, shadows, and color grading so the subject looks like they truly belong in that space.
4.  **Preserve Identity:** Keep the same characters and the same general environment/setting. Do not change the art style unless necessary for consistency.

Output: Return ONLY the final, corrected image. Do not return text.`;

    const textPart = { text: prompt };

    console.log('Sending image for composition fix...');
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: { parts: [originalImagePart, textPart] },
    });
    console.log('Received response from model for composition fix.', response);
    
    return handleApiResponse(response, 'composition fix');
};


/**
 * Generates an animation from an image using generative AI.
 * @param sourceImage The source image file.
 * @param prompt The text prompt describing the desired animation.
 * @param onStatusUpdate A callback to provide progress updates to the UI.
 * @param lastFrameImage Optional. The image to transition to at the end of the video.
 * @returns A promise that resolves to the blob URL of the generated MP4 video.
 */
export const generateAnimation = async (
    sourceImage: File,
    prompt: string,
    onStatusUpdate: (message: string) => void,
    lastFrameImage?: File
): Promise<string> => {
    console.log(`Starting animation generation: ${prompt}, with lastFrame: ${!!lastFrameImage}`);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

    // Helper to extract base64 string from File
    const getBase64 = (file: File) => new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const dataUrl = reader.result as string;
            resolve(dataUrl.substring(dataUrl.indexOf(',') + 1));
        };
        reader.onerror = error => reject(error);
    });

    const sourceImageBase64 = await getBase64(sourceImage);

    // Prepare config
    const config: any = {
        numberOfVideos: 1
    };

    if (lastFrameImage) {
        const lastFrameBase64 = await getBase64(lastFrameImage);
        config.lastFrame = {
            imageBytes: lastFrameBase64,
            mimeType: lastFrameImage.type
        };
    }

    onStatusUpdate("Warming up the animation engine...");
    
    // Using generateVideos (Veo)
    let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt || (lastFrameImage ? "Transition from first frame to last frame" : undefined), // Prompt is optional if both images are present, but good to have
        image: {
            imageBytes: sourceImageBase64,
            mimeType: sourceImage.type,
        },
        config: config
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