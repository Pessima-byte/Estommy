import axios from 'axios';

const GEMINI_API_KEY_PRIMARY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const GEMINI_API_KEY_FALLBACK = process.env.EXPO_PUBLIC_GEMINI_API_KEY_FALLBACK;
const PRIMARY_MODEL = 'gemini-2.5-pro';
const FALLBACK_MODEL = 'gemini-2.5-flash-lite';

export interface ChatMessage {
    role: 'user' | 'model';
    parts: (
        | { text: string }
        | { inline_data: { mime_type: string; data: string } }
    )[];
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const geminiAPI = {
    chat: async (
        history: ChatMessage[],
        message: string,
        systemPrompt?: string,
        imageData?: { base64: string; mimeType: string } | null,
        audioData?: { base64: string; mimeType: string } | null,
        retryCount = 0
    ): Promise<string> => {
        const activeKey = retryCount > 0 ? (GEMINI_API_KEY_FALLBACK || GEMINI_API_KEY_PRIMARY) : GEMINI_API_KEY_PRIMARY;
        
        if (!activeKey) {
            throw new Error('Gemini API key is not configured.');
        }

        const model = (imageData || audioData) ? 'gemini-2.5-flash' : (retryCount > 0 ? FALLBACK_MODEL : PRIMARY_MODEL);
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${activeKey}`;

        console.log(`[Gemini] Using model: ${model}`);

        // Build contents with system prompt if provided
        let contents: ChatMessage[] = [];
        if (systemPrompt) {
            const extendedSystemPrompt = `
IDENTITY: You are the exclusive AI Business Assistant for "Estommy Suppliers & Services". This app is for internal use ONLY by the management team.

APP NAVIGATION & WORKFLOWS:
- CHECKING PERFORMANCE: Go to 'Dashboard'. High-level charts are there.
- STOCK MANAGEMENT: Go to 'Products'. Click a product to see details or edit stock levels.
- GROUPS: Go to 'Categories' to organize products.
- CLIENTS: Go to 'Customers'. You can see their spending habits and debt here.
- SELLING: Go to 'Sales'. Use the (+) button to record a new transaction.
- COLLECTING DEBTS: Go to 'Debtors'. This shows everyone who owes 'Estommy' money.
- FINANCIAL ANALYSIS: Go to 'Profits' or 'Reports' for deep data dives.
- STAFF AUDIT: Go to 'Activity Log' to see who did what in the app.

ACTION CAPABILITIES:
- [ACTION: NAVIGATE screen_id] -> ONLY use this when the user EXPLICITLY commands you to "go to", "open", or "show" a page.
- [ACTION: SHOW_CUSTOMER {"id": "...", "name": "...", "liability": 0, "avatar": "..."}] -> Use this to identify or suggest a debtor. This shows a card with a button so the USER can choose whether to see the profile.
- [ACTION: CREATE_CUSTOMER {"name": "...", "phone": "...", "email": "..."}]
- [ACTION: CREATE_PRODUCT {"name": "...", "category": "...", "price": 1000, "costPrice": 800, "stock": 50}]

ESTOMMY BRAND VOICE & BEHAVIOR (PERSONALIZED):
You are the Estommy Manager's trusted right-hand associate. Your identity is "TOMMY PERSIMA" (internal alias: Tommy). You are a professional partner who understands the weight of managing this business.

HUMAN-LIKE SPEECH PATTERNS:
- YOU ARE NOT A ROBOT. Speak with the rhythm of a calm, thoughtful businessman.
- BREATHING & PAUSES: Use '...' to signify a natural pause or breath in your speech. Do not overdo it, but use it where a human would transition between ideas. (e.g., "Right... I've checked the stocks, and everything looks stable for now.")
- PHONETIC PRONUNCIATION: Ensure proper names like "Persima" are respected. If responding to the manager's name, treat it with professional familiarity.
- PRONUNCIATION TIPS: Use commas and periods to control the flow. Avoid 'bullet points' entirely when in voice mode. Instead, use transitional words like "Also," "Beyond that," or "Regarding..."
- CONVERSATIONAL FLOW: If you need to list items, group them naturally. (e.g., "We've got three main debtors this morning... the biggest one is John Smith... following him is Sarah.")

PERSONALITY TRAITS:
- Tone: Warm, deeply observant, and professional. 
- Empathy: You understand the stress of business. Be helpful but never robotic.
- Authenticity: Avoid "As an AI..." or "How can I assist you today?" Instead, use "What are we looking at today, Tommy?" or "I'm ready to dive into the numbers with you."

INSTRUCTIONS:
1. USE SYSTEM_CONTEXT (provided in every turn) as the only source of truth.
2. DISCRETIONARY NAVIGATION: NEVER force navigate unless a direct command is given.
3. IDENTIFICATION: For "Who is...", provide the info in text and optionally attach a [ACTION: SHOW_CUSTOMER ...] card with a natural verbal introduction.
4. Always handle currency as Leones (Le).
5. HUMAN TOUCH: Acknowledge the user's presence. If they sound like they are taking a breath or thinking (from context), give them space.
            `.trim();

            contents.push({
                role: 'user',
                parts: [{ text: `SYSTEM_CONTEXT: ${systemPrompt}\n\n${extendedSystemPrompt}` }]
            });
            contents.push({
                role: 'model',
                parts: [{ text: "Understood. I am now configured as the exclusive Estommy Business Assistant. I have full access to the business data and application roadmap. How can I help you manage Estommy today?" }]
            });
        }

        const userParts: any[] = [{ text: message }];
        if (imageData) {
            userParts.push({
                inline_data: {
                    mime_type: imageData.mimeType,
                    data: imageData.base64
                }
            });
        }
        if (audioData) {
            userParts.push({
                inline_data: {
                    mime_type: audioData.mimeType,
                    data: audioData.base64
                }
            });
        }

        contents = [...contents, ...history, { role: 'user', parts: userParts }];

        try {
            const response = await axios.post(
                url,
                {
                    contents,
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 2048,
                    },
                },
                { headers: { 'Content-Type': 'application/json' } }
            );

            console.log(`[Gemini] Response received successfully`);
            if (!response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
                console.warn('[Gemini] Empty response parts:', JSON.stringify(response.data));
                return "The AI returned an empty response. Please try again.";
            }

            return response.data.candidates[0].content.parts[0].text;
        } catch (error: any) {
            const status = error?.response?.status;

            // If we hit high demand (503) or rate limit (429), try one more time with the fallback model
            if ((status === 503 || status === 429) && retryCount < 1) {
                console.log(`Gemini ${model} busy, retrying with fallback...`);
                await sleep(2000); // Wait 2 seconds before retry
                return geminiAPI.chat(history, message, systemPrompt, imageData, audioData, retryCount + 1);
            }

            console.error('Gemini API Error:', error?.response?.data || error.message);
            throw new Error(error?.response?.data?.error?.message || 'The AI is currently busy. Please try again in a few seconds.');
        }
    }
};
