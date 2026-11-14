import fs from "node:fs";
import path from "node:path";

const HOOK = `#!/bin/sh
# Installed by \`satr-verify hook install\`. Blocks the push when Kane reports a failure.
cd "$(git rev-parse --show-toplevel)" || exit 2
if [ -n "$SATR_VERIFY_SKIP" ]; then
  echo "satr-verify: pre-push skipped (SATR_VERIFY_SKIP is set)"
  exit 0
fi
extra=""
if [ "$SATR_VERIFY_DRY_RUN" = "1" ]; then
  extra="--dry-run"
fi
exec node bin/satr-verify.js run $extra
`;

export function installHook(root = process.cwd()) {
  const gitDir = path.join(root, ".git");
  if (!fs.existsSync(gitDir)) {
    throw new Error("No .git directory. Run this from a clone of the repo.");
  }
  const hooksDir = path.join(gitDir, "hooks");
  fs.mkdirSync(hooksDir, { recursive: true });
  const tracked = path.join(root, "hooks", "pre-push");
  fs.mkdirSync(path.dirname(tracked), { recursive: true });
  fs.writeFileSync(tracked, HOOK, { mode: 0o755 });
  const dest = path.join(hooksDir, "pre-push");
  fs.writeFileSync(dest, HOOK, { mode: 0o755 });
  return dest;
}

export function uninstallHook(root = process.cwd()) {
  const dest = path.join(root, ".git", "hooks", "pre-push");
  if (!fs.existsSync(dest)) return false;
  const text = fs.readFileSync(dest, "utf8");
  if (!text.includes("satr-verify")) return false;
  fs.rmSync(dest);
  return true;
}
