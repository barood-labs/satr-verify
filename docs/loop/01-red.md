# Loop 01 — red

Kane report from `node bin/satr-verify.js run --serve --flow search-tasks_test.md` at 2026-11-14T17:06:13Z on `spec-first/search`. Exit 1. Result code 740, `assertion_error.confirmed_product_bug`. The page had no Search tasks field. This file is the report the fix commit acts on. `flows/` was not changed.

# Satr Verify

Verdict: **failed**
Exit code: 1
Mode: kane
URL: http://127.0.0.1:4173
When: 2026-11-14T17:06:13.426Z

Kane started the browser and the flow failed. The expected value and the actual value below are what the agent patches against. The video trace is the link or path to the recording.

## flows/search-tasks_test.md

- Status: failed
- Kane CLI: 0.10.4
- Surface: testmd
- Result code: 740
- Reason code: assertion_error.confirmed_product_bug
- Reason: No Search tasks field exists in the current page snapshot.
- One line: The checklist page loads, but it has no Search tasks field to filter tasks.
- Duration: 28s
- Credits: 12.83

The loaded checklist shows task cards, including both named tasks, but does not provide the requested Search tasks field. This prevents users from searching for Social and filtering the list.
Add or restore the visible Search tasks field on the checklist page and verify that entering Social shows Get a Social Security card while hiding Open a bank account.
evidence: objective_contradiction: No Search tasks field exists in the current page snapshot.

### Video trace

https://test-manager.lambdatest.com/projects/01M7DEFKES5QP35A9974V05XNA/test-cases/01M7DGB5AXB13QPW2TSZTZKGBQ/dashboard/share/US_A4WXV0FGC8AWAGA1VC41DXDTWR9TFWDWVMLUOB21MS3T1ELPO7VRNTGC9A0H0ENC?type=summary&agentView=true&fqdn=summary-page

Evidence pack: `/home/box/.testmuai/kaneai/sessions/2a81288d-7750-4ad1-a8c2-1621400272e8/evidence/8fd42eee-2d50-402d-bb2a-45283a4b422d.evidence`
Session directory: `/home/box/.testmuai/kaneai/sessions/2a81288d-7750-4ad1-a8c2-1621400272e8`

### Flow errors

- No Search tasks field exists in the current page snapshot.

### Spec the agent must keep

1. **Filter in English** — Open {{base_url}} and verify a text field labeled "Search tasks" is visible. Type "Social" into "Search tasks" and verify the task "Get a Social Security card" is visible and the task "Open a bank account" is not visible.
2. **Filter in Arabic** — Click the button labeled "العربية" and verify the search field label is "ابحث عن مهمة". Clear the search field, type "عيادة", and verify the task "إيجاد عيادة منخفضة التكلفة" is visible and the task "فتح حساب بنكي" is not visible.

Command:

```
kane-cli testmd run /workspace/bounty/drafts/kane_cli/red1/flows/search-tasks_test.md --agent --headless --timeout 150 --url http://127.0.0.1:4173 --variables-file /tmp/satr-verify-646461-1794675937460.json
```

## What the agent should do

Verdict is failed. Read the failed step in `flows/search-tasks_test.md`. Expected: (see the failed step remark). Actual: (see the failed step remark). Patch `app/` so a new run would observe the expected text. Do not edit `flows/` to weaken the check. Re-run the same `satr-verify run` command. Read `.satr/last-run.md` again. Stop when the verdict is passed. Open the video trace if the remark is not enough to see the page.

