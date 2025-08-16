import state from './state.js';
import { validateBoard } from './utils.js';
import { checkMatches } from './match.js';

// Инициализация доски
export function initBoard() {
    console.log('Initializing board...');
    try {
        if (!Number.isInteger(state.GRID_HEIGHT) || !Number.isInteger(state.GRID_WIDTH) || state.GRID_HEIGHT <= 0 || state.GRID_WIDTH <= 0) {
            throw new Error(`Invalid GRID_HEIGHT (${state.GRID_HEIGHT}) or GRID_WIDTH (${state.GRID_WIDTH})`);
        }

        console.log(`Creating board with ${state.GRID_HEIGHT} rows and ${state.GRID_WIDTH} columns`);
        state.board = Array(state.GRID_HEIGHT).fill().map(() => Array(state.GRID_WIDTH).fill(null));
        console.log('Board array created:', state.board);

        for (let row = 0; row < state.GRID_HEIGHT; row++) {
            for (let col = 0; col < state.GRID_WIDTH; col++) {
                state.board[row][col] = {
                    type: Math.floor(Math.random() * state.selectedShapes.length),
                    bonusType: null,
                    x: col * state.TILE_SIZE,
                    y: row * state.TILE_SIZE,
                    targetX: col * state.TILE_SIZE,
                    targetY: row * state.TILE_SIZE,
                    disappearing: false,
                    disappearProgress: 0
                };
            }
        }
        validateBoard(state.board, state.GRID_WIDTH, state.GRID_HEIGHT);
        resolveInitialMatches();
        validateBoard(state.board, state.GRID_WIDTH, state.GRID_HEIGHT);
        console.log('Board initialized successfully');
    } catch (e) {
        console.error(`Failed to initialize board: ${e.message}`);
        throw e;
    }
}

// Разрешение начальных матчей
export function resolveInitialMatches() {
    let iteration = 0;
    const maxIterations = 100;
    while (true) {
        const matches = checkMatches();
        if (!matches || iteration >= maxIterations) break;
        matches.forEach(match => {
            match.positions.forEach(pos => {
                if (!state.board[pos.row] || !state.board[pos.row][pos.col]) {
                    throw new Error(`Invalid board access at row ${pos.row}, col ${pos.col}`);
                }
                state.board[pos.row][pos.col].type = Math.floor(Math.random() * state.selectedShapes.length);
                state.board[pos.row][pos.col].bonusType = null;
            });
        });
        validateBoard(state.board, state.GRID_WIDTH, state.GRID_HEIGHT);
        iteration++;
    }
}

// Обновление позиций тайлов для рендера
export function updateBoardPositions() {
    if (!state.board || !Array.isArray(state.board)) {
        console.warn('updateBoardPositions: board is not initialized');
        return;
    }
    try {
        validateBoard(state.board, state.GRID_WIDTH, state.GRID_HEIGHT);
        for (let row = 0; row < state.GRID_HEIGHT; row++) {
            for (let col = 0; col < state.GRID_WIDTH; col++) {
                if (state.board[row][col]) {
                    state.board[row][col].x = col * state.TILE_SIZE;
                    state.board[row][col].y = row * state.TILE_SIZE;
                    state.board[row][col].targetX = col * state.TILE_SIZE;
                    state.board[row][col].targetY = row * state.TILE_SIZE;
                }
            }
        }
    } catch (e) {
        console.error(`Error in updateBoardPositions: ${e.message}`);
    }
}

// Функция для падения тайлов вниз
export function dropTiles() {
    try {
        for (let col = 0; col < state.GRID_WIDTH; col++) {
            let emptyRow = state.GRID_HEIGHT - 1;
            for (let row = state.GRID_HEIGHT - 1; row >= 0; row--) {
                if (state.board[row][col] && !state.board[row][col].disappearing) {
                    if (row !== emptyRow) {
                        state.board[emptyRow][col] = state.board[row][col];
                        state.board[emptyRow][col].targetY = emptyRow * state.TILE_SIZE;
                        state.animations.push({ row: emptyRow, col });
                        state.board[row][col] = null;
                    }
                    emptyRow--;
                }
            }
        }
        validateBoard(state.board, state.GRID_WIDTH, state.GRID_HEIGHT);
    } catch (e) {
        console.error(`Error in dropTiles: ${e.message}`);
    }
}

// Заполнение пустых мест на доске новыми тайлами
export function fillBoard() {
    try {
        for (let row = 0; row < state.GRID_HEIGHT; row++) {
            for (let col = 0; col < state.GRID_WIDTH; col++) {
                if (!state.board[row][col]) {
                    state.board[row][col] = {
                        type: Math.floor(Math.random() * state.selectedShapes.length),
                        bonusType: null,
                        x: col * state.TILE_SIZE,
                        y: -state.TILE_SIZE,
                        targetX: col * state.TILE_SIZE,
                        targetY: row * state.TILE_SIZE,
                        disappearing: false,
                        disappearProgress: 0
                    };
                    state.animations.push({ row, col });
                }
            }
        }
        validateBoard(state.board, state.GRID_WIDTH, state.GRID_HEIGHT);
    } catch (e) {
        console.error(`Error in fillBoard: ${e.message}`);
    }
}

// Асинхронная функция для свапа тайлов
export async function swapTiles(r1, c1, r2, c2) {
    try {
        const tile1 = state.board[r1][c1];
        const tile2 = state.board[r2][c2];
        state.board[r1][c1] = tile2;
        state.board[r2][c2] = tile1;

        tile1.targetX = c2 * state.TILE_SIZE;
        tile1.targetY = r2 * state.TILE_SIZE;
        tile2.targetX = c1 * state.TILE_SIZE;
        tile2.targetY = r1 * state.TILE_SIZE;

        state.animations.push({ row: r1, col: c1 }, { row: r2, col: c2 });
        // Можно добавить callback на рендер, если потребуется
        await new Promise(resolve => setTimeout(resolve, 200));
        validateBoard(state.board, state.GRID_WIDTH, state.GRID_HEIGHT);
    } catch (e) {
        console.error(`Error in swapTiles: ${e.message}`);
    }
}