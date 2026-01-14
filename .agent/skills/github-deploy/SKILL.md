---
name: Deploy till GitHub Pages
description: Pusha ändringar och deploya appen till GitHub Pages
---

# Deploy till GitHub Pages

Följ dessa steg för att deploya SeatRandomizer2 till GitHub Pages:

## Steg 1: Kontrollera status
```bash
git status
```

## Steg 2: Lägg till alla ändringar
```bash
git add -A
```

## Steg 3: Skapa commit
```bash
git commit -m "Uppdatering: [beskriv ändringarna kort]"
```

## Steg 4: Pusha till GitHub
```bash
git push origin master
```

Om det blir konflikt, använd force push:
```bash
git push --force origin master
```

## Steg 5: Verifiera deployment
- Öppna https://papagarn92.github.io/Elevplatsapp2/
- Vänta 1-2 minuter för att GitHub Pages ska uppdateras
- Kontrollera att ändringarna syns
