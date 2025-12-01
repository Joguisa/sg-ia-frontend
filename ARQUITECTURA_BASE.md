# SG-IA Frontend - Arquitectura Base

## 📋 Resumen General

Se ha construido la **arquitectura base** del frontend Angular 17+ (Standalone) que consume la API PHP nativa ubicada en `../sg-ia-api`. La estructura incluye configuración, modelos, servicios, interceptores, estilos globales y un componente de layout principal.

---

## 🗂️ Estructura de Carpetas Creada

```
src/
├── app/
│   ├── core/
│   │   ├── models/
│   │   │   ├── auth/
│   │   │   │   ├── auth-response.interface.ts
│   │   │   │   ├── login-request.interface.ts
│   │   │   │   └── index.ts
│   │   │   ├── player/
│   │   │   │   ├── player.interface.ts
│   │   │   │   ├── player-response.interface.ts
│   │   │   │   ├── player-stats.interface.ts
│   │   │   │   └── index.ts
│   │   │   ├── game/
│   │   │   │   ├── game-session.interface.ts
│   │   │   │   ├── question.interface.ts
│   │   │   │   ├── answer.interface.ts
│   │   │   │   ├── leaderboard.interface.ts
│   │   │   │   ├── session-stats.interface.ts
│   │   │   │   └── index.ts
│   │   │   └── admin/
│   │   │       ├── admin-prompt.interface.ts
│   │   │       ├── admin-category.interface.ts
│   │   │       ├── dashboard-stats.interface.ts
│   │   │       └── index.ts
│   │   ├── services/
│   │   │   ├── auth.service.ts
│   │   │   ├── player.service.ts
│   │   │   ├── game.service.ts
│   │   │   ├── question.service.ts
│   │   │   └── admin.service.ts
│   │   └── interceptors/
│   │       └── error.interceptor.ts
│   └── layout/
│       ├── main-layout.component.ts
│       ├── main-layout.component.html
│       └── main-layout.component.css
├── environments/
│   ├── environment.ts
│   └── environment.prod.ts
├── styles.css
└── ...
```

---

## 🔌 Configuración de Entorno

### **environment.ts** (Desarrollo)
- **API Base URL**: `http://localhost:8000`
- Contiene todas las rutas de endpoints mapeadas por módulo

### **environment.prod.ts** (Producción)
- **API Base URL**: `https://api.sg-ia.com`
- Misma estructura que development (cambiar URL según necesidad)

---

## 📦 Modelos (Interfaces DTOs)

### **Auth Module**
```typescript
- AuthResponse: { ok, token?, error? }
- LoginRequest: { email, password }
```

### **Player Module**
```typescript
- Player: { id, name, age, createdAt? }
- PlayerResponse: { ok, player?, error? }
- PlayersListResponse: { ok, players?, error? }
- PlayerStatsResponse: { ok, player_id?, global?, topics?, error? }
- PlayerGlobalStats: { total_games, high_score, total_score, avg_score, avg_difficulty }
- PlayerTopicStats: { category_id, category_name, answers, accuracy, avg_time_sec }
```

### **Game Module**
```typescript
- GameSession: { id, playerId, currentDifficulty, status, score, lives }
- SessionResponse: { ok, id?, playerId?, ... }
- Question: { id, statement, difficulty, category_id, is_ai_generated?, admin_verified? }
- QuestionResponse: { ok, question?, error? }
- AnswerRequest: { question_id, is_correct, time_taken, selected_option_id? }
- AnswerResponse: { ok, score?, lives?, currentDifficulty?, error? }
- LeaderboardEntry: { rank, player_id, player_name, age, high_score, total_games, total_score, overall_accuracy }
- LeaderboardResponse: { ok, leaderboard?, error? }
- SessionStatsResponse: { ok, stats?, error? }
```

### **Admin Module**
```typescript
- AdminPrompt: { id, prompt_text, temperature, is_active }
- PromptConfigResponse: { ok, prompt?, error? }
- AdminCategory: { id?, name, description? }
- CategoryResponse: { ok, category_id?, message?, error? }
- DashboardSummary: { total_players, total_sessions, total_questions, pending_verification }
- QuestionDifficulty: { id, statement, difficulty, category_name, times_answered, success_rate }
- DashboardStatsResponse: { ok, summary?, hardest_questions?, easiest_questions?, error? }
```

---

## 🛠️ Servicios HTTP

### **AuthService** (`src/app/core/services/auth.service.ts`)
```typescript
- login(email: string, password: string): Observable<AuthResponse>
- logout(): void
- getToken(): string | null
- isAuthenticated(): boolean
- token$: Observable<string | null>  // BehaviorSubject
```

**Manejo de Token**:
- Almacena JWT en `localStorage` con clave `token`
- Expone observable `token$` para componentes
- Método `logout()` limpia el token

---

### **PlayerService** (`src/app/core/services/player.service.ts`)
```typescript
- createPlayer(name: string, age: number): Observable<PlayerResponse>
- listPlayers(): Observable<PlayersListResponse>
- getPlayerStats(playerId: number): Observable<PlayerStatsResponse>
```

---

### **GameService** (`src/app/core/services/game.service.ts`)
```typescript
- startSession(playerId: number, startDifficulty?: number): Observable<SessionResponse>
- getNextQuestion(categoryId: number, difficulty: number): Observable<QuestionResponse>
- submitAnswer(sessionId: number, answerData: AnswerRequest): Observable<AnswerResponse>
- getSessionStats(sessionId: number): Observable<SessionStatsResponse>
- getLeaderboard(): Observable<LeaderboardResponse>
```

---

### **QuestionService** (`src/app/core/services/question.service.ts`)
```typescript
- getQuestion(id: number): Observable<QuestionResponse>
```

---

### **AdminService** (`src/app/core/services/admin.service.ts`)
```typescript
// Question Management
- updateQuestion(questionId: number, statement: string): Observable<QuestionResponse>
- verifyQuestion(questionId: number, verified: boolean): Observable<QuestionResponse>

// Prompt Configuration
- getPromptConfig(): Observable<PromptConfigResponse>
- updatePromptConfig(promptText: string, temperature: number): Observable<any>

// Category Management
- createCategory(name: string, description?: string): Observable<CategoryResponse>
- deleteCategory(categoryId: number): Observable<any>

// Batch Generation
- generateBatch(quantity: number, categoryId: number, difficulty: number): Observable<any>

// Dashboard Analytics
- getDashboardStats(): Observable<DashboardStatsResponse>
```

---

## 🔐 Interceptores

### **Error Interceptor** (`src/app/core/interceptors/error.interceptor.ts`)

Intercepta todas las solicitudes HTTP y maneja errores:

- **401 Unauthorized**: Limpia token y redirige a `/login`
- **403 Forbidden**: Log de acceso denegado
- **404 Not Found**: Log de recurso no encontrado
- **5xx Server Errors**: Log de error del servidor

**Implementación**:
```typescript
provideHttpClient(withInterceptors([errorInterceptor]))
```

---

## 🎨 Estilos Globales (`src/styles.css`)

### **CSS Variables Definidas**:
```css
/* Colores Primarios */
--primary: #3b82f6
--primary-dark: #1e40af
--primary-light: #60a5fa

/* Colores Neutrales */
--gray-50 a --gray-900

/* Colores de Estado */
--success, --warning, --danger, --info

/* Espaciado */
--spacing-xs (4px) a --spacing-2xl (32px)

/* Tipografía */
--font-family: Poppins
--font-size-xs a --font-size-3xl

/* Border Radius */
--rounded-sm a --rounded-2xl

/* Sombras */
--shadow-sm a --shadow-xl

/* Transiciones */
--transition-fast, --transition-normal, --transition-slow
```

### **Componentes Estilizados**:
- **Buttons**: `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-danger`, `.btn-icon`
- **Forms**: Input, textarea, select (con focus states)
- **Cards**: `.card` con headers y footers
- **Alerts**: `.alert-success`, `.alert-warning`, `.alert-danger`, `.alert-info`
- **Badges**: `.badge` con variantes
- **Tables**: Estilos modernos con hover effects
- **Grid System**: 12 columnas con breakpoints responsive
- **Utilities**: Margin, padding, display, flex, text, background, border, shadow

### **Responsive Design**:
- Breakpoint **768px**: tablets
- Breakpoint **480px**: mobile

---

## 📐 Layout Principal

### **MainLayoutComponent** (`src/app/layout/main-layout.component.ts`)

**Características**:
- ✅ Standalone component (Angular 17+)
- ✅ Sidebar vertical con navegación por iconos
- ✅ Header superior con toggle de sidebar en mobile
- ✅ Área de contenido fluida con `<router-outlet>`
- ✅ Footer con copyright
- ✅ Responsive: Sidebar colapsado en mobile
- ✅ Integración con `AuthService` para mostrar estado

**Navegación**:
```
- 🎮 Juego (/game)
- 📊 Clasificación (/leaderboard)
- 👤 Mi Perfil (/profile)
- 🚪 Logout (button)
```

**Estilos**:
- Sidebar: 100px ancho en desktop, colapsado en mobile
- Header: Shadow pequeño con title y toggle button
- Content area: Flex layout con overflow auto
- Footer: Borde superior y texto centrado

---

## ⚙️ Configuración de Angular (`app.config.ts`)

```typescript
export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([errorInterceptor]))
  ]
};
```

---

## 📝 Ejemplo de Uso

### **Inyectar y usar un servicio en componente**:

```typescript
import { Component, OnInit } from '@angular/core';
import { GameService } from './core/services/game.service';

@Component({
  selector: 'app-game-page',
  template: `...`
})
export class GamePageComponent implements OnInit {
  constructor(private gameService: GameService) {}

  ngOnInit() {
    this.gameService.startSession(1, 1.0).subscribe({
      next: (response) => {
        if (response.ok) {
          console.log('Sesión iniciada:', response);
        }
      },
      error: (error) => {
        console.error('Error:', error);
      }
    });
  }
}
```

---

## 🚀 Próximos Pasos

1. **Crear páginas principales**:
   - Login page (`src/app/pages/login/`)
   - Game page (`src/app/pages/game/`)
   - Leaderboard page (`src/app/pages/leaderboard/`)
   - Player profile page (`src/app/pages/profile/`)
   - Admin dashboard (`src/app/pages/admin/`)

2. **Implementar routing**:
   - Actualizar `app.routes.ts` con rutas principales
   - Crear guards de autenticación (auth.guard.ts)

3. **Crear componentes compartidos**:
   - `shared/components/question-card/`
   - `shared/components/player-card/`
   - `shared/components/leaderboard-table/`
   - `shared/pipes/accuracy.pipe.ts`, `score.pipe.ts`

4. **Integración con API**:
   - Probar endpoints en navegador/Postman
   - Conectar componentes con servicios
   - Validar manejo de errores

5. **Testing**:
   - Unit tests para servicios
   - Component tests con MockData
   - E2E tests con Cypress/Playwright

---

## 🔗 Endpoints Mapeados

| Módulo | Método | Endpoint | Servicio | Autenticado |
|--------|--------|----------|----------|-------------|
| Auth | POST | `/auth/login` | AuthService | ❌ |
| Player | POST | `/players` | PlayerService | ❌ |
| Player | GET | `/players` | PlayerService | ❌ |
| Game | POST | `/games/start` | GameService | ❌ |
| Game | GET | `/games/next` | GameService | ❌ |
| Game | POST | `/games/{id}/answer` | GameService | ❌ |
| Question | GET | `/questions/{id}` | QuestionService | ❌ |
| Stats | GET | `/stats/session/{id}` | GameService | ❌ |
| Stats | GET | `/stats/player/{id}` | PlayerService | ❌ |
| Stats | GET | `/stats/leaderboard` | GameService | ❌ |
| Admin | PUT | `/admin/questions/{id}` | AdminService | ✅ |
| Admin | PATCH | `/admin/questions/{id}/verify` | AdminService | ✅ |
| Admin | GET | `/admin/config/prompt` | AdminService | ✅ |
| Admin | PUT | `/admin/config/prompt` | AdminService | ✅ |
| Admin | POST | `/admin/categories` | AdminService | ✅ |
| Admin | DELETE | `/admin/categories/{id}` | AdminService | ✅ |
| Admin | POST | `/admin/generate-batch` | AdminService | ✅ |
| Admin | GET | `/admin/dashboard` | AdminService | ✅ |

---

## ✅ Checklist de Completitud

- ✅ Configuración de entorno (dev & prod)
- ✅ Modelos/Interfaces DTOs (23 archivos)
- ✅ Servicios HTTP (5 servicios principales)
- ✅ Interceptor de errores
- ✅ MainLayoutComponent (Standalone)
- ✅ Estilos globales (600+ líneas CSS)
- ✅ Responsive design
- ✅ Estructura de carpetas organizada

---

## 📞 Notas Técnicas

- **Framework**: Angular 17+ (Standalone Components)
- **HTTP Client**: Angular's `HttpClient` con interceptores
- **State Management**: Simple (sin NgRx) - Services + RxJS Observables
- **Styling**: Custom CSS con variables CSS (sin Bootstrap)
- **Font**: Poppins (Google Fonts)
- **Color Scheme**: Azul (#3b82f6) como primario + grises + estados

---

**Última actualización**: 2024-12-01
**Estado**: ✅ Arquitectura Base Completada
