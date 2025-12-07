export interface GenerationResponse {
    ok: boolean;
    generated?: number;
    failed?: number;
    questions?: any[];
    error?: string;
    message?: string;
}