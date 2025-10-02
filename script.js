// Nyckeln vi använder i LocalStorage. Varje sal rensar gamla dragningar.
const STORAGE_KEY = 'elevPlatserDrawn';

// -------------------------------------------------------------------
// KLASSRUMS KONFIGURATION
const CLASSROOM_CONFIG = {
    "Sal 302": {
        max_seats: 24, 
        columns_per_row: 8, // 4 bänkar + Gång + 4 bänkar
        gang_column_width: "100px" 
    },
    "Sal 201": {
        max_seats: 12, 
        columns_per_row: 4, // 2 bänkar + Gång + 2 bänkar
        gang_column_width: "50px"
    },
};
// -------------------------------------------------------------------

// Globala variabler för tillstånd
let availableNumbers = []; 
let lastDrawnNumber = null;
let currentClassroom = "Sal 302"; // Standardvärde

// Hämta DOM-element
const classroomSelect = document.getElementById('classroomSelect'); 
const maxPlatserInput = document.getElementById('maxPlatserInput'); 
const drawButton = document.getElementById('drawButton');
const resetButton = document.getElementById('resetButton');
const resultDisplay = document.getElementById('resultDisplay');
const remainingCount = document.getElementById('remainingCount');
const classroomLayout = document.getElementById('classroom-layout');

// --- LOCALSTORAGE FUNKTIONER ---

function sparaDragnaNummer(drawnList) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(drawnList));
    } catch (e) {
        console.error("Kunde inte spara till LocalStorage", e);
    }
}

function laddaDragnaNummer() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        console.error("Kunde inte ladda från LocalStorage", e);
        return [];
    }
}

// --- INITIALISERING OCH LAYOUT FUNKTIONER ---

function populateClassroomSelect() {
    for (const name in CLASSROOM_CONFIG) {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        classroomSelect.appendChild(option);
    }
}

/**
 * Ritar ut whiteboard och bänkar.
 */
function renderDesks(max, drawnList = []) { 
    classroomLayout.innerHTML = ''; 

    const config = CLASSROOM_CONFIG[currentClassroom]; 
    const seats_per_row = config.columns_per_row;
    // VARIABELN DEKLARERAS HÄR FÖR KORREKT OMFÅNG
    const seats_per_side = seats_per_row / 2; 
    
    // --- 1. RITA BÄNKARNA ---
    let rowCounter = 1; 
    let columnCounter = 1;

    for (let i = 1; i <= max; i++) {
        const desk = document.createElement('div');
        desk.classList.add('desk');
        
        // Omvänd numrering för bänken
        const reversedDeskNumber = max - i + 1; 
        desk.id = `desk-${reversedDeskNumber}`;
        desk.textContent = `Plats ${reversedDeskNumber}`;

        // 1. Positionera kolumn
        let gridColumnStart;
        if (columnCounter <= seats_per_side) {
            gridColumnStart = columnCounter;
        } else {
            // Hoppa över mittgången (+1)
            gridColumnStart = columnCounter + 1; 
        }

        desk.style.gridColumnStart = gridColumnStart;
        desk.style.gridRowStart = rowCounter; 

        // 2. Uppdatera räknarna för nästa bänk
        columnCounter++;
        if (columnCounter > seats_per_row) {
            columnCounter = 1; 
            rowCounter++;      
        }
        
        // Markering av dragna bänkar
        const deskNumber = reversedDeskNumber; 
        if (lastDrawnNumber === deskNumber) {
            desk.classList.add('current-draw');
        } else if (drawnList.includes(deskNumber)) {
            desk.classList.add('drawn');
        }

        classroomLayout.appendChild(desk);
    }
    
    // --- 2. RITA WHITEBOARDEN (UNDER BÄNKARNA PÅ VÄNSTER SIDA) ---
    const whiteboard = document.createElement('div');
    whiteboard.id = 'whiteboard';
    whiteboard.textContent = 'WHITEBOARD'; 

    const lastRow = rowCounter; 

    // Positionera tavlan på raden efter sista bänken
    whiteboard.style.gridRowStart = lastRow; 
    // Tavlan startar på kolumn 1 och spänner över antalet bänkar per sida (t.ex. 4)
    whiteboard.style.gridColumnStart = 1; 
    whiteboard.style.gridColumnEnd = 'span ' + seats_per_side;

    classroomLayout.appendChild(whiteboard);
}

/**
 * Uppdaterar texten som visar antalet återstående platser och knappar.
 */
function updateUI() {
    const totalPlatser = parseInt(maxPlatserInput.value);
    const draggedPlatser = totalPlatser - availableNumbers.length;

    remainingCount.textContent = `Draget: ${draggedPlatser} av ${totalPlatser} platser`;
    
    if (availableNumbers.length === 0) {
        drawButton.disabled = true;
        drawButton.textContent = "Alla platser dragna!";
    } else {
        drawButton.disabled = false;
        drawButton.textContent = "Drag Nästa Plats";
    }
}

/**
 * Hanterar LocalStorage och numreringslogiken.
 */
function initializeNumbersAndLayout() {
    maxPlatserInput.disabled = false; 

    const max = parseInt(maxPlatserInput.value); 

    if (isNaN(max) || max <= 0) {
        classroomLayout.innerHTML = 'Välj en sal för att börja.';
        availableNumbers = [];
        updateUI();
        return;
    }

    const drawnNumbers = laddaDragnaNummer(); 
    let allNumbers = Array.from({length: max}, (_, i) => max - i + 1); 
    availableNumbers = allNumbers.filter(n => !drawnNumbers.includes(n));
    
    renderDesks(max, drawnNumbers); 
    
    if (drawnNumbers.length > 0) {
        maxPlatserInput.disabled = true; 
        resultDisplay.textContent = "Session Återupptagen";
    } else {
        maxPlatserInput.disabled = false;
        resultDisplay.textContent = "?"; 
    }

    lastDrawnNumber = null; 
    updateUI();
}

/**
 * Uppdaterar layouten och logiken baserat på vald sal.
 */
function handleClassroomChange() {
    const selectedSal = classroomSelect.value;
    const config = CLASSROOM_CONFIG[selectedSal];
    
    if (!config) return;

    currentClassroom = selectedSal;
    maxPlatserInput.value = config.max_seats;
    
    // UTRÄKNINGEN SKER HÄR OCH ANVÄNDS DIREKT
    const seats_per_side = config.columns_per_row / 2;

    // Uppdatera CSS Grid-strukturen dynamiskt
    classroomLayout.style.gridTemplateColumns = 
        `repeat(${seats_per_side}, 1fr) ${config.gang_column_width} repeat(${seats_per_side}, 1fr)`;

    localStorage.removeItem(STORAGE_KEY); 
    initializeNumbersAndLayout(); 
}

/**
 * Huvudfunktionen för att dra ett slumpmässigt nummer.
 */
function drawRandomNumber() {
    if (availableNumbers.length > 0) {
        if (lastDrawnNumber) {
            const lastDesk = document.getElementById(`desk-${lastDrawnNumber}`);
            if (lastDesk) {
                lastDesk.classList.remove('current-draw');
                lastDesk.classList.add('drawn'); 
            }
        }

        const randomIndex = Math.floor(Math.random() * availableNumbers.length);
        const drawnNumber = availableNumbers[randomIndex];
        
        resultDisplay.textContent = drawnNumber;
        const currentDesk = document.getElementById(`desk-${drawnNumber}`);
        if (currentDesk) {
            currentDesk.classList.add('current-draw'); 
        }
        
        lastDrawnNumber = drawnNumber; 
        availableNumbers.splice(randomIndex, 1);
        
        // Spara dragna nummer till LocalStorage
        const totalNumbers = parseInt(maxPlatserInput.value);
        const allNumbers = Array.from({length: totalNumbers}, (_, i) => totalNumbers - i + 1); 
        const drawnNumbers = allNumbers.filter(n => !availableNumbers.includes(n));
        sparaDragnaNummer(drawnNumbers);
        
        updateUI();
        maxPlatserInput.disabled = true;
    }
}

/**
 * Återställer hela sessionen till starttillståndet.
 */
function resetSession() {
    if (lastDrawnNumber) {
        const lastDesk = document.getElementById(`desk-${lastDrawnNumber}`);
        if (lastDesk) {
            lastDesk.classList.remove('current-draw');
            lastDesk.classList.remove('drawn'); 
        }
    }
    
    lastDrawnNumber = null; 
    localStorage.removeItem(STORAGE_KEY);
    
    handleClassroomChange(); 
}


// --- EVENTLYSSNARE OCH START ---

drawButton.addEventListener('click', drawRandomNumber);
resetButton.addEventListener('click', resetSession);
classroomSelect.addEventListener('change', handleClassroomChange);

// Starta appen när sidan laddats klart
document.addEventListener('DOMContentLoaded', () => {
    populateClassroomSelect(); 
    handleClassroomChange(); 
});
