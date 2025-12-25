import { Routes } from '@angular/router';
import { GameStartComponent } from './features/game/start/game-start.component';
import { GameBoardComponent } from './features/game/board/game-board.component';
import { AdminLoginComponent } from './features/admin/login/admin-login.component';
import { AdminDashboardComponent } from './features/admin/dashboard/admin-dashboard.component';
import { AdminQuestionsComponent } from './features/admin/questions/admin-questions.component';
import { AdminSettingsComponent } from './features/admin/settings/admin-settings.component';
import { AdminPlayersComponent } from './features/admin/players/admin-players.component';
import { PlayerProfileComponent } from './features/profile/player-profile.component';
import { LeaderboardComponent } from './features/leaderboard/leaderboard.component';
import { AdminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  // Admin - Login (Public access needed to login)
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

  // Public - Leaderboard
  {
    path: 'leaderboard',
    component: LeaderboardComponent,
    data: { title: 'Clasificación' }
  },

  // Public - Player Profile
  {
    path: 'profile',
    component: PlayerProfileComponent,
    data: { title: 'Mi Perfil' }
  },

  // Admin - Dashboard (Protected)
  {
    path: 'admin/dashboard',
    canActivate: [AdminGuard],
    component: AdminDashboardComponent,
    data: { title: 'Panel de Administrador' }
  },

  // Admin - Questions Management (Protected)
  {
    path: 'admin/questions',
    canActivate: [AdminGuard],
    component: AdminQuestionsComponent,
    data: { title: 'Gestión de Preguntas' }
  },

  // Admin - Settings (Protected)
  {
    path: 'admin/settings',
    canActivate: [AdminGuard],
    component: AdminSettingsComponent,
    data: { title: 'Configuración de Administrador' }
  },

  // Admin - Players Management (Protected)
  {
    path: 'admin/players',
    canActivate: [AdminGuard],
    component: AdminPlayersComponent,
    data: { title: 'Gestión de Jugadores' }
  },

  {
    path: '',
    redirectTo: '/play',
    pathMatch: 'full'
  },

  {
    path: '**',
    redirectTo: '/play'
  }
];
