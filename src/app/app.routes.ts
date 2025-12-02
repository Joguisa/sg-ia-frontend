import { Routes } from '@angular/router';
import { GameStartComponent } from './features/game/start/game-start.component';
import { GameBoardComponent } from './features/game/board/game-board.component';
import { AdminLoginComponent } from './features/admin/login/admin-login.component';
import { AdminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  // ============================================================================
  // TIER 1: PUBLIC SPECIFIC ROUTES (Exact matches first - most specific)
  // ============================================================================

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

  // Public - Player Profile (placeholder)
  {
    path: 'profile',
    component: GameStartComponent,  // TODO: Replace with ProfileComponent
    data: { title: 'Mi Perfil' }
  },

  // Admin - Login (Public access needed to login)
  {
    path: 'admin/login',
    component: AdminLoginComponent,
    data: { title: 'Acceso de Administrador' }
  },

  // ============================================================================
  // TIER 2: PROTECTED ADMIN ROUTES (with AdminGuard)
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
  // ============================================================================

  {
    path: '',
    redirectTo: '/play',
    pathMatch: 'full'
  },

  // ============================================================================
  // TIER 4: WILDCARD - 404 FALLBACK (MUST BE LAST)
  // ============================================================================

  {
    path: '**',
    redirectTo: '/play'
  }
];
