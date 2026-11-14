import fs from "node:fs";
import path from "node:path";

export function watchAndRun({ root = process.cwd(), run, debounceMs = 400, onError = console.error } = {}) {
  let timer = null;
  let running = false;
  let again = false;
  const dirs = [path.join(root, "app"), path.join(root, "flows")].filter((dir) => fs.existsSync(dir));
  const watchers = dirs.map((dir) =>
    fs.watch(dir, { recursive: true }, (_event, filename) => {
      if (!filename || filename.includes(".satr")) return;
      schedule();
    }),
  );

  async function fire() {
    if (running) {
      again = true;
      return;
    }
    running = true;
    try {
      await run();
    } catch (error) {
      onError(error);
    } finally {
      running = false;
      if (again) {
        again = false;
        schedule();
      }
    }
  }

  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(() => {
      fire();
    }, debounceMs);
  }

  fire();
  return {
    close() {
      clearTimeout(timer);
      for (const watcher of watchers) watcher.close();
    },
  };
}
