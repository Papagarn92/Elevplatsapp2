---
name: Lägg till ny klass
description: Lägger till en ny klasseslista i my_classes.json
---

# Lägg till ny klass

## Format för my_classes.json

Filen `my_classes.json` har följande struktur:
```json
{
    "KLASSNAMN": [
        "Elev1",
        "Elev2",
        "Elev3"
    ]
}
```

## Steg 1: Identifiera klassnamn och elever
- Fråga användaren om klassnamn (t.ex. "IT24A", "EE25B - TEKNIK")
- Fråga efter elevnamn (antingen lista eller bild)

## Steg 2: Formatera namn
- Använd endast förnamn (inte efternamn)
- Om efternamn + förnamn ges, ta bara förnamnet (det andra ordet)

## Steg 3: Lägg till i my_classes.json
Öppna filen och lägg till den nya klassen i JSON-strukturen.

## Steg 4: Verifiera
- Kontrollera att JSON är korrekt formaterad
- Meddela användaren hur många elever som lades till

## Tips
- Max ~25 elever per klass för bästa placering
- Klassnamn bör vara unika
- Förnamn fungerar bäst för att rymmas i platsrutorna
