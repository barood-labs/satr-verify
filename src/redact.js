export function redactCommand(args, secrets) {
  const hidden = new Set((secrets ?? []).filter((value) => typeof value === "string" && value.length > 0));
  return args
    .map((arg) => (hidden.has(arg) ? "***" : arg))
    .join(" ");
}
