---
name: Lägg till nytt klassrum
description: Lägger till ett nytt klassrum med anpassad layout i script.js
---

# Lägg till nytt klassrum

## Klassrumskonfiguration i script.js

Klassrum definieras i `CLASSROOM_CONFIG` objektet:

```javascript
const CLASSROOM_CONFIG = {
    "Sal 302": {
        max_seats: 24,
        grid_columns: "repeat(4, 1fr) 30px repeat(4, 1fr)",
        columns_per_row: 8,
        whiteboard_position: { row: 1, col: "5 / span 4" }
    }
};
```

## Konfigurationsalternativ

| Property | Beskrivning |
|----------|-------------|
| `max_seats` | Totalt antal platser |
| `grid_columns` | CSS grid-template-columns |
| `columns_per_row` | Platser per rad |
| `whiteboard_position` | Whiteboard placering |
| `layout_map` | (Valfritt) Anpassad layout för varje plats |

## Steg för att lägga till nytt klassrum

1. **Öppna script.js** och hitta `CLASSROOM_CONFIG`
2. **Lägg till ny konfiguration** med salens namn och inställningar
3. **Testa layouten** genom att ladda om appen och välja den nya salen
4. **Finjustera** grid-columns och platser tills det ser rätt ut

## Exempel: Enkel sal med 20 platser
```javascript
"Sal 401": {
    max_seats: 20,
    grid_columns: "repeat(5, 1fr)",
    columns_per_row: 5,
    whiteboard_position: { row: 1, col: "1 / span 5" }
}
```
