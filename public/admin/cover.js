/**
 * One cover image per project, the first image by default.
 *
 * - In the editor, ticking "Image de couverture" on one gallery item unticks
 *   the others that are open on screen.
 * - On save, a project with no ticked item gets its first image ticked, and a
 *   project with several (e.g. one in a collapsed item) is refused with a
 *   message, so the saved file always has exactly one cover.
 *
 * Relies on Sveltia CMS markup (fields carry data-key-path, e.g.
 * "media.2.cover"; booleans are role="switch" buttons). Re-test after
 * upgrading Sveltia.
 */
const COVER_FIELD = /^media\.\d+\.cover$/;
const VIDEO = /\.(mp4|webm|mov)(\?.*)?$/i;

function coverSwitches() {
  return [...document.querySelectorAll(".field[data-key-path]")]
    .filter((field) => COVER_FIELD.test(field.dataset.keyPath))
    .map((field) => field.querySelector('[role="switch"]'))
    .filter(Boolean);
}

document.addEventListener(
  "click",
  (event) => {
    const clicked = event.target.closest?.('[role="switch"]');
    if (!clicked || !coverSwitches().includes(clicked)) return;
    // Let the CMS apply the click first, then untick the others.
    setTimeout(() => {
      if (clicked.getAttribute("aria-checked") !== "true") return;
      for (const other of coverSwitches())
        if (other !== clicked && other.getAttribute("aria-checked") === "true")
          other.click();
    });
  },
  true
);

window.CMS?.registerEventListener({
  name: "preSave",
  handler: ({ entry }) => {
    if (entry.get("collection") !== "projets") return;
    const data = entry.get("data");
    const media = data.get("media");
    if (!media || media.size === 0) return;
    const ticked = media.filter((item) => item.get("cover") === true).size;
    if (ticked > 1)
      throw new Error(
        "Une seule image de couverture peut être cochée. Décochez les autres dans « Images et vidéos », puis enregistrez."
      );
    if (ticked === 1) return;
    let first = media.findIndex((item) => !VIDEO.test(item.get("src") ?? ""));
    if (first === -1) first = 0;
    return data.setIn(["media", first, "cover"], true);
  },
});
