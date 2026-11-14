import fs from "node:fs";
import path from "node:path";

export function discoverFlows(root, { flow } = {}) {
  const dir = path.join(root, "flows");
  if (!fs.existsSync(dir)) return [];
  const names = fs.readdirSync(dir).filter((name) => isFlowFile(name)).sort();
  const flows = names.map((name) => describeFlow(path.join(dir, name), name));
  if (!flow) return flows;
  const wanted = flow.replace(/\\/g, "/");
  return flows.filter((item) => item.file === wanted || item.file.endsWith(`/${wanted}`) || item.name === wanted);
}

export function isFlowFile(name) {
  return name.endsWith("_test.md") || name.endsWith(".flow.md");
}

export function describeFlow(filePath, name = path.basename(filePath)) {
  const markdown = fs.readFileSync(filePath, "utf8");
  const kind = name.endsWith("_test.md") ? "testmd" : "run";
  return {
    name,
    file: path.join("flows", name).replace(/\\/g, "/"),
    path: filePath,
    kind,
    objective: kind === "run" ? objectiveFromFlow(markdown) : null,
    spec_steps: readFlowSteps(markdown),
  };
}

export function readFlowSteps(markdown) {
  const withoutFrontmatter = String(markdown).replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, "");
  const steps = [];
  for (const part of withoutFrontmatter.split(/\n(?=## )/)) {
    const match = part.match(/^## ([^\n]+)\n([\s\S]*)$/);
    if (!match) continue;
    const body = match[2].replace(/```yaml[\s\S]*?```/g, "").trim();
    steps.push({ heading: match[1].trim(), body });
  }
  return steps;
}

export function objectiveFromFlow(markdown) {
  const withoutFrontmatter = String(markdown).replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, "");
  return withoutFrontmatter
    .replace(/^# .+\n+/, "")
    .replace(/^## .+\n/gm, "")
    .replace(/```yaml[\s\S]*?```/g, "")
    .trim()
    .replace(/\n{3,}/g, "\n\n");
}

export function substituteBaseUrl(text, url) {
  return String(text ?? "").replaceAll("{{base_url}}", url);
}
