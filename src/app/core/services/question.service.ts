import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { QuestionResponse } from '../models/game';

@Injectable({
  providedIn: 'root'
})
export class QuestionService {
  constructor(private http: HttpClient) {}

  getQuestion(id: number): Observable<QuestionResponse> {
    return this.http.get<QuestionResponse>(
      `${environment.apiBaseUrl}${environment.apiEndpoints.questions.find(id)}`
    );
  }
}
