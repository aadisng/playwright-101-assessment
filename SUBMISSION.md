# Assessment execution evidence

Verified on October 31, 2026.

- TypeScript: passed.
- Local live playground: 6/6 passed (Chromium and Firefox).
- TestMu AI cloud: 6/6 passed in 2.5 minutes with two concurrent workers.
- Cloud combinations: Chrome latest / Windows 10 and Firefox latest / macOS Sonoma.
- Network, video, command screenshots, and console logging enabled for every cloud session.

| Scenario | Browser / OS | Result | TestMu session ID |
| --- | --- | --- | --- |
| Scenario 1 | Chrome / Windows 10 | passed | `DA-WIN-3408841-1793434268736517559IHE` |
| Scenario 2 | Chrome / Windows 10 | passed | `DA-WIN-3408841-1793434296662347652SRY` |
| Scenario 3 | Chrome / Windows 10 | passed | `DA-WIN-3408841-1793434331616538559SQD` |
| Scenario 1 | Firefox / macOS Sonoma | passed | `DA-MAC-3408841-1793434268743337538MUT` |
| Scenario 2 | Firefox / macOS Sonoma | passed | `DA-MAC-3408841-1793434321433157417XSE` |
| Scenario 3 | Firefox / macOS Sonoma | passed | `DA-MAC-3408841-1793434366564876103JLD` |

Open `playwright-report/index.html` for the report, screenshots, console logs, HAR files, and traces. Cloud videos and command screenshots are in the TestMu Automation Dashboard under build `Playwright 101 Assessment - 2026-10-31`.

The current form reports native English validation as `Please fill out this field.`; the test checks this actual browser message and confirms the invalid submission is blocked. See README.md for the assessment wording difference.

GitHub repository (public): https://github.com/aadisng/playwright-101-assessment

Submit the final repository URL and the six session IDs above in the exam portal.
