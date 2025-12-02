import { Routes } from '@angular/router';
import { GameStartComponent } from './features/game/start/game-start.component';
import { GameBoardComponent } from './features/game/board/game-board.component';
import { AdminLoginComponent } from './features/admin/login/admin-login.component';
import { PlayerProfileComponent } from './features/profile/player-profile.component';
import { AdminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  // ============================================================================
  // TIER 1: PUBLIC SPECIFIC ROUTES (Exact matches first - most specific)
  // Orden: Más específicas al inicio (ej: admin/login antes de admin/*)
  // ============================================================================

  // Admin - Login (Public access needed to login)
  // NOTA: DEBE estar ANTES de otros /admin/* para evitar conflictos
  {
    path: 'admin/login',
    component: AdminLoginComponent,
    data: { title: 'Acceso de Administrador' }
  },

  // Public - Player Entry
  {
    path: 'play',
    component: GameStartComponent,
    data: { title: 'Ingreso de Jugador' }
  },

  // Public - Game Board (Game session)
  {
    path: 'game/board',
    component: GameBoardComponent,
    data: { title: 'Tablero del Juego' }
  },

  // Public - Leaderboard (placeholder)
  {
    path: 'leaderboard',
    component: GameStartComponent,  // TODO: Replace with LeaderboardComponent
    data: { title: 'Clasificación' }
  },

  // Public - Player Profile
  {
    path: 'profile',
    component: PlayerProfileComponent,
    data: { title: 'Mi Perfil' }
  },

  // ============================================================================
  // TIER 2: PROTECTED ADMIN ROUTES (with AdminGuard)
  // NOTA: Estas rutas tienen canActivate [AdminGuard] que espera async
  // ============================================================================

  // Admin - Dashboard (Protected)
  {
    path: 'admin/dashboard',
    canActivate: [AdminGuard],
    component: GameStartComponent,  // TODO: Replace with AdminDashboardComponent
    data: { title: 'Panel de Administrador' }
  },

  // Admin - Questions Management (Protected)
  {
    path: 'admin/questions',
    canActivate: [AdminGuard],
    component: GameStartComponent,  // TODO: Replace with AdminQuestionsComponent
    data: { title: 'Gestión de Preguntas' }
  },

  // Admin - Settings (Protected)
  {
    path: 'admin/settings',
    canActivate: [AdminGuard],
    component: GameStartComponent,  // TODO: Replace with AdminSettingsComponent
    data: { title: 'Configuración de Administrador' }
  },

  // ============================================================================
  // TIER 3: ROOT REDIRECT (Default route)
  // NOTA: pathMatch: 'full' asegura que solo "/" sea redirigido, no "/foo"
  // ============================================================================

  {
    path: '',
    redirectTo: '/play',
    pathMatch: 'full'
  },

  // ============================================================================
  // TIER 4: WILDCARD - 404 FALLBACK (MUST BE LAST!!!)
  // NOTA: NUNCA mover esta ruta antes - captura TODAS las rutas desconocidas
  // ============================================================================

  {
    path: '**',
    redirectTo: '/play'
  }
];
