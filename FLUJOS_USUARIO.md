# Flujos de Usuario - SG-IA Frontend

## 📊 Arquitectura de Dos Entradas

El frontend está diseñado con **dos puntos de entrada completamente independientes** para dos tipos de usuarios:

```
┌─────────────────────────────────────────────────────────────┐
│              FRONTEND - SG-IA (Raíz: /)                    │
└─────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┴──────────────┐
                │                            │
        ┌───────▼────────┐         ┌────────▼────────┐
        │   JUGADORES    │         │ ADMINISTRADORES │
        │   (Público)    │         │   (Privado)     │
        └────────────────┘         └─────────────────┘
```

---

## 🎮 FLUJO 1: JUGADOR (Acceso Público)

### Punto de Entrada: `/play`

```
┌──────────────────────────────────────┐
│  GameStartComponent (/play)          │
├──────────────────────────────────────┤
│  Título: "Bienvenido al Reto..."     │
│  - Input: Nombre                     │
│  - Input: Edad                       │
│  - Botón: "¡Jugar Ahora!"            │
│  - Link: "Eres administrador?"        │
└──────────────────────────────────────┘
         ▼ (POST /players)
   ┌─────────────────────┐
   │  PlayerService      │
   │  createPlayer()     │
   └─────────────────────┘
         ▼ (OK)
   Backend devuelve:
   {
     "ok": true,
     "player": {
       "id": 1,
       "name": "Juan",
       "age": 25,
       "createdAt": "2024-12-01..."
     }
   }
         ▼
   localStorage.setItem('playerId', '1')
   localStorage.setItem('playerName', 'Juan')
         ▼
   ✅ Redirect → /game/board
```

### Rutas Públicas del Jugador

| Ruta | Componente | Estado |
|------|-----------|--------|
| `/play` | GameStartComponent | ✅ Implementada |
| `/game/board` | GameBoardComponent | ⏳ TODO |
| `/leaderboard` | LeaderboardComponent | ⏳ TODO |
| `/profile` | PlayerProfileComponent | ⏳ TODO |

### Datos Almacenados (localStorage)

```javascript
localStorage.playerId      // ID del jugador
localStorage.playerName    // Nombre del jugador
```

**No requiere autenticación JWT**.

---

## 🔐 FLUJO 2: ADMINISTRADOR (Acceso Privado)

### Punto de Entrada: `/admin/login`

```
┌──────────────────────────────────────┐
│  AdminLoginComponent (/admin/login)  │
├──────────────────────────────────────┤
│  Título: "Panel de Control"          │
│  - Input: Correo Electrónico         │
│  - Input: Contraseña (con toggle)    │
│  - Botón: "Iniciar Sesión"           │
│  - Link: "Volver al juego"            │
└──────────────────────────────────────┘
         ▼ (POST /auth/login)
   ┌─────────────────────┐
   │  AuthService        │
   │  login()            │
   └─────────────────────┘
         ▼ (OK)
   Backend devuelve:
   {
     "ok": true,
     "token": "eyJhbGciOiJIUzI1NiIs..."
   }
         ▼
   AuthService guarda automáticamente:
   localStorage.setItem('token', jwt_token)
   tokenSubject.next(token)
         ▼
   ✅ Redirect → /admin/dashboard
```

### Rutas Protegidas del Admin

| Ruta | Componente | Guard | Estado |
|------|-----------|-------|--------|
| `/admin/login` | AdminLoginComponent | - | ✅ Implementada |
| `/admin/dashboard` | AdminDashboardComponent | AdminGuard | ⏳ TODO |
| `/admin/questions` | AdminQuestionsComponent | AdminGuard | ⏳ TODO |
| `/admin/settings` | AdminSettingsComponent | AdminGuard | ⏳ TODO |

### Datos Almacenados (localStorage)

```javascript
localStorage.token  // JWT de autenticación
```

**Requiere JWT válido para acceder a rutas protegidas**.

---

## 🛡️ AdminGuard - Protección de Rutas

```typescript
// src/app/core/guards/admin.guard.ts

canActivate(): boolean {
  const token = this.authService.getToken();

  if (token) {
    return true;  // ✅ Permitir acceso
  }

  // ❌ Sin token → Redirigir a login
  this.router.navigate(['/admin/login']);
  return false;
}
```

**Lógica**:
1. Intenta acceder a `/admin/dashboard` (protegida)
2. Guard verifica: ¿Hay token en AuthService?
3. **SÍ**: Permite acceso ✅
4. **NO**: Redirige a `/admin/login` 🔄

---

## 📍 Configuración de Rutas (app.routes.ts)

```typescript
export const routes: Routes = [
  // Default
  { path: '', redirectTo: '/play', pathMatch: 'full' },

  // Public - Player
  { path: 'play', component: GameStartComponent },
  { path: 'game/board', component: GameStartComponent },  // TODO
  { path: 'leaderboard', component: GameStartComponent }, // TODO
  { path: 'profile', component: GameStartComponent },     // TODO

  // Public - Admin Login
  { path: 'admin/login', component: AdminLoginComponent },

  // Protected - Admin
  {
    path: 'admin/dashboard',
    canActivate: [AdminGuard],
    component: GameStartComponent  // TODO
  },
  {
    path: 'admin/questions',
    canActivate: [AdminGuard],
    component: GameStartComponent  // TODO
  },
  {
    path: 'admin/settings',
    canActivate: [AdminGuard],
    component: GameStartComponent  // TODO
  },

  // Wildcard
  { path: '**', redirectTo: '/play' }
];
```

---

## 🎨 Diseño Visual

### GameStartComponent (/play)

**Estilo**: Atractivo y lúdico

```
┌─────────────────────────────────────┐
│  Gradiente: Purple → Blue            │
│  ╔═════════════════════════════════╗│
│  ║  🏥 Bienvenido al Reto...      ║│
│  ║                                 ║│
│  ║  [Input: Nombre]                ║│
│  ║  [Input: Edad]                  ║│
│  ║                                 ║│
│  ║  [🎮 ¡Jugar Ahora!]            ║│
│  ║                                 ║│
│  ║  ¿Eres administrador?           ║│
│  ║  [Ingresa aquí]                 ║│
│  ╚═════════════════════════════════╝│
│                                      │
│  ⚡ Preguntas dinámicas             │
│  📈 Dificultad adaptativa           │
│  🏆 Compite en el ranking           │
└─────────────────────────────────────┘
```

**Características**:
- Fondo con gradiente púrpura-azul
- Animación de flotación de elementos
- Inputs con validación
- Spinner de carga
- Link a admin login

---

### AdminLoginComponent (/admin/login)

**Estilo**: Profesional y corporativo

```
┌─────────────────────────────────────┐
│  Gradiente: Dark Blue               │
│  ╔═════════════════════════════════╗│
│  ║  🔐 Panel de Control            ║│
│  ║      Acceso administrativo      ║│
│  ║                                 ║│
│  ║  [✉️ Email]                     ║│
│  ║  [🔒 Contraseña]   [👁️]        ║│
│  ║                                 ║│
│  ║  [INICIAR SESIÓN]               ║│
│  ║                                 ║│
│  ║  ¿No eres administrador?        ║│
│  ║  [Volver al juego]              ║│
│  ╚═════════════════════════════════╝│
│                                      │
│  📊 Gestión de preguntas            │
│  ⚙️  Configuración de IA            │
│  📈 Análisis de datos               │
└─────────────────────────────────────┘
```

**Características**:
- Fondo con gradiente azul oscuro
- Animación de caída de elementos
- Show/hide password toggle
- Validación de email
- Spinner de carga
- Link a entrada de jugador

---

## 🔄 Flujos de Navegación

### Caso 1: Jugador Nuevo

```
1. Usuario abre: http://localhost:4200/
2. Ruta vacía → Redirect a /play
3. Ve GameStartComponent
4. Ingresa nombre: "Juan" y edad: 25
5. Click "¡Jugar Ahora!"
6. POST /players → Backend crea jugador (id: 1)
7. localStorage.playerId = "1"
8. Redirect → /game/board
9. GameBoardComponent carga datos del jugador
```

### Caso 2: Admin Nuevo Intenta Acceder a Dashboard

```
1. Admin intenta: http://localhost:4200/admin/dashboard
2. AdminGuard verifica token
3. No hay token (localStorage.token = null)
4. Redirect → /admin/login
5. Ve AdminLoginComponent
6. Ingresa: email y password
7. Click "Iniciar Sesión"
8. POST /auth/login → Backend valida credenciales
9. Response: { ok: true, token: "jwt_token" }
10. localStorage.token = "jwt_token"
11. Redirect → /admin/dashboard
12. AdminGuard verifica token → OK ✅
13. AdminDashboardComponent carga
```

### Caso 3: Admin Intenta Volver a Jugar

```
1. Admin está en /admin/dashboard
2. Click: "Volver al juego" (o navegar a /play)
3. → /play (GameStartComponent)
4. Crea nuevo perfil de jugador si lo desea
5. O accede a datos existentes con otro nombre
```

---

## 🛠️ Desarrollo Futuro

### Componentes TODO por Crear

1. **GameBoardComponent** (`/game/board`)
   - Mostrar pregunta actual
   - Botones de respuesta
   - Timer y puntuación
   - Integrar con GameService

2. **LeaderboardComponent** (`/leaderboard`)
   - Tabla de top 10 jugadores
   - Estadísticas de cada jugador
   - Integrar con GameService.getLeaderboard()

3. **PlayerProfileComponent** (`/profile`)
   - Estadísticas del jugador actual
   - Historial de partidas
   - Integrar con PlayerService.getPlayerStats()

4. **AdminDashboardComponent** (`/admin/dashboard`)
   - Resumen de estadísticas globales
   - Gráficos de preguntas
   - Integrar con AdminService.getDashboardStats()

5. **AdminQuestionsComponent** (`/admin/questions`)
   - CRUD de preguntas
   - Verificación de preguntas generadas por IA
   - Integrar con AdminService

6. **AdminSettingsComponent** (`/admin/settings`)
   - Configuración de prompts de IA
   - Gestión de categorías
   - Integrar con AdminService

---

## 📝 Endpoints Usados

### Player Flow

| Método | Endpoint | Servicio | Autenticación | Respuesta |
|--------|----------|----------|---------------|-----------|
| POST | `/players` | PlayerService | ❌ No | `{ ok, player }` |
| GET | `/games/next` | GameService | ❌ No | `{ ok, question }` |
| POST | `/games/{id}/answer` | GameService | ❌ No | `{ ok, score, lives }` |
| GET | `/stats/leaderboard` | GameService | ❌ No | `{ ok, leaderboard }` |
| GET | `/stats/player/{id}` | PlayerService | ❌ No | `{ ok, player_id, global, topics }` |

### Admin Flow

| Método | Endpoint | Servicio | Autenticación | Respuesta |
|--------|----------|----------|---------------|-----------|
| POST | `/auth/login` | AuthService | ❌ No | `{ ok, token }` |
| GET | `/admin/dashboard` | AdminService | ✅ JWT | `{ ok, summary, hardest_questions, easiest_questions }` |
| PUT | `/admin/questions/{id}` | AdminService | ✅ JWT | `{ ok, question }` |
| PATCH | `/admin/questions/{id}/verify` | AdminService | ✅ JWT | `{ ok, question }` |
| POST | `/admin/categories` | AdminService | ✅ JWT | `{ ok, category_id }` |
| DELETE | `/admin/categories/{id}` | AdminService | ✅ JWT | `{ ok }` |
| POST | `/admin/generate-batch` | AdminService | ✅ JWT | `{ ok, generated, failed }` |
| GET | `/admin/config/prompt` | AdminService | ✅ JWT | `{ ok, prompt }` |
| PUT | `/admin/config/prompt` | AdminService | ✅ JWT | `{ ok }` |

---

## 💾 Estado Local

### localStorage Keys

```
// Player Session
playerId       → string (ID del jugador actual)
playerName     → string (Nombre del jugador)

// Admin Session
token          → string (JWT del admin)
```

### Signals (Estado en Memoria)

#### AuthService
```typescript
tokenSubject: BehaviorSubject<string | null>
token$: Observable<string | null>
```

#### GameStartComponent
```typescript
name: signal<string>
age: signal<number | null>
isLoading: signal<boolean>
errorMessage: signal<string>
```

#### AdminLoginComponent
```typescript
email: signal<string>
password: signal<string>
isLoading: signal<boolean>
errorMessage: signal<string>
showPassword: signal<boolean>
```

---

## 🚀 Testing

### Test Case: Player Flow

```gherkin
Given Usuario abre http://localhost:4200/
When El sistema redirige a /play
Then Ve GameStartComponent con formulario
When Ingresa nombre "Juan" y edad 25
And Hace click en "¡Jugar Ahora!"
Then POST /players se ejecuta
And localStorage contiene playerId = 1
And Redirige a /game/board
```

### Test Case: Admin Flow

```gherkin
Given Admin accede a http://localhost:4200/admin/dashboard
When AdminGuard verifica token
Then Redirige a /admin/login
When Ingresa email "admin@sg-ia.com" y password correcto
And Hace click en "Iniciar Sesión"
Then POST /auth/login se ejecuta
And localStorage contiene token válido
And Redirige a /admin/dashboard
When AdminGuard verifica token
Then Permite acceso y muestra AdminDashboardComponent
```

---

## 📊 Arquitectura de Carpetas

```
src/app/
├── features/
│   ├── game/
│   │   └── start/
│   │       ├── game-start.component.ts
│   │       ├── game-start.component.html
│   │       └── game-start.component.css
│   └── admin/
│       └── login/
│           ├── admin-login.component.ts
│           ├── admin-login.component.html
│           └── admin-login.component.css
├── core/
│   ├── guards/
│   │   └── admin.guard.ts
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── player.service.ts
│   │   ├── game.service.ts
│   │   └── ...
│   └── models/
│       └── ...
├── app.routes.ts
└── ...
```

---

**Commit**: `56aa875` - "Implement dual-entry UI with player and admin modules"

**Última actualización**: 2024-12-02
**Estado**: ✅ Dual-Entry UI Completada
