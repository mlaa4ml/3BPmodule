import state from './state.js';
import { validateBoard } from './utils.js';
import { createShapeCanvas, updateScoreDisplay, updateTaskDisplay, showNotification } from './ui.js';
import { initLogger } from './logger.js';
import {
    checkMatches,
    handleMatches,
    handleBonusTileAction,
    handleBonusStarSwap
} from './match.js';
import {
    loadTask,
    generateNewTask,
    checkTaskCompletion
} from './tasks.js';

import {
    handleClick,
    handleDoubleClick,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd
} from './input.js';

import { render, updateAnimations } from './render.js';

// Game initialization
document.addEventListener('DOMContentLoaded', () => {
    initLogger();
    console.log('DOM fully loaded, initializing game...');
    if (!state.isGameInitialized) {
        initGame();
    } else {
        console.log('Game already initialized, skipping...');
    }
}, { once: true });

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

window.addEventListener('resize', adjustCanvasSize);

function adjustCanvasSize() {
    const containerWidth = document.getElementById('game-container').offsetWidth;
    const maxCanvasWidth = Math.min(containerWidth - 20, 360);
    state.TILE_SIZE = Math.floor(maxCanvasWidth / state.GRID_WIDTH);
    canvas.width = state.GRID_WIDTH * state.TILE_SIZE;
    canvas.height = state.GRID_HEIGHT * state.TILE_SIZE;
    if (state.board.length === state.GRID_HEIGHT) {
        updateBoardPositions();
    }
    render();
}

function initGame() {
    console.log('Initializing game...');
    if (state.isGameInitialized) {
        console.log('Game already initialized, skipping...');
        return;
    }
    state.isGameInitialized = true;

    try {
        if (!Number.isInteger(state.GRID_HEIGHT) || !Number.isInteger(state.GRID_WIDTH) || state.GRID_HEIGHT <= 0 || state.GRID_WIDTH <= 0) {
            throw new Error(`Invalid GRID_HEIGHT (${state.GRID_HEIGHT}) or GRID_WIDTH (${state.GRID_WIDTH})`);
        }

        state.score = 0;
        state.taskScore = 0;
        state.currentTaskIndex = 0;
        loadTask();
        initBoard();
        adjustCanvasSize();

        updateTaskDisplay(state.task, state.collectedShapes, state.movesLeft, state.shapeCanvases, state.selectedColors, state.selectedShapes);
        updateScoreDisplay(state.score, state.taskScore);

        canvas.removeEventListener('click', handleClick);
        canvas.removeEventListener('dblclick', handleDoubleClick);
        canvas.removeEventListener('touchstart', handleTouchStart);
        canvas.removeEventListener('touchmove', handleTouchMove);
        canvas.removeEventListener('touchend', handleTouchEnd);

        canvas.addEventListener('click', handleClick);
        canvas.addEventListener('dblclick', handleDoubleClick);
        canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
        canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
        canvas.addEventListener('touchend', handleTouchEnd, { passive: false });

        render();
        console.log('Game initialized successfully');
    } catch (e) {
        console.error(`Failed to initialize game: ${e.message}`);
        throw e;
    }
}

// Инициализация shape canvases
createShapeCanvas('square', '#ff5555', state.shapeCanvases);
createShapeCanvas('circle', '#55ff55', state.shapeCanvases);
createShapeCanvas('triangle', '#5555ff', state.shapeCanvases);


// Экспортируем для других модулей (например, tasks.js)
window.initBoard = initBoard;
window.swapTiles = swapTiles;
window.dropTiles = dropTiles;
window.fillBoard = fillBoard;
window.render = () => render(ctx, canvas);
