/**
 * Platsdelning för elever
 * En app för att slumpmässigt placera elever på platser i klassrum
 */

// ==========================================
// KONSTANTER OCH KONFIGURATION
// ==========================================

const STORAGE_KEY_PREFIX = 'elevPlatser_';
const BLOCKED_SEATS_PREFIX = 'blockedSeats_';
const CLASS_LISTS_KEY = 'elevPlatser_classLists';

// Klasslistor (laddas dynamiskt från localStorage eller fil)
let CLASS_LISTS = {};

// Klassrumskonfiguration
const CLASSROOM_CONFIG = {
    "Sal 302": {
        max_seats: 24,
        columns_per_row: 8,
        gang_column_width: "100px",
        allows_names: true,
        whiteboard_position: { row: 1, col_start: 6, span: 4 },
        allowed_classes: []
    },
    "NO Salen": {
        max_seats: 25,
        grid_template_columns: "40px repeat(2, 1fr) 80px repeat(4, 1fr)",
        allows_names: true,
        layout_map: [
            { id: 1, row: 2, col: 2 }, { id: 2, row: 2, col: 3 },
            { id: 3, row: 2, col: 5 }, { id: 4, row: 2, col: 6 }, { id: 5, row: 2, col: 7 }, { id: 6, row: 2, col: 8 },
            { id: 7, row: 3, col: 2 }, { id: 8, row: 3, col: 3 },
            { id: 9, row: 3, col: 5 }, { id: 10, row: 3, col: 6 }, { id: 11, row: 3, col: 7 }, { id: 12, row: 3, col: 8 },
            { id: 13, row: 4, col: 2 }, { id: 14, row: 4, col: 3 },
            { id: 15, row: 4, col: 5 }, { id: 16, row: 4, col: 6 }, { id: 17, row: 4, col: 7 }, { id: 18, row: 4, col: 8 },
            { id: 19, row: 5, col: 2 }, { id: 20, row: 5, col: 3 },
            { id: 21, row: 5, col: 5 }, { id: 22, row: 5, col: 6 }, { id: 23, row: 5, col: 7 }, { id: 24, row: 5, col: 8 },
            { id: 25, row: 6, col: 8 }
        ],
        whiteboard_position: { row: 1, col_start: 2, span: 7 }
    },
    "Sal 305": {
        max_seats: 30,
        allows_names: true,
        grid_template_columns: "repeat(2, 1fr) 50px repeat(2, 1fr) 50px repeat(2, 1fr)",
        whiteboard_position: { row: 1, col_start: 1, span: 8 },
        pillar_position: { row: 3, col_start: 7, span: 1 },
        layout_map: [
            // Rad 2
            { id: 1, row: 2, col: 1 }, { id: 2, row: 2, col: 2 },
            { id: 3, row: 2, col: 4 }, { id: 4, row: 2, col: 5 },
            { id: 5, row: 2, col: 7 }, { id: 6, row: 2, col: 8 },
            // Rad 3 (pelare blockerar höger)
            { id: 7, row: 3, col: 1 }, { id: 8, row: 3, col: 2 },
            { id: 9, row: 3, col: 4 }, { id: 10, row: 3, col: 5 },
            // Rad 4
            { id: 11, row: 4, col: 1 }, { id: 12, row: 4, col: 2 },
            { id: 13, row: 4, col: 4 }, { id: 14, row: 4, col: 5 },
            { id: 15, row: 4, col: 7 }, { id: 16, row: 4, col: 8 },
            // Rad 5
            { id: 17, row: 5, col: 1 }, { id: 18, row: 5, col: 2 },
            { id: 19, row: 5, col: 4 }, { id: 20, row: 5, col: 5 },
            { id: 21, row: 5, col: 7 }, { id: 22, row: 5, col: 8 },
            // Rad 6
            { id: 23, row: 6, col: 1 }, { id: 24, row: 6, col: 2 },
            { id: 25, row: 6, col: 4 }, { id: 26, row: 6, col: 5 },
            // Rad 7
            { id: 27, row: 7, col: 1 }, { id: 28, row: 7, col: 2 },
            { id: 29, row: 7, col: 4 }, { id: 30, row: 7, col: 5 }
        ]
    }
};

// ==========================================
// APPLIKATIONSTILLSTÅND
// ==========================================

let currentClassroom = Object.keys(CLASSROOM_CONFIG)[0];
let currentClass = '';
let assignments = {};
let blockedSeats = [];

// ==========================================
// DOM-ELEMENT
// ==========================================

const classroomSelect = document.getElementById('classroomSelect');
const classSelect = document.getElementById('classSelect');
const drawButton = document.getElementById('drawButton');
const resetButton = document.getElementById('resetButton');
const statusDisplay = document.getElementById('statusDisplay');
const classroomLayout = document.getElementById('classroom-layout');
const nameContainer = document.getElementById('name-container');
const fileInput = document.getElementById('fileInput');
const clearBlocksButton = document.getElementById('clearBlocksButton');
const exportButton = document.getElementById('exportButton');
const tooltip = document.getElementById('tooltip');

// ==========================================
// LAGRINGSHANTERING
// ==========================================

/**
 * Genererar lagringsnyckel för nuvarande sal och klass
 */
function getStorageKey() {
    const salKey = currentClassroom.replace(/\s+/g, '_');
    const klassKey = currentClass.replace(/\s+/g, '_');
    return `${STORAGE_KEY_PREFIX}${salKey}_${klassKey}`;
}

/**
 * Genererar lagringsnyckel för blockerade platser (per sal)
 */
function getBlockedSeatsKey() {
    return `${BLOCKED_SEATS_PREFIX}${currentClassroom.replace(/\s+/g, '_')}`;
}

/**
 * Sparar placeringsdata till localStorage
 */
function saveAssignments() {
    try {
        localStorage.setItem(getStorageKey(), JSON.stringify({ assignments }));
    } catch (e) {
        console.error("Kunde inte spara placeringar:", e);
    }
}

/**
 * Laddar placeringsdata från localStorage
 */
function loadAssignments() {
    try {
        const stored = localStorage.getItem(getStorageKey());
        if (stored) {
            const data = JSON.parse(stored);
            return data.assignments || {};
        }
    } catch (e) {
        console.error("Kunde inte ladda placeringar:", e);
    }
    return {};
}

/**
 * Sparar blockerade platser till localStorage
 */
function saveBlockedSeats() {
    try {
        localStorage.setItem(getBlockedSeatsKey(), JSON.stringify(blockedSeats));
    } catch (e) {
        console.error("Kunde inte spara blockerade platser:", e);
    }
}

/**
 * Laddar blockerade platser från localStorage
 */
function loadBlockedSeats() {
    try {
        const stored = localStorage.getItem(getBlockedSeatsKey());
        blockedSeats = stored ? JSON.parse(stored) : [];
    } catch (e) {
        blockedSeats = [];
    }
}

/**
 * Sparar klasslistor till localStorage
 */
function saveClassLists() {
    try {
        localStorage.setItem(CLASS_LISTS_KEY, JSON.stringify(CLASS_LISTS));
    } catch (e) {
        console.error("Kunde inte spara klasslistor:", e);
    }
}

/**
 * Laddar klasslistor från localStorage
 */
function loadClassLists() {
    try {
        const stored = localStorage.getItem(CLASS_LISTS_KEY);
        if (stored) {
            CLASS_LISTS = JSON.parse(stored);
            const classes = Object.keys(CLASS_LISTS);
            if (classes.length > 0 && !currentClass) {
                currentClass = classes[0];
            }
        }
    } catch (e) {
        console.error("Kunde inte ladda klasslistor:", e);
    }
}

// ==========================================
// UI-FUNKTIONER
// ==========================================

/**
 * Fyller dropdown för klassrumsval
 */
function populateClassroomSelect() {
    classroomSelect.innerHTML = '';
    Object.keys(CLASSROOM_CONFIG).forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        classroomSelect.appendChild(option);
    });
}

/**
 * Fyller dropdown för klassval baserat på tillåtna klasser
 */
function populateClassSelect() {
    classSelect.innerHTML = '';
    const config = CLASSROOM_CONFIG[currentClassroom];
    const allowedClasses = (config.allowed_classes?.length > 0)
        ? config.allowed_classes
        : Object.keys(CLASS_LISTS);

    Object.keys(CLASS_LISTS).forEach(name => {
        if (allowedClasses.includes(name)) {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            classSelect.appendChild(option);
        }
    });

    // Sätt vald klass
    if (allowedClasses.includes(currentClass)) {
        classSelect.value = currentClass;
    } else if (allowedClasses.length > 0) {
        currentClass = allowedClasses[0];
        classSelect.value = currentClass;
    }
}

/**
 * Hämtar alla plats-ID:n för nuvarande klassrum
 */
function getAllSeatIds(config) {
    if (config.layout_map) {
        return config.layout_map.map(d => d.id);
    }
    return Array.from({ length: config.max_seats }, (_, i) => i + 1);
}

/**
 * Renderar klassrumslayouten
 */
function renderDesks() {
    classroomLayout.innerHTML = '';
    const config = CLASSROOM_CONFIG[currentClassroom];

    // Rita whiteboard
    renderWhiteboard(config);

    // Rita pelare om den finns
    if (config.pillar_position) {
        renderPillar(config);
    }

    // Rita bänkar
    if (config.layout_map) {
        config.layout_map.forEach(deskInfo => renderDesk(deskInfo));
    } else {
        renderStandardGrid(config);
    }
}

/**
 * Renderar whiteboard
 */
function renderWhiteboard(config) {
    const whiteboard = document.createElement('div');
    whiteboard.id = 'whiteboard';
    whiteboard.textContent = 'WHITEBOARD';

    const pos = config.whiteboard_position || { row: 1, col_start: 1, span: 4 };
    whiteboard.style.gridRowStart = pos.row;
    whiteboard.style.gridColumnStart = pos.col_start;
    whiteboard.style.gridColumnEnd = `span ${pos.span}`;

    classroomLayout.appendChild(whiteboard);
}

/**
 * Renderar pelare
 */
function renderPillar(config) {
    const pillar = document.createElement('div');
    pillar.className = 'pillar';
    pillar.textContent = 'PELARE';

    const pos = config.pillar_position;
    pillar.style.gridRowStart = pos.row;
    pillar.style.gridColumnStart = pos.col_start;
    pillar.style.gridColumnEnd = `span ${pos.span}`;

    classroomLayout.appendChild(pillar);
}

/**
 * Renderar en enskild bänk
 */
function renderDesk(deskInfo) {
    const desk = document.createElement('div');
    desk.className = 'desk';
    desk.id = `desk-${deskInfo.id}`;

    const isBlocked = blockedSeats.includes(deskInfo.id);
    const studentName = assignments[deskInfo.id];

    if (isBlocked) {
        desk.textContent = `🚫 Plats ${deskInfo.id}`;
        desk.classList.add('blocked');
        desk.dataset.tooltip = `Plats ${deskInfo.id} - Blockerad`;
    } else if (studentName) {
        // Visa elevnamn + platsnummer
        desk.innerHTML = `<span class="student-name">${studentName}</span><span class="seat-number">Plats ${deskInfo.id}</span>`;
        desk.classList.add('drawn');
        desk.dataset.tooltip = `${studentName} - Plats ${deskInfo.id}`;
    } else {
        desk.textContent = `Plats ${deskInfo.id}`;
        desk.dataset.tooltip = `Plats ${deskInfo.id} - Ledig`;
    }

    // Positionering
    if (deskInfo.row) desk.style.gridRow = deskInfo.row;
    if (deskInfo.col) desk.style.gridColumn = `${deskInfo.col} / span ${deskInfo.span || 1}`;
    if (deskInfo.gridColumnStart) desk.style.gridColumnStart = deskInfo.gridColumnStart;
    if (deskInfo.gridRowStart) desk.style.gridRowStart = deskInfo.gridRowStart;

    // Klickhantering
    desk.addEventListener('click', () => toggleBlockSeat(deskInfo.id));

    // Tooltip-hantering
    desk.addEventListener('mouseenter', showTooltip);
    desk.addEventListener('mouseleave', hideTooltip);
    desk.addEventListener('mousemove', moveTooltip);

    classroomLayout.appendChild(desk);
}

/**
 * Renderar standard grid-layout (för Sal 302)
 */
function renderStandardGrid(config) {
    const whiteboardRow = config.whiteboard_position?.row === 1 ? 2 : 1;
    let rowCounter = whiteboardRow;
    let columnCounter = 1;
    const seatsPerSide = config.columns_per_row / 2;

    for (let i = 1; i <= config.max_seats; i++) {
        const gridColumnStart = (columnCounter <= seatsPerSide)
            ? columnCounter
            : columnCounter + 1;

        renderDesk({
            id: i,
            gridRowStart: rowCounter,
            gridColumnStart: gridColumnStart
        });

        columnCounter++;
        if (columnCounter > config.columns_per_row) {
            columnCounter = 1;
            rowCounter++;
        }
    }
}

/**
 * Uppdaterar statusvisning
 */
function updateStatus() {
    const config = CLASSROOM_CONFIG[currentClassroom];
    const studentList = CLASS_LISTS[currentClass] || [];
    const assignedCount = Object.keys(assignments).length;
    const blockedCount = blockedSeats.length;
    const availableSeats = config.max_seats - blockedCount;

    // Uppdatera statustext
    let statusText = `📊 ${assignedCount} av ${studentList.length} elever placerade`;
    if (blockedCount > 0) {
        statusText += ` • 🚫 ${blockedCount} platser blockerade`;
    }
    statusDisplay.textContent = statusText;

    // Uppdatera knappstatus
    const allPlaced = assignedCount >= studentList.length || assignedCount >= availableSeats;
    drawButton.disabled = allPlaced || studentList.length === 0;

    if (studentList.length === 0) {
        drawButton.textContent = "📂 Ladda klasslista först";
    } else if (allPlaced) {
        drawButton.textContent = "✅ Alla placerade";
    } else {
        drawButton.textContent = "✨ Placera Elever";
    }
}

// ==========================================
// HUVUDFUNKTIONER
// ==========================================

/**
 * Initialiserar sessionen för nuvarande klassrum och klass
 */
function initializeSession() {
    const config = CLASSROOM_CONFIG[currentClassroom];

    if (config.allows_names) {
        populateClassSelect();
    }

    assignments = loadAssignments();
    renderDesks();
    updateStatus();
}

/**
 * Hanterar byte av klassrum
 */
function handleClassroomChange() {
    const selectedSal = classroomSelect.value;
    const config = CLASSROOM_CONFIG[selectedSal];
    if (!config) return;

    currentClassroom = selectedSal;

    // Uppdatera body-klass för CSS
    document.body.className = `sal-${selectedSal.replace(/\s+/g, '-')}`;

    // Uppdatera grid-layout
    if (config.grid_template_columns) {
        classroomLayout.style.gridTemplateColumns = config.grid_template_columns;
    } else {
        const seatsPerSide = config.columns_per_row / 2;
        classroomLayout.style.gridTemplateColumns =
            `repeat(${seatsPerSide}, 1fr) ${config.gang_column_width} repeat(${seatsPerSide}, 1fr)`;
    }

    classroomLayout.style.gridTemplateRows = config.grid_template_rows || '';

    // Visa/dölj klassväljare
    nameContainer.style.display = config.allows_names ? 'block' : 'none';

    // Ladda data för detta klassrum
    loadBlockedSeats();
    initializeSession();
}

/**
 * Hanterar byte av klass
 */
function handleClassChange() {
    currentClass = classSelect.value;
    initializeSession();
}

/**
 * Placerar alla elever slumpmässigt
 */
function assignAllStudents() {
    const studentList = CLASS_LISTS[currentClass] || [];

    if (studentList.length === 0) {
        alert("Ingen klasslista hittades. Ladda upp en JSON-fil först.");
        return;
    }

    const config = CLASSROOM_CONFIG[currentClassroom];
    const allSeats = getAllSeatIds(config);
    const availableSeats = allSeats.filter(id => !blockedSeats.includes(id));

    // Varningar
    if (studentList.length > availableSeats.length) {
        const proceed = confirm(
            `Varning: Fler elever (${studentList.length}) än lediga platser (${availableSeats.length}). ` +
            `Några elever kommer inte få plats. Fortsätta?`
        );
        if (!proceed) return;
    }

    if (Object.keys(assignments).length > 0) {
        if (!confirm('Skriva över befintlig placering?')) return;
    }

    // Blanda elever och platser
    const shuffledStudents = [...studentList].sort(() => Math.random() - 0.5);
    const shuffledSeats = [...availableSeats].sort(() => Math.random() - 0.5);

    // Tilldela platser
    assignments = {};
    shuffledStudents.forEach((student, index) => {
        if (shuffledSeats[index] !== undefined) {
            assignments[shuffledSeats[index]] = student;
        }
    });

    saveAssignments();
    renderDesks();
    updateStatus();
}

/**
 * Växlar blockering av en plats
 */
function toggleBlockSeat(seatId) {
    const index = blockedSeats.indexOf(seatId);

    if (index === -1) {
        // Blockera platsen
        blockedSeats.push(seatId);
        // Ta bort eventuell tilldelning
        if (assignments[seatId]) {
            delete assignments[seatId];
            saveAssignments();
        }
    } else {
        // Avblockera platsen
        blockedSeats.splice(index, 1);
    }

    saveBlockedSeats();
    renderDesks();
    updateStatus();
}

/**
 * Återställer alla placeringar
 */
function resetSession() {
    showConfirmModal(
        'Är du säker? Alla placeringar för denna sal och klass raderas.',
        () => {
            localStorage.removeItem(getStorageKey());
            assignments = {};
            initializeSession();
        }
    );
}

/**
 * Visar bekräftelsedialog
 */
function showConfirmModal(message, onConfirm) {
    const modal = document.getElementById('confirmModal');
    const confirmMessage = document.getElementById('confirmMessage');
    const confirmYes = document.getElementById('confirmYes');
    const confirmNo = document.getElementById('confirmNo');

    confirmMessage.textContent = message;
    modal.classList.remove('hidden');

    const cleanup = () => {
        modal.classList.add('hidden');
        confirmYes.removeEventListener('click', handleConfirm);
        confirmNo.removeEventListener('click', handleCancel);
    };

    const handleConfirm = () => {
        cleanup();
        onConfirm();
    };

    const handleCancel = () => {
        cleanup();
    };

    confirmYes.addEventListener('click', handleConfirm);
    confirmNo.addEventListener('click', handleCancel);
}

/**
 * Hanterar filuppladdning av klasslista
 */
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const json = JSON.parse(e.target.result);

            if (typeof json !== 'object' || json === null || Array.isArray(json)) {
                throw new Error("Ogiltigt format");
            }

            CLASS_LISTS = json;
            saveClassLists();
            populateClassSelect();

            // Välj första klassen
            const classes = Object.keys(CLASS_LISTS);
            if (classes.length > 0) {
                currentClass = classes[0];
                classSelect.value = currentClass;
                handleClassChange();
            }

            alert(`✅ Klasslistor laddade! ${classes.length} klass(er) hittades.`);

        } catch (error) {
            console.error("Fel vid parsning av JSON:", error);
            alert("❌ Kunde inte läsa filen. Kontrollera att det är en giltig JSON-fil med klassnamn som nycklar.");
        }
    };

    reader.readAsText(file);
}

// ==========================================
// INITIALISERING
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    // Ladda sparad data
    loadClassLists();

    // Fyll dropdowns
    populateClassroomSelect();
    populateClassSelect();

    // Registrera event listeners
    drawButton.addEventListener('click', assignAllStudents);
    resetButton.addEventListener('click', resetSession);
    classroomSelect.addEventListener('change', handleClassroomChange);
    classSelect.addEventListener('change', handleClassChange);
    fileInput.addEventListener('change', handleFileUpload);

    // Nya knappar
    if (clearBlocksButton) {
        clearBlocksButton.addEventListener('click', clearAllBlocks);
    }
    if (exportButton) {
        exportButton.addEventListener('click', exportAsImage);
    }

    // Starta med första klassrummet
    handleClassroomChange();
});

// ==========================================
// TOOLTIP-FUNKTIONER
// ==========================================

/**
 * Visar tooltip vid hover
 */
function showTooltip(e) {
    if (!tooltip) return;
    const text = e.target.dataset.tooltip || e.target.closest('.desk')?.dataset.tooltip;
    if (text) {
        tooltip.textContent = text;
        tooltip.classList.remove('hidden');
    }
}

/**
 * Döljer tooltip
 */
function hideTooltip() {
    if (tooltip) {
        tooltip.classList.add('hidden');
    }
}

/**
 * Flyttar tooltip med musen
 */
function moveTooltip(e) {
    if (!tooltip) return;
    tooltip.style.left = e.pageX + 12 + 'px';
    tooltip.style.top = e.pageY + 12 + 'px';
}

// ==========================================
// EXTRA FUNKTIONER
// ==========================================

/**
 * Rensar alla blockeringar
 */
function clearAllBlocks() {
    if (blockedSeats.length === 0) {
        alert('✅ Inga platser är blockerade.');
        return;
    }

    showConfirmModal(
        `Vill du ta bort alla ${blockedSeats.length} blockeringar?`,
        () => {
            blockedSeats = [];
            saveBlockedSeats();
            renderDesks();
            updateStatus();
        }
    );
}

/**
 * Exporterar klassrumslayouten som PNG-bild
 */
function exportAsImage() {
    const container = document.getElementById('appContainer');
    if (!container) {
        alert('❌ Kunde inte hitta element att exportera.');
        return;
    }

    // Visa laddningsmeddelande
    const originalText = exportButton.textContent;
    exportButton.textContent = '⏳ Exporterar...';
    exportButton.disabled = true;

    // Använd html2canvas
    if (typeof html2canvas !== 'undefined') {
        html2canvas(container, {
            backgroundColor: '#f8fafc',
            scale: 2,
            useCORS: true,
            logging: false
        }).then(canvas => {
            // Skapa nedladdningslänk
            const link = document.createElement('a');
            const timestamp = new Date().toISOString().slice(0, 10);
            link.download = `platsdelning_${currentClassroom.replace(/\s+/g, '_')}_${currentClass}_${timestamp}.png`;
            link.href = canvas.toDataURL('image/png');

            // VIKTIGT: Länken måste finnas i DOM för att click() ska fungera lokalt
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Återställ knappen
            exportButton.textContent = originalText;
            exportButton.disabled = false;
        }).catch(err => {
            console.error('Export misslyckades:', err);
            alert('❌ Exporten misslyckades. Försök igen.');
            exportButton.textContent = originalText;
            exportButton.disabled = false;
        });
    } else {
        alert('❌ html2canvas laddades inte. Kontrollera internetanslutningen.');
        exportButton.textContent = originalText;
        exportButton.disabled = false;
    }
}
