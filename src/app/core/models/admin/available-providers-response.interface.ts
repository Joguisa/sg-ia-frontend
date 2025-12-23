export interface Provider {
  name:      string;
  available: boolean;
}

export interface AvailableProvidersResponse {
  ok: boolean;
  providers: Provider[]; 
  count: number;
  error?: string;
}