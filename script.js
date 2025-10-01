// Globala variabler för att hålla reda på tillstånd och element
let availableNumbers = []; 
let lastDrawnNumber = null;

// Hämta DOM-element
const maxPlatserInput = document.getElementById('maxPlatserInput');
const drawButton = document.getElementById('drawButton');
const resetButton = document.getElementById('resetButton');
const resultDisplay = document.getElementById('resultDisplay');
const remainingCount = document.getElementById('remainingCount');
const classroomLayout = document.getElementById('classroom-layout');

// I script.js
function renderDesks(max, drawnList = []) { 
    // Tömmer layouten på gamla bänkar
    classroomLayout.innerHTML = ''; 

    const config = CLASSROOM_CONFIG[currentClassroom]; 
    const seats_per_side = config.columns_per_row / 2; 

    for (let i = 1; i <= max; i++) {
        const desk = document.createElement('div');
        desk.classList.add('desk');
        desk.id = `desk-${i}`;
        desk.textContent = `Plats ${i}`;

        // ----------------------------------------------------
        // KORRIGERAD LOGIK FÖR PLACERING:
        const positionInRow = (i % config.columns_per_row === 0) ? config.columns_per_row : (i % config.columns_per_row); 
        let gridColumnStart;
        
        if (positionInRow <= seats_per_side) {
            gridColumnStart = positionInRow;
        } else {
            gridColumnStart = positionInRow + 1; 
        }

        desk.style.gridColumnStart = gridColumnStart;
        // Vi behöver INTE sätta grid-row här!
        // ----------------------------------------------------

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
 * NU: Reset-knappen är ALLTID synlig.
 */
function updateUI() {
    const totalPlatser = parseInt(maxPlatserInput.value);
    const draggedPlatser = totalPlatser - availableNumbers.length;

    remainingCount.textContent = `Draget: ${draggedPlatser} av ${totalPlatser} platser`;
    
    // Inaktivera drag-knappen om inga nummer finns kvar
    if (availableNumbers.length === 0) {
        drawButton.disabled = true;
        drawButton.textContent = "Alla platser dragna!";
        
        // **BORTTAGEN KOD:** Vi tar bort logiken som visade/döljde resetButton.
        // resetButton.style.display = 'block'; 
    } else {
        drawButton.disabled = false;
        drawButton.textContent = "Drag Nästa Plats";
        
        // **BORTTAGEN KOD:** Vi tar bort logiken som visade/döljde resetButton.
        // resetButton.style.display = 'none'; 
    }
}

/**
 * Fyller på 'availableNumbers' arrayen och ritar ut bänkarna.
 * LADDAR SPARAD DATA FRÅN LOCALSTORAGE om den finns.
 */
function initializeNumbersAndLayout() {
    const max = parseInt(maxPlatserInput.value); 

    if (isNaN(max) || max <= 0) {
        // ... (Din befintliga felhantering)
        return;
    }

    // -------------------------------------------------------------------
    // NY LOGIK: LADDNING
    const drawnNumbers = laddaDragnaNummer(); 
    
    // Anta att ALLA nummer är tillgängliga
    let allNumbers = Array.from({length: max}, (_, i) => i + 1);

    // Filter bort de nummer som redan dragits
    availableNumbers = allNumbers.filter(n => !drawnNumbers.includes(n));
    
    // -------------------------------------------------------------------

    // Ritar ut den initiala layouten
    renderDesks(max, drawnNumbers); // Skicka med listan över dragna nummer
    
    // Om vi laddade sparad data, inaktivera input-fältet och uppdatera display
    if (drawnNumbers.length > 0) {
        maxPlatserInput.disabled = true;
        resultDisplay.textContent = "Session Återupptagen";
    } else {
        maxPlatserInput.disabled = false;
        resultDisplay.textContent = "?"; 
    }

    lastDrawnNumber = null; // Vi vet inte vilket som var det sist dragna efter omladdning
    updateUI();
}

// ... (Hela koden för funktionen)

// Huvudfunktionen för att dra ett slumpmässigt nummer
function drawRandomNumber() {
    if (availableNumbers.length > 0) {
        // ... (Logik för att markera den tidigare bänken)
        if (lastDrawnNumber) {
            const lastDesk = document.getElementById(`desk-${lastDrawnNumber}`);
            if (lastDesk) {
                lastDesk.classList.remove('current-draw');
                lastDesk.classList.add('drawn'); 
            }
        }

        // 1. Välj slumpmässig indexposition
        const randomIndex = Math.floor(Math.random() * availableNumbers.length);
        const drawnNumber = availableNumbers[randomIndex];
        
        // ... (Logik för att visa resultatet och markera den nya bänken)
        resultDisplay.textContent = drawnNumber;
        const currentDesk = document.getElementById(`desk-${drawnNumber}`);
        if (currentDesk) {
            currentDesk.classList.add('current-draw'); 
        }
        
        // 2. Uppdatera tillstånd
        lastDrawnNumber = drawnNumber; 
        availableNumbers.splice(randomIndex, 1);
        
        // -------------------------------------------------------------------
        // NY LOGIK: BERÄKNA OCH SPARA DRAGNA NUMMER
        
        const totalNumbers = parseInt(maxPlatserInput.value);
        const allNumbers = Array.from({length: totalNumbers}, (_, i) => i + 1); // [1, 2, ..., max]
        
        // Ta fram de nummer som ÄR dragna (de som INTE finns i availableNumbers)
        const drawnNumbers = allNumbers.filter(n => !availableNumbers.includes(n));
        
        sparaDragnaNummer(drawnNumbers);
        
        // -------------------------------------------------------------------
        
        updateUI();

        maxPlatserInput.disabled = true;
    }
}

// I script.js
function resetSession() {
    // 1. Ta bort den gula markeringen (om den finns)
    if (lastDrawnNumber) {
        // ... (Din befintliga kod för att ta bort CSS-klasser)
    }
    
    // 2. Nollställ variabeln
    lastDrawnNumber = null; 
    
    // -------------------------------------------------------------------
    // NY LOGIK: RE NSA DATA FRÅN LOCALSTORAGE
    localStorage.removeItem(STORAGE_KEY);
    // -------------------------------------------------------------------

    // 3. Återaktivera input-fältet
    maxPlatserInput.disabled = false; 
    
    // 4. Initialiserar numren och ritar ut bänkarna på nytt
    initializeNumbersAndLayout(); 
}


// --- Eventlyssnare ---

// 1. Lyssna efter klick på Drag-knappen
drawButton.addEventListener('click', drawRandomNumber);

// 2. Lyssna efter klick på Återställ-knappen
resetButton.addEventListener('click', resetSession);

// 3. Lyssna efter ändringar i input-fältet för maxantalet
maxPlatserInput.addEventListener('change', () => {
    // Endast tillåtet att ändra maxantalet om ingen dragning har skett
    if (!maxPlatserInput.disabled) {
        initializeNumbersAndLayout(); 
    }
});
// Nyckeln vi använder i LocalStorage
const STORAGE_KEY = 'elevPlatserDrawn';

/**
 * Sparar listan över dragna nummer till LocalStorage.
 * @param {number[]} drawnList - Listan med de dragna numren.
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
 * @returns {number[]} - Listan med dragna nummer, eller en tom array.
 */
function laddaDragnaNummer() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        // Returnera den sparade listan, annars en tom lista
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        console.error("Kunde inte ladda från LocalStorage", e);
        return [];
    }
}

// 4. Starta appen när sidan laddats klart
document.addEventListener('DOMContentLoaded', initializeNumbersAndLayout);


