# Three-minute demo

Film the screen. Talk over it. Judges stop at 3:00, so the red report is the first frame. Set the video to Unlisted.

This script is the closed loop: a failed Kane run, the agent reading it, a patch in `app/`, then the same command going green. Two ways to shoot it:

- **Live.** On a machine with Kane CLI signed in, use the commands in the README. The report lands in `.satr/last-run.md`. If the first run fails, the middle of this script is the real patch. If it passes, the green half is the proof, and you can still open with the rehearsal failure below so the loop is visible.
- **Rehearsal, no credits.** The failure fixture uses the same `run_end` fields as kane-cli 0.10.4 (`result_code`, `reason_code`, `context.memory.expected_value` / `extracted_value`, `test_url`, `coverage.pack`). Say on camera that this file is a captured-shape failure, and that a credited run writes the same report.

## 0:00 — The failure (20 seconds)

Terminal, large type. Run:

```bash
node bin/satr-verify.js run \
  --fixture test/fixtures/arabic-heading-mismatch.ndjson \
  --flow arabic-toggle_test.md \
  --url https://barood-labs.github.io/satr-verify/
```

Leave `.satr/last-run.md` on screen. Read only these lines:

- Verdict: **failed**
- Result code 710, `assertion_error.final_verification`
- Failed step 4
- Expected: استخراج بطاقة هوية الولاية
- Actual: Get a state ID
- Video trace: the Test Manager share URL

Say: "Kane opened the page, clicked العربية, and the state ID title was still English. The agent does not get a screenshot dump. It gets this."

## 0:20 — The agent acts (50 seconds)

Open `.satr/last-run.md` beside `app/app.js`. Point at `applyLanguage` and at `task[state.lang].title` in `renderList`. The spec at the bottom of the report is `flows/arabic-toggle_test.md`. Say that the flow stays; the page changes.

Show the instruction block "What the agent should do": patch `app/`, do not weaken `flows/`, run again.

If you are shooting a real Kane failure, make the edit now and save. On the rehearsal, do not fake a diff. Say: "The page already renders that Arabic title. A live failure would be a diff in this function, then the same command without `--fixture`."

Optional, if the pre-push hook is the thing you want in frame:

```bash
node bin/satr-verify.js hook install
```

One sentence: "The next `git push` runs the same flows and blocks on a failed verdict."

## 1:10 — Green (40 seconds)

Rehearsal, the captured passing run (real kane-cli 0.10.4 NDJSON, example.com, result code 100):

```bash
node bin/satr-verify.js run \
  --fixture test/fixtures/warmup.ndjson \
  --url https://example.com
```

Live, after the patch:

```bash
node bin/satr-verify.js run --url https://barood-labs.github.io/satr-verify/
```

Show the new verdict: **passed**, `success.complete`, credits, and the video trace link. Open the trace if it is a real share URL. Say: "Same file. The agent stops here."

## 1:50 — The app (70 seconds)

Browser, https://barood-labs.github.io/satr-verify/ (or `node bin/satr-verify.js serve`).

1. Home, English. Five tasks. Open **Get a state ID**. Show Proof of identity and the appointment step.
2. Tick **Proof of identity**. The line becomes "1 of 4 documents".
3. Click **العربية**. The header says "الاتجاه: من اليمين إلى اليسار". The title is "استخراج بطاقة هوية الولاية". The margin moves to the right. Point at the sentence under "ماذا تقول".
4. Click **English**. You are back.

End on the URL and one sentence: "Satr is the checklist. Satr Verify is the loop that makes an agent prove it."

## If you only have one take

Keep 0:00 and 1:10. Cut the hook. The app tour can lose the checkbox if you are over time. Do not cut the expected-versus-actual lines.
