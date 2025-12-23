export interface AdminPrompt {
  id: number;
  prompt_text: string;
  temperature: number;
  is_active: boolean;
  preferred_ai_provider?: string; // 'auto' | 'gemini' | 'groq' | 'deepseek' | 'fireworks'
  max_questions_per_game: string;
}

export interface PromptConfigResponse {
  ok: boolean;
  prompt?: AdminPrompt;
  error?: string;
}
