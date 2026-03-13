# CLAUDE.md

## Project Overview

5.5e Companion - A D&D 5.5e session companion web app. DMs manage characters and battlefield, players join via QR + PIN and see real-time updates.

## Tech Stack

- Node.js + Express 5 backend (static file server + SRD data API only)
- IndexedDB for client-side storage (DM's browser is source of truth)
- PeerJS/WebRTC for real-time DM-to-player communication
- Vanilla HTML/CSS/JS frontend
- SRD 5.2 data (CC BY 4.0) stored as read-only JSON in `data/`

## Key Files

- `server.js` — Static file server + SRD JSON data API routes
- `public/js/db.js` — IndexedDB abstraction layer (database: `dnd-companion`, stores: `characters`, `dmState`)
- `public/js/peer.js` — PeerJS communication layer (DM host + player client)
- `public/js/dm.js` — DM dashboard: character CRUD, pickers (spells/features/equipment), battlefield, session management via PeerJS
- `public/js/player.js` — Player sheet: PeerJS connection to DM, character display
- `public/js/constants.js` — CLASSES, SPECIES, BACKGROUNDS, HIT_DIE, spell slot tables
- `data/srd-5.2-*.json` — SRD reference data (spells, monsters, equipment, class features, species traits, feats)

## Architecture Patterns

- No server-side database — all data stored in DM's browser via IndexedDB
- No authentication — DM opens the page, data persists in browser
- Players connect to DM via PeerJS WebRTC data channels (same network not required, PeerJS uses public signaling server)
- Session flow: DM creates session with PIN → generates QR code → players scan and join via PeerJS → claim characters
- Message protocol: Player→DM (`join`, `claim`, `ping`) and DM→Player (`join-ok`, `join-error`, `claim-ok`, `claim-error`, `character-update`, `character-list`)
- Peer ID format: `dnd-companion-{roomId}` where roomId is auto-generated UUID stored in IndexedDB
- `validateCharacter(c)` and `sanitizeCharacter(c)` in `db.js` handle client-side validation
- Battlefield persists in IndexedDB (`dmState` store), not session level
- Player state (spell slot checks) is client-side only — survives character re-renders
- Backup/Restore: DM can export all IndexedDB data as JSON file for durability
- Custom features/spells use `_editing: true` flag for inline editable rows, stripped on save
- Background dropdown: SRD options + "Custom..." with conditional text input

## Commands

- `npm start` — Start the server
- Server only serves static files and SRD JSON data

## Conventions

- No frameworks — vanilla JS only on frontend
- Parchment theme: Cinzel + Crimson Text fonts, background texture
- Array limits: 50 each for equipment/spells/features, 20 characters per DM, 50 battlefield monsters
- SRD data files in `data/` are read-only reference — never modify them
