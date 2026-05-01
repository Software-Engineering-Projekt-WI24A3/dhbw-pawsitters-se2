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

## Format von `imagePath`

Nach einem erfolgreichen Bild-Upload enthält `imagePath` einen **öffentlichen URL-Pfad** (kein Dateisystempfad), der direkt im Browser geladen werden kann. Beispiel:

```
/uploads/pets/pet-1-3f7a2b1c-4d5e-6f7a-8b9c-0d1e2f3a4b5c.jpg
```

Das Backend stellt Uploads unter dem Pfad `/uploads/**` öffentlich bereit (kein Login erforderlich). Der vollständige URL lautet also:

```
http://localhost:8080/uploads/pets/pet-1-<uuid>.jpg
```

Erlaubte Dateiformate: JPEG, PNG, GIF, WebP, BMP (max. 5 MB).

### Beispiel API-Response:

```json
{
  "id": 1,
  "name": "Bello",
  "species": "DOG",
  "breed": "Labrador",
  "age": 4,
  "specialNeeds": "Keine",
  "imagePath": "/uploads/pets/pet-1-3f7a2b1c-4d5e-6f7a-8b9c-0d1e2f3a4b5c.jpg",
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

- Die Fallback-Bilder sollten unter `src/main/resources/static/images/pet_images/` gespeichert werden
- Sie werden dann automatisch unter `/images/pet_images/` erreichbar
- Hochgeladene Benutzerbilder werden unter `uploads/pets/` gespeichert und sind unter `/uploads/pets/` erreichbar
- Jede Tierart hat einen eigenen Ordner mit seinen Standardbildern
- Das Frontend kann verschiedene Namen verwenden (z.B. `default.png`, `profile.jpg`, etc.)

