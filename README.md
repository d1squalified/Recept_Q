# Receptvalvet

A local-first Swedish recipe PWA. Recipe data is stored in the browser's IndexedDB. No server is required for the recipe data.

## Easiest way to try it

The app must be served over HTTP/HTTPS for the PWA service worker and some browser features to work.

### Option A — Python (computer)

1. Install Python 3 if it is not already installed.
2. Open Terminal / PowerShell in this folder.
3. Run:

    python3 -m http.server 8000

   On Windows, `python -m http.server 8000` may be the correct command.
4. On the computer open http://localhost:8000

### Put it on an iPhone

For the PWA to work from an iPhone, the app needs to be hosted on an HTTPS address reachable by the iPhone. A simple next step is to put these files on a small static web host.

Once opened in Safari on the iPhone:
1. Tap Share.
2. Choose "Add to Home Screen".
3. Open Receptvalvet from the Home Screen.

The recipe data remains local to that browser/device.

## JSON backup

Use **⋯** in the top-right corner to open **Backup & återställning**. There you can export a `.json` backup or import one on another device. The file can be sent with AirDrop, saved to Files, copied to a computer, etc.

## Current version

Included:
- Swedish mobile UI
- Local IndexedDB storage
- Keyword search across title, ingredients, instructions and notes
- Create/edit/delete recipes
- JSON export
- JSON import/merge
- Offline PWA cache
- Camera/photo input directly from **Nytt recept**


## v1.8 — safe JSON sharing

Receptvalvet JSON files are portable and can be sent by AirDrop, Mail, Messages, Files, iCloud Drive, OneDrive, Google Drive or similar. The app previews incoming recipes before import, detects duplicates, avoids silently overwriting newer local recipes, and supports importing everything as new recipes.


### v1.9 – Tillagningsmetoder
Automatisk identifiering och sökning av tillagningsmetoder som ugn, fritera, steka, koka, grilla, baka, airfryer m.fl. Svenska böjningsformer normaliseras för sökning.


### v2.0 – Ingrediensigenkänning
