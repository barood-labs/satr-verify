#!/usr/bin/env node
import fs from "node:fs";

const stdoutFile = process.env.SATR_FAKE_STDOUT;
const stderrFile = process.env.SATR_FAKE_STDERR;
const exitCode = Number(process.env.SATR_FAKE_EXIT ?? "0");
const argvFile = process.env.SATR_FAKE_ARGV;
if (argvFile) fs.writeFileSync(argvFile, JSON.stringify(process.argv.slice(1)));
if (stderrFile) process.stderr.write(fs.readFileSync(stderrFile, "utf8"));
else process.stderr.write("evidence: view locally with `kane-cli evidence serve /tmp/satr-fake.evidence`\n");
if (stdoutFile) process.stdout.write(fs.readFileSync(stdoutFile, "utf8"));
process.exit(exitCode);
