# Mecánica de Juego - SG-IA

## 🎮 Visión General

El **GameBoardComponent** implementa la mecánica principal de trivia interactiva con **aprendizaje educativo** integrado. Cada respuesta va acompañada de una **explicación médica** para reforzar el conocimiento del jugador.

---

## 🔄 Flujo Principal del Juego

```
┌─────────────────────────┐
│   GameStartComponent    │  ← Player registra nombre + edad
│   POST /players         │
└────────────┬────────────┘
             │ OK + playerId
             ↓
    ┌────────────────────┐
    │ localStorage.playerId = 1
    │ Redirect → /game/board
    └────────────┬───────┘
                 ↓
    ┌───────────────────────────┐
    │  GameBoardComponent Init  │
    │  POST /games/start        │
    └────────────┬──────────────┘
                 │ session_id, difficulty
                 ↓
    ┌──────────────────────────┐
    │  Get Next Question       │
    │  GET /games/next         │
    │  + Query String          │
    │  category_id=1&diff=1.0  │
    └────────────┬─────────────┘
                 │
    ┌────────────▼──────────────────┐
    │ GAME STATE: PLAYING            │
    │ - Show Question               │
    │ - Show 4 Options (2x2 Grid)   │
    │ - Timer (30s countdown)        │
    └────────────┬──────────────────┘
                 │
    Player Selects → Option ID
                 │
    ┌────────────▼──────────────────┐
    │ GAME STATE: LOADING           │
    │ Submit Answer                 │
    │ POST /games/{id}/answer       │
    │ body: {                        │
    │   question_id,                │
    │   selected_option_id,         │
    │   is_correct,                 │
    │   time_taken                  │
    │ }                             │
    └────────────┬──────────────────┘
                 │
    ┌────────────▼──────────────────┐
    │ Response:                      │
    │ {                              │
    │   ok: true,                   │
    │   is_correct,                 │
    │   score,                      │
    │   lives,                      │
    │   status,                     │
    │   next_difficulty,            │
    │   explanation ★ CRÍTICO ★    │
    │   correct_option_id           │
    │ }                             │
    └────────────┬──────────────────┘
                 │
    ┌────────────▼──────────────────┐
    │ GAME STATE: FEEDBACK           │
    │ MOSTRAR MODAL EDUCATIVO:       │
    │ - ✅ o ❌ Icon                │
    │ - "Explicación Médica:"       │
    │   {explanation}               │
    │ - Respuesta correcta          │
    │ - Score delta                 │
    │ - Nueva dificultad            │
    └────────────┬──────────────────┘
                 │
                 │ Click "Siguiente Pregunta"
                 ↓
    ┌──────────────────────────────┐
    │ Update difficulty y state     │
    │ Load Next Question            │
    │ GET /games/next              │
    │ + category_id, new_difficulty │
    └────────────┬──────────────────┘
                 │
    ┌────────────▼──────────────────┐
    │ GAME STATE: PLAYING            │
    │ (Loop back to show question)   │
    └────────────┬──────────────────┘
                 │
        (Repeat until lives === 0)
                 │
    ┌────────────▼──────────────────┐
    │ GAME STATE: GAMEOVER           │
    │ - Show score                   │
    │ - Show questions answered      │
    │ - Auto-redirect to /profile    │
    └────────────┬──────────────────┘
                 │
                 ↓
    ┌────────────────────────┐
    │ PlayerProfileComponent │  ← Stats y historial
    └────────────────────────┘
```

---

## 🎯 Estados del Juego

### 1. **LOADING** 🔄
```
┌─────────────────────────────┐
│    [Spinner animado]        │
│  Cargando pregunta...       │
└─────────────────────────────┘
```
- Se muestra cuando:
  - Se inicia la sesión
  - Se carga una nueva pregunta
  - Se envía una respuesta

---

### 2. **PLAYING** 🎮
```
┌─────────────────────────────────────────┐
│  Header: Jugador | Dificultad | Vidas  │
├─────────────────────────────────────────┤
│                                         │
│        Pregunta #1            [30s] ⏱️ │
│                                         │
│   ¿Cuál es la función del DNA?         │
│                                         │
│  ┌─────────────────┐  ┌──────────────┐ │
│  │ Opción 1        │  │ Opción 2     │ │
│  │ (Seleccionable) │  │              │ │
│  └─────────────────┘  └──────────────┘ │
│                                         │
│  ┌─────────────────┐  ┌──────────────┐ │
│  │ Opción 3        │  │ Opción 4     │ │
│  │                 │  │              │ │
│  └─────────────────┘  └──────────────┘ │
│                                         │
│        [Enviar Respuesta]               │
│                                         │
└─────────────────────────────────────────┘
```

**Características**:
- **Pregunta**: Texto grande, centrado, legible
- **Opciones**: Grid 2x2, botones grandes, hover effect
- **Selección**: Border azul, fondo claro
- **Timer**: 30 segundos
  - Verde (>15s): ✅ Seguro
  - Amarillo (5-15s): ⚠️ Advertencia
  - Rojo (<5s): 🔴 Peligro (pulsante)
- **Auto-submit**: Si llega a 0s, se envía automáticamente

---

### 3. **FEEDBACK** 📚 (**CRÍTICO - EDUCATIVO**)
```
┌──────────────────────────────────────────┐
│              ✅ ¡Correcto!               │
├──────────────────────────────────────────┤
│                   +50 pts                │
│                                          │
│  📚 Explicación Médica:                 │
│  ┌──────────────────────────────────┐  │
│  │ El DNA es la molécula que        │  │
│  │ almacena la información genética │  │
│  │ en todas las células vivas. Su   │  │
│  │ estructura de doble hélice fue   │  │
│  │ descubierta por Watson y Crick   │  │
│  │ en 1953...                       │  │
│  └──────────────────────────────────┘  │
│                                          │
│  Respuesta Correcta:                    │
│  "Almacenar información genética"      │
│                                          │
│  Puntuación Total: 250                 │
│  Vidas Restantes: 3/3                  │
│  Nueva Dificultad: 1.2                 │
│                                          │
│      [Siguiente Pregunta →]             │
└──────────────────────────────────────────┘
```

**Elementos Clave**:
- ✅ **Indicador Visual**: Grande, animado (bounce)
- 📚 **Explicación Médica**:
  - Texto destacado en recuadro
  - Fuente clara y legible
  - Cita referencia/fuente si aplica
  - **OBLIGATORIO** antes de continuar
- ✔️ **Respuesta Correcta**: Resaltada en verde
- 📊 **Cambios de Estado**:
  - Score anterior → nuevo
  - Vidas: cantidad exacta
  - Dificultad: antes → después
- Animación suave de entrada

---

### 4. **GAMEOVER** 🏁
```
┌──────────────────────────────────────┐
│              🎮                       │
│                                      │
│         ¡Fin del Juego!             │
│                                      │
│  Completaste 15 preguntas con      │
│  una puntuación de 750 puntos.     │
│                                      │
│  Redirigiendo a tu perfil...       │
│  (2 segundos)                      │
└──────────────────────────────────────┘
```
- Auto-redirige a `/profile` después de 2s

---

## 📊 Variables de Estado (Signals)

```typescript
// Session data
sessionId: signal<number | null>
playerId: number
playerName: signal<string>
categoryId: signal<number>

// Game state
gameState: signal<'loading' | 'playing' | 'feedback' | 'gameover'>
isAnswering: signal<boolean>

// Question data
currentQuestion: signal<QuestionFull | null>
selectedOptionId: signal<number | null>

// Game progress
score: signal<number>
lives: signal<number>
difficulty: signal<number>
questionCount: signal<number>

// Feedback
feedbackData: signal<AnswerSubmitResponse | null>
isAnswerCorrect: signal<boolean>

// Timer
questionTimer: signal<number>
```

---

## ⏱️ Sistema de Timer

```
30s ────────────────────────────── 0s
│                                  │
├─ [0-5s]   🔴 DANGER (Pulsante)  │
├─ [5-15s]  🟡 WARNING             │
├─ [15-30s] 🟢 SAFE                │
│                                  │
└─ Auto-submit cuando llega a 0
```

**Características**:
- Countdown desde 30 segundos
- Update cada 1 segundo
- Colores semánticos
- Animación pulsante en rojo
- Auto-submit al expirar

---

## 🎨 Diseño Visual Detallado

### Header
```
┌────────────────────────────────────────────────────┐
│  👤 Juan    │   [███████░░░░] 1.5/5    │  ❤️❤️❤️  🏆250 │
└────────────────────────────────────────────────────┘
```
- **Izquierda**: Avatar + Nombre
- **Centro**: Barra de dificultad (visual progress)
- **Derecha**: Vidas (corazones) + Puntuación

### Question Card
```
┌─────────────────────────────────────────┐
│  Pregunta #1                  [30s] ⏱️  │
├─────────────────────────────────────────┤
│  ¿Cuál es la función del DNA?          │
└─────────────────────────────────────────┘
```

### Options Grid (2x2)
```
┌──────────────────┐  ┌──────────────────┐
│                  │  │                  │
│ Opción 1         │  │ Opción 2         │
│                  │  │                  │
└──────────────────┘  └──────────────────┘
┌──────────────────┐  ┌──────────────────┐
│                  │  │                  │
│ Opción 3         │  │ Opción 4         │
│                  │  │                  │
└──────────────────┘  └──────────────────┘
```

**Estados de Botón**:
- **Normal**: Border gris, fondo blanco
- **Hover**: Border azul, fondo azul claro
- **Selected**: Border azul, fondo azul claro, indicador relleno
- **Feedback (Correcto)**: Border verde, fondo verde claro
- **Feedback (Incorrecto)**: Border rojo, fondo rojo claro
- **Disabled**: Opaco 70%, sin cursor

---

## 🔌 Integración con API

### 1. startSession
```
POST /games/start
Body: {
  "player_id": 1,
  "start_difficulty": 1.0
}

Response: {
  "ok": true,
  "session_id": 42,
  "current_difficulty": 1.0,
  "status": "active"
}
```

### 2. getNextQuestion
```
GET /games/next?category_id=1&difficulty=1

Response: {
  "ok": true,
  "question": {
    "id": 15,
    "statement": "¿Cuál es la función del DNA?",
    "difficulty": 1,
    "category_id": 1,
    "options": [
      {
        "id": 1,
        "text": "Almacenar información genética",
        "is_correct": true
      },
      {
        "id": 2,
        "text": "Producir energía"
      },
      ...
    ]
  }
}
```

### 3. submitAnswer
```
POST /games/42/answer
Body: {
  "question_id": 15,
  "selected_option_id": 1,
  "is_correct": true,
  "time_taken": 8.5
}

Response: {
  "ok": true,
  "is_correct": true,
  "score": 250,
  "lives": 3,
  "status": "active",
  "next_difficulty": 1.2,
  "explanation": "El DNA es la molécula que...",
  "correct_option_id": 1
}
```

---

## 🎯 Lógica de Dificultad Adaptativa

```
Si respuesta CORRECTA:
  next_difficulty = current_difficulty + 0.1 (máx 5.0)

Si respuesta INCORRECTA:
  next_difficulty = current_difficulty - 0.1 (mín 1.0)
```

**Ejemplo**:
```
Pregunta 1: Dificultad 1.0
  ✅ Correcta → next: 1.1
Pregunta 2: Dificultad 1.1
  ❌ Incorrecta → next: 1.0
Pregunta 3: Dificultad 1.0
  ✅ Correcta → next: 1.1
```

---

## 💾 Almacenamiento Local

```javascript
localStorage.playerId       // ID del jugador (usado en init)
localStorage.playerName     // Nombre para display
localStorage.token         // JWT (solo para admin)
```

---

## 🚀 Flujo Completo de Inicio a Fin

### Escenario: Nuevo Jugador Juega

```
1. Usuario abre http://localhost:4200/
   → Redirige a /play

2. Ve GameStartComponent
   → Ingresa: "Juan" + 25

3. Click "¡Jugar Ahora!"
   → POST /players
   → Response: { ok: true, player: { id: 1 } }
   → localStorage.playerId = "1"
   → Redirige a /game/board

4. GameBoardComponent ngOnInit()
   → Lee localStorage.playerId = 1
   → Llama startSession(1, 1.0)
   → Response: { session_id: 42 }
   → this.sessionId.set(42)

5. Carga Primera Pregunta
   → GET /games/next?category_id=1&difficulty=1.0
   → Response: { question: {...} }
   → gameState.set('playing')

6. Usuario ve Pregunta
   → "¿Cuál es la función del DNA?"
   → 4 opciones en grid 2x2
   → Timer: 30s ✅

7. Usuario Selecciona Opción #1
   → selectedOptionId.set(1)
   → Botón se destaca

8. Usuario Click "Enviar Respuesta"
   → POST /games/42/answer
   → Body: { question_id: 15, selected_option_id: 1, is_correct: true, time_taken: 8.5 }
   → Response: { ok: true, is_correct: true, score: 250, explanation: "..." }

9. Mostrar Feedback
   → gameState.set('feedback')
   → Mostrar Modal:
      * ✅ ¡Correcto!
      * +50 pts
      * 📚 Explicación...
      * Score: 250
      * Vidas: 3/3
      * Dificultad: 1.1

10. Usuario Click "Siguiente"
    → Cargar Pregunta 2 con dificultad 1.1
    → Loop back a paso 5

...

15. Después de 15 preguntas, lives === 0
    → gameState.set('gameover')
    → Mostrar resumen
    → Auto-redirect a /profile (2s)
```

---

## 📈 Arquitectura del Componente

```
GameBoardComponent (Standalone)
├─ OnInit
│  ├─ Read localStorage.playerId
│  ├─ startSession(playerId)
│  └─ loadNextQuestion()
│
├─ selectOption(optionId)
│  └─ selectedOptionId.set(optionId)
│
├─ submitAnswer()
│  ├─ Stop timer
│  ├─ Determine is_correct
│  ├─ submitAnswer API
│  ├─ Update score, lives, difficulty
│  └─ gameState.set('feedback')
│
├─ nextQuestion()
│  └─ loadNextQuestion()
│
├─ startTimer() / stopTimer()
│
├─ endGame()
│  └─ Router.navigate(['/profile'])
│
└─ getOptionClass() / getTimerColor()
   └─ CSS class generation
```

---

## ⚡ Optimizaciones

- **Signals**: Reactividad sin RxJS en componente
- **Lazy Loading**: Preguntas se cargan una a una
- **Timer Precision**: clearInterval al cambiar estado
- **Memory Cleanup**: ngOnDestroy limpia timer
- **Responsive Design**: Mobile-first CSS
- **Accessibility**: Focus states, disabled buttons

---

## 🔒 Seguridad

- ✅ Validación de `playerId` desde localStorage
- ✅ Validación de `sessionId` antes de submit
- ✅ Error handling en todos los API calls
- ✅ No expone datos sensibles en UI
- ✅ Timer protegido contra manipulación (servidor valida)

---

**Commit**: `66083c0` - "Implement game mechanics with adaptive trivia board"

**Última actualización**: 2024-12-02
**Estado**: ✅ Game Mechanics Completada
