export interface AdminPrompt {
  id: number;
  prompt_text: string;
  temperature: number;
  is_active: boolean;
}

export interface PromptConfigResponse {
  ok: boolean;
  prompt?: AdminPrompt;
  error?: string;
}
