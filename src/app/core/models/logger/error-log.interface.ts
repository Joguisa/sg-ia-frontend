export interface ErrorLogPayload {
  message: string;
  status: number;
  status_text: string | null;
  url: string;
}

export interface ErrorLogResponse {
  ok: boolean;
}
