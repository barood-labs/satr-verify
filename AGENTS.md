# Satr Verify — agent loop

When you change `app/`, close the loop with Kane CLI. Do not tell the user the page works until the report says passed, or until you have written down that Kane could not start.

1. Serve the page or use the deployed URL: `https://barood-labs.github.io/satr-verify/`.
2. Run `node bin/satr-verify.js run --url <url>`.
3. Read `.satr/last-run.md` (and `.satr/last-run.json` if you want the fields).
4. Exit 0, verdict `passed`: report the one-line summary and the video trace. Stop.
5. Verdict `failed`: patch `app/` so the page shows the expected text. Do not edit `flows/` to drop or soften the check. Run the same command again.
6. Verdict `did_not_start` (exit 2): Kane never opened the browser. Fix sign-in, Chrome, or the URL. Do not change the app to satisfy it.
7. Verdict `timeout` or `cancelled` (exit 3): run it again. Do not treat a cut-off run as a product bug.

On a machine without Kane credentials, rehearse with `--dry-run` or `--fixture test/fixtures/arabic-heading-mismatch.ndjson`. A fixture proves the report, not the live page.

## Auth

Never ask for an access key in chat and never commit one.

- Interactive: `kane-cli login --oauth` (or `kane-cli login` on a machine with a browser).
- Non-interactive: `LT_USERNAME` and `LT_ACCESS_KEY` in the environment. Satr Verify passes them as `--username` and `--access-key` and redacts both in the report.
- `TESTMUAI_BASIC_AUTH` may be base64 of `username:accessKey`.

Tag the child process with `KANE_CLI_USER_AGENT=satr-verify` (the CLI does this).

## Kane output

`kane-cli` 0.10.4 `--agent` writes NDJSON to stdout. Trust, in order: the process exit code, then `test_md_done.overall_status` for a `_test.md` file, then `run_end`. An embedded `run_end` finishes one testmd step, not the file. A run that exits 2 with no `run_end` did not start.

Fields the report keeps from a real run: `result_code`, `reason_code`, `credits_consumed`, `per_flow_metadata`, `run_dir`, `session_dir`, `test_url`, `final_state`, `context.memory` (`expected_value`, `extracted_value`, `operator`, `reasoning`), the untyped step line with `status: "failed"`, and `coverage.pack` (the `.evidence` file). The video trace is `test_url` or `test_md_done.share_url`, then the evidence pack path.

Full Kane agent instructions: https://www.testmuai.com/kane-cli-agent/AGENTS.md
