# RescueGuard Live Monitor

## Open in VS Code
1. File > Open Folder > choose this `rescueguard-dashboard` folder.
2. Install the **Live Server** extension, right-click `index.html`, choose **Open with Live Server**.
3. Paste your Blynk token in *Connection settings* (or in `js/config.js`) and click Connect.

## Files
- `index.html` page layout
- `css/style.css` styling (light and dark mode)
- `js/config.js` token, server, pins, thresholds
- `js/app.js` Blynk polling, status logic, tiles, gauge, trend graph, event log
- `js/extras.js` summary cards, site map, acknowledge alarm, CSV export, demo scenarios

## Blynk pins
V0 temperature, V1 gas status (String), V2 gas level (Integer), V3 fall (String), V4 SOS (String), V5 overall (String).

Do not publish this folder with your real token inside `config.js`.
