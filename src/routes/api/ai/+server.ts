import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '$env/dynamic/private';
import { SYSTEM_PROMPT, SAFETY_SETTINGS } from '$lib/ai/config';
import type { RequestHandler } from './$types';

const genAI = new GoogleGenerativeAI(env.GOOGLE_API_KEY || '');

export const POST: RequestHandler = async ({ request }) => {
    const { prompt } = await request.json();

    if (!env.GOOGLE_API_KEY) {
        return new Response('Missing GOOGLE_API_KEY', { status: 500 });
    }

    try {
        const model = genAI.getGenerativeModel({
            model: 'gemini-1.5-flash',
            systemInstruction: SYSTEM_PROMPT,
            generationConfig: {
                maxOutputTokens: SAFETY_SETTINGS.maxTokens,
                temperature: SAFETY_SETTINGS.temperature,
            }
        });

        const result = await model.generateContentStream(prompt);

        // Create a readable stream from the Gemini stream
        const stream = new ReadableStream({
            async start(controller) {
                for await (const chunk of result.stream) {
                    const text = chunk.text();
                    controller.enqueue(text);
                }
                controller.close();
            }
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/plain; charset=utf-8'
            }
        });

    } catch (e) {
        console.error('Gemini Cloud API Error:', e);
        return new Response('Internal Server Error', { status: 500 });
    }
};
