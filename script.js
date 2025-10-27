// Nyckeln vi använder i LocalStorage. Sparar per sal OCH klass.
const STORAGE_KEY_PREFIX = 'elevPlatser_';

// -------------------------------------------------------------------
// KLASSLISTOR
// -------------------------------------------------------------------
const STUDENT_LIST_IT24A = [
    "Ahmed", "Elliott", "Yunes", "Emil", "Charlie", "Hadi", "Mahmad",
    "Oliver", "Mihajlo", "Elias", "Mohammed", "Alexander", "Liam",
    "Safa", "Nemat", "Hugo", "Konrad", "Michael", "Ksawery", "Rana", "Ludvig"
];
const STUDENT_LIST_EE25A = [
    "Omar", "Ahmed", "Fardeen", "Hakim", "Yousef", "Anton", "Mihnea",
    "Max-Kellian", "Erik", "Wiggo", "Reda", "Max H", "Vincent K", "Benjamin K",
    "Marin L", "Liam", "Saade", "Matin N", "Rumle", "Benjamin P", "Vincent R G",
    "Ramman", "Ayush", "Marcel"
];
const STUDENT_LIST_EE25B = [
    "Kareem", "Yousif", "Mohamad", "Muhammad", "Subhan", "Farhan", "Elliott",
    "Sebastian", "Ari", "Denislav", "Zoya", "Seyhmuz", "Moschos", "Simon",
    "Lionel", "Måns", "Leon", "David", "Adin", "Filip", "Metin", "Olle",
    "Engjull", "Dominic", "Emil"
];

// Samlar alla klasslistor
const CLASS_LISTS = {
    "IT24A": STUDENT_LIST_IT24A,
    "EE25A": STUDENT_LIST_EE25A,
    "EE25B": STUDENT_LIST_EE25B
};
// -------------------------------------------------------------------

// KLASSRUMS KONFIGURATION (Med korrekt gång mellan 2 & 3 i NO Sal)
const CLASSROOM_CONFIG = {
    "Sal 302": {
        max_seats: 25,
        max_seats_by_class: {
            "IT24A": 24,
            "EE25A": 25,
            "EE25B": 25
        },
        columns_per_row: 8,
        gang_column_width: "100px",
        allows_names: true,
        whiteboard_position: { row: 1, col_start: 6, span: 4 }
    },
    "NO Salen": {
        max_seats: 25,
        max_seats_by_class: {
            "IT24A": 24,
            "EE25A": 25,
            "EE25B": 25
        },
        // KORREKT GRID: [Gång V] [2 platser] [Mittgång] [4 platser] -> 8 Kolumner
        // Gången är nu i kolumn 4.
        grid_template_columns: "0px repeat(2, 1fr) 80px repeat(4, 1fr)",
        allows_names: true,
        // ** UPPDATERAD LAYOUT MAP för 8 kolumner, gång mellan 2 & 3 **
        layout_map: [
             // Rad 2 (första bänkraden)
            { id: 1, row: 2, col: 2 }, { id: 2, row: 2, col: 3 }, // Vänster block 1
            // Gång (kolumn 4)
            { id: 3, row: 2, col: 5 }, { id: 4, row: 2, col: 6 }, { id: 5, row: 2, col: 7 }, { id: 6, row: 2, col: 8 }, // Höger block (nu 4 platser)

            // Rad 3
            { id: 7, row: 3, col: 2 }, { id: 8, row: 3, col: 3 },
            { id: 9, row: 3, col: 5 }, { id: 10, row: 3, col: 6 }, { id: 11, row: 3, col: 7 }, { id: 12, row: 3, col: 8 },

            // Rad 4
            { id: 13, row: 4, col: 2 }, { id: 14, row: 4, col: 3 },
            { id: 15, row: 4, col: 5 }, { id: 16, row: 4, col: 6 }, { id: 17, row: 4, col: 7 }, { id: 18, row: 4, col: 8 },

            // Rad 5
            { id: 19, row: 5, col: 2 }, { id: 20, row: 5, col: 3 },
            { id: 21, row: 5, col: 5 }, { id: 22, row: 5, col: 6 }, { id: 23, row: 5, col: 7 }, { id: 24, row: 5, col: 8 },

            // Rad 6 (Endast plats 25)
            { id: 25, row: 6, col: 8 } // Längst ner till höger
        ],
        // ** KORREKT WHITEBOARD POSITION **
        whiteboard_position: {
            row: 1,         // Längst upp
            col_start: 2,   // Startar vid första bänkkolumnen
            span: 7          // Sträcker sig över alla bänkar (kol 2-8)
        }
    }
};

// Globala variabler
let availableNumbers = [];
let lastDrawnPair = null;
let currentClassroom = Object.keys(CLASSROOM_CONFIG)[0];
let currentClass = Object.keys(CLASS_LISTS)[0];
let assignments = {};

// Hämta DOM-element
const classroomSelect = document.getElementById('classroomSelect');
const classSelect = document.getElementById('classSelect');
const drawButton = document.getElementById('drawButton');
const resetButton = document.getElementById('resetButton');
const classroomLayout = document.getElementById('classroom-layout');
const nameContainer = document.getElementById('name-container');

// --- DATAHANTERING ---
function getStorageKey() { return `${STORAGE_KEY_PREFIX}${currentClassroom.replace(/\s+/g, '_')}_${currentClass.replace(/\s+/g, '_')}`; }
function saveData(data) { try { localStorage.setItem(getStorageKey(), JSON.stringify(data)); } catch (e) { console.error("Kunde inte spara", e); } }
function loadData() { try { const stored = localStorage.getItem(getStorageKey()); return stored ? JSON.parse(stored) : { assignments: {}, lastDrawnPair: null }; } catch (e) { return { assignments: {}, lastDrawnPair: null }; } }

// --- UI-FUNKTIONER ---
function populateClassroomSelect() {
    classroomSelect.innerHTML = '';
    for (const name in CLASSROOM_CONFIG) { const option = document.createElement('option'); option.value = name; option.textContent = name; classroomSelect.appendChild(option); }
}
function populateClassSelect() {
    classSelect.innerHTML = '';
    for (const name in CLASS_LISTS) { const option = document.createElement('option'); option.value = name; option.textContent = name; classSelect.appendChild(option); }
    classSelect.value = currentClass;
}

function renderDesks() {
    classroomLayout.innerHTML = '';
    const config = CLASSROOM_CONFIG[currentClassroom];

    // Bestäm max antal platser baserat på klass
    let max = config.max_seats;
    if (config.max_seats_by_class && config.max_seats_by_class[currentClass]) {
        max = config.max_seats_by_class[currentClass];
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
        let defaultRow = 1;
        try {
            const allRows = config.layout_map ? config.layout_map.map(d=>d.row) : Array.from(classroomLayout.querySelectorAll('.desk')).map(d=>parseInt(d.style.gridRowStart || '1'));
            if(allRows.length > 0) defaultRow = Math.max(...allRows) + 1;
        } catch {}
        whiteboard.style.gridRowStart = defaultRow;
        whiteboard.style.gridColumnStart = 1;
        whiteboard.style.gridColumnEnd = 'span ' + ((config.columns_per_row || 4) / 2);
    }
    classroomLayout.appendChild(whiteboard);


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

    if (config.layout_map) { // NO Salen
        config.layout_map.forEach(renderDesk);
        let mappedIds = config.layout_map.map(d => d.id);
         for (let i = 1; i <= max; i++) {
             if (!mappedIds.includes(i)) {
                 console.warn(`Plats ${i} saknar explicit position för ${currentClassroom}. Renderar den sist.`);
                 renderDesk({ id: i });
             }
         }
    } else { // Sal 302
        let rowCounter = (config.whiteboard_position && config.whiteboard_position.row === 1) ? 2 : 1;
        let columnCounter = 1;
        for (let i = 0; i < max; i++) {
            let deskNumber = i + 1;
            const seats_per_side = config.columns_per_row / 2;
            let gridColumnStart = (columnCounter <= seats_per_side) ? columnCounter : columnCounter + 1;
            renderDesk({ id: deskNumber, gridRowStart: rowCounter, gridColumnStart: gridColumnStart });
            columnCounter++;
            if (columnCounter > config.columns_per_row) { columnCounter = 1; rowCounter++; }
        }
    }
}

function updateUI() {
    const config = CLASSROOM_CONFIG[currentClassroom];
    const assignedCount = Object.keys(assignments).length;
    const currentStudentList = CLASS_LISTS[currentClass] || [];

    if (config.allows_names) {
        drawButton.textContent = "Placera Alla Elever";
        drawButton.disabled = assignedCount >= currentStudentList.length || assignedCount >= config.max_seats;
    } else {
        drawButton.textContent = "Drag Nästa Plats";
        drawButton.disabled = availableNumbers.length === 0;
    }
    if (drawButton.disabled) { drawButton.textContent = "Alla Placerade (Återställ)"; }
}

// --- HUVUDFUNKTIONER ---
function initializeSession() {
    const config = CLASSROOM_CONFIG[currentClassroom];
    const savedData = loadData();
    assignments = savedData.assignments || {};
    lastDrawnPair = savedData.lastDrawnPair || null;

    if (config.allows_names) {
        populateClassSelect();
    }

    // Bestäm max antal platser baserat på klass
    let max = config.max_seats;
    if (config.max_seats_by_class && config.max_seats_by_class[currentClass]) {
        max = config.max_seats_by_class[currentClass];
    }

    let allNumbers;
    if (config.layout_map) { // NO Salen
         allNumbers = config.layout_map.map(desk => desk.id);
         for (let i = 1; i <= max; i++) { if(!allNumbers.includes(i)) allNumbers.push(i); }
         allNumbers.sort((a, b) => a - b);
         allNumbers = allNumbers.slice(0, max);
    } else { // Sal 302
         allNumbers = Array.from({ length: max }, (_, i) => i + 1);
    }

    const assignedNumbers = Object.keys(assignments).map(Number);
    availableNumbers = allNumbers.filter(n => !assignedNumbers.includes(n));

    renderDesks();
    updateUI();
}

function handleClassroomChange() {
    const selectedSal = classroomSelect.value;
    const config = CLASSROOM_CONFIG[selectedSal];
    if (!config) return;
    currentClassroom = selectedSal;

    document.body.className = `sal-${selectedSal.replace(/\s+/g, '-')}`;
    nameContainer.style.display = config.allows_names ? 'block' : 'none';

    // Sätt grid-strukturen
    if (config.grid_template_columns) { classroomLayout.style.gridTemplateColumns = config.grid_template_columns; }
    else { const seats_per_side = config.columns_per_row / 2; classroomLayout.style.gridTemplateColumns = `repeat(${seats_per_side}, 1fr) ${config.gang_column_width} repeat(${seats_per_side}, 1fr)`; }
    if (config.grid_template_rows) { classroomLayout.style.gridTemplateRows = config.grid_template_rows; }
    else { classroomLayout.style.gridTemplateRows = ''; }

    initializeSession();
}

function handleClassChange() {
    currentClass = classSelect.value;
    initializeSession();
}

function assignAllAtOnce() {
    const currentStudentList = CLASS_LISTS[currentClass] || [];
    if (currentStudentList.length === 0) { alert("Ingen klasslista hittades."); return; }
    const config = CLASSROOM_CONFIG[currentClassroom];

    // Bestäm max antal platser baserat på klass
    let maxSeats = config.max_seats;
    if (config.max_seats_by_class && config.max_seats_by_class[currentClass]) {
        maxSeats = config.max_seats_by_class[currentClass];
    }

    if (currentStudentList.length > maxSeats) {
        if (!confirm(`Varning: Fler elever (${currentStudentList.length}) än platser (${maxSeats}). Fortsätta?`)) return;
    }
    if (Object.keys(assignments).length > 0 && !confirm('Skriva över befintlig placering?')) return;

    assignments = {};
    const shuffledStudents = [...currentStudentList].sort(() => 0.5 - Math.random());

    let allSeats;
     if (config.layout_map) { // NO Salen
         allSeats = config.layout_map.map(d => d.id);
         for (let i = 1; i <= maxSeats; i++) { if(!allSeats.includes(i)) allSeats.push(i); }
         allSeats.sort((a, b) => a - b);
         allSeats = allSeats.slice(0, maxSeats);
    } else { // Sal 302
         allSeats = Array.from({ length: maxSeats }, (_, i) => i + 1);
    }

    const shuffledSeats = [...allSeats].sort(() => 0.5 - Math.random());

    let placementsMade = 0;
    shuffledStudents.forEach((student, index) => {
        const seat = shuffledSeats[index];
        if (seat !== undefined) {
            assignments[seat] = student;
            placementsMade++;
        }
    });

     const assignedNumbers = Object.keys(assignments).map(Number);
     availableNumbers = allSeats.filter(n => !assignedNumbers.includes(n));
    lastDrawnPair = null;
    saveData({ assignments, lastDrawnPair });
    renderDesks();
    updateUI();
}

function resetSession() {
    if (confirm('Är du säker? Alla placeringar för denna sal och klass raderas.')) {
        localStorage.removeItem(getStorageKey());
        assignments = {};
        initializeSession();
    }
}

// --- EVENTLYSSNARE OCH START ---
drawButton.addEventListener('click', assignAllAtOnce);
resetButton.addEventListener('click', resetSession);
classroomSelect.addEventListener('change', handleClassroomChange);
classSelect.addEventListener('change', handleClassChange);

document.addEventListener('DOMContentLoaded', () => {
    populateClassroomSelect();
    populateClassSelect();
    handleClassroomChange();
});

