export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:8000',
  apiEndpoints: {
    // Auth
    auth: {
      login: '/auth/login'
    },
    // Players
    players: {
      create: '/players',
      list: '/players'
    },
    // Games
    games: {
      start: '/games/start',
      next: '/games/next',
      answer: (sessionId: number) => `/games/${sessionId}/answer`
    },
    // Questions
    questions: {
      find: (id: number) => `/questions/${id}`
    },
    // Statistics
    stats: {
      session: (id: number) => `/stats/session/${id}`,
      playerStats: (id: number) => `/stats/player/${id}`,
      leaderboard: '/stats/leaderboard'
    },
    // Admin (Autenticado)
    admin: {
      updateQuestion: (id: number) => `/admin/questions/${id}`,
      verifyQuestion: (id: number) => `/admin/questions/${id}/verify`,
      getPromptConfig: '/admin/config/prompt',
      updatePromptConfig: '/admin/config/prompt',
      createCategory: '/admin/categories',
      deleteCategory: (id: number) => `/admin/categories/${id}`,
      generateBatch: '/admin/generate-batch',
      dashboardStats: '/admin/dashboard'
    }
  }
};
