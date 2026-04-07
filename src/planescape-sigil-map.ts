import { importSigilData } from "./module/import.js";

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
    hint: "Tracks the last imported data version. Clear to force re-import.",
    scope: "world",
    config: false,
    type: String,
    default: "",
  });

  (game as any).settings.register(MODULE_ID, "autoImport", {
    name: "Auto-Import on Activation",
    hint: "Automatically import Sigil map data when the module is first activated.",
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
  });

  const autoImport = (game as any).settings.get(MODULE_ID, "autoImport") as boolean;
  const importedVersion = (game as any).settings.get(MODULE_ID, "importVersion") as string;

  if (autoImport && importedVersion !== (game as any).modules.get(MODULE_ID)?.version) {
    void importSigilData();
  }
}
