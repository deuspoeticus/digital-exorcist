import { writable } from 'svelte/store';

export interface AuditData {
    inputTokens: number;
    outputTokens: number;
    maxTokens: number;
    modelFamily: string;
    latency: number;
    memoryUsage: number;
}

export const auditStore = writable<AuditData>({
    inputTokens: 0,
    outputTokens: 0,
    maxTokens: 0,
    modelFamily: 'Unknown',
    latency: 0,
    memoryUsage: 0
});
