// Nyckeln vi använder i LocalStorage.
const STORAGE_KEY = 'elevPlatserDrawn';

// KLASSRUMS KONFIGURATION
const CLASSROOM_CONFIG = {
    "Sal 302": {
        max_seats: 24,
        columns_per_row: 8,
        gang_column_width: "100px"
    },
    "NO Salen": {
        max_seats: 24,
        grid_template_columns: "40px repeat(4, 1fr) 80px repeat(2, 1fr)",
        layout_map: [
            { id: 24, row: 1, col: 2, span: 1 }, { id: 23, row: 1, col: 3, span: 1 }, { id: 22, row: 1, col: 4, span: 1 }, { id: 21, row: 1, col: 5, span: 1 },
            { id: 20, row: 1, col: 7, span: 1 }, { id: 19, row: 1, col: 8, span: 1 },
            { id: 18, row: 2, col: 2, span: 1 }, { id: 17, row: 2, col: 3, span: 1 }, { id: 16, row: 2, col: 4, span: 1 }, { id: 15, row: 2, col: 5, span: 1 },
            { id: 14, row: 2, col: 7, span: 1 }, { id: 13, row: 2, col: 8, span: 1 },
            { id: 12, row: 3, col: 2, span: 1 }, { id: 11, row: 3, col: 3, span: 1 }, { id: 10, row: 3, col: 4, span: 1 }, { id: 9, row: 3, col: 5, span: 1 },
            { id: 8, row: 3, col: 7, span: 1 }, { id: 7, row: 3, col: 8, span: 1 },
            { id: 6, row: 4, col: 2, span: 1 }, { id: 5, row: 4, col: 3, span: 1 }, { id: 4, row: 4, col: 4, span: 1 }, { id: 3, row: 4, col: 5, span: 1 },
            { id: 2, row: 4, col: 7, span: 1 }, { id: 1, row: 4, col: 8, span: 1 }
        ],
        whiteboard_position: {
            row: 5,
            col_start: 3,
            span: 6
        }
    }
};

// Globala variabler för tillstånd
let availableNumbers = [];
let lastDrawnNumber = null;
let currentClassroom = "Sal 302";

// Hämta DOM-element
const classroomSelect = document.getElementById('classroomSelect');
const maxPlatserInput = document.getElementById('maxPlatserInput');
const drawButton = document.getElementById('drawButton');
const resetButton = document.getElementById('resetButton');
const resultDisplay = document.getElementById('resultDisplay');
const remainingCount = document.getElementById('remainingCount');
const classroomLayout = document.getElementById('classroom-layout');

function sparaDragnaNummer(drawnList) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(drawnList)); } catch (e) { console.error("Kunde inte spara till LocalStorage", e); } }
function laddaDragnaNummer() { try { const stored = localStorage.getItem(STORAGE_KEY); return stored ? JSON.parse(stored) : []; } catch (e) { console.error("Kunde inte ladda från LocalStorage", e); return []; } }

function populateClassroomSelect() { for (const name in CLASSROOM_CONFIG) { const option = document.createElement('option'); option.value = name; option.textContent = name; classroomSelect.appendChild(option); } }

function renderDesks(max, drawnList = []) {
    classroomLayout.innerHTML = '';
    const config = CLASSROOM_CONFIG[currentClassroom];
    if (config.layout_map) {
        config.layout_map.forEach(deskInfo => {
            const desk = document.createElement('div');
            desk.className = 'desk';
            desk.id = `desk-${deskInfo.id}`;
            desk.textContent = `Plats ${deskInfo.id}`;
            desk.style.gridRow = deskInfo.row;
            desk.style.gridColumn = `${deskInfo.col} / span ${deskInfo.span}`;
            if (lastDrawnNumber === deskInfo.id) { desk.classList.add('current-draw'); }
            else if (drawnList.includes(deskInfo.id)) { desk.classList.add('drawn'); }
            classroomLayout.appendChild(desk);
        });
    } else {
        const seats_per_row = config.columns_per_row;
        const seats_per_side = seats_per_row / 2;
        let rowCounter = 1;
        let columnCounter = 1;
        for (let i = 1; i <= max; i++) {
            const desk = document.createElement('div');
            desk.className = 'desk';
            // Här används inte den gamla "reversed" logiken, numren kommer från allNumbers
            const deskNumber = max - i + 1; // Detta är bara för layout, inte logik
            desk.id = `desk-${deskNumber}`;
            desk.textContent = `Plats ${deskNumber}`;
            let gridColumnStart = (columnCounter <= seats_per_side) ? columnCounter : columnCounter + 1;
            desk.style.gridColumnStart = gridColumnStart;
            desk.style.gridRowStart = rowCounter;
            columnCounter++;
            if (columnCounter > seats_per_row) { columnCounter = 1; rowCounter++; }
            if (lastDrawnNumber === deskNumber) { desk.classList.add('current-draw'); }
            else if (drawnList.includes(deskNumber)) { desk.classList.add('drawn'); }
            classroomLayout.appendChild(desk);
        }
    }
    const whiteboard = document.createElement('div');
    whiteboard.id = 'whiteboard';
    whiteboard.textContent = 'WHITEBOARD';
    if (config.whiteboard_position) {
        const pos = config.whiteboard_position;
        whiteboard.style.gridRowStart = pos.row;
        whiteboard.style.gridColumnStart = pos.col_start;
        whiteboard.style.gridColumnEnd = 'span ' + pos.span;
    } else {
        const lastRowEl = classroomLayout.querySelector('.desk:last-child');
        const lastRow = lastRowEl ? parseInt(lastRowEl.style.gridRowStart) + 1 : 1;
        whiteboard.style.gridRowStart = lastRow;
        whiteboard.style.gridColumnStart = 1;
        whiteboard.style.gridColumnEnd = 'span ' + (config.columns_per_row / 2);
    }
    classroomLayout.appendChild(whiteboard);
}

function updateUI() {
    const totalPlatser = parseInt(maxPlatserInput.value);
    const draggedPlatser = totalPlatser - availableNumbers.length;
    remainingCount.textContent = `Draget: ${draggedPlatser} av ${totalPlatser} platser`;
    drawButton.disabled = availableNumbers.length === 0;
    drawButton.textContent = availableNumbers.length === 0 ? "Alla platser dragna!" : "Drag Nästa Plats";
}

function initializeNumbersAndLayout() {
    const config = CLASSROOM_CONFIG[currentClassroom];
    maxPlatserInput.value = config.max_seats;
    const max = parseInt(maxPlatserInput.value);
    if (isNaN(max) || max <= 0) { classroomLayout.innerHTML = 'Välj en sal för att börja.'; availableNumbers = []; updateUI(); return; }
    const drawnNumbers = laddaDragnaNummer();
    let allNumbers;
    if (config.layout_map) {
        allNumbers = config.layout_map.map(desk => desk.id);
    } else {
        // HÄR ÄR DEN KORRIGERADE RADEN
        allNumbers = Array.from({ length: max }, (_, i) => i + 1);
    }
    availableNumbers = allNumbers.filter(n => !drawnNumbers.includes(n));
    renderDesks(max, drawnNumbers);
    resultDisplay.textContent = drawnNumbers.length > 0 ? "Session Återupptagen" : "?";
    lastDrawnNumber = null;
    updateUI();
}

function handleClassroomChange() {
    const selectedSal = classroomSelect.value;
    const config = CLASSROOM_CONFIG[selectedSal];
    if (!config) return;
    currentClassroom = selectedSal;
    if (config.grid_template_columns) {
        classroomLayout.style.gridTemplateColumns = config.grid_template_columns;
    } else {
        const seats_per_side = config.columns_per_row / 2;
        classroomLayout.style.gridTemplateColumns = `repeat(${seats_per_side}, 1fr) ${config.gang_column_width} repeat(${seats_per_side}, 1fr)`;
    }
    if (config.grid_template_rows) { // Denna rad finns kvar för framtida bruk
        classroomLayout.style.gridTemplateRows = config.grid_template_rows;
    } else {
        classroomLayout.style.gridTemplateRows = '';
    }
    localStorage.removeItem(STORAGE_KEY);
    initializeNumbersAndLayout();
}

function drawRandomNumber() {
    if (availableNumbers.length > 0) {
        if (lastDrawnNumber) {
            const lastDesk = document.getElementById(`desk-${lastDrawnNumber}`);
            if (lastDesk) { lastDesk.classList.remove('current-draw'); lastDesk.classList.add('drawn'); }
        }
        const randomIndex = Math.floor(Math.random() * availableNumbers.length);
        const drawnNumber = availableNumbers[randomIndex];
        resultDisplay.textContent = drawnNumber;
        const currentDesk = document.getElementById(`desk-${drawnNumber}`);
        if (currentDesk) { currentDesk.classList.add('current-draw'); }
        lastDrawnNumber = drawnNumber;
        availableNumbers.splice(randomIndex, 1);
        const drawnNumbers = laddaDragnaNummer();
        drawnNumbers.push(drawnNumber);
        sparaDragnaNummer(drawnNumbers);
        updateUI();
    }
}

function resetSession() {
    lastDrawnNumber = null;
    localStorage.removeItem(STORAGE_KEY);
    handleClassroomChange();
}

drawButton.addEventListener('click', drawRandomNumber);
resetButton.addEventListener('click', resetSession);
classroomSelect.addEventListener('change', handleClassroomChange);

document.addEventListener('DOMContentLoaded', () => {
    populateClassroomSelect();
    handleClassroomChange();
});
