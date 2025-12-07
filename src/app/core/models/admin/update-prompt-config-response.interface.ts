/**
 * Response from PUT /admin/config/prompt
 * Backend: AdminController::updatePromptConfig()
 */
export interface UpdatePromptConfigResponse {
  ok: boolean;
  message: string;
  error?: string;
}
