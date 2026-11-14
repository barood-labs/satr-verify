import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { TASKS, UI } from "../app/tasks.js";
import { escapeHtml, progressLabel } from "../app/app.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("every task has the same shape in Arabic and English", () => {
  assert.equal(new Set(TASKS.map((task) => task.id)).size, TASKS.length);
  for (const task of TASKS) {
    assert.equal(task.en.documents.length, task.ar.documents.length);
    assert.equal(task.en.steps.length, task.ar.steps.length);
    assert.deepEqual(
      task.en.documents.map((doc) => doc.id),
      task.ar.documents.map((doc) => doc.id),
    );
    for (const key of ["title", "summary", "office", "time", "fee", "say"]) {
      assert.ok(task.en[key].trim());
      assert.ok(task.ar[key].trim());
      assert.notEqual(task.en[key], task.ar[key]);
    }
    assert.match(task.href, /^https:\/\//);
  }
  assert.equal(UI.en.direction, "Direction: left to right");
  assert.equal(UI.ar.direction, "الاتجاه: من اليمين إلى اليسار");
  assert.equal(UI.en.langButton, "العربية");
  assert.equal(UI.ar.langButton, "English");
});

test("the strings Kane looks for are present in only one language", () => {
  const state = TASKS.find((task) => task.id === "state-id");
  assert.equal(state.en.title, "Get a state ID");
  assert.equal(state.ar.title, "استخراج بطاقة هوية الولاية");
  assert.equal(state.en.documents[0].name, "Proof of identity");
  assert.match(state.en.steps.join(" "), /appointment/);
  const bank = TASKS.find((task) => task.id === "bank");
  assert.equal(bank.en.title, "Open a bank account");
  assert.equal(bank.en.documents[0].name, "Government photo ID");
  assert.equal(progressLabel(1, 4, "en"), "1 of 4 documents");
  assert.equal(progressLabel(0, 4, "ar"), "0 من 4 مستندات");
  assert.equal(escapeHtml(`<b>"&"</b>`), "&lt;b&gt;&quot;&amp;&quot;&lt;/b&gt;");
});

test("the page uses relative assets so GitHub Pages project sites work", () => {
  const html = fs.readFileSync(path.join(root, "app/index.html"), "utf8");
  assert.match(html, /href="\.\/styles\.css"/);
  assert.match(html, /src="\.\/app\.js"/);
  assert.doesNotMatch(html, /src="\//);
  assert.match(html, /dir="ltr"/);
});
