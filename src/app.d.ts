// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
    namespace App {
        // interface Error {}
        // interface Locals {}
        // interface PageData {}
        // interface PageState {}
        // interface Platform {}
    }

    interface Window {
        ai?: {
            languageModel: {
                capabilities: () => Promise<AICapabilities>;
                create: (options?: AIModelOptions) => Promise<AILanguageModel>;
            };
        };
    }

    interface AICapabilities {
        available: 'readily' | 'after-download' | 'no';
        defaultTemperature?: number;
        defaultTopK?: number;
        maxTopK?: number;
    }

    interface AIModelOptions {
        systemPrompt?: string;
        initialPrompts?: { role: 'system' | 'user' | 'assistant'; content: string }[];
        temperature?: number;
        topK?: number;
    }

    interface AILanguageModel {
        prompt: (input: string) => Promise<string>;
        promptStreaming: (input: string) => AsyncIterable<string>;
        destroy: () => void;
        clone: () => Promise<AILanguageModel>;
    }

    // Legacy/Alternative API support
    // The user reports `LanguageModel` is available globally, not under window.ai
    // It seems to have a static `availability` method.
    // We'll declare it as a var to avoid clashing with the interface if they share name but are distinct scopes.
    // Actually, let's use a different name for the interface to avoid confusion, or just augment window.
    // But 'LanguageModel' is likely a class constructor in the global scope.

    var LanguageModel: {
        availability: (options?: { expectedContextSize?: number }) => Promise<'readily' | 'after-download' | 'no' | 'available'>; // User said "available", maybe they meant "readily"? Or maybe it returns strictly "available".
        create: (options?: AIModelOptions) => Promise<AILanguageModel>;
    };
}

export { };
