# Demo shot list — 2:45

Screen-record on Linux. Judges stop at 3:00, so this cut ends at 2:45. Do not re-run Kane on camera: the 17:10 pass took 93 seconds. Open the saved reports and the share pages. No fixtures.

Start the recording, then follow the shots in order. Each shot has the command to type and the caption to leave on screen. A caption is one line in the terminal, printed with `echo`, large enough to read.

```bash
ffmpeg -y \
  -f x11grab -video_size 1920x1080 -framerate 30 -i "$DISPLAY" \
  -f pulse -i default \
  -c:v libx264 -preset veryfast -pix_fmt yuv420p -c:a aac \
  -t 165 ~/satr-verify-demo.mp4
```

Drop `-f pulse -i default -c:a aac` if the box has no PulseAudio. Use the desktop size you actually have if it is not 1920x1080. Set the finished file to Unlisted before you submit it.

Work from a checkout of `main` after the search loop is merged, so `docs/loop/` is present.

## 0:00–0:20 — Red Kane result

Terminal, full screen, large type.

```bash
clear
echo "CAPTION: Kane, 17:06 UTC. Result 740. No Search tasks field."
sed -n '7,29p' docs/loop/01-red.md
```

Leave the reason on screen: `No Search tasks field exists in the current page snapshot.`

## 0:20–0:45 — The agent reads the report

```bash
clear
echo "CAPTION: The agent reads .satr/last-run.md. It patches app/. The flow stays."
sed -n '42,56p' docs/loop/01-red.md
```

The block on screen is the spec Kane kept and the line that says to patch `app/` and not edit `flows/`.

## 0:45–1:15 — The diff

```bash
clear
echo "CAPTION: Fix commit. Search field added. flows/search-tasks_test.md is not in this diff."
git show 8030a6c --stat
echo
git show 8030a6c -- app/tasks.js | sed -n '1,80p'
```

Point at `searchLabel: "Search tasks"` and `searchLabel: "ابحث عن مهمة"`.

## 1:15–1:55 — Green Kane run

```bash
clear
echo "CAPTION: Same command, 17:10 UTC. Exit 0. Result 100. 93s. English and Arabic passed."
echo 'node bin/satr-verify.js run --serve --flow search-tasks_test.md'
echo
sed -n '7,39p' docs/loop/02-green.md
```

Then open the green share page in the browser and leave it up for the rest of this shot:

https://test-manager.lambdatest.com/projects/01M7DEFKES5QP35A9974V05XNA/test-cases/01M7DGGB8BBTAN52NPC358Z4RN/dashboard/share/US_JB7RTH13S339IYK93EG4IZZ8I1XQR1K2Y6FJCVCDYQHA9RRVD8Y4MYYI4PXCC0K9?type=summary&agentView=true&fqdn=summary-page

The red share page, if you have a second tab ready and a spare second:

https://test-manager.lambdatest.com/projects/01M7DEFKES5QP35A9974V05XNA/test-cases/01M7DGB5AXB13QPW2TSZTZKGBQ/dashboard/share/US_A4WXV0FGC8AWAGA1VC41DXDTWR9TFWDWVMLUOB21MS3T1ELPO7VRNTGC9A0H0ENC?type=summary&agentView=true&fqdn=summary-page

## 1:55–2:45 — Live site, Arabic

In a second terminal, before this shot if you want the server already up:

```bash
node bin/satr-verify.js serve
```

Browser: https://barood-labs.github.io/satr-verify/ if that deploy already has the search field. If the Pages copy is still the older build, use http://127.0.0.1:4173/ from the command above.

1. Click **العربية**.
2. Click the field labeled **ابحث عن مهمة**.
3. Type `عيادة`.
4. Leave the screen on **إيجاد عيادة منخفضة التكلفة**. **فتح حساب بنكي** is gone. The margin is on the right.

Caption, typed in the terminal you are not filming, or as a browser bookmark title you do not need to show: `Arabic. Search عيادة. The clinic stays. The bank account is gone.`

Stop the recording at 2:45. Do not add a fixture run after this.
