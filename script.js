const gridContainer = document.getElementById('grid-container');
const setStartButton = document.getElementById('set-start');
const setEndButton = document.getElementById('set-end');
const setObstacleButton = document.getElementById('set-obstacle');
const setGateZoneButton = document.getElementById('set-gate-zone');
const setLastGateZoneButton = document.getElementById('set-last-gate-zone');
const calculateRouteButton = document.getElementById('calculate-route');
const routeList = document.getElementById('route-list');
const consoleOutput = document.getElementById('console-output');

const ROWS = 5;
const COLS = 4;

let start = null;
let end = null;
let lastGateZone = null;
let gateZones = [];
let obstacles = [];
let selectedMode = 'start';

function logToConsole(message) {
    const logEntry = document.createElement('div');
    logEntry.textContent = message;
    consoleOutput.appendChild(logEntry);
    consoleOutput.scrollTop = consoleOutput.scrollHeight;
}

// Initialize grid
for (let r = 0; r < ROWS * 2 + 1; r++) {
    for (let c = 0; c < COLS * 2 + 1; c++) {
        if (r % 2 === 0) {
            const horizontalLine = document.createElement('div');
            horizontalLine.classList.add('border-line', 'horizontal');
            horizontalLine.dataset.row = Math.floor(r / 2);
            horizontalLine.dataset.col = Math.floor(c / 2);
            horizontalLine.addEventListener('click', () => handleBorderClick(horizontalLine));
            gridContainer.appendChild(horizontalLine);
        } else if (c % 2 === 0) {
            const verticalLine = document.createElement('div');
            verticalLine.classList.add('border-line', 'vertical');
            verticalLine.dataset.row = Math.floor(r / 2);
            verticalLine.dataset.col = Math.floor(c / 2);
            verticalLine.addEventListener('click', () => handleBorderClick(verticalLine));
            gridContainer.appendChild(verticalLine);
        } else {
            const cell = document.createElement('div');
            cell.classList.add('grid-cell');
            cell.dataset.row = Math.floor(r / 2);
            cell.dataset.col = Math.floor(c / 2);
            cell.addEventListener('click', () => handleCellClick(cell));
            gridContainer.appendChild(cell);
        }
    }
}

setStartButton.addEventListener('click', () => selectedMode = 'start');
setEndButton.addEventListener('click', () => selectedMode = 'end');
setObstacleButton.addEventListener('click', () => selectedMode = 'obstacle');
setGateZoneButton.addEventListener('click', () => selectedMode = 'gate-zone');
setLastGateZoneButton.addEventListener('click', () => selectedMode = 'last-gate-zone');
calculateRouteButton.addEventListener('click', calculateRoute);

function handleCellClick(cell) {
    const row = Number(cell.dataset.row);
    const col = Number(cell.dataset.col);

    switch (selectedMode) {
        case 'end':
            if (end) {
                const prevEndCell = gridContainer.querySelector(`.grid-cell[data-row="${end.row}"][data-col="${end.col}"]`);
                prevEndCell && prevEndCell.classList.remove('end');
            }
            cell.classList.add('end');
            end = { row, col };
            break;
        case 'gate-zone':
            const gateZoneIndex = gateZones.findIndex(zone => zone.row === row && zone.col === col);
            if (gateZoneIndex !== -1) {
                cell.classList.remove('gate-zone');
                gateZones.splice(gateZoneIndex, 1);
            } else {
                cell.classList.add('gate-zone');
                gateZones.push({ row, col });
            }
            break;
        case 'last-gate-zone':
            if (lastGateZone) {
                const prevLastGateZoneCell = gridContainer.querySelector(`.grid-cell[data-row="${lastGateZone.row}"][data-col="${lastGateZone.col}"]`);
                prevLastGateZoneCell && prevLastGateZoneCell.classList.remove('last-gate-zone');
            }
            cell.classList.add('last-gate-zone');
            lastGateZone = { row, col };
            break;
        default:
    }
}

function handleBorderClick(border) {
    const type = border.classList.contains('horizontal') ? 'horizontal' : 'vertical';
    const row = Number(border.dataset.row);
    const col = Number(border.dataset.col);

    if (selectedMode === 'start') {
        if (start) {
            const prevStartBorder = gridContainer.querySelector('.border-line.clicked.start');
            prevStartBorder && prevStartBorder.classList.remove('start');
        }
        border.classList.add('clicked', 'start');
        start = { type, row, col };
    } else if (selectedMode === 'obstacle') {
        const obstacle = { type, row, col };
        const obstacleIndex = obstacles.findIndex(obs => obs.type === type && obs.row === row && obs.col === col);

        if (obstacleIndex !== -1) {
            border.classList.remove('clicked');
            obstacles.splice(obstacleIndex, 1);
        } else {
            border.classList.add('clicked');
            obstacles.push(obstacle);
        }
    }
}

function calculateRoute() {
    if (!start || !end || gateZones.length === 0 || !lastGateZone) {
        logToConsole('Please select start, end, gate zones, and last gate zone.');
        return;
    }

    // Clear previous path
    document.querySelectorAll('.path').forEach(cell => cell.classList.remove('path'));
    routeList.innerHTML = '';

    const bestPath = findBestPath(start, end, gateZones, obstacles, lastGateZone);
    if (bestPath) {
        bestPath.forEach(({ row, col }) => {
            const cell = gridContainer.querySelector(`.grid-cell[data-row="${row}"][data-col="${col}"]`);
            cell && cell.classList.add('path');
        });

        logToConsole(`Route found with distance ${bestPath.length} and ${countTurns(bestPath)} turns.`);
        updateRouteList(bestPath);
    } else {
        logToConsole('No path found.');
    }
}

function updateRouteList(path) {
    const directions = path.map((step, index) => {
        if (index === 0) return { ...step, direction: 'Enter Contest Zone' };

        const prev = path[index - 1];
        const dir = getDirection(prev, step);
        const isGateZone = gateZones.some(gz => gz.row === step.row && gz.col === step.col);
        const isLastGateZone = lastGateZone.row === step.row && lastGateZone.col === step.col;
        const directionText = isLastGateZone ? 'Enter Last Gate Zone' : isGateZone ? 'Enter Gate Zone' : dir;

        return { ...step, direction: directionText };
    });

    directions.forEach(({ row, col, direction }, index) => {
        const routeItem = document.createElement('div');
        routeItem.textContent = `Row: ${row}, Col: ${col}, ${index ? 'Move: ' : ''}${direction}`;
        routeList.appendChild(routeItem);
    });
}

function getDirection(prev, curr) {
    if (prev.row === curr.row) {
        return curr.col > prev.col ? 'right' : 'left';
    } else {
        return curr.row > prev.row ? 'down' : 'up';
    }
}

function findBestPath(start, end, gateZones, obstacles, lastGateZone) {
    const permutations = getPermutations(gateZones);
    let shortestPath = null;
    let shortestDistance = Infinity;
    let leastTurns = Infinity;

    permutations.forEach(perm => {
        const path = findPathThroughGates(start, end, perm, obstacles, lastGateZone);
        if (path) {
            const distance = path.length;
            const turns = countTurns(path);
            if (distance < shortestDistance || (distance === shortestDistance && turns < leastTurns)) {
                shortestPath = path;
                shortestDistance = distance;
                leastTurns = turns;
            }
        }
    });

    return shortestPath;
}

function findPathThroughGates(start, end, gates, obstacles, lastGateZone) {
    let totalPath = [];
    let currentStart = start;

    for (let i = 0; i < gates.length; i++) {
        const currentEnd = gates[i];
        const segment = findPath(currentStart, currentEnd, obstacles);
        if (!segment) return null;

        totalPath = totalPath.concat(segment.slice(i === 0 ? 0 : 1)); // Avoid duplicating start points
        currentStart = currentEnd;
    }

    // Now, enter the last gate zone
    const segmentToLastGate = findPath(currentStart, lastGateZone, obstacles);
    if (!segmentToLastGate) return null;

    totalPath = totalPath.concat(segmentToLastGate.slice(1)); // Avoid duplicating start points
    currentStart = lastGateZone;

    // Finally, go to the end
    const segmentToEnd = findPath(currentStart, end, obstacles);
    if (!segmentToEnd) return null;

    totalPath = totalPath.concat(segmentToEnd.slice(1)); // Avoid duplicating start points

    return totalPath;
}

function findPath(start, end, obstacles) {
    const openSet = [];
    const closedSet = [];
    const cameFrom = new Map();
    const gScore = new Map();
    const fScore = new Map();
    const directionFrom = new Map();

    const startKey = `${start.row},${start.col}`;
    const endKey = `${end.row},${end.col}`;

    openSet.push(start);
    gScore.set(startKey, 0);
    fScore.set(startKey, heuristic(start, end));
    directionFrom.set(startKey, null);

    while (openSet.length > 0) {
        openSet.sort((a, b) => {
            const fScoreA = fScore.get(`${a.row},${a.col}`);
            const fScoreB = fScore.get(`${b.row},${b.col}`);
            const turnsA = countTurns(reconstructPath(cameFrom, a));
            const turnsB = countTurns(reconstructPath(cameFrom, b));
            return fScoreA === fScoreB ? turnsA - turnsB : fScoreA - fScoreB;
        });

        const current = openSet.shift();
        const currentKey = `${current.row},${current.col}`;

        if (current.row === end.row && current.col === end.col) {
            return reconstructPath(cameFrom, current);
        }

        closedSet.push(current);

        getNeighbors(current, obstacles).forEach(neighbor => {
            const neighborKey = `${neighbor.row},${neighbor.col}`;
            const direction = getDirection(current, neighbor);
            const previousDirection = directionFrom.get(currentKey);

            if (closedSet.find(node => node.row === neighbor.row && node.col === neighbor.col) ||
                obstacles.find(obs => isObstacle(obs, current, neighbor))) {
                return;
            }

            const turnPenalty = previousDirection && previousDirection !== direction ? 10 : 0;
            const tentativeGScore = gScore.get(currentKey) + 1 + turnPenalty;

            if (!openSet.find(node => node.row === neighbor.row && node.col === neighbor.col)) {
                openSet.push(neighbor);
            } else if (tentativeGScore >= gScore.get(neighborKey)) {
                return;
            }

            cameFrom.set(neighborKey, current);
            gScore.set(neighborKey, tentativeGScore);
            fScore.set(neighborKey, tentativeGScore + heuristic(neighbor, end));
            directionFrom.set(neighborKey, direction);
        });
    }

    return null;
}

function heuristic(node, goal) {
    // Manhattan distance
    return Math.abs(node.row - goal.row) + Math.abs(node.col - goal.col);
}

function countTurns(path) {
    if (path.length < 2) return 0;

    let turns = 0;
    let previousDirection = getDirection(path[0], path[1]);

    for (let i = 2; i < path.length; i++) {
        const currentDirection = getDirection(path[i - 1], path[i]);
        if (currentDirection !== previousDirection) {
            turns++;
            previousDirection = currentDirection;
        }
    }
    return turns;
}

function getNeighbors(node, obstacles) {
    const { row, col } = node;
    const neighbors = [];

    // Check for obstacles in the intended direction
    if (row > 0 && !isObstacleInDirection(node, { row: row - 1, col }, obstacles)) neighbors.push({ row: row - 1, col });
    if (row < ROWS - 1 && !isObstacleInDirection(node, { row: row + 1, col }, obstacles)) neighbors.push({ row: row + 1, col });
    if (col > 0 && !isObstacleInDirection(node, { row, col: col - 1 }, obstacles)) neighbors.push({ row, col: col - 1 });
    if (col < COLS - 1 && !isObstacleInDirection(node, { row, col: col + 1 }, obstacles)) neighbors.push({ row, col: col + 1 });

    return neighbors;
}

function reconstructPath(cameFrom, current) {
    const totalPath = [current];
    while (cameFrom.has(`${current.row},${current.col}`)) {
        current = cameFrom.get(`${current.row},${current.col}`);
        totalPath.push(current);
    }
    return totalPath.reverse();
}

function isObstacle(obstacle, current, neighbor) {
    if (obstacle.type === 'horizontal') {
        // Horizontal obstacle blocks upward movement
        if (obstacle.row === current.row && obstacle.col === current.col && neighbor.row === current.row - 1) {
            return true;
        }
        // Horizontal obstacle blocks downward movement
        if (obstacle.row === current.row + 1 && obstacle.col === current.col && neighbor.row === current.row + 1) {
            return true;
        }
    }
    if (obstacle.type === 'vertical') {
        // Vertical obstacle blocks left movement
        if (obstacle.row === current.row && obstacle.col === current.col && neighbor.col === current.col - 1) {
            return true;
        }
        // Vertical obstacle blocks right movement
        if (obstacle.row === current.row && obstacle.col === current.col + 1 && neighbor.col === current.col + 1) {
            return true;
        }
    }
    return false;
}

function isObstacleInDirection(current, neighbor, obstacles) {
    return obstacles.some(obstacle => isObstacle(obstacle, current, neighbor));
}

function getPermutations(arr) {
    if (arr.length === 0) return [[]];
    const permutations = [];
    arr.forEach((item, index) => {
        const rest = arr.slice(0, index).concat(arr.slice(index + 1));
        getPermutations(rest).forEach(perm => {
            permutations.push([item].concat(perm));
        });
    });
    return permutations;
}

function countTurns(path) {
    let turns = 0;
    let previousDirection = getDirection(path[0], path[1]);

    for (let i = 2; i < path.length; i++) {
        const currentDirection = getDirection(path[i - 1], path[i]);
        if (currentDirection !== previousDirection) {
            turns++;
            previousDirection = currentDirection;
        }
    }
    return turns;
}
