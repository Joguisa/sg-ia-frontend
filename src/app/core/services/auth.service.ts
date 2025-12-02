import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, LoginRequest } from '../models/auth';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private tokenSubject = new BehaviorSubject<string | null>(
    localStorage.getItem('token')
  );
  public token$ = this.tokenSubject.asObservable();

  constructor(private http: HttpClient) {}

  login(email: string, password: string): Observable<AuthResponse> {
    const body: LoginRequest = { email, password };
    return this.http
      .post<AuthResponse>(
        `${environment.apiBaseUrl}${environment.apiEndpoints.auth.login}`,
        body
      )
      .pipe(
        tap((response) => {
          if (response.ok && response.token) {
            localStorage.setItem('token', response.token);
            this.tokenSubject.next(response.token);
          }
        })
      );
  }

  setToken(token: string): void {
    localStorage.setItem('token', token);
    this.tokenSubject.next(token);
  }

  logout(): void {
    localStorage.removeItem('token');
    this.tokenSubject.next(null);
  }

  getToken(): string | null {
    return this.tokenSubject.value;
  }

  isAuthenticated(): boolean {
    return !!this.tokenSubject.value;
  }
}
