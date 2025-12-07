/**
 * Environment Configuration - Development
 *
 * Configuración de endpoints de la API backend.
 * IMPORTANTE: Todos los servicios deben usar estos endpoints centralizados.
 */
export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:8000',
  apiEndpoints: {
    // ========== AUTH (PUBLIC) ==========
    // AuthController - Autenticación de administradores
    auth: {
      /** POST /auth/login - Autenticar admin y obtener JWT */
      login: '/auth/login'
    },

    // ========== LOGS (PUBLIC) ==========
    // LogController - Registro de errores del frontend
    logs: {
      /** POST /logs/error - Registrar error del frontend */
      error: '/logs/error'
    },

    // ========== PLAYERS (PUBLIC) ==========
    // PlayerController - Gestión de jugadores
    players: {
      /** POST /players - Crear jugador */
      create: '/players',
      /** GET /players - Listar todos los jugadores */
      list: '/players'
    },

    // ========== GAMES (PUBLIC) ==========
    // GameController - Sesiones de juego
    games: {
      /** POST /games/start - Iniciar sesión de juego */
      start: '/games/start',
      /** GET /games/next - Obtener siguiente pregunta */
      next: '/games/next',
      /** POST /games/{sessionId}/answer - Enviar respuesta */
      answer: (sessionId: number) => `/games/${sessionId}/answer`
    },

    // ========== QUESTIONS (PUBLIC) ==========
    // QuestionController - Consulta de preguntas
    questions: {
      /** GET /questions/{id} - Obtener pregunta por ID */
      find: (id: number) => `/questions/${id}`,
      /** GET /questions - Listar todas las preguntas activas */
      list: '/questions'
    },

    // ========== STATISTICS (PUBLIC) ==========
    // StatisticsController - Estadísticas y leaderboard
    stats: {
      /** GET /stats/session/{id} - Estadísticas de sesión */
      session: (id: number) => `/stats/session/${id}`,
      /** GET /stats/player/{id} - Estadísticas globales del jugador */
      playerStats: (id: number) => `/stats/player/${id}`,
      /** GET /stats/leaderboard - Top 10 jugadores */
      leaderboard: '/stats/leaderboard'
    },

    // ========== ADMIN (PROTECTED - REQUIRES JWT) ==========
    // AdminController - Operaciones administrativas
    admin: {
      /** PUT /admin/questions/{id} - Actualizar enunciado de pregunta */
      updateQuestion: (id: number) => `/admin/questions/${id}`,
      /** PATCH /admin/questions/{id}/verify - Verificar/desverificar pregunta */
      verifyQuestion: (id: number) => `/admin/questions/${id}/verify`,
      /** DELETE /admin/questions/{id} - Eliminar pregunta */
      deleteQuestion: (id: number) => `/admin/questions/${id}`,
      /** GET /admin/questions - Obtener todas las preguntas con info de categoría */
      getQuestions: '/admin/questions',
      /** GET /admin/config/prompt - Obtener configuración de prompt IA */
      getPromptConfig: '/admin/config/prompt',
      /** PUT /admin/config/prompt - Actualizar configuración de prompt IA */
      updatePromptConfig: '/admin/config/prompt',
      /** POST /admin/categories - Crear categoría */
      createCategory: '/admin/categories',
      /** GET /admin/categories - Listar categorías */
      getCategories: '/admin/categories',
      /** DELETE /admin/categories/{id} - Eliminar categoría */
      deleteCategory: (id: number) => `/admin/categories/${id}`,
      /** POST /admin/generate-batch - Generar preguntas con IA (batch) */
      generateBatch: '/admin/generate-batch',
      /** GET /admin/dashboard - Estadísticas del dashboard admin */
      dashboardStats: '/admin/dashboard'
    }
  }
};
