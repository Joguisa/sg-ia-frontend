export const environment = {
  production: true,
  apiBaseUrl: 'https://franklinparrales.es/SGcolon/public',
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
      /** GET /stats/session/{id}/answers - Historial de respuestas de la sesión */
      sessionAnswers: (id: number) => `/stats/session/${id}/answers`,
      /** GET /stats/session/{id}/streaks - Rachas de la sesión */
      sessionStreaks: (id: number) => `/stats/session/${id}/streaks`,
      /** GET /stats/player/{id} - Estadísticas globales del jugador */
      playerStats: (id: number) => `/stats/player/${id}`,
      /** GET /stats/player/{id}/sessions - Sesiones del jugador */
      playerSessions: (id: number) => `/stats/player/${id}/sessions`,
      /** GET /stats/player/{id}/streaks - Rachas del jugador */
      playerStreaks: (id: number) => `/stats/player/${id}/streaks`,
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
      /** PATCH /admin/questions/{id}/restore - Restaurar pregunta eliminada */
      restoreQuestion: (id: number) => `/admin/questions/${id}/restore`,
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
      /** PUT /admin/categories/{id} - Actualizar categoría */
      updateCategory: (id: number) => `/admin/categories/${id}`,
      /** DELETE /admin/categories/{id} - Eliminar categoría */
      deleteCategory: (id: number) => `/admin/categories/${id}`,
      /** POST /admin/generate-batch - Generar preguntas con IA (batch) */
      generateBatch: '/admin/generate-batch',
      /** GET /admin/dashboard - Estadísticas del dashboard admin */
      dashboardStats: '/admin/dashboard',

      // ========== BATCH MANAGEMENT ==========
      /** GET /admin/batch-statistics - Estadísticas de todos los batches */
      batchStatistics: '/admin/batch-statistics',
      /** GET /admin/unverified - Preguntas sin verificar (opcional: ?batchId=X) */
      unverifiedQuestions: '/admin/unverified',
      /** POST /admin/batch/{batchId}/verify - Verificar todas las preguntas de un batch */
      verifyBatch: (batchId: number) => `/admin/batch/${batchId}/verify`,
      /** POST /admin/batch/import-csv - Importar preguntas desde CSV */
      importCsv: '/admin/batch/import-csv',
      /** GET /admin/csv-template - Descargar plantilla CSV */
      csvTemplate: '/admin/csv-template',
      /** PUT /admin/explanation/{explanationId} - Editar explicación */
      editExplanation: (explanationId: number) => `/admin/explanation/${explanationId}`,

      // ========== QUESTION FULL EDIT ==========
      /** GET /admin/questions/{id}/full - Obtener pregunta completa con opciones y explicaciones */
      getQuestionFull: (id: number) => `/admin/questions/${id}/full`,
      /** PUT /admin/questions/{id}/full - Actualizar pregunta completa */
      updateQuestionFull: (id: number) => `/admin/questions/${id}/full`,

      // ========== AI PROVIDERS ==========
      /** GET /admin/available-providers - Obtener proveedores de IA disponibles */
      availableProviders: '/admin/available-providers',

      // ========== ROOM MANAGEMENT ==========
      /** POST /admin/rooms - Crear sala */
      createRoom: '/admin/rooms',
      /** GET /admin/rooms - Listar todas las salas */
      listRooms: '/admin/rooms',
      /** GET /admin/rooms/{id} - Obtener sala por ID */
      getRoom: (id: number) => `/admin/rooms/${id}`,
      /** PUT /admin/rooms/{id} - Actualizar sala */
      updateRoom: (id: number) => `/admin/rooms/${id}`,
      /** DELETE /admin/rooms/{id} - Eliminar sala */
      deleteRoom: (id: number) => `/admin/rooms/${id}`,
      /** PATCH /admin/rooms/{id}/status - Cambiar estado de sala */
      updateRoomStatus: (id: number) => `/admin/rooms/${id}/status`,
      /** GET /admin/rooms/{id}/players - Obtener jugadores activos en sala */
      getRoomPlayers: (id: number) => `/admin/rooms/${id}/players`,
      /** GET /admin/rooms/{id}/stats - Obtener estadísticas de sala */
      getRoomStats: (id: number) => `/admin/rooms/${id}/stats`,
      /** GET /admin/rooms/{id}/stats/players - Estadísticas de jugadores en sala */
      getRoomPlayerStats: (id: number) => `/admin/rooms/${id}/stats/players`,
      /** GET /admin/rooms/{id}/stats/questions - Estadísticas de preguntas en sala */
      getRoomQuestionStats: (id: number) => `/admin/rooms/${id}/stats/questions`,
      /** GET /admin/rooms/{id}/stats/categories - Estadísticas por categoría en sala */
      getRoomCategoryStats: (id: number) => `/admin/rooms/${id}/stats/categories`,
      /** GET /admin/rooms/{id}/stats/analysis - Análisis de preguntas (Top 5 difíciles/fáciles) */
      getRoomQuestionAnalysis: (id: number) => `/admin/rooms/${id}/stats/analysis`,
      /** GET /admin/rooms/{id}/export/pdf - Exportar reporte PDF */
      exportRoomPdf: (id: number) => `/admin/rooms/${id}/export/pdf`,
      /** GET /admin/rooms/{id}/export/excel - Exportar reporte Excel */
      exportRoomExcel: (id: number) => `/admin/rooms/${id}/export/excel`,

      // ========== ADMIN USERS MANAGEMENT ==========
      /** GET /admin/admins - Listar administradores */
      listAdmins: '/admin/admins',
      /** GET /admin/admins/:id - Obtener administrador */
      getAdmin: (id: number) => `/admin/admins/${id}`,
      /** POST /admin/admins - Crear administrador (superadmin) */
      createAdmin: '/admin/admins',
      /** PUT /admin/admins/:id - Actualizar administrador (superadmin) */
      updateAdmin: (id: number) => `/admin/admins/${id}`,
      /** DELETE /admin/admins/:id - Borrado lógico (superadmin) */
      deleteAdmin: (id: number) => `/admin/admins/${id}`,
      /** PATCH /admin/admins/:id/status - Cambiar estado (superadmin) */
      toggleAdminStatus: (id: number) => `/admin/admins/${id}/status`

    },

    // ========== ROOMS PUBLIC ==========
    rooms: {
      /** GET /rooms/validate/{code} - Validar código de sala */
      validateCode: (code: string) => `/rooms/validate/${code}`
    }
  }
};
