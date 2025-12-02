import { Routes } from '@angular/router';
import { GameStartComponent } from './features/game/start/game-start.component';
import { GameBoardComponent } from './features/game/board/game-board.component';
import { AdminLoginComponent } from './features/admin/login/admin-login.component';
import { AdminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  // Default route - redirect to play
  {
    path: '',
    redirectTo: '/play',
    pathMatch: 'full'
  },

  // Public - Player Entry
  {
    path: 'play',
    component: GameStartComponent
  },

  // Public - Game Board
  {
    path: 'game',
    children: [
      {
        path: 'board',
        component: GameBoardComponent
      }
    ]
  },

  // Public - Leaderboard (placeholder)
  {
    path: 'leaderboard',
    component: GameStartComponent  // TODO: Replace with LeaderboardComponent
  },

  // Public - Player Profile (placeholder)
  {
    path: 'profile',
    component: GameStartComponent  // TODO: Replace with ProfileComponent
  },

  // Admin - Login
  {
    path: 'admin/login',
    component: AdminLoginComponent
  },

  // Admin - Dashboard (Protected)
  {
    path: 'admin/dashboard',
    canActivate: [AdminGuard],
    component: GameStartComponent  // TODO: Replace with AdminDashboardComponent
  },

  // Admin - Questions (Protected)
  {
    path: 'admin/questions',
    canActivate: [AdminGuard],
    component: GameStartComponent  // TODO: Replace with AdminQuestionsComponent
  },

  // Admin - Settings (Protected)
  {
    path: 'admin/settings',
    canActivate: [AdminGuard],
    component: GameStartComponent  // TODO: Replace with AdminSettingsComponent
  },

  // Wildcard - 404
  {
    path: '**',
    redirectTo: '/play'
  }
];
