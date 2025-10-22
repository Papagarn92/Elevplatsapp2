// Nyckeln vi använder i LocalStorage.
const STORAGE_KEY_PREFIX = 'elevPlatser_';

// -------------------------------------------------------------------
// DIN KLASSLISTA FÖR "LINUS SAL 302"
// -------------------------------------------------------------------
const STUDENT_LIST = [
    "Ahmed", "Elliott", "Yunes", "Emil", "Charlie", "Hadi", "Mahmad",
    "Oliver", "Mihajlo", "Elias", "Mohammed", "Alexander", "Liam",
    "Safa", "Nemat", "Hugo", "Konrad", "Michael", "Ksawery", "Rana", "Ludvig"
];
// -------------------------------------------------------------------

// KLASSRUMS KONFIGURATION (med tre salar)
const CLASSROOM_CONFIG = {
    "Sal 302": { // Denna sal slumpar bara nummer, med omvänd numrering.
        max_seats: 24,
        columns_per_row: 8,
        gang_column_width: "100px"
    },
    "Linus Sal 302": { // Denna sal använder din klasslista och är "roterad 180 grader".
        max_seats: 24,
        columns_per_row: 8,
        gang_column_width: "100px",
        allows_names: true,
        // ÄNDRAD: Whiteboarden flyttad till höger sida.
        whiteboard_position: { row: 1, col_start: 6, span: 4 }
    },
    "NO Salen": { // Anpassad sal
        max_seats: 24,
        grid_template_columns: "40px repeat(4, 1fr) 80px repeat(2, 1fr)",
        layout_map: [
            { id: 24, row: 1, col: 2 }, { id: 23, row: 1, col: 3 }, { id: 22, row: 1, col: 4 }, { id: 21, row: 1, col: 5 }, { id: 20, row: 1, col: 7 }, { id: 19, row: 1, col: 8 },
            { id: 18, row: 2, col: 2 }, { id: 17, row: 2, col: 3 }, { id: 16, row: 2, col: 4 }, { id: 15, row: 2, col: 5 }, { id: 14, row: 2, col: 7 }, { id: 13, row: 2, col: 8 },
            { id: 12, row: 3, col: 2 }, { id: 11, row: 3, col: 3 }, { id: 10, row: 3, col: 4 }, { id: 9, row: 3, col: 5 }, { id: 8, row: 3, col: 7 }, { id: 7, row: 3, col: 8 },
            { id: 6, row: 4, col: 2 }, { id: 5, row: 4, col: 3 }, { id: 4, row: 4, col: 4 }, { id: 3, row: 4, col: 5 }, { id: 2, row: 4, col: 7 }, { id: 1, row: 4, col: 8 }
        ],
        whiteboard_position: { row: 5, col_start: 3, span: 6 }
    }
};

// Globala variabler
let availableNumbers = [];
let lastDrawnPair = null;
let currentClassroom = "Sal 302";
let assignments = {};

// Hämta DOM-element
const classroomSelect = document.getElementById('classroomSelect');
const drawButton = document.getElementById('drawButton');
const resetButton = document.getElementById('resetButton');
const resultDisplay = document.getElementById('resultDisplay');
const remainingCount = document.getElementById('remainingCount');
const classroomLayout = document.getElementById('classroom-layout');
const nameContainer = document.getElementById('name-container');

// --- DATAHANTERING --- (Oförändrad)
function getStorageKey() { return `${STORAGE_KEY_PREFIX}${currentClassroom.replace(/\s+/g, '_')}`; }
function saveData(data) { try { localStorage.setItem(getStorageKey(), JSON.stringify(data)); } catch (e) { console.error("Kunde inte spara", e); } }
function loadData() { try { const stored = localStorage.getItem(getStorageKey()); return stored ? JSON.parse(stored) : { assignments: {}, lastDrawnPair: null }; } catch (e) { return { assignments: {}, lastDrawnPair: null }; } }

// --- UI-FUNKTIONER ---
function populateClassroomSelect() {
    classroomSelect.innerHTML = '';
    for (const name in CLASSROOM_CONFIG) { 
        const option = document.createElement('option'); 
        option.value = name; 
        option.textContent = name; 
        classroomSelect.appendChild(option); 
    } 
}

// ** ÄNDRING HÄR INUTI **
function renderDesks() {
    classroomLayout.innerHTML = '';
    const config = CLASSROOM_CONFIG[currentClassroom];
    const max = config.max_seats;
    
    const renderDesk = (deskInfo) => {
        const desk = document.createElement('div');
        desk.className = 'desk';
        desk.id = `desk-${deskInfo.id}`;
        
        const assignment = assignments[deskInfo.id];
        if (typeof assignment === 'string') {
            desk.textContent = assignment;
            desk.classList.add('drawn');
        } else {
            desk.textContent = `Plats ${deskInfo.id}`;
            if (assignment === true) {
                desk.classList.add('drawn');
            }
        }

        if (lastDrawnPair && lastDrawnPair.seat === deskInfo.id) {
            desk.classList.add('current-draw');
        }
        
        if (deskInfo.row) desk.style.gridRow = deskInfo.row;
        if (deskInfo.col) desk.style.gridColumn = `${deskInfo.col} / span ${deskInfo.span || 1}`;
        if (deskInfo.gridColumnStart) desk.style.gridColumnStart = deskInfo.gridColumnStart;
        if (deskInfo.gridRowStart) desk.style.gridRowStart = deskInfo.gridRowStart;
        
        classroomLayout.appendChild(desk);
    };

    if (config.layout_map) { // För NO Salen
        config.layout_map.forEach(renderDesk);
    } 
    else { // För Sal 302 och Linus Sal 302
        // NY LOGIK: Starta på rad 2 om whiteboarden är högst upp.
        let rowCounter = (config.whiteboard_position && config.whiteboard_position.row === 1) ? 2 : 1;
        let columnCounter = 1;
        for (let i = 0; i < max; i++) {
            let deskNumber;
            // NY LOGIK: Välj numreringsordning baserat på sal.
            if (currentClassroom === "Linus Sal 302") {
                deskNumber = i + 1; // Numrering framifrån och bak (1, 2, 3...)
            } else {
                deskNumber = max - i; // Omvänd numrering för vanliga Sal 302 (24, 23, 22...)
            }

            const seats_per_side = config.columns_per_row / 2;
            let gridColumnStart = (columnCounter <= seats_per_side) ? columnCounter : columnCounter + 1;
            renderDesk({ id: deskNumber, gridRowStart: rowCounter, gridColumnStart: gridColumnStart });
            columnCounter++;
            if (columnCounter > config.columns_per_row) { columnCounter = 1; rowCounter++; }
        }
    }
    const whiteboard = document.createElement('div'); whiteboard.id = 'whiteboard'; whiteboard.textContent = 'WHITEBOARD'; if (config.whiteboard_position) { const pos = config.whiteboard_position; whiteboard.style.gridRowStart = pos.row; whiteboard.style.gridColumnStart = pos.col_start; whiteboard.style.gridColumnEnd = 'span ' + pos.span; } else { const lastRowEl = classroomLayout.querySelector('.desk:last-child'); const lastRow = lastRowEl ? parseInt(lastRowEl.style.gridRowStart || 1) + 1 : 1; whiteboard.style.gridRowStart = lastRow; whiteboard.style.gridColumnStart = 1; whiteboard.style.gridColumnEnd = 'span ' + (config.columns_per_row / 2); } classroomLayout.appendChild(whiteboard);
}

function updateUI() { /* ... (Oförändrad) ... */ }
function initializeSession() { /* ... (Oförändrad) ... */ }
function handleClassroomChange() { /* ... (Oförändrad) ... */ }
function assignAllAtOnce() { /* ... (Oförändrad) ... */ }
function drawOneSeat() { /* ... (Oförändrad) ... */ }
function resetSession() { /* ... (Oförändrad) ... */ }

// --- Hela botten av filen är oförändrad ---
// (Jag klistrar in den här för kompletthetens skull)

function updateUI() {
    const config = CLASSROOM_CONFIG[currentClassroom];
    const assignedCount = Object.keys(assignments).length;

    if (config.allows_names) {
        remainingCount.textContent = `Placerade: ${assignedCount} av ${STUDENT_LIST.length} elever`;
        drawButton.textContent = "Placera Alla Elever";
        drawButton.disabled = assignedCount > 0;
    } else {
        remainingCount.textContent = `Draget: ${assignedCount} av ${config.max_seats} platser`;
        drawButton.textContent = "Drag Nästa Plats";
        drawButton.disabled = availableNumbers.length === 0;
    }

    if (drawButton.disabled && config.allows_names) {
        drawButton.textContent = "Alla är Placerade (Återställ för ny)";
    } else if (drawButton.disabled) {
        drawButton.textContent = "Alla platser dragna!";
    }
}

function initializeSession() {
    const config = CLASSROOM_CONFIG[currentClassroom];
    const savedData = loadData();
    assignments = savedData.assignments || {};
    lastDrawnPair = savedData.lastDrawnPair || null;
    
    const max = config.max_seats;
    let allNumbers = config.layout_map ? config.layout_map.map(desk => desk.id) : Array.from({ length: max }, (_, i) => i + 1);
    const assignedNumbers = Object.keys(assignments).map(Number);
    availableNumbers = allNumbers.filter(n => !assignedNumbers.includes(n));
    
    renderDesks();
    
    if (lastDrawnPair) {
        resultDisplay.textContent = lastDrawnPair.seat;
    } else {
        resultDisplay.innerHTML = "?";
    }
    
    updateUI();
}

function handleClassroomChange() {
    const selectedSal = classroomSelect.value;
    const config = CLASSROOM_CONFIG[selectedSal];
    if (!config) return;
    currentClassroom = selectedSal;
    
    document.body.className = `sal-${selectedSal.replace(/\s+/g, '-')}`;
    
    nameContainer.style.display = 'none';

    if (config.grid_template_columns) { classroomLayout.style.gridTemplateColumns = config.grid_template_columns; }
    else { const seats_per_side = config.columns_per_row / 2; classroomLayout.style.gridTemplateColumns = `repeat(${seats_per_side}, 1fr) ${config.gang_column_width} repeat(${seats_per_side}, 1fr)`; }
    if (config.grid_template_rows) { classroomLayout.style.gridTemplateRows = config.grid_template_rows; }
    else { classroomLayout.style.gridTemplateRows = ''; }
    
    initializeSession();
}

function assignAllAtOnce() {
    if (confirm('Är du säker? Detta skapar en helt ny slumpmässig placering för alla elever.')) {
        assignments = {};
        
        const shuffledStudents = [...STUDENT_LIST].sort(() => 0.5 - Math.random());
        let allSeats = CLASSROOM_CONFIG[currentClassroom].layout_map 
            ? CLASSROOM_CONFIG[currentClassroom].layout_map.map(d => d.id)
            : Array.from({ length: CLASSROOM_CONFIG[currentClassroom].max_seats }, (_, i) => i + 1);
        const shuffledSeats = allSeats.sort(() => 0.5 - Math.random());

        shuffledStudents.forEach((student, index) => {
            const seat = shuffledSeats[index];
            if (seat) {
                assignments[seat] = student;
            }
        });

        lastDrawnPair = null;
        saveData({ assignments, lastDrawnPair });
        initializeSession();
        resultDisplay.innerHTML = `${STUDENT_LIST.length} elever har placerats!`;
        updateUI();
    }
}

function drawOneSeat() {
    if (lastDrawnPair) {
        const lastDesk = document.getElementById(`desk-${lastDrawnPair.seat}`);
        if (lastDesk) lastDesk.classList.remove('current-draw');
    }
    if (availableNumbers.length === 0) { return; }

    const randomIndex = Math.floor(Math.random() * availableNumbers.length);
    const drawnNumber = availableNumbers.splice(randomIndex, 1)[0];
    
    assignments[drawnNumber] = true;
    resultDisplay.textContent = drawnNumber;
    lastDrawnPair = { name: null, seat: drawnNumber };
    
    saveData({ assignments, lastDrawnPair });
    
    renderDesks();
    updateUI();
}

function resetSession() {
    if (confirm('Är du säker på att du vill återställa? Alla placeringar för denna sal kommer att raderas.')) {
        localStorage.removeItem(getStorageKey());
        assignments = {};
        handleClassroomChange();
    }
}

drawButton.addEventListener('click', () => {
    const config = CLASSROOM_CONFIG[currentClassroom];
    if (config.allows_names) {
        assignAllAtOnce();
    } else {
        drawOneSeat();
    }
});
resetButton.addEventListener('click', resetSession);
classroomSelect.addEventListener('change', handleClassroomChange);

document.addEventListener('DOMContentLoaded', () => {
    populateClassroomSelect();
    handleClassroomChange();
});

