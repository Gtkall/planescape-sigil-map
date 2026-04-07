import { type MapDataset, type MapLocation, type MapCategory } from "./types.js";

const MODULE_ID = "planescape-sigil-map";

// Map image dimensions (from the dataset)
const MAP_WIDTH = 6400;
const MAP_HEIGHT = 4400;

/**
 * Main import entry point. Reads map.json from the module's bundled dataset,
 * creates JournalEntry documents (one per ward) with pages for each location,
 * then creates a Scene with Note pins linking to those journal pages.
 */
export async function importSigilData(): Promise<void> {
  (ui as any).notifications.info("Planescape Sigil Map | Importing map data...");

  const dataset = await loadDataset();
  if (!dataset) return;

  const categoryMap = new Map(dataset.categories.map((c) => [c.id, c]));
  const locations = dataset.levels[0]?.locations ?? [];

  // Group locations by ward/category
  const byWard = new Map<string, MapLocation[]>();
  for (const loc of locations) {
    const ward = loc.category;
    if (!byWard.has(ward)) byWard.set(ward, []);
    byWard.get(ward)!.push(loc);
  }

  // Create journal entries (one per ward)
  const journalMap = await createJournalEntries(byWard, categoryMap);

  // Create the scene with note pins
  await createSigilScene(locations, journalMap, categoryMap);

  // Mark import as complete
  const version = (game as any).modules.get(MODULE_ID)?.version as string;
  await (game as any).settings.set(MODULE_ID, "importVersion", version);

  (ui as any).notifications.info(
    `Planescape Sigil Map | Imported ${locations.length} locations across ${byWard.size} wards.`,
  );
}

async function loadDataset(): Promise<MapDataset | null> {
  try {
    const response = await fetch(`modules/${MODULE_ID}/dataset/map.json`);
    return (await response.json()) as MapDataset;
  } catch (err) {
    console.error(`${MODULE_ID} | Failed to load map dataset`, err);
    (ui as any).notifications.error("Planescape Sigil Map | Failed to load map dataset.");
    return null;
  }
}

/**
 * Creates one JournalEntry per ward, each containing JournalEntryPages
 * for every location in that ward.
 *
 * Returns a map of location ID → { journalId, pageId } for scene note linking.
 */
async function createJournalEntries(
  byWard: Map<string, MapLocation[]>,
  categoryMap: Map<string, MapCategory>,
): Promise<Map<string, { journalId: string; pageId: string }>> {
  const result = new Map<string, { journalId: string; pageId: string }>();

  // Create a folder for all our journal entries
  const folder = await (Folder as any).create({
    name: "Sigil Locations",
    type: "JournalEntry",
    color: "#7B1FA2",
  });

  for (const [wardId, locations] of byWard) {
    const category = categoryMap.get(wardId);
    const wardName = category?.title ?? wardId;

    // Sort locations by their ID for consistent ordering
    locations.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));

    // Build page data for all locations in this ward
    const pages = locations.map((loc, idx) => ({
      name: loc.title,
      type: "text",
      sort: idx * 100,
      text: {
        content: buildPageContent(loc),
        format: 1, // HTML
      },
      flags: {
        [MODULE_ID]: {
          locationId: loc.id,
          category: loc.category,
          x: loc.x,
          y: loc.y,
        },
      },
    }));

    const journal = await (JournalEntry as any).create({
      name: wardName,
      folder: folder.id,
      pages,
      flags: {
        [MODULE_ID]: { wardId },
      },
    });

    // Map location IDs to their journal + page IDs for scene note linking
    const createdPages: any[] = (journal).pages.contents;
    for (const page of createdPages) {
      const locId: string | undefined = page.flags?.[MODULE_ID]?.locationId;
      if (locId) {
        result.set(locId, {
          journalId: (journal).id,
          pageId: page.id,
        });
      }
    }
  }

  return result;
}

function buildPageContent(loc: MapLocation): string {
  // The description from city-of-doors already contains HTML
  let content = "";

  if (loc.about) {
    content += `<p><strong>Source:</strong> ${loc.about}</p>`;
  }

  content += loc.description;

  return content;
}

/**
 * Creates a Scene with the Sigil map as background and Note pins
 * for every location that has valid coordinates.
 */
async function createSigilScene(
  locations: MapLocation[],
  journalMap: Map<string, { journalId: string; pageId: string }>,
  categoryMap: Map<string, MapCategory>,
): Promise<void> {
  // Build note data for locations with valid coordinates
  const notes = [];
  for (const loc of locations) {
    const x = parseFloat(loc.x);
    const y = parseFloat(loc.y);

    // Skip locations without map positions (0,0 = "Anywhere in Sigil" / "Other")
    if (x === 0 && y === 0) continue;

    const ref = journalMap.get(loc.id);
    if (!ref) continue;

    const category = categoryMap.get(loc.category);

    notes.push({
      entryId: ref.journalId,
      pageId: ref.pageId,
      x: Math.round(x * MAP_WIDTH),
      y: Math.round(y * MAP_HEIGHT),
      iconSize: 32,
      text: loc.title,
      textColor: category?.color ?? "#FFFFFF",
      fontSize: 12,
      textAnchor: CONST.TEXT_ANCHOR_POINTS.CENTER,
      flags: {
        [MODULE_ID]: { locationId: loc.id },
      },
    });
  }

  await (Scene as any).create({
    name: "Sigil - City of Doors",
    background: {
      src: `modules/${MODULE_ID}/artwork/sigil-map.png`,
    },
    width: MAP_WIDTH,
    height: MAP_HEIGHT,
    padding: 0,
    grid: {
      type: 0, // Gridless
    },
    initial: {
      x: MAP_WIDTH / 2,
      y: MAP_HEIGHT / 2,
      scale: 0.4,
    },
    notes,
    flags: {
      [MODULE_ID]: { version: (game as any).modules.get(MODULE_ID)?.version },
    },
  });
}
