# Planescape Sigil Map

A [Foundry VTT](https://foundryvtt.com/) module that brings the interactive [Map of Sigil, City of Doors](https://github.com/amargon/city-of-doors) into your game as a fully navigable scene with journal-linked map pins.

## Features

- **Gridless Sigil map scene** (6400x4400) with the iconic city artwork as background
- **308 locations** across 9 wards, each with journal entries containing lore, NPCs, and source references
- **Color-coded map pins** matching the original city-of-doors icon style, with ward-specific colors
- **Clickable pins** that open the linked journal page for each location
- **Auto-import** on first activation (GM only) with version tracking for updates

### Wards

The Lady's Ward, Market Ward, Guildhall Ward, Clerk's Ward, The Hive, Lower Ward, Under Sigil, Anywhere in Sigil, Other

## Installation

In Foundry VTT, go to **Add-on Modules > Install Module** and paste:

```
https://github.com/Gtkall/planescape-sigil-map/releases/latest/download/module.json
```

### Compatibility

- Foundry VTT v13

## Usage

1. Enable the module in your world's **Module Management** settings
2. As GM, a dialog will prompt you to import the Sigil data on first activation
3. Open the **Sigil - City of Doors** scene from the scenes sidebar
4. Click any map pin to view the location's journal entry

When the module is updated, a dialog will offer to re-import with the latest data (warning you about any edits you've made). You can also manually import or re-import via **Configure Settings → Module Settings → Planescape Sigil Map → Import / Re-import**.

## Development

```bash
npm install           # Install dependencies
npm run build         # Generate icons + build module to dist/
npm run watch         # Watch mode for development
npm run fetch-data    # Fetch latest map data from upstream
npm run lint          # Run ESLint
```

The `dist/` directory is symlinked into your Foundry data modules folder for local development.

### Data Pipeline

Location data is fetched from the [city-of-doors](https://github.com/amargon/city-of-doors) repository and cached locally in `src/dataset/map.json`. The cache serves as a fallback if the upstream repository becomes unavailable. Run `npm run fetch-data:force` to refresh.

### Icon Generation

Pin icons are generated at build time from FontAwesome glyphs, producing colored circular SVGs for each icon/ward-color combination (103 total). Run `npm run generate-icons` to regenerate.

## Credits

- **Map data and compilation**: [amargon/city-of-doors](https://github.com/amargon/city-of-doors) (CC BY 4.0)
- **Montage**: Denis "Ambrus" Richard
- **Original cartography**: Rob Lazzaretti
- **Additional artwork**: Tony DiTerlizzi & David S. "Diesel" LaForce
- **Planescape setting**: Wizards of the Coast

This project is unofficial fan content and is not affiliated with, endorsed, or sponsored by Wizards of the Coast. See [LICENSE](LICENSE) for full attribution details.

## License

The module source code is licensed under the [MIT License](LICENSE).
The map dataset is used under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
