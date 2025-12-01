import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AdminPrompt,
  PromptConfigResponse,
  CategoryResponse,
  DashboardStatsResponse,
  AdminCategory
} from '../models/admin';
import { QuestionResponse } from '../models/game';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  constructor(private http: HttpClient) {}

  // Question Management
  updateQuestion(questionId: number, statement: string): Observable<QuestionResponse> {
    const body = { statement };
    return this.http.put<QuestionResponse>(
      `${environment.apiBaseUrl}${environment.apiEndpoints.admin.updateQuestion(questionId)}`,
      body
    );
  }

  verifyQuestion(questionId: number, verified: boolean): Observable<QuestionResponse> {
    const body = { verified };
    return this.http.patch<QuestionResponse>(
      `${environment.apiBaseUrl}${environment.apiEndpoints.admin.verifyQuestion(questionId)}`,
      body
    );
  }

  // Prompt Configuration
  getPromptConfig(): Observable<PromptConfigResponse> {
    return this.http.get<PromptConfigResponse>(
      `${environment.apiBaseUrl}${environment.apiEndpoints.admin.getPromptConfig}`
    );
  }

  updatePromptConfig(promptText: string, temperature: number): Observable<any> {
    const body = { prompt_text: promptText, temperature };
    return this.http.put<any>(
      `${environment.apiBaseUrl}${environment.apiEndpoints.admin.updatePromptConfig}`,
      body
    );
  }

  // Category Management
  createCategory(name: string, description?: string): Observable<CategoryResponse> {
    const body = { name, ...(description && { description }) };
    return this.http.post<CategoryResponse>(
      `${environment.apiBaseUrl}${environment.apiEndpoints.admin.createCategory}`,
      body
    );
  }

  deleteCategory(categoryId: number): Observable<any> {
    return this.http.delete<any>(
      `${environment.apiBaseUrl}${environment.apiEndpoints.admin.deleteCategory(categoryId)}`
    );
  }

  // Batch Generation
  generateBatch(
    quantity: number,
    categoryId: number,
    difficulty: number
  ): Observable<any> {
    const body = { quantity, category_id: categoryId, difficulty };
    return this.http.post<any>(
      `${environment.apiBaseUrl}${environment.apiEndpoints.admin.generateBatch}`,
      body
    );
  }

  // Dashboard Analytics
  getDashboardStats(): Observable<DashboardStatsResponse> {
    return this.http.get<DashboardStatsResponse>(
      `${environment.apiBaseUrl}${environment.apiEndpoints.admin.dashboardStats}`
    );
  }
}
