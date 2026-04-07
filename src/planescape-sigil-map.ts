import { importSigilData, cleanupPreviousImport } from "./module/import.js";

const MODULE_ID = "planescape-sigil-map";

Hooks.once("init", () => {
  console.log(`${MODULE_ID} | Initializing Planescape Sigil Map module`);
});

Hooks.once("ready", () => {
  console.log(`${MODULE_ID} | Planescape Sigil Map module ready`);

  if (!(game as any).user?.isGM) return;

  registerSettings();
});

function registerSettings(): void {
  (game as any).settings.register(MODULE_ID, "importVersion", {
    name: "Data Import Version",
    hint: "Tracks the last imported data version.",
    scope: "world",
    config: false,
    type: String,
    default: "",
  });

  (game as any).settings.registerMenu(MODULE_ID, "importMenu", {
    name: "Import Sigil Map Data",
    label: "Import / Re-import",
    hint: "Import or re-import all Sigil location data, scene, and map pins.",
    icon: "fas fa-map",
    type: SigilImportMenu,
    restricted: true,
  });

  // Check if first run or version changed — prompt the user
  const importedVersion = (game as any).settings.get(MODULE_ID, "importVersion") as string;
  const moduleVersion = (game as any).modules.get(MODULE_ID)?.version as string;

  if (!importedVersion) {
    void showFirstImportDialog();
  } else if (importedVersion !== moduleVersion) {
    void showUpdateDialog(importedVersion, moduleVersion);
  }
}

async function showFirstImportDialog(): Promise<void> {
  const proceed = await (foundry as any).applications.api.DialogV2.confirm({
    window: { title: "Planescape Sigil Map — First-Time Setup" },
    content: `
      <p>Welcome! This module can import <strong>308 Sigil locations</strong> as journal entries
      and create an interactive map scene with pins for each location.</p>
      <p>Would you like to import now?</p>
    `,
    yes: { icon: "fas fa-download", label: "Import Now" },
    no: { icon: "fas fa-clock", label: "Later" },
    rejectClose: false,
  });

  if (proceed) void importSigilData();
}

async function showUpdateDialog(oldVersion: string, newVersion: string): Promise<void> {
  const result = await new Promise<string>((resolve) => {
    new (foundry as any).applications.api.DialogV2({
      window: { title: "Planescape Sigil Map — Update Available" },
      content: `
        <p>The module has been updated from <strong>v${oldVersion}</strong> to
        <strong>v${newVersion}</strong>.</p>
        <p>You can re-import the Sigil data to get the latest changes.</p>
        <p><strong>Warning:</strong> Re-importing will replace all module-created journal entries
        and the Sigil scene. Any edits you've made to those documents will be lost.
        User-created documents are not affected.</p>
      `,
      buttons: [
        {
          action: "reimport",
          icon: "fas fa-sync-alt",
          label: "Re-import",
        },
        {
          action: "skip",
          icon: "fas fa-forward",
          label: "Skip This Version",
        },
        {
          action: "later",
          icon: "fas fa-clock",
          label: "Decide Later",
          default: true,
        },
      ],
      submit: (result: string) => resolve(result),
      close: () => resolve("later"),
    }).render({ force: true });
  });

  if (result === "reimport") {
    await cleanupPreviousImport();
    void importSigilData();
  } else if (result === "skip") {
    await skipVersion(newVersion);
  }
}

async function skipVersion(version: string): Promise<void> {
  await (game as any).settings.set(MODULE_ID, "importVersion", version);
  (ui as any).notifications.info(
    "Planescape Sigil Map | Skipped re-import. Use the module settings menu to import later.",
  );
}

/**
 * Foundry settings menu that provides import/re-import functionality.
 * Uses ApplicationV2 as the v13 replacement for FormApplication.
 */
class SigilImportMenu extends (foundry as any).applications.api.ApplicationV2 {
  static override readonly DEFAULT_OPTIONS = {
    id: "sigil-import-menu",
    window: { title: "Sigil Map Data Import" },
  };

  override _onRender(): void {
    // Immediately close this shell and show the dialog instead
    void this.close();
    void showImportDialog();
  }
}

async function showImportDialog(): Promise<void> {
  const result = await new Promise<string>((resolve) => {
    new (foundry as any).applications.api.DialogV2({
      window: { title: "Sigil Map Data Import" },
      content: `
        <p>Choose an action:</p>
        <ul>
          <li><strong>Import</strong> — imports data (skips if already imported)</li>
          <li><strong>Re-import</strong> — deletes existing module data and imports fresh.
          Any edits to module-created journals or the Sigil scene will be lost.</li>
        </ul>
      `,
      buttons: [
        {
          action: "import",
          icon: "fas fa-download",
          label: "Import",
        },
        {
          action: "reimport",
          icon: "fas fa-sync-alt",
          label: "Re-import (Clean)",
        },
        {
          action: "cancel",
          icon: "fas fa-times",
          label: "Cancel",
          default: true,
        },
      ],
      submit: (result: string) => resolve(result),
      close: () => resolve("cancel"),
    }).render({ force: true });
  });

  if (result === "import") {
    void importSigilData();
  } else if (result === "reimport") {
    await cleanupPreviousImport();
    await importSigilData();
  }
}
