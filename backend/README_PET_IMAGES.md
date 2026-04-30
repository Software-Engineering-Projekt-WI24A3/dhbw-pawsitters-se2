# Haustier-Fallback-Bilder

## Struktur

Für tiersspezifische Fallback-Bilder verwende die folgende Ordnerstruktur:

```
src/main/resources/static/images/pet_images/
├── dog/
│   └── default.png (oder default.jpg, default.webp, etc.)
├── cat/
│   └── default.png
├── rabbit/
│   └── default.png
├── hamster/
│   └── default.png
├── guinea_pig/
│   └── default.png
├── parrot/
│   └── default.png
├── budgie/
│   └── default.png
├── canary/
│   └── default.png
├── turtle/
│   └── default.png
├── snake/
│   └── default.png
├── lizard/
│   └── default.png
├── ferret/
│   └── default.png
├── rat/
│   └── default.png
├── mouse/
│   └── default.png
├── fish/
│   └── default.png
├── horse/
│   └── default.png
├── donkey/
│   └── default.png
├── goat/
│   └── default.png
├── chicken/
│   └── default.png
└── bird/
    └── default.png
```

## Verwendung

Wenn ein Haustier kein benutzerdefiniertes Bild hochgeladen hat, wird der `defaultImagePath` in der API-Antwort auf `/images/pet_images/{tierart}/` gesetzt.

Das Frontend kann dann:
1. Das hochgeladene Bild unter `imagePath` anzeigen (falls vorhanden)
2. Auf das Fallback-Bild unter `defaultImagePath` verweisen (wenn `imagePath` null/leer ist)

### Beispiel API-Response:

```json
{
  "id": 1,
  "name": "Bello",
  "species": "DOG",
  "breed": "Labrador",
  "age": 4,
  "specialNeeds": "Keine",
  "imagePath": null,
  "defaultImagePath": "/images/pet_images/dog/"
}
```

### Frontend-Integration:

```html
<img 
  src="{{ pet.imagePath || pet.defaultImagePath + 'default.png' }}" 
  alt="Haustier Profil"
/>
```

## Hinweise

- Die Bilder sollten unter `src/main/resources/static/images/pet_images/` gespeichert werden
- Sie werden dann automatisch unter `/images/pet_images/` erreichbar
- Jede Tierart hat einen eigenen Ordner mit seinen Standardbildern
- Das Frontend kann verschiedene Namen verwenden (z.B. `default.png`, `profile.jpg`, etc.)

