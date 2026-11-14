# Satr Verify

Satr is a bilingual Arabic and English checklist for people new to the United States: pick a task such as a state ID, a bank account, a Social Security card, school enrollment, or a low-cost clinic, see the documents and the order, and tick them off on your own device. Satr Verify is the closed loop around it. Plain-English flows in `flows/` run through Kane CLI, and the NDJSON comes back as `.satr/last-run.md`: which step failed, what was expected, what the page actually showed, and a link or path to the video trace. An agent reads that report, patches `app/`, and runs Kane again until the verdict is passed.

**Live app:** https://barood-labs.github.io/satr-verify/

Built for the [Kane CLI Online Hackathon](https://luma.com/kanecli-online-hackathon). The agent in this repo is Cursor. Kane CLI is the verifier.

## 30-second setup

Node 18 or newer. No install step and no dependencies.

```bash
git clone https://github.com/barood-labs/satr-verify.git
cd satr-verify
node bin/satr-verify.js --dry-run
```

That writes `.satr/last-run.md` without launching Kane. Open the checklist locally:

```bash
node bin/satr-verify.js serve
```

Then visit http://127.0.0.1:4173/. The same files are what GitHub Pages serves.

From a checkout you can also run `npx satr-verify --dry-run`. From anywhere:

```bash
npx --yes github:barood-labs/satr-verify --dry-run
```

## How the loop works

1. You, or the agent, change `app/`.
2. `satr-verify run` starts `kane-cli testmd run` on each `flows/*_test.md` (or `kane-cli run` for a `*.flow.md`), with `--agent` so stdout is NDJSON. The page URL is passed as `--url` and as `{{base_url}}`.
3. The parser keeps the fields Kane actually emits on 0.10.4: `result_code`, `reason_code`, `credits_consumed`, `per_flow_metadata`, `run_dir`, `test_url`, the `coverage.pack` evidence file, and `context.memory` (`expected_value` against `extracted_value`). For a markdown test, `test_md_done` is the verdict. An earlier `run_end` only finishes a step.
4. `.satr/last-run.md` and `.satr/last-run.json` are rewritten. Raw stdout is kept in `.satr/raw/` for a real run.
5. The agent reads the failed step and the expected versus actual lines, edits `app/`, and runs the same command. It does not weaken `flows/`. Exit 2 means Kane never started (sign-in, Chrome, or the binary), so the app is left alone.

Three ways to call it:

| Call | What it does |
| --- | --- |
| `node bin/satr-verify.js run --url <url>` | Real Kane run. |
| `node bin/satr-verify.js watch --url <url>` | Same run again whenever `app/` or `flows/` is saved. |
| `node bin/satr-verify.js hook install` | Pre-push hook. `SATR_VERIFY_DRY_RUN=1` skips Kane. `SATR_VERIFY_SKIP=1` skips the hook. |
| Cursor MCP `verify_with_kane` | `.cursor/mcp.json` starts `node bin/satr-verify.js mcp`. |

`AGENTS.md` is the instruction file the agent follows. `docs/DEMO.md` is the three-minute recording script, and it opens on the failure.

## Run it on a machine with Kane credentials

This environment cannot sign in to Kane. On a machine that can:

```bash
npm install -g @testmuai/kane-cli
kane-cli login --oauth
```

Or skip the browser login and export the basic-auth pair Kane's own CI docs use (they are passed as flags and redacted in the report):

```bash
export LT_USERNAME='your-testmu-username'
export LT_ACCESS_KEY='your-access-key'
```

`TESTMUAI_BASIC_AUTH` (base64 of `username:accessKey`) works too. Chrome has to be installed for a local browser run.

Then, from this repo:

```bash
node bin/satr-verify.js run --url https://barood-labs.github.io/satr-verify/
```

One flow, if you want a shorter first run:

```bash
node bin/satr-verify.js run \
  --url https://barood-labs.github.io/satr-verify/ \
  --flow arabic-toggle_test.md
```

Send back `.satr/last-run.md`, `.satr/last-run.json`, and the matching files in `.satr/raw/`. The first run authors each step and spends credits. Kane writes `output-<name>/` beside the test; keep those folders if you want the next run to replay without authoring again.

Rehearse the report with no credits:

```bash
node bin/satr-verify.js run \
  --fixture test/fixtures/arabic-heading-mismatch.ndjson \
  --flow arabic-toggle_test.md \
  --url https://barood-labs.github.io/satr-verify/

node bin/satr-verify.js --dry-run
node --test
```

`test/fixtures/warmup.ndjson` is a real passing `kane-cli run --agent` capture from 0.10.4. The failure fixtures use that same event shape, including result code 710 (`assertion_error.final_verification`) and a `test_md_done` stream where an early passing `run_end` must not hide a later failure.

## What the flows check

- `flows/open-checklist_test.md` — the name Satr, the task "Get a state ID", the document "Proof of identity", and a step about booking an appointment.
- `flows/arabic-toggle_test.md` — the button "العربية", then the title "استخراج بطاقة هوية الولاية" and the phrase "من اليمين إلى اليسار".
- `flows/check-document_test.md` — "Open a bank account", the document "Government photo ID", and progress text that shows "1 of" after the checkbox.

Only the active language is in the DOM, so the Arabic assertions are about text a visitor can see.

## Layout

```
app/          static checklist (GitHub Pages publishes this directory)
flows/        Kane _test.md files
src/          parser, report, Kane runner, watch, hook, MCP
bin/satr-verify.js
test/         parser fixtures and unit tests
docs/DEMO.md
```

## Submission paragraph

Satr Verify is a bilingual paperwork checklist for newcomers in the United States, and a small CLI that closes the loop between a coding agent and Kane CLI. The agent edits the static page; `satr-verify` runs the plain-English flows with `kane-cli --agent`, parses the NDJSON, and writes the failed step, expected versus actual, and the video trace to `.satr/last-run.md`. The agent reads that file, patches the page, and runs again until the verdict is passed. The same tool is a pre-push hook, a save watcher, and an MCP tool named `verify_with_kane`. The page is live at https://barood-labs.github.io/satr-verify/. The agent was Cursor.
