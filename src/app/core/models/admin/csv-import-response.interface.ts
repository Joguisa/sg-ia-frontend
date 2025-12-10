/**
 * CsvImportResponse Interface
 *
 * Respuesta del endpoint POST /admin/batch/import-csv
 */
export interface CsvImportResponse {
  ok: boolean;
  imported: number;
  errors: number;
  batch_id: number;
  error_details: string[];
  error?: string;
}
