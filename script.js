// Nyckeln vi använder i LocalStorage. Varje sal rensar gamla dragningar.
const STORAGE_KEY = 'elevPlatserDrawn';

// -------------------------------------------------------------------
// KLASSRUMS KONFIGURATION
const CLASSROOM_CONFIG = {
    "Sal 302": {
        max_seats: 26, 
        columns_per_row: 8, // 4 bänkar + Gång + 4 bänkar
        gang_column_width: "100px" 
    },
    "Sal 201": {
        max_seats: 12, 
        columns_per_row: 4, // 2 bänkar + Gång + 2 bänkar
        gang_column_width: "50px"
    },
    // Lägg till fler salar här när du har informationen!
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

/**
 * Sparar listan över dragna nummer till LocalStorage.
 */
function sparaDragnaNummer(drawnList) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(drawnList));
    } catch (e) {
        console.error("Kunde inte spara till LocalStorage", e);
    }
}

/**
 * Laddar listan över dragna nummer från LocalStorage.
 */
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

/**
 * Fyller select-elementet med alla tillgängliga salar.
 */
function populateClassroomSelect() {
    for (const name in CLASSROOM_CONFIG) {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        classroomSelect.appendChild(option);
    }
}

/**
 * Ritar ut de visuella bänkarna i klassrummet baserat på maxantalet.
 */
function renderDesks(max, drawnList = []) { 
    // Rensar ALLA befintliga bänk-DIVAR inuti classroomLayout
    classroomLayout.innerHTML = ''; 

    const config = CLASSROOM_CONFIG[currentClassroom]; 
    const seats_per_side = config.columns_per_row / 2; 

    for (let i = 1; i <= max; i++) {
        const desk = document.createElement('div');
        desk.classList.add('desk');
        desk.id = `desk-${i}`;
        desk.textContent = `Plats ${i}`;

        // 1. Ta reda på vilken position (1 till columns_per_row) bänken har i raden:
        const positionInRow = (i % config.columns_per_row === 0) ? config.columns_per_row : (i % config.columns_per_row); 

        let gridColumnStart;
        
        if (positionInRow <= seats_per_side) {
            // Bänkar i första halvan
            gridColumnStart = positionInRow;
        } else {
            // Bänkar i andra halvan hoppar över gången (+1)
            gridColumnStart = positionInRow + 1; 
        }

        desk.style.gridColumnStart = gridColumnStart;
        
        // Markera dragna bänkar vid start
        const deskNumber = i;
        if (lastDrawnNumber === deskNumber) {
            desk.classList.add('current-draw');
        } else if (drawnList.includes(deskNumber)) {
            desk.classList.add('drawn');
        }

        classroomLayout.appendChild(desk);
    }
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
 * Fyller på 'availableNumbers' arrayen och ritar ut bänkarna.
 * Hanterar LocalStorage.
 */
function initializeNumbersAndLayout() {
    // VIKTIGT: Sätt till false för att kunna läsa värdet från select/input
    maxPlatserInput.disabled = false; 

    const max = parseInt(maxPlatserInput.value); 

    if (isNaN(max) || max <= 0) {
        classroomLayout.innerHTML = 'Välj en sal för att börja.';
        availableNumbers = [];
        updateUI();
        return;
    }

    // LADDNING av sparad data
    const drawnNumbers = laddaDragnaNummer(); 
    
    let allNumbers = Array.from({length: max}, (_, i) => i + 1);
    availableNumbers = allNumbers.filter(n => !drawnNumbers.includes(n));
    
    // Ritar ut layouten och markerar dragna platser
    renderDesks(max, drawnNumbers); 
    
    // Återställ display och inaktivera/aktivera baserat på laddad data
    if (drawnNumbers.length > 0) {
        maxPlatserInput.disabled = true; // Inaktivera om sessionen är igång
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

    // Uppdatera globala variabler och dolda input-fältet
    currentClassroom = selectedSal;
    maxPlatserInput.value = config.max_seats;
    
    // Uppdatera CSS Grid-strukturen dynamiskt
    classroomLayout.style.gridTemplateColumns = 
        `repeat(${config.columns_per_row / 2}, 1fr) ${config.gang_column_width} repeat(${config.columns_per_row / 2}, 1fr)`;

    // Rensa LocalStorage och återställ sessionen
    localStorage.removeItem(STORAGE_KEY); 
    
    initializeNumbersAndLayout(); 
}

// --- HUVUDFUNKTIONER ---

/**
 * Huvudfunktionen för att dra ett slumpmässigt nummer.
 */
function drawRandomNumber() {
    if (availableNumbers.length > 0) {
        // Ta bort 'current-draw' från den senaste bänken och sätt den som 'drawn'
        if (lastDrawnNumber) {
            const lastDesk = document.getElementById(`desk-${lastDrawnNumber}`);
            if (lastDesk) {
                lastDesk.classList.remove('current-draw');
                lastDesk.classList.add('drawn'); 
            }
        }

        // Välj slumpmässig indexposition och hämta nummer
        const randomIndex = Math.floor(Math.random() * availableNumbers.length);
        const drawnNumber = availableNumbers[randomIndex];
        
        // Visa resultat och markera den nya bänken
        resultDisplay.textContent = drawnNumber;
        const currentDesk = document.getElementById(`desk-${drawnNumber}`);
        if (currentDesk) {
            currentDesk.classList.add('current-draw'); 
        }
        
        lastDrawnNumber = drawnNumber; 
        availableNumbers.splice(randomIndex, 1);
        
        // Spara dragna nummer till LocalStorage
        const totalNumbers = parseInt(maxPlatserInput.value);
        const allNumbers = Array.from({length: totalNumbers}, (_, i) => i + 1); 
        const drawnNumbers = allNumbers.filter(n => !availableNumbers.includes(n));
        sparaDragnaNummer(drawnNumbers);
        
        updateUI();
        maxPlatserInput.disabled = true; // Förhindra ändring mitt i dragning
    }
}

/**
 * Återställer hela sessionen till starttillståndet.
 */
function resetSession() {
    // Ta bort den gula markeringen (om den finns)
    if (lastDrawnNumber) {
        const lastDesk = document.getElementById(`desk-${lastDrawnNumber}`);
        if (lastDesk) {
            lastDesk.classList.remove('current-draw');
            lastDesk.classList.remove('drawn'); 
        }
    }
    
    lastDrawnNumber = null; 
    
    // Rensa LocalStorage och återställ
    localStorage.removeItem(STORAGE_KEY);
    
    // Denna funktion kallar initializeNumbersAndLayout som aktiverar maxPlatserInput igen.
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
