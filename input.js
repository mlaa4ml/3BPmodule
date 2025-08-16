import state from './state.js';
import { isAdjacent } from './utils.js';
import { updateScoreDisplay, updateTaskDisplay } from './ui.js';
import {
    handleBonusTileAction,
    handleBonusStarSwap,
    checkMatches,
    handleMatches
} from './match.js';
import { checkTaskCompletion } from './tasks.js';
import { swapTiles } from './board.js'; // swapTiles тоже лучше вынести в board.js
import { render, initBoard, dropTiles, fillBoard } from './game.js'; // если эти функции экспортируются

export function handleTouchStart(event, canvas) {
    if (state.isProcessing) return;
    event.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const x = event.touches[0].clientX - rect.left;
    const y = event.touches[0].clientY - rect.top;
    const col = Math.floor(x / state.TILE_SIZE);
    const row = Math.floor(y / state.TILE_SIZE);
    if (row < 0 || row >= state.GRID_HEIGHT || col < 0 || col >= state.GRID_WIDTH || !state.board[row]?.[col]) return;

    state.touchStartTile = { row, col };
    state.touchMoved = false;
    state.selectedTile = { row, col };
    render();
}

export function handleTouchMove(event) {
    if (!state.touchStartTile) return;
    event.preventDefault();
    state.touchMoved = true;
}

export function handleTouchEnd(event, canvas) {
    if (!state.touchStartTile) return;
    event.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const x = event.changedTouches[0].clientX - rect.left;
    const y = event.changedTouches[0].clientY - rect.top;
    const col = Math.floor(x / state.TILE_SIZE);
    const row = Math.floor(y / state.TILE_SIZE);

    if (!state.touchMoved) {
        const tile = state.board[state.touchStartTile.row][state.touchStartTile.col];
        if (tile.bonusType === 'horizontal_arrow' || tile.bonusType === 'vertical_arrow') {
            state.isProcessing = true;
            handleBonusTileAction(
                state.touchStartTile.row,
                state.touchStartTile.col,
                tile.bonusType,
                render,
                (...args) => checkTaskCompletion(initBoard, updateTaskDisplay, updateScoreDisplay, render),
                dropTiles,
                fillBoard
            ).then(() => {
                checkTaskCompletion(initBoard, updateTaskDisplay, updateScoreDisplay, render);
                state.isProcessing = false;
                render();
            });
        }
    } else if (row >= 0 && row < state.GRID_HEIGHT && col >= 0 && col < state.GRID_WIDTH && state.board[row]?.[col]) {
        const sr = state.touchStartTile.row;
        const sc = state.touchStartTile.col;
        if (isAdjacent(sr, sc, row, col)) {
            state.isProcessing = true;
            state.movesLeft--;
            updateTaskDisplay(state.task, state.collectedShapes, state.movesLeft, state.shapeCanvases, state.selectedColors, state.selectedShapes);
            const tile1 = state.board[sr][sc];
            const tile2 = state.board[row][col];
            if (tile1.bonusType === 'bonus_star' || tile2.bonusType === 'bonus_star') {
                handleBonusStarSwap(
                    sr, sc, row, col,
                    render,
                    (...args) => checkTaskCompletion(initBoard, updateTaskDisplay, updateScoreDisplay, render),
                    dropTiles,
                    fillBoard
                ).then(() => {
                    checkTaskCompletion(initBoard, updateTaskDisplay, updateScoreDisplay, render);
                    state.isProcessing = false;
                    render();
                });
            } else {
                swapTiles(sr, sc, row, col).then(() => {
                    const matches = checkMatches();
                    if (matches) {
                        handleMatches(
                            render,
                            (...args) => checkTaskCompletion(initBoard, updateTaskDisplay, updateScoreDisplay, render),
                            dropTiles,
                            fillBoard
                        ).then(() => checkTaskCompletion(initBoard, updateTaskDisplay, updateScoreDisplay, render));
                    } else {
                        swapTiles(sr, sc, row, col).then(() => {
                            state.isProcessing = false;
                            state.movesLeft++;
                            updateTaskDisplay(state.task, state.collectedShapes, state.movesLeft, state.shapeCanvases, state.selectedColors, state.selectedShapes);
                            render();
                        });
                    }
                    state.selectedTile = null;
                });
            }
        }
    }

    state.touchStartTile = null;
    state.selectedTile = null;
    render();
}

export function handleDoubleClick(event, canvas) {
    if (state.isProcessing) return;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const col = Math.floor(x / state.TILE_SIZE);
    const row = Math.floor(y / state.TILE_SIZE);
    if (row < 0 || row >= state.GRID_HEIGHT || col < 0 || col >= state.GRID_WIDTH || !state.board[row]?.[col]) return;

    const tile = state.board[row][col];
    if (tile.bonusType === 'horizontal_arrow' || tile.bonusType === 'vertical_arrow') {
        state.isProcessing = true;
        handleBonusTileAction(
            row, col, tile.bonusType,
            render,
            (...args) => checkTaskCompletion(initBoard, updateTaskDisplay, updateScoreDisplay, render),
            dropTiles,
            fillBoard
        ).then(() => {
            checkTaskCompletion(initBoard, updateTaskDisplay, updateScoreDisplay, render);
            state.isProcessing = false;
            render();
        });
    }
}

export function handleClick(event, canvas) {
    if (state.isProcessing) return;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const col = Math.floor(x / state.TILE_SIZE);
    const row = Math.floor(y / state.TILE_SIZE);
    if (row < 0 || row >= state.GRID_HEIGHT || col < 0 || col >= state.GRID_WIDTH || !state.board[row]?.[col]) return;

    if (!state.selectedTile) {
        state.selectedTile = { row, col };
        render();
    } else {
        const sr = state.selectedTile.row;
        const sc = state.selectedTile.col;
        if (isAdjacent(sr, sc, row, col)) {
            state.isProcessing = true;
            state.movesLeft--;
            updateTaskDisplay(state.task, state.collectedShapes, state.movesLeft, state.shapeCanvases, state.selectedColors, state.selectedShapes);
            const tile1 = state.board[sr][sc];
            const tile2 = state.board[row][col];
            if (tile1.bonusType === 'bonus_star' || tile2.bonusType === 'bonus_star') {
                handleBonusStarSwap(
                    sr, sc, row, col,
                    render,
                    (...args) => checkTaskCompletion(initBoard, updateTaskDisplay, updateScoreDisplay, render),
                    dropTiles,
                    fillBoard
                ).then(() => {
                    checkTaskCompletion(initBoard, updateTaskDisplay, updateScoreDisplay, render);
                    state.isProcessing = false;
                    render();
                });
            } else {
                swapTiles(sr, sc, row, col).then(() => {
                    const matches = checkMatches();
                    if (matches) {
                        handleMatches(
                            render,
                            (...args) => checkTaskCompletion(initBoard, updateTaskDisplay, updateScoreDisplay, render),
                            dropTiles,
                            fillBoard
                        ).then(() => checkTaskCompletion(initBoard, updateTaskDisplay, updateScoreDisplay, render));
                    } else {
                        swapTiles(sr, sc, row, col).then(() => {
                            state.isProcessing = false;
                            state.movesLeft++;
                            updateTaskDisplay(state.task, state.collectedShapes, state.movesLeft, state.shapeCanvases, state.selectedColors, state.selectedShapes);
                            render();
                        });
                    }
                    state.selectedTile = null;
                });
            }
        } else {
            state.selectedTile = { row, col };
            render();
        }
    }
}